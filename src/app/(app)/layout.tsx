import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getSystemStatus } from "@/lib/queries";
import { ROLE_LABELS } from "@/lib/format";
import { logoutAction } from "@/actions/auth";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/cn";
import { SidebarNav, type NavGroup } from "@/components/SidebarNav";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NewMovementMenu } from "@/components/NewMovementMenu";
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconBox,
  IconCog,
  IconDashboard,
  IconExchange,
  IconLogout,
  IconReport,
  IconTag,
  IconTruck,
  IconUser,
} from "@/components/icons";

const ALL_NAV: { group: string; items: { href: string; label: string; roles: Role[]; icon: React.ReactNode }[] }[] = [
  {
    group: "General",
    items: [
      { href: "/", label: "Inicio", roles: ["ADMIN", "OPERADOR", "CONSULTA"], icon: <IconDashboard className="h-[18px] w-[18px]" /> },
      { href: "/productos", label: "Productos", roles: ["ADMIN", "OPERADOR", "CONSULTA"], icon: <IconBox className="h-[18px] w-[18px]" /> },
      { href: "/movimientos", label: "Movimientos", roles: ["ADMIN", "OPERADOR", "CONSULTA"], icon: <IconExchange className="h-[18px] w-[18px]" /> },
      { href: "/alertas", label: "Alertas", roles: ["ADMIN", "OPERADOR", "CONSULTA"], icon: <IconAlert className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    group: "Stock",
    items: [
      { href: "/ingresos", label: "Ingresos", roles: ["ADMIN", "OPERADOR"], icon: <IconArrowDown className="h-[18px] w-[18px]" /> },
      { href: "/salidas", label: "Salidas", roles: ["ADMIN", "OPERADOR"], icon: <IconArrowUp className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    group: "Gestión",
    items: [
      { href: "/categorias", label: "Categorías", roles: ["ADMIN"], icon: <IconTag className="h-[18px] w-[18px]" /> },
      { href: "/proveedores", label: "Proveedores", roles: ["ADMIN"], icon: <IconTruck className="h-[18px] w-[18px]" /> },
      { href: "/reportes", label: "Reportes", roles: ["ADMIN", "OPERADOR", "CONSULTA"], icon: <IconReport className="h-[18px] w-[18px]" /> },
      { href: "/usuarios", label: "Usuarios", roles: ["ADMIN"], icon: <IconUser className="h-[18px] w-[18px]" /> },
      { href: "/configuracion", label: "Configuración", roles: ["ADMIN"], icon: <IconCog className="h-[18px] w-[18px]" /> },
    ],
  },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const status = await getSystemStatus();

  const groups: NavGroup[] = ALL_NAV.map((g) => ({
    label: g.group,
    items: g.items
      .filter((i) => i.roles.includes(user.role as Role))
      .map(({ href, label, icon }) => ({ href, label, icon })),
  })).filter((g) => g.items.length > 0);

  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(status.updatedAt);

  return (
    <div className="app-shell min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-line bg-sidebar">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-line px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-blue-700 shadow-md shadow-blue-900/40">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <p className="font-display text-[15px] font-semibold leading-tight text-white">
              Stock
            </p>
            <p className="text-[11px] text-slate-500">Gestión de inventario</p>
          </div>
        </div>

        <SidebarNav groups={groups} />

        <div className="border-t border-sidebar-line p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-white ring-1 ring-slate-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-slate-500">
                {ROLE_LABELS[user.role]}
              </p>
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

      <div className="pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-8">
            <div className="flex min-w-0 items-center gap-4">
              <GlobalSearch />
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <NewMovementMenu canEdit={user.role !== "CONSULTA"} />
              <Link
                href="/alertas"
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700",
                  status.alertCount > 0 && "border-warning/40 text-warning"
                )}
                aria-label="Alertas"
              >
                <IconAlert className="h-4.5 w-4.5" />
                {status.alertCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {status.alertCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
          <div className="flex h-9 items-center gap-6 border-t border-line px-8 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Operación normal
            </span>
            <span className="hidden sm:inline">
              <b className="tnum font-semibold text-slate-700">{status.productCount}</b>{" "}
              productos activos
            </span>
            <span className={cn(status.alertCount > 0 && "text-warning")}>
              <b className="tnum font-semibold">{status.alertCount}</b> alertas
            </span>
            <span className="ml-auto hidden md:inline">
              Última actualización:{" "}
              <b className="tnum font-semibold text-slate-600">{time}</b>
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
