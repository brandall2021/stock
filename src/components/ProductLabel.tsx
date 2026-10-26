import { cn } from "@/lib/cn";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  effectiveBarcode,
  qrContent,
  renderBarcodeSvg,
  renderQrSvg,
  type CodeProduct,
} from "@/lib/codes";

export type ProductLabelData = CodeProduct & {
  salePrice?: number;
  stock?: number;
};

export function ProductLabel({
  product,
  className,
  barcodeScale = 2,
  qrScale = 4,
}: {
  product: ProductLabelData;
  className?: string;
  barcodeScale?: number;
  qrScale?: number;
}) {
  const code = effectiveBarcode(product);
  const barcodeSvg = renderBarcodeSvg(code, barcodeScale);
  const qrSvg = renderQrSvg(qrContent(product), qrScale);
  const showFooter =
    product.salePrice !== undefined || product.stock !== undefined;

  return (
    <div
      className={cn(
        "product-label flex flex-col justify-between rounded-lg border border-line bg-white text-slate-900",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[8pt] font-medium uppercase tracking-wider text-slate-500">
            {product.categoryName ?? "Sin categoría"} · {product.sku}
          </p>
          <p className="mt-1 line-clamp-2 text-[11pt] font-semibold leading-tight">
            {product.name}
          </p>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-[7pt] leading-tight text-slate-600">
              {product.description}
            </p>
          )}
        </div>
        <div className="w-[22mm] shrink-0">
          {qrSvg && (
            <div
              className="[&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
        </div>
      </div>

      <div className="mt-2">
        {barcodeSvg && (
          <div
            className="mx-auto w-full [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
          />
        )}
        <p className="mt-1 break-all text-center font-mono text-[8pt] tracking-[0.2em]">
          {code}
        </p>
      </div>

      {showFooter && (
        <div className="mt-1 flex items-center justify-between text-[7pt] text-slate-600">
          <span>Precio ref. {formatCurrency(product.salePrice ?? 0)}</span>
          <span>Stock {formatNumber(product.stock ?? 0)} u.</span>
        </div>
      )}
    </div>
  );
}
