import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAreaRows,
  getLowStockRows,
  getMovementCategoryRows,
  getMovementPeriodRows,
  getStockRows,
  getSupplierRows,
  getTopMovedRows,
  getValorizationRows,
  parseSort,
  sortRows,
  toCsv,
  type AreaRow,
  type CsvColumn,
  type MovedRow,
  type MovementPeriodRow,
  type ReportFilters,
  type StockRow,
  type SupplierRow,
  type ValorizationRow,
} from "@/lib/reportes";
import { buildSheetXlsx, buildStockXlsx } from "@/lib/xlsx";

export async function GET(request: NextRequest) {
  await requireAuth();
  const params = request.nextUrl.searchParams;
  const tab = params.get("tab") ?? "stock";
  const desde = params.get("desde") ?? undefined;
  const hasta = params.get("hasta") ?? undefined;
  const sort = parseSort(params.get("sort"));
  const format = params.get("format") === "xlsx" ? "xlsx" : "csv";
  const filtros: ReportFilters = {
    q: params.get("q") ?? undefined,
    categoria: params.get("categoria") ?? undefined,
    estado: params.get("estado") ?? undefined,
  };

  let filename = "reporte-stock";
  let csv = "";
  let sheetName = "Reporte";
  let headers: string[] = [];
  let data: (string | number)[][] = [];
  let stockRows: StockRow[] | null = null;

  switch (tab) {
    case "bajo": {
      filename = "reporte-bajo-stock";
      sheetName = "Bajo stock";
      const columns: CsvColumn<StockRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Stock", value: (r) => r.stock },
        { header: "Mínimo", value: (r) => r.stockMin },
        { header: "Diferencia", value: (r) => r.stockMin - r.stock },
      ];
      const rows = sortRows(await getLowStockRows(filtros), sort, {
        name: (r) => r.name,
        stock: (r) => r.stock,
        stockMin: (r) => r.stockMin,
        diferencia: (r) => r.stockMin - r.stock,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      break;
    }
    case "movimientos": {
      filename = "reporte-movimientos";
      sheetName = "Movimientos";
      const columns: CsvColumn<MovementPeriodRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Ingresos", value: (r) => r.ingreso },
        { header: "Salidas", value: (r) => r.salida },
        { header: "Costo ingresado", value: (r) => r.costo },
      ];
      const rows = sortRows(await getMovementPeriodRows(desde, hasta, filtros), sort, {
        name: (r) => r.name,
        ingreso: (r) => r.ingreso,
        salida: (r) => r.salida,
        costo: (r) => r.costo,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      break;
    }
    case "movcat": {
      filename = "reporte-movimientos-por-categoria";
      sheetName = "Mov. por categoría";
      const columns: CsvColumn<MovementPeriodRow>[] = [
        { header: "Categoría", value: (r) => r.name },
        { header: "Ingresos", value: (r) => r.ingreso },
        { header: "Salidas", value: (r) => r.salida },
        { header: "Costo ingresado", value: (r) => r.costo },
      ];
      const rows = sortRows(await getMovementCategoryRows(desde, hasta, filtros), sort, {
        name: (r) => r.name,
        ingreso: (r) => r.ingreso,
        salida: (r) => r.salida,
        costo: (r) => r.costo,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      break;
    }
    case "areas": {
      filename = "reporte-por-area";
      sheetName = "Por área";
      const columns: CsvColumn<AreaRow>[] = [
        { header: "Código", value: (r) => r.code },
        { header: "Área", value: (r) => r.name },
        { header: "Movimientos", value: (r) => r.movimientos },
        { header: "Ingresos", value: (r) => r.ingresos },
        { header: "Salidas", value: (r) => r.salidas },
        { header: "Valor ingresado", value: (r) => r.valor },
      ];
      const rows = sortRows(await getAreaRows(filtros), sort, {
        name: (r) => r.name,
        code: (r) => r.code,
        movimientos: (r) => r.movimientos,
        ingresos: (r) => r.ingresos,
        salidas: (r) => r.salidas,
        valor: (r) => r.valor,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      break;
    }
    case "proveedores": {
      filename = "reporte-proveedores";
      sheetName = "Proveedores";
      const columns: CsvColumn<SupplierRow>[] = [
        { header: "Proveedor", value: (r) => r.name },
        { header: "Ingresos", value: (r) => r.ingresos },
        { header: "Unidades", value: (r) => r.unidades },
        { header: "Total comprado", value: (r) => r.costo },
      ];
      const rows = sortRows(await getSupplierRows(filtros), sort, {
        name: (r) => r.name,
        ingresos: (r) => r.ingresos,
        unidades: (r) => r.unidades,
        costo: (r) => r.costo,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      break;
    }
    case "valorizacion": {
      filename = "reporte-valorizacion";
      sheetName = "Valorización";
      const columns: CsvColumn<ValorizationRow>[] = [
        { header: "Categoría", value: (r) => r.name },
        { header: "Unidades", value: (r) => r.unidades },
        { header: "Valor", value: (r) => r.valor },
        { header: "% del total", value: (r) => r.pct.toFixed(1) },
      ];
      const rows = sortRows(await getValorizationRows(filtros), sort, {
        name: (r) => r.name,
        unidades: (r) => r.unidades,
        valor: (r) => r.valor,
        pct: (r) => r.pct,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      break;
    }
    case "movidos": {
      filename = "reporte-mas-movidos";
      sheetName = "Más movidos";
      const columns: CsvColumn<MovedRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Movimientos", value: (r) => r.movimientos },
        { header: "Unidades", value: (r) => r.unidades },
      ];
      const rows = sortRows(await getTopMovedRows(filtros), sort, {
        name: (r) => r.name,
        movimientos: (r) => r.movimientos,
        unidades: (r) => r.unidades,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      break;
    }
    default: {
      filename = "reporte-stock";
      sheetName = "Stock actual";
      const columns: CsvColumn<StockRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Categoría", value: (r) => r.category },
        { header: "Stock", value: (r) => r.stock },
        { header: "Mínimo", value: (r) => r.stockMin },
        { header: "Costo unit.", value: (r) => r.purchasePrice },
        { header: "Valor total", value: (r) => r.stock * r.purchasePrice },
        {
          header: "Estado",
          value: (r) =>
            r.stock === 0
              ? "Sin stock"
              : r.stock <= r.stockMin
                ? "Bajo"
                : "OK",
        },
      ];
      const rows = sortRows(await getStockRows(filtros), sort, {
        name: (r) => r.name,
        category: (r) => r.category,
        stock: (r) => r.stock,
        stockMin: (r) => r.stockMin,
        purchasePrice: (r) => r.purchasePrice,
        valor: (r) => r.stock * r.purchasePrice,
      });
      csv = toCsv(columns, rows);
      headers = columns.map((c) => c.header);
      data = rows.map((r) => columns.map((c) => c.value(r)));
      stockRows = rows;
      break;
    }
  }

  if (format === "xlsx") {
    const buffer =
      tab === "stock"
        ? await buildStockXlsx(stockRows ?? [])
        : await buildSheetXlsx(sheetName, headers, data);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
