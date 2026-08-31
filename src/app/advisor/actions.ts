"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateContent, type GeminiContent, type GeminiPart } from "@/lib/gemini";
import type { AdvisorResult, AppSettings, Budget, Category, Goal, Transaction, TxType } from "@/lib/types";

const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    type: { type: "STRING", enum: ["transaction_preview", "answer"] },
    answer_text: {
      type: "STRING",
      description: "Only when type=answer: the reply to show the user, in Indonesian.",
    },
    amount: { type: "NUMBER", description: "Only when type=transaction_preview: amount in IDR, always positive." },
    tx_type: { type: "STRING", enum: ["income", "expense"] },
    category_name: {
      type: "STRING",
      description: "Only when type=transaction_preview: pick the closest matching name from the provided category list.",
    },
    note: { type: "STRING", description: "Only when type=transaction_preview: a short note describing the transaction." },
    occurred_at: {
      type: "STRING",
      description: "Only when type=transaction_preview and the user mentioned a specific date: ISO date YYYY-MM-DD. Omit otherwise.",
    },
  },
  required: ["type"],
};

async function buildContext(db: ReturnType<typeof supabaseAdmin>) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const monthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [{ data: txs }, { data: prevTxs }, { data: budgetRows }, { data: goalRows }, { data: categoryRows }] =
    await Promise.all([
      db.from("transactions").select("*").gte("occurred_at", monthStart).order("occurred_at", { ascending: false }),
      db.from("transactions").select("*").gte("occurred_at", prevMonthStart).lt("occurred_at", monthStart),
      db.from("budgets").select("*").eq("month", monthValue),
      db.from("goals").select("*").eq("is_archived", false),
      db.from("categories").select("*").eq("is_archived", false),
    ]);

  const transactions = (txs ?? []) as Transaction[];
  const prevTransactions = (prevTxs ?? []) as Transaction[];
  const budgets = (budgetRows ?? []) as Budget[];
  const goals = (goalRows ?? []) as Goal[];
  const categories = (categoryRows ?? []) as Category[];

  const sum = (list: Transaction[], type: TxType) =>
    list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const totalIncome = sum(transactions, "income");
  const totalExpense = sum(transactions, "expense");
  const prevTotalIncome = sum(prevTransactions, "income");
  const prevTotalExpense = sum(prevTransactions, "expense");

  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense" || !t.category_id) continue;
    byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + t.amount);
  }
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, amount]) => `${categoryMap.get(id)?.name ?? "Lainnya"} ${idr.format(amount)}`)
    .join(", ") || "belum ada";

  const budgetLines =
    budgets
      .map((b) => {
        const spent = byCategory.get(b.category_id) ?? 0;
        const pct = b.amount_limit > 0 ? Math.round((spent / b.amount_limit) * 100) : 0;
        return `${categoryMap.get(b.category_id)?.name ?? "?"} ${idr.format(b.amount_limit)} (${pct}% terpakai)`;
      })
      .join(", ") || "belum ada budget bulan ini";

  const goalLines =
    goals
      .map((g) => {
        const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
        const deadline = g.deadline ? `, tenggat ${g.deadline}` : "";
        return `${g.name}: ${idr.format(g.current_amount)} dari ${idr.format(g.target_amount)} (${pct}%)${deadline}`;
      })
      .join("; ") || "belum ada goal";

  const expenseCategories = categories.filter((c) => c.type === "expense").map((c) => c.name);
  const incomeCategories = categories.filter((c) => c.type === "income").map((c) => c.name);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  const context = `Data keuangan pengguna per hari ini (${now.toISOString().slice(0, 10)}, ${daysLeft} hari tersisa bulan ini):
- Pemasukan bulan ini: ${idr.format(totalIncome)} (bulan lalu: ${idr.format(prevTotalIncome)})
- Pengeluaran bulan ini: ${idr.format(totalExpense)} (bulan lalu: ${idr.format(prevTotalExpense)})
- Saldo bersih bulan ini: ${idr.format(totalIncome - totalExpense)}
- Pengeluaran terbesar per kategori bulan ini: ${topCategories}
- Budget bulan ini: ${budgetLines}
- Goal aktif: ${goalLines}
- Kategori pengeluaran yang tersedia: ${expenseCategories.join(", ") || "-"}
- Kategori pemasukan yang tersedia: ${incomeCategories.join(", ") || "-"}`;

  return { context, categories };
}

const SYSTEM_INSTRUCTION = `Kamu adalah asisten keuangan pribadi di aplikasi pencatatan keuangan bernama Menkeu. Selalu balas dalam Bahasa Indonesia, singkat (2-4 kalimat untuk jawaban), dan HANYA berdasarkan data yang diberikan — jangan pernah mengarang angka atau transaksi yang tidak ada di data.

Kamu punya dua mode balasan, tentukan lewat field "type":
1. "transaction_preview" — kalau pesan pengguna menceritakan SATU transaksi yang baru terjadi (mis. "beli mie ayam 25 ribu", "gajian 5 juta"). Isi amount, tx_type, category_name (pilih SATU nama paling cocok dari daftar kategori yang diberikan, jangan buat nama baru), dan note singkat. Jangan langsung simpan — ini cuma preview yang akan dikonfirmasi pengguna.
2. "answer" — untuk semua pertanyaan atau obrolan lain (termasuk "apakah aman beli X", "pengeluaran terbesar apa", dsb). Jawab berdasarkan data yang diberikan, beri saran praktis. Ini bukan nasihat investasi formal — kalau relevan, boleh sebutkan itu singkat.

Kalau pengguna mengirim foto struk/nota, baca nominal totalnya dan balas type=transaction_preview dari situ.`;

export async function askAdvisor(
  history: { role: "user" | "model"; text: string }[],
  message: string,
  image?: { mimeType: string; base64: string }
): Promise<AdvisorResult> {
  const db = supabaseAdmin();
  const { data: settingsRow } = await db.from("app_settings").select("*").eq("id", true).maybeSingle();
  const settings = settingsRow as AppSettings | null;

  if (!settings?.gemini_api_key) {
    return { type: "error", message: "Tambahkan API key Gemini dulu di halaman Pengaturan untuk mengaktifkan AI Advisor." };
  }

  try {
    const { context, categories } = await buildContext(db);

    const contents: GeminiContent[] = [
      { role: "user", parts: [{ text: context }] },
      { role: "model", parts: [{ text: JSON.stringify({ type: "answer", answer_text: "Siap, ada yang bisa dibantu?" }) }] },
      ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] }) satisfies GeminiContent),
    ];

    const userParts: GeminiPart[] = [{ text: message || "(lihat gambar struk terlampir)" }];
    if (image) userParts.push({ inline_data: { mime_type: image.mimeType, data: image.base64 } });
    contents.push({ role: "user", parts: userParts });

    const raw = await generateContent({
      apiKey: settings.gemini_api_key,
      model: settings.gemini_model,
      systemInstruction: SYSTEM_INSTRUCTION,
      contents,
      responseSchema: RESPONSE_SCHEMA,
    });

    const parsed = JSON.parse(raw) as {
      type: "transaction_preview" | "answer";
      answer_text?: string;
      amount?: number;
      tx_type?: TxType;
      category_name?: string;
      note?: string;
      occurred_at?: string;
    };

    if (parsed.type === "answer") {
      return { type: "answer", text: parsed.answer_text || "Maaf, aku belum punya jawaban untuk itu." };
    }

    if (!parsed.amount || parsed.amount <= 0 || (parsed.tx_type !== "income" && parsed.tx_type !== "expense")) {
      return { type: "answer", text: "Nominalnya belum kebaca jelas — coba tulis ulang dengan nominal yang jelas, mis. '25rb makan siang'." };
    }

    const candidates = categories.filter((c) => c.type === parsed.tx_type);
    const matched = candidates.find((c) => c.name.toLowerCase() === (parsed.category_name ?? "").toLowerCase());
    const fallback = candidates.find((c) => c.name.toLowerCase().startsWith("lainnya"));
    const category = matched ?? fallback ?? null;

    return {
      type: "transaction_preview",
      amount: parsed.amount,
      txType: parsed.tx_type,
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? "Tanpa kategori",
      note: parsed.note || message,
      occurredAt: parsed.occurred_at ?? null,
    };
  } catch (err) {
    console.error("advisor error", err);
    return { type: "error", message: "Gagal menghubungi AI Advisor. Coba lagi sebentar lagi." };
  }
}

export async function confirmAdvisorTransaction(payload: {
  amount: number;
  txType: TxType;
  categoryId: string | null;
  note: string;
  occurredAt: string | null;
}): Promise<{ error?: string }> {
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) return { error: "Jumlah tidak valid." };

  const { error } = await supabaseAdmin()
    .from("transactions")
    .insert({
      amount: payload.amount,
      type: payload.txType,
      category_id: payload.categoryId,
      note: payload.note || null,
      source: "web",
      occurred_at: payload.occurredAt ? new Date(payload.occurredAt).toISOString() : undefined,
    });
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return {};
}
