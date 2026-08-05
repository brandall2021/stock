import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMovements } from "@/lib/queries";
import { Card, EmptyState, PageHeader, Select, Td, Th } from "@/components/ui";
import { MovementBadge } from "@/components/MovementBadge";
import { formatDateTime, formatNumber } from "@/lib/format";
import { MovementType } from "@prisma/client";

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    producto?: string;
    area?: string;
    desde?: string;
    hasta?: string;
    limite?: string;
  }>;
}) {
  await requireAuth();
  const params = await searchParams;

  const [products, areas, movements] = await Promise.all([
    db.product.findMany({ orderBy: { name: "asc" } }),
    db.area.findMany({ orderBy: { name: "asc" } }),
    getMovements({
      type: params.tipo || undefined,
      productId: params.producto || undefined,
      areaId: params.area || undefined,
      from: params.desde || undefined,
      to: params.hasta || undefined,
      limit: params.limite ? Number.parseInt(params.limite, 10) : 100,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Movimientos"
        description="Historial completo de entradas, salidas y ajustes"
      />

      <Card className="mb-4 p-4">
        <form method="GET" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <Select name="tipo" defaultValue={params.tipo ?? ""}>
              <option value="">Todos los tipos</option>
              <option value={MovementType.INGRESO}>Ingresos</option>
              <option value={MovementType.SALIDA}>Salidas</option>
              <option value={MovementType.AJUSTE}>Ajustes</option>
            </Select>
          </div>
          <div>
            <Select name="producto" defaultValue={params.producto ?? ""}>
              <option value="">Todos los productos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select name="area" defaultValue={params.area ?? ""}>
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <input
              type="date"
              name="desde"
              defaultValue={params.desde ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div>
            <input
              type="date"
              name="hasta"
              defaultValue={params.hasta ?? ""}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Filtrar
            </button>
            <a
              href="/movimientos"
              className="flex items-center rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Limpiar
            </a>
          </div>
        </form>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <Th>Fecha</Th>
                <Th>Producto</Th>
                <Th>Tipo</Th>
                <Th className="text-right">Cant.</Th>
                <Th className="text-right">Antes</Th>
                <Th className="text-right">Después</Th>
                <Th>Motivo</Th>
                <Th>Retira/Entrega</Th>
                <Th>Observaciones</Th>
                <Th>Proveedor</Th>
                <Th>Área</Th>
                <Th>Usuario</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {movements.map((m) => (
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
                  <Td className="text-zinc-500">{m.retiraEntrega ?? "—"}</Td>
                  <Td className="text-zinc-500">{m.observaciones ?? "—"}</Td>
                  <Td>{m.supplier?.name ?? "—"}</Td>
                  <Td>{m.area?.name ?? "—"}</Td>
                  <Td>{m.user.name}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 && (
            <EmptyState message="No hay movimientos que coincidan con el filtro." />
          )}
        </div>
      </Card>
    </div>
  );
}
