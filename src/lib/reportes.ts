import { db } from "@/lib/db";
import { MovementType } from "@prisma/client";

export type ReportFilters = { q?: string; categoria?: string; estado?: string };

export type StockRow = {
  id: string;
  name: string;
  category: string;
  stock: number;
  stockMin: number;
  purchasePrice: number;
};

function matchesQuery(value: string, q?: string) {
  return !q || value.toLowerCase().includes(q.toLowerCase());
}

export async function getStockRows(f: ReportFilters = {}): Promise<StockRow[]> {
  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return products
    .filter((p) => {
      if (!matchesQuery(p.name, f.q)) return false;
      if (f.categoria && (p.category?.name ?? "Sin categoría") !== f.categoria)
        return false;
      if (f.estado === "sin" && p.stock !== 0) return false;
      if (f.estado === "bajo" && !(p.stock > 0 && p.stock <= p.stockMin))
        return false;
      if (f.estado === "ok" && !(p.stock > p.stockMin)) return false;
      return true;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name ?? "Sin categoría",
      stock: p.stock,
      stockMin: p.stockMin,
      purchasePrice: p.purchasePrice,
    }));
}

export async function getLowStockRows(f: ReportFilters = {}): Promise<StockRow[]> {
  const rows = await getStockRows(f);
  return rows
    .filter((r) => r.stock <= r.stockMin)
    .sort((a, b) => a.stock - b.stock);
}

export type MovementPeriodRow = {
  name: string;
  ingreso: number;
  salida: number;
  costo: number;
};

export async function getMovementPeriodRows(
  desde?: string,
  hasta?: string,
  f: ReportFilters = {}
): Promise<MovementPeriodRow[]> {
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

  const byProduct = new Map<string, MovementPeriodRow>();
  for (const m of movements) {
    const row =
      byProduct.get(m.productId) ?? {
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
  return [...byProduct.values()]
    .filter((r) => matchesQuery(r.name, f.q))
    .sort((a, b) => b.ingreso - a.ingreso);
}

export async function getMovementCategoryRows(
  desde?: string,
  hasta?: string,
  f: ReportFilters = {}
): Promise<MovementPeriodRow[]> {
  const where: Record<string, unknown> = {};
  if (desde || hasta) {
    where.createdAt = {
      ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}),
      ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
    };
  }
  const movements = await db.stockMovement.findMany({
    where,
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byCategory = new Map<string, MovementPeriodRow>();
  for (const m of movements) {
    const key = m.product.categoryId ?? "sin";
    const row = byCategory.get(key) ?? {
      name: m.product.category?.name ?? "Sin categoría",
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
    byCategory.set(key, row);
  }
  return [...byCategory.values()]
    .filter((r) => matchesQuery(r.name, f.q))
    .sort((a, b) => b.ingreso - a.ingreso);
}

export type SupplierRow = {
  name: string;
  ingresos: number;
  unidades: number;
  costo: number;
};

export async function getSupplierRows(f: ReportFilters = {}): Promise<SupplierRow[]> {
  const movements = await db.stockMovement.findMany({
    where: { type: MovementType.INGRESO, supplierId: { not: null } },
    include: { supplier: true },
  });

  const bySupplier = new Map<string, SupplierRow>();
  for (const m of movements) {
    if (!m.supplier) continue;
    const row = bySupplier.get(m.supplierId!) ?? {
      name: m.supplier.name,
      ingresos: 0,
      unidades: 0,
      costo: 0,
    };
    row.unidades += m.quantity;
    row.costo += m.quantity * m.unitCost;
    row.ingresos += 1;
    bySupplier.set(m.supplierId!, row);
  }
  return [...bySupplier.values()]
    .filter((r) => matchesQuery(r.name, f.q))
    .sort((a, b) => b.costo - a.costo);
}

export type ValorizationRow = {
  name: string;
  unidades: number;
  valor: number;
  pct: number;
};

export async function getValorizationRows(f: ReportFilters = {}): Promise<ValorizationRow[]> {
  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true },
  });

  const byCategory = new Map<
    string,
    { name: string; unidades: number; valor: number }
  >();
  for (const p of products) {
    if (!matchesQuery(p.category?.name ?? "Sin categoría", f.q)) continue;
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
  return rows.map((r) => ({
    ...r,
    pct: total > 0 ? (r.valor / total) * 100 : 0,
  }));
}

export type MovedRow = {
  name: string;
  movimientos: number;
  unidades: number;
};

export async function getTopMovedRows(f: ReportFilters = {}): Promise<MovedRow[]> {
  const movements = await db.stockMovement.findMany({
    include: { product: true },
  });

  const byProduct = new Map<string, MovedRow>();
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
  return [...byProduct.values()]
    .filter((r) => matchesQuery(r.name, f.q))
    .sort((a, b) => b.movimientos - a.movimientos)
    .slice(0, 20);
}

export type AreaRow = {
  code: string;
  name: string;
  ingresos: number;
  salidas: number;
  movimientos: number;
  valor: number;
};

export async function getAreaRows(f: ReportFilters = {}): Promise<AreaRow[]> {
  const [areas, movements] = await Promise.all([
    db.area.findMany({ orderBy: { name: "asc" } }),
    db.stockMovement.findMany({ include: { area: true } }),
  ]);

  const byArea = new Map<
    string,
    { ingresos: number; salidas: number; movimientos: number; valor: number }
  >();
  for (const m of movements) {
    if (!m.areaId) continue;
    const row = byArea.get(m.areaId) ?? {
      ingresos: 0,
      salidas: 0,
      movimientos: 0,
      valor: 0,
    };
    row.movimientos += 1;
    if (m.type === MovementType.INGRESO) {
      row.ingresos += m.quantity;
      row.valor += m.quantity * m.unitCost;
    } else if (m.type === MovementType.SALIDA) {
      row.salidas += m.quantity;
    }
    byArea.set(m.areaId, row);
  }

  return areas
    .filter((a) => matchesQuery(a.name, f.q))
    .map((a) => {
      const row = byArea.get(a.id);
      return {
        code: a.code,
        name: a.name,
        ingresos: row?.ingresos ?? 0,
        salidas: row?.salidas ?? 0,
        movimientos: row?.movimientos ?? 0,
        valor: row?.valor ?? 0,
      };
    });
}

export type SortDir = "asc" | "desc";
export type SortSpec = { field: string; dir: SortDir } | null;

export function parseSort(raw?: string | null): SortSpec {
  if (!raw) return null;
  const desc = raw.startsWith("-");
  const field = desc ? raw.slice(1) : raw;
  return field ? { field, dir: desc ? "desc" : "asc" } : null;
}

export function sortRows<T>(
  rows: T[],
  sort: SortSpec,
  accessors: Record<string, (row: T) => string | number>
): T[] {
  if (!sort) return rows;
  const get = accessors[sort.field];
  if (!get) return rows;
  const dir = sort.dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = get(a);
    const bv = get(b);
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), "es", { numeric: true });
    return cmp * dir;
  });
}

export type CsvColumn<T> = { header: string; value: (row: T) => string | number };

export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.header)).join(";");
  const body = rows
    .map((r) => columns.map((c) => esc(c.value(r))).join(";"))
    .join("\r\n");
  return `\uFEFF${header}\r\n${body}`;
}
