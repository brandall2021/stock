"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(
          q ? `/productos?q=${encodeURIComponent(q)}` : "/productos"
        );
      }}
      role="search"
    >
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar producto o SKU…"
        className="w-full rounded-lg border border-line bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
        ↵
      </kbd>
    </form>
  );
}
