import ExcelJS from "exceljs";
import type { StockRow } from "@/lib/reportes";

const MONEY_FMT = "$ #,##0.00";
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEDEDED" },
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  bottom: { style: "thin", color: { argb: "FFBBBBBB" } },
};

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.border = HEADER_BORDER;
  });
}

function safeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " ").trim();
  if (!base) base = "Sin categoría";
  base = base.slice(0, 31);
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${i}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    i++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

const MONEY_RE = /costo|valor|precio|importe|total/i;
const PCT_RE = /%/;

function isMoneyHeader(header: string): boolean {
  return MONEY_RE.test(header) && !PCT_RE.test(header);
}

export async function buildSheetXlsx(
  sheetName: string,
  headers: string[],
  data: (string | number)[][]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const used = new Set<string>();
  const ws = wb.addWorksheet(safeSheetName(sheetName, used));

  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  const moneyCols = new Set(
    headers.map((h, i) => (isMoneyHeader(h) ? i : -1)).filter((i) => i >= 0)
  );

  for (const values of data) {
    const row = ws.addRow(values);
    moneyCols.forEach((colIdx) => {
      const cell = row.getCell(colIdx + 1);
      if (typeof cell.value === "number") cell.numFmt = MONEY_FMT;
    });
  }

  headers.forEach((h, i) => {
    const longest = Math.max(h.length, ...data.map((r) => String(r[i] ?? "").length));
    ws.getColumn(i + 1).width = Math.min(Math.max(longest + 2, 10), 50);
  });

  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

export async function buildStockXlsx(rows: StockRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const used = new Set<string>();

  const groups = new Map<string, StockRow[]>();
  for (const r of rows) {
    const g = groups.get(r.category);
    if (g) g.push(r);
    else groups.set(r.category, [r]);
  }
  const categories = [...groups.keys()].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

  for (const cat of categories) {
    const items = groups.get(cat)!;
    const ws = wb.addWorksheet(safeSheetName(cat, used));

    const title = ws.addRow(["STOCK ACTUAL"]);
    title.font = { bold: true, size: 14 };
    ws.addRow([]);
    const rubro = ws.addRow([cat]);
    rubro.font = { bold: true };
    ws.addRow(["Descripción", "Saldo", "Precio Unitario", "Precio Total"]);
    styleHeader(ws.getRow(4));

    for (const p of items) {
      const row = ws.addRow([
        p.name,
        p.stock,
        p.purchasePrice,
        p.stock * p.purchasePrice,
      ]);
      row.getCell(3).numFmt = MONEY_FMT;
      row.getCell(4).numFmt = MONEY_FMT;
    }

    ws.getColumn(1).width = 55;
    ws.getColumn(2).width = 12;
    ws.getColumn(3).width = 16;
    ws.getColumn(4).width = 16;
    ws.views = [{ state: "frozen", ySplit: 4 }];
  }

  const totalWs = wb.addWorksheet(safeSheetName("TOTAL", used));
  const title = totalWs.addRow(["STOCK ACTUAL"]);
  title.font = { bold: true, size: 14 };
  totalWs.addRow([]);
  const head = totalWs.addRow(["Rubros", "Importes"]);
  styleHeader(head);

  let sum = 0;
  for (const cat of categories) {
    const value = groups
      .get(cat)!
      .reduce((a, p) => a + p.stock * p.purchasePrice, 0);
    sum += value;
    const row = totalWs.addRow([cat, value]);
    row.getCell(2).numFmt = MONEY_FMT;
  }
  const totalRow = totalWs.addRow(["MONTO TOTAL", sum]);
  totalRow.font = { bold: true };
  totalRow.getCell(2).numFmt = MONEY_FMT;

  totalWs.getColumn(1).width = 45;
  totalWs.getColumn(2).width = 18;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}
