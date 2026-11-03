import { rupiah } from "@/lib/format";

// Card "Sisa Uang Hidup" — angka yang ditanyakan setiap hari, yang TIDAK
// dijawab oleh "Saldo Bersih Bulan Ini" di bawahnya.
//
// Saldo Bersih Bulan Ini = arus bulan kalender berjalan per tanggal transaksi.
// Itu menyesatkan untuk pola gaji Han: gaji bulan M diterima akhir bulan M
// dan dipakai untuk hidup bulan M+1, jadi gaji Oktober (31 Okt) dihitung di
// bulan Oktober, padahal itu uang hidup November. Card ini tidak memakai
// arus bulanan sama sekali: sisanya = saldo akun Tunai (akumulatif, dihitung
// menkeu dari semua transaksi yang tertaut ke akun itu), dan jatah harian =
// sisa / hari tersisa di bulan berjalan (hari ini ikut dihitung).
//
// salaryAmount/salaryNote = transaksi pemasukan "Gaji…" terbaru, hanya untuk
// konteks ("dari gaji sekian, terpakai sekian"). Kalau tidak ada, card tetap
// tampil dengan sisa + jatah harian saja. Kalau akun Tunai tidak ada, card
// tidak dirender sama sekali (lihat page.tsx) — jangan tampilkan angka dari
// akun lain, karena akun lain bukan uang hidup harian.
export default function LivingAllowanceCard({
  remaining,
  salaryAmount,
  salaryNote,
  daysLeft,
  lastDayLabel,
}: {
  remaining: number;
  salaryAmount: number | null;
  salaryNote: string | null;
  daysLeft: number;
  lastDayLabel: string;
}) {
  const daily = daysLeft > 0 ? Math.max(remaining, 0) / daysLeft : 0;
  const used =
    salaryAmount !== null && salaryAmount > 0 ? salaryAmount - remaining : null;
  const usedPct =
    used !== null && salaryAmount !== null && salaryAmount > 0
      ? Math.min(Math.max((used / salaryAmount) * 100, 0), 100)
      : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-white shadow-lg shadow-emerald-600/20">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative">
        <p className="text-sm text-emerald-100">Sisa Uang Hidup</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
          {rupiah.format(remaining)}
        </p>
        {remaining < 0 ? (
          <p className="mt-2 text-sm font-medium text-white">
            Sisa sudah minus — jatah harian bulan ini habis.
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-100">
            Jatah per hari:{" "}
            <span className="text-base font-semibold text-white tabular-nums">
              {rupiah.format(daily)}
            </span>{" "}
            / hari · {daysLeft} hari tersisa (sampai {lastDayLabel})
          </p>
        )}
        {used !== null && usedPct !== null && (
          <div className="mt-5 border-t border-white/20 pt-4">
            <p className="text-xs text-emerald-100">
              Dari {salaryNote ?? "gaji terakhir"} {rupiah.format(salaryAmount ?? 0)} ·
              terpakai {rupiah.format(used)} ({Math.round(usedPct)}%)
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-emerald-100/80">
          Ikut saldo akun Tunai, bukan laporan bulanan.
        </p>
      </div>
    </div>
  );
}
