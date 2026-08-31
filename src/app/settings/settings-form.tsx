"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { saveGeminiSettings, clearGeminiApiKey } from "./actions";

export function SettingsForm({ hasKey, model }: { hasKey: boolean; model: string }) {
  const [error, formAction, pending] = useActionState(saveGeminiSettings, undefined);
  const [editing, setEditing] = useState(!hasKey);
  const [clearing, startClearTransition] = useTransition();

  // Collapse back to the masked view once a save completes without error.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !error) setEditing(false);
    wasPending.current = pending;
  }, [pending, error]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-300">AI Advisor (Gemini)</h2>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
        >
          Dapatkan API key <ExternalLink size={12} />
        </a>
      </div>

      {!editing ? (
        <div className="flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5">
          <div>
            <p className="text-sm text-neutral-200">API key tersimpan</p>
            <p className="text-xs text-neutral-500">•••••••••••••••• · model: {model}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
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
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-red-400 hover:bg-neutral-700"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Gemini API Key</label>
            <input
              name="gemini_api_key"
              type="password"
              required
              placeholder="AIza..."
              autoFocus
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Model</label>
            <input
              name="gemini_model"
              defaultValue={model}
              required
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="mt-1 flex justify-end gap-2">
            {hasKey && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        API key disimpan di database aplikasimu sendiri (bukan dikirim ke pihak ketiga selain Google Gemini) dan hanya
        dipakai server-side untuk fitur AI Advisor.
      </p>
    </section>
  );
}
