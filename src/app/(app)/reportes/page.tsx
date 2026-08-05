import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { Card, PageHeader, Td, Th, EmptyState, Badge } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  getAreaRows,
  getLowStockRows,
  getMovementCategoryRows,
  getMovementPeriodRows,
  getStockRows,
  getSupplierRows,
  getTopMovedRows,
  getValorizationRows,
} from "@/lib/reportes";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "stock", label: "Stock actual" },
  { key: "bajo", label: "Bajo stock" },
  { key: "movimientos", label: "Movimientos por período" },
  { key: "movcat", label: "Movimientos por categoría" },
  { key: "areas", label: "Por área" },
  { key: "proveedores", label: "Entradas por proveedor" },
  { key: "valorizacion", label: "Valorización" },
  { key: "movidos", label: "Más movidos" },
];

function DownloadButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
    >
      <span aria-hidden>⬇</span> Descargar CSV
    </a>
  );
}

function PeriodFilter({
  tab,
  desde,
  hasta,
}: {
  tab: string;
  desde?: string;
  hasta?: string;
}) {
  return (
    <form method="GET" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="tab" value={tab} />
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Desde</label>
        <input
          type="date"
          name="desde"
          defaultValue={desde ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Hasta</label>
        <input
          type="date"
          name="hasta"
          defaultValue={hasta ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Aplicar
      </button>
    </form>
  );
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; desde?: string; hasta?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const tab = TABS.some((t) => t.key === params.tab) ? params.tab! : "stock";

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Análisis del inventario"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/reportes?tab=${t.key}`}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-indigo-600 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            )}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === "stock" && <StockActual />}
      {tab === "bajo" && <BajoStock />}
      {tab === "movimientos" && <MovimientosPorPeriodo desde={params.desde} hasta={params.hasta} />}
      {tab === "movcat" && <MovimientosPorCategoria desde={params.desde} hasta={params.hasta} />}
      {tab === "areas" && <PorArea />}
      {tab === "proveedores" && <EntradasPorProveedor />}
      {tab === "valorizacion" && <Valorizacion />}
      {tab === "movidos" && <MasMovidos />}
    </div>
  );
}

async function StockActual() {
  const rows = await getStockRows();
  const totalValue = rows.reduce((a, r) => a + r.stock * r.purchasePrice, 0);
  const totalUnits = rows.reduce((a, r) => a + r.stock, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <p className="text-sm text-zinc-500">
          <b className="text-zinc-900">{rows.length}</b> productos ·{" "}
          <b className="text-zinc-900">{formatNumber(totalUnits)}</b> unidades · valor{" "}
          <b className="text-zinc-900">{formatCurrency(totalValue)}</b>
        </p>
        <DownloadButton href="/api/reportes?tab=stock" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Producto</Th>
              <Th>Categoría</Th>
              <Th className="text-right">Stock</Th>
              <Th className="text-right">Mínimo</Th>
              <Th className="text-right">Costo unit.</Th>
              <Th className="text-right">Valor total</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link
                    href={`/productos/${p.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </Td>
                <Td>{p.category}</Td>
                <Td
                  className={
                    "text-right font-semibold " +
                    (p.stock === 0
                      ? "text-red-600"
                      : p.stock <= p.stockMin
                        ? "text-amber-600"
                        : "text-emerald-600")
                  }
                >
                  {formatNumber(p.stock)}
                </Td>
                <Td className="text-right">{formatNumber(p.stockMin)}</Td>
                <Td className="text-right">{formatCurrency(p.purchasePrice)}</Td>
                <Td className="text-right">{formatCurrency(p.stock * p.purchasePrice)}</Td>
                <Td>
                  {p.stock === 0 ? (
                    <Badge color="red">Sin stock</Badge>
                  ) : p.stock <= p.stockMin ? (
                    <Badge color="amber">Bajo</Badge>
                  ) : (
                    <Badge color="green">OK</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

async function BajoStock() {
  const rows = await getLowStockRows();

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <p className="text-sm text-zinc-500">
          <b className="text-red-600">{rows.length}</b> productos por debajo o igual al mínimo
        </p>
        <DownloadButton href="/api/reportes?tab=bajo" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Producto</Th>
              <Th className="text-right">Stock</Th>
              <Th className="text-right">Mínimo</Th>
              <Th className="text-right">Diferencia</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link
                    href={`/productos/${p.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </Td>
                <Td className="text-right font-semibold text-red-600">
                  {formatNumber(p.stock)}
                </Td>
                <Td className="text-right">{formatNumber(p.stockMin)}</Td>
                <Td className="text-right text-amber-600">
                  {formatNumber(p.stockMin - p.stock)} para reponer
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState message="Todo el stock está por encima del mínimo." />}
      </div>
    </Card>
  );
}

async function MovimientosPorPeriodo({
  desde,
  hasta,
}: {
  desde?: string;
  hasta?: string;
}) {
  const rows = await getMovementPeriodRows(desde, hasta);
  const params = new URLSearchParams({ tab: "movimientos" });
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <PeriodFilter tab="movimientos" desde={desde} hasta={hasta} />
        <DownloadButton href={`/api/reportes?${params.toString()}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Producto</Th>
              <Th className="text-right">Ingresos</Th>
              <Th className="text-right">Salidas</Th>
              <Th className="text-right">Costo ingresado</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <Td className="font-medium text-zinc-900">{r.name}</Td>
                <Td className="text-right font-semibold text-emerald-600">
                  +{formatNumber(r.ingreso)}
                </Td>
                <Td className="text-right font-semibold text-red-600">
                  -{formatNumber(r.salida)}
                </Td>
                <Td className="text-right">{formatCurrency(r.costo)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState message="Sin movimientos en el período seleccionado." />
        )}
      </div>
    </Card>
  );
}

async function MovimientosPorCategoria({
  desde,
  hasta,
}: {
  desde?: string;
  hasta?: string;
}) {
  const rows = await getMovementCategoryRows(desde, hasta);
  const params = new URLSearchParams({ tab: "movcat" });
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <PeriodFilter tab="movcat" desde={desde} hasta={hasta} />
        <DownloadButton href={`/api/reportes?${params.toString()}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Categoría</Th>
              <Th className="text-right">Ingresos</Th>
              <Th className="text-right">Salidas</Th>
              <Th className="text-right">Costo ingresado</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <Td className="font-medium text-zinc-900">{r.name}</Td>
                <Td className="text-right font-semibold text-emerald-600">
                  +{formatNumber(r.ingreso)}
                </Td>
                <Td className="text-right font-semibold text-red-600">
                  -{formatNumber(r.salida)}
                </Td>
                <Td className="text-right">{formatCurrency(r.costo)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState message="Sin movimientos en el período seleccionado." />
        )}
      </div>
    </Card>
  );
}

async function PorArea() {
  const rows = await getAreaRows();
  const conMovimientos = rows.filter((r) => r.movimientos > 0).length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <p className="text-sm text-zinc-500">
          <b className="text-zinc-900">{rows.length}</b> áreas ·{" "}
          <b className="text-zinc-900">{conMovimientos}</b> con movimientos
        </p>
        <DownloadButton href="/api/reportes?tab=areas" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Área</Th>
              <Th className="text-right">Movimientos</Th>
              <Th className="text-right">Ingresos</Th>
              <Th className="text-right">Salidas</Th>
              <Th className="text-right">Valor ingresado</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.code}>
                <Td className="font-medium text-zinc-900">
                  <span className="text-zinc-400">{r.code}</span> · {r.name}
                </Td>
                <Td className="text-right">{formatNumber(r.movimientos)}</Td>
                <Td className="text-right font-semibold text-emerald-600">
                  +{formatNumber(r.ingresos)}
                </Td>
                <Td className="text-right font-semibold text-red-600">
                  -{formatNumber(r.salidas)}
                </Td>
                <Td className="text-right">{formatCurrency(r.valor)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState message="No hay áreas cargadas." />
        )}
      </div>
    </Card>
  );
}

async function EntradasPorProveedor() {
  const rows = await getSupplierRows();

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <p className="text-sm font-medium text-zinc-900">Entradas por proveedor</p>
        <DownloadButton href="/api/reportes?tab=proveedores" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Proveedor</Th>
              <Th className="text-right">Ingresos</Th>
              <Th className="text-right">Unidades</Th>
              <Th className="text-right">Total comprado</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <Td className="font-medium text-zinc-900">{r.name}</Td>
                <Td className="text-right">{formatNumber(r.ingresos)}</Td>
                <Td className="text-right">{formatNumber(r.unidades)}</Td>
                <Td className="text-right font-semibold">{formatCurrency(r.costo)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState message="No hay ingresos con proveedor registrados." />
        )}
      </div>
    </Card>
  );
}

async function Valorizacion() {
  const rows = await getValorizationRows();
  const total = rows.reduce((a, r) => a + r.valor, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <p className="text-sm text-zinc-500">
          Valorización total del inventario:{" "}
          <b className="text-zinc-900">{formatCurrency(total)}</b>
        </p>
        <DownloadButton href="/api/reportes?tab=valorizacion" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Categoría</Th>
              <Th className="text-right">Unidades</Th>
              <Th className="text-right">Valor</Th>
              <Th className="text-right">% del total</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.name}>
                <Td className="font-medium text-zinc-900">{r.name}</Td>
                <Td className="text-right">{formatNumber(r.unidades)}</Td>
                <Td className="text-right">{formatCurrency(r.valor)}</Td>
                <Td className="text-right text-zinc-500">{r.pct.toFixed(1)}%</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

async function MasMovidos() {
  const rows = await getTopMovedRows();

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
        <p className="text-sm font-medium text-zinc-900">Productos más movidos</p>
        <DownloadButton href="/api/reportes?tab=movidos" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>Producto</Th>
              <Th className="text-right">Movimientos</Th>
              <Th className="text-right">Unidades</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r, i) => (
              <tr key={r.name}>
                <Td className="font-medium text-zinc-900">
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-xs text-zinc-500">
                    {i + 1}
                  </span>
                  {r.name}
                </Td>
                <Td className="text-right">{formatNumber(r.movimientos)}</Td>
                <Td className="text-right">{formatNumber(r.unidades)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState message="No hay movimientos registrados." />
        )}
      </div>
    </Card>
  );
}
