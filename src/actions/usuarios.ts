"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";

function parseRole(value: FormDataEntryValue | null): Role {
  const v = String(value ?? "");
  return v === "ADMIN" || v === "OPERADOR" || v === "CONSULTA" ? (v as Role) : Role.OPERADOR;
}

export async function createUser(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6)
    throw new Error("Nombre, email y contraseña (mín. 6 caracteres) son obligatorios");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("Ya existe un usuario con ese email");

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: parseRole(formData.get("role")),
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function updateUser(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Usuario no encontrado");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) throw new Error("Datos incompletos");

  const dup = await db.user.findFirst({ where: { email, id: { not: id } } });
  if (dup) throw new Error("Ya existe un usuario con ese email");

  const password = String(formData.get("password") ?? "");
  await db.user.update({
    where: { id },
    data: {
      name,
      email,
      role: parseRole(formData.get("role")),
      active: formData.get("active") === "on",
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function deleteUser(id: string) {
  await requireRole("ADMIN");
  const me = await requireRole("ADMIN");
  if (id === me.id) throw new Error("No podés borrar tu propio usuario");

  const count = await db.user.count({ where: { id } });
  if (count === 0) throw new Error("Usuario no encontrado");

  const hasMovements = await db.stockMovement.count({ where: { userId: id } });
  if (hasMovements > 0) {
    await db.user.update({ where: { id }, data: { active: false } });
    revalidatePath("/usuarios");
    redirect("/usuarios");
  }

  await db.session.deleteMany({ where: { userId: id } });
  await db.user.delete({ where: { id } });
  revalidatePath("/usuarios");
  redirect("/usuarios");
}
