-- Singleton app settings, same pattern as telegram_settings. Holds the
-- user's own Gemini API key for the AI Advisor feature, entered via the
-- Settings page — never taken from an env var, so each self-hosted instance
-- brings its own key without the operator needing to hold it.
create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  gemini_api_key text,
  gemini_model text not null default 'gemini-2.5-flash',
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
-- No policies added on purpose: service role bypasses RLS; anon/authenticated get zero access.
