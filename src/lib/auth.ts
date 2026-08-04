import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role, User } from "@prisma/client";

export const SESSION_COOKIE = "stock_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

export type SessionUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "active"
>;

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({ data: { token, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || !session.user.active) return null;
  if (session.expiresAt < new Date()) {
    await db.session.deleteMany({ where: { token } });
    return null;
  }

  const { id, name, email, role, active } = session.user;
  return { id, name, email, role, active };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(
  roles: Role | Role[],
  fallback = "/"
): Promise<SessionUser> {
  const user = await requireAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) redirect(fallback);
  return user;
}
