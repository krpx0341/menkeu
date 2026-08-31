import type { Category, TxType } from "@/lib/types";

export type ParsedMessage = {
  amount: number | null;
  type: TxType;
  categoryId: string | null;
  categoryName: string;
  note: string;
};

const INCOME_KEYWORDS = ["gaji", "terima", "masuk", "dapat", "income", "bonus", "thr"];

// Matches amount tokens like "50rb", "50.000", "5jt", "200k", "50000" — first match wins.
const AMOUNT_RE = /(\d[\d.,]*)\s*(ribu|rb|jt|juta|k)?/i;
const MULTIPLIERS: Record<string, number> = { rb: 1000, ribu: 1000, k: 1000, jt: 1_000_000, juta: 1_000_000 };

export function parseAmount(text: string): { amount: number | null; matchedText: string } {
  const match = text.match(AMOUNT_RE);
  if (!match) return { amount: null, matchedText: "" };
  const numRaw = match[1].replace(/\./g, "").replace(/,/g, "");
  const num = Number(numRaw);
  if (!Number.isFinite(num) || num <= 0) return { amount: null, matchedText: "" };
  const suffix = match[2]?.toLowerCase();
  const amount = suffix ? num * MULTIPLIERS[suffix] : num;
  return { amount, matchedText: match[0] };
}

function inferType(text: string): TxType {
  const lower = text.toLowerCase();
  return INCOME_KEYWORDS.some((kw) => lower.includes(kw)) ? "income" : "expense";
}

function matchCategory(text: string, type: TxType, categories: Category[]): Category | null {
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/).filter((w) => w.length >= 3);
  const candidates = categories.filter((c) => c.type === type && !c.is_archived);
  return (
    candidates.find((c) => {
      const name = c.name.toLowerCase();
      if (lower.includes(name)) return true;
      // loose stem match: "makan" <-> "makanan", "belanja" <-> "belanja bulanan"
      return words.some((w) => name.startsWith(w) || w.startsWith(name.slice(0, 5)));
    }) ?? null
  );
}

export function parseMessage(rawText: string, categories: Category[]): ParsedMessage {
  const text = rawText.trim();
  const { amount, matchedText } = parseAmount(text);
  const type = inferType(text);
  const category = matchCategory(text, type, categories);
  const fallback = categories.find(
    (c) => c.type === type && c.name.toLowerCase().startsWith("lainnya")
  );
  const note = (matchedText ? text.replace(matchedText, "") : text).replace(/\s+/g, " ").trim();

  return {
    amount,
    type,
    categoryId: (category ?? fallback)?.id ?? null,
    categoryName: (category ?? fallback)?.name ?? "Lainnya",
    note: note || rawText.trim(),
  };
}
