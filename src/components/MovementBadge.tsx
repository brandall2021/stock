import { Badge } from "@/components/ui";

export function MovementBadge({ type }: { type: string }) {
  if (type === "INGRESO") return <Badge color="green">Ingreso</Badge>;
  if (type === "SALIDA") return <Badge color="red">Salida</Badge>;
  return <Badge color="amber">Ajuste</Badge>;
}
