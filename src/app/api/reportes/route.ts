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

export async function GET(request: NextRequest) {
  await requireAuth();
  const params = request.nextUrl.searchParams;
  const tab = params.get("tab") ?? "stock";
  const desde = params.get("desde") ?? undefined;
  const hasta = params.get("hasta") ?? undefined;
  const sort = parseSort(params.get("sort"));
  const filtros: ReportFilters = {
    q: params.get("q") ?? undefined,
    categoria: params.get("categoria") ?? undefined,
    estado: params.get("estado") ?? undefined,
  };

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
      csv = toCsv(columns, sortRows(await getLowStockRows(filtros), sort, {
        name: (r) => r.name,
        stock: (r) => r.stock,
        stockMin: (r) => r.stockMin,
        diferencia: (r) => r.stockMin - r.stock,
      }));
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
      csv = toCsv(columns, sortRows(await getMovementPeriodRows(desde, hasta, filtros), sort, {
        name: (r) => r.name,
        ingreso: (r) => r.ingreso,
        salida: (r) => r.salida,
        costo: (r) => r.costo,
      }));
      break;
    }
    case "movcat": {
      filename = "reporte-movimientos-por-categoria.csv";
      const columns: CsvColumn<MovementPeriodRow>[] = [
        { header: "Categoría", value: (r) => r.name },
        { header: "Ingresos", value: (r) => r.ingreso },
        { header: "Salidas", value: (r) => r.salida },
        { header: "Costo ingresado", value: (r) => r.costo },
      ];
      csv = toCsv(columns, sortRows(await getMovementCategoryRows(desde, hasta, filtros), sort, {
        name: (r) => r.name,
        ingreso: (r) => r.ingreso,
        salida: (r) => r.salida,
        costo: (r) => r.costo,
      }));
      break;
    }
    case "areas": {
      filename = "reporte-por-area.csv";
      const columns: CsvColumn<AreaRow>[] = [
        { header: "Código", value: (r) => r.code },
        { header: "Área", value: (r) => r.name },
        { header: "Movimientos", value: (r) => r.movimientos },
        { header: "Ingresos", value: (r) => r.ingresos },
        { header: "Salidas", value: (r) => r.salidas },
        { header: "Valor ingresado", value: (r) => r.valor },
      ];
      csv = toCsv(columns, sortRows(await getAreaRows(filtros), sort, {
        name: (r) => r.name,
        code: (r) => r.code,
        movimientos: (r) => r.movimientos,
        ingresos: (r) => r.ingresos,
        salidas: (r) => r.salidas,
        valor: (r) => r.valor,
      }));
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
      csv = toCsv(columns, sortRows(await getSupplierRows(filtros), sort, {
        name: (r) => r.name,
        ingresos: (r) => r.ingresos,
        unidades: (r) => r.unidades,
        costo: (r) => r.costo,
      }));
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
      csv = toCsv(columns, sortRows(await getValorizationRows(filtros), sort, {
        name: (r) => r.name,
        unidades: (r) => r.unidades,
        valor: (r) => r.valor,
        pct: (r) => r.pct,
      }));
      break;
    }
    case "movidos": {
      filename = "reporte-mas-movidos.csv";
      const columns: CsvColumn<MovedRow>[] = [
        { header: "Producto", value: (r) => r.name },
        { header: "Movimientos", value: (r) => r.movimientos },
        { header: "Unidades", value: (r) => r.unidades },
      ];
      csv = toCsv(columns, sortRows(await getTopMovedRows(filtros), sort, {
        name: (r) => r.name,
        movimientos: (r) => r.movimientos,
        unidades: (r) => r.unidades,
      }));
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
      csv = toCsv(columns, sortRows(await getStockRows(filtros), sort, {
        name: (r) => r.name,
        category: (r) => r.category,
        stock: (r) => r.stock,
        stockMin: (r) => r.stockMin,
        purchasePrice: (r) => r.purchasePrice,
        valor: (r) => r.stock * r.purchasePrice,
      }));
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
