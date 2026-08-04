"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createSupplier(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El nombre es obligatorio");

  const data = {
    name,
    taxId: String(formData.get("taxId") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
  };

  const existing = await db.supplier.findUnique({ where: { name } });
  if (existing) throw new Error("Ya existe un proveedor con ese nombre");

  await db.supplier.create({ data });
  revalidatePath("/proveedores");
  redirect("/proveedores");
}

export async function updateSupplier(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("Datos incompletos");

  const dup = await db.supplier.findFirst({
    where: { name, id: { not: id } },
  });
  if (dup) throw new Error("Ya existe un proveedor con ese nombre");

  await db.supplier.update({
    where: { id },
    data: {
      name,
      taxId: String(formData.get("taxId") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
    },
  });
  revalidatePath("/proveedores");
  redirect("/proveedores");
}

export async function deleteSupplier(id: string) {
  await requireRole("ADMIN");
  const count = await db.stockMovement.count({ where: { supplierId: id } });
  if (count > 0) throw new Error("No se puede borrar: tiene movimientos asociados");
  await db.supplierProduct.deleteMany({ where: { supplierId: id } });
  await db.supplier.delete({ where: { id } });
  revalidatePath("/proveedores");
  redirect("/proveedores");
}
