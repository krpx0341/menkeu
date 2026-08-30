#!/usr/bin/env node
// One-time setup: registers this app's webhook URL with Telegram.
//
// Usage:
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
//     node scripts/set-telegram-webhook.mjs https://yourapp.netlify.app
//
// Run once after each deploy where the URL changes. Reads TELEGRAM_BOT_TOKEN
// and TELEGRAM_WEBHOOK_SECRET from the environment (source your .env first,
// e.g. `set -a; source .env; set +a; node scripts/set-telegram-webhook.mjs ...`).

const baseUrl = process.argv[2];
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!baseUrl || !token || !secret) {
  console.error("Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/set-telegram-webhook.mjs <deployed-base-url>");
  process.exit(1);
}

const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: webhookUrl, secret_token: secret }),
});
const json = await res.json();
console.log(json);
if (!json.ok) process.exit(1);
