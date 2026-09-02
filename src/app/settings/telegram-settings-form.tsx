"use client";

import { useEffect, useRef, useState, useTransition, useActionState } from "react";
import { Send, Bot } from "lucide-react";
import {
  saveTelegramSettings,
  registerTelegramWebhook,
  testTelegramBot,
  sendTelegramTestMessage,
  clearTelegramSettings,
} from "./actions";

export function TelegramSettingsForm({
  hasToken,
  chatId,
  webhookUrl,
}: {
  hasToken: boolean;
  chatId: string;
  webhookUrl: string;
}) {
  const [editing, setEditing] = useState(!hasToken);
  const [clearing, startClearTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [testSent, startTestSendTransition] = useTransition();

  const [saveError, saveAction, savePending] = useActionState(saveTelegramSettings, undefined);
  const [webhookError, webhookAction, webhookPending] = useActionState(registerTelegramWebhook, undefined);
  const [testError, testAction, testPending] = useActionState(testTelegramBot, undefined);

  // Collapse back to the masked view once a save completes without error.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !savePending && !saveError) setEditing(false);
    wasPending.current = savePending;
  }, [savePending, saveError]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Bot size={16} className="text-blue-600" /> Telegram Bot
        </h2>
        <span className="text-xs text-slate-400">
          {hasToken ? (
            <span className="text-emerald-600">Terhubung</span>
          ) : (
            <span className="text-slate-400">Belum diatur</span>
          )}
        </span>
      </div>

      {!editing ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div>
              <p className="text-sm text-slate-700">Bot token tersimpan</p>
              <p className="text-xs text-slate-400">•••••••••••••••• · chat id: {chatId}</p>
              {webhookUrl ? (
                <p className="mt-1 text-xs text-slate-400">webhook: {webhookUrl}</p>
              ) : (
                <p className="mt-1 text-xs text-amber-600">webhook belum dipasang</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
              >
                Ubah
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={() => {
                  if (confirm("Hapus pengaturan bot Telegram? Webhook juga ikut dilepas.")) {
                    startClearTransition(() => clearTelegramSettings());
                  }
                }}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {!webhookUrl && (
              <form action={webhookAction} className="flex flex-1 items-center gap-2">
                <input
                  name="base_url"
                  type="url"
                  required
                  placeholder="https://menkeu.vercel.app"
                  defaultValue="https://menkeu.vercel.app"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={webhookPending}
                  className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {webhookPending ? "Memasang..." : "Pasang webhook"}
                </button>
              </form>
            )}
            <button
              type="button"
              disabled={testSent}
              onClick={() => {
                setSent(false);
                startTestSendTransition(async () => {
                  try {
                    await sendTelegramTestMessage();
                    setSent(true);
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Gagal kirim pesan tes.");
                  }
                });
              }}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Send size={14} /> {testSent ? "Mengirim..." : "Kirim pesan tes"}
            </button>
          </div>
          {webhookError && <p className="text-sm text-red-600">{webhookError}</p>}
          {sent && <p className="text-sm text-emerald-600">Pesan tes terkirim ke chat id {chatId}.</p>}
        </div>
      ) : (
        <form action={saveAction} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Bot Token (dari @BotFather)</label>
            <input
              name="bot_token"
              type="password"
              required
              placeholder="123456:ABC-DEF..."
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Chat ID (angka)</label>
            <input
              name="chat_id"
              inputMode="numeric"
              required
              placeholder="123456789"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">
              URL aplikasi (https://…, opsional — untuk pasang webhook otomatis)
            </label>
            <input
              name="base_url"
              type="url"
              placeholder="https://menkeu.example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <div className="mt-1 flex items-center justify-between gap-2">
            <button
              type="submit"
              formAction={testAction}
              formNoValidate
              disabled={testPending}
              className="text-xs font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              {testPending ? "Mengecek..." : "Tes koneksi dulu"}
            </button>
            {testError && <span className="text-xs text-red-600">{testError}</span>}
            <div className="flex gap-2">
              {hasToken && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={savePending}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
              >
                {savePending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </form>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Token dan chat id disimpan di database aplikasimu sendiri. Webhook dipasang ke URL aplikasi yang kamu isi
        (butuh https://). Cara cari chat id: kirim pesan apa saja ke bot dulu, lalu lihat di @userinfobot.
      </p>
    </section>
  );
}
