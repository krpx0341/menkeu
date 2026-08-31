import { Lightbulb } from "lucide-react";
import { rupiah } from "@/lib/format";

export default function InsightCard({
  totalIncome,
  totalExpense,
  topCategory,
}: {
  totalIncome: number;
  totalExpense: number;
  topCategory: { name: string; amount: number } | null;
}) {
  const insights: string[] = [];

  if (totalIncome === 0 && totalExpense === 0) {
    insights.push("Belum ada transaksi bulan ini. Catat transaksi pertamamu lewat tombol + di bawah.");
  } else {
    insights.push(
      totalIncome >= totalExpense
        ? "Arus kas bulan ini positif. Pertimbangkan mengalokasikan surplus ke target keuangan."
        : "Pengeluaran bulan ini melebihi pemasukan. Coba tinjau ulang pengeluaran terbesar."
    );
    if (topCategory) {
      insights.push(`Pengeluaran terbesar: ${topCategory.name} (${rupiah.format(topCategory.amount)}).`);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Insight Otomatis</h2>
      <ul className="flex flex-col gap-3">
        {insights.map((text) => (
          <li key={text} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Lightbulb size={14} />
            </span>
            <p className="text-sm text-slate-600">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
