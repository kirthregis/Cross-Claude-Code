"use client";

import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{children}</div>;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
  id,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "subtle";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  id?: string;
}) {
  const styles: Record<string, string> = {
    primary:
      "brand-grad text-white shadow-lg brand-shadow active:scale-[0.98]",
    ghost: "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600",
    subtle: "bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700",
    danger: "border border-red-900 bg-red-950/40 text-red-300 hover:bg-red-900/40",
  };
  return (
    <button
      type={type}
      id={id}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className="font-mono text-xs text-fuchsia-300">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="brand-accent h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700"
      />
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 text-left"
    >
      <span className="text-sm text-zinc-300">{label}</span>
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-zinc-700 transition" style={checked ? { backgroundColor: "var(--brand-1)" } : undefined}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function StatusBadge({ status }: { status: "pass" | "warn" | "fail" | "skip" }) {
  const styles: Record<string, string> = {
    pass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    fail: "bg-red-500/15 text-red-300 border-red-500/30",
    skip: "bg-zinc-700/30 text-zinc-400 border-zinc-700",
  };
  const label = { pass: "PASS", warn: "WARN", fail: "FAIL", skip: "SKIP" }[status];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${styles[status]}`}>
      {label}
    </span>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          {i > 0 && <div className={`h-px w-4 sm:w-6 ${i <= current ? "bg-fuchsia-500" : "bg-zinc-700"}`} />}
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              i < current
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : i === current
                  ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                  : "border-zinc-700 bg-zinc-900 text-zinc-500"
            }`}
          >
            {i < current ? "✓" : i + 1} {s}
          </div>
        </div>
      ))}
    </div>
  );
}
