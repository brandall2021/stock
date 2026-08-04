"use client";

import { useActionState } from "react";

export type ActionState = { error: string | null };

export function useFormAction(action: (formData: FormData) => Promise<void>) {
  return useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      try {
        await action(formData);
        return { error: null };
      } catch (e) {
        if (typeof e === "object" && e !== null && "digest" in e) throw e;
        return {
          error: e instanceof Error ? e.message : "Ocurrió un error",
        };
      }
    },
    { error: null }
  );
}
