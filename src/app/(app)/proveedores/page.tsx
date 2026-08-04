import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader, Td, Th } from "@/components/ui";
import { SupplierForm } from "@/components/SupplierForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteSupplier } from "@/actions/proveedores";
import { formatNumber } from "@/lib/format";

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await requireAuth();
  const { editar } = await searchParams;

  const suppliers = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const editing = editar
    ? suppliers.find((s) => s.id === editar)
    : undefined;

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description="Quiénes abastecen tus productos"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">
              {editing ? "Editar proveedor" : "Nuevo proveedor"}
            </h2>
            <SupplierForm
              key={editing?.id ?? "new"}
              initial={
                editing
                  ? {
                      id: editing.id,
                      name: editing.name,
                      taxId: editing.taxId,
                      phone: editing.phone,
                      email: editing.email,
                      address: editing.address,
                    }
                  : undefined
              }
            />
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <Th>Nombre</Th>
                  <Th>CUIT / RUC / NIF</Th>
                  <Th>Contacto</Th>
                  <Th className="text-right">Productos</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <Td className="font-medium text-zinc-900">{s.name}</Td>
                    <Td className="font-mono text-xs">{s.taxId ?? "—"}</Td>
                    <Td>
                      <div className="text-zinc-700">{s.phone ?? "—"}</div>
                      <div className="text-xs text-zinc-500">{s.email ?? ""}</div>
                    </Td>
                    <Td className="text-right">
                      <Badge color="blue">{formatNumber(s._count.products)}</Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`?editar=${s.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          Editar
                        </a>
                        <ConfirmButton
                          action={deleteSupplier}
                          args={[s.id]}
                          label="Borrar"
                          confirmText={`¿Borrar el proveedor ${s.name}?`}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length === 0 && (
              <EmptyState message="Todavía no hay proveedores." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
