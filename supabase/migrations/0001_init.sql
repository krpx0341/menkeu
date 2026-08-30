-- Menkeu: personal finance tracker schema
-- Single-user app; RLS uses service-role key from server only, so policies stay permissive.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#6366f1',
  icon text not null default 'circle',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric(14,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid references public.categories(id) on delete set null,
  note text,
  occurred_at timestamptz not null default now(),
  source text not null default 'web' check (source in ('web', 'telegram')),
  telegram_message_id bigint,
  receipt_url text,
  raw_input text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_occurred_at_idx on public.transactions (occurred_at desc);
create index if not exists transactions_category_idx on public.transactions (category_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  month date not null, -- first day of month, e.g. 2026-08-01
  amount_limit numeric(14,2) not null check (amount_limit > 0),
  created_at timestamptz not null default now(),
  unique (category_id, month)
);

create table if not exists public.telegram_settings (
  id boolean primary key default true check (id),
  chat_id text,
  updated_at timestamptz not null default now()
);

-- RLS: app talks to Supabase only via server-side service-role key, never the browser.
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.telegram_settings enable row level security;
-- No policies added on purpose: service role bypasses RLS; anon/authenticated get zero access.

insert into public.categories (name, type, color, icon) values
  ('Gaji', 'income', '#22c55e', 'wallet'),
  ('Lainnya (Income)', 'income', '#84cc16', 'plus-circle'),
  ('Makanan', 'expense', '#f97316', 'utensils'),
  ('Transportasi', 'expense', '#3b82f6', 'car'),
  ('Belanja', 'expense', '#ec4899', 'shopping-bag'),
  ('Tagihan', 'expense', '#ef4444', 'receipt'),
  ('Hiburan', 'expense', '#a855f7', 'film'),
  ('Kesehatan', 'expense', '#14b8a6', 'heart-pulse'),
  ('Lainnya (Expense)', 'expense', '#64748b', 'more-horizontal')
on conflict do nothing;
