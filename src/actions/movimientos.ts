"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
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
  const reason = str(formData.get("reason")) ?? "Asignación a cátedra";

  if (!productId || quantity <= 0) throw new Error("Datos inválidos");

  let productName = "";
  let productSku = "";
  let previousStock = 0;
  let newStock = 0;

  await db.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
    });
    if (product.stock < quantity)
      throw new Error(
        `Stock insuficiente: disponible ${product.stock} y se intenta descontar ${quantity}`
      );

    previousStock = product.stock;
    newStock = previousStock - quantity;
    productName = product.name;
    productSku = product.sku;

    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
    await tx.stockMovement.create({
      data: {
        productId,
        type: MovementType.SALIDA,
        quantity,
        reason,
        areaId: areaId ?? undefined,
        previousStock,
        newStock,
        userId: user.id,
      },
    });
  });

  if (areaId) {
    const area = await db.area.findUnique({
      where: { id: areaId },
      select: { code: true, name: true, email: true },
    });
    if (area?.email) {
      await sendMail({
        to: area.email,
        subject: `Salida de stock: ${productSku} · ${area.code}`,
        text:
          `Se registró una salida de stock:\n\n` +
          `Producto: ${productName} (${productSku})\n` +
          `Cantidad: ${quantity}\n` +
          `Área destino: ${area.name} (${area.code})\n` +
          `Motivo: ${reason}\n` +
          `Stock previo: ${previousStock} → nuevo: ${newStock}\n` +
          `Registrado por: ${user.name ?? user.email}\n` +
          `Fecha: ${new Date().toLocaleString("es-AR")}`,
      });
    }
  }

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
