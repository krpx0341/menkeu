-- Receipts previously lived in a public bucket at predictable paths
-- (chatId/messageId.ext), so anyone who guessed/leaked a URL could view a
-- personal receipt photo with no auth. Switch to a private bucket; the app
-- now generates short-lived signed URLs on render instead of storing a
-- permanent public one. No real data exists yet, so the column is renamed
-- to reflect that it now holds a storage object path, not a URL.
update storage.buckets set public = false where id = 'receipts';

alter table public.transactions rename column receipt_url to receipt_path;
