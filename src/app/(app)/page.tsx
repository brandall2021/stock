import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getAlerts, getDashboardStats } from "@/lib/queries";
import { Badge, Card, CardHeader, LinkButton, Td, Th } from "@/components/ui";
import { MovementBadge } from "@/components/MovementBadge";
import { MovementsAreaChart } from "@/components/charts/MovementsAreaChart";
import { StatusDonut } from "@/components/charts/StatusDonut";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconBox,
  IconChevronRight,
  IconReport,
} from "@/components/icons";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/lib/format";
import type { ReactNode } from "react";

const KPI_STYLES = {
  blue: "bg-accent-soft text-accent",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-danger-soft text-danger",
  slate: "bg-slate-100 text-slate-600",
} as const;

function KpiCard({
  label,
  value,
  href,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  href: string;
  icon: ReactNode;
  tone?: keyof typeof KPI_STYLES;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-line bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${KPI_STYLES[tone]}`}
        >
          {icon}
        </span>
        <IconChevronRight className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-slate-400" />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-900 tnum">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  await requireAuth();
  const stats = await getDashboardStats();
  const alerts = await getAlerts();

  const criticalAlerts = [
    ...alerts.zeroStock.map((p) => ({
      id: p.id,
      name: p.name,
      type: "out" as const,
      message: "Sin stock",
    })),
    ...alerts.lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      type: "low" as const,
      message: `Bajo mínimo (${formatNumber(p.stock)} de ${formatNumber(p.stockMin)})`,
    })),
    ...alerts.expiring.map((p) => ({
      id: p.id,
      name: p.name,
      type: "expiring" as const,
      message: "Vence en menos de 30 días",
    })),
  ].slice(0, 6);

  const maxMoved = Math.max(1, ...stats.topMoved.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Panel de control
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visión general del inventario
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/ingresos" variant="secondary">
            <IconArrowDown className="h-4 w-4 text-success" />
            Ingreso
          </LinkButton>
          <LinkButton href="/salidas" variant="secondary">
            <IconArrowUp className="h-4 w-4 text-danger" />
            Salida
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        <KpiCard
          label="Stock total"
          value={formatNumber(stats.totalUnits)}
          href="/movimientos"
          icon={<IconBox className="h-4.5 w-4.5" />}
          tone="blue"
        />
        <KpiCard
          label="Valor del inventario"
          value={formatCurrency(stats.valorization)}
          href="/reportes"
          icon={<IconReport className="h-4.5 w-4.5" />}
          tone="green"
        />
        <KpiCard
          label="Entradas del mes"
          value={`+${formatNumber(stats.monthIn)}`}
          href="/ingresos"
          icon={<IconArrowDown className="h-4.5 w-4.5" />}
          tone="green"
        />
        <KpiCard
          label="Salidas del mes"
          value={`−${formatNumber(stats.monthOut)}`}
          href="/salidas"
          icon={<IconArrowUp className="h-4.5 w-4.5" />}
          tone="red"
        />
        <KpiCard
          label="Productos activos"
          value={formatNumber(stats.productCount)}
          href="/productos"
          icon={<IconBox className="h-4.5 w-4.5" />}
          tone="slate"
        />
        <KpiCard
          label="Bajo stock"
          value={formatNumber(stats.lowStockCount)}
          href="/alertas"
          icon={<IconAlert className="h-4.5 w-4.5" />}
          tone="amber"
        />
        <KpiCard
          label="Sin stock"
          value={formatNumber(stats.zeroStockCount)}
          href="/alertas"
          icon={<IconAlert className="h-4.5 w-4.5" />}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Movimientos de stock"
            subtitle="Ingresos y salidas · últimos 14 días"
            actions={
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Ingresos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  Salidas
                </span>
              </div>
            }
          />
          <div className="p-6">
            <MovementsAreaChart data={stats.movementsByDay} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Estado del inventario" subtitle="Según stock actual" />
          <div className="p-6">
            <StatusDonut data={stats.statusDonut} />
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {stats.statusDonut.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background:
                          d.name === "Disponible"
                            ? "#16a34a"
                            : d.name === "Bajo stock"
                              ? "#f59e0b"
                              : "#dc2626",
                      }}
                    />
                    {d.name}
                  </span>
                  <b className="tnum text-slate-900">{d.value}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Stock por categoría" subtitle="Unidades en depósito" />
          <div className="p-6">
            <CategoryBarChart data={stats.stockByCategory} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Más movidos"
            subtitle="Últimos 90 días"
            actions={
              <Link href="/movimientos" className="text-xs font-medium text-accent hover:underline">
                Ver todo
              </Link>
            }
          />
          <div className="space-y-4 p-6">
            {stats.topMoved.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                Sin movimientos registrados.
              </p>
            )}
            {stats.topMoved.map((t, i) => (
              <div key={t.productId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-500 tnum">
                      {i + 1}
                    </span>
                    <Link
                      href={`/productos/${t.productId}`}
                      className="truncate font-medium hover:text-accent"
                    >
                      {t.productName}
                    </Link>
                  </span>
                  <b className="tnum text-slate-900">{t.count}</b>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-blue-400 transition-all"
                    style={{ width: `${(t.count / maxMoved) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-warning/30">
          <CardHeader
            title="Alertas críticas"
            subtitle={criticalAlerts.length > 0 ? `${criticalAlerts.length} de ${stats.lowStockCount + stats.zeroStockCount}` : "Sin alertas"}
            actions={
              <Link href="/alertas" className="text-xs font-medium text-accent hover:underline">
                Ver todas
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {criticalAlerts.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-500">
                Todo el inventario se encuentra dentro de los parámetros.
              </p>
            )}
            {criticalAlerts.map((a) => (
              <Link
                key={a.id}
                href={`/productos/${a.id}`}
                className="group flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-slate-50"
              >
                <span
                  className={
                    "h-2 w-2 shrink-0 rounded-full " +
                    (a.type === "out"
                      ? "bg-danger"
                      : a.type === "low"
                        ? "bg-warning"
                        : "bg-accent")
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 group-hover:text-accent">
                    {a.name}
                  </p>
                  <p className="text-xs text-slate-500">{a.message}</p>
                </div>
                <IconChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Últimos movimientos"
            subtitle="Actividad reciente del depósito"
            actions={
              <Link href="/movimientos" className="text-xs font-medium text-accent hover:underline">
                Ver todos
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Producto</Th>
                  <Th>Tipo</Th>
                  <Th className="text-right">Cant.</Th>
                  <Th>Usuario</Th>
                  <Th>Fecha</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.movements.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-slate-50">
                    <Td>
                      <Link
                        href={`/productos/${m.productId}`}
                        className="font-medium text-slate-800 hover:text-accent"
                      >
                        {m.product.name}
                      </Link>
                    </Td>
                    <Td>
                      <MovementBadge type={m.type} />
                    </Td>
                    <Td
                      className={
                        "text-right font-semibold tnum " +
                        (m.quantity < 0
                          ? "text-danger"
                          : "text-success")
                      }
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </Td>
                    <Td className="text-slate-500">{m.user.name}</Td>
                    <Td className="tnum text-slate-500">
                      {formatDateTime(m.createdAt)}
                    </Td>
                  </tr>
                ))}
                {stats.movements.length === 0 && (
                  <tr>
                    <Td className="py-10 text-center text-slate-500" >
                      Aún no hay movimientos registrados.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
