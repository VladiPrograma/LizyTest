"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthInputFieldProps = {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  rightAdornment?: ReactNode;
  type?: string;
};

export function AuthInputField({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  className,
  rightAdornment,
  disabled = false,
}: AuthInputFieldProps) {
  return (
    <label
      className={cn(
        "group flex h-[48px] items-center rounded-[16px] border border-[var(--neutral-500)] bg-[var(--white)] px-4 text-[var(--neutral-600)] shadow-[0_2px_10px_var(--black-alpha-03)] transition-colors focus-within:border-[var(--accent-blue)]",
        className,
      )}
    >
      <span className="mr-3 flex shrink-0 items-center text-[var(--neutral-600)] transition-colors group-focus-within:text-[var(--accent-blue)]">
        {icon}
      </span>
      <input
        className="w-full border-none bg-transparent text-[16px] font-medium text-[var(--neutral-800)] outline-none placeholder:text-[var(--neutral-600)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {rightAdornment ? (
        <span className="ml-3 flex shrink-0 items-center text-[var(--neutral-700)] transition-colors group-focus-within:text-[var(--accent-blue)]">
          {rightAdornment}
        </span>
      ) : null}
    </label>
  );
}
