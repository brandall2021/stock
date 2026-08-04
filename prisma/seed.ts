import { PrismaClient, Role, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
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

  const catNames = ["Electrónica", "Insumos", "Repuestos", "Alimentos", "Limpieza"];
  const categories = new Map<string, string>();
  for (const name of catNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, description: `Categoría ${name}` },
    });
    categories.set(name, cat.id);
  }

  const prov = await prisma.supplier.upsert({
    where: { name: "Distribuidora Central" },
    update: {},
    create: {
      name: "Distribuidora Central",
      taxId: "20-30123456-7",
      phone: "(0381) 444-0000",
      email: "ventas@central.com.ar",
      address: "Av. Alem 1200, San Miguel de Tucumán",
    },
  });

  const existing = await prisma.product.count();
  if (existing === 0) {
    const products = [
      {
        sku: "ELC-001",
        name: "Mouse inalámbrico",
        description: "Mouse 2.4GHz, 1200dpi",
        category: "Electrónica",
        purchasePrice: 8500,
        salePrice: 14500,
        stockMin: 5,
        stock: 12,
        location: "Depósito A",
      },
      {
        sku: "INS-001",
        name: "Resma papel A4",
        description: "Papel obra 75g, 500 hojas",
        category: "Insumos",
        purchasePrice: 7800,
        salePrice: 11000,
        stockMin: 10,
        stock: 4,
        location: "Depósito B",
      },
      {
        sku: "REP-001",
        name: "Toner HP 85A",
        description: "Tóner negro compatible HP 85A",
        category: "Repuestos",
        purchasePrice: 28000,
        salePrice: 45000,
        stockMin: 3,
        stock: 0,
        location: "Depósito A",
      },
      {
        sku: "ALI-001",
        name: "Café molido 500g",
        description: "Café tostado molido",
        category: "Alimentos",
        purchasePrice: 9000,
        salePrice: 13500,
        stockMin: 6,
        stock: 18,
        location: "Cocina",
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      },
      {
        sku: "LIM-001",
        name: "Detergente 750ml",
        description: "Detergente multiuso",
        category: "Limpieza",
        purchasePrice: 2400,
        salePrice: 3900,
        stockMin: 8,
        stock: 9,
        location: "Cocina",
      },
    ];

    for (const p of products) {
      const product = await prisma.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          description: p.description,
          categoryId: categories.get(p.category),
          purchasePrice: p.purchasePrice,
          salePrice: p.salePrice,
          stockMin: p.stockMin,
          stock: p.stock,
          location: p.location,
          expiryDate: p.expiryDate,
          suppliers: {
            create: { supplierId: prov.id },
          },
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: MovementType.AJUSTE,
          quantity: p.stock,
          unitCost: p.purchasePrice,
          reason: "Stock inicial (seed)",
          previousStock: 0,
          newStock: p.stock,
          userId: admin.id,
        },
      });
    }
  }

  console.log("Seed completado.");
  console.log("Usuarios: admin@stock.local / Admin123! · operador@stock.local / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
