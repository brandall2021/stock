import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/format";

const ROLE_PERMISSIONS: { role: string; permissions: string[] }[] = [
  {
    role: "ADMIN",
    permissions: [
      "Ver todo el inventario",
      "Registrar ingresos, salidas y ajustes",
      "Crear y editar productos, categorías y proveedores",
      "Administrar usuarios",
      "Acceder a reportes y alertas",
    ],
  },
  {
    role: "OPERADOR",
    permissions: [
      "Ver todo el inventario",
      "Registrar ingresos, salidas y ajustes",
      "Crear y editar productos",
      "Acceder a reportes y alertas",
    ],
  },
  {
    role: "CONSULTA",
    permissions: [
      "Ver inventario, movimientos y alertas",
      "Acceder a reportes (solo lectura)",
    ],
  },
];

export default async function ConfiguracionPage() {
  const user = await requireAuth();
  const counts = await Promise.all([
    db.product.count(),
    db.category.count(),
    db.supplier.count({ where: { active: true } }),
    db.user.count(),
  ]);

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Información general del sistema y permisos"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Sistema" />
          <div className="space-y-3 p-6 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nombre</span>
              <span className="font-semibold text-slate-900">Stock</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Módulo</span>
              <span className="text-slate-700">Gestión de inventario</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Productos</span>
              <span className="tnum font-semibold text-slate-900">{counts[0]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Categorías</span>
              <span className="tnum font-semibold text-slate-900">{counts[1]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Proveedores</span>
              <span className="tnum font-semibold text-slate-900">{counts[2]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Usuarios</span>
              <span className="tnum font-semibold text-slate-900">{counts[3]}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Permisos por rol" subtitle="Tu rol actual: Administrador" />
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
            {ROLE_PERMISSIONS.map((r) => (
              <div
                key={r.role}
                className={
                  "rounded-xl border p-4 " +
                  (r.role === user.role
                    ? "border-accent/40 bg-accent-soft"
                    : "border-line bg-white")
                }
              >
                <p className="text-sm font-semibold text-slate-900">
                  {ROLE_LABELS[r.role]}
                  {r.role === user.role && (
                    <span className="ml-1.5 text-[11px] font-medium text-accent">
                      · actual
                    </span>
                  )}
                </p>
                <ul className="mt-3 space-y-2">
                  {r.permissions.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-[13px] text-slate-600"
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
