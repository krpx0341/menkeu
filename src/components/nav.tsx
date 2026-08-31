"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Tags, PiggyBank, BarChart3, LogOut, Target, Settings } from "lucide-react";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budget", icon: PiggyBank },
  { href: "/goals", label: "Target", icon: Target },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-neutral-800 bg-neutral-900/50 px-3 py-6">
      <div className="mb-6 px-3 text-lg font-semibold text-neutral-100">Menkeu</div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-indigo-600 text-white"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <form action={logout} className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </form>
    </aside>
  );
}
