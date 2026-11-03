"use client";

import { useEffect, useState } from "react";
import BalanceHero from "@/components/dashboard/BalanceHero";
import LivingAllowanceCard from "@/components/dashboard/LivingAllowanceCard";

// Satu slot hero, dua card bergantian — sesuai permintaan: yang tampil hanya
// satu card, ketuk card untuk ganti ke card satunya.
//
// Kenapa kedua card tetap di-mount (satu di-hidden, bukan di-unmount):
// BalanceHero menyimpan state sembunyikan-saldo-nya sendiri; kalau card
// di-unmount tiap ganti, state itu reset dan mata-uangnya berkedip. Dengan
// hidden, state tetap hidup dan gantinya instan.
//
// Kenapa pilihan tidak dibaca saat render pertama: server dan client harus
// render hasil yang sama dulu (card pertama) supaya tidak hydration mismatch.
// Preferensi dari localStorage baru diterapkan post-mount, pola yang sama
// dengan tombol mata di BalanceHero.
const STORAGE_KEY = "menkeu:hero-card";

export default function DashboardHeroCards({
  living,
  balance,
}: {
  living: {
    remaining: number;
    salaryAmount: number | null;
    salaryNote: string | null;
    daysLeft: number;
    lastDayLabel: string;
  } | null;
  balance: { net: number; totalIncome: number; totalExpense: number };
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reading localStorage in a lazy useState initializer would mismatch the
    // server-rendered HTML (no localStorage during SSR) and break hydration —
    // applying the stored preference post-mount is the correct pattern here.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(STORAGE_KEY) === "1") setIndex(1);
    } catch {
      // localStorage tidak tersedia — tetap di card pertama.
    }
  }, []);

  // Tanpa akun Tunai tidak ada card "Sisa Uang Hidup" — tampilkan saja
  // Saldo Bersih seperti sebelum card ini ada, tanpa tombol ganti.
  if (living === null) {
    return <BalanceHero {...balance} />;
  }

  const showBalance = index === 1;
  const toggle = () => {
    setIndex((prev) => {
      const next = prev === 0 ? 1 : 0;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // abaikan — preferensi hanya kenyamanan, bukan data.
      }
      return next;
    });
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={
          showBalance
            ? "Ketuk untuk melihat Sisa Uang Hidup"
            : "Ketuk untuk melihat Saldo Bersih Bulan Ini"
        }
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        className="cursor-pointer select-none"
      >
        <div className={showBalance ? "hidden" : ""}>
          <LivingAllowanceCard {...living} />
        </div>
        <div className={showBalance ? "" : "hidden"}>
          <BalanceHero {...balance} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <span
          aria-hidden
          className={`h-1.5 rounded-full transition-all ${
            showBalance ? "w-1.5 bg-slate-300" : "w-4 bg-slate-900"
          }`}
        />
        <span
          aria-hidden
          className={`h-1.5 rounded-full transition-all ${
            showBalance ? "w-4 bg-slate-900" : "w-1.5 bg-slate-300"
          }`}
        />
        <span className="ml-1 text-xs text-slate-400">
          Ketuk kartu untuk {showBalance ? "Sisa Uang Hidup" : "Saldo Bersih Bulan Ini"}
        </span>
      </div>
    </div>
  );
}
