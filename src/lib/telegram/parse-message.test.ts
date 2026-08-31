import { describe, expect, it } from "vitest";
import { parseAmount, parseMessage } from "./parse-message";
import type { Category } from "@/lib/types";

const categories: Category[] = [
  { id: "1", name: "Makanan", type: "expense", color: "#f97316", icon: "utensils", is_archived: false },
  { id: "2", name: "Gaji", type: "income", color: "#22c55e", icon: "wallet", is_archived: false },
  { id: "3", name: "Lainnya (Expense)", type: "expense", color: "#64748b", icon: "more", is_archived: false },
  { id: "4", name: "Lainnya (Income)", type: "income", color: "#84cc16", icon: "plus", is_archived: false },
];

describe("parseMessage", () => {
  it("parses '50rb makan siang' as 50000 expense, category Makanan", () => {
    const r = parseMessage("50rb makan siang", categories);
    expect(r.amount).toBe(50000);
    expect(r.type).toBe("expense");
    expect(r.categoryName).toBe("Makanan");
  });

  it("parses 'gaji 5jt' as 5000000 income", () => {
    const r = parseMessage("gaji 5jt", categories);
    expect(r.amount).toBe(5_000_000);
    expect(r.type).toBe("income");
    expect(r.categoryName).toBe("Gaji");
  });

  it("returns null amount for unparseable text", () => {
    const r = parseMessage("halo apa kabar", categories);
    expect(r.amount).toBeNull();
  });

  it("handles plain numbers and k/jt suffixes", () => {
    expect(parseMessage("200k dari freelance", categories).amount).toBe(200_000);
    expect(parseMessage("50000 makan di warteg", categories).amount).toBe(50000);
  });
});

describe("parseAmount", () => {
  it("parses a bare reply like '25rb' used to correct a receipt placeholder", () => {
    expect(parseAmount("25rb").amount).toBe(25_000);
  });

  it("returns null for text with no digits", () => {
    expect(parseAmount("gak ada angka").amount).toBeNull();
  });
});
