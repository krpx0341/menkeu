"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  BarChart3,
  Target,
  Tags,
  Settings,
  LogOut,
  Sparkles,
  Wallet,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { openAdvisor } from "@/lib/advisor-events";

const LINKS = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/accounts", label: "Akun", icon: Wallet },
  { href: "/budgets", label: "Anggaran", icon: PiggyBank },
  { href: "/goals", label: "Target", icon: Target },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function TopNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/95 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <span className="text-lg font-semibold tracking-tight text-slate-900">Menkeu</span>
        <nav className="flex flex-1 items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={openAdvisor}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
        >
          <Sparkles size={16} />
          AI Advisor
        </button>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </form>
      </div>
    </header>
  );
}
