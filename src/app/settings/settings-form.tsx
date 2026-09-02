"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { saveGeminiSettings, clearGeminiApiKey, saveGeminiOcrKey, clearGeminiOcrKey } from "./actions";

export function SettingsForm({
  hasKey,
  hasGeminiOcrKey,
  model,
  provider,
  baseUrl,
}: {
  hasKey: boolean;
  hasGeminiOcrKey: boolean;
  model: string;
  provider: "gemini" | "openai";
  baseUrl: string;
}) {
  const [error, formAction, pending] = useActionState(saveGeminiSettings, undefined);
  const [ocrError, ocrFormAction, ocrPending] = useActionState(saveGeminiOcrKey, undefined);
  const [editing, setEditing] = useState(!hasKey);
  const [ocrEditing, setOcrEditing] = useState(false);
  const [clearing, startClearTransition] = useTransition();

  // Collapse back to the masked view once a save completes without error.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !error) setEditing(false);
    wasPending.current = pending;
  }, [pending, error]);

  const ocrWasPending = useRef(false);
  useEffect(() => {
    if (ocrWasPending.current && !ocrPending && !ocrError) setOcrEditing(false);
    ocrWasPending.current = ocrPending;
  }, [ocrPending, ocrError]);

  return (
    <>
      {/* AI Advisor card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">AI Advisor</h2>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            Dapatkan API key <ExternalLink size={12} />
          </a>
        </div>

        {!editing ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div>
              <p className="text-sm text-slate-700">API key tersimpan</p>
              <p className="text-xs text-slate-400">
                •••••••••••••••• · {provider === "openai" ? "OpenAI-compatible" : "Gemini"} · model: {model}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
              >
                Ganti
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={() => {
                  if (confirm("Hapus API key AI Advisor? Fitur chat AI akan nonaktif sampai kamu isi lagi.")) {
                    startClearTransition(() => clearGeminiApiKey());
                  }
                }}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Provider</label>
              <select
                name="ai_provider"
                defaultValue={provider}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI-compatible (OpenAI, Ollama, vLLM, ...)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">API Key</label>
              <input
                name="gemini_api_key"
                type="password"
                required
                placeholder="AIza... atau sk-..."
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Model</label>
              <input
                name="gemini_model"
                defaultValue={model}
                required
                placeholder="gemini-2.5-flash / gpt-4o / llama3.1:8b"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Base URL (khusus OpenAI-compatible, opsional)
              </label>
              <input
                name="ai_base_url"
                type="url"
                defaultValue={baseUrl}
                placeholder="https://api.openai.com/v1 (kosongkan = default OpenAI)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="mt-1 flex justify-end gap-2">
              {hasKey && (
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
                disabled={pending}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
              >
                {pending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-3 text-xs text-slate-400">
          API key disimpan di database aplikasimu sendiri. Gemini = endpoint Google; OpenAI-compatible = endpoint
          apa pun yang mengikuti format API OpenAI (OpenAI, Ollama, LM Studio, vLLM, ...). Kosongkan Base URL untuk
          memakai endpoint default.
        </p>
      </section>

      {/* Gemini OCR card (separate field) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">OCR Struk (Gemini Vision)</h2>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500"
          >
            Dapatkan API key <ExternalLink size={12} />
          </a>
        </div>

        {!ocrEditing ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div>
              <p className="text-sm text-slate-700">
                {hasGeminiOcrKey ? "API key OCR tersimpan" : "Belum ada API key OCR"}
              </p>
              <p className="text-xs text-slate-400">
                {hasGeminiOcrKey
                  ? "Bot akan membaca nominal dari foto struk otomatis."
                  : "Tanpa key ini, kirim foto struk → bot minta balas nominal manual."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOcrEditing(true)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
              >
                {hasGeminiOcrKey ? "Ganti" : "Isi"}
              </button>
              {hasGeminiOcrKey && (
                <button
                  type="button"
                  disabled={clearing}
                  onClick={() => {
                    if (confirm("Hapus API key OCR? Bot akan minta nominal manual utk foto struk.")) {
                      startClearTransition(() => clearGeminiOcrKey());
                    }
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        ) : (
          <form action={ocrFormAction} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Gemini API Key (Google AI Studio)</label>
              <input
                name="gemini_api_key_real"
                type="password"
                placeholder="AIza... (khusus baca foto struk)"
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            {ocrError && <p className="text-sm text-red-600">{ocrError}</p>}
            <div className="mt-1 flex justify-end gap-2">
              {hasGeminiOcrKey && (
                <button
                  type="button"
                  onClick={() => setOcrEditing(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={ocrPending}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
              >
                {ocrPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-3 text-xs text-slate-400">
          Key ini terpisah dari AI Advisor. Pakai model vision (Gemini 2.5 Flash) untuk membaca nominal dari foto
          struk yang kamu kirim ke bot Telegram.
        </p>
      </section>
    </>
  );
}