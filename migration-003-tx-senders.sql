-- ════════════════════════════════════════════════════════════════════
-- migration-003: tx_senders — permanent cache of transaction → sender.
-- pull-lib.mjs reads and writes this table. Run after migration-002.
-- Service-role only: RLS on, no public policy.
-- ════════════════════════════════════════════════════════════════════
create table if not exists tx_senders (
  tx_hash text primary key,
  sender  text not null
);
alter table tx_senders enable row level security;
