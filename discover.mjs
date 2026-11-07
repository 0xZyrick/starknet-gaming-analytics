/**
 * ════════════════════════════════════════════════════════════════════
 * discover.mjs — Tier 1 game discovery. Zero team contact required.
 * ════════════════════════════════════════════════════════════════════
 * Two independent sources, merged:
 *
 *   A. cartridge-gg/presets  — public GitHub repo. Every verified game
 *      ships a config.json whose SN_MAIN policy block lists its mainnet
 *      contract addresses with human labels. This is what produced the
 *      current registry seed. Works with zero API keys.
 *
 *   B. The Arcade Registry — an onchain Dojo world where games register
 *      themselves. Each Edition carries world_address + namespace, which
 *      is exactly what you need to spin up a Torii per game. This is the
 *      canonical list and it updates itself as games register.
 *
 * Run:  node discover.mjs            → writes candidates.json + seed.sql
 *       node discover.mjs --presets  → source A only (no network to Starknet)
 *
 * Nothing here is written to the live DB. Output is a candidate file for
 * review, because auto-inserting a mislabelled contract would silently
 * corrupt weeks of history.
 */

import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/* ── Known-good constants, extracted from cartridge-gg/arcade @ main ── */
const ARCADE = {
  world:    "0x07a079295990e43441a7389fdc3b9ba063c6cd6aee16fb846f598c42a9f04ff7",
  registry: "0x7ddf3ed9540e1ed47ab3708d920c354b5795c1a420d6ae5593032b39d533881",
  rpc:      "https://api.cartridge.gg/x/starknet/mainnet",
  namespace: "ARCADE",
  // Cartridge hosts a Torii for this world. Confirm the exact slug once,
  // then pin it here. If it moves, fall back to running your own:
  //   torii --world 0x07a0...4ff7 --rpc https://api.cartridge.gg/x/starknet/mainnet
  toriiGraphql: process.env.ARCADE_TORII ?? ""
};

/** Shared infrastructure — never attributed to a single game. */
const SHARED = new Set([
  "0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f" // Cartridge VRF
]);

/** Entries in presets that are platform surfaces, not games. */
const NOT_GAMES = new Set([
  "arcade", "cartridge", "slot", "credit", "budokan",
  "booster-pack-devconnect", "survivor-dao"
]);

/* ═══ SOURCE A — presets repo ════════════════════════════════════════ */
async function fromPresets() {
  const dir = mkdtempSync(join(tmpdir(), "presets-"));
  execSync(
    `curl -sL https://codeload.github.com/cartridge-gg/presets/tar.gz/refs/heads/main | tar xz -C ${dir}`,
    { stdio: "inherit" }
  );
  const base = join(dir, "presets-main", "configs");
  const { readdirSync, readFileSync, existsSync } = await import("node:fs");

  const out = [];
  for (const slug of readdirSync(base)) {
    const p = join(base, slug, "config.json");
    if (!existsSync(p)) continue;

    let cfg;
    try { cfg = JSON.parse(readFileSync(p, "utf8")); } catch { continue; }

    const chains = cfg.chains ?? {};
    const mainnet = chains.SN_MAIN?.policies?.contracts ?? {};
    const addrs = Object.entries(mainnet).map(([address, v]) => ({
      address: address.toLowerCase(),
      label: v?.name ?? null,
      shared: SHARED.has(address.toLowerCase())
    }));

    // Custom chain keys (WP_*) mean the game runs on its own Katana app-chain,
    // not Starknet mainnet. Mainnet explorers cannot see it at all.
    const appChains = Object.keys(chains).filter(k => k.startsWith("WP_"));

    out.push({
      slug,
      name: cfg.theme?.name ?? slug,
      origins: [].concat(cfg.origin ?? []),
      contracts: addrs.filter(a => !a.shared),
      shared_contracts: addrs.filter(a => a.shared),
      app_chains: appChains,
      status:
        NOT_GAMES.has(slug)            ? "not-a-game"
        : addrs.length                 ? "ready"
        : appChains.length             ? "app-chain-not-mainnet"
        : chains.SN_SEPOLIA            ? "testnet-only"
        : "no-mainnet-policies",
      source: "cartridge-presets"
    });
  }
  return out;
}

/* ═══ SOURCE B — onchain Arcade Registry via Torii ═══════════════════ */
async function fromArcadeRegistry() {
  if (!ARCADE.toriiGraphql) {
    console.warn("⚠ ARCADE_TORII not set — skipping onchain registry. " +
                 "Run your own: torii --world " + ARCADE.world);
    return [];
  }
  // Editions carry the world address + namespace per registered game.
  const query = `{
    arcadeEditionModels(limit: 500) {
      edges { node { id game_id world_address namespace name published whitelisted } }
    }
    arcadeGameModels(limit: 500) {
      edges { node { id name description external_url socials published } }
    }
  }`;
  const r = await fetch(ARCADE.toriiGraphql, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query })
  });
  if (!r.ok) { console.warn("⚠ Torii query failed:", r.status); return []; }
  const j = await r.json();

  const games = new Map(
    (j.data?.arcadeGameModels?.edges ?? []).map(e => [e.node.id, e.node])
  );
  return (j.data?.arcadeEditionModels?.edges ?? [])
    .map(e => e.node)
    .filter(n => n.published)
    .map(n => ({
      slug: slugify(games.get(n.game_id)?.name ?? n.name ?? n.id),
      name: games.get(n.game_id)?.name ?? n.name,
      world_address: n.world_address,
      namespace: n.namespace,
      url: games.get(n.game_id)?.external_url ?? null,
      contracts: [],                       // resolved later from the world's Torii
      status: "ready-world",
      source: "arcade-registry-onchain"
    }));
}

const slugify = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ═══ MERGE + EMIT ══════════════════════════════════════════════════ */
function toSql(rows) {
  const q = s => s === null || s === undefined ? "NULL" : `'${String(s).replace(/'/g, "''")}'`;
  const lines = [
    `-- generated by discover.mjs on ${new Date().toISOString().slice(0, 10)}`,
    `-- review before running. category is left NULL where unknown.`, ""
  ];
  for (const r of rows.filter(x => x.status === "ready" || x.status === "ready-world")) {
    lines.push(
      `insert into games (name, slug, category, url, world_address, namespace, category_confirmed) values (` +
      `${q(r.name)}, ${q(r.slug)}, NULL, ${q(r.origins?.[0] ?? r.url ?? "")}, ` +
      `${q(r.world_address ?? null)}, ${q(r.namespace ?? null)}, false)` +
      ` on conflict (slug) do nothing;`
    );
    for (const c of r.contracts ?? []) {
      lines.push(
        `  insert into game_contracts (game_slug, address, label) values (` +
        `${q(r.slug)}, ${q(c.address)}, ${q(c.label)}) on conflict do nothing;`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

const onlyPresets = process.argv.includes("--presets");
const [a, b] = await Promise.all([
  fromPresets(),
  onlyPresets ? Promise.resolve([]) : fromArcadeRegistry()
]);

// Presets win on contracts; registry wins on world/namespace. Merge by slug.
const merged = new Map(a.map(r => [r.slug, r]));
for (const r of b) {
  const ex = merged.get(r.slug);
  if (ex) { ex.world_address ??= r.world_address; ex.namespace ??= r.namespace; ex.source += "+arcade"; }
  else merged.set(r.slug, r);
}
const rows = [...merged.values()];

writeFileSync("candidates.json", JSON.stringify(rows, null, 1));
writeFileSync("seed.sql", toSql(rows));

const by = rows.reduce((m, r) => (m[r.status] = (m[r.status] ?? 0) + 1, m), {});
console.table(by);
console.log(`\n→ candidates.json (${rows.length} entries)`);
console.log(`→ seed.sql (${rows.filter(r => r.status.startsWith("ready")).length} insertable)`);
console.log(`\nReview these before inserting:`);
for (const r of rows.filter(r => r.status !== "ready" && r.status !== "not-a-game"))
  console.log(`  ${r.status.padEnd(24)} ${r.slug}`);
