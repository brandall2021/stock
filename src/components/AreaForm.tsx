"use client";

import { createArea, updateArea } from "@/actions/areas";
import { useFormAction } from "@/lib/useFormAction";
import { Button, Input, Label } from "@/components/ui";

export function AreaForm({
  initial,
  onCancel,
}: {
  initial?: { id: string; code: string; name: string; email?: string | null };
  onCancel?: () => void;
}) {
  const action = initial ? updateArea : createArea;
  const [state, formAction, pending] = useFormAction(action);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-zinc-200 p-4"
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <Label>Código</Label>
        <Input
          name="code"
          defaultValue={initial?.code}
          placeholder="Ej: O16, M05"
          className="uppercase"
          required
        />
      </div>
      <div>
        <Label>Nombre</Label>
        <Input name="name" defaultValue={initial?.name} required />
      </div>
      <div>
        <Label>Email (para avisos de salida de stock)</Label>
        <Input
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          placeholder="dependencia@dominio.edu.ar"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : initial ? "Guardar cambios" : "Crear área"}
        </Button>
      </div>
    </form>
  );
}
