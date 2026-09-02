-- Singleton Telegram bot settings, same pattern as app_settings (0007). Lets
-- the Settings page own the bot token and the paired chat id — the webhook
-- itself is registered server-side (saveTelegramSettings) against the
-- deployment's own base URL, so no env vars are needed at all.
create table if not exists public.telegram_settings (
  id boolean primary key default true check (id),
  bot_token text,
  chat_id text,
  webhook_url text,
  webhook_secret text,
  updated_at timestamptz not null default now()
);

alter table public.telegram_settings enable row level security;
-- No policies added on purpose: service role bypasses RLS; anon/authenticated get zero access.
