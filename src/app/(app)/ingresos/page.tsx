import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, Td, Th } from "@/components/ui";
import { IngresoForm } from "@/components/IngresoForm";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { MovementType } from "@prisma/client";

export default async function IngresosPage() {
  await requireAuth();
  const [products, suppliers, ingresos] = await Promise.all([
    db.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    db.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    db.stockMovement.findMany({
      where: { type: MovementType.INGRESO },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: true, supplier: true, user: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Ingresos de stock"
        description="Registrá cuando entra mercadería"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">
              Nuevo ingreso
            </h2>
            <IngresoForm products={products} suppliers={suppliers} />
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Últimos ingresos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <Th>Fecha</Th>
                  <Th>Producto</Th>
                  <Th className="text-right">Cant.</Th>
                  <Th className="text-right">Costo</Th>
                  <Th>Proveedor</Th>
                  <Th>Factura</Th>
                  <Th>Usuario</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ingresos.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50">
                    <Td className="text-zinc-500">{formatDateTime(m.createdAt)}</Td>
                    <Td>
                      <Link
                        href={`/productos/${m.productId}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {m.product.name}
                      </Link>
                    </Td>
                    <Td className="text-right font-semibold text-emerald-600">
                      +{formatNumber(m.quantity)}
                    </Td>
                    <Td className="text-right">
                      {formatCurrency(m.quantity * m.unitCost)}
                    </Td>
                    <Td>{m.supplier?.name ?? "—"}</Td>
                    <Td className="font-mono text-xs">{m.invoiceNumber ?? "—"}</Td>
                    <Td>{m.user.name}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ingresos.length === 0 && (
              <EmptyState message="No hay ingresos registrados." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
