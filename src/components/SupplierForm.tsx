"use client";

import { createSupplier, updateSupplier } from "@/actions/proveedores";
import { useFormAction } from "@/lib/useFormAction";
import { Button, Input, Label } from "@/components/ui";

export function SupplierForm({
  initial,
}: {
  initial?: {
    id: string;
    name: string;
    taxId?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
}) {
  const action = initial ? updateSupplier : createSupplier;
  const [state, formAction, pending] = useFormAction(action);

  return (
    <form action={formAction} className="space-y-4">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>CUIT / RUC / NIF</Label>
          <Input name="taxId" defaultValue={initial?.taxId ?? ""} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input name="phone" defaultValue={initial?.phone ?? ""} />
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" defaultValue={initial?.email ?? ""} />
      </div>
      <div>
        <Label>Dirección</Label>
        <Input name="address" defaultValue={initial?.address ?? ""} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : initial ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </div>
    </form>
  );
}
