"use client";

import { registerIngreso } from "@/actions/movimientos";
import { useFormAction } from "@/lib/useFormAction";
import type { Product, Supplier } from "@prisma/client";
import { Button, Input, Label, Select } from "@/components/ui";
import { formatNumber } from "@/lib/format";

export function IngresoForm({
  products,
  suppliers,
}: {
  products: Product[];
  suppliers: Supplier[];
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
        <Select name="productId" required>
          <option value="">Seleccionar producto…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku}) — stock: {formatNumber(p.stock)}
            </option>
          ))}
        </Select>
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
          <Select name="supplierId" defaultValue="">
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
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
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Registrar ingreso"}
        </Button>
      </div>
    </form>
  );
}
