"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createCategory(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) throw new Error("El nombre es obligatorio");

  const existing = await db.category.findUnique({ where: { name } });
  if (existing) throw new Error("Ya existe una categoría con ese nombre");

  await db.category.create({ data: { name, description } });
  revalidatePath("/categorias");
  redirect("/categorias");
}

export async function updateCategory(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!id || !name) throw new Error("Datos incompletos");

  const dup = await db.category.findFirst({
    where: { name, id: { not: id } },
  });
  if (dup) throw new Error("Ya existe una categoría con ese nombre");

  await db.category.update({
    where: { id },
    data: { name, description },
  });
  revalidatePath("/categorias");
  redirect("/categorias");
}

export async function deleteCategory(id: string) {
  await requireRole("ADMIN");
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) throw new Error("No se puede borrar: tiene productos asignados");
  await db.category.delete({ where: { id } });
  revalidatePath("/categorias");
  redirect("/categorias");
}
