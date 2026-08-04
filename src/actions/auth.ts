"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Ingresá email y contraseña");
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=Credenciales inválidas o usuario inactivo");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
