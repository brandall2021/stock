import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/ProductForm";

export default async function NuevoProductoPage() {
  await requireAuth();
  const [categories, suppliers] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Nuevo producto"
        description="Completá los datos del producto. El stock inicial se ajusta desde Movimientos o Ajustes."
      />
      <Card className="max-w-3xl p-6">
        <ProductForm categories={categories} suppliers={suppliers} />
      </Card>
    </div>
  );
}
