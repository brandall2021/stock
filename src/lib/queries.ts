import { db } from "@/lib/db";

export async function getAlerts() {
  const active = { active: true };
  const now = new Date();
  const soon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

  const [zeroStock, expiring, all] = await Promise.all([
    db.product.findMany({
      where: { ...active, stock: 0 },
    }),
    db.product.findMany({
      where: {
        ...active,
        expiryDate: { not: null, lte: soon },
      },
    }),
    db.product.findMany({ where: active }),
  ]);

  const lowStockList = all.filter(
    (p) => p.stock > 0 && p.stock <= p.stockMin
  );

  return {
    lowStock: lowStockList,
    zeroStock,
    expiring: expiring.filter((p) => p.expiryDate && p.expiryDate >= now),
  };
}

export async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysAgo14 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 13);
  daysAgo14.setHours(0, 0, 0, 0);

  const [productCount, categoryCount, supplierCount, movements, products, categories, recent] =
    await Promise.all([
      db.product.count({ where: { active: true } }),
      db.category.count(),
      db.supplier.count({ where: { active: true } }),
      db.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { product: true, user: true },
      }),
      db.product.findMany({ where: { active: true } }),
      db.category.findMany(),
      db.stockMovement.findMany({
        where: { createdAt: { gte: daysAgo14 } },
        select: { type: true, quantity: true, createdAt: true },
      }),
    ]);

  const valorization = products.reduce(
    (acc, p) => acc + p.stock * p.purchasePrice,
    0
  );
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.stockMin
  ).length;
  const zeroStockCount = products.filter((p) => p.stock === 0).length;
  const okStockCount = productCount - lowStockCount - zeroStockCount;

  const monthMovements = recent.filter((m) => m.createdAt >= monthStart);
  const monthIn = monthMovements
    .filter((m) => m.type === "INGRESO")
    .reduce((a, m) => a + m.quantity, 0);
  const monthOut = monthMovements
    .filter((m) => m.type === "SALIDA")
    .reduce((a, m) => a + m.quantity, 0);

  const movementsByDay = buildMovementsByDay(recent, daysAgo14);

  const categoryName = new Map(
    categories.map((c) => [c.id, c.name])
  );
  const categoryMap = new Map<
    string,
    { name: string; units: number; value: number }
  >();
  for (const p of products) {
    const key = p.categoryId ?? "sin-categoria";
    const entry = categoryMap.get(key) ?? {
      name: categoryName.get(key) ?? "Sin categoría",
      units: 0,
      value: 0,
    };
    entry.units += p.stock;
    entry.value += p.stock * p.purchasePrice;
    categoryMap.set(key, entry);
  }
  const stockByCategory = [...categoryMap.values()].sort(
    (a, b) => b.units - a.units
  );

  const topMoved = await db.stockMovement.groupBy({
    by: ["productId"],
    where: {
      createdAt: { gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 90) },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 5,
  });

  const topMovedWithNames = topMoved
    .map((t) => {
      const p = products.find((x) => x.id === t.productId);
      return p ? { productName: p.name, productId: p.id, count: t._count.productId } : null;
    })
    .filter((x): x is { productName: string; productId: string; count: number } => x !== null);

  return {
    productCount,
    categoryCount,
    supplierCount,
    totalUnits,
    valorization,
    lowStockCount,
    zeroStockCount,
    okStockCount,
    monthIn,
    monthOut,
    movementsByDay,
    stockByCategory,
    statusDonut: [
      { name: "Disponible", value: okStockCount },
      { name: "Bajo stock", value: lowStockCount },
      { name: "Sin stock", value: zeroStockCount },
    ],
    topMoved: topMovedWithNames,
    movements,
  };
}

function buildMovementsByDay(
  recent: { type: string; quantity: number; createdAt: Date }[],
  from: Date
) {
  const days: { date: string; label: string; INGRESO: number; SALIDA: number; AJUSTE: number }[] = [];
  const fmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" });
  for (let d = new Date(from); d <= new Date(); d.setDate(d.getDate() + 1)) {
    days.push({
      date: d.toISOString().slice(0, 10),
      label: fmt.format(d),
      INGRESO: 0,
      SALIDA: 0,
      AJUSTE: 0,
    });
  }
  const map = new Map(days.map((d) => [d.date, d]));
  for (const m of recent) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const day = map.get(key);
    if (day && m.type in day) {
      day[m.type as "INGRESO" | "SALIDA" | "AJUSTE"] += m.quantity;
    }
  }
  return days;
}

export async function getSystemStatus() {
  const now = new Date();
  const soon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  const [products, expiring] = await Promise.all([
    db.product.findMany({ where: { active: true } }),
    db.product.count({
      where: {
        active: true,
        expiryDate: { not: null, lte: soon, gte: now },
      },
    }),
  ]);

  const alertCount =
    products.filter((p) => p.stock === 0 || p.stock <= p.stockMin).length +
    expiring;

  return {
    productCount: products.length,
    alertCount,
    lowStockCount: products.filter(
      (p) => p.stock > 0 && p.stock <= p.stockMin
    ).length,
    zeroStockCount: products.filter((p) => p.stock === 0).length,
    updatedAt: now,
  };
}

export async function getMovements(filters?: {
  type?: string;
  productId?: string;
  areaId?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.productId) where.productId = filters.productId;
  if (filters?.areaId) where.areaId = filters.areaId;
  if (filters?.from || filters?.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59`) } : {}),
    };
  }

  return db.stockMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters?.limit,
    include: { product: true, user: true, supplier: true, area: true },
  });
}

export async function getProductWithRelations(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      category: true,
      suppliers: { include: { supplier: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: true, supplier: true, area: true },
      },
    },
  });
}
