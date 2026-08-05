"use client";

import { useState } from "react";
import { registerIngreso, registerSalida, registerAjuste } from "@/actions/movimientos";
import type { Area, Supplier } from "@prisma/client";
import { Button, Input, Label, Select } from "@/components/ui";
import { SearchSelect } from "@/components/SearchSelect";
import { useFormAction } from "@/lib/useFormAction";
import { SALIDA_REASONS } from "@/lib/format";

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  );
}

export function StockMovementForms({
  productId,
  productName,
  currentStock,
  suppliers,
  areas,
}: {
  productId: string;
  productName: string;
  currentStock: number;
  suppliers: Supplier[];
  areas: Area[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  const [ingresoState, ingresoAction, ingresoPending] =
    useFormAction(registerIngreso);
  const [salidaState, salidaAction, salidaPending] = useFormAction(registerSalida);
  const [ajusteState, ajusteAction, ajustePending] =
    useFormAction(registerAjuste);

  const sections = [
    { key: "ingreso", title: "Ingreso", action: ingresoAction, state: ingresoState, pending: ingresoPending },
    { key: "salida", title: "Salida", action: salidaAction, state: salidaState, pending: salidaPending },
    { key: "ajuste", title: "Ajuste", action: ajusteAction, state: ajusteState, pending: ajustePending },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {sections.map((s) => (
          <Button
            key={s.key}
            type="button"
            variant={open === s.key ? "primary" : "secondary"}
            onClick={() => setOpen(open === s.key ? null : s.key)}
          >
            {s.title}
          </Button>
        ))}
      </div>

      {open === "ingreso" && (
        <form action={ingresoAction} className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <input type="hidden" name="productId" value={productId} />
          <ErrorBox error={ingresoState.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Cantidad</Label>
              <Input name="quantity" type="number" min="1" required />
            </div>
            <div>
              <Label>Costo unitario</Label>
              <Input name="unitCost" type="number" step="0.01" min="0" />
            </div>
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
              <Label>N° factura/remito</Label>
              <Input name="invoiceNumber" />
            </div>
          </div>
          <div>
            <Label>Motivo (opcional)</Label>
            <Input name="reason" placeholder="Ej: compra de reposición" />
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Stock actual: <b>{currentStock}</b> · {productName}
            </p>
            <Button type="submit" disabled={ingresoPending}>
              {ingresoPending ? "Registrando…" : "Registrar ingreso"}
            </Button>
          </div>
        </form>
      )}

      {open === "salida" && (
        <form action={salidaAction} className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <input type="hidden" name="productId" value={productId} />
          <ErrorBox error={salidaState.error} />
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Stock actual: <b>{currentStock}</b> · {productName}
            </p>
            <Button type="submit" disabled={salidaPending}>
              {salidaPending ? "Registrando…" : "Registrar salida"}
            </Button>
          </div>
        </form>
      )}

      {open === "ajuste" && (
        <form action={ajusteAction} className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <input type="hidden" name="productId" value={productId} />
          <ErrorBox error={ajusteState.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Variación (+/-)</Label>
              <Input name="delta" type="number" required placeholder="Ej: 5 o -3" />
            </div>
            <div>
              <Label>Costo unitario (opcional)</Label>
              <Input name="unitCost" type="number" step="0.01" min="0" />
            </div>
          </div>
          <div>
            <Label>Motivo</Label>
            <Input name="reason" placeholder="Ej: recuento físico, merma" required />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Stock actual: <b>{currentStock}</b> · {productName}
            </p>
            <Button type="submit" disabled={ajustePending}>
              {ajustePending ? "Registrando…" : "Registrar ajuste"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
