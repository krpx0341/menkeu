-- Storage bucket for receipt photos sent via Telegram
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;
