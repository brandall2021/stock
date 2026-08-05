"use client";

import { registerSalida } from "@/actions/movimientos";
import { useFormAction } from "@/lib/useFormAction";
import type { Area, Product } from "@prisma/client";
import { Button, Input, Label, Select } from "@/components/ui";
import { formatNumber } from "@/lib/format";

export function SalidaForm({
  products,
  areas,
}: {
  products: Product[];
  areas: Area[];
}) {
  const [state, formAction, pending] = useFormAction(registerSalida);

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
          <Label>Motivo</Label>
          <Select name="reason" defaultValue="Venta">
            <option>Venta</option>
            <option>Uso interno</option>
            <option>Rotura</option>
            <option>Devolución</option>
            <option>Ajuste manual</option>
          </Select>
        </div>
      </div>
      <div>
        <Label>Área / destino</Label>
        <Select name="areaId" defaultValue="">
          <option value="">Sin área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} · {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Registrar salida"}
        </Button>
      </div>
    </form>
  );
}
