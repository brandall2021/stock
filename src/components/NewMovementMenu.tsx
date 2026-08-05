"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { IconArrowDown, IconArrowUp, IconPlus } from "@/components/icons";

export function NewMovementMenu({ canEdit }: { canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!canEdit) return null;

  return (
    <div ref={ref} className="relative">
      <Button onClick={() => setOpen((o) => !o)} className="px-3 sm:px-4">
        <IconPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Nuevo movimiento</span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-lg">
          <Link
            href="/ingresos"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-success-soft hover:text-success"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-soft text-success">
              <IconArrowDown className="h-4 w-4" />
            </span>
            Ingreso de stock
            <span className="ml-auto text-xs text-slate-400">+</span>
          </Link>
          <Link
            href="/salidas"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-soft text-danger">
              <IconArrowUp className="h-4 w-4" />
            </span>
            Salida de stock
            <span className="ml-auto text-xs text-slate-400">−</span>
          </Link>
        </div>
      )}
    </div>
  );
}
