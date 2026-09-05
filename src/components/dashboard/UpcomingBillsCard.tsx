import { CalendarClock } from "lucide-react";
import { rupiah, formatDate } from "@/lib/format";

export type UpcomingBill = {
  id: string;
  label: string;
  amount: number;
  nextDue: string; // ISO date
};

export default function UpcomingBillsCard({
  bills,
  safeToSpend,
}: {
  bills: UpcomingBill[];
  safeToSpend: number;
}) {
  const total = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Tagihan Berulang Bulan Ini</h2>
      {bills.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada transaksi berulang yang tercatat.</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-slate-100">
            {bills.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <CalendarClock size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{b.label}</p>
                  <p className="text-xs text-slate-400">Jatuh tempo {formatDate(b.nextDue)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {rupiah.format(b.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
            <span className="text-slate-500">Sisa aman (setelah tagihan)</span>
            <span className={`font-semibold tabular-nums ${safeToSpend < 0 ? "text-red-600" : "text-slate-900"}`}>
              {rupiah.format(safeToSpend)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Total tagihan diketahui: {rupiah.format(total)}</p>
        </>
      )}
    </section>
  );
}
