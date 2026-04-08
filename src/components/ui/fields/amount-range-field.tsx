"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatAmountLabel } from "@/components/ui/fields/field-utils";
import { type AmountRangeFieldProps } from "@/components/ui/fields/types";
import { cn } from "@/lib/utils";

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
