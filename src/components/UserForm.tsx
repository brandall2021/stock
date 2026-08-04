"use client";

import { createUser, updateUser } from "@/actions/usuarios";
import { Button, Input, Label, Select } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/format";
import { useFormAction } from "@/lib/useFormAction";
import type { Role } from "@prisma/client";

export function UserForm({
  initial,
}: {
  initial?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    active: boolean;
  };
}) {
  const action = initial ? updateUser : createUser;
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
      <div>
        <Label>Email</Label>
        <Input
          name="email"
          type="email"
          defaultValue={initial?.email}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Rol</Label>
          <Select name="role" defaultValue={initial?.role ?? "OPERADOR"}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{initial ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
          <Input
            name="password"
            type="password"
            minLength={initial ? undefined : 6}
            required={!initial}
            placeholder={initial ? "Dejar vacío para no cambiar" : "Mín. 6 caracteres"}
          />
        </div>
      </div>
      {initial && (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initial.active}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
          />
          Usuario activo
        </label>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : initial ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
