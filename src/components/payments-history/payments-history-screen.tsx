"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ChangeEvent, type ReactNode } from "react";
import { Icon as IconifyIcon } from "@iconify/react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpDown,
  BadgeEuro,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Droplets,
  FileText,
  House,
  Mail,
  Plus,
  ReceiptText,
  Repeat2,
  Shapes,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AppDrawer } from "@/components/layout/app-drawer";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AmountRangeField,
  CompactSelectField,
  DateField,
  InputField,
  SearchableSelectField,
  SelectField,
  type SelectFieldOption,
} from "@/components/ui/select-field";
import {
  fixedExpenses,
  mortgageSummary,
  rowsPerPageOptions,
  variableExpenses,
} from "@/components/payments-history/payments-history-data";
import { bankService, BankServiceError } from "@/services/bank.service";
import { categoryService, CategoryServiceError, type CategoryDto } from "@/services/category.service";
import {
  paymentsService,
  type CreatePaymentPayload,
  PaymentsServiceError,
  type PaymentDto,
  type PaymentType,
  type PaymentSortField,
  type SortDirection,
  type UpdatePaymentPayload,
} from "@/services/payments.service";
import { userService, type UserDto } from "@/services/user.service";
import { cn } from "@/lib/utils";

const euroFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fixedExpenseIconMap: Record<string, LucideIcon> = {
  Hipoteca: House,
  "Internet + Móvil": Wifi,
  Seguros: Wallet,
};

const fixedExpenseToneClasses: Record<string, string> = {
  housing: "text-[var(--cat-housing)]",
  services: "text-[var(--cat-stonks)]",
  software: "text-[var(--cat-software)]",
};

const ALL_BUSINESSES_LABEL = "Todos los negocios";
const ALL_SUBCATEGORIES_LABEL = "Todas las subcategorias";
const ALL_CATEGORIES_LABEL = "Todas las categorías";

const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" });
const displayDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const monthNameByIndex = Array.from({ length: 12 }, (_, monthIndex) => {
  const monthName = monthFormatter.format(new Date(Date.UTC(2026, monthIndex, 1)));

  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
});
const monthIndexByName = new Map(monthNameByIndex.map((monthName, index) => [monthName, index]));
const selectableMonthOptions = [...monthNameByIndex];
const defaultPeriodSelection = getPreviousMonthPeriod();
const selectableYearOptions = Array.from({ length: 6 }, (_, index) => String(Number(defaultPeriodSelection.year) - index));
const defaultCustomDateRange = buildDateRange("Mensual", defaultPeriodSelection.month, defaultPeriodSelection.year);
const PERIOD_PREFERENCES_STORAGE_KEY = "payments-history-period-preferences:v1";
const defaultSortDirectionByField: Record<PaymentSortField, SortDirection> = {
  alias: "ASC",
  amount: "DESC",
  business: "ASC",
  businessName: "ASC",
  category: "ASC",
  currency: "ASC",
  date: "DESC",
  description: "ASC",
  needsReview: "DESC",
  operationType: "ASC",
  type: "ASC",
};
const paymentTypeOptions: SelectFieldOption[] = [
  { label: "Ingreso", value: "ADD" },
  { label: "Pago", value: "SUBTRACT" },
  { label: "Pago Recurrente Fijo", value: "FIXED_RECURRING" },
  { label: "Pago Recurrente Variable", value: "VARIABLE_RECURRING" },
  { label: "Prestamo", value: "LOAN" },
  { label: "Deuda", value: "DEBT" },
];
const paymentTypeFormOptions: SelectFieldOption[] = [
  { label: "Selecciona tipo", value: "" },
  ...paymentTypeOptions,
];
const currencyPattern = /^[A-Z]{3}$/;
const amountEqualityThreshold = 0.000001;

type BulkUpdateScope = "same-business" | "same-business-and-amount";
type PeriodSelection = "Mensual" | "Anual" | "Personalizado";
type StoredPeriodPreferences = {
  period: PeriodSelection;
  selectedMonth: string;
  selectedYear: string;
};

const bulkUpdateScopeOptions: Array<{
  description: string;
  title: string;
  value: BulkUpdateScope;
}> = [
  {
    description: "Aplica los cambios a todos los pagos que compartan el mismo negocio.",
    title: "Mismo negocio",
    value: "same-business",
  },
  {
    description: "Limita la actualizacion a pagos con el mismo negocio y el mismo importe actual.",
    title: "Mismo negocio e importe",
    value: "same-business-and-amount",
  },
];

type PaymentEditForm = {
  date: string;
  description: string;
  businessName: string;
  type: PaymentType | "";
  amount: string;
  category: string;
  subCategory: string;
  currency: string;
  updateAll: boolean;
  bulkUpdateScope: BulkUpdateScope;
};

type PaymentRowEntry = {
  amount: number;
  business: string;
  category: string;
  categoryBadgeStyle: {
    backgroundColor: string;
    color: string;
  };
  categoryIconName?: string;
  description: string;
  direction: "incoming" | "outgoing";
  displayDate: string;
  id: string;
  paymentTypeLabel: string;
  periodMonth: string;
  periodYear: string;
  statusLabel?: string;
  subCategory: string | null;
  subCategoryBadgeStyle: {
    backgroundColor: string;
    color: string;
  };
  subCategoryIconName?: string;
};

const defaultCategoryBadgeStyle = {
  backgroundColor: "var(--bg-light)",
  color: "var(--text-secondary)",
};

const sortCategoriesByName = (categories: CategoryDto[]) =>
  [...categories].sort((left, right) => left.name.localeCompare(right.name, "es"));

function inferNameFromEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return null;
  }

  const localPart = normalizedEmail.split("@")[0]?.trim();

  if (!localPart) {
    return null;
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getUserDisplayName(authDisplayName: string | null | undefined, authEmail: string | null | undefined, user?: UserDto | null) {
  const nameParts = [user?.name?.trim(), user?.lastName?.trim()].filter(Boolean);

  if (nameParts.length > 0) {
    return nameParts.join(" ");
  }

  if (authDisplayName?.trim() && !authDisplayName.includes("@")) {
    return authDisplayName.trim();
  }

  const inferredName = inferNameFromEmail(user?.email || authEmail);

  if (inferredName) {
    return inferredName;
  }

  return authDisplayName?.trim() || authEmail?.trim() || "Usuario";
}

function getUserInitials(name: string) {
  const nameParts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (nameParts.length === 0) {
    return "U";
  }

  return nameParts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function isValidStoredPeriod(value: unknown): value is PeriodSelection {
  return value === "Mensual" || value === "Anual" || value === "Personalizado";
}

function readStoredPeriodPreferences(): StoredPeriodPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(PERIOD_PREFERENCES_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<StoredPeriodPreferences>;

    if (
      !isValidStoredPeriod(parsedValue.period) ||
      typeof parsedValue.selectedMonth !== "string" ||
      typeof parsedValue.selectedYear !== "string"
    ) {
      return null;
    }

    return {
      period: parsedValue.period,
      selectedMonth: parsedValue.selectedMonth,
      selectedYear: parsedValue.selectedYear,
    };
  } catch {
    return null;
  }
}

function normalizeImportMessage(error: unknown) {
  if (error instanceof BankServiceError) {
    return error.problem?.detail || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo importar el fichero Excel.";
}

function normalizePaymentsMessage(error: unknown) {
  if (error instanceof PaymentsServiceError) {
    return error.problem?.detail || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudieron cargar los pagos.";
}

function normalizeCategoriesMessage(error: unknown) {
  if (error instanceof CategoryServiceError) {
    return error.message || error.problem?.detail || "No se pudieron cargar las categorías.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudieron cargar las categorías.";
}

function toDisplayDate(date: string) {
  return displayDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function toPeriodMonth(date: string) {
  const monthName = monthFormatter.format(new Date(`${date}T00:00:00Z`));

  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

function getPreviousMonthPeriod(baseDate = new Date()) {
  const previousMonthDate = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth() - 1, 1));

  return {
    month: toPeriodMonth(previousMonthDate.toISOString().slice(0, 10)),
    year: String(previousMonthDate.getUTCFullYear()),
  };
}

function buildDateRange(
  period: "Mensual" | "Anual" | "Personalizado",
  month: string,
  year: string,
  customDateRange?: { startDate: string; endDate: string },
) {
  if (period === "Personalizado") {
    if (!customDateRange?.startDate || !customDateRange.endDate) {
      throw new Error("Debes indicar una fecha de inicio y una fecha de fin.");
    }

    if (customDateRange.startDate > customDateRange.endDate) {
      throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
    }

    return customDateRange;
  }

  if (period === "Anual") {
    return {
      endDate: `${year}-12-31`,
      startDate: `${year}-01-01`,
    };
  }

  const monthIndex = monthIndexByName.get(month);

  if (monthIndex === undefined) {
    throw new Error("El mes seleccionado no es válido.");
  }

  const lastDay = new Date(Date.UTC(Number(year), monthIndex + 1, 0)).getUTCDate();

  return {
    endDate: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    startDate: `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`,
  };
}

const paymentTypeLabelByValue: Record<PaymentType, string> = {
  ADD: "Ingreso",
  DEBT: "Deuda",
  FIXED_RECURRING: "Pago Recurrente Fijo",
  LOAN: "Prestamo",
  SUBTRACT: "Pago",
  VARIABLE_RECURRING: "Pago Recurrente Variable",
};

function getPaymentTypeLabel(type: PaymentType) {
  return paymentTypeLabelByValue[type];
}

function getTablePaymentTypeLabel(type: PaymentType) {
  if (type === "FIXED_RECURRING") {
    return "Pago Fijo";
  }

  if (type === "VARIABLE_RECURRING") {
    return "Pago Variable";
  }

  return getPaymentTypeLabel(type);
}

function getPaymentDirection(type: PaymentType): "incoming" | "outgoing" {
  return type === "ADD" ? "incoming" : "outgoing";
}

function normalizeCategoryName(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue.toLowerCase() : null;
}

function mapPaymentToEntry(
  payment: PaymentDto,
  categoriesByName: Map<string, CategoryDto>,
  subcategoriesByName: Map<string, CategoryDto>,
): PaymentRowEntry {
  const normalizedCategoryName = normalizeCategoryName(payment.category);
  const normalizedSubCategoryName = normalizeCategoryName(payment.subCategory);
  const matchingCategory = normalizedCategoryName ? categoriesByName.get(normalizedCategoryName) : null;
  const matchingSubCategory = normalizedSubCategoryName ? subcategoriesByName.get(normalizedSubCategoryName) : null;

  return {
    amount: payment.amount,
    business: payment.businessName?.trim() || "Sin negocio",
    category: matchingCategory?.name ?? payment.category?.trim() ?? "Sin categoría",
    categoryBadgeStyle: matchingCategory
      ? {
          backgroundColor: matchingCategory.backgroundColor,
          color: matchingCategory.color,
        }
      : defaultCategoryBadgeStyle,
    categoryIconName: matchingCategory?.iconName,
    description: payment.description || (payment.type === "ADD" ? "Ingreso registrado" : "Movimiento registrado"),
    direction: getPaymentDirection(payment.type),
    displayDate: toDisplayDate(payment.date),
    id: payment.id,
    paymentTypeLabel: getPaymentTypeLabel(payment.type),
    periodMonth: toPeriodMonth(payment.date),
    periodYear: payment.date.slice(0, 4),
    statusLabel: payment.needsReview ? "Pendiente de procesar" : undefined,
    subCategory: matchingSubCategory?.name ?? payment.subCategory?.trim() ?? null,
    subCategoryBadgeStyle: matchingSubCategory
      ? {
          backgroundColor: matchingSubCategory.backgroundColor,
          color: matchingSubCategory.color,
        }
      : defaultCategoryBadgeStyle,
    subCategoryIconName: matchingSubCategory?.iconName,
  };
}

function resolveParentCategoryName(
  subCategoryName: string | null | undefined,
  subcategoriesByName: Map<string, CategoryDto>,
  categoriesById: Map<string, CategoryDto>,
) {
  const normalizedSubCategoryName = normalizeCategoryName(subCategoryName);
  const matchingSubCategory = normalizedSubCategoryName ? subcategoriesByName.get(normalizedSubCategoryName) : null;

  if (!matchingSubCategory?.parent) {
    return null;
  }

  return categoriesById.get(matchingSubCategory.parent)?.name ?? null;
}

function createPaymentEditForm(
  payment: PaymentDto,
  subcategoriesByName: Map<string, CategoryDto>,
  categoriesById: Map<string, CategoryDto>,
): PaymentEditForm {
  const parentCategoryName = resolveParentCategoryName(payment.subCategory, subcategoriesByName, categoriesById);

  return {
    amount: String(payment.amount),
    bulkUpdateScope: "same-business",
    businessName: payment.businessName ?? "",
    category: parentCategoryName ?? payment.category ?? "",
    subCategory: payment.subCategory ?? "",
    currency: payment.currency ?? "",
    date: payment.date,
    description: payment.description ?? "",
    type: payment.type,
    updateAll: false,
  };
}

function createEmptyPaymentEditForm(): PaymentEditForm {
  return {
    amount: "",
    bulkUpdateScope: "same-business",
    businessName: "",
    category: "",
    subCategory: "",
    currency: "",
    date: "",
    description: "",
    type: "",
    updateAll: false,
  };
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

function validatePaymentEditForm(form: PaymentEditForm) {
  if (!form.date) {
    return "Debes indicar una fecha.";
  }

  if (!form.type) {
    return "Debes seleccionar un tipo.";
  }

  const amount = Number(form.amount);

  if (!form.amount || Number.isNaN(amount) || amount < 0) {
    return "El importe debe ser un número válido mayor o igual a 0.";
  }

  const currency = normalizeCurrency(form.currency);

  if (currency && !currencyPattern.test(currency)) {
    return "La moneda debe usar un código ISO de 3 letras, por ejemplo EUR.";
  }

  return null;
}

function buildCreatePaymentPayload(form: PaymentEditForm): CreatePaymentPayload {
  const normalizedDescription = normalizeOptionalText(form.description);
  const normalizedBusinessName = normalizeOptionalText(form.businessName);
  const normalizedCategory = normalizeOptionalText(form.category);
  const normalizedSubCategory = normalizeOptionalText(form.subCategory);
  const normalizedCurrency = normalizeCurrency(form.currency);

  return {
    amount: Number(form.amount),
    businessName: normalizedBusinessName,
    category: normalizedCategory,
    subCategory: normalizedSubCategory,
    currency: normalizedCurrency || null,
    date: form.date,
    description: normalizedDescription,
    needsReview: false,
    type: form.type as PaymentType,
  };
}

function buildPaymentUpdatePayload(payment: PaymentDto, form: PaymentEditForm): UpdatePaymentPayload {
  const payload: UpdatePaymentPayload = {};
  const normalizedDescription = normalizeOptionalText(form.description);
  const normalizedBusinessName = normalizeOptionalText(form.businessName);
  const normalizedCategory = normalizeOptionalText(form.category);
  const normalizedSubCategory = normalizeOptionalText(form.subCategory);
  const normalizedCurrency = normalizeCurrency(form.currency);
  const nextCurrency = normalizedCurrency ? normalizedCurrency : null;
  const nextAmount = Number(form.amount);

  if (form.date !== payment.date) {
    payload.date = form.date;
  }

  if (normalizedDescription !== payment.description) {
    payload.description = normalizedDescription;
  }

  if (normalizedBusinessName !== payment.businessName) {
    payload.businessName = normalizedBusinessName;
  }

  if (form.type && form.type !== payment.type) {
    payload.type = form.type;
  }

  if (Math.abs(nextAmount - payment.amount) > amountEqualityThreshold) {
    payload.amount = nextAmount;
  }

  if (normalizedCategory !== payment.category) {
    payload.category = normalizedCategory;
  }

  if (normalizedSubCategory !== payment.subCategory) {
    payload.subCategory = normalizedSubCategory;
  }

  if (nextCurrency !== payment.currency) {
    payload.currency = nextCurrency;
  }

  return payload;
}

function formatEuroAmount(amount: number) {
  return `${euroFormatter.format(amount)} EUR`;
}

function formatSignedAmount(amount: number, direction: "incoming" | "outgoing") {
  const prefix = direction === "incoming" ? "+" : "";
  return `${prefix}${formatEuroAmount(amount)}`;
}

function PaymentCategoryBadge({
  backgroundColor,
  color,
  iconName,
  label,
  showDot = true,
}: {
  backgroundColor: string;
  color: string;
  iconName?: string;
  label: string;
  showDot?: boolean;
}) {
  return (
    <span
      className="inline-flex h-[26px] items-center gap-2 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium"
      style={{ backgroundColor, color }}
    >
      {iconName ? <IconifyIcon className="h-[13px] w-[13px] shrink-0" icon={iconName} /> : null}
      {showDot ? <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: color }} /> : null}
      {label}
    </span>
  );
}

function PaymentTypeBadge({
  direction,
  label,
}: {
  direction: "incoming" | "outgoing";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium",
        direction === "incoming"
          ? "bg-[var(--success-green)]/10 text-[var(--success-green)]"
          : "bg-[var(--danger-red)]/10 text-[var(--danger-red)]",
      )}
    >
      {label}
    </span>
  );
}

function ReviewStatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 w-fit items-center gap-1 rounded-full bg-[var(--cat-restaurant-bg)] px-2 text-[11px] font-semibold text-[var(--cat-restaurant)]">
      <CircleAlert className="h-3 w-3 shrink-0" />
      <span>{label}</span>
      <ArrowRight className="h-[11px] w-[11px] shrink-0" />
    </span>
  );
}

function SortableHeader({
  active,
  align = "left",
  direction,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  align?: "left" | "right";
  direction: SortDirection;
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "group inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.04em] transition-colors",
        align === "right" ? "w-full justify-end" : "justify-start",
        active ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      )}
      onClick={onClick}
      type="button"
    >
      {Icon ? <Icon className="h-[13px] w-[13px]" /> : null}
      <span>{label}</span>
      {active ? (
        <ArrowDown
          className={cn(
            "h-3 w-3 transition-transform",
            direction === "ASC" ? "rotate-180" : "rotate-0",
          )}
        />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-secondary)]" />
      )}
    </button>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  iconClassName,
  children,
}: {
  icon: LucideIcon;
  title: string;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-white)] p-5">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-[18px] w-[18px]", iconClassName)} />
        <h3 className="text-[16px] font-bold text-[var(--text-primary)]">{title}</h3>
      </div>
      {children}
    </article>
  );
}

function MobilePaymentCard({
  amount,
  business,
  category,
  categoryBadgeStyle,
  categoryIconName,
  description,
  displayDate,
  direction,
  onClick,
  paymentTypeLabel,
  statusLabel,
}: {
  amount: number;
  business: string;
  category: string;
  categoryBadgeStyle: {
    backgroundColor: string;
    color: string;
  };
  categoryIconName?: string;
  description: string;
  displayDate: string;
  direction: "incoming" | "outgoing";
  onClick: () => void;
  paymentTypeLabel?: string;
  statusLabel?: string;
}) {
  return (
    <button
      className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-white)] p-4 text-left shadow-[0_18px_30px_var(--navy-alpha-03)] transition duration-200 hover:border-[var(--blue-200)] hover:shadow-[0_22px_36px_var(--navy-alpha-08)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-alpha-25)]"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium text-[var(--text-secondary)]">{displayDate}</p>
          <h3 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">{business}</h3>
        </div>
        <p
          className={cn(
            "text-right text-[14px] font-semibold tabular-nums",
            direction === "incoming" ? "text-[var(--success-green)]" : "text-[var(--danger-red)]",
          )}
        >
          {formatSignedAmount(amount, direction)}
        </p>
      </div>
      <div className="mt-3 flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <p>{description}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PaymentCategoryBadge
          backgroundColor={categoryBadgeStyle.backgroundColor}
          color={categoryBadgeStyle.color}
          iconName={categoryIconName}
          label={category}
        />
        <PaymentTypeBadge direction={direction} label={paymentTypeLabel ?? "Pago"} />
        {statusLabel ? <ReviewStatusBadge label={statusLabel} /> : null}
      </div>
    </button>
  );
}

function PaymentEditDialog({
  categoriesByName,
  subcategoriesByName,
  categoryOptions,
  subcategoryOptions,
  open,
  payment,
  form,
  error,
  isSaving,
  onCreateCategory,
  onCreateSubCategory,
  onFieldChange,
  onBulkScopeChange,
  onOpenChange,
  onSubmit,
  onToggleUpdateAll,
}: {
  categoriesByName: Map<string, CategoryDto>;
  subcategoriesByName: Map<string, CategoryDto>;
  categoryOptions: SelectFieldOption[];
  subcategoryOptions: SelectFieldOption[];
  open: boolean;
  payment: PaymentDto | null;
  form: PaymentEditForm | null;
  error: string | null;
  isSaving: boolean;
  onCreateCategory: (name: string) => Promise<SelectFieldOption | void>;
  onCreateSubCategory: (name: string) => Promise<SelectFieldOption | void>;
  onFieldChange: <Key extends keyof PaymentEditForm>(field: Key, value: PaymentEditForm[Key]) => void;
  onBulkScopeChange: (value: BulkUpdateScope) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onToggleUpdateAll: () => void;
}) {
  const isCreateMode = !payment;
  const canBulkUpdate = Boolean(payment?.businessName?.trim());
  const paymentEntry = payment ? mapPaymentToEntry(payment, categoriesByName, subcategoriesByName) : null;
  const currentBusinessName = payment?.businessName?.trim() || "Sin negocio";
  const hasSelectedParentCategory = Boolean(form?.category.trim());

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-[760px] overflow-x-hidden overflow-y-auto rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-white)] p-0 shadow-[0_30px_80px_var(--navy-alpha-20)]">
        {form ? (
          <div className="space-y-6 p-6 sm:p-7">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-[24px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                {isCreateMode ? "Nuevo pago" : "Editar pago"}
              </DialogTitle>
              <DialogDescription className="text-[14px] leading-6 text-[var(--text-secondary)]">
                {isCreateMode
                  ? "Completa los datos del movimiento para registrar un nuevo pago manualmente."
                  : "Ajusta los datos del movimiento y decide si quieres propagar los cambios al resto de pagos con el mismo negocio."}
              </DialogDescription>
            </DialogHeader>

            {!isCreateMode ? (
            <div className="rounded-[24px] border border-[var(--payments-soft-blue-border)] bg-[linear-gradient(135deg,var(--payments-soft-blue-panel)_0%,var(--bg-white)_100%)] p-5 shadow-[0_18px_40px_var(--navy-alpha-03)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Pago seleccionado
                  </p>
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--payments-soft-blue-icon)] text-[var(--accent-blue)] ring-1 ring-[var(--payments-soft-blue-border)]">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 max-w-[360px] flex-1">
                      <p className="whitespace-normal break-words text-[18px] font-bold leading-6 tracking-[-0.02em] text-[var(--text-primary)]">
                        {currentBusinessName}
                      </p>
                      <p className="mt-1 break-words text-[13px] text-[var(--text-secondary)]">
                        ID {payment.id.slice(0, 8)} · {paymentEntry?.displayDate}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {paymentEntry ? (
                    <>
                      <PaymentTypeBadge
                        direction={paymentEntry.direction}
                        label={paymentEntry.paymentTypeLabel ?? getPaymentTypeLabel(payment.type)}
                      />
                      <span className="inline-flex h-[26px] items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-white)] px-3 text-[12px] font-semibold text-[var(--text-primary)]">
                        {formatSignedAmount(payment.amount, paymentEntry.direction)}
                      </span>
                      <PaymentCategoryBadge
                        backgroundColor={paymentEntry.categoryBadgeStyle.backgroundColor}
                        color={paymentEntry.categoryBadgeStyle.color}
                        iconName={paymentEntry.categoryIconName}
                        label={paymentEntry.category}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <DateField
                className="sm:col-span-1"
                icon={Calendar}
                label="Fecha"
                onChange={(value) => onFieldChange("date", value)}
                value={form.date}
              />
              <SelectField
                className="sm:col-span-1"
                icon={Repeat2}
                label="Tipo"
                onChange={(value) => onFieldChange("type", value as PaymentEditForm["type"])}
                options={paymentTypeFormOptions}
                value={form.type}
              />
              <InputField
                className="sm:col-span-1"
                icon={Building2}
                label="Negocio"
                onChange={(value) => onFieldChange("businessName", value)}
                placeholder="Mercadona"
                value={form.businessName}
              />
              <SearchableSelectField
                className="sm:col-span-1"
                createOptionLabel="categoria"
                icon={Tag}
                label="Categoría"
                onCreateOption={onCreateCategory}
                onChange={(value) => onFieldChange("category", value)}
                options={categoryOptions}
                placeholder="Busca o crea una categoría"
                value={form.category}
              />
              {hasSelectedParentCategory ? (
                <SearchableSelectField
                  className="sm:col-span-1"
                  createOptionLabel="subcategoria"
                  icon={Shapes}
                  label="Subcategoria"
                  onCreateOption={onCreateSubCategory}
                  onChange={(value) => onFieldChange("subCategory", value)}
                  options={subcategoryOptions}
                  placeholder="Busca o crea una subcategoria"
                  value={form.subCategory}
                />
              ) : null}
              <InputField
                className="sm:col-span-1"
                icon={BadgeEuro}
                inputMode="decimal"
                label="Importe"
                min="0"
                onChange={(value) => onFieldChange("amount", value)}
                placeholder="0,00"
                step="0.01"
                type="number"
                value={form.amount}
              />
              <InputField
                className="sm:col-span-1"
                icon={Wallet}
                label="Moneda"
                onChange={(value) => onFieldChange("currency", value.toUpperCase())}
                placeholder="EUR"
                value={form.currency}
              />
              <InputField
                className="sm:col-span-2"
                icon={FileText}
                label="Descripción"
                onChange={(value) => onFieldChange("description", value)}
                placeholder="Compra supermercado"
                value={form.description}
              />
            </div>

            {!isCreateMode ? (
              <section className="overflow-hidden rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-white)] shadow-[0_20px_45px_var(--navy-alpha-08)]">
                <div className="flex flex-col gap-5 px-7 pb-7 pt-7 sm:flex-row sm:items-start sm:justify-between sm:px-8">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      ACTUALIZACION MASIVA
                    </p>
                    <h3 className="mt-2 text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                      Actualizar todos los pagos relacionados
                    </h3>
                    <p className="mt-2 max-w-[440px] text-[14px] leading-[1.5] text-[var(--text-secondary)]">
                      {canBulkUpdate
                        ? `Se aplicara usando "${currentBusinessName}" como referencia principal.`
                        : "Necesitas indicar un negocio en este pago para poder usar esta actualizacion masiva."}
                    </p>
                  </div>
                  <button
                    aria-label="Activar actualizacion masiva"
                    aria-pressed={form.updateAll}
                    className={cn(
                      "flex h-[26px] w-[48px] shrink-0 items-center rounded-full p-[3px] transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-alpha-25)]",
                      form.updateAll && canBulkUpdate
                        ? "justify-end bg-[var(--accent-blue)]"
                        : "justify-start bg-[var(--border-color)]",
                      !canBulkUpdate ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    )}
                    disabled={!canBulkUpdate}
                    onClick={onToggleUpdateAll}
                    type="button"
                  >
                    <span className="h-[20px] w-[20px] rounded-full bg-[var(--bg-white)] shadow-[0_1px_2px_rgba(15,23,42,0.18)]" />
                  </button>
                </div>

                {form.updateAll && canBulkUpdate ? (
                  <div className="px-7 pb-6 pt-6 sm:px-8">
                    <div className="h-px bg-[var(--cloud-100)]" />
                    <div className="pt-6">
                      <p className="text-[15px] font-semibold text-[var(--text-primary)]">Alcance de la actualizacion</p>
                      <p className="mt-2 max-w-[470px] text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                        Elige como localizar los pagos que se actualizaran automaticamente.
                      </p>
                      <div aria-label="Alcance de la actualizacion" className="mt-5" role="radiogroup">
                        {bulkUpdateScopeOptions.map((option, optionIndex) => {
                          const isSelected = form.bulkUpdateScope === option.value;

                          return (
                            <div
                              className={cn(optionIndex > 0 ? "border-t border-[var(--cloud-100)]" : "")}
                              key={option.value}
                            >
                              <button
                                aria-checked={isSelected}
                                className="flex w-full items-start gap-3 py-4 text-left transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-alpha-25)]"
                                onClick={() => onBulkScopeChange(option.value)}
                                role="radio"
                                type="button"
                              >
                                <span
                                  className={cn(
                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
                                    isSelected
                                      ? "border-[5px] border-[var(--accent-blue)]"
                                      : "border-[1.5px] border-[var(--border-color)]",
                                  )}
                                />
                                <span className="min-w-0">
                                  <span className="block text-[14px] font-medium text-[var(--text-primary)]">{option.title}</span>
                                  <span className="mt-1 block text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                                    {option.description}
                                  </span>
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {payment?.needsReview ? (
              <div className="rounded-[18px] border border-[var(--payments-soft-blue-border)] bg-[var(--payments-soft-blue-panel)] px-4 py-3 text-[13px] font-medium leading-6 text-[var(--accent-blue)]">
                Al guardar, este pago dejará de aparecer como pendiente de procesar.
              </div>
            ) : null}

            {error ? <p className="text-[13px] font-medium text-[var(--danger-red)]">{error}</p> : null}

            <DialogFooter className="gap-3 sm:justify-between">
              <button
                className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[var(--border-color)] bg-[var(--bg-white)] px-4 text-[14px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--blue-200)] hover:text-[var(--text-primary)] disabled:opacity-50"
                disabled={isSaving}
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--accent-blue)] px-5 text-[14px] font-semibold text-[var(--white)] shadow-[0_14px_32px_var(--blue-alpha-25)] transition-colors hover:bg-[var(--blue-600)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={onSubmit}
                type="button"
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function PaymentsHistoryScreen() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [totalIncoming, setTotalIncoming] = useState(0);
  const [totalOutgoing, setTotalOutgoing] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [hasResolvedPayments, setHasResolvedPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [period, setPeriod] = useState<PeriodSelection>("Mensual");
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultPeriodSelection.month);
  const [selectedYear, setSelectedYear] = useState<string>(defaultPeriodSelection.year);
  const [customStartDate, setCustomStartDate] = useState(defaultCustomDateRange.startDate);
  const [customEndDate, setCustomEndDate] = useState(defaultCustomDateRange.endDate);
  const [hasLoadedPeriodPreferences, setHasLoadedPeriodPreferences] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_LABEL);
  const [selectedSubCategory, setSelectedSubCategory] = useState(ALL_SUBCATEGORIES_LABEL);
  const [selectedBusiness, setSelectedBusiness] = useState(ALL_BUSINESSES_LABEL);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortField, setSortField] = useState<PaymentSortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [rowsPerPage, setRowsPerPage] = useState<(typeof rowsPerPageOptions)[number]>(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [subcategories, setSubcategories] = useState<CategoryDto[]>([]);
  const [filterSubcategories, setFilterSubcategories] = useState<CategoryDto[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserDto | null>(null);
  const [availableBusinessValues, setAvailableBusinessValues] = useState<string[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDto | null>(null);
  const [paymentEditForm, setPaymentEditForm] = useState<PaymentEditForm | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentEditError, setPaymentEditError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const availableYearOptions = selectableYearOptions;
  const availableMonthOptions = selectableMonthOptions;
  const categoriesByName = useMemo(
    () =>
      new Map(
        categories
          .map((category) => [normalizeCategoryName(category.name), category] as const)
          .filter((entry): entry is [string, CategoryDto] => Boolean(entry[0])),
      ),
    [categories],
  );
  const subcategoriesByName = useMemo(
    () =>
      new Map(
        subcategories
          .map((subcategory) => [normalizeCategoryName(subcategory.name), subcategory] as const)
          .filter((entry): entry is [string, CategoryDto] => Boolean(entry[0])),
      ),
    [subcategories],
  );
  const categoriesById = useMemo(
    () =>
      new Map(
        categories
          .map((category) => [category.id, category] as const)
          .filter((entry): entry is [string, CategoryDto] => Boolean(entry[0])),
      ),
    [categories],
  );
  const categoryIdByName = useMemo(
    () =>
      new Map(
        categories
          .map((category) => [normalizeCategoryName(category.name), category.id] as const)
          .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1])),
      ),
    [categories],
  );
  const selectedFilterCategoryId = categoryIdByName.get(normalizeCategoryName(selectedCategory) ?? "");
  const hasSelectedFilterCategory = Boolean(selectedFilterCategoryId && selectedCategory !== ALL_CATEGORIES_LABEL);
  const availableCategoryValues = categories.map((category) => category.name);
  const availableSubcategoryValues = useMemo(() => {
    return filterSubcategories.map((subcategory) => subcategory.name);
  }, [filterSubcategories]);
  const availableCategoryOptions = [ALL_CATEGORIES_LABEL, ...availableCategoryValues];
  const availableSubcategoryOptions = [ALL_SUBCATEGORIES_LABEL, ...availableSubcategoryValues];
  const availableBusinessOptions = [ALL_BUSINESSES_LABEL, ...availableBusinessValues];
  const paymentRows = useMemo(
    () => payments.map((payment) => ({ entry: mapPaymentToEntry(payment, categoriesByName, subcategoriesByName), payment })),
    [categoriesByName, payments, subcategoriesByName],
  );
  const monthSelectOptions: SelectFieldOption[] = availableMonthOptions.map((option) => ({ label: option, value: option }));
  const yearSelectOptions: SelectFieldOption[] = availableYearOptions.map((option) => ({ label: option, value: option }));
  const categoryFieldOptions: SelectFieldOption[] = categories.map((category) => ({
    iconName: category.iconName,
    label: category.name,
    value: category.name,
  }));
  const selectedPaymentEditCategoryId = categoryIdByName.get(normalizeCategoryName(paymentEditForm?.category) ?? "");
  const subcategoryFieldOptions: SelectFieldOption[] = useMemo(() => {
    if (!selectedPaymentEditCategoryId) {
      return [];
    }

    return subcategories
      .filter((subcategory) => subcategory.parent === selectedPaymentEditCategoryId)
      .map((subcategory) => ({
        iconName: subcategory.iconName,
        label: subcategory.name,
        value: subcategory.name,
      }));
  }, [selectedPaymentEditCategoryId, subcategories]);
  const categorySelectOptions: SelectFieldOption[] = availableCategoryOptions.map((option) => {
    const matchingCategory = categories.find((category) => category.name === option);

    return {
      iconName: matchingCategory?.iconName,
      label: option,
      value: option,
    };
  });
  const subcategorySelectOptions: SelectFieldOption[] = availableSubcategoryOptions.map((option) => {
    const matchingSubcategory = subcategories.find((subcategory) => subcategory.name === option);

    return {
      iconName: matchingSubcategory?.iconName,
      label: option,
      value: option,
    };
  });
  const businessSelectOptions: SelectFieldOption[] = availableBusinessOptions.map((option) => ({ label: option, value: option }));
  const rowsPerPageSelectOptions: SelectFieldOption[] = rowsPerPageOptions.map((option) => ({
    label: `${option} por página`,
    value: option,
  }));
  const pageSelectOptions: SelectFieldOption[] = Array.from({ length: totalPages }, (_, index) => ({
    label: `Página ${index + 1} de ${totalPages}`,
    value: index + 1,
  }));

  const drawerUserName = getUserDisplayName(user?.displayName, user?.email, currentUserProfile);
  const drawerUserPhotoUrl = currentUserProfile?.profilePhotoUrl || user?.photoURL || null;
  const drawerUserSubtitle = currentUserProfile?.email || user?.email || "Cuenta activa";
  const drawerUserInitials = getUserInitials(drawerUserName);

  useEffect(() => {
    if (!categoriesError) {
      return;
    }

    showError(categoriesError);
  }, [categoriesError, showError]);

  useEffect(() => {
    if (!paymentsError) {
      return;
    }

    showError(paymentsError);
  }, [paymentsError, showError]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const storedPreferences = readStoredPeriodPreferences();

    if (storedPreferences) {
      if (selectableMonthOptions.includes(storedPreferences.selectedMonth)) {
        setSelectedMonth(storedPreferences.selectedMonth);
      }

      if (selectableYearOptions.includes(storedPreferences.selectedYear)) {
        setSelectedYear(storedPreferences.selectedYear);
      }

      setPeriod(storedPreferences.period);
    }

    setHasLoadedPeriodPreferences(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPeriodPreferences || typeof window === "undefined") {
      return;
    }

    const nextPreferences: StoredPeriodPreferences = {
      period,
      selectedMonth,
      selectedYear,
    };

    window.localStorage.setItem(PERIOD_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences));
  }, [hasLoadedPeriodPreferences, period, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      setCurrentUserProfile(null);
      return;
    }

    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const nextUserProfile = await userService.findMe();

        if (cancelled) {
          return;
        }

        setCurrentUserProfile(nextUserProfile);
      } catch {
        if (cancelled) {
          return;
        }

        setCurrentUserProfile(null);
      }
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, user?.uid]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    let cancelled = false;

    const loadCategories = async () => {
      const [categoriesResult, subcategoriesResult] = await Promise.allSettled([
        categoryService.listCategories(),
        categoryService.listSubcategories(),
      ]);

      if (cancelled) {
        return;
      }

      const nextErrors: string[] = [];

      if (categoriesResult.status === "fulfilled") {
        setCategories(sortCategoriesByName(categoriesResult.value));
      } else {
        setCategories([]);
        nextErrors.push(normalizeCategoriesMessage(categoriesResult.reason));
      }

      if (subcategoriesResult.status === "fulfilled") {
        setSubcategories(sortCategoriesByName(subcategoriesResult.value));
      } else {
        setSubcategories([]);
        nextErrors.push(normalizeCategoriesMessage(subcategoriesResult.reason));
      }

      setCategoriesError(nextErrors.length > 0 ? nextErrors.join(" ") : null);
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, reloadKey]);

  useEffect(() => {
    if (!availableYearOptions.includes(selectedYear)) {
      setSelectedYear(defaultPeriodSelection.year);
    }
  }, [availableYearOptions, selectedYear]);

  useEffect(() => {
    if (period === "Mensual" && !availableMonthOptions.includes(selectedMonth)) {
      setSelectedMonth(defaultPeriodSelection.month);
    }
  }, [availableMonthOptions, period, selectedMonth]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      setFilterSubcategories([]);
      return;
    }

    if (!hasSelectedFilterCategory || !selectedFilterCategoryId) {
      setFilterSubcategories([]);
      return;
    }

    let cancelled = false;

    const loadFilterSubcategories = async () => {
      try {
        const nextSubcategories = await categoryService.listSubcategoriesByParent(selectedFilterCategoryId);

        if (cancelled) {
          return;
        }

        setFilterSubcategories(sortCategoriesByName(nextSubcategories));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setFilterSubcategories([]);
        setCategoriesError(normalizeCategoriesMessage(error));
      }
    };

    void loadFilterSubcategories();

    return () => {
      cancelled = true;
    };
  }, [hasSelectedFilterCategory, isAuthenticated, isLoading, selectedFilterCategoryId]);

  useEffect(() => {
    if (![ALL_CATEGORIES_LABEL, ...availableCategoryValues].includes(selectedCategory)) {
      setSelectedCategory(ALL_CATEGORIES_LABEL);
    }
  }, [availableCategoryValues, selectedCategory]);

  useEffect(() => {
    if (![ALL_SUBCATEGORIES_LABEL, ...availableSubcategoryValues].includes(selectedSubCategory)) {
      setSelectedSubCategory(ALL_SUBCATEGORIES_LABEL);
    }
  }, [availableSubcategoryValues, selectedSubCategory]);

  useEffect(() => {
    if (![ALL_BUSINESSES_LABEL, ...availableBusinessValues].includes(selectedBusiness)) {
      setSelectedBusiness(ALL_BUSINESSES_LABEL);
    }
  }, [availableBusinessValues, selectedBusiness]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setPaymentEditForm((currentForm) => {
      if (!currentForm?.subCategory.trim()) {
        return currentForm;
      }

      const parentCategoryName = resolveParentCategoryName(currentForm.subCategory, subcategoriesByName, categoriesById);

      if (!parentCategoryName || currentForm.category === parentCategoryName) {
        return currentForm;
      }

      return {
        ...currentForm,
        category: parentCategoryName,
      };
    });
  }, [categoriesById, subcategoriesByName]);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.replace("/");
    });
  };
  const handleContact = () => {
    window.location.href = "mailto:mdumitruvlad@gmail.com";
  };
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const isInitialPaymentsLoad = isPaymentsLoading && !hasResolvedPayments;

  useEffect(() => {
    if (!hasLoadedPeriodPreferences) {
      return;
    }

    if (isLoading || !isAuthenticated) {
      return;
    }

    let dateRange: { startDate: string; endDate: string };

    try {
      dateRange = buildDateRange(period, selectedMonth, selectedYear, {
        endDate: customEndDate,
        startDate: customStartDate,
      });
    } catch (error) {
      setPaymentsError(normalizePaymentsMessage(error));
      return;
    }

    const { endDate, startDate } = dateRange;
    const categoryFilter = selectedCategory === ALL_CATEGORIES_LABEL ? undefined : selectedCategory;
    const subCategoryFilter = selectedSubCategory === ALL_SUBCATEGORIES_LABEL ? undefined : selectedSubCategory;
    const businessFilter = selectedBusiness === ALL_BUSINESSES_LABEL ? undefined : selectedBusiness;
    const parsedMinAmount = minAmount ? Number(minAmount) : undefined;
    const parsedMaxAmount = maxAmount ? Number(maxAmount) : undefined;

    if (
      (parsedMinAmount !== undefined && (Number.isNaN(parsedMinAmount) || parsedMinAmount < 0)) ||
      (parsedMaxAmount !== undefined && (Number.isNaN(parsedMaxAmount) || parsedMaxAmount < 0))
    ) {
      setPaymentsError("El rango de importe debe contener valores válidos mayores o iguales a 0.");
      return;
    }

    if (parsedMinAmount !== undefined && parsedMaxAmount !== undefined && parsedMinAmount > parsedMaxAmount) {
      setPaymentsError("El importe mínimo no puede ser mayor que el importe máximo.");
      return;
    }

    let cancelled = false;

    const loadPayments = async () => {
      setIsPaymentsLoading(true);
      setPaymentsError(null);

      try {
        const [paymentsPage, summary, groupedBusinesses] = await Promise.all([
          paymentsService.listPayments({
            business: businessFilter,
            category: categoryFilter,
            direction: sortDirection,
            endDate,
            maxAmount: parsedMaxAmount,
            minAmount: parsedMinAmount,
            page: currentPage - 1,
            size: rowsPerPage,
            sort: sortField,
            startDate,
            subCategory: subCategoryFilter,
          }),
          paymentsService.getSummary({ endDate, startDate }),
          paymentsService.getGroupByBusiness({ endDate, startDate }),
        ]);

        if (cancelled) {
          return;
        }

        setPayments(paymentsPage.items);
        setTotalItems(paymentsPage.totalItems);
        setTotalPages(Math.max(1, paymentsPage.totalPages));
        setAvailableBusinessValues(groupedBusinesses.map((group) => group.businessName));
        setTotalIncoming(summary.find((entry) => entry.type === "ADD")?.totalAmount ?? 0);
        setTotalOutgoing(summary.find((entry) => entry.type === "SUBTRACT")?.totalAmount ?? 0);
        setHasResolvedPayments(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (!hasResolvedPayments) {
          setPayments([]);
          setTotalItems(0);
          setTotalPages(1);
          setTotalIncoming(0);
          setTotalOutgoing(0);
          setHasResolvedPayments(true);
        }

        setPaymentsError(normalizePaymentsMessage(error));
      } finally {
        if (!cancelled) {
          setIsPaymentsLoading(false);
        }
      }
    };

    void loadPayments();

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    hasLoadedPeriodPreferences,
    isAuthenticated,
    isLoading,
    maxAmount,
    minAmount,
    period,
    reloadKey,
    rowsPerPage,
    selectedBusiness,
    selectedCategory,
    selectedSubCategory,
    customEndDate,
    customStartDate,
    hasResolvedPayments,
    selectedMonth,
    selectedYear,
    sortDirection,
    sortField,
  ]);

  const handlePeriodChange = (nextPeriod: "Mensual" | "Anual" | "Personalizado") => {
    setPeriod(nextPeriod);
    setCurrentPage(1);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    setCurrentPage(1);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setCurrentPage(1);
  };

  const handleCustomStartDateChange = (value: string) => {
    setCustomStartDate(value);
    setCurrentPage(1);
  };

  const handleCustomEndDateChange = (value: string) => {
    setCustomEndDate(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubCategory(ALL_SUBCATEGORIES_LABEL);
    setCurrentPage(1);
  };

  const handleSubCategoryChange = (value: string) => {
    setSelectedSubCategory(value);
    setCurrentPage(1);
  };

  const handleBusinessChange = (value: string) => {
    setSelectedBusiness(value);
    setCurrentPage(1);
  };

  const handleAmountRangeChange = ({ minValue, maxValue }: { minValue: string; maxValue: string }) => {
    setMinAmount(minValue);
    setMaxAmount(maxValue);
    setCurrentPage(1);
  };

  const handleSortChange = (field: PaymentSortField) => {
    setCurrentPage(1);

    if (sortField === field) {
      setSortDirection((currentDirection) => (currentDirection === "ASC" ? "DESC" : "ASC"));
      return;
    }

    setSortField(field);
    setSortDirection(defaultSortDirectionByField[field]);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value) as (typeof rowsPerPageOptions)[number]);
    setCurrentPage(1);
  };

  const handlePageChange = (value: string) => {
    setCurrentPage(Number(value));
  };

  const handleExcelButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleExcelFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setIsImportingExcel(true);

    try {
      const importedPayments = await bankService.extractPayments(selectedFile);

      setCurrentPage(1);
      setSelectedCategory(ALL_CATEGORIES_LABEL);
      setSelectedBusiness(ALL_BUSINESSES_LABEL);
      setReloadKey((value) => value + 1);
      showSuccess(`Importación completada: ${importedPayments.length} pagos guardados.`);
    } catch (error) {
      showError(normalizeImportMessage(error));
    } finally {
      event.target.value = "";
      setIsImportingExcel(false);
    }
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    if (!open && isSavingPayment) {
      return;
    }

    setIsEditDialogOpen(open);

    if (!open) {
      setSelectedPayment(null);
      setPaymentEditForm(null);
      setPaymentEditError(null);
    }
  };

  const handlePaymentSelect = (payment: PaymentDto) => {
    setSelectedPayment(payment);
    setPaymentEditForm(createPaymentEditForm(payment, subcategoriesByName, categoriesById));
    setPaymentEditError(null);
    setIsEditDialogOpen(true);
  };

  const handleNewPayment = () => {
    setSelectedPayment(null);
    setPaymentEditForm(createEmptyPaymentEditForm());
    setPaymentEditError(null);
    setIsEditDialogOpen(true);
  };

  const handlePaymentFormChange = <Key extends keyof PaymentEditForm>(field: Key, value: PaymentEditForm[Key]) => {
    setPaymentEditForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      if (field === "category") {
        return {
          ...currentForm,
          category: value as PaymentEditForm["category"],
          subCategory: "",
        };
      }

      return { ...currentForm, [field]: value };
    });
  };

  const handleCreateCategory = async (name: string) => {
    const createdCategory = await categoryService.createCategory({ name, parent: null });

    setCategories((currentCategories) => sortCategoriesByName([...currentCategories, createdCategory]));

    return {
      iconName: createdCategory.iconName,
      label: createdCategory.name,
      value: createdCategory.name,
    } satisfies SelectFieldOption;
  };

  const handleCreateSubCategory = async (name: string) => {
    if (!selectedPaymentEditCategoryId) {
      throw new Error("Debes seleccionar una categoria padre antes de crear una subcategoria.");
    }

    const createdSubcategory = await categoryService.createCategory({
      name,
      parent: selectedPaymentEditCategoryId,
    });

    setSubcategories((currentSubcategories) => sortCategoriesByName([...currentSubcategories, createdSubcategory]));

    return {
      iconName: createdSubcategory.iconName,
      label: createdSubcategory.name,
      value: createdSubcategory.name,
    } satisfies SelectFieldOption;
  };

  const handleBulkScopeChange = (value: BulkUpdateScope) => {
    setPaymentEditForm((currentForm) => (currentForm ? { ...currentForm, bulkUpdateScope: value } : currentForm));
  };

  const handleToggleUpdateAll = () => {
    if (!selectedPayment?.businessName?.trim()) {
      return;
    }

    setPaymentEditForm((currentForm) =>
      currentForm
        ? {
            ...currentForm,
            updateAll: !currentForm.updateAll,
          }
        : currentForm,
    );
  };

  const handlePaymentSave = async () => {
    if (!paymentEditForm) {
      return;
    }

    const validationError = validatePaymentEditForm(paymentEditForm);

    if (validationError) {
      setPaymentEditError(validationError);
      return;
    }

    if (!selectedPayment) {
      setIsSavingPayment(true);
      setPaymentEditError(null);

      try {
        await paymentsService.createPayment(buildCreatePaymentPayload(paymentEditForm));
        setReloadKey((value) => value + 1);
        showSuccess("Pago creado correctamente.");
        handleEditDialogOpenChange(false);
      } catch (error) {
        setPaymentEditError(normalizePaymentsMessage(error));
      } finally {
        setIsSavingPayment(false);
      }

      return;
    }

    const updatePayload = buildPaymentUpdatePayload(selectedPayment, paymentEditForm);

    if (Object.keys(updatePayload).length === 0) {
      setPaymentEditError("No hay cambios para guardar.");
      return;
    }

    setIsSavingPayment(true);
    setPaymentEditError(null);

    try {
      const updatedPayment = await paymentsService.updatePayment(selectedPayment.id, {
        ...updatePayload,
        forAll: paymentEditForm.updateAll,
      });

      setPayments((currentPayments) =>
        currentPayments.map((payment) => (payment.id === updatedPayment.id ? updatedPayment : payment)),
      );
      setReloadKey((value) => value + 1);
      if (paymentEditForm.updateAll) {
        showSuccess("Pago actualizado correctamente para la actualización masiva.");
      } else {
        showSuccess("Pago actualizado correctamente.");
      }
      handleEditDialogOpenChange(false);
    } catch (error) {
      setPaymentEditError(normalizePaymentsMessage(error));
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--payments-page-background)] px-6 text-[var(--payments-shell-ink)]">
        <div className="rounded-[24px] border border-[var(--white-alpha-70)] bg-[var(--white-alpha-85)] px-6 py-5 text-[16px] font-semibold shadow-[0_20px_60px_var(--navy-alpha-08)] backdrop-blur">
          Cargando historial de pagos...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,var(--payments-page-background)_0%,var(--payments-page-warm)_100%)] text-[var(--payments-shell-ink)]">
      <div className="pointer-events-none absolute right-8 top-14 hidden h-[220px] w-[220px] rounded-full bg-[var(--payments-accent-glow)] blur-3xl lg:block" />
      <div className="pointer-events-none absolute bottom-8 right-16 hidden h-[300px] w-[300px] rounded-full bg-[var(--payments-amber-glow)] blur-3xl lg:block" />
      <div className="relative flex min-h-screen w-full flex-col bg-[var(--bg-page)] xl:flex-row">
        <AppDrawer
          activeLabel="Historial de pagos"
          avatarBadge="L"
          footerDescription="Esta app esta en desarrollo. Llevo 3 dias trabajando en esto, si 3 dias. Es probable que encuentres fallos, si esto sucede envia un email: info@visco.uno y respondere cuando pueda. Si me quieres enviar dinero tambien puedes. Un beso!"
          footerTitle="Version 0.0.1"
          itemActions={{ "Cerrar sesión": handleLogout }}
          primaryActionDisabled={isPending}
          primaryActionIcon={Mail}
          primaryActionLabel="CONTACTA"
          primaryActionOnClick={handleContact}
          userInitial={drawerUserInitials.charAt(0)}
          userName={drawerUserName}
          userPhotoUrl={drawerUserPhotoUrl}
          userSubtitle={drawerUserSubtitle}
        />
        <section className="flex min-w-0 flex-1 flex-col bg-[var(--bg-page)] p-5 sm:p-6 lg:p-10 xl:ml-[284px] xl:min-h-screen">
          <div className="flex flex-col gap-7 rounded-[24px] bg-[var(--bg-page)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-6 w-6 text-[var(--accent-blue)]" />
                  <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[32px]">
                    Historial de pagos
                  </h1>
                </div>
                <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
                  Gestiona y revisa todos los movimientos de tu cuenta
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleExcelFileChange}
                  ref={fileInputRef}
                  type="file"
                />
                <Button
                  className="h-9 rounded-[8px] bg-[var(--bg-white)] px-3 text-[13px] font-semibold text-[var(--text-primary)] shadow-none ring-1 ring-[var(--border-color)] hover:bg-[var(--accent-blue-light)]"
                  onClick={handleNewPayment}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo pago
                </Button>
                <Button
                  className="h-9 rounded-[8px] bg-[var(--bg-white)] px-3 text-[13px] font-semibold text-[var(--text-primary)] shadow-none ring-1 ring-[var(--border-color)] hover:bg-[var(--accent-blue-light)]"
                  disabled={isImportingExcel}
                  onClick={handleExcelButtonClick}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  {isImportingExcel ? "Importando..." : "EXCEL"}
                </Button>
              </div>
            </div>
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
                        onClick={() => handlePeriodChange(value)}
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
                      onChange={handleMonthChange}
                      options={monthSelectOptions}
                      value={selectedMonth}
                    />
                  ) : null}
                  {period !== "Personalizado" ? (
                    <SelectField
                      className="w-full sm:w-[160px] sm:shrink-0"
                      icon={CalendarDays}
                      label="Año"
                      onChange={handleYearChange}
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
                        onChange={handleCustomStartDateChange}
                        value={customStartDate}
                      />
                      <DateField
                        className="w-full sm:w-[190px] sm:shrink-0"
                        icon={CalendarRange}
                        label="Hasta"
                        min={customStartDate}
                        onChange={handleCustomEndDateChange}
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
                      onChange={handleCategoryChange}
                      options={categorySelectOptions}
                      value={selectedCategory}
                    />
                    {hasSelectedFilterCategory ? (
                      <SearchableSelectField
                        icon={Shapes}
                        label="Subcategoria"
                        onChange={handleSubCategoryChange}
                        options={subcategorySelectOptions}
                        value={selectedSubCategory}
                      />
                    ) : null}
                    <SelectField
                      icon={Building2}
                      label="Negocio"
                      onChange={handleBusinessChange}
                      options={businessSelectOptions}
                      value={selectedBusiness}
                    />
                    <AmountRangeField
                      icon={BadgeEuro}
                      label="Importe"
                      maxValue={maxAmount}
                      minValue={minAmount}
                      onChange={handleAmountRangeChange}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-[14px] font-semibold">
                  <div className="flex items-center gap-1.5 text-[var(--danger-red)]">
                    <TrendingDown className="h-4 w-4" />
                    <span>{formatSignedAmount(totalOutgoing, "outgoing")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--success-green)]">
                    <TrendingUp className="h-4 w-4" />
                    <span>{formatSignedAmount(totalIncoming, "incoming")}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-white)]">
              {isPaymentsLoading && hasResolvedPayments ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end p-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--white-alpha-90)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] shadow-[0_8px_24px_var(--navy-alpha-08)] backdrop-blur">
                    <Activity className="h-3.5 w-3.5 animate-spin text-[var(--accent-blue)]" />
                    Actualizando tabla...
                  </div>
                </div>
              ) : null}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px] border-separate border-spacing-0">
                  <thead className="bg-[var(--bg-light)] text-left">
                    <tr>
                      <th className="w-[140px] px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--accent-blue)]">
                        <SortableHeader
                          active={sortField === "date"}
                          direction={sortDirection}
                          icon={Calendar}
                          label="Fecha"
                          onClick={() => handleSortChange("date")}
                        />
                      </th>
                      <th className="px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <SortableHeader
                          active={sortField === "businessName"}
                          direction={sortDirection}
                          icon={Building2}
                          label="Negocio"
                          onClick={() => handleSortChange("businessName")}
                        />
                      </th>
                      <th className="w-[240px] px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <SortableHeader
                          active={sortField === "category"}
                          direction={sortDirection}
                          icon={Tag}
                          label="Categoría"
                          onClick={() => handleSortChange("category")}
                        />
                      </th>
                      <th className="w-[180px] px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Shapes className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          <span>Subcategoria</span>
                        </div>
                      </th>
                      <th className="w-[190px] px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <SortableHeader
                          active={sortField === "type"}
                          direction={sortDirection}
                          icon={Repeat2}
                          label="Tipo"
                          onClick={() => handleSortChange("type")}
                        />
                      </th>
                      <th className="w-[150px] px-5 py-4 text-right text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <SortableHeader
                          active={sortField === "amount"}
                          align="right"
                          direction={sortDirection}
                          icon={BadgeEuro}
                          label="Importe"
                          onClick={() => handleSortChange("amount")}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isInitialPaymentsLoad ? (
                      <tr>
                        <td
                          className="border-t border-[var(--border-color)] px-5 py-10 text-center text-[13px] font-medium text-[var(--text-secondary)]"
                          colSpan={6}
                        >
                          Cargando pagos...
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td
                          className="border-t border-[var(--border-color)] px-5 py-10 text-center text-[13px] font-medium text-[var(--text-secondary)]"
                          colSpan={6}
                        >
                          No hay pagos para el rango seleccionado.
                        </td>
                      </tr>
                    ) : (
                      paymentRows.map(({ entry, payment }) => (
                        <tr
                          className="cursor-pointer transition-colors hover:bg-[var(--accent-blue-light)]/45 focus-visible:outline-none"
                          key={payment.id}
                          onClick={() => handlePaymentSelect(payment)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handlePaymentSelect(payment);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <td className="border-t border-[var(--border-color)] px-5 py-4 align-middle text-[13px] text-[var(--text-primary)]">
                            {entry.displayDate}
                          </td>
                          <td className="border-t border-[var(--border-color)] px-5 py-4 align-middle">
                            <div className="flex flex-col justify-center gap-1.5">
                              <span className="text-[13px] font-medium text-[var(--text-primary)]">{entry.business}</span>
                              <span className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                                <FileText className="h-3 w-3 text-[var(--text-muted)]" />
                                {entry.description}
                              </span>
                              {entry.statusLabel ? <ReviewStatusBadge label={entry.statusLabel} /> : null}
                            </div>
                          </td>
                          <td className="border-t border-[var(--border-color)] px-5 py-4 align-middle">
                            <PaymentCategoryBadge
                              backgroundColor={entry.categoryBadgeStyle.backgroundColor}
                              color={entry.categoryBadgeStyle.color}
                              iconName={entry.categoryIconName}
                              label={entry.category}
                              showDot={!entry.categoryIconName}
                            />
                          </td>
                          <td className="border-t border-[var(--border-color)] px-5 py-4 align-middle">
                            {entry.subCategory ? (
                              <PaymentCategoryBadge
                                backgroundColor={entry.subCategoryBadgeStyle.backgroundColor}
                                color={entry.subCategoryBadgeStyle.color}
                                iconName={entry.subCategoryIconName}
                                label={entry.subCategory}
                                showDot={!entry.subCategoryIconName}
                              />
                            ) : (
                              <span className="block text-[13px] font-medium text-[var(--text-muted)]">Sin subcategoria</span>
                            )}
                          </td>
                          <td className="border-t border-[var(--border-color)] px-5 py-4 align-middle">
                            <PaymentTypeBadge
                              direction={entry.direction}
                              label={getTablePaymentTypeLabel(payment.type)}
                            />
                          </td>
                          <td
                            className={cn(
                              "border-t border-[var(--border-color)] px-5 py-4 text-right align-middle text-[13px] font-semibold tabular-nums",
                              entry.direction === "incoming"
                                ? "text-[var(--success-green)]"
                                : "text-[var(--danger-red)]",
                            )}
                          >
                            {formatSignedAmount(entry.amount, entry.direction)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 p-3 lg:hidden">
                {isInitialPaymentsLoad ? (
                  <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-white)] p-4 text-center text-[13px] font-medium text-[var(--text-secondary)]">
                    Cargando pagos...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-white)] p-4 text-center text-[13px] font-medium text-[var(--text-secondary)]">
                    No hay pagos para el rango seleccionado.
                  </div>
                ) : (
                  paymentRows.map(({ entry, payment }) => (
                    <MobilePaymentCard
                      amount={entry.amount}
                      business={entry.business}
                      category={entry.category}
                      categoryBadgeStyle={entry.categoryBadgeStyle}
                      categoryIconName={entry.categoryIconName}
                      description={entry.description}
                      direction={entry.direction}
                      displayDate={entry.displayDate}
                      key={payment.id}
                      onClick={() => handlePaymentSelect(payment)}
                      paymentTypeLabel={entry.paymentTypeLabel}
                      statusLabel={entry.statusLabel}
                    />
                  ))
                )}
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--border-color)] px-4 py-4 text-[12px] font-medium text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span>
                  Mostrando {totalItems === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + payments.length, totalItems)} de {totalItems} pagos
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <CompactSelectField
                    className="min-w-[152px]"
                    label="Página actual"
                    onChange={handlePageChange}
                    options={pageSelectOptions}
                    value={safePage}
                  />
                  <CompactSelectField
                    label="Pagos por página"
                    onChange={handleRowsPerPageChange}
                    options={rowsPerPageSelectOptions}
                    value={rowsPerPage}
                  />
                  <button
                    aria-label="Página anterior"
                    className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-white)] text-[var(--text-secondary)] disabled:opacity-40"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    type="button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Página siguiente"
                    className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-white)] text-[var(--text-secondary)] disabled:opacity-40"
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    type="button"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <section className="flex justify-center px-4 sm:px-0">
              <div className="w-full max-w-3xl rounded-[18px] border border-dashed border-[var(--payments-soft-blue-border)] bg-[var(--payments-soft-blue-panel)] px-6 py-7 text-center shadow-[0_10px_30px_var(--navy-alpha-03)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-blue)]">
                  Proximamente
                </p>
                <h2 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                  Visualiza tus gastos
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">
                  En siguientes desarrollos podras tener este tipo de paneles informativos. De
                  momento esta zona solo sirve como avance visual.
                </p>
              </div>
            </section>
            <div className="grid gap-4 xl:grid-cols-4">
              <SummaryCard icon={House} iconClassName="text-[var(--cat-software)]" title="Hipoteca">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[18px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                        {mortgageSummary.amountLabel}
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{mortgageSummary.meta}</p>
                    </div>
                    <span className="rounded-full bg-[var(--cat-software-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cat-software)]">
                      {mortgageSummary.badge}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-[12px]">
                      <span className="font-semibold text-[var(--text-muted)]">{mortgageSummary.progressLabel}</span>
                      <span className="text-[var(--text-secondary)]">{mortgageSummary.progressDetail}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-light)]">
                      <div className="h-2 w-[26.7%] rounded-full bg-[var(--cat-software)]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                    <CalendarCheck className="h-[14px] w-[14px]" />
                    <span>{mortgageSummary.remaining}</span>
                  </div>
                </div>
              </SummaryCard>
              <SummaryCard icon={Repeat2} iconClassName="text-[var(--cat-stonks)]" title="Gastos fijos">
                <div className="space-y-4">
                  <div>
                    <p className="text-[22px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                      {fixedExpenses.amountLabel}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{fixedExpenses.meta}</p>
                  </div>
                  <div className="space-y-3">
                    {fixedExpenses.items.map((item) => {
                      const Icon = fixedExpenseIconMap[item.label] ?? Wallet;

                      return (
                        <div className="space-y-3" key={item.label}>
                          <div className="flex items-center justify-between gap-4 text-[13px]">
                            <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                              <Icon className={cn("h-[14px] w-[14px]", fixedExpenseToneClasses[item.tone])} />
                              {item.label}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">{item.amount}</span>
                          </div>
                          {item.label !== fixedExpenses.items[fixedExpenses.items.length - 1]?.label ? (
                            <div className="h-px bg-[var(--border-color)]" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SummaryCard>
              <SummaryCard icon={Activity} iconClassName="text-[var(--cat-energy)]" title="Gastos variables">
                <div className="space-y-4">
                  <p className="text-[12px] text-[var(--text-secondary)]">{variableExpenses.subtitle}</p>
                  <div className="space-y-3">
                    {variableExpenses.items.map((item) => {
                      const Icon = item.label === "Electricidad" ? Zap : Droplets;

                      return (
                        <div className="space-y-2" key={item.label}>
                          <div className="flex items-center justify-between gap-3 text-[13px]">
                            <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                              <Icon className={cn("h-[14px] w-[14px]", item.label === "Electricidad" ? "text-[var(--cat-energy)]" : "text-[var(--cat-transport)]")} />
                              {item.label}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">{item.amount}</span>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1.5 text-[11px] font-medium",
                              item.trend === "up" ? "text-[var(--danger-red)]" : "text-[var(--success-green)]",
                            )}
                          >
                            {item.trend === "up" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span>{item.detail}</span>
                          </div>
                          {item.label !== variableExpenses.items[variableExpenses.items.length - 1]?.label ? (
                            <div className="h-px bg-[var(--border-color)]" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SummaryCard>
              <article className="flex h-full flex-col items-center justify-center gap-4 rounded-[10px] border border-dashed border-[var(--payments-soft-blue-border)] bg-[var(--payments-soft-blue-panel)] p-5 text-center">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[var(--payments-soft-blue-icon)] text-[var(--accent-blue)]">
                  <Plus className="h-[22px] w-[22px]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[16px] font-bold text-[var(--payments-add-card-title)]">Añadir card</h3>
                  <p className="text-[12px] font-medium leading-5 text-[var(--text-secondary)]">
                    Crea tu propio widget con la métrica, comparativa o recordatorio que te interese ver cada mes o año.
                  </p>
                </div>
                <button
                  className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--payments-soft-blue-border)] bg-[var(--white)] px-4 text-[13px] font-bold text-[var(--accent-blue)]"
                  type="button"
                >
                  Personalizar
                </button>
              </article>
            </div>
          </div>
        </section>
      </div>
      <PaymentEditDialog
        categoriesByName={categoriesByName}
        categoryOptions={categoryFieldOptions}
        error={paymentEditError}
        form={paymentEditForm}
        isSaving={isSavingPayment}
        onCreateCategory={handleCreateCategory}
        onCreateSubCategory={handleCreateSubCategory}
        onBulkScopeChange={handleBulkScopeChange}
        onFieldChange={handlePaymentFormChange}
        onOpenChange={handleEditDialogOpenChange}
        onSubmit={handlePaymentSave}
        onToggleUpdateAll={handleToggleUpdateAll}
        open={isEditDialogOpen}
        payment={selectedPayment}
        subcategoriesByName={subcategoriesByName}
        subcategoryOptions={subcategoryFieldOptions}
      />
    </main>
  );
}
