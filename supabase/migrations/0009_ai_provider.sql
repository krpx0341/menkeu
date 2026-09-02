-- AI Advisor provider support: the API key column is shared, the provider
-- switches between Gemini (default) and any OpenAI-compatible endpoint
-- (OpenAI, Ollama, LM Studio, vLLM, ...). Empty base_url => the provider's
-- default endpoint (https://api.openai.com/v1). Model column is shared too.
alter table public.app_settings
  add column if not exists ai_provider text not null default 'gemini'
    check (ai_provider in ('gemini', 'openai')),
  add column if not exists ai_base_url text;
