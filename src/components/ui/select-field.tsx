"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import { ChevronDown, LoaderCircle, Plus, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
export { DateField } from "@/components/ui/date-field";
export { InlineDropdownSelect } from "@/components/ui/inline-dropdown-select";
export type { InlineDropdownSelectOption } from "@/components/ui/inline-dropdown-select";

export type SelectFieldOption = {
  label: string;
  value: string | number;
  iconName?: string;
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

type InputFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: "text" | "number";
  min?: string;
  max?: string;
  step?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

type AmountRangeFieldProps = {
  icon: LucideIcon;
  label: string;
  minValue: string;
  maxValue: string;
  onChange: (nextRange: { minValue: string; maxValue: string }) => void;
  className?: string;
};

type SearchableSelectFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  onCreateOption?: (value: string) => Promise<SelectFieldOption | void> | SelectFieldOption | void;
  createOptionLabel?: string;
  className?: string;
  placeholder?: string;
  emptyMessage?: string;
};

const getSelectedOption = (options: SelectFieldOption[], value: string | number) => {
  const normalizedValue = String(value);

  return options.find((option) => String(option.value) === normalizedValue);
};

const getOptionLabel = (options: SelectFieldOption[], value: string | number) => {
  return getSelectedOption(options, value)?.label ?? String(value);
};

const normalizeSearchValue = (value: string) => value.trim().toLocaleLowerCase("es-ES");

const formatAmountLabel = (value: string) => {
  if (!value) {
    return null;
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return `${amount.toLocaleString("es-ES", {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })} EUR`;
};

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

export function AmountRangeField({
  icon: Icon,
  label,
  minValue,
  maxValue,
  onChange,
  className,
}: AmountRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftMinValue, setDraftMinValue] = useState(minValue);
  const [draftMaxValue, setDraftMaxValue] = useState(maxValue);

  useEffect(() => {
    if (open) {
      setDraftMinValue(minValue);
      setDraftMaxValue(maxValue);
    }
  }, [maxValue, minValue, open]);

  const formattedMinLabel = formatAmountLabel(minValue);
  const formattedMaxLabel = formatAmountLabel(maxValue);
  const triggerLabel =
    formattedMinLabel && formattedMaxLabel
      ? `${formattedMinLabel} - ${formattedMaxLabel}`
      : formattedMinLabel
        ? `Desde ${formattedMinLabel}`
        : formattedMaxLabel
          ? `Hasta ${formattedMaxLabel}`
          : "Todos los importes";
  const parsedDraftMin = draftMinValue ? Number(draftMinValue) : undefined;
  const parsedDraftMax = draftMaxValue ? Number(draftMaxValue) : undefined;
  const hasInvalidDraft =
    (parsedDraftMin !== undefined && (Number.isNaN(parsedDraftMin) || parsedDraftMin < 0)) ||
    (parsedDraftMax !== undefined && (Number.isNaN(parsedDraftMax) || parsedDraftMax < 0)) ||
    (parsedDraftMin !== undefined && parsedDraftMax !== undefined && parsedDraftMin > parsedDraftMax);

  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </span>
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={label}
            className="relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-[14px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] px-3 text-left shadow-[0_10px_30px_var(--navy-alpha-03)] transition duration-200 hover:border-[var(--blue-200)] focus-visible:border-[var(--accent-blue)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-alpha-25)]"
            type="button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-blue-light)] text-[var(--accent-blue)] ring-1 ring-[var(--blue-100)]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--text-primary)]">
              {triggerLabel}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[320px] rounded-[18px] border border-[var(--border-color)] bg-[var(--white-alpha-90)] p-3 shadow-[0_24px_60px_var(--navy-alpha-20)] backdrop-blur-xl"
          sideOffset={8}
        >
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Rango de importe
              </p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                Filtra los pagos entre un mínimo y un máximo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Mínimo
                </span>
                <div className="flex h-11 items-center rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-white)] px-3 shadow-[0_6px_18px_var(--navy-alpha-03)] focus-within:border-[var(--accent-blue)] focus-within:shadow-[0_0_0_3px_var(--blue-alpha-25)]">
                  <input
                    className="w-full bg-transparent text-[14px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setDraftMinValue(event.target.value)}
                    placeholder="0,00"
                    step="0.01"
                    type="number"
                    value={draftMinValue}
                  />
                </div>
              </label>
              <label className="space-y-1.5">
                <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Máximo
                </span>
                <div className="flex h-11 items-center rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-white)] px-3 shadow-[0_6px_18px_var(--navy-alpha-03)] focus-within:border-[var(--accent-blue)] focus-within:shadow-[0_0_0_3px_var(--blue-alpha-25)]">
                  <input
                    className="w-full bg-transparent text-[14px] font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    inputMode="decimal"
                    min="0"
                    onChange={(event) => setDraftMaxValue(event.target.value)}
                    placeholder="Sin límite"
                    step="0.01"
                    type="number"
                    value={draftMaxValue}
                  />
                </div>
              </label>
            </div>
            {hasInvalidDraft ? (
              <p className="text-[12px] font-medium text-[var(--danger-red)]">
                Revisa el rango: los importes deben ser válidos y el mínimo no puede superar al máximo.
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                className="inline-flex h-10 items-center justify-center rounded-[12px] px-3 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-light)] hover:text-[var(--text-primary)]"
                onClick={() => {
                  setDraftMinValue("");
                  setDraftMaxValue("");
                  onChange({ maxValue: "", minValue: "" });
                  setOpen(false);
                }}
                type="button"
              >
                Limpiar
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[var(--accent-blue)] px-4 text-[13px] font-semibold text-[var(--white)] shadow-[0_10px_20px_var(--blue-alpha-25)] transition-colors hover:bg-[var(--blue-600)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={hasInvalidDraft}
                onClick={() => {
                  onChange({ maxValue: draftMaxValue, minValue: draftMinValue });
                  setOpen(false);
                }}
                type="button"
              >
                Aplicar
              </button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const CreatableSelectField = SearchableSelectField;
