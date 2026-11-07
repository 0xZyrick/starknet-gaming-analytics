# Games needing manual work

10 of your 21 games are seeded and ready (`registry-seed-final.sql`). These 11 aren't,
because none of them publish a `config.json` in `cartridge-gg/presets` — meaning either
they're not using Cartridge Controller policies, or they're too new to have registered
there yet. Grouped by how hard each actually is.

## Easiest — you likely already have this

**ZAP Football** — this is your own game (referenced earlier as one of the sites whose
visual identity this dashboard matches). You have the contract address already; it just
needs adding to the registry directly. No discovery needed at all.

## Findable without contact — needs a manual GitHub/site check, not a message

These are established, well-known games. Their contract addresses are public somewhere —
GitHub repo, docs site, or their own frontend config — just not in the one repo I scraped.

- **Influence** — long-running game, predates Dojo/Cartridge tooling entirely. Contracts
  are documented on their own site/docs, not in a Dojo manifest.
- **ART/PEACE** — well-known Dojo-based project with its own public GitHub repo
  (`art-peace-sn` org). The manifest is there, just under a different repo than presets.
- **Realms Blitz** — likely shares infrastructure with Eternum (`realms.world`) as a
  faster game mode. Worth checking whether it's a new World or the same one with a
  different namespace — that distinction changes how it's tracked.

**Action for these three:** a 10-minute GitHub search (`org:<name> manifest_mainnet.json`
or checking their docs site) should surface addresses without emailing anyone.

## Needs a light-touch message — small/new teams, no public repo found

These are newer or smaller projects where a manifest likely doesn't exist publicly yet.
This is exactly the Tier 2 case from before: publish their page first with "here's what
we're counting, is this right?" rather than a cold data request.

- **StakeWars** — STRK-delegation based, may not even be a Dojo game (could be a simpler
  custom contract), so worth asking directly what to point at.
- **Corsair**, **Brove Royale**, **StarkOrbs** — small/indie, static sites (e.g. GitHub
  Pages), no visible public repo with a manifest. A quick DM is the fastest path.
- **Axe Arcade** — described as "cross-chain" with NFT trait gating; worth clarifying
  which chain actually holds the gameplay contract before assuming it's Starknet mainnet.

## Structurally harder — flag, don't force

- **Jokers of Neon** — already seeded in the registry (it's a real, live game on your
  site), but it runs on its **own Katana app-chain** (`WP_JOKERS_CORE_SEASON3`), not
  Starknet mainnet. Starkscan/Voyager can't see it at all — it needs its own Torii
  instance pointed at their app-chain RPC, not a contract-address pull. This is a
  different pipeline, not a harder version of the same one.
- **Hidden** — explicitly built around private settlement ("shielded stakes, hidden
  decisions"). This one is worth a direct conversation regardless of technical
  difficulty: the entire point of the game is that its onchain activity isn't meant to
  be legible from outside. Tracking it accurately may require them exposing an
  aggregate count on purpose, since the raw chain data is designed not to tell you.

## Suggested order

1. Add ZAP Football directly — zero effort.
2. Spend 10 minutes checking Influence, ART/PEACE, and Realms Blitz for public repos.
3. Send one message each to StakeWars, Corsair, Brove Royale, StarkOrbs, Axe Arcade —
   same "here's your draft page, is this right?" approach as Tier 2.
4. Talk to Jokers of Neon and Hidden separately — both need a real conversation about
   *how* to track them, not just a request for an address.
