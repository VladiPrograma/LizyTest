"use client";

import { cn } from "@/lib/utils";
import { type InputFieldProps } from "@/components/ui/fields/types";

export function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  className,
  type = "text",
  min,
  max,
  step,
  placeholder,
  inputMode,
}: InputFieldProps) {
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
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          inputMode={inputMode}
          max={max}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          step={step}
          type={type}
          value={value}
        />
      </div>
    </label>
  );
}
