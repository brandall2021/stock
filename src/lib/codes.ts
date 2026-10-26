import bwipjs from "bwip-js/node";

export type CodeProduct = {
  id?: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryName?: string | null;
};

export type BarcodeSymbology = "ean13" | "ean8" | "code128";

export const BARCODE_SYMBOLOGY_LABELS: Record<BarcodeSymbology, string> = {
  ean13: "EAN-13",
  ean8: "EAN-8",
  code128: "Code 128",
};

function hasValidCheckDigit(value: string): boolean {
  const digits = value.split("").map(Number);
  const check = digits.pop();
  if (check === undefined) return false;

  let sum = 0;
  let weight = 3;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10 === check;
}

export function barcodeSymbology(value: string): BarcodeSymbology {
  if (/^\d{13}$/.test(value) && hasValidCheckDigit(value)) return "ean13";
  if (/^\d{8}$/.test(value) && hasValidCheckDigit(value)) return "ean8";
  return "code128";
}

export function effectiveBarcode(product: CodeProduct): string {
  return product.barcode?.trim() || product.sku.trim();
}

export function isGeneratedBarcode(product: CodeProduct): boolean {
  return !product.barcode?.trim();
}

export function qrContent(product: CodeProduct): string {
  const lines = [`Código: ${product.sku}`];
  if (product.name) lines.push(`Producto: ${product.name}`);
  if (product.description?.trim()) {
    lines.push(`Descripción: ${product.description.trim()}`);
  }
  return lines.join("\n");
}

export function renderBarcodeSvg(value: string, scale = 2): string {
  const text = value.trim();
  if (!text) return "";

  const common = {
    text,
    scale,
    height: 12,
    includetext: false,
    backgroundcolor: "FFFFFF",
  };

  try {
    return bwipjs.toSVG({ ...common, bcid: barcodeSymbology(text) });
  } catch {
    try {
      return bwipjs.toSVG({ ...common, bcid: "code128" });
    } catch {
      return "";
    }
  }
}

export function renderQrSvg(text: string, scale = 3): string {
  if (!text.trim()) return "";
  try {
    return bwipjs.toSVG({
      bcid: "qrcode",
      text,
      scale,
      backgroundcolor: "FFFFFF",
    });
  } catch {
    return "";
  }
}
