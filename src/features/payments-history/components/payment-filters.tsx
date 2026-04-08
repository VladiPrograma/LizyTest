"use client";

import {
  BadgeEuro,
  Building2,
  CalendarDays,
  CalendarRange,
  Shapes,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DateField } from "@/components/ui/date-field";
import { AmountRangeField } from "@/components/ui/fields/amount-range-field";
import { SelectField } from "@/components/ui/fields/select-field";
import { SearchableSelectField } from "@/components/ui/fields/searchable-select-field";
import { type SelectFieldOption } from "@/components/ui/fields/types";
import { cn } from "@/lib/utils";

type PeriodSelection = "Mensual" | "Anual" | "Personalizado";

type PaymentFiltersProps = {
  businessSelectOptions: SelectFieldOption[];
  categorySelectOptions: SelectFieldOption[];
  customEndDate: string;
  customStartDate: string;
  hasSelectedFilterCategory: boolean;
  maxAmount: string;
  minAmount: string;
  monthSelectOptions: SelectFieldOption[];
  onAmountRangeChange: (nextRange: { minValue: string; maxValue: string }) => void;
  onBusinessChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
  onCustomStartDateChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onPeriodChange: (value: PeriodSelection) => void;
  onSubCategoryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  period: PeriodSelection;
  selectedBusiness: string;
  selectedCategory: string;
  selectedMonth: string;
  selectedSubCategory: string;
  selectedYear: string;
  subcategorySelectOptions: SelectFieldOption[];
  totalIncomingLabel: string;
  totalOutgoingLabel: string;
  yearSelectOptions: SelectFieldOption[];
};

export function PaymentFilters({
  businessSelectOptions,
  categorySelectOptions,
  customEndDate,
  customStartDate,
  hasSelectedFilterCategory,
  maxAmount,
  minAmount,
  monthSelectOptions,
  onAmountRangeChange,
  onBusinessChange,
  onCategoryChange,
  onCustomEndDateChange,
  onCustomStartDateChange,
  onMonthChange,
  onPeriodChange,
  onSubCategoryChange,
  onYearChange,
  period,
  selectedBusiness,
  selectedCategory,
  selectedMonth,
  selectedSubCategory,
  selectedYear,
  subcategorySelectOptions,
  totalIncomingLabel,
  totalOutgoingLabel,
  yearSelectOptions,
}: PaymentFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full flex-col gap-1.5 lg:max-w-[360px]">
          <span className="pl-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Periodo
          </span>
          <div className="grid h-12 grid-cols-3 gap-1 rounded-[14px] border border-[var(--border-color)] bg-[linear-gradient(180deg,var(--bg-white)_0%,var(--bg-light)_180%)] p-1 shadow-[0_10px_30px_var(--navy-alpha-03)]">
            {(["Mensual", "Anual", "Personalizado"] as const).map((value) => (
              <button
                className={cn(
                  "flex h-full items-center justify-center rounded-[10px] px-3 text-center text-[13px] font-semibold transition-colors",
                  period === value
                    ? "bg-[var(--accent-blue-light)] text-[var(--accent-blue)] shadow-[0_6px_18px_var(--navy-alpha-03)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-white)] hover:text-[var(--text-primary)]",
                )}
                key={value}
                onClick={() => onPeriodChange(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:ml-auto sm:w-full sm:max-w-[560px] sm:flex-row sm:flex-wrap sm:justify-end">
          {period === "Mensual" ? (
            <SelectField
              className="w-full sm:w-[190px] sm:shrink-0"
              icon={CalendarRange}
              label="Mes"
              onChange={onMonthChange}
              options={monthSelectOptions}
              value={selectedMonth}
            />
          ) : null}
          {period !== "Personalizado" ? (
            <SelectField
              className="w-full sm:w-[160px] sm:shrink-0"
              icon={CalendarDays}
              label="Año"
              onChange={onYearChange}
              options={yearSelectOptions}
              value={selectedYear}
            />
          ) : (
            <>
              <DateField
                className="w-full sm:w-[190px] sm:shrink-0"
                icon={CalendarRange}
                label="Desde"
                max={customEndDate}
                onChange={onCustomStartDateChange}
                value={customStartDate}
              />
              <DateField
                className="w-full sm:w-[190px] sm:shrink-0"
                icon={CalendarRange}
                label="Hasta"
                min={customStartDate}
                onChange={onCustomEndDateChange}
                value={customEndDate}
              />
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <SearchableSelectField
              icon={Tag}
              label="Categoría"
              onChange={onCategoryChange}
              options={categorySelectOptions}
              value={selectedCategory}
            />
            {hasSelectedFilterCategory ? (
              <SearchableSelectField
                icon={Shapes}
                label="Subcategoria"
                onChange={onSubCategoryChange}
                options={subcategorySelectOptions}
                value={selectedSubCategory}
              />
            ) : null}
            <SelectField
              icon={Building2}
              label="Negocio"
              onChange={onBusinessChange}
              options={businessSelectOptions}
              value={selectedBusiness}
            />
            <AmountRangeField
              icon={BadgeEuro}
              label="Importe"
              maxValue={maxAmount}
              minValue={minAmount}
              onChange={onAmountRangeChange}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-[14px] font-semibold">
          <div className="flex items-center gap-1.5 text-[var(--danger-red)]">
            <TrendingDown className="h-4 w-4" />
            <span>{totalOutgoingLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--success-green)]">
            <TrendingUp className="h-4 w-4" />
            <span>{totalIncomingLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
