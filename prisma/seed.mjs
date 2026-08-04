import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIES, CATALOG } from "./catalog.mjs";

const prisma = new PrismaClient();

const DEMO_SKUS = ["ELC-001", "INS-001", "REP-001", "ALI-001", "LIM-001"];
const DEMO_CATS = ["Electrónica", "Insumos", "Repuestos", "Alimentos", "Limpieza"];

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@stock.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@stock.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "operador@stock.local" },
    update: {},
    create: {
      name: "Operador",
      email: "operador@stock.local",
      passwordHash,
      role: Role.OPERADOR,
    },
  });

  const before = await prisma.product.count();

  await prisma.product.deleteMany({ where: { sku: { in: DEMO_SKUS } } });
  for (const name of DEMO_CATS) {
    const cat = await prisma.category.findUnique({
      where: { name },
      include: { _count: { select: { products: true } } },
    });
    if (cat && cat._count.products === 0) {
      await prisma.category.delete({ where: { id: cat.id } });
    }
  }

  const catIds = {};
  for (const [prefix, name] of Object.entries(CATEGORIES)) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `Catálogo grupo ${prefix}` },
    });
    catIds[prefix] = cat.id;
  }

  for (const [sku, name] of CATALOG) {
    await prisma.product.upsert({
      where: { sku },
      update: {},
      create: { sku, name, categoryId: catIds[sku[0]] },
    });
  }

  const after = await prisma.product.count();
  const totalCategories = await prisma.category.count();

  console.log("Seed completado.");
  console.log(`Productos: ${after} (importados ${after - before})`);
  console.log(`Categorías: ${totalCategories}`);
  console.log("Usuarios: admin@stock.local / Admin123! · operador@stock.local / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
