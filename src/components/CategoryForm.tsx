"use client";

import { createCategory, updateCategory } from "@/actions/categorias";
import { useFormAction } from "@/lib/useFormAction";
import { Button, Input, Label, Textarea } from "@/components/ui";

export function CategoryForm({
  initial,
  onCancel,
}: {
  initial?: { id: string; name: string; description?: string | null };
  onCancel?: () => void;
}) {
  const action = initial ? updateCategory : createCategory;
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
        <Label>Nombre</Label>
        <Input name="name" defaultValue={initial?.name} required />
      </div>
      <div>
        <Label>Descripción (opcional)</Label>
        <Textarea name="description" defaultValue={initial?.description ?? ""} rows={2} />
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : initial ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </div>
    </form>
  );
}
