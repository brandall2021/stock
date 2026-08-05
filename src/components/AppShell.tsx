"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SidebarNav, type NavGroup } from "@/components/SidebarNav";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NewMovementMenu } from "@/components/NewMovementMenu";
import { IconAlert, IconClose, IconLogout, IconMenu } from "@/components/icons";

export function AppShell({
  groups,
  userName,
  roleLabel,
  initial,
  productCount,
  alertCount,
  updatedAt,
  canEdit,
  logoutAction,
  children,
}: {
  groups: NavGroup[];
  userName: string;
  roleLabel: string;
  initial: string;
  productCount: number;
  alertCount: number;
  updatedAt: string;
  canEdit: boolean;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell min-h-screen">
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMenu}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-line bg-sidebar transition-transform duration-200 ease-in-out",
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-line px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-blue-700 shadow-md shadow-blue-900/40">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-semibold leading-tight text-white">
              Stock
            </p>
            <p className="text-[11px] text-slate-500">Gestión de inventario</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav groups={groups} onNavigate={closeMenu} />

        <div className="shrink-0 border-t border-sidebar-line p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-white ring-1 ring-slate-700">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="truncate text-[11px] text-slate-500">{roleLabel}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-line px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <IconLogout className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-600 transition-colors hover:bg-slate-50 lg:hidden"
                aria-label="Abrir menú"
              >
                <IconMenu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <GlobalSearch />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NewMovementMenu canEdit={canEdit} />
              <Link
                href="/alertas"
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700",
                  alertCount > 0 && "border-warning/40 text-warning"
                )}
                aria-label="Alertas"
              >
                <IconAlert className="h-4.5 w-4.5" />
                {alertCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {alertCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
          <div className="flex h-9 items-center gap-4 overflow-x-auto whitespace-nowrap border-t border-line px-4 text-[11px] text-slate-500 sm:gap-6 sm:px-8">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Operación normal
            </span>
            <span className="hidden sm:inline">
              <b className="tnum font-semibold text-slate-700">{productCount}</b>{" "}
              productos activos
            </span>
            <span className={cn(alertCount > 0 && "text-warning")}>
              <b className="tnum font-semibold">{alertCount}</b> alertas
            </span>
            <span className="ml-auto hidden md:inline">
              Última actualización:{" "}
              <b className="tnum font-semibold text-slate-600">{updatedAt}</b>
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
