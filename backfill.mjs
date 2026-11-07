/**
 * ════════════════════════════════════════════════════════════════════
 * backfill.mjs — one-off historical backfill
 * ════════════════════════════════════════════════════════════════════
 * Walks the games listed below back to their real first on-chain
 * activity and fills in every period between then and now — the same
 * upsert weekly-pull.mjs does, just run in a loop over history instead
 * of once for "today". Reuses pullPeriod() from pull-lib.mjs, so a
 * backfilled period and a freshly-pulled one are produced by the exact
 * same code path — nothing here is a special case that could drift.
 *
 * Excluded by default: ponziland, loot-survivor. Both are high-volume
 * enough (tens of thousands of tx/week) that a full-history backfill of
 * either is a genuinely separate job — run it on its own once you're
 * ready to sit with the rate limit for that long. Edit EXCLUDE below to
 * change the set.
 *
 * ── How it finds "launch" without guessing ─────────────────────────
 * No endpoint here hands you a contract's deployment date, and this
 * deliberately avoids assuming one from Starkscan's event ordering
 * (undocumented, and wrong if assumed wrong). Instead, for each
 * contract:
 *   1. hasActivityInRange(address, 0, block) is a 1-item existence
 *      check — costs one request no matter how much history is in that
 *      range — so binary-searching it over the block space finds the
 *      contract's first-ever activity block in ~20 requests, not one
 *      request per page of its whole history.
 *   2. That block number is converted back to an approximate date by
 *      binary-searching blockAtTimestamp() — the exact function
 *      weekly-pull.mjs already relies on — instead of guessing a new,
 *      unverified block→timestamp endpoint.
 * The earliest date found across every included game becomes the
 * global start. Some games will show real, honest 0-tx periods before
 * their own launch — that's correct, not a bug: the contract genuinely
 * had no activity yet, and 0 is what actually happened.
 *
 * ── Resumability ────────────────────────────────────────────────────
 * Before pulling a period, it's skipped if every included game already
 * has a captured (non-NULL, non-"failed") row for it. Safe to Ctrl-C
 * and re-run — it picks up roughly where it left off instead of
 * re-spending the rate limit on periods already done.
 *
 * Run:  node backfill.mjs
 *       node backfill.mjs --budget=500     (cap new sender lookups per
 *                                            period — default: no cap,
 *                                            since a historical period
 *                                            never gets a second chance
 *                                            to finish resolving)
 *       node backfill.mjs --year=2026      (only backfill weeks within
 *                                            that calendar year — the
 *                                            per-game real launch date
 *                                            is still what's used for
 *                                            any game that launched
 *                                            *after* Jan 1 of that year;
 *                                            this only raises the floor,
 *                                            never lowers it below a
 *                                            game's real start)
 *       node backfill.mjs --budget=500 --year=2026   (combine both)
 *       node backfill.mjs --closed-only      (stop at the last finished week; use for scheduled runs)
 *
 * This is a manual, local run — it is NOT wired into GitHub Actions.
 * It can take a while (rate-limited to ~1 Starkscan request/second);
 * let it run, don't parallelize it against the same API key.
 */

import fs from "node:fs";
import {
  sb, blockAtTimestamp, hasActivityInRange, mondayOf, addDays, iso, pullPeriod
} from "./pull-lib.mjs";

// Nothing is excluded by default. Optional flags:
//   --exclude=ponziland,loot-survivor   skip these games this run
//   --only=ponziland,loot-survivor      run ONLY these games (handy for doing the heavy ones as a separate pass)
const listArg = name => { const a = process.argv.find(x => x.startsWith(`--${name}=`)); return a ? a.split("=")[1].split(",").map(x => x.trim()).filter(Boolean) : []; };
const EXCLUDE = new Set(listArg("exclude"));
const ONLY = new Set(listArg("only"));

const budgetArg = process.argv.find(a => a.startsWith("--budget="));
const LOOKUP_BUDGET = budgetArg ? Number(budgetArg.split("=")[1]) : Infinity;

// --closed-only: stop at the last COMPLETED Monday–Sunday period. Use this for any scheduled run,
// so the in-progress week is never written to-date (the weekly job finalizes it once it closes).
const CLOSED_ONLY = process.argv.includes("--closed-only");

const yearArg = process.argv.find(a => a.startsWith("--year="));
const YEAR_FILTER = yearArg ? Number(yearArg.split("=")[1]) : null;

// Start-date cache: finding a game's launch costs ~35 Starkscan requests
// (~40s at 1 req/s). A found launch date never changes, so it's kept in a
// local file and reused on every rerun. Failures and "no activity yet"
// are never cached — those can change.
const CACHE_FILE = new URL("./.backfill-cache.json", import.meta.url);
const cache = (() => { try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); } catch { return {}; } })();
const saveCache = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

// Anchor for the block→date binary search. Starknet mainnet genesis —
// safely before anything this dashboard tracks. Not itself queried for
// activity, just the far end of the search window.
const CHAIN_ANCHOR_MS = Date.parse("2021-11-01T00:00:00Z");

/** Binary-search a contract's first-ever activity block. Null = no activity found at all yet. */
async function firstActivityBlock(address, currentBlock) {
  const hasAny = await hasActivityInRange(address, 0, currentBlock);
  if (hasAny === null) return "failed";
  if (!hasAny) return null;
  let lo = 0, hi = currentBlock;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const has = await hasActivityInRange(address, 0, mid);
    if (has === null) return "failed";
    if (has) hi = mid; else lo = mid + 1;
  }
  return lo;
}

/** Binary-search the approximate date a block landed, using the same
 *  blockAtTimestamp() weekly-pull.mjs already trusts. Converges to
 *  within ~12h — plenty precise for "which Monday". */
async function dateOfBlock(blockNumber) {
  let lo = CHAIN_ANCHOR_MS, hi = Date.now();
  while (hi - lo > 12 * 3600 * 1000) {
    const mid = Math.floor((lo + hi) / 2);
    const b = await blockAtTimestamp(mid, "after");
    if (b === null) { hi = mid; continue; }
    if (b >= blockNumber) hi = mid; else lo = mid;
  }
  return new Date(hi);
}

async function main() {
  console.log(`▶ backfill starting (excluding: ${[...EXCLUDE].join(", ") || "none"}${ONLY.size ? `; only: ${[...ONLY].join(", ")}` : ""})`);
  console.log(`  sender-lookup budget per period: ${LOOKUP_BUDGET === Infinity ? "no cap" : LOOKUP_BUDGET}`);
  if (YEAR_FILTER) console.log(`  restricted to calendar year: ${YEAR_FILTER}`);

  const rows_raw = await sb(
    `game_contracts?select=game_slug,address,games!inner(id,name,active)&counts_toward_activity=eq.true&is_shared_infra=eq.false&games.active=eq.true`
  );
  if (!rows_raw || !rows_raw.length) { console.log("no active game contracts found — nothing to do"); return; }

  const byGame = new Map();
  for (const r of rows_raw) {
    if (EXCLUDE.has(r.game_slug)) continue;
    if (ONLY.size && !ONLY.has(r.game_slug)) continue;
    if (!byGame.has(r.game_slug)) byGame.set(r.game_slug, { name: r.games.name, contracts: [] });
    byGame.get(r.game_slug).contracts.push(r.address);
  }
  if (!byGame.size) { console.log("nothing left to backfill after exclusions"); return; }

  const includedSlugs = new Set(byGame.keys());
  console.log(`  games: ${[...byGame.values()].map(g => g.name).join(", ")}`);

  const currentBlock = await blockAtTimestamp(Date.now(), "before");
  if (currentBlock === null) { console.error("could not resolve current block — aborting"); return; }

  console.log(`\n▶ finding each game's first activity (this part is slow — ~20 requests/contract)`);
  let globalStart = null;
  const failedGames = [];
  for (const [slug, g] of byGame) {
    const cacheKey = `${slug}:${[...g.contracts].sort().join(",")}`;
    if (cache[cacheKey]) {
      const monday = new Date(cache[cacheKey] + "T00:00:00Z");
      console.log(`  ✓ ${g.name}: start week ${cache[cacheKey]} (cached)`);
      if (globalStart === null || monday < globalStart) globalStart = monday;
      continue;
    }
    let gameFirstBlock = null;
    let anyFailed = false;
    for (const addr of g.contracts) {
      const b = await firstActivityBlock(addr, currentBlock);
      if (b === "failed") { console.warn(`  ✗ ${g.name}: lookup failed for a contract — will retry, not treating as empty`); anyFailed = true; continue; }
      if (b === null) continue;               // this contract has no activity at all yet
      if (gameFirstBlock === null || b < gameFirstBlock) gameFirstBlock = b;
    }
    if (gameFirstBlock === null) {
      if (anyFailed) {
        // Every contract either failed or came back empty, and at least one failed —
        // we genuinely don't know this game's start date. Do NOT treat as "no activity";
        // that would silently drop the whole game from this backfill run.
        console.warn(`  ✗ ${g.name}: could not determine start date (contract lookup failures) — excluded from this run, rerun backfill to retry it`);
        failedGames.push(g.name);
      } else {
        console.log(`  – ${g.name}: no on-chain activity found yet — nothing to backfill`);
      }
      continue;
    }
    const date = await dateOfBlock(gameFirstBlock);
    const monday = mondayOf(date);
    console.log(`  ✓ ${g.name}: first activity ~${iso(date)} → starting from week of ${iso(monday)}`);
    cache[cacheKey] = iso(monday); saveCache();
    if (globalStart === null || monday < globalStart) globalStart = monday;
  }

  if (globalStart === null) { console.log("\nno game had any on-chain activity to backfill from"); return; }

  if (YEAR_FILTER) {
    // First Monday on or after Jan 1: weeks are Monday-based, and this never reaches back into the previous year.
    let yearFloor = new Date(Date.UTC(YEAR_FILTER, 0, 1));
    while (yearFloor.getUTCDay() !== 1) yearFloor = addDays(yearFloor, 1);
    if (globalStart < yearFloor) {
      console.log(`  (some launches are before ${YEAR_FILTER} — starting from ${iso(yearFloor)}, the first Monday of ${YEAR_FILTER}, per --year)`);
      globalStart = yearFloor;
    }
  }

  const finalWeek = (() => {
    const natural = CLOSED_ONLY ? addDays(mondayOf(new Date()), -7) : mondayOf(new Date());
    if (!YEAR_FILTER) return natural;
    const yearCeil = mondayOf(new Date(Date.UTC(YEAR_FILTER, 11, 31)));
    return natural < yearCeil ? natural : yearCeil;
  })();
  const totalWeeks = Math.round((finalWeek - globalStart) / (7 * 864e5)) + 1;
  console.log(`\n▶ backfilling ${totalWeeks} period(s), ${iso(globalStart)} → ${iso(finalWeek)}\n`);

  let cursor = globalStart, done = 0, skipped = 0;
  while (cursor <= finalWeek) {
    const week = iso(cursor);
    const already = await sb(
      `weekly_snapshots?select=game_id,tx_count,source,games!inner(slug)&week_start=eq.${week}&games.slug=in.(${[...includedSlugs].join(",")})`
    );
    // Only skip if we already have a fully-captured row for every included game this period.
    // "partial" rows have a real tx_count but their player count is a floor, not final — revisit those.
    if (already && already.length >= includedSlugs.size && already.every(r => r.tx_count !== null && r.source !== "partial")) {
      console.log(`— ${week}: already fully captured, skipping`);
      skipped++;
    } else {
      const isFinalWeek = !CLOSED_ONLY && +cursor === +finalWeek;
      const to = isFinalWeek ? Date.now() : cursor.getTime() + 7 * 864e5;
      const { ok, total } = await pullPeriod(cursor, to, includedSlugs, LOOKUP_BUDGET);
      console.log(`✔ ${week}: ${ok}/${total} games captured`);
      done++;
    }
    cursor = addDays(cursor, 7);
  }

  console.log(`\n▶ done — ${done} period(s) pulled, ${skipped} already up to date.`);
  if (failedGames.length) {
    console.warn(`\n⚠ could not confirm a start date for: ${failedGames.join(", ")} (contract lookups failed — likely a transient Starkscan error).`);
    console.warn(`  These games were still included in every period pulled above, so their real activity should still be captured`);
    console.warn(`  as long as their true launch isn't earlier than ${iso(globalStart)}. Rerun backfill to re-check their exact start dates.`);
  }
}

main().catch(e => { console.error("backfill failed:", e); process.exit(1); });
