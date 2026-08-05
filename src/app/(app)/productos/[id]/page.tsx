import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProductWithRelations } from "@/lib/queries";
import {
  Badge,
  Card,
  LinkButton,
  PageHeader,
  Td,
  Th,
} from "@/components/ui";
import { MovementBadge } from "@/components/MovementBadge";
import { ProductForm } from "@/components/ProductForm";
import { StockMovementForms } from "@/components/StockMovementForms";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteProduct } from "@/actions/productos";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";

function expiraPronto(fecha: Date | null): boolean {
  if (!fecha) return false;
  return fecha < new Date(Date.now() + 30 * 86400000);
}

export default async function ProductoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const [product, categories, suppliers, areas] = await Promise.all([
    getProductWithRelations(id),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.area.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const canEdit = user.role !== "CONSULTA";
  const low = product.stock <= product.stockMin;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        actions={
          <>
            <LinkButton href="/productos" variant="secondary">
              Volver
            </LinkButton>
            {user.role === "ADMIN" && (
              <ConfirmButton
                action={deleteProduct}
                args={[product.id]}
                label="Borrar producto"
                confirmText={`¿Borrar ${product.name}? Esta acción es definitiva.`}
              />
            )}
          </>
        }
      />

      {product.stock === 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Producto sin stock.
        </div>
      )}
      {low && product.stock > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Stock bajo: quedan {formatNumber(product.stock)} unidades (mínimo{" "}
          {formatNumber(product.stockMin)}).
        </div>
      )}
      {expiraPronto(product.expiryDate) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Vence el {formatDate(product.expiryDate)}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Ficha</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Stock disponible</dt>
              <dd
                className={
                  "font-semibold " +
                  (product.stock === 0
                    ? "text-red-600"
                    : low
                      ? "text-amber-600"
                      : "text-emerald-600")
                }
              >
                {formatNumber(product.stock)} u.
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Stock mínimo</dt>
              <dd>{formatNumber(product.stockMin)} u.</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Precio de compra</dt>
              <dd>{formatCurrency(product.purchasePrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Precio de venta</dt>
              <dd>{formatCurrency(product.salePrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Código de barras</dt>
              <dd className="tnum">{product.barcode ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Categoría</dt>
              <dd>{product.category?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Ubicación</dt>
              <dd>{product.location ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Vencimiento</dt>
              <dd>{formatDate(product.expiryDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Estado</dt>
              <dd>
                {product.active ? (
                  <Badge color="green">Activo</Badge>
                ) : (
                  <Badge color="zinc">Inactivo</Badge>
                )}
              </dd>
            </div>
            {product.description && (
              <div>
                <dt className="text-zinc-500">Descripción</dt>
                <dd className="mt-1 text-zinc-700">{product.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-zinc-500">Proveedores</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {product.suppliers.length === 0 && <span>—</span>}
                {product.suppliers.map((sp) => (
                  <Badge key={sp.supplierId} color="blue">
                    {sp.supplier.name}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">
            Movimientos de stock
          </h2>
          {canEdit && (
            <StockMovementForms
              productId={product.id}
              productName={product.name}
              currentStock={product.stock}
              suppliers={suppliers}
              areas={areas}
            />
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th className="text-right">Cant.</Th>
                  <Th className="text-right">Antes</Th>
                  <Th className="text-right">Después</Th>
                  <Th>Motivo</Th>
                  <Th>Área</Th>
                  <Th>Usuario</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {product.movements.map((m) => (
                  <tr key={m.id}>
                    <Td className="text-zinc-500">
                      {formatDateTime(m.createdAt)}
                    </Td>
                    <Td>
                      <MovementBadge type={m.type} />
                    </Td>
                    <Td
                      className={
                        "text-right font-semibold " +
                        (m.quantity < 0 ? "text-red-600" : "text-emerald-600")
                      }
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </Td>
                    <Td className="text-right">{formatNumber(m.previousStock)}</Td>
                    <Td className="text-right">{formatNumber(m.newStock)}</Td>
                    <Td className="text-zinc-500">{m.reason ?? "—"}</Td>
                    <Td>{m.area?.name ?? "—"}</Td>
                    <Td>{m.user.name}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {product.movements.length === 0 && (
              <p className="py-10 text-center text-sm text-zinc-500">
                Sin movimientos todavía.
              </p>
            )}
          </div>
        </Card>
      </div>

      {canEdit && (
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">
            Editar producto
          </h2>
          <ProductForm
            categories={categories}
            suppliers={suppliers}
            submitLabel="Guardar cambios"
            initial={{
              id: product.id,
              sku: product.sku,
              barcode: product.barcode,
              name: product.name,
              description: product.description,
              categoryId: product.categoryId,
              purchasePrice: product.purchasePrice,
              salePrice: product.salePrice,
              stockMin: product.stockMin,
              location: product.location,
              expiryDate: product.expiryDate,
              active: product.active,
              supplierIds: product.suppliers.map((s) => s.supplierId),
            }}
          />
        </Card>
      )}
    </div>
  );
}
