# Menkeu

Personal finance tracker: dashboard with month-over-month comparison, a financial health score and a daily transaction calendar, transactions, budgets, milestone goals, categories, reports, an AI Advisor chat (Gemini — logs transactions from natural language with a preview-before-save step, answers questions grounded in your real data, and reads receipt photos), and a Telegram bot for logging expenses on the go (text or receipt photo).

Stack: Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS v4, Supabase (Postgres + Storage, accessed only via the service-role key from the server), Vitest.

Single-user app: there's no account system, just one shared password gate (`APP_PASSWORD`) via `src/proxy.ts`.

Installable as a PWA (manifest at `src/app/manifest.ts`, service worker at `public/sw.js`) — "Add to Home Screen" on iOS/Android gives it a standalone, full-screen app icon. The service worker only caches this app's own static assets (`/icons/`, `/brand/`); it never caches pages or API responses, so it can't show a stale cached balance while offline.

## Brand

App icon source lives at `public/brand/logo-mark.svg` (regular, rounded corners) and `public/brand/logo-mark-maskable.svg` (full-bleed, for Android adaptive icons — the OS applies its own mask). All shipped icon sizes (`favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png`, `public/icons/*.png`) are rendered from these two SVGs; edit the SVGs and re-render rather than editing a PNG directly:

```bash
rsvg-convert -w 512 -h 512 public/brand/logo-mark.svg -o src/app/icon.png
rsvg-convert -w 180 -h 180 public/brand/logo-mark-maskable.svg -o src/app/apple-icon.png
magick public/brand/logo-mark.svg -define icon:auto-resize=16,32,48,64 src/app/favicon.ico
rsvg-convert -w 192 -h 192 public/brand/logo-mark.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 public/brand/logo-mark.svg -o public/icons/icon-512.png
rsvg-convert -w 192 -h 192 public/brand/logo-mark-maskable.svg -o public/icons/icon-maskable-192.png
rsvg-convert -w 512 -h 512 public/brand/logo-mark-maskable.svg -o public/icons/icon-maskable-512.png
```

Brand color: blue-600 (`#2563eb`), matching the app's UI accent.

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Create a Supabase project** and run the migrations in `supabase/migrations/` in order (via the SQL editor, or `supabase db push` if you use the Supabase CLI):

   - `0001_init.sql` — schema (categories, transactions, budgets, telegram_settings) + seed categories
   - `0002_storage.sql` — `receipts` storage bucket for Telegram receipt photos
   - `0003_telegram_reply_correction.sql` — column used to match a Telegram reply back to the receipt it corrects
   - `0004_telegram_idempotency.sql` — unique index so a redelivered Telegram webhook update can't create a duplicate transaction
   - `0005_private_receipts.sql` — makes the `receipts` bucket private; the app fetches short-lived signed URLs to display receipt photos instead of storing a permanent public link
   - `0006_goals.sql` — `goals` table for the Milestone Goals feature
   - `0007_settings.sql` — singleton `app_settings` table holding the AI Advisor's Gemini API key (set from the app's own Settings page, not an env var)
   - `0008_telegram_settings.sql` — singleton `telegram_settings` table holding the Telegram bot token and chat id (set from the app's own Settings page, not an env var); the webhook URL is registered there too

3. **Copy `.env.example` to `.env.local`** and fill in:

   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project's Settings → API. The service-role key bypasses RLS by design; never expose it to the browser or commit it.
   - `APP_PASSWORD` — the single password used to log in.
   - `SESSION_SECRET` — a long random string (`openssl rand -hex 32`). Rotating this invalidates all existing sessions.
   - `TELEGRAM_BOT_TOKEN` — optional; the Telegram bot token from [@BotFather](https://t.me/BotFather). If set, it is used only as a fallback — the preferred way is entering the token and chat id from the app's **Pengaturan** (Settings) page, which stores them in `telegram_settings` and registers the webhook for you.
   - `TELEGRAM_ALLOWED_CHAT_ID` — your Telegram chat id; the bot silently ignores messages from any other chat. Get it by messaging your bot once and checking `https://api.telegram.org/bot<token>/getUpdates`.
   - `TELEGRAM_WEBHOOK_SECRET` — a long random string; must match what you register in step 5.

   The AI (both the Advisor and receipt-photo OCR) uses **one** API key set from the app's own **Pengaturan** (Settings) page — never an env var. There is no separate OCR env block anymore. **The model must support vision** for receipt OCR to work; a text-only model still handles the Advisor chat but returns nothing for photo receipts, in which case the bot asks you to reply with the amount instead. Set the key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Gemini) or any OpenAI-compatible endpoint via **Pengaturan → AI Advisor**. Same for the Telegram bot token, chat id, and webhook registration — all managed from **Pengaturan → Telegram Bot** (the `TELEGRAM_*` env vars below are optional fallbacks for setups that prefer env config).

4. **Run locally**

   ```bash
   pnpm dev
   ```

5. **Register the Telegram webhook** once you have a deployed (or tunneled) HTTPS URL:

   ```bash
   set -a; source .env.local; set +a
   node scripts/set-telegram-webhook.mjs https://your-deployed-domain.example
   ```

   Re-run this any time the deployed URL changes.

## Security notes

This is a single-user, self-hosted app — the security model assumes one trusted operator, not multi-tenant use. Known limitations if you fork/deploy this:

- **API keys are stored in plaintext** in `app_settings.gemini_api_key` / `gemini_api_key_real` and `telegram_settings.bot_token` (see migrations `0007`, `0008`, `0012`). Anyone with database access (or a SQL injection elsewhere) reads them directly — there's no column-level encryption. Acceptable for a personal instance you alone control; don't reuse this schema as-is for a multi-user product.
- **Login gate is a single shared password** (`APP_PASSWORD`) compared to a session cookie holding `SESSION_SECRET` in plaintext (`src/proxy.ts`), using a plain `!==` string comparison rather than a timing-safe one. There's no rate limiting on `/login`. Fine for a private instance behind your own domain; not meant to withstand a targeted attack.
- **`SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security by design** (see `src/lib/supabase/server.ts`) — the migrations enable RLS but add no policies, since the service-role key is the only credential ever used. Never expose this key to the browser, and never add a client-side Supabase call using it.
- **Telegram webhook auth** relies on `TELEGRAM_WEBHOOK_SECRET` matching Telegram's `secret_token` header; rotate it (and re-run `scripts/set-telegram-webhook.mjs`) if you suspect it leaked.
- No secrets are committed to this repo — `.env.local`, `.vercel/`, and `supabase/.temp/` are gitignored, and `.env.example` only ships blank placeholders. If you fork this, double-check your own `.env.local` never gets committed.

## Deploying

Deploy like any Next.js app (Vercel or self-hosted Node server both work — `src/proxy.ts` requires the Node.js runtime, which is the default). Set the same env vars from `.env.example` in your hosting provider, then run step 5 above against the production URL.

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — ESLint
- `pnpm exec vitest run` — unit tests (Telegram message parsing)
