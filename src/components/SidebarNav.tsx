"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function SidebarNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    )}
                  />
                  <span className={cn(active ? "text-accent-400" : "text-slate-500 group-hover:text-slate-300")}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
