import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getLowStockRows,
  getMovementPeriodRows,
  getStockRows,
  getSupplierRows,
  getTopMovedRows,
  getValorizationRows,
  toCsv,
  type CsvColumn,
  type MovedRow,
  type MovementPeriodRow,
  type StockRow,
  type SupplierRow,
  type ValorizationRow,
} from "@/lib/reportes";

export async function GET(request: NextRequest) {
  await requireAuth();
  const params = request.nextUrl.searchParams;
  const tab = params.get("tab") ?? "stock";
  const desde = params.get("desde") ?? undefined;
  const hasta = params.get("hasta") ?? undefined;

  let filename = "reporte-stock.csv";
  let csv = "";

  switch (tab) {
    case "bajo": {
      filename = "reporte-bajo-stock.csv";
      const columns: CsvColumn<StockRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Stock", value: (r) => r.stock },
        { header: "Mínimo", value: (r) => r.stockMin },
        { header: "Diferencia", value: (r) => r.stockMin - r.stock },
      ];
      csv = toCsv(columns, await getLowStockRows());
      break;
    }
    case "movimientos": {
      filename = "reporte-movimientos.csv";
      const columns: CsvColumn<MovementPeriodRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Ingresos", value: (r) => r.ingreso },
        { header: "Salidas", value: (r) => r.salida },
        { header: "Costo ingresado", value: (r) => r.costo },
      ];
      csv = toCsv(columns, await getMovementPeriodRows(desde, hasta));
      break;
    }
    case "proveedores": {
      filename = "reporte-proveedores.csv";
      const columns: CsvColumn<SupplierRow>[] = [
        { header: "Proveedor", value: (r) => r.name },
        { header: "Ingresos", value: (r) => r.ingresos },
        { header: "Unidades", value: (r) => r.unidades },
        { header: "Total comprado", value: (r) => r.costo },
      ];
      csv = toCsv(columns, await getSupplierRows());
      break;
    }
    case "valorizacion": {
      filename = "reporte-valorizacion.csv";
      const columns: CsvColumn<ValorizationRow>[] = [
        { header: "Categoría", value: (r) => r.name },
        { header: "Unidades", value: (r) => r.unidades },
        { header: "Valor", value: (r) => r.valor },
        { header: "% del total", value: (r) => r.pct.toFixed(1) },
      ];
      csv = toCsv(columns, await getValorizationRows());
      break;
    }
    case "movidos": {
      filename = "reporte-mas-movidos.csv";
      const columns: CsvColumn<MovedRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Movimientos", value: (r) => r.movimientos },
        { header: "Unidades", value: (r) => r.unidades },
      ];
      csv = toCsv(columns, await getTopMovedRows());
      break;
    }
    default: {
      filename = "reporte-stock.csv";
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
      csv = toCsv(columns, await getStockRows());
      break;
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
