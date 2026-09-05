-- Recurring bills: flag a transaction as a template for a repeating cost so
-- the dashboard can project known upcoming bills instead of treating every
-- transaction as one-off.
alter table public.transactions
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurring_interval text
    check (recurring_interval in ('weekly', 'monthly', 'yearly'));
