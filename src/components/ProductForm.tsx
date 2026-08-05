"use client";

import { createProduct, updateProduct } from "@/actions/productos";
import { useFormAction } from "@/lib/useFormAction";
import type { Category, Supplier } from "@prisma/client";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";

export function ProductForm({
  categories,
  suppliers,
  initial,
  submitLabel,
}: {
  categories: Category[];
  suppliers: Supplier[];
  initial?: {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
    description?: string | null;
    categoryId?: string | null;
    purchasePrice: number;
    salePrice: number;
    stockMin: number;
    location?: string | null;
    expiryDate?: Date | string | null;
    active: boolean;
    supplierIds: string[];
  } | null;
  submitLabel?: string;
}) {
  const action = initial ? updateProduct : createProduct;
  const [state, formAction, pending] = useFormAction(action);

  return (
    <form action={formAction} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>SKU</Label>
          <Input
            name="sku"
            defaultValue={initial?.sku}
            required
            placeholder="ELC-001"
          />
        </div>
        <div>
          <Label>Nombre</Label>
          <Input name="name" defaultValue={initial?.name} required />
        </div>
        <div>
          <Label>Código de barras</Label>
          <Input
            name="barcode"
            defaultValue={initial?.barcode ?? ""}
            placeholder="7798006055058"
          />
        </div>
      </div>

      <div>
        <Label>Descripción</Label>
        <Textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Categoría</Label>
          <Select name="categoryId" defaultValue={initial?.categoryId ?? ""}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Precio de compra</Label>
          <Input
            name="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.purchasePrice ?? 0}
          />
        </div>
        <div>
          <Label>Precio de referencia</Label>
          <Input
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.salePrice ?? 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Stock mínimo</Label>
          <Input
            name="stockMin"
            type="number"
            min="0"
            defaultValue={initial?.stockMin ?? 0}
          />
        </div>
        <div>
          <Label>Ubicación</Label>
          <Input
            name="location"
            defaultValue={initial?.location ?? ""}
            placeholder="Depósito A"
          />
        </div>
        <div>
          <Label>Vencimiento (opcional)</Label>
          <Input
            name="expiryDate"
            type="date"
            defaultValue={
              initial?.expiryDate
                ? new Date(initial.expiryDate).toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
      </div>

      {suppliers.length > 0 && (
        <div>
          <Label>Proveedores</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {suppliers.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  name="supplierIds"
                  value={s.id}
                  defaultChecked={initial?.supplierIds.includes(s.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {initial && (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initial.active}
            className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
          />
          Producto activo
        </label>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel ?? (initial ? "Guardar cambios" : "Crear producto")}
        </Button>
      </div>
    </form>
  );
}
