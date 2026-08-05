export function formatCurrency(value: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const MOVEMENT_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  CONSULTA: "Consulta",
};

export const SALIDA_REASONS = [
  "Asignación a cátedra",
  "Uso interno",
  "Rotura",
  "Devolución",
  "Ajuste manual",
];

export function isLowStock(
  stock: number,
  stockMin: number
): boolean {
  return stock <= stockMin;
}
