import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader, Td, Th, EmptyState, Badge } from "@/components/ui";
import {
  formatCurrency,
  formatNumber,
} from "@/lib/format";
import { MovementType } from "@prisma/client";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "stock", label: "Stock actual" },
  { key: "bajo", label: "Bajo stock" },
  { key: "movimientos", label: "Movimientos por período" },
  { key: "proveedores", label: "Entradas por proveedor" },
  { key: "valorizacion", label: "Valorización" },
  { key: "movidos", label: "Más movidos" },
];

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
      {tab === "proveedores" && <EntradasPorProveedor />}
      {tab === "valorizacion" && <Valorizacion />}
      {tab === "movidos" && <MasMovidos />}
    </div>
  );
}

async function StockActual() {
  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  const totalValue = products.reduce((a, p) => a + p.stock * p.purchasePrice, 0);
  const totalUnits = products.reduce((a, p) => a + p.stock, 0);

  return (
    <Card>
      <div className="border-b border-zinc-200 px-6 py-4">
        <p className="text-sm text-zinc-500">
          <b className="text-zinc-900">{products.length}</b> productos ·{" "}
          <b className="text-zinc-900">{formatNumber(totalUnits)}</b> unidades · valor{" "}
          <b className="text-zinc-900">{formatCurrency(totalValue)}</b>
        </p>
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
            {products.map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link
                    href={`/productos/${p.id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </Td>
                <Td>{p.category?.name ?? "—"}</Td>
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
  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { stock: "asc" },
  });
  const low = products.filter((p) => p.stock <= p.stockMin);

  return (
    <Card>
      <div className="border-b border-zinc-200 px-6 py-4">
        <p className="text-sm text-zinc-500">
          <b className="text-red-600">{low.length}</b> productos por debajo o igual al mínimo
        </p>
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
            {low.map((p) => (
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
        {low.length === 0 && <EmptyState message="Todo el stock está por encima del mínimo." />}
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
  const where: Record<string, unknown> = {};
  if (desde || hasta) {
    where.createdAt = {
      ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}),
      ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
    };
  }
  const movements = await db.stockMovement.findMany({
    where,
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  const byProduct = new Map<
    string,
    { name: string; ingreso: number; salida: number; costo: number }
  >();
  for (const m of movements) {
    const row = byProduct.get(m.productId) ?? {
      name: m.product.name,
      ingreso: 0,
      salida: 0,
      costo: 0,
    };
    if (m.type === MovementType.INGRESO) {
      row.ingreso += m.quantity;
      row.costo += m.quantity * m.unitCost;
    } else if (m.type === MovementType.SALIDA) {
      row.salida += m.quantity;
    }
    byProduct.set(m.productId, row);
  }
  const rows = [...byProduct.values()].sort(
    (a, b) => b.ingreso - a.ingreso
  );

  return (
    <Card>
      <div className="border-b border-zinc-200 px-6 py-4">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="tab" value="movimientos" />
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

async function EntradasPorProveedor() {
  const movements = await db.stockMovement.findMany({
    where: { type: MovementType.INGRESO, supplierId: { not: null } },
    include: { supplier: true },
  });

  const bySupplier = new Map<string, { name: string; cantidad: number; costo: number; ordenes: number }>();
  for (const m of movements) {
    if (!m.supplier) continue;
    const row = bySupplier.get(m.supplierId!) ?? {
      name: m.supplier.name,
      cantidad: 0,
      costo: 0,
      ordenes: 0,
    };
    row.cantidad += m.quantity;
    row.costo += m.quantity * m.unitCost;
    row.ordenes += 1;
    bySupplier.set(m.supplierId!, row);
  }
  const rows = [...bySupplier.values()].sort((a, b) => b.costo - a.costo);

  return (
    <Card>
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
                <Td className="text-right">{formatNumber(r.ordenes)}</Td>
                <Td className="text-right">{formatNumber(r.cantidad)}</Td>
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
  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true },
  });

  const byCategory = new Map<string, { name: string; unidades: number; valor: number }>();
  for (const p of products) {
    const key = p.categoryId ?? "sin";
    const row = byCategory.get(key) ?? {
      name: p.category?.name ?? "Sin categoría",
      unidades: 0,
      valor: 0,
    };
    row.unidades += p.stock;
    row.valor += p.stock * p.purchasePrice;
    byCategory.set(key, row);
  }
  const rows = [...byCategory.values()].sort((a, b) => b.valor - a.valor);
  const total = rows.reduce((a, r) => a + r.valor, 0);

  return (
    <Card>
      <div className="border-b border-zinc-200 px-6 py-4">
        <p className="text-sm text-zinc-500">
          Valorización total del inventario:{" "}
          <b className="text-zinc-900">{formatCurrency(total)}</b>
        </p>
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
                <Td className="text-right text-zinc-500">
                  {total > 0 ? ((r.valor / total) * 100).toFixed(1) : "0.0"}%
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

async function MasMovidos() {
  const movements = await db.stockMovement.findMany({
    include: { product: true },
  });

  const byProduct = new Map<string, { name: string; movimientos: number; unidades: number }>();
  for (const m of movements) {
    const row = byProduct.get(m.productId) ?? {
      name: m.product.name,
      movimientos: 0,
      unidades: 0,
    };
    row.movimientos += 1;
    row.unidades += Math.abs(m.quantity);
    byProduct.set(m.productId, row);
  }
  const rows = [...byProduct.values()]
    .sort((a, b) => b.movimientos - a.movimientos)
    .slice(0, 20);

  return (
    <Card>
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
