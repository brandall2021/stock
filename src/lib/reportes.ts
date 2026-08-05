import { db } from "@/lib/db";
import { MovementType } from "@prisma/client";

export type StockRow = {
  id: string;
  name: string;
  category: string;
  stock: number;
  stockMin: number;
  purchasePrice: number;
};

export async function getStockRows(): Promise<StockRow[]> {
  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category?.name ?? "Sin categoría",
    stock: p.stock,
    stockMin: p.stockMin,
    purchasePrice: p.purchasePrice,
  }));
}

export async function getLowStockRows(): Promise<StockRow[]> {
  const rows = await getStockRows();
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
  hasta?: string
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
  return [...byProduct.values()].sort((a, b) => b.ingreso - a.ingreso);
}

export type SupplierRow = {
  name: string;
  ingresos: number;
  unidades: number;
  costo: number;
};

export async function getSupplierRows(): Promise<SupplierRow[]> {
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
  return [...bySupplier.values()].sort((a, b) => b.costo - a.costo);
}

export type ValorizationRow = {
  name: string;
  unidades: number;
  valor: number;
  pct: number;
};

export async function getValorizationRows(): Promise<ValorizationRow[]> {
  const products = await db.product.findMany({
    where: { active: true },
    include: { category: true },
  });

  const byCategory = new Map<
    string,
    { name: string; unidades: number; valor: number }
  >();
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

export async function getTopMovedRows(): Promise<MovedRow[]> {
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
    .sort((a, b) => b.movimientos - a.movimientos)
    .slice(0, 20);
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
