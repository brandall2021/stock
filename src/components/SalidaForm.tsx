"use client";

import { useRef, useState, useTransition } from "react";
import { registerSalida } from "@/actions/movimientos";
import { setAreaEmail } from "@/actions/areas";
import { useFormAction } from "@/lib/useFormAction";
import type { Area, Product } from "@prisma/client";
import { Button, Input, Label, Select } from "@/components/ui";
import { SearchSelect, type SearchSelectOption } from "@/components/SearchSelect";
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

  // Emails de las áreas, editables en caliente desde este formulario.
  const [emails, setEmails] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(areas.map((a) => [a.id, a.email]))
  );
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSaved, setEmailSaved] = useState(false);
  const [savingEmail, startSavingEmail] = useTransition();

  const areaOptions: SearchSelectOption[] = areas.map((a) => ({
    value: a.id,
    label: `${a.code} · ${a.name}`,
  }));

  const selectedArea = areas.find((a) => a.id === selectedAreaId);
  const selectedEmail = selectedAreaId ? (emails[selectedAreaId] ?? null) : null;

  function onSelectArea(opt: SearchSelectOption) {
    setSelectedAreaId(opt.value);
    setEmailDraft("");
    setEmailError(null);
    setEmailSaved(false);
  }

  function onSaveEmail() {
    if (!selectedAreaId) return;
    setEmailError(null);
    startSavingEmail(async () => {
      try {
        const res = await setAreaEmail(selectedAreaId, emailDraft);
        setEmails((prev) => ({ ...prev, [selectedAreaId]: res.email }));
        setEmailDraft("");
        setEmailSaved(true);
      } catch (e) {
        setEmailError(e instanceof Error ? e.message : "Ocurrió un error");
      }
    });
  }

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
          options={areaOptions}
          onSelect={onSelectArea}
        />
        {selectedArea && (
          <div className="mt-2 text-sm">
            {selectedEmail ? (
              <p className="text-zinc-600">
                📧 Se enviará aviso a:{" "}
                <span className="font-medium text-zinc-900">{selectedEmail}</span>
              </p>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  Esta área no tiene email: no se enviará aviso de salida.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSaveEmail();
                      }
                    }}
                    placeholder="dependencia@dominio.edu.ar"
                    className="max-w-64"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={savingEmail || !emailDraft.trim()}
                    onClick={onSaveEmail}
                  >
                    {savingEmail ? "Guardando…" : "Guardar email"}
                  </Button>
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-red-700">{emailError}</p>
                )}
                {emailSaved && !emailError && (
                  <p className="mt-1 text-xs text-emerald-700">
                    Email guardado. Se usará en las próximas salidas de esta área.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
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
