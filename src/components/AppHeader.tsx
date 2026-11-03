"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { openAdvisor } from "@/lib/advisor-events";

// Header mobile — pola app keuangan sejenis (Jenius/GoPay/dll): brand kiri,
// satu aksi utilitas kanan, navigasi TIDAK di header (sudah ada BottomNav).
// Bukan header desktop yang diperkecil.
//
// Perbaikan iPhone berponi (dulu: h-12 + paddingTop safe-area, jadi tinggi
// konten tersisa hampir nol dan teks terpotong/aneh): tinggi header sekarang
// = 48px + safe-area-inset-top, dengan paddingTop yang sama, jadi area
// kontennya tetap 48px penuh di bawah poni. Background solid, bukan blur —
// blur di elemen sticky/fixed adalah salah satu pemicu lompatan render di
// Safari iOS.
export function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden"
      style={{
        height: "calc(3rem + env(safe-area-inset-top))",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <span className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- /icons is a static PWA asset, not a remote image */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={28}
          height={28}
          className="rounded-[8px]"
        />
        <span className="text-lg font-semibold tracking-tight text-slate-900">Menkeu</span>
      </span>
      <button
        onClick={openAdvisor}
        aria-label="Buka AI Advisor"
        className="flex h-11 w-11 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
      >
        <Sparkles size={20} />
      </button>
    </header>
  );
}
