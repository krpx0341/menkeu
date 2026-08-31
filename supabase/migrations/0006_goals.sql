-- Milestone goals: savings targets with progress tracking. A goal's
-- current_amount is bookkeeping only (money the user has earmarked toward
-- it) — it does not move money between transactions/budgets, matching how
-- the feature is meant to work (allocation, not spend/income).
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  image_url text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  deadline date,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_archived_idx on public.goals (is_archived);

alter table public.goals enable row level security;
-- No policies added on purpose: service role bypasses RLS; anon/authenticated get zero access.
