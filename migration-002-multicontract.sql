-- ════════════════════════════════════════════════════════════════════
-- Migration 002 — multi-contract games + Dojo world tracking
-- ════════════════════════════════════════════════════════════════════
-- Why: the original schema assumed one contract per game. Real Starknet
-- games have many. Eternum alone exposes 21 mainnet contracts covering
-- troops, market, AMM, guilds and season passes. Counting one of them
-- would undercount the game; counting all of them without labels means
-- treasury and gameplay activity get summed together.
-- ════════════════════════════════════════════════════════════════════

-- ── games: contract moves out, Dojo identity moves in ───────────────
alter table games alter column contract_address drop not null;
alter table games add column if not exists world_address      text;   -- Dojo world
alter table games add column if not exists namespace          text;   -- Dojo namespace
alter table games add column if not exists torii_url          text;   -- public Torii, if any
alter table games add column if not exists category_confirmed boolean not null default false;
alter table games add column if not exists source_of_truth    text default 'cartridge-presets';
alter table games add column if not exists chain              text not null default 'SN_MAIN';

-- category may be unknown. NULL means "not classified yet", and the
-- dashboard renders it as Unclassified rather than guessing a genre.
alter table games alter column category drop not null;
alter table games alter column category drop default;

-- ── one row per contract, each labelled and individually countable ──
create table if not exists game_contracts (
  id                      bigserial primary key,
  game_slug               text not null references games(slug) on delete cascade,
  address                 text not null,
  label                   text,            -- e.g. 'Troop battle contract'
  counts_toward_activity  boolean not null default true,
  is_shared_infra         boolean not null default false,
  added_at                timestamptz not null default now(),
  unique (game_slug, address)
);
create index if not exists gc_addr_idx on game_contracts(address);

-- ── shared infrastructure must never be attributed to one game ──────
-- Cartridge's VRF provider appears in 13 of the 28 registered games. If
-- it were counted per game, every game using randomness would inherit
-- every other game's callers.
create table if not exists shared_contracts (
  address text primary key,
  label   text not null,
  reason  text
);
insert into shared_contracts (address, label, reason) values
  ('0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f',
   'Cartridge VRF Provider',
   'Shared randomness provider used by 13+ games; callers are not attributable to any one title.')
on conflict (address) do nothing;

-- Any contract in shared_contracts is excluded from per-game counting.
create or replace function sync_shared_infra() returns void language sql as $$
  update game_contracts gc
     set is_shared_infra = true, counts_toward_activity = false
   from shared_contracts sc
  where lower(gc.address) = lower(sc.address);
$$;

-- ── the pull job now reads this view instead of games.contract_address ──
create or replace view countable_contracts as
  select g.slug, g.id as game_id, gc.address, gc.label
    from games g
    join game_contracts gc on gc.game_slug = g.slug
   where g.active
     and gc.counts_toward_activity
     and not gc.is_shared_infra;

-- ── dedupe guard: the same address must not be counted for two games ──
create or replace view contract_collisions as
  select address, count(distinct game_slug) as games,
         array_agg(distinct game_slug) as claimed_by
    from game_contracts
   group by address
  having count(distinct game_slug) > 1;
-- Review this view before every pull. A non-empty result means either a
-- genuinely shared contract (add it to shared_contracts) or a bad import.

select sync_shared_infra();
