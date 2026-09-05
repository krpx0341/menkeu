"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { openAdvisor } from "@/lib/advisor-events";

export function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <span className="text-lg font-semibold tracking-tight text-slate-900">Menkeu</span>
      <button
        onClick={openAdvisor}
        aria-label="Buka AI Advisor"
        className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
      >
        <Sparkles size={20} />
      </button>
    </header>
  );
}
