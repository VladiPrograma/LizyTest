"use client";

import { Icon as IconifyIcon } from "@iconify/react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOptionLabel, getSelectedOption } from "@/components/ui/fields/field-utils";
import { type CompactSelectFieldProps, type SelectFieldProps } from "@/components/ui/fields/types";
import { cn } from "@/lib/utils";

export function SelectField({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  className,
}: SelectFieldProps) {
  const selectedOption = getSelectedOption(options, value);
  const selectedLabel = getOptionLabel(options, value);

  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={label}
            className="relative flex min-h-12 w-full items-center gap-3 rounded-[14px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] px-3 py-2 text-left shadow-[0_10px_30px_var(--navy-alpha-03)] transition duration-200 hover:border-[var(--blue-200)] focus-visible:border-[var(--accent-blue)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-alpha-25)]"
            type="button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-blue-light)] text-[var(--accent-blue)] ring-1 ring-[var(--blue-100)]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              {selectedOption?.iconName ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[var(--bg-white)] text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]">
                  <IconifyIcon icon={selectedOption.iconName} className="h-4 w-4" />
                </span>
              ) : null}
              <span className="min-w-0 whitespace-normal break-words text-[14px] font-semibold leading-5 text-[var(--text-primary)]">
                {selectedLabel}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 self-center text-[var(--text-muted)] transition-transform duration-200 data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[220px] rounded-[16px] border border-[var(--border-color)] bg-[var(--white-alpha-90)] p-1.5 shadow-[0_18px_50px_var(--navy-alpha-20)] backdrop-blur-xl"
          sideOffset={8}
        >
          <DropdownMenuRadioGroup onValueChange={onChange} value={String(value)}>
            <div className="max-h-72 overflow-y-auto">
              {options.map((option) => (
                <DropdownMenuRadioItem
                  className="rounded-[12px] px-2.5 py-2.5 pl-8 text-[14px] font-medium text-[var(--text-primary)] outline-none transition-colors focus:bg-[var(--accent-blue-light)] data-[state=checked]:bg-[var(--accent-blue-light)] data-[state=checked]:text-[var(--accent-blue)]"
                  key={option.value}
                  value={String(option.value)}
                >
                  <span className="flex items-start gap-2">
                    {option.iconName ? (
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[var(--bg-white)] text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]">
                        <IconifyIcon icon={option.iconName} className="h-4 w-4" />
                      </span>
                    ) : null}
                    <span className="whitespace-normal break-words leading-5">{option.label}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </div>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function CompactSelectField({
  label,
  value,
  options,
  onChange,
  className,
}: CompactSelectFieldProps) {
  const selectedLabel = getOptionLabel(options, value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={label}
          className={cn(
            "relative flex h-9 min-w-[124px] items-center rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-white)] px-3 text-left text-[12px] font-medium text-[var(--text-primary)] transition duration-200 hover:border-[var(--blue-200)] focus-visible:border-[var(--accent-blue)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-alpha-25)]",
            className,
          )}
          type="button"
        >
          <span className="min-w-0 flex-1 truncate pr-5">{selectedLabel}</span>
          <ChevronDown className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-muted)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[180px] rounded-[12px] border border-[var(--border-color)] bg-[var(--white-alpha-90)] p-1.5 shadow-[0_18px_50px_var(--navy-alpha-20)] backdrop-blur-xl"
        sideOffset={8}
      >
        <DropdownMenuRadioGroup onValueChange={onChange} value={String(value)}>
          <div className="max-h-72 overflow-y-auto">
            {options.map((option) => (
              <DropdownMenuRadioItem
                className="rounded-[10px] px-3 py-2 pl-9 text-[12px] font-medium text-[var(--text-primary)] outline-none transition-colors focus:bg-[var(--accent-blue-light)] data-[state=checked]:bg-[var(--accent-blue-light)] data-[state=checked]:text-[var(--accent-blue)]"
                key={option.value}
                value={String(option.value)}
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </div>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
