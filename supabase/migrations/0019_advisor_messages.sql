-- Persists AI Advisor chat history server-side. Previously the conversation
-- lived only in client component state — surviving open/close within a
-- session but gone on reload, so a user couldn't scroll back to confirm
-- what they'd told it. This is a flat log (single-user app, no threads).
create table if not exists public.advisor_messages (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('user', 'model')),
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists advisor_messages_created_at_idx on public.advisor_messages (created_at);

alter table public.advisor_messages enable row level security;
-- No policies added on purpose: service role bypasses RLS; anon/authenticated get zero access.
