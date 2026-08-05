import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, Td, Th } from "@/components/ui";
import { AreaForm } from "@/components/AreaForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteArea } from "@/actions/areas";
import { formatNumber } from "@/lib/format";

export default async function AreasPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await requireAuth();
  const { editar } = await searchParams;

  const areas = await db.area.findMany({
    orderBy: [{ code: "asc" }],
    include: { _count: { select: { movements: true } } },
  });
  const editing = editar ? areas.find((a) => a.id === editar) : undefined;

  return (
    <div>
      <PageHeader
        title="Áreas"
        description="Materias, cátedras y dependencias a las que se destina el stock"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">
              {editing ? "Editar área" : "Nueva área"}
            </h2>
            <AreaForm
              key={editing?.id ?? "new"}
              initial={
                editing
                  ? { id: editing.id, code: editing.code, name: editing.name }
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
                  <Th>Código</Th>
                  <Th>Nombre</Th>
                  <Th className="text-right">Movimientos</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {areas.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50">
                    <Td className="font-mono text-xs font-semibold text-indigo-600">
                      {a.code}
                    </Td>
                    <Td className="font-medium text-zinc-900">{a.name}</Td>
                    <Td className="text-right">{formatNumber(a._count.movements)}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`?editar=${a.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          Editar
                        </a>
                        <ConfirmButton
                          action={deleteArea}
                          args={[a.id]}
                          label="Borrar"
                          confirmText={`¿Borrar el área ${a.code} · ${a.name}?`}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {areas.length === 0 && (
              <EmptyState message="Todavía no hay áreas." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
