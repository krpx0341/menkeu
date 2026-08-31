"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { rupiah } from "@/lib/format";

const STORAGE_KEY = "menkeu:balance-hidden";

export default function BalanceHero({
  net,
  totalIncome,
  totalExpense,
}: {
  net: number;
  totalIncome: number;
  totalExpense: number;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Reading localStorage in a lazy useState initializer would mismatch the
    // server-rendered HTML (no localStorage during SSR) and break hydration —
    // applying the stored preference post-mount is the correct pattern here.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — just stay visible.
    }
  }, []);

  function toggle() {
    setHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore — preference just won't persist across reloads
      }
      return next;
    });
  }

  const show = (n: number) => (hidden ? "Rp ••••••" : rupiah.format(n));

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white shadow-lg shadow-blue-600/20">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-100">Saldo Bersih Bulan Ini</p>
          <button
            onClick={toggle}
            aria-label={hidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
            className="rounded-full p-1.5 text-blue-100 hover:bg-white/10 hover:text-white"
          >
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{show(net)}</p>
        <div className="mt-6 flex gap-6 border-t border-white/20 pt-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-blue-100">
              <ArrowUpRight size={14} /> Pemasukan
            </div>
            <p className="text-base font-semibold tabular-nums">{show(totalIncome)}</p>
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-blue-100">
              <ArrowDownRight size={14} /> Pengeluaran
            </div>
            <p className="text-base font-semibold tabular-nums">{show(totalExpense)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
