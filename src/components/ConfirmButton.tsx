"use client";

import { useState, useTransition } from "react";

type ServerAction = (...args: never[]) => Promise<void>;

export function ConfirmButton({
  action,
  args = [],
  label,
  confirmText,
  variant = "danger",
}: {
  action: ServerAction;
  args?: unknown[];
  label: string;
  confirmText?: string;
  variant?: "danger" | "ghost";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(confirmText ?? `¿Confirmás ${label.toLowerCase()}?`)
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            try {
              await action(...(args as never[]));
            } catch (e) {
              setError(e instanceof Error ? e.message : "Ocurrió un error");
            }
          });
        }}
        className={
          variant === "danger"
            ? "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft disabled:opacity-50"
            : "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        }
      >
        {pending ? "Procesando…" : label}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
