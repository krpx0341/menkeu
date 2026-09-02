#!/bin/bash
# Deploy Menkeu to Vercel: set env vars from .env.local, then deploy --prod.
# Usage: VERCEL_TOKEN=... bash scripts/vercel-deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

TOKEN="${VERCEL_TOKEN:?VERCEL_TOKEN not set}"
export VERCEL_TOKEN="$TOKEN"

# Runtime env the app needs (skip VERCEL_OIDC_TOKEN and blank values).
# NOTE: no AI/OCR env vars — those live in app_settings via the Settings page.
KEYS=(SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY APP_PASSWORD SESSION_SECRET TELEGRAM_WEBHOOK_SECRET)

echo "== Linking project =="
npx --yes vercel@latest link --yes --token "$TOKEN" >/dev/null 2>&1 || true

echo "== Setting env vars (production) =="
while IFS= read -r line; do
  key="${line%%=*}"
  val="${line#*=}"
  case "$key" in
    SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|APP_PASSWORD|SESSION_SECRET|TELEGRAM_WEBHOOK_SECRET)
      if [ -n "$val" ]; then
        printf '%s' "$val" | npx --yes vercel@latest env add "$key" production --token "$TOKEN" --force >/dev/null
        echo "  set $key"
      fi
      ;;
  esac
done < .env.local

echo "== Deploying to production =="
npx --yes vercel@latest --prod --yes --token "$TOKEN"
