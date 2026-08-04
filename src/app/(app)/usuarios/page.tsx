import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader, Td, Th } from "@/components/ui";
import { UserForm } from "@/components/UserForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteUser } from "@/actions/usuarios";
import { ROLE_LABELS, formatDateTime } from "@/lib/format";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>;
}) {
  const me = await requireAuth();
  const { editar } = await searchParams;

  const users = await db.user.findMany({ orderBy: { name: "asc" } });
  const editing = editar ? users.find((u) => u.id === editar) : undefined;

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Administración de accesos y permisos"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">
              {editing ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            <UserForm
              key={editing?.id ?? "new"}
              initial={
                editing
                  ? {
                      id: editing.id,
                      name: editing.name,
                      email: editing.email,
                      role: editing.role,
                      active: editing.active,
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
                  <Th>Email</Th>
                  <Th>Rol</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <Td className="font-medium text-zinc-900">
                      {u.name}
                      {u.id === me.id && (
                        <span className="ml-2 text-xs text-zinc-400">(vos)</span>
                      )}
                    </Td>
                    <Td className="text-zinc-600">{u.email}</Td>
                    <Td>
                      <Badge color={u.role === "ADMIN" ? "blue" : "zinc"}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </Td>
                    <Td>
                      {u.active ? (
                        <Badge color="green">Activo</Badge>
                      ) : (
                        <Badge color="red">Inactivo</Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`?editar=${u.id}`}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          Editar
                        </a>
                        {u.id !== me.id && (
                          <ConfirmButton
                            action={deleteUser}
                            args={[u.id]}
                            label="Borrar"
                            confirmText={`¿Borrar al usuario ${u.name}?`}
                          />
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <EmptyState message="No hay usuarios." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
