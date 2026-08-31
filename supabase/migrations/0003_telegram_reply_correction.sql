-- Lets the bot match an incoming Telegram reply back to the placeholder
-- transaction it should correct (see /api/telegram/webhook reply handling).
alter table public.transactions
  add column if not exists telegram_confirm_message_id bigint;
