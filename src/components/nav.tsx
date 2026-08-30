"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Tags } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/categories", label: "Kategori", icon: Tags },
];

export function Nav() {
  const pathname = usePathname();
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
    </aside>
  );
}
