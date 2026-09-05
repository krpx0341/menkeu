"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Target,
  BarChart3,
  Tags,
  Settings,
  LogOut,
  Plus,
  MoreHorizontal,
  X,
} from "lucide-react";
import { logout } from "@/app/login/actions";

const TABS = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/accounts", label: "Akun", icon: Wallet },
];

const MORE_LINKS = [
  { href: "/budgets", label: "Anggaran", icon: PiggyBank },
  { href: "/goals", label: "Target", icon: Target },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  if (pathname === "/login") return null;

  const onMoreLink = MORE_LINKS.some((l) => isActive(pathname, l.href));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative mx-auto grid h-16 max-w-lg grid-cols-5 items-stretch">
          {TABS.slice(0, 2).map((tab) => (
            <TabLink key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
          ))}
          <div />
          <TabLink {...TABS[2]} active={isActive(pathname, TABS[2].href)} />
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
              onMoreLink ? "text-blue-600" : "text-slate-400"
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={onMoreLink ? 2.4 : 2} />
            Lainnya
          </button>

          <Link
            href="/transactions?new=1"
            aria-label="Tambah transaksi"
            className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition active:scale-95"
          >
            <Plus size={26} />
          </Link>
        </div>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white p-4 shadow-2xl"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1 py-2">
              <p className="text-sm font-semibold text-slate-900">Menu lainnya</p>
              <button
                onClick={() => setMoreOpen(false)}
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
                  onClick={() => setMoreOpen(false)}
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

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
        active ? "text-blue-600" : "text-slate-400"
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
      {label}
    </Link>
  );
}
