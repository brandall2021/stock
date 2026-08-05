"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createArea(formData: FormData) {
  await requireRole("ADMIN");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!code || !name) throw new Error("El código y el nombre son obligatorios");

  const existing = await db.area.findUnique({ where: { code } });
  if (existing) throw new Error("Ya existe un área con ese código");

  await db.area.create({ data: { code, name, email: email || null } });
  revalidatePath("/areas");
  redirect("/areas");
}

export async function updateArea(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!id || !code || !name) throw new Error("Datos incompletos");

  const dup = await db.area.findFirst({
    where: { code, id: { not: id } },
  });
  if (dup) throw new Error("Ya existe un área con ese código");

  await db.area.update({ where: { id }, data: { code, name, email: email || null } });
  revalidatePath("/areas");
  redirect("/areas");
}

export async function deleteArea(id: string) {
  await requireRole("ADMIN");
  const count = await db.stockMovement.count({ where: { areaId: id } });
  if (count > 0)
    throw new Error("No se puede borrar: tiene movimientos asignados");
  await db.area.delete({ where: { id } });
  revalidatePath("/areas");
  redirect("/areas");
}
