-- 0004 created a partial unique index on telegram_message_id:
--   create unique index ... where telegram_message_id is not null;
-- But the webhook handler upserts with onConflict: "telegram_message_id",
-- which emits ON CONFLICT (telegram_message_id). Postgres refuses that (42P10)
-- because the matching index is partial. Replace it with a full unique index.
-- Safe on PG15+: NULLS DISTINCT is the default, so many NULL rows coexist.
drop index if exists transactions_telegram_message_id_key;
create unique index transactions_telegram_message_id_key
  on public.transactions (telegram_message_id);
