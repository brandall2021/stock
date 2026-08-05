import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

function parseNumber(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "#N/A" || s === "$ -" || s === "-") return null;
  let n = s;
  if (n.includes(",")) {
    n = n.replace(/\./g, "").replace(",", ".");
  }
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

async function main() {
  const csvPath = join(__dirname, "inventario.csv");
  const raw = readFileSync(csvPath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1);

  let libreria = await prisma.category.findUnique({
    where: { name: "Librería" },
  });
  if (!libreria) {
    libreria = await prisma.category.create({ data: { name: "Librería" } });
  }

  const porSku = new Map();
  let duplicados = 0;
  let sinCodigo = 0;

  for (const line of lines) {
    const [codigo, barcode, nombre, stockRaw, precioRaw] = line
      .split(",")
      .map((c) => c.trim());
    const name = nombre?.replace(/\s+/g, " ").trim();
    if (!name) continue;

    const sku = codigo || barcode;
    if (!sku) {
      sinCodigo++;
      continue;
    }

    const stock = parseNumber(stockRaw);
    const prev = porSku.get(sku);
    if (prev) {
      if (prev.stock == null && stock != null) {
        porSku.set(sku, { name, barcode, stock, precio: parseNumber(precioRaw) });
      }
      duplicados++;
      continue;
    }
    porSku.set(sku, { name, barcode, stock, precio: parseNumber(precioRaw) });
  }

  let creados = 0;
  let actualizados = 0;

  for (const [sku, { name, barcode, stock, precio }] of porSku) {
    const data = {
      sku,
      barcode: barcode || null,
      name,
      categoryId: libreria.id,
      stock: Math.round(stock ?? 0),
      salePrice: precio ?? 0,
    };

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      await prisma.product.update({ where: { sku }, data });
      actualizados++;
    } else {
      await prisma.product.create({ data });
      creados++;
    }
  }

  const total = await prisma.product.count();
  console.log("Importación de inventario completada.");
  console.log(`Productos creados: ${creados}`);
  console.log(`Productos actualizados: ${actualizados}`);
  console.log(`Códigos duplicados en el archivo (se mantuvo el primero): ${duplicados}`);
  console.log(`Filas sin código ni barcode omitidas: ${sinCodigo}`);
  console.log(`Total de productos en la base: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
