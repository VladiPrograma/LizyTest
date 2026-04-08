"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineDropdownSelect } from "@/components/ui/inline-dropdown-select";
import { cn } from "@/lib/utils";

type DateFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  min?: string;
  max?: string;
  tone?: "accent" | "neutral";
};

const monthLabelFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});
const monthNameFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" });
const monthSelectOptions = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(Date.UTC(2026, index, 1));
  const label = monthNameFormatter.format(date);

  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value: index,
  };
});
const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];

const buildValidUtcDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return date;
};

const parseIsoDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return buildValidUtcDate(year, month, day);
};

const parseManualDate = (value: string) => {
  const trimmedValue = value.trim();
  const isoDate = parseIsoDate(trimmedValue);

  if (isoDate) {
    return isoDate;
  }

  const displayMatch = trimmedValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (!displayMatch) {
    return null;
  }

  const day = Number(displayMatch[1]);
  const month = Number(displayMatch[2]);
  const year = Number(displayMatch[3]);

  return buildValidUtcDate(year, month, day);
};

const toIsoDate = (date: Date) => {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const toInputDateValue = (value: string) => {
  const isoDate = parseIsoDate(value);

  return isoDate
    ? [
        String(isoDate.getUTCDate()).padStart(2, "0"),
        String(isoDate.getUTCMonth() + 1).padStart(2, "0"),
        isoDate.getUTCFullYear(),
      ].join("/")
    : value;
};

const getCurrentUtcYear = () => new Date().getUTCFullYear();
const startOfUtcMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const endOfUtcMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
const addUtcMonths = (date: Date, months: number) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

const getCalendarOffset = (date: Date) => {
  const day = date.getUTCDay();

  return day === 0 ? 6 : day - 1;
};

const isSameUtcDay = (left: Date, right: Date) => {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
};

const isOutsideRange = (date: Date, minDate: Date | null, maxDate: Date | null) => {
  if (minDate && date.getTime() < minDate.getTime()) {
    return true;
  }

  return !!(maxDate && date.getTime() > maxDate.getTime());
};

const canNavigateToMonth = (date: Date, minDate: Date | null, maxDate: Date | null) => {
  const monthStart = startOfUtcMonth(date);
  const monthEnd = endOfUtcMonth(date);

  if (minDate && monthEnd.getTime() < minDate.getTime()) {
    return false;
  }

  return !(maxDate && monthStart.getTime() > maxDate.getTime());
};

const getInitialVisibleMonth = (value?: string, min?: string, max?: string) => {
  const selectedDate = parseIsoDate(value);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  return startOfUtcMonth(selectedDate ?? maxDate ?? minDate ?? todayUtc);
};

const getYearOptions = (minDate: Date | null, maxDate: Date | null, visibleMonth: Date) => {
  const minYear = minDate?.getUTCFullYear() ?? Math.min(visibleMonth.getUTCFullYear() - 10, getCurrentUtcYear() - 10);
  const maxYear = maxDate?.getUTCFullYear() ?? Math.max(visibleMonth.getUTCFullYear() + 10, getCurrentUtcYear() + 5);

  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
};

const clampMonthToRange = (date: Date, minDate: Date | null, maxDate: Date | null) => {
  const monthStart = startOfUtcMonth(date);

  if (minDate && endOfUtcMonth(monthStart).getTime() < minDate.getTime()) {
    return startOfUtcMonth(minDate);
  }

  if (maxDate && monthStart.getTime() > maxDate.getTime()) {
    return startOfUtcMonth(maxDate);
  }

  return monthStart;
};

export function DateField({
  icon: Icon,
  label,
  value,
  onChange,
  className,
  disabled = false,
  hideLabel = false,
  min,
  max,
  tone = "accent",
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialVisibleMonth(value, min, max));
  const [draftValue, setDraftValue] = useState(() => toInputDateValue(value));
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const minDate = useMemo(() => parseIsoDate(min), [min]);
  const maxDate = useMemo(() => parseIsoDate(max), [max]);
  const monthLabel = monthLabelFormatter.format(visibleMonth);
  const previousMonth = addUtcMonths(visibleMonth, -1);
  const nextMonth = addUtcMonths(visibleMonth, 1);
  const isPreviousDisabled = !canNavigateToMonth(previousMonth, minDate, maxDate);
  const isNextDisabled = !canNavigateToMonth(nextMonth, minDate, maxDate);
  const yearOptions = useMemo(() => getYearOptions(minDate, maxDate, visibleMonth), [maxDate, minDate, visibleMonth]);
  const yearSelectOptions = useMemo(() => yearOptions.map((year) => ({ label: String(year), value: year })), [yearOptions]);
  const isNeutralTone = tone === "neutral";
  const calendarDays = useMemo(() => {
    const monthStart = startOfUtcMonth(visibleMonth);
    const daysInMonth = endOfUtcMonth(visibleMonth).getUTCDate();
    const offset = getCalendarOffset(monthStart);

    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), index + 1))),
    ];
  }, [visibleMonth]);

  useEffect(() => {
    if (open) {
      setVisibleMonth(getInitialVisibleMonth(value, min, max));
    }
  }, [max, min, open, value]);

  useEffect(() => {
    setDraftValue(toInputDateValue(value));
  }, [value]);

  const handleDraftChange = (nextValue: string) => {
    setDraftValue(nextValue);

    if (!nextValue.trim()) {
      onChange("");
      return;
    }

    const parsedDate = parseManualDate(nextValue);

    if (parsedDate && !isOutsideRange(parsedDate, minDate, maxDate)) {
      onChange(toIsoDate(parsedDate));
      setVisibleMonth(startOfUtcMonth(parsedDate));
    }
  };

  const handleDraftBlur = () => {
    if (!draftValue.trim()) {
      return;
    }

    setDraftValue(toInputDateValue(value));
  };

  const updateVisibleMonth = (year: number, month: number) => {
    setVisibleMonth(clampMonthToRange(new Date(Date.UTC(year, month, 1)), minDate, maxDate));
  };

  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <span className={cn("pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]", hideLabel && "sr-only")}>
        {label}
      </span>
      <DropdownMenu onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)} open={disabled ? false : open}>
        <div
          className={cn(
            "relative flex h-12 w-full items-center gap-3 overflow-hidden text-left transition duration-200",
            isNeutralTone
              ? "rounded-[16px] border border-[var(--neutral-500)] bg-[var(--white)] px-4 shadow-[0_2px_10px_var(--black-alpha-03)] hover:border-[var(--neutral-600)] focus-within:border-[var(--neutral-700)]"
              : "rounded-[14px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] px-3 shadow-[0_10px_30px_var(--navy-alpha-03)] hover:border-[var(--blue-200)] focus-within:border-[var(--accent-blue)] focus-within:shadow-[0_0_0_3px_var(--blue-alpha-25)]",
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center",
              isNeutralTone
                ? "text-[var(--neutral-600)]"
                : "h-8 w-8 rounded-[10px] bg-[var(--accent-blue-light)] text-[var(--accent-blue)] ring-1 ring-[var(--blue-100)]",
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <input
            aria-label={label}
            className={cn(
              "min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-60",
              isNeutralTone
                ? "text-[16px] font-medium text-[var(--neutral-800)] placeholder:text-[var(--neutral-600)]"
                : "text-[14px] font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            )}
            disabled={disabled}
            inputMode="numeric"
            onBlur={handleDraftBlur}
            onChange={(event) => handleDraftChange(event.target.value)}
            placeholder="DD/MM/AAAA"
            value={draftValue}
          />
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Abrir calendario de ${label}`}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                isNeutralTone
                  ? "text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-800)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--accent-blue-light)] hover:text-[var(--accent-blue)]",
              )}
              disabled={disabled}
              type="button"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent
          align="end"
          className="w-[320px] overflow-visible rounded-[18px] border border-[var(--border-color)] bg-[var(--white-alpha-90)] p-3 shadow-[0_24px_60px_var(--navy-alpha-20)] backdrop-blur-xl"
          sideOffset={8}
        >
          <div className="flex items-center justify-between gap-3 pb-3">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-white)] text-[var(--text-secondary)] transition-colors hover:border-[var(--blue-200)] hover:text-[var(--accent-blue)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={disabled || isPreviousDisabled}
              onClick={() => setVisibleMonth(previousMonth)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Calendario</p>
              <p className="text-[15px] font-semibold capitalize text-[var(--text-primary)]">{monthLabel}</p>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-white)] text-[var(--text-secondary)] transition-colors hover:border-[var(--blue-200)] hover:text-[var(--accent-blue)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={disabled || isNextDisabled}
              onClick={() => setVisibleMonth(nextMonth)}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-[1.35fr_0.9fr] gap-2 pb-3">
            <div className="space-y-1">
              <span className="pl-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Mes</span>
              <InlineDropdownSelect
                disabled={disabled}
                label="Mes"
                onChange={(nextMonth) => updateVisibleMonth(visibleMonth.getUTCFullYear(), Number(nextMonth))}
                options={monthSelectOptions}
                value={visibleMonth.getUTCMonth()}
              />
            </div>
            <div className="space-y-1">
              <span className="pl-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Año</span>
              <InlineDropdownSelect
                align="end"
                disabled={disabled}
                label="Año"
                onChange={(nextYear) => updateVisibleMonth(Number(nextYear), visibleMonth.getUTCMonth())}
                options={yearSelectOptions}
                value={visibleMonth.getUTCFullYear()}
              />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 pb-2">
            {weekdayLabels.map((dayLabel) => (
              <span
                className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"
                key={dayLabel}
              >
                {dayLabel}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <span className="h-10" key={`empty-${index}`} />;
              }

              const isDisabled = isOutsideRange(day, minDate, maxDate);
              const isSelected = selectedDate ? isSameUtcDay(day, selectedDate) : false;
              const isToday = isSameUtcDay(day, new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())));

              return (
                <button
                  className={cn(
                    "flex h-10 items-center justify-center rounded-[12px] text-[13px] font-semibold transition-colors",
                    isSelected
                      ? "bg-[var(--accent-blue)] text-[var(--white)] shadow-[0_10px_18px_var(--blue-alpha-25)]"
                      : isDisabled
                        ? "cursor-not-allowed text-[var(--text-muted)] opacity-35"
                        : "text-[var(--text-primary)] hover:bg-[var(--accent-blue-light)] hover:text-[var(--accent-blue)]",
                    isToday && !isSelected ? "ring-1 ring-[var(--blue-200)]" : "",
                  )}
                  disabled={disabled || isDisabled}
                  key={toIsoDate(day)}
                  onClick={() => {
                    onChange(toIsoDate(day));
                    setOpen(false);
                  }}
                  type="button"
                >
                  {day.getUTCDate()}
                </button>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
