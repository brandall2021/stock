import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LinkButton } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { ProductLabel } from "@/components/ProductLabel";
import {
  BARCODE_SYMBOLOGY_LABELS,
  barcodeSymbology,
  effectiveBarcode,
} from "@/lib/codes";

export default async function EtiquetaProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) notFound();

  const symbology = barcodeSymbology(effectiveBarcode(product));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Etiqueta del producto
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vista previa · 100 × 60 mm · {BARCODE_SYMBOLOGY_LABELS[symbology]}{" "}
            + QR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/productos/${product.id}`} variant="secondary">
            Volver
          </LinkButton>
          <PrintButton label="Imprimir etiqueta" />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-slate-50 p-4 print:border-0 print:bg-white print:p-0">
        <ProductLabel
          product={{
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            description: product.description,
            categoryName: product.category?.name,
            salePrice: product.salePrice,
            stock: product.stock,
          }}
          className="label-preview mx-auto min-h-[52mm] w-[92mm] p-3 shadow-card print:border-0 print:shadow-none"
        />
      </div>

      <style>{`
        @media print {
          @page {
            size: 100mm 60mm;
            margin: 4mm;
          }
          .label-preview {
            width: 92mm;
            min-height: 52mm;
          }
        }
      `}</style>
    </div>
  );
}
