"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CategorySelect({
  categories,
  param = "categoria",
}: {
  categories: { id: string; name: string }[];
  param?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      name={param}
      defaultValue={searchParams.get(param) ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set(param, e.target.value);
        else params.delete(param);
        router.push(`?${params.toString()}`);
      }}
      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-900 transition-shadow focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      <option value="">Todas las categorías</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
