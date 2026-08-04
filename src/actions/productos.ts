"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

function toFloat(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toInt(value: FormDataEntryValue | null): number {
  const n = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value: FormDataEntryValue | null): Date | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getSupplierIds(formData: FormData): string[] {
  return formData
    .getAll("supplierIds")
    .map((s) => String(s).trim())
    .filter(Boolean);
}

export async function createProduct(formData: FormData) {
  const user = await requireRole(["ADMIN", "OPERADOR"]);
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!sku || !name) throw new Error("SKU y nombre son obligatorios");

  const existing = await db.product.findUnique({ where: { sku } });
  if (existing) throw new Error("Ya existe un producto con ese SKU");

  const data = {
    sku,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    categoryId: String(formData.get("categoryId") ?? "") || null,
    purchasePrice: toFloat(formData.get("purchasePrice")),
    salePrice: toFloat(formData.get("salePrice")),
    stockMin: toInt(formData.get("stockMin")),
    location: String(formData.get("location") ?? "").trim() || null,
    expiryDate: toDate(formData.get("expiryDate")),
    suppliers: {
      create: getSupplierIds(formData).map((supplierId) => ({ supplierId })),
    },
  };

  await db.product.create({ data });
  revalidatePath("/productos");
  redirect("/productos");
}

export async function updateProduct(formData: FormData) {
  await requireRole(["ADMIN", "OPERADOR"]);
  const id = String(formData.get("id") ?? "");
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !sku || !name) throw new Error("Datos incompletos");

  const dup = await db.product.findFirst({ where: { sku, id: { not: id } } });
  if (dup) throw new Error("Ya existe un producto con ese SKU");

  const supplierIds = getSupplierIds(formData);

  await db.$transaction(async (tx) => {
    await tx.supplierProduct.deleteMany({ where: { productId: id } });
    await tx.product.update({
      where: { id },
      data: {
        sku,
        name,
        description: String(formData.get("description") ?? "").trim() || null,
        categoryId: String(formData.get("categoryId") ?? "") || null,
        purchasePrice: toFloat(formData.get("purchasePrice")),
        salePrice: toFloat(formData.get("salePrice")),
        stockMin: toInt(formData.get("stockMin")),
        location: String(formData.get("location") ?? "").trim() || null,
        expiryDate: toDate(formData.get("expiryDate")),
        active: formData.get("active") === "on",
        suppliers: {
          create: supplierIds.map((supplierId) => ({ supplierId })),
        },
      },
    });
  });

  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  redirect(`/productos/${id}`);
}

export async function toggleProductActive(id: string, active: boolean) {
  await requireRole(["ADMIN", "OPERADOR"]);
  await db.product.update({ where: { id }, data: { active } });
  revalidatePath("/productos");
}

export async function deleteProduct(id: string) {
  await requireRole("ADMIN");
  const count = await db.stockMovement.count({ where: { productId: id } });
  if (count > 0)
    throw new Error("No se puede borrar: tiene movimientos. Desactivá el producto en su lugar.");
  await db.supplierProduct.deleteMany({ where: { productId: id } });
  await db.product.delete({ where: { id } });
  revalidatePath("/productos");
  redirect("/productos");
}
