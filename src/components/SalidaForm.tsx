"use client";

import { useRef } from "react";
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
  const quantityRef = useRef<HTMLInputElement>(null);

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
          autoFocus
          placeholder="Escanee el código de barras o busque por nombre, SKU o código…"
          options={products.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.sku}) — stock: ${formatNumber(p.stock)}`,
            keywords: `${p.sku} ${p.barcode ?? ""} ${p.name}`,
            exactMatch: [p.sku, p.barcode ?? ""].filter(Boolean),
          }))}
          onSelect={() => quantityRef.current?.focus()}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Escanee el código de barras (se selecciona solo) y presione Enter para
          pasar a la cantidad, o escriba nombre / SKU.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Cantidad</Label>
          <Input ref={quantityRef} name="quantity" type="number" min="1" required />
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
