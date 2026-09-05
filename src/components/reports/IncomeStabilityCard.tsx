import { Activity } from "lucide-react";
import { rupiah } from "@/lib/format";

type Stability = "stabil" | "cukup" | "volatil";

function classify(cv: number): { label: string; status: Stability } {
  if (cv < 0.15) return { label: "Stabil", status: "stabil" };
  if (cv < 0.3) return { label: "Cukup Stabil", status: "cukup" };
  return { label: "Tidak Stabil", status: "volatil" };
}

const BADGE_CLASS: Record<Stability, string> = {
  stabil: "bg-emerald-50 text-emerald-600",
  cukup: "bg-amber-50 text-amber-600",
  volatil: "bg-red-50 text-red-600",
};

export default function IncomeStabilityCard({
  monthlyIncomes,
  liquidSavings,
  avgMonthlyExpense,
}: {
  monthlyIncomes: number[];
  liquidSavings: number;
  avgMonthlyExpense: number;
}) {
  const mean = monthlyIncomes.reduce((s, v) => s + v, 0) / monthlyIncomes.length;
  const variance = monthlyIncomes.reduce((s, v) => s + (v - mean) ** 2, 0) / monthlyIncomes.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  const { label, status } = mean > 0 ? classify(cv) : { label: "Belum ada data", status: "cukup" as Stability };

  const runwayMonths = avgMonthlyExpense > 0 ? liquidSavings / avgMonthlyExpense : null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Stabilitas Pemasukan</h2>
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASS[status]}`}>
          <Activity size={12} /> {label}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Variasi pemasukan bulanan (6 bulan terakhir): {mean > 0 ? `${(cv * 100).toFixed(0)}%` : "-"} dari rata-rata{" "}
        {rupiah.format(mean)}.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {runwayMonths === null
          ? "Runway belum bisa dihitung (belum ada data pengeluaran)."
          : `Bila pemasukan berhenti, dana likuid saat ini cukup untuk ${runwayMonths.toFixed(1)} bulan pengeluaran.`}
      </p>
    </section>
  );
}
