-- Debt terms: interest rate and minimum payment so debt accounts can be
-- ranked by payoff priority (avalanche method) instead of being a flat
-- balance indistinguishable from any other liability.
alter table public.accounts
  add column if not exists interest_rate numeric(5,2) check (interest_rate >= 0),
  add column if not exists min_payment numeric(14,2) check (min_payment >= 0);
