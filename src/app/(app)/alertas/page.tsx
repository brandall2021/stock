import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getAlerts } from "@/lib/queries";
import { Card, PageHeader, Td, Th, EmptyState, Badge } from "@/components/ui";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default async function AlertasPage() {
  await requireAuth();
  const { lowStock, zeroStock, expiring } = await getAlerts();
  const total = lowStock.length + zeroStock.length + expiring.length;

  return (
    <div>
      <PageHeader
        title="Alertas"
        description={
          total === 0
            ? "No hay alertas activas"
            : `${total} alerta${total === 1 ? "" : "s"} activa${total === 1 ? "" : "s"}`
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Badge color={zeroStock.length > 0 ? "red" : "green"}>
                {zeroStock.length}
              </Badge>
              Sin stock
            </h2>
          </div>
          <div className="p-4">
            {zeroStock.length === 0 ? (
              <EmptyState message="Ningún producto sin stock." />
            ) : (
              <ul className="divide-y divide-zinc-100">
                {zeroStock.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/productos/${p.id}`}
                      className="flex items-center justify-between px-2 py-3 hover:bg-zinc-50"
                    >
                      <span className="text-sm font-medium text-zinc-900">
                        {p.name}
                      </span>
                      <span className="text-xs text-zinc-500">{p.sku}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Badge color={lowStock.length > 0 ? "amber" : "green"}>
                {lowStock.length}
              </Badge>
              Stock bajo
            </h2>
          </div>
          <div className="p-4">
            {lowStock.length === 0 ? (
              <EmptyState message="Ningún producto por debajo del mínimo." />
            ) : (
              <ul className="divide-y divide-zinc-100">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/productos/${p.id}`}
                      className="flex items-center justify-between px-2 py-3 hover:bg-zinc-50"
                    >
                      <div>
                        <span className="text-sm font-medium text-zinc-900">
                          {p.name}
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">
                          {formatNumber(p.stock)}/{formatNumber(p.stockMin)} u.
                        </span>
                      </div>
                      <Badge color="amber">Reponer</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <div className="border-b border-zinc-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Badge color={expiring.length > 0 ? "amber" : "green"}>
                {expiring.length}
              </Badge>
              Vence pronto (30 días)
            </h2>
          </div>
          <div className="p-4">
            {expiring.length === 0 ? (
              <EmptyState message="Ningún producto por vencer." />
            ) : (
              <ul className="divide-y divide-zinc-100">
                {expiring.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/productos/${p.id}`}
                      className="flex items-center justify-between px-2 py-3 hover:bg-zinc-50"
                    >
                      <span className="text-sm font-medium text-zinc-900">
                        {p.name}
                      </span>
                      <span className="text-xs text-amber-600">
                        Vence {formatDate(p.expiryDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
