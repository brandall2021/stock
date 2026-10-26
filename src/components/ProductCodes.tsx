import { Card, LinkButton } from "@/components/ui";
import {
  BARCODE_SYMBOLOGY_LABELS,
  barcodeSymbology,
  effectiveBarcode,
  isGeneratedBarcode,
  qrContent,
  renderBarcodeSvg,
  renderQrSvg,
  type CodeProduct,
} from "@/lib/codes";

export function ProductCodes({ product }: { product: CodeProduct }) {
  const code = effectiveBarcode(product);
  const symbology = barcodeSymbology(code);
  const barcodeSvg = renderBarcodeSvg(code);
  const content = qrContent(product);
  const qrSvg = renderQrSvg(content);

  return (
    <Card className="mt-6 p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Códigos de identificación
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Código de barras {BARCODE_SYMBOLOGY_LABELS[symbology]} y QR con
            código, nombre y descripción.
          </p>
        </div>
        {product.id && (
          <LinkButton
            href={`/productos/${product.id}/etiqueta`}
            variant="secondary"
          >
            Imprimir etiqueta
          </LinkButton>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Código de barras · {BARCODE_SYMBOLOGY_LABELS[symbology]}
          </p>
          {barcodeSvg ? (
            <div
              className="mt-4 overflow-hidden [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: barcodeSvg }}
            />
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No se pudo generar el código de barras.
            </p>
          )}
          <p className="mt-4 break-all text-center font-mono text-sm tracking-[0.18em] text-slate-800">
            {code}
          </p>
          <p className="mt-1 text-center text-[11px] text-slate-500">
            {isGeneratedBarcode(product)
              ? "Generado desde el SKU del producto."
              : "Código de barras registrado del producto."}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            QR · código + descripción
          </p>
          {qrSvg ? (
            <div
              className="mx-auto mt-3 w-40 max-w-full [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No se pudo generar el código QR.
            </p>
          )}
          <pre className="mt-4 whitespace-pre-wrap rounded-md bg-slate-50 p-3 font-sans text-[11px] leading-relaxed text-slate-600">
            {content}
          </pre>
        </div>
      </div>
    </Card>
  );
}
