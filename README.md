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

3. **Copy `.env.example` to `.env.local`** and fill in:

   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project's Settings → API. The service-role key bypasses RLS by design; never expose it to the browser or commit it.
   - `APP_PASSWORD` — the single password used to log in.
   - `SESSION_SECRET` — a long random string (`openssl rand -hex 32`). Rotating this invalidates all existing sessions.
   - `TELEGRAM_BOT_TOKEN` — from [@BotFather](https://t.me/BotFather).
   - `TELEGRAM_ALLOWED_CHAT_ID` — your Telegram chat id; the bot silently ignores messages from any other chat. Get it by messaging your bot once and checking `https://api.telegram.org/bot<token>/getUpdates`.
   - `TELEGRAM_WEBHOOK_SECRET` — a long random string; must match what you register in step 5.
   - `OCR_API_BASE_URL` / `OCR_API_KEY` / `OCR_MODEL` — optional, an OpenAI-compatible vision endpoint for auto-extracting receipt totals. Leave blank to disable; the bot then asks you to reply with the amount instead.

   The AI Advisor's Gemini API key is **not** an env var — set it from the app's own **Pengaturan** (Settings) page after logging in, at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

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

## Deploying

Deploy like any Next.js app (Vercel or self-hosted Node server both work — `src/proxy.ts` requires the Node.js runtime, which is the default). Set the same env vars from `.env.example` in your hosting provider, then run step 5 above against the production URL.

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` / `pnpm start` — production build / serve
- `pnpm lint` — ESLint
- `pnpm exec vitest run` — unit tests (Telegram message parsing)
