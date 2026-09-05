import Link from "next/link";
import { Wallet } from "lucide-react";
import { rupiah } from "@/lib/format";

export default function NetWorthCard({
  netWorth,
  assetsTotal,
  debtsTotal,
  emergencyFundMonths,
}: {
  netWorth: number;
  assetsTotal: number;
  debtsTotal: number;
  emergencyFundMonths: number | null;
}) {
  const emergencyLow = emergencyFundMonths !== null && emergencyFundMonths < 3;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Kekayaan Bersih</h2>
        <Link href="/accounts" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
          <Wallet size={13} /> Kelola Akun
        </Link>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-slate-900">{rupiah.format(netWorth)}</p>
      <div className="mt-4 flex gap-6 border-t border-slate-100 pt-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Aset</p>
          <p className="font-medium tabular-nums text-slate-900">{rupiah.format(assetsTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Utang</p>
          <p className="font-medium tabular-nums text-red-600">{rupiah.format(debtsTotal)}</p>
        </div>
      </div>
      <p className={`mt-3 text-xs ${emergencyLow ? "text-amber-600" : "text-slate-500"}`}>
        {emergencyFundMonths === null
          ? "Dana darurat: belum bisa dihitung (belum ada data pengeluaran)."
          : `Dana darurat: ${emergencyFundMonths.toFixed(1)} bulan pengeluaran${emergencyLow ? " — di bawah target 3 bulan" : ""}.`}
      </p>
    </section>
  );
}
