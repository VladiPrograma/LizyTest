"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { ChevronDown, LoaderCircle, Plus } from "lucide-react";
import { getSelectedOption, normalizeSearchValue } from "@/components/ui/fields/field-utils";
import { type SearchableSelectFieldProps } from "@/components/ui/fields/types";
import { cn } from "@/lib/utils";

export function SearchableSelectField({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  onCreateOption,
  createOptionLabel = "categoria",
  className,
  placeholder = "Escribe para buscar",
  emptyMessage = "No hay opciones disponibles.",
}: SearchableSelectFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(value);
  const [hasTypedSinceOpen, setHasTypedSinceOpen] = useState(false);
  const selectedOption = useMemo(() => getSelectedOption(options, value), [options, value]);
  const displayValue = selectedOption?.label ?? value;
  const normalizedSearchValue = open && hasTypedSinceOpen ? normalizeSearchValue(searchValue) : "";
  const searchMatchesExistingOption = useMemo(() => {
    const normalizedTypedValue = normalizeSearchValue(searchValue);

    if (!normalizedTypedValue) {
      return false;
    }

    return options.some((option) => normalizeSearchValue(option.label) === normalizedTypedValue);
  }, [options, searchValue]);
  const filteredOptions = useMemo(() => {
    if (!normalizedSearchValue || searchMatchesExistingOption) {
      return options;
    }

    return options.filter((option) => normalizeSearchValue(option.label).includes(normalizedSearchValue));
  }, [normalizedSearchValue, options, searchMatchesExistingOption]);
  const canCreateOption = Boolean(onCreateOption && hasTypedSinceOpen && searchValue.trim() && !searchMatchesExistingOption);

  useEffect(() => {
    if (!open) {
      setSearchValue(displayValue);
      setHasTypedSinceOpen(false);
    }
  }, [displayValue, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setHasTypedSinceOpen(false);
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const openDropdown = () => {
    setSearchValue(displayValue);
    setHasTypedSinceOpen(false);
    setOpen(true);
  };

  const handleSelectOption = (optionValue: string) => {
    const nextOption = options.find((option) => String(option.value) === optionValue);

    onChange(optionValue);
    setSearchValue(nextOption?.label ?? optionValue);
    setLocalError(null);
    setHasTypedSinceOpen(false);
    setOpen(false);
  };

  const handleCreate = async () => {
    const trimmedSearchValue = searchValue.trim();

    if (!onCreateOption || !trimmedSearchValue) {
      return;
    }

    setIsCreating(true);
    setLocalError(null);

    try {
      const createdOption = await onCreateOption(trimmedSearchValue);
      const nextValue = createdOption ? String(createdOption.value) : trimmedSearchValue;

      onChange(nextValue);
      setSearchValue(createdOption?.label ?? trimmedSearchValue);
      setHasTypedSinceOpen(false);
      setOpen(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "No se pudo crear la categoría.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)} ref={containerRef}>
      <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </span>
      <div className="relative">
        <div
          className="relative flex min-h-12 items-center gap-3 rounded-[14px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] px-3 py-2 shadow-[0_10px_30px_var(--navy-alpha-03)] transition duration-200 hover:border-[var(--blue-200)] focus-within:border-[var(--accent-blue)] focus-within:shadow-[0_0_0_3px_var(--blue-alpha-25)]"
          onMouseDown={(event) => {
            if (inputRef.current?.contains(event.target as Node)) {
              return;
            }

            event.preventDefault();
            openDropdown();
          }}
        >
          <span className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-[var(--accent-blue-light)] text-[var(--accent-blue)] ring-1 ring-[var(--blue-100)]">
            {selectedOption?.iconName ? (
              <IconifyIcon className="h-4 w-4" icon={selectedOption.iconName} />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </span>
          <input
            aria-label={label}
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            onChange={(event) => {
              setSearchValue(event.target.value);
              setLocalError(null);
              setHasTypedSinceOpen(true);
              setOpen(true);
            }}
            onFocus={() => {
              setSearchValue(displayValue);
              setHasTypedSinceOpen(false);
              setOpen(true);
              queueMicrotask(() => inputRef.current?.select());
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearchValue(displayValue);
                setHasTypedSinceOpen(false);
                setOpen(false);
              }

              if (event.key === "Enter" && canCreateOption) {
                event.preventDefault();
                void handleCreate();
              }
            }}
            placeholder={placeholder}
            ref={inputRef}
            type="text"
            value={open && hasTypedSinceOpen ? searchValue : displayValue}
          />
          {isCreating ? (
            <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-[var(--accent-blue)]" />
          ) : (
            <ChevronDown className={cn("h-4 w-4 shrink-0 cursor-pointer text-[var(--text-muted)] transition-transform", open ? "rotate-180" : "")} />
          )}
        </div>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[18px] border border-[var(--border-color)] bg-[var(--white-alpha-90)] p-1.5 shadow-[0_18px_50px_var(--navy-alpha-20)] backdrop-blur-xl">
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  className="flex w-full items-start gap-2 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-blue-light)] hover:text-[var(--accent-blue)]"
                  key={option.value}
                  onClick={() => handleSelectOption(String(option.value))}
                  type="button"
                >
                  {option.iconName ? (
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[var(--bg-white)] text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]">
                      <IconifyIcon className="h-4 w-4" icon={option.iconName} />
                    </span>
                  ) : null}
                  <span className="min-w-0 break-words leading-5">{option.label}</span>
                </button>
              ))}

              {canCreateOption ? (
                <button
                  className="flex w-full items-center gap-2 rounded-[12px] border border-dashed border-[var(--payments-soft-blue-border)] bg-[var(--payments-soft-blue-panel)] px-3 py-2.5 text-left text-[14px] font-medium text-[var(--accent-blue)] transition-colors hover:border-[var(--accent-blue)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isCreating}
                  onClick={() => void handleCreate()}
                  type="button"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[var(--bg-white)] ring-1 ring-[var(--payments-soft-blue-border)]">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 break-words leading-5">Crear {createOptionLabel} &quot;{searchValue.trim()}&quot;</span>
                </button>
              ) : null}

              {filteredOptions.length === 0 && !canCreateOption ? (
                <p className="px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)]">{emptyMessage}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      {localError ? <p className="text-[12px] font-medium text-[var(--danger-red)]">{localError}</p> : null}
    </div>
  );
}

export const CreatableSelectField = SearchableSelectField;
