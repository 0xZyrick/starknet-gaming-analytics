/**
 * ════════════════════════════════════════════════════════════════════
 * Starknet Gaming — onchain data pull (scheduled)
 * ════════════════════════════════════════════════════════════════════
 * Runs on a real weekly cadence — see .github/workflows/pull.yml. Each
 * run pulls ONE period and upserts one row per game. Player counts
 * (unique wallets) come from resolving each transaction's sender —
 * Starkscan's event log doesn't include that for free, so it's one
 * extra lookup per transaction. Once resolved, a sender is cached
 * forever in `tx_senders`, so only genuinely new transactions ever
 * need resolving again.
 *
 * A busy game's backlog is worked through gradually — LOOKUP_BUDGET
 * below is a fixed spend per run, not per game, so a quiet game gets a
 * complete player count immediately and a big game's count catches up
 * over the next few scheduled runs. Never a guess in between — NULL
 * until it's genuinely resolved.
 *
 * Before the main pull, inactive games are probed cheaply (one existence
 * check per contract). Any that show real activity this period are
 * flipped back to active and then included in the pull — so a game that
 * went quiet and later revived starts tracking again on its own.
 *
 * Design rules this file enforces:
 *   - A failed pull writes NULL, never 0 and never a carried-forward value.
 *   - Re-running is safe (upsert on game_id + week_start).
 *
 * Run: node weekly-pull.mjs            (pulls the current period, to-date)
 *      node weekly-pull.mjs 2026-09-07 (pull/refresh one specific period)
 *
 * Schedule: weekly via GitHub Actions — see .github/workflows/pull.yml
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, STARKSCAN_API_KEY
 */

import { currentWeekMonday, iso, pullPeriod, reactivateIfActive, STARKSCAN_API_KEY } from "./pull-lib.mjs";

const LOOKUP_BUDGET = 1200;   // per run — see header comment

async function main() {
  const arg = process.argv[2];
  const monday = arg ? new Date(arg + "T00:00:00Z") : currentWeekMonday();
  const to = arg ? monday.getTime() + 7 * 864e5 : Date.now();

  console.log(`▶ pulling period ${iso(monday)} (${new Date(monday.getTime()).toISOString()} → ${new Date(to).toISOString()})`);

  if (!STARKSCAN_API_KEY) { console.error("STARKSCAN_API_KEY is not set"); process.exit(1); }

  // Bring back any inactive game that has real activity this period.
  // Cheap: one limit=1 request per contract. Then the main pull includes them.
  console.log(`▶ probing inactive games for activity in ${iso(monday)}`);
  const revived = await reactivateIfActive(monday, to);
  if (revived.length) {
    console.log(`  ↻ reactivated: ${revived.join(", ")}`);
  } else {
    console.log(`  (none reactivated)`);
  }

  const { ok, total } = await pullPeriod(monday, to, null, LOOKUP_BUDGET);
  console.log(`✔ ${iso(monday)}: ${ok}/${total} games captured`);
}

main().catch(e => { console.error("pull failed:", e); process.exit(1); });
