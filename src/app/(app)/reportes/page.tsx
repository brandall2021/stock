import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader, Td, Th, EmptyState, Badge } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
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
  parseSort,
  sortRows,
  type ReportFilters,
  type SortSpec,
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

function DownloadButton({ base }: { base: URLSearchParams }) {
  const href = `/api/reportes?${base.toString()}`;
  return (
    <a
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
    >
      <span aria-hidden>⬇</span> Descargar CSV
    </a>
  );
}

function ReportActions({ base }: { base: URLSearchParams }) {
  return (
    <div className="flex shrink-0 items-center gap-2 print:hidden">
      <PrintButton />
      <DownloadButton base={base} />
    </div>
  );
}

function PrintHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 hidden print:block">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        Reporte
      </p>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}

function SortableTh({
  field,
  label,
  sort,
  base,
  align = "left",
}: {
  field: string;
  label: string;
  sort: SortSpec;
  base: URLSearchParams;
  align?: "left" | "right";
}) {
  const active = sort?.field === field;
  const nextDir = active && sort.dir === "asc" ? "desc" : "asc";
  const next = new URLSearchParams(base);
  next.set("sort", `${nextDir === "desc" ? "-" : ""}${field}`);
  const Arrow = active ? (sort.dir === "asc" ? "▲" : "▼") : "↕";

  return (
    <Th className={align === "right" ? "text-right" : undefined}>
      <a
        href={`/reportes?${next.toString()}`}
        className={cn(
          "inline-flex items-center gap-1 font-semibold uppercase tracking-wider transition-colors hover:text-indigo-600",
          active && "text-indigo-600"
        )}
      >
        {label}
        <span aria-hidden className="text-[9px] leading-none">
          {Arrow}
        </span>
      </a>
    </Th>
  );
}

const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900";

function ReportFilter({
  tab,
  sort,
  q,
  categoria,
  estado,
  desde,
  hasta,
  categorias,
  showCategoria,
  showEstado,
  showPeriodo,
}: {
  tab: string;
  sort: SortSpec;
  q?: string;
  categoria?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
  categorias: { name: string }[];
  showCategoria?: boolean;
  showEstado?: boolean;
  showPeriodo?: boolean;
}) {
  const active = Boolean(q || categoria || estado || desde || hasta);
  return (
    <form method="GET" className="flex flex-wrap items-end gap-3 print:hidden">
      <input type="hidden" name="tab" value={tab} />
      <input
        type="hidden"
        name="sort"
        value={sort ? `${sort.dir === "desc" ? "-" : ""}${sort.field}` : ""}
      />
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Buscar</label>
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Nombre, código…"
          className={inputCls}
        />
      </div>
      {showCategoria && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Categoría</label>
          <select name="categoria" defaultValue={categoria ?? ""} className={inputCls}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {showEstado && (
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Estado</label>
          <select name="estado" defaultValue={estado ?? ""} className={inputCls}>
            <option value="">Todos</option>
            <option value="sin">Sin stock</option>
            <option value="bajo">Bajo</option>
            <option value="ok">OK</option>
          </select>
        </div>
      )}
      {showPeriodo && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Desde</label>
            <input
              type="date"
              name="desde"
              defaultValue={desde ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Hasta</label>
            <input
              type="date"
              name="hasta"
              defaultValue={hasta ?? ""}
              className={inputCls}
            />
          </div>
        </>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Filtrar
        </button>
        {active && (
          <a
            href={`/reportes?tab=${tab}`}
            className="flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Limpiar
          </a>
        )}
      </div>
    </form>
  );
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    desde?: string;
    hasta?: string;
    sort?: string;
    q?: string;
    categoria?: string;
    estado?: string;
  }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const tab = TABS.some((t) => t.key === params.tab) ? params.tab! : "stock";
  const sort = parseSort(params.sort);
  const categorias = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const filtros = {
    q: params.q,
    categoria: params.categoria,
    estado: params.estado,
  };

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Reportes"
          description="Análisis del inventario"
        />
      </div>

      <PrintHeader
        title={TABS.find((t) => t.key === tab)?.label ?? "Stock actual"}
        subtitle={`Generado el ${new Date().toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`}
      />

      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
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

      {tab === "stock" && (
        <StockActual
          sort={sort}
          filtros={filtros}
          categorias={categorias}
        />
      )}
      {tab === "bajo" && (
        <BajoStock sort={sort} filtros={filtros} categorias={categorias} />
      )}
      {tab === "movimientos" && (
        <MovimientosPorPeriodo
          sort={sort}
          filtros={filtros}
          desde={params.desde}
          hasta={params.hasta}
        />
      )}
      {tab === "movcat" && (
        <MovimientosPorCategoria
          sort={sort}
          filtros={filtros}
          desde={params.desde}
          hasta={params.hasta}
        />
      )}
      {tab === "areas" && <PorArea sort={sort} filtros={filtros} />}
      {tab === "proveedores" && <EntradasPorProveedor sort={sort} filtros={filtros} />}
      {tab === "valorizacion" && <Valorizacion sort={sort} filtros={filtros} />}
      {tab === "movidos" && <MasMovidos sort={sort} filtros={filtros} />}
    </div>
  );
}

async function StockActual({
  sort,
  filtros,
  categorias,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
  categorias: { name: string }[];
}) {
  const base = new URLSearchParams({ tab: "stock" });
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  if (filtros.categoria) base.set("categoria", filtros.categoria);
  if (filtros.estado) base.set("estado", filtros.estado);
  const rows = sortRows(await getStockRows(filtros), sort, {
    name: (r) => r.name,
    category: (r) => r.category,
    stock: (r) => r.stock,
    stockMin: (r) => r.stockMin,
    purchasePrice: (r) => r.purchasePrice,
    valor: (r) => r.stock * r.purchasePrice,
  });
  const totalValue = rows.reduce((a, r) => a + r.stock * r.purchasePrice, 0);
  const totalUnits = rows.reduce((a, r) => a + r.stock, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter
          tab="stock"
          sort={sort}
          q={filtros.q}
          categoria={filtros.categoria}
          estado={filtros.estado}
          categorias={categorias}
          showCategoria
          showEstado
        />
        <p className="text-sm text-zinc-500">
          <b className="text-zinc-900">{rows.length}</b> productos ·{" "}
          <b className="text-zinc-900">{formatNumber(totalUnits)}</b> unidades · valor{" "}
          <b className="text-zinc-900">{formatCurrency(totalValue)}</b>
        </p>
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <SortableTh field="name" label="Producto" sort={sort} base={base} />
              <SortableTh field="category" label="Categoría" sort={sort} base={base} />
              <SortableTh field="stock" label="Stock" sort={sort} base={base} align="right" />
              <SortableTh field="stockMin" label="Mínimo" sort={sort} base={base} align="right" />
              <SortableTh field="purchasePrice" label="Costo unit." sort={sort} base={base} align="right" />
              <SortableTh field="valor" label="Valor total" sort={sort} base={base} align="right" />
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

async function BajoStock({
  sort,
  filtros,
  categorias,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
  categorias: { name: string }[];
}) {
  const base = new URLSearchParams({ tab: "bajo" });
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  if (filtros.categoria) base.set("categoria", filtros.categoria);
  const rows = sortRows(await getLowStockRows(filtros), sort, {
    name: (r) => r.name,
    stock: (r) => r.stock,
    stockMin: (r) => r.stockMin,
    diferencia: (r) => r.stockMin - r.stock,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter
          tab="bajo"
          sort={sort}
          q={filtros.q}
          categoria={filtros.categoria}
          categorias={categorias}
          showCategoria
        />
        <p className="text-sm text-zinc-500">
          <b className="text-red-600">{rows.length}</b> productos por debajo o igual al mínimo
        </p>
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <SortableTh field="name" label="Producto" sort={sort} base={base} />
              <SortableTh field="stock" label="Stock" sort={sort} base={base} align="right" />
              <SortableTh field="stockMin" label="Mínimo" sort={sort} base={base} align="right" />
              <SortableTh field="diferencia" label="Diferencia" sort={sort} base={base} align="right" />
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
  sort,
  filtros,
  desde,
  hasta,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
  desde?: string;
  hasta?: string;
}) {
  const base = new URLSearchParams({ tab: "movimientos" });
  if (desde) base.set("desde", desde);
  if (hasta) base.set("hasta", hasta);
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  const rows = sortRows(await getMovementPeriodRows(desde, hasta, filtros), sort, {
    name: (r) => r.name,
    ingreso: (r) => r.ingreso,
    salida: (r) => r.salida,
    costo: (r) => r.costo,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter
          tab="movimientos"
          sort={sort}
          q={filtros.q}
          desde={desde}
          hasta={hasta}
          categorias={[]}
          showPeriodo
        />
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <SortableTh field="name" label="Producto" sort={sort} base={base} />
              <SortableTh field="ingreso" label="Ingresos" sort={sort} base={base} align="right" />
              <SortableTh field="salida" label="Salidas" sort={sort} base={base} align="right" />
              <SortableTh field="costo" label="Costo ingresado" sort={sort} base={base} align="right" />
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
  sort,
  filtros,
  desde,
  hasta,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
  desde?: string;
  hasta?: string;
}) {
  const base = new URLSearchParams({ tab: "movcat" });
  if (desde) base.set("desde", desde);
  if (hasta) base.set("hasta", hasta);
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  const rows = sortRows(await getMovementCategoryRows(desde, hasta, filtros), sort, {
    name: (r) => r.name,
    ingreso: (r) => r.ingreso,
    salida: (r) => r.salida,
    costo: (r) => r.costo,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter
          tab="movcat"
          sort={sort}
          q={filtros.q}
          desde={desde}
          hasta={hasta}
          categorias={[]}
          showPeriodo
        />
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <SortableTh field="name" label="Categoría" sort={sort} base={base} />
              <SortableTh field="ingreso" label="Ingresos" sort={sort} base={base} align="right" />
              <SortableTh field="salida" label="Salidas" sort={sort} base={base} align="right" />
              <SortableTh field="costo" label="Costo ingresado" sort={sort} base={base} align="right" />
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

async function PorArea({
  sort,
  filtros,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
}) {
  const base = new URLSearchParams({ tab: "areas" });
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  const rows = sortRows(await getAreaRows(filtros), sort, {
    name: (r) => r.name,
    code: (r) => r.code,
    movimientos: (r) => r.movimientos,
    ingresos: (r) => r.ingresos,
    salidas: (r) => r.salidas,
    valor: (r) => r.valor,
  });
  const conMovimientos = rows.filter((r) => r.movimientos > 0).length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter
          tab="areas"
          sort={sort}
          q={filtros.q}
          categorias={[]}
        />
        <p className="text-sm text-zinc-500">
          <b className="text-zinc-900">{rows.length}</b> áreas ·{" "}
          <b className="text-zinc-900">{conMovimientos}</b> con movimientos
        </p>
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <SortableTh field="name" label="Área" sort={sort} base={base} />
              <SortableTh field="movimientos" label="Movimientos" sort={sort} base={base} align="right" />
              <SortableTh field="ingresos" label="Ingresos" sort={sort} base={base} align="right" />
              <SortableTh field="salidas" label="Salidas" sort={sort} base={base} align="right" />
              <SortableTh field="valor" label="Valor ingresado" sort={sort} base={base} align="right" />
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

async function EntradasPorProveedor({
  sort,
  filtros,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
}) {
  const base = new URLSearchParams({ tab: "proveedores" });
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  const rows = sortRows(await getSupplierRows(filtros), sort, {
    name: (r) => r.name,
    ingresos: (r) => r.ingresos,
    unidades: (r) => r.unidades,
    costo: (r) => r.costo,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter
          tab="proveedores"
          sort={sort}
          q={filtros.q}
          categorias={[]}
        />
        <p className="text-sm font-medium text-zinc-900">Entradas por proveedor</p>
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <SortableTh field="name" label="Proveedor" sort={sort} base={base} />
              <SortableTh field="ingresos" label="Ingresos" sort={sort} base={base} align="right" />
              <SortableTh field="unidades" label="Unidades" sort={sort} base={base} align="right" />
              <SortableTh field="costo" label="Total comprado" sort={sort} base={base} align="right" />
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

async function Valorizacion({
  sort,
  filtros,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
}) {
  const base = new URLSearchParams({ tab: "valorizacion" });
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  const rows = sortRows(await getValorizationRows(filtros), sort, {
    name: (r) => r.name,
    unidades: (r) => r.unidades,
    valor: (r) => r.valor,
    pct: (r) => r.pct,
  });
  const total = rows.reduce((a, r) => a + r.valor, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter
          tab="valorizacion"
          sort={sort}
          q={filtros.q}
          categorias={[]}
        />
        <p className="text-sm text-zinc-500">
          Valorización total del inventario:{" "}
          <b className="text-zinc-900">{formatCurrency(total)}</b>
        </p>
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <SortableTh field="name" label="Categoría" sort={sort} base={base} />
              <SortableTh field="unidades" label="Unidades" sort={sort} base={base} align="right" />
              <SortableTh field="valor" label="Valor" sort={sort} base={base} align="right" />
              <SortableTh field="pct" label="% del total" sort={sort} base={base} align="right" />
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

async function MasMovidos({
  sort,
  filtros,
}: {
  sort: SortSpec;
  filtros: ReportFilters;
}) {
  const base = new URLSearchParams({ tab: "movidos" });
  if (sort) base.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.field}`);
  if (filtros.q) base.set("q", filtros.q);
  const rows = sortRows(await getTopMovedRows(filtros), sort, {
    name: (r) => r.name,
    movimientos: (r) => r.movimientos,
    unidades: (r) => r.unidades,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <ReportFilter tab="movidos" sort={sort} q={filtros.q} categorias={[]} />
        <p className="text-sm font-medium text-zinc-900">Productos más movidos</p>
        <ReportActions base={base} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <Th>#</Th>
              <SortableTh field="name" label="Producto" sort={sort} base={base} />
              <SortableTh field="movimientos" label="Movimientos" sort={sort} base={base} align="right" />
              <SortableTh field="unidades" label="Unidades" sort={sort} base={base} align="right" />
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
