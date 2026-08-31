"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tags, Target, Settings, LogOut, X, Sparkles } from "lucide-react";
import { logout } from "@/app/login/actions";
import { openAdvisor } from "@/lib/advisor-events";

const MORE_LINKS = [
  { href: "/goals", label: "Target", icon: Target },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === "/login") return null;

  return (
    <>
      <header
        className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <span className="text-lg font-semibold tracking-tight text-slate-900">Menkeu</span>
        <div className="flex items-center gap-2">
          <button
            onClick={openAdvisor}
            aria-label="Buka AI Advisor"
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
          >
            <Sparkles size={20} />
          </button>
          <button
            onClick={() => setOpen(true)}
            aria-label="Menu lainnya"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
          >
            M
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-4 shadow-2xl"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1 py-2">
              <p className="text-sm font-semibold text-slate-900">Menu lainnya</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {MORE_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 active:bg-slate-100"
                >
                  <Icon size={20} className="text-slate-500" />
                  {label}
                </Link>
              ))}
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 active:bg-red-50"
                >
                  <LogOut size={20} />
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
