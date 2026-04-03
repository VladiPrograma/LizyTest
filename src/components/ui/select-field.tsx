"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectFieldOption = {
  label: string;
  value: string | number;
};

type SelectFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  className?: string;
};

type CompactSelectFieldProps = {
  label: string;
  value: string | number;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  className?: string;
};

type DateFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  min?: string;
  max?: string;
};

export function SelectField({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  className,
}: SelectFieldProps) {
  return (
    <label className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </span>
      <div className="relative flex h-12 items-center gap-3 overflow-hidden rounded-[14px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] px-3 shadow-[0_10px_30px_var(--navy-alpha-03)] transition duration-200 hover:border-[var(--blue-200)] focus-within:border-[var(--accent-blue)] focus-within:shadow-[0_0_0_3px_var(--blue-alpha-25)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-blue-light)] text-[var(--accent-blue)] ring-1 ring-[var(--blue-100)]">
          <Icon className="h-4 w-4" />
        </span>
        <select
          aria-label={label}
          className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-8 text-[14px] font-semibold text-[var(--text-primary)] outline-none"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] transition-transform duration-200 group-focus-within:rotate-180" />
      </div>
    </label>
  );
}

export function CompactSelectField({
  label,
  value,
  options,
  onChange,
  className,
}: CompactSelectFieldProps) {
  return (
    <label
      className={cn(
        "group relative flex h-9 min-w-[124px] items-center rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-white)] px-3 text-[12px] font-medium text-[var(--text-primary)]",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-full w-full appearance-none bg-transparent pr-5 text-[12px] font-medium text-[var(--text-primary)] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-muted)] transition-transform duration-200 group-focus-within:rotate-180" />
    </label>
  );
}

export function DateField({
  icon: Icon,
  label,
  value,
  onChange,
  className,
  min,
  max,
}: DateFieldProps) {
  return (
    <label className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </span>
      <div className="relative flex h-12 items-center gap-3 overflow-hidden rounded-[14px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] px-3 shadow-[0_10px_30px_var(--navy-alpha-03)] transition duration-200 hover:border-[var(--blue-200)] focus-within:border-[var(--accent-blue)] focus-within:shadow-[0_0_0_3px_var(--blue-alpha-25)]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-blue-light)] text-[var(--accent-blue)] ring-1 ring-[var(--blue-100)]">
          <Icon className="h-4 w-4" />
        </span>
        <input
          aria-label={label}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[var(--text-primary)] outline-none"
          max={max}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          type="date"
          value={value}
        />
      </div>
    </label>
  );
}
