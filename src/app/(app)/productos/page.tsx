import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  LinkButton,
  PageHeader,
  Td,
  Th,
} from "@/components/ui";
import { CategorySelect } from "@/components/CategorySelect";
import { SearchInput } from "@/components/SearchInput";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";
import { toggleProductActive, deleteProduct } from "@/actions/productos";
import { cn } from "@/lib/cn";

type Status = { label: string; color: "green" | "amber" | "red" | "blue" };

function stockStatus(
  stock: number,
  stockMin: number,
  expiryDate: Date | null
): Status {
  if (stock === 0) return { label: "Agotado", color: "red" };
  if (stock <= stockMin) return { label: "Bajo stock", color: "amber" };
  if (expiryDate) {
    const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    if (expiryDate <= soon) return { label: "Vence pronto", color: "blue" };
  }
  return { label: "Disponible", color: "green" };
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string }>;
}) {
  const user = await requireAuth();
  const { q, categoria, estado } = await searchParams;
  const canEdit = user.role !== "CONSULTA";

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  const allProducts = await db.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const qLower = q?.toLowerCase();
  const products = allProducts.filter((p) => {
    if (qLower) {
      const haystack = [p.name, p.sku, p.description ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(qLower)) return false;
    }
    if (categoria && p.categoryId !== categoria) return false;
    if (estado === "disponible" && stockStatus(p.stock, p.stockMin, p.expiryDate).color !== "green")
      return false;
    if (estado === "bajo" && !(p.stock > 0 && p.stock <= p.stockMin)) return false;
    if (estado === "agotado" && p.stock !== 0) return false;
    return true;
  });

  const stateChips = [
    { key: "todo", label: "Todos", active: !estado, href: "/productos" },
    { key: "disponible", label: "Disponible", active: estado === "disponible", href: "/productos?estado=disponible" },
    { key: "bajo", label: "Bajo stock", active: estado === "bajo", href: "/productos?estado=bajo" },
    { key: "agotado", label: "Agotado", active: estado === "agotado", href: "/productos?estado=agotado" },
  ];

  return (
    <div>
      <PageHeader
        title="Productos"
        description={`${products.length} producto${products.length === 1 ? "" : "s"}`}
        actions={
          canEdit ? (
            <LinkButton href="/productos/nuevo">Nuevo producto</LinkButton>
          ) : undefined
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <SearchInput placeholder="Buscar por nombre, SKU o descripción…" />
          <div className="flex flex-wrap gap-1.5">
            {stateChips.map((c) => (
              <Chip key={c.key} href={c.href} active={c.active}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <CategorySelect categories={categories} />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Producto</Th>
                <Th>Categoría</Th>
                <Th className="text-right">Stock</Th>
                <Th className="text-right">Precio</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const status = stockStatus(p.stock, p.stockMin, p.expiryDate);
                const isInactive = !p.active;
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "transition-colors hover:bg-slate-50",
                      isInactive && "opacity-60"
                    )}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold uppercase text-slate-500">
                          {p.sku.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/productos/${p.id}`}
                            className="block truncate font-medium text-slate-800 hover:text-accent"
                          >
                            {p.name}
                          </Link>
                          <p className="tnum text-xs text-slate-400">{p.sku}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-slate-500">
                      {p.category?.name ?? "—"}
                    </Td>
                    <Td
                      className={cn(
                        "text-right font-semibold tnum",
                        status.color === "red"
                          ? "text-danger"
                          : status.color === "amber"
                            ? "text-warning"
                            : "text-slate-900"
                      )}
                    >
                      {formatNumber(p.stock)}
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        / mín {formatNumber(p.stockMin)}
                      </span>
                    </Td>
                    <Td className="tnum text-right text-slate-700">
                      {formatCurrency(p.salePrice)}
                    </Td>
                    <Td>
                      {isInactive ? (
                        <Badge color="zinc">Inactivo</Badge>
                      ) : (
                        <Badge color={status.color}>{status.label}</Badge>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <ConfirmButton
                            action={toggleProductActive}
                            args={[p.id, !p.active]}
                            label={p.active ? "Desactivar" : "Activar"}
                            variant="ghost"
                            confirmText={`¿${p.active ? "Desactivar" : "Activar"} ${p.name}?`}
                          />
                        )}
                        {user.role === "ADMIN" && (
                          <ConfirmButton
                            action={deleteProduct}
                            args={[p.id]}
                            label="Borrar"
                            confirmText={`¿Borrar ${p.name}? Esta acción es definitiva.`}
                          />
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <EmptyState message="No hay productos que coincidan con los filtros." />
          )}
        </div>
      </Card>
    </div>
  );
}
