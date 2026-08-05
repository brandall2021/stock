import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(__dirname, "areas.tsv");

function clean(raw) {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  return s && s !== "#N/A" ? s : null;
}

async function main() {
  if (!existsSync(CSV_PATH)) {
    console.error(`No se encontró ${CSV_PATH}.`);
    process.exit(1);
  }

  const lines = readFileSync(CSV_PATH, "utf8").split(/\r?\n/);
  const areas = [];
  for (const line of lines) {
    const [cod, nombre] = line.split("\t");
    const code = clean(cod);
    const name = clean(nombre);
    if (!code || !name || !/^[A-Z]{1,2}\d{1,2}$/.test(code)) continue;
    areas.push({ code, name });
  }

  const duplicados = areas.filter(
    (a, i) => areas.findIndex((x) => x.code === a.code) !== i
  );
  if (duplicados.length) {
    console.warn(`Códigos duplicados en el archivo (se mantiene el primero): ${[...new Set(duplicados.map((d) => d.code))].join(", ")}`);
  }
  const unicos = [...new Map(areas.map((a) => [a.code, a])).values()];

  let creados = 0;
  let actualizados = 0;
  for (const a of unicos) {
    const existing = await prisma.area.findUnique({ where: { code: a.code } });
    if (existing) {
      if (existing.name !== a.name) {
        await prisma.area.update({ where: { id: existing.id }, data: { name: a.name } });
      }
      actualizados++;
    } else {
      await prisma.area.create({ data: { code: a.code, name: a.name } });
      creados++;
    }
  }

  const total = await prisma.area.count();
  console.log("Importación de áreas completada.");
  console.log(`Áreas en el archivo: ${areas.length} (únicas: ${unicos.length})`);
  console.log(`Áreas creadas: ${creados}`);
  console.log(`Áreas actualizadas: ${actualizados}`);
  console.log(`Total de áreas en la base: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
