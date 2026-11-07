# Starknet Gaming — Analytics

The analytics wing of [starknet-gaming.com](https://starknet-gaming.com/), built to sit at
`/analytics`. It reuses the parent site's tokens — `#11100d` background, `#9d4dff` purple,
dark-only — so it reads as part of the same site, not a separate product.

The homepage is deliberately simple: **Players this week**, **Games tracked**, **Trending
genre**, one chart, one leaderboard. No token amounts up front. Click into any game, or the
Analytics tab, for volume, transactions, and full history — that depth is still there, just
one click deeper instead of on the first screen.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole dashboard. Self-contained, no build step, no dependencies. Drop at `/analytics/index.html`. |
| `schema.sql` | Base Supabase/Postgres schema. Run once, first. |
| `migration-002-multicontract.sql` | Adds support for games with several contracts (most real games have more than one). Run once, right after `schema.sql`. |
| `registry-seed-final.sql` | The 10 real games from starknet-gaming.com's own registry, with their actual mainnet contracts. Run once, after the migration. |
| `pull-lib.mjs` | Shared logic — Starkscan client, Supabase client, and `pullPeriod()`, the routine that turns one Monday-to-Sunday period into upserted rows. Both scripts below call this; neither talks to Starkscan/Supabase directly. |
| `weekly-pull.mjs` | Thin CLI: pulls real onchain numbers from Starkscan (falls back to Voyager) for one period. Runs **weekly** — see below. |
| `backfill.mjs` | One-off, run-it-yourself script. Walks a set of games back to their real first on-chain activity and fills in every period since, using the same `pullPeriod()` as the scheduled job. See the comment block at the top of the file for how it finds "launch" without guessing, and which games are excluded by default. |
| `.github/workflows/pull.yml` | Runs `weekly-pull.mjs` automatically once a week via GitHub Actions, right after each period closes. Free, no server needed. |
| `sg-track.js` | The embeddable snippet builders can add to their game's website, plus the receiving endpoint (commented at the bottom). Optional — only needed for the Retention page. |
| `rpc-check.mjs` | Checks an RPC provider for batched sender lookups before you rely on it. |
| `discover.mjs` | The script that found the registry in the first place. Re-run it later to find newly-launched games. |
| `manual-tracking-notes.md` | The games on starknet-gaming.com that need manual follow-up (no public contract data found yet), grouped by how much effort each needs. |

## Going live — in order

1. **Database.** In the Supabase SQL editor, run in this exact order:
   `schema.sql` → `migration-002-multicontract.sql` → `registry-seed-final.sql` → `migration-003-tx-senders.sql`.
2. **Connect the frontend.** Already done if you're using the version from this zip — the
   `CONFIG` block near the top of `index.html`'s `<script>` has the Supabase URL and anon key
   filled in. (The anon key is safe here: RLS grants public `select` on four display tables
   only. Raw session events are never readable from the browser.)
3. **Get the pull job running weekly.**
   - Push this whole folder to a GitHub repo.
   - Repo → **Settings → Secrets and variables → Actions**, add: `SUPABASE_URL`,
     `SUPABASE_SERVICE_KEY` (the *service_role* key — different from the anon key, and never
     put this one in `index.html`), `STARKSCAN_API_KEY`. `VOYAGER_API_KEY` is optional.
   - Repo → **Actions** tab → run "Weekly onchain data pull" once by hand to confirm it works.
     After that it runs itself every Monday at 03:10 UTC.
4. **Backfill history**, once — run `node backfill.mjs` locally (see the comment block at the
   top of that file). It's a manual, one-off job, not wired into the Action.
5. **Host the tracking snippet**, only if/when you want the Retention page populated — serve
   `sg-track.js` from `starknet-gaming.com/sg-track.js` and deploy the endpoint block
   commented at the bottom of that file to `/api/track`.

## Faster sender lookups (optional): Starknet RPC

Player counts need each transaction's sender. By default that is one throttled Starkscan
request per transaction. Set `STARKNET_RPC_URL` (a Starknet JSON-RPC endpoint from any provider)
and `pull-lib.mjs` resolves them in batches instead; anything the RPC can't answer falls back to
Starkscan. Run `node rpc-check.mjs` first to confirm the provider accepts batches and to find its
batch limit, then set `STARKNET_RPC_BATCH` (default 50). Add `STARKNET_RPC_URL` as a GitHub Actions
secret too if you want the weekly job to use it. Addresses are normalised so RPC and Starkscan
results never double-count a wallet.

## How the pull works

`weekly-pull.mjs` runs once a week, right after a period closes, and finalizes that period —
`node weekly-pull.mjs` with no argument pulls the current period to-date; the scheduled Action
always passes the just-closed Monday explicitly so what lands is a finished period, not a
partial one. A specific period can still be pulled or refreshed by hand:
`node weekly-pull.mjs 2026-09-07`. `backfill.mjs` uses the same underlying routine
(`pullPeriod()` in `pull-lib.mjs`) in a loop over history instead of once for "now" — see that
file's own header for how it finds each game's real launch date and which games it skips by
default.

**Inactive games auto-reactivate.** Before the main pull, the job runs a cheap probe
(`reactivateIfActive` in `pull-lib.mjs`): one existence check per contract on every game with
`active = false`. If any contract has a transaction in the period, that game is set back to
`active = true` and is included in the same pull. No manual SQL needed to bring a quiet title
back — activity on-chain is enough. To *stop* tracking a dead game, set `active = false` in
Supabase (dashboard and weekly pull both respect that flag via RLS / the active filter).

The dashboard's own copy never says "week" or "daily" anywhere — periods are just "updates" to
anyone reading the site. The Monday-to-Sunday boundary is an internal implementation detail
(and is disclosed honestly on the About page), not something the UI narrates.

## Adding a game

One row, no code:

```sql
insert into games (name, slug, category, url, category_confirmed) values
  ('Loot Survivor', 'loot-survivor', 'Roguelike / Dungeon', 'https://www.deathmountain.gg/', true);

insert into game_contracts (game_slug, address, label, counts_toward_activity) values
  ('loot-survivor', '0x0181…4dc4', 'Combat contract', true);
```

The registry page, detail page, charts, leaderboard, and category share all pick it up on the
next load. New genres go in the `CATS` map near the top of `index.html`'s script — a name and
a colour, one line.

## The rules this build enforces

Structural, not stylistic — wired into the code so they hold even as the dashboard grows.

- **Nothing is invented.** Every metric shows `No data yet` when the value is `null`. A failed
  pull writes `NULL`, never `0` and never last week's number carried forward.
- **Players and volume are never blended.** Two separate leaderboards, ranked independently —
  a single composite score would hide which one actually moved.
- **Reach and onchain are never merged.** A game's page visits and its onchain wallet count sit
  side by side, labelled, never summed into one figure.
- **Conversion needs consent.** `sg-track.js`'s `linkWallet()` drops client-side without
  `consent: true`, and the server returns 403 without it. Addresses are hashed with a server
  pepper before storage — the raw address is never written.
- **No sample data, ever.** There's no preview/demo mode. If a number isn't real, the dashboard
  says so instead of showing something plausible-looking.
- **Provenance is always on screen.** The header pill shows the data source and last-updated
  time on every page, and turns amber if the last pull is more than 9 days old.

## Known limits (also stated on the About page)

A unique wallet isn't a unique person — session keys and multi-wallet play inflate counts.
Volume depends on contract structure, so a game that batches calls looks smaller than one that
doesn't. Games with several contracts only count the ones registered here. Week boundaries are
UTC Monday.

