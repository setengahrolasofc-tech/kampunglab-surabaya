"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavItem { href: string; label: string; icon: ReactNode; exact?: boolean; match?: string[] }

export function SidebarNav({ items, orientation = "vertical" }: { items: NavItem[]; orientation?: "vertical" | "horizontal" }) {
  const path = usePathname() ?? "";
  const isActive = (it: NavItem) => (it.exact ? path === it.href : (it.match ?? [it.href]).some((m) => path === m || path.startsWith(m + "/")));
  const vertical = orientation === "vertical";
  return (
    <nav aria-label="Menu dashboard" className={vertical ? "flex flex-col gap-1" : "flex gap-2 overflow-x-auto"}>
      {items.map((it) => {
        const active = isActive(it);
        return (
          <Link
            key={it.label}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 whitespace-nowrap rounded-lg text-[13px] font-medium transition ${vertical ? "px-3 py-2.5" : "px-3 py-1.5"} ${active ? "bg-[#bdebcf] font-semibold text-[#14304a]" : "text-white/85 hover:bg-white/10"}`}
          >
            <span className={active ? "text-[#14304a]" : "text-white/80"}>{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
