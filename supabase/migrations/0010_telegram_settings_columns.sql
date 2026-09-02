-- Fix telegram_settings: add the columns 0008 was supposed to create.
-- (Tabel sudah ada dari 0001_init.sql dengan id/chat_id/updated_at;
--  create table if not exists tidak nambah kolom baru.)
alter table public.telegram_settings
  add column if not exists bot_token text,
  add column if not exists webhook_url text,
  add column if not exists webhook_secret text;

alter table public.telegram_settings enable row level security;
