import { TrendingDown } from "lucide-react";
import type { Account } from "@/lib/types";
import { rupiah } from "@/lib/format";

export default function DebtPayoffCard({ debts }: { debts: Account[] }) {
  const ranked = [...debts].sort((a, b) => (b.interest_rate ?? 0) - (a.interest_rate ?? 0));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Prioritas Pelunasan Utang</h2>
      <p className="mb-4 text-xs text-slate-500">
        Diurutkan dari bunga tertinggi (metode avalanche) — melunasi ini lebih dulu meminimalkan total bunga yang dibayar.
      </p>
      <ul className="flex flex-col divide-y divide-slate-100">
        {ranked.map((debt, i) => (
          <li key={debt.id} className="flex items-center gap-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-semibold text-red-600">
              {i + 1}
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <TrendingDown size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{debt.name}</p>
              <p className="text-xs text-slate-400">
                {debt.interest_rate != null ? `${debt.interest_rate}%/tahun` : "Bunga tidak diisi"}
                {debt.min_payment != null ? ` · Min. ${rupiah.format(debt.min_payment)}/bulan` : ""}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-red-600">{rupiah.format(debt.balance)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
