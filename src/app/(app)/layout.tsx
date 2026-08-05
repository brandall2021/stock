import { requireAuth } from "@/lib/auth";
import { getSystemStatus } from "@/lib/queries";
import { ROLE_LABELS } from "@/lib/format";
import { logoutAction } from "@/actions/auth";
import type { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import type { NavGroup } from "@/components/SidebarNav";
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconBox,
  IconCog,
  IconDashboard,
  IconExchange,
  IconMap,
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
      { href: "/areas", label: "Áreas", roles: ["ADMIN"], icon: <IconMap className="h-[18px] w-[18px]" /> },
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
    <AppShell
      groups={groups}
      userName={user.name}
      roleLabel={ROLE_LABELS[user.role]}
      initial={user.name.charAt(0).toUpperCase()}
      productCount={status.productCount}
      alertCount={status.alertCount}
      updatedAt={time}
      canEdit={user.role !== "CONSULTA"}
      logoutAction={logoutAction}
    >
      {children}
    </AppShell>
  );
}
