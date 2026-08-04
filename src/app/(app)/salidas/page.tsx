import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, Td, Th } from "@/components/ui";
import { SalidaForm } from "@/components/SalidaForm";
import { formatDateTime, formatNumber } from "@/lib/format";
import { MovementType } from "@prisma/client";

export default async function SalidasPage() {
  await requireAuth();
  const [products, salidas] = await Promise.all([
    db.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    db.stockMovement.findMany({
      where: { type: MovementType.SALIDA },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: true, user: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Salidas de stock"
        description="Registrá cuando se descuenta mercadería"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">
              Nueva salida
            </h2>
            <SalidaForm products={products} />
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Últimas salidas
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <Th>Fecha</Th>
                  <Th>Producto</Th>
                  <Th className="text-right">Cant.</Th>
                  <Th>Motivo</Th>
                  <Th>Usuario</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {salidas.map((m) => (
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
                    <Td className="text-right font-semibold text-red-600">
                      -{formatNumber(m.quantity)}
                    </Td>
                    <Td>{m.reason ?? "—"}</Td>
                    <Td>{m.user.name}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {salidas.length === 0 && (
              <EmptyState message="No hay salidas registradas." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
