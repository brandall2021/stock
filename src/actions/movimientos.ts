"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { MovementType } from "@prisma/client";

function toInt(value: FormDataEntryValue | null): number {
  return Number.parseInt(String(value ?? "0"), 10);
}

function toFloat(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

export async function registerIngreso(formData: FormData) {
  const user = await requireRole(["ADMIN", "OPERADOR"]);
  const productId = String(formData.get("productId") ?? "");
  const quantity = toInt(formData.get("quantity"));
  const areaId = str(formData.get("areaId"));

  if (!productId || quantity <= 0) throw new Error("Datos inválidos");

  await db.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    const previousStock = product.stock;
    const newStock = previousStock + quantity;

    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: MovementType.INGRESO,
        quantity,
        unitCost: toFloat(formData.get("unitCost")),
        supplierId: str(formData.get("supplierId")) ?? undefined,
        invoiceNumber: str(formData.get("invoiceNumber")),
        reason: str(formData.get("reason")),
        areaId: areaId ?? undefined,
        previousStock,
        newStock,
        userId: user.id,
      },
    });
  });

  revalidatePath("/movimientos");
  revalidatePath("/ingresos");
  revalidatePath(`/productos/${productId}`);
  redirect("/ingresos");
}

export async function registerSalida(formData: FormData) {
  const user = await requireRole(["ADMIN", "OPERADOR"]);
  const productId = String(formData.get("productId") ?? "");
  const quantity = toInt(formData.get("quantity"));
  const areaId = str(formData.get("areaId"));

  if (!productId || quantity <= 0) throw new Error("Datos inválidos");

  await db.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    if (product.stock < quantity)
      throw new Error(
        `Stock insuficiente: disponible ${product.stock} y se intenta descontar ${quantity}`
      );

    const previousStock = product.stock;
    const newStock = previousStock - quantity;

    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: MovementType.SALIDA,
        quantity,
        reason: str(formData.get("reason")) ?? "Asignación a cátedra",
        areaId: areaId ?? undefined,
        previousStock,
        newStock,
        userId: user.id,
      },
    });
  });

  revalidatePath("/movimientos");
  revalidatePath("/salidas");
  revalidatePath(`/productos/${productId}`);
  redirect("/salidas");
}

export async function registerAjuste(formData: FormData) {
  const user = await requireRole(["ADMIN", "OPERADOR"]);
  const productId = String(formData.get("productId") ?? "");
  const delta = toInt(formData.get("delta"));

  if (!productId || delta === 0) throw new Error("Datos inválidos");

  await db.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    if (delta < 0 && product.stock < Math.abs(delta))
      throw new Error("El ajuste negativo supera el stock disponible");

    const previousStock = product.stock;
    const newStock = previousStock + delta;

    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: MovementType.AJUSTE,
        quantity: delta,
        unitCost: toFloat(formData.get("unitCost")),
        reason: str(formData.get("reason")) ?? "Ajuste manual",
        previousStock,
        newStock,
        userId: user.id,
      },
    });
  });

  revalidatePath("/movimientos");
  revalidatePath(`/productos/${productId}`);
  redirect("/movimientos");
}
