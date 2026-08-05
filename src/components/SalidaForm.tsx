"use client";

import { registerSalida } from "@/actions/movimientos";
import { useFormAction } from "@/lib/useFormAction";
import type { Area, Product } from "@prisma/client";
import { Button, Input, Label, Select } from "@/components/ui";
import { SearchSelect } from "@/components/SearchSelect";
import { formatNumber, SALIDA_REASONS } from "@/lib/format";

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
        <p className="mt-1 text-xs text-zinc-500">
          Escriba el nombre, SKU o código de barras, o escanee el código del producto.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cantidad</Label>
          <Input name="quantity" type="number" min="1" required />
        </div>
        <div>
          <Label>Motivo</Label>
          <Select name="reason" defaultValue="Asignación a cátedra">
            {SALIDA_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </div>
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
      <div>
        <Label>Retira / Entrega</Label>
        <Input name="retiraEntrega" placeholder="Apellido, Nombre de quien retira o entrega" />
      </div>
      <div>
        <Label>Observaciones</Label>
        <Input name="observaciones" placeholder="Detalle adicional (opcional)" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Registrar salida"}
        </Button>
      </div>
    </form>
  );
}
