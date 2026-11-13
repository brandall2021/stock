"use client";

import { useState, useTransition } from "react";
import { setAreaEmail } from "@/actions/areas";
import type { Area } from "@prisma/client";
import { Button, Input } from "@/components/ui";

// Muestra el email de un área seleccionada y, si no tiene, permite
// agregarlo al vuelo. Se usa debajo del selector de área en los
// formularios que registran salidas. Montar con key={areaId} para que
// el estado interno se reinicie al cambiar de área.
export function AreaEmailStatus({ area }: { area: Area | undefined }) {
  const [email, setEmail] = useState<string | null>(area?.email ?? null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();

  if (!area) return null;
  const areaId = area.id;

  function onSave() {
    setError(null);
    startSaving(async () => {
      try {
        const res = await setAreaEmail(areaId, draft);
        setEmail(res.email);
        setDraft("");
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ocurrió un error");
      }
    });
  }

  if (email) {
    return (
      <p className="mt-2 text-sm text-zinc-600">
        📧 Se enviará aviso a:{" "}
        <span className="font-medium text-zinc-900">{email}</span>
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <p className="text-xs text-amber-800">
        Esta área no tiene email: no se enviará aviso de salida.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSave();
            }
          }}
          placeholder="dependencia@dominio.edu.ar"
          className="max-w-64"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={saving || !draft.trim()}
          onClick={onSave}
        >
          {saving ? "Guardando…" : "Guardar email"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      {saved && !error && (
        <p className="mt-1 text-xs text-emerald-700">
          Email guardado. Se usará en las próximas salidas de esta área.
        </p>
      )}
    </div>
  );
}
