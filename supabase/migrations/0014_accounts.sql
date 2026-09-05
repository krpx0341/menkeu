-- Net worth tracking: manual-balance accounts (cash/bank/e-wallet/investment)
-- and debts, so the app can show stock (what you own vs owe), not just flow.
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('cash', 'bank', 'ewallet', 'investment', 'other')),
  balance numeric(14,2) not null default 0,
  is_debt boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
-- No policies added on purpose: service role bypasses RLS; anon/authenticated get zero access.
