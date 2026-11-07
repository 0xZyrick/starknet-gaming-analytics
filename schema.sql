-- ════════════════════════════════════════════════════════════════════
-- Starknet Gaming — Analytics schema (Supabase / Postgres)
-- Run once in the SQL editor. Adding a game = one INSERT, no code.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── 1. Registry ─────────────────────────────────────────────────────
create table if not exists games (
  id               bigserial primary key,
  name             text not null,
  slug             text not null unique,
  contract_address text not null unique,
  category         text not null default 'Other',
  blurb            text,                  -- the human note shown on "biggest mover"
  url              text,
  x_handle         text,
  listed_at        date not null default current_date,
  active           boolean not null default true
);
create index if not exists games_active_idx on games(active);

-- ── 2. Weekly onchain snapshots (one row per game per week) ─────────
-- NULL means "not measured". Never write 0 to mean "unknown".
create table if not exists weekly_snapshots (
  id                 bigserial primary key,
  game_id            bigint not null references games(id) on delete cascade,
  week_start         date not null,               -- Monday 00:00 UTC
  unique_wallets     integer,
  tx_count           integer,
  volume             numeric(38,6),               -- denominated in CONFIG.unit
  offchain_sessions  integer,                     -- from the tracking snippet
  offchain_visits    integer,
  converted_sessions integer,                     -- consented session → onchain tx
  source             text not null default 'starkscan',
  pulled_at          timestamptz not null default now(),
  unique (game_id, week_start)
);
create index if not exists snap_week_idx on weekly_snapshots(week_start);
create index if not exists snap_game_idx on weekly_snapshots(game_id, week_start);

-- ── 3. Weekly reports ───────────────────────────────────────────────
create table if not exists reports (
  id           text primary key,          -- e.g. 'w20'
  week_number  integer not null,
  title        text not null,
  body         text not null,             -- sanitised HTML
  published_at date not null default current_date
);

-- ── 4. Community posts (founder spotlights / devlogs) ───────────────
create table if not exists community_posts (
  id           bigserial primary key,
  author       text not null,
  role         text,
  game         text,
  title        text,
  body         text not null,
  x_handle     text,
  published_at date not null default current_date
);

-- ── 5. Raw off-chain events (written by sg-track.js) ────────────────
-- No IP, no cookie, no user agent string, no full URL.
create table if not exists session_events (
  id              uuid primary key default gen_random_uuid(),
  game_id         bigint references games(id) on delete cascade,
  session_id      text not null,            -- random per visit, never reused
  referrer_domain text,                     -- domain only
  occurred_hour   timestamptz not null,     -- rounded to the hour
  created_at      timestamptz not null default now()
);
create index if not exists ev_game_hour_idx on session_events(game_id, occurred_hour);

-- Consented session → wallet links. Address is hashed, never stored raw.
create table if not exists session_wallet_links (
  session_id   text primary key,
  game_id      bigint references games(id) on delete cascade,
  address_hash text not null,               -- sha256(address + server pepper)
  consent      boolean not null,
  linked_at    timestamptz not null default now()
);

-- ── 6. Row level security: public reads the derived tables only ─────
alter table games              enable row level security;
alter table weekly_snapshots   enable row level security;
alter table reports            enable row level security;
alter table community_posts    enable row level security;
alter table session_events     enable row level security;
alter table session_wallet_links enable row level security;

create policy "public read games"      on games            for select using (active);
create policy "public read snapshots"  on weekly_snapshots for select using (true);
create policy "public read reports"    on reports          for select using (true);
create policy "public read posts"      on community_posts  for select using (true);
-- session_events / links: NO public select policy. Raw events are never readable
-- from the browser; only the aggregated counts in weekly_snapshots are public.

-- ── 7. Aggregate raw events into the weekly snapshot ────────────────
create or replace function roll_up_offchain(target_week date)
returns void language sql security definer as $$
  update weekly_snapshots ws set
    offchain_sessions = agg.sessions,
    offchain_visits   = agg.sessions,
    converted_sessions = agg.converted
  from (
    select e.game_id,
           count(distinct e.session_id) as sessions,
           count(distinct l.session_id) filter (where l.consent) as converted
    from session_events e
    left join session_wallet_links l on l.session_id = e.session_id
    where e.occurred_hour >= target_week
      and e.occurred_hour <  target_week + interval '7 days'
    group by e.game_id
  ) agg
  where ws.game_id = agg.game_id and ws.week_start = target_week;
$$;

-- ── 8. Seed categories reference (kept in the frontend CATS map too) ─
-- Strategy, RPG, Puzzle, Sports, Arcade, Card, Survival, Simulation, Social, Other

-- ── Example: register a game ────────────────────────────────────────
-- insert into games (name, slug, contract_address, category, x_handle, url)
-- values ('Loot Survivor','loot-survivor','0x018108b32cea514a78ef1b0e4a0753e855cdf620bc0565202c02456f618c4dc4',
--         'Survival','LootRealms','https://lootsurvivor.io');
