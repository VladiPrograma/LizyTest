"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type InlineDropdownSelectOption = {
  label: string;
  value: string | number;
};

type InlineDropdownSelectProps = {
  label: string;
  value: string | number;
  options: InlineDropdownSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  disabled?: boolean;
  align?: "start" | "end";
};

const getSelectedLabel = (options: InlineDropdownSelectOption[], value: string | number) => {
  const normalizedValue = String(value);

  return options.find((option) => String(option.value) === normalizedValue)?.label ?? String(value);
};

export function InlineDropdownSelect({
  label,
  value,
  options,
  onChange,
  className,
  triggerClassName,
  contentClassName,
  itemClassName,
  disabled = false,
  align = "start",
}: InlineDropdownSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selectedLabel = getSelectedLabel(options, value);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-[12px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] px-3 text-left text-[14px] font-semibold text-[var(--text-primary)] shadow-[0_8px_20px_var(--navy-alpha-03)] outline-none transition-colors hover:border-[var(--blue-200)] focus:border-[var(--accent-blue)] disabled:cursor-not-allowed disabled:opacity-60",
          triggerClassName,
        )}
        disabled={disabled}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform", open ? "rotate-180" : "")} />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 min-w-full rounded-[16px] border border-[var(--border-color)] bg-[var(--white-alpha-90)] p-1.5 shadow-[0_18px_50px_var(--navy-alpha-20)] backdrop-blur-xl",
            align === "end" ? "right-0" : "left-0",
            contentClassName,
          )}
          role="listbox"
        >
          <div className="max-h-72 overflow-y-auto">
            {options.map((option) => {
              const optionValue = String(option.value);
              const isSelected = String(value) === optionValue;

              return (
                <button
                  aria-selected={isSelected}
                  className={cn(
                    "relative flex w-full items-center rounded-[12px] py-2.5 pl-8 pr-3 text-left text-[14px] font-medium text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--accent-blue-light)] hover:text-[var(--accent-blue)] focus:bg-[var(--accent-blue-light)] data-[selected=true]:bg-[var(--accent-blue-light)] data-[selected=true]:text-[var(--accent-blue)]",
                    itemClassName,
                  )}
                  data-selected={isSelected}
                  key={option.value}
                  onClick={() => {
                    onChange(optionValue);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
                    {isSelected ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
                  </span>
                  <span className="min-w-0 whitespace-normal break-words leading-5">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
