"use client";

import { registerIngreso } from "@/actions/movimientos";
import { useFormAction } from "@/lib/useFormAction";
import type { Area, Product, Supplier } from "@prisma/client";
import { Button, Input, Label } from "@/components/ui";
import { SearchSelect } from "@/components/SearchSelect";
import { formatNumber } from "@/lib/format";

export function IngresoForm({
  products,
  suppliers,
  areas,
}: {
  products: Product[];
  suppliers: Supplier[];
  areas: Area[];
}) {
  const [state, formAction, pending] = useFormAction(registerIngreso);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <Label>Producto</Label>
        <SearchSelect
          name="productId"
          required
          placeholder="Buscar por nombre, SKU o código de barras…"
          options={products.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.sku}) — stock: ${formatNumber(p.stock)}`,
            keywords: `${p.sku} ${p.barcode ?? ""} ${p.name}`,
          }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cantidad</Label>
          <Input name="quantity" type="number" min="1" required />
        </div>
        <div>
          <Label>Costo unitario</Label>
          <Input name="unitCost" type="number" step="0.01" min="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Proveedor</Label>
          <SearchSelect
            name="supplierId"
            emptyLabel="Sin proveedor"
            placeholder="Buscar proveedor…"
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>
        <div>
          <Label>N° factura / remito</Label>
          <Input name="invoiceNumber" />
        </div>
      </div>
      <div>
        <Label>Motivo (opcional)</Label>
        <Input name="reason" placeholder="Ej: reposición semanal" />
      </div>
      <div>
        <Label>Área / destino</Label>
        <SearchSelect
          name="areaId"
          emptyLabel="Sin área"
          placeholder="Buscar área…"
          options={areas.map((a) => ({
            value: a.id,
            label: `${a.code} · ${a.name}`,
          }))}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Registrar ingreso"}
        </Button>
      </div>
    </form>
  );
}
