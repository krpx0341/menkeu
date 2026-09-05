-- Widen transactions.source to distinguish AI Advisor chat confirmations
-- from plain web-form entries, so the transaction list can tag them.
alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions
  add constraint transactions_source_check check (source in ('web', 'telegram', 'advisor'));
