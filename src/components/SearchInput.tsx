"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useState, useEffect } from "react";

export function SearchInput({
  placeholder = "Buscar…",
  param = "q",
}: {
  placeholder?: string;
  param?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(param) ?? "");
  const deferred = useDeferredValue(value);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (deferred.trim()) params.set(param, deferred.trim());
      else params.delete(param);
      router.replace(`?${params.toString()}`);
    }, 300);
    return () => clearTimeout(t);
  }, [deferred, param, router, searchParams]);

  return (
    <div className="relative">
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
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}
