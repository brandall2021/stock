"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type SearchSelectOption = { value: string; label: string };

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function SearchSelect({
  name,
  options,
  placeholder = "Buscar…",
  emptyLabel,
  required = false,
  defaultValue = "",
  className,
}: {
  name: string;
  options: SearchSelectOption[];
  placeholder?: string;
  emptyLabel?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  const [query, setQuery] = useState(() => {
    const sel = options.find((o) => o.value === defaultValue);
    return sel ? sel.label : "";
  });
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [value, setValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const q = normalize(query);
    const matches = q
      ? options.filter((o) => normalize(o.label).includes(q))
      : options;
    return emptyLabel && !q
      ? [{ value: "", label: emptyLabel }, ...matches]
      : matches;
  }, [options, query, emptyLabel]);

  const safeHighlight = Math.max(0, Math.min(highlight, list.length - 1));

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selectOption = (opt: { value: string; label: string }) => {
    setValue(opt.value);
    setQuery(opt.label);
    setOpen(false);
  };

  const clear = () => {
    setValue("");
    setQuery("");
    setHighlight(0);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      if (list.length > 0) setHighlight((h) => Math.min(h + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open && list.length > 0) {
      e.preventDefault();
      selectOption(list[safeHighlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${name}-listbox`}
          aria-required={required}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setValue("");
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpiar selección"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        ) : (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            ▾
          </span>
        )}
      </div>
      {open && (
        <ul
          id={`${name}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          {list.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">Sin resultados</li>
          )}
          {list.map((opt, i) => (
            <li
              key={opt.value || "__empty__"}
              role="option"
              aria-selected={opt.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectOption(opt)}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm",
                i === safeHighlight ? "bg-accent-soft text-accent" : "text-slate-700",
                opt.value === value && "font-semibold"
              )}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
