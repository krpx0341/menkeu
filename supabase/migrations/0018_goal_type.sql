-- Differentiates essential goals (emergency fund) from discretionary wants so
-- they can be weighted/sorted/displayed differently instead of looking
-- identical regardless of how critical they are to financial health.
alter table public.goals
  add column if not exists goal_type text not null default 'discretionary'
    check (goal_type in ('emergency_fund', 'discretionary'));
