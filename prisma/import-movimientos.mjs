import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient, Role, MovementType } from "@prisma/client";
import { CATEGORIES, CATALOG } from "./catalog.mjs";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "movimientos.tsv");
const MARCA = "[Importado]";
const RESET = process.argv.includes("--reset");

// Fecha asignada a los movimientos sin fecha en el archivo (AÑO=1899/Excel).
// Las filas con fecha real (ej. ALTA STOCK INICIAL 03/02/2025) usan la suya.
const FECHA_DEFECTO = new Date("2025-12-31T12:00:00Z");

const CATALOG_NAME = new Map(CATALOG);

function clean(raw) {
  const s = String(raw ?? "").replace(/[""]/g, "").replace(/\s+/g, " ").trim();
  return s && s !== "#N/A" ? s : null;
}

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

function parseFecha(fechaRaw, anioRaw, mesRaw) {
  const m = String(fechaRaw ?? "")
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    let y = Number(m[3]);
    if (m[3].length === 2) y += y < 70 ? 2000 : 1900;
    if (d >= 1 && d <= 31 && mo >= 0 && mo <= 11 && y > 1970 && y < 2100) {
      return new Date(y, mo, d, 12, 0, 0);
    }
  }
  const y = Number.parseInt(anioRaw, 10);
  const mo = Number.parseInt(mesRaw, 10);
  if (Number.isFinite(y) && y > 1970 && y < 2100) {
    const mm = Number.isFinite(mo) && mo >= 1 && mo <= 12 ? mo - 1 : 11;
    return new Date(y, mm, 1, 12, 0, 0);
  }
  return new Date(FECHA_DEFECTO);
}

function reasonFor(obs, retira, depto) {
  const parts = [...new Set([clean(retira), clean(depto), clean(obs)].filter(Boolean))];
  const joined = parts.join(" · ");
  return joined ? `${MARCA} ${joined}` : MARCA;
}

// Detecta las columnas desde el encabezado (robusto a celdas vacías iniciales).
function detectColumns(headerCols) {
  const find = (name) => headerCols.findIndex((c) => (c || "").trim().toUpperCase().startsWith(name));
  const idx = {
    fecha: find("FECHA"),
    anio: find("AÑO") >= 0 ? find("AÑO") : find("ANO"),
    mes: find("MES"),
    producto: find("PRODUCTO"),
    entradas: find("ENTRADAS"),
    salidas: find("SALIDAS"),
    neto: find("NETO"),
    cod2: find("COD"),
    depto: find("DEPARTAMENTO"),
    retira: find("RETIRA"),
    obs: find("OBSERVACIONES"),
  };
  idx.codigo = idx.producto - 1;
  return idx;
}

async function main() {
  if (!existsSync(CSV_PATH)) {
    console.error(
      `No se encontró ${CSV_PATH}.\n` +
        "Guardar el movimiento pegado (texto separado por TAB, con su fila de encabezado) en ese archivo y volver a correr."
    );
    process.exit(1);
  }

  const lines = readFileSync(CSV_PATH, "utf8").split(/\r?\n/);
  const col = detectColumns(lines[0]?.split("\t") ?? []);
  const requeridos = ["fecha", "anio", "mes", "producto", "entradas", "salidas", "neto", "depto", "retira", "obs"];
  const faltantes = requeridos.filter((k) => col[k] < 0);
  if (faltantes.length) {
    console.error(`Encabezado inesperado: faltan columnas ${faltantes.join(", ")}. Revisar prisma/movimientos.tsv.`);
    process.exit(1);
  }

  const rows = [];
  let saltadas = 0;

  for (const line of lines.slice(1)) {
    const cols = line.split("\t");
    if (cols.length <= col.producto) {
      saltadas++;
      continue;
    }
    const sku = clean(cols[col.codigo]);
    const entradas = parseNumber(cols[col.entradas]) ?? 0;
    const salidas = parseNumber(cols[col.salidas]) ?? 0;
    const neto = parseNumber(cols[col.neto]) ?? 0;
    if (!sku || (entradas === 0 && salidas === 0 && neto === 0)) {
      saltadas++;
      continue;
    }
    rows.push({
      sku,
      nombre: clean(cols[col.producto]),
      fecha: parseFecha(cols[col.fecha], cols[col.anio], cols[col.mes]),
      entradas,
      salidas,
      neto,
      cod2: clean(cols[col.cod2]),
      depto: clean(cols[col.depto]),
      retira: clean(cols[col.retira]),
      obs: clean(cols[col.obs]),
    });
  }

  if (rows.length === 0) {
    console.error("No se encontraron filas válidas en el archivo.");
    process.exit(1);
  }

  const mal = rows.filter((r) => !/^[A-Z]\d{2,3}$/.test(r.sku));
  if (mal.length) {
    console.warn(`Códigos con formato inesperado (${mal.length}): ${[...new Set(mal.map((r) => r.sku))].slice(0, 10).join(", ")}`);
  }

  const yaImportados = await prisma.stockMovement.count({ where: { reason: { startsWith: MARCA } } });
  if (yaImportados > 0 && !RESET) {
    console.error(
      `Ya hay ${yaImportados} movimientos importados (marcados con "${MARCA}").\n` +
        "Para borrarlos y volver a importar usar: node prisma/import-movimientos.mjs --reset"
    );
    process.exit(1);
  }
  if (yaImportados > 0 && RESET) {
    const borrados = await prisma.stockMovement.deleteMany({ where: { reason: { startsWith: MARCA } } });
    console.log(`Movimientos previos eliminados: ${borrados.count}`);
  }

  let user = await prisma.user.findFirst({ where: { role: Role.ADMIN }, orderBy: { createdAt: "asc" } });
  if (!user) user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Importación",
        email: "importacion@stock.local",
        passwordHash: "!",
        role: Role.OPERADOR,
      },
    });
    console.log("Usuario 'Importación' creado para los movimientos.");
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

  // Mapa código de área (COD.2) -> id. Requiere haber corrido `npm run db:areas`.
  const areas = await prisma.area.findMany();
  const areaMap = new Map(areas.map((a) => [a.code, a.id]));
  const cod2Usados = [...new Set(rows.map((r) => r.cod2).filter(Boolean))];
  const cod2SinArea = cod2Usados.filter((c) => !areaMap.has(c));
  if (cod2SinArea.length) {
    console.warn(`COD.2 sin área en la base (${cod2SinArea.length}): ${cod2SinArea.slice(0, 15).join(", ")}`);
    console.warn("Recordar correr `npm run db:areas` para importar el catálogo de áreas.");
  }

  const skus = [...new Set(rows.map((r) => r.sku))];
  const existing = await prisma.product.findMany({ where: { sku: { in: skus } } });
  const porSku = new Map(existing.map((p) => [p.sku, p]));

  let productosCreados = 0;
  for (const sku of skus) {
    if (porSku.has(sku)) continue;
    const nombreArchivo = rows.find((r) => r.sku === sku && r.nombre)?.nombre;
    const nombre = CATALOG_NAME.get(sku) || nombreArchivo || sku;
    const prod = await prisma.product.create({
      data: {
        sku,
        name: nombre,
        categoryId: catIds[sku[0]] ?? null,
      },
    });
    porSku.set(sku, prod);
    productosCreados++;
  }

  // Reconstruir el historial en memoria (sin tocar product.stock): el ALTA
  // STOCK INICIAL fija el punto de partida y el resto encadena anterior/nuevo.
  const balances = new Map();
  const movimientos = [];
  let inSum = 0;
  let outSum = 0;
  let adjSum = 0;

  for (const r of rows) {
    const productId = porSku.get(r.sku)?.id;
    if (!productId) continue;

    const partes = [];
    if (r.entradas > 0) partes.push([MovementType.INGRESO, Math.round(r.entradas)]);
    if (r.salidas > 0) partes.push([MovementType.SALIDA, Math.round(r.salidas)]);
    if (r.entradas === 0 && r.salidas === 0 && r.neto !== 0)
      partes.push([MovementType.AJUSTE, Math.round(r.neto)]);

    for (const [tipo, qty] of partes) {
      const prev = balances.get(r.sku) ?? 0;
      const next = tipo === MovementType.SALIDA ? prev - qty : prev + qty;
      balances.set(r.sku, next);
      movimientos.push({
        productId,
        type: tipo,
        quantity: qty,
        unitCost: 0,
        reason: reasonFor(r.obs, r.retira, r.depto),
        areaId: r.cod2 ? areaMap.get(r.cod2) ?? null : null,
        previousStock: prev,
        newStock: next,
        userId: user.id,
        createdAt: r.fecha,
      });
      if (tipo === MovementType.INGRESO) inSum += qty;
      else if (tipo === MovementType.SALIDA) outSum += qty;
      else adjSum += qty;
    }
  }

  for (let i = 0; i < movimientos.length; i += 500) {
    await prisma.stockMovement.createMany({
      data: movimientos.slice(i, i + 500),
    });
  }

  const negativos = [...balances.entries()]
    .filter(([, v]) => v < 0)
    .map(([s]) => s);

  console.log("Importación de movimientos completada.");
  console.log(`Filas leídas: ${lines.length}`);
  console.log(`Filas válidas: ${rows.length} (${saltadas} omitidas por código/importes vacíos)`);
  console.log(`Movimientos creados: ${movimientos.length} (${inSum} uds. ingresos, ${outSum} uds. salidas, ${adjSum} uds. ajustes)`);
  console.log(`Productos involucrados: ${porSku.size} (creados nuevos: ${productosCreados})`);
  console.log(`Stock NO modificado (historial únicamente).`);
  if (negativos.length) {
    console.warn(`SKU con saldo negativo en el archivo (revisar): ${negativos.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
