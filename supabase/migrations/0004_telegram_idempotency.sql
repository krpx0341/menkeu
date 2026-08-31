-- Telegram redelivers webhook updates on timeout/non-2xx response. Without a
-- uniqueness guarantee on telegram_message_id, a redelivered update inserts a
-- second transaction row for the same message. This constraint lets the
-- webhook handler upsert with ignoreDuplicates instead of blindly inserting.
create unique index if not exists transactions_telegram_message_id_key
  on public.transactions (telegram_message_id)
  where telegram_message_id is not null;
