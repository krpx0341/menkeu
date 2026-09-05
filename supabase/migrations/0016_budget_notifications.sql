-- Tracks whether a Telegram warning has already been sent for a budget
-- crossing the 80%/100% thresholds this month, so the bot nudges once per
-- threshold instead of spamming on every transaction.
alter table public.budgets
  add column if not exists notified_80 boolean not null default false,
  add column if not exists notified_100 boolean not null default false;
