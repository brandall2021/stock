import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
    secondary:
      "bg-white text-slate-700 border border-line hover:bg-slate-50 shadow-sm",
    danger: "bg-danger text-white hover:bg-red-700 shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button className={cn(btnBase, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
    secondary:
      "bg-white text-slate-700 border border-line hover:bg-slate-50 shadow-sm",
    danger: "bg-danger text-white hover:bg-red-700 shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <Link
      href={href}
      className={cn(btnBase, variants[variant], className)}
    >
      {children}
    </Link>
  );
}

const fieldBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, className)} {...props} />;
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Badge({
  children,
  color = "zinc",
}: {
  children: ReactNode;
  color?: "green" | "red" | "amber" | "zinc" | "blue";
}) {
  const colors = {
    green: "bg-success-soft text-success ring-success/20",
    red: "bg-danger-soft text-danger ring-danger/20",
    amber: "bg-warning-soft text-warning ring-warning/30",
    zinc: "bg-slate-100 text-slate-600 ring-slate-500/20",
    blue: "bg-accent-soft text-accent ring-accent/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 text-sm text-slate-700", className)}>{children}</td>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-slate-500">{message}</div>
  );
}

export function Chip({
  children,
  active,
  onClick,
  href,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    active
      ? "border-accent bg-accent text-white shadow-sm"
      : "border-line bg-white text-slate-600 hover:bg-slate-50"
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
