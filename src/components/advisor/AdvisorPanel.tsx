"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Send, Paperclip, Check, XCircle } from "lucide-react";
import { askAdvisor, confirmAdvisorTransaction } from "@/app/advisor/actions";
import { rupiah } from "@/lib/format";
import type { AdvisorResult } from "@/lib/types";

type TxPreview = Extract<AdvisorResult, { type: "transaction_preview" }>;

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  preview?: TxPreview;
  status?: "pending" | "confirmed" | "cancelled" | "error";
  isError?: boolean;
};

const QUICK_ACTIONS = [
  { label: "Pengeluaran terbesar", prompt: "Pengeluaran terbesar saya bulan ini apa?" },
  { label: "Saldo aman", prompt: "Berdasarkan kondisi keuangan saya, apakah aman kalau saya belanja lumayan besar sekarang?" },
];

function summarize(result: AdvisorResult): string {
  if (result.type === "answer") return result.text;
  if (result.type === "error") return result.message;
  return `Menyarankan mencatat ${result.txType === "income" ? "pemasukan" : "pengeluaran"} ${rupiah.format(result.amount)} (${result.categoryName}): "${result.note}".`;
}

export function AdvisorPanel() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<{ mimeType: string; base64: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (pathname === "/login") return null;

  function pushMessage(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const base64 = dataUrl.split(",")[1] ?? "";
      setImage({ mimeType: file.type || "image/jpeg", base64, name: file.name });
    };
    reader.readAsDataURL(file);
  }

  function send(promptOverride?: string) {
    const text = (promptOverride ?? input).trim();
    if (!text && !image) return;

    const userMsgId = crypto.randomUUID();
    pushMessage({ id: userMsgId, role: "user", text: text || `[struk: ${image?.name}]` });
    setInput("");
    const attachedImage = image;
    setImage(null);

    const history = messages.map((m) => ({ role: m.role, text: m.text }));

    startTransition(async () => {
      const result = await askAdvisor(
        history,
        text,
        attachedImage ? { mimeType: attachedImage.mimeType, base64: attachedImage.base64 } : undefined
      );
      const modelMsgId = crypto.randomUUID();
      if (result.type === "transaction_preview") {
        pushMessage({ id: modelMsgId, role: "model", text: summarize(result), preview: result, status: "pending" });
      } else if (result.type === "error") {
        pushMessage({ id: modelMsgId, role: "model", text: result.message, isError: true });
      } else {
        pushMessage({ id: modelMsgId, role: "model", text: result.text });
      }
    });
  }

  function confirmPreview(msgId: string, preview: TxPreview) {
    startTransition(async () => {
      const res = await confirmAdvisorTransaction({
        amount: preview.amount,
        txType: preview.txType,
        categoryId: preview.categoryId,
        note: preview.note,
        occurredAt: preview.occurredAt,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status: res.error ? "error" : "confirmed", text: res.error ?? m.text } : m))
      );
    });
  }

  function cancelPreview(msgId: string) {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: "cancelled" } : m)));
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Buka AI Advisor"
          className="fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition active:scale-95 md:bottom-6 md:right-6"
        >
          <Sparkles size={22} />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:bottom-24 md:right-6 md:h-[32rem] md:w-full md:max-w-sm md:overflow-hidden md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 md:pb-3 md:pt-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">AI Advisor</p>
              <p className="text-xs text-slate-500">Catat lewat chat & tanya kondisi keuanganmu</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">
                Tulis seperti <span className="text-slate-700">&quot;beli mie ayam 25rb&quot;</span>, atau tanyakan kondisi keuanganmu.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-blue-600 text-white"
                          : m.isError
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p>{m.text}</p>
                      {m.preview && m.status === "pending" && (
                        <div className="mt-2 flex gap-2">
                          <button
                            disabled={pending}
                            onClick={() => confirmPreview(m.id, m.preview!)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            <Check size={12} /> Simpan
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => cancelPreview(m.id)}
                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                          >
                            <XCircle size={12} /> Batal
                          </button>
                        </div>
                      )}
                      {m.preview && m.status === "confirmed" && <p className="mt-1.5 text-xs text-emerald-600">✓ Tersimpan</p>}
                      {m.preview && m.status === "cancelled" && <p className="mt-1.5 text-xs text-slate-400">Dibatalkan</p>}
                      {m.preview && m.status === "error" && <p className="mt-1.5 text-xs text-red-600">Gagal menyimpan.</p>}
                    </div>
                  </div>
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-1.5 border-t border-slate-200 px-3 py-2">
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q.label}
                onClick={() => send(q.prompt)}
                disabled={pending}
                className="whitespace-nowrap rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>

          {image && (
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
              <span>📎 {image.name}</span>
              <button onClick={() => setImage(null)} aria-label="Hapus lampiran" className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Lampirkan foto struk"
              className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Paperclip size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Tulis transaksi atau pertanyaan..."
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
            <button
              onClick={() => send()}
              disabled={pending || (!input.trim() && !image)}
              aria-label="Kirim"
              className="shrink-0 rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
