import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, Td, Th } from "@/components/ui";
import { CategoryForm } from "@/components/CategoryForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteCategory } from "@/actions/categorias";
import { formatNumber } from "@/lib/format";

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  await requireAuth();
  const { editar } = await searchParams;

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const editing = editar
    ? categories.find((c) => c.id === editar)
    : undefined;

  return (
    <div>
      <PageHeader
        title="Categorías"
        description="Ordená tus productos por categoría"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">
              {editing ? "Editar categoría" : "Nueva categoría"}
            </h2>
            <CategoryForm
              key={editing?.id ?? "new"}
              initial={editing ? { id: editing.id, name: editing.name, description: editing.description } : undefined}
            />
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <Th>Nombre</Th>
                  <Th>Descripción</Th>
                  <Th className="text-right">Productos</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <Td className="font-medium text-zinc-900">{c.name}</Td>
                    <Td className="text-zinc-500">{c.description ?? "—"}</Td>
                    <Td className="text-right">{formatNumber(c._count.products)}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`?editar=${c.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          Editar
                        </a>
                        <ConfirmButton
                          action={deleteCategory}
                          args={[c.id]}
                          label="Borrar"
                          confirmText={`¿Borrar la categoría ${c.name}?`}
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && (
              <EmptyState message="Todavía no hay categorías." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
