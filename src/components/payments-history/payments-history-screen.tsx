"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpDown,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CalendarSearch,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Droplets,
  FileText,
  House,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Repeat2,
  Shapes,
  Tag,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { CompactSelectField, DateField, SelectField, type SelectFieldOption } from "@/components/ui/select-field";
import {
  fixedExpenses,
  mortgageSummary,
  type PaymentEntry,
  rowsPerPageOptions,
  sidebarSections,
  type PaymentCategoryTone,
  variableExpenses,
} from "@/components/payments-history/payments-history-data";
import { bankService, BankServiceError } from "@/services/bank.service";
import {
  paymentsService,
  PaymentsServiceError,
  type PaymentDto,
  type PaymentSortField,
  type SortDirection,
} from "@/services/payments.service";
import { cn } from "@/lib/utils";

const euroFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const categoryToneClasses: Record<PaymentCategoryTone, { badge: string; dot: string }> = {
  office: {
    badge: "bg-[var(--cat-office-bg)] text-[var(--cat-office)]",
    dot: "bg-[var(--cat-office)]",
  },
  restaurant: {
    badge: "bg-[var(--cat-restaurant-bg)] text-[var(--cat-restaurant)]",
    dot: "bg-[var(--cat-restaurant)]",
  },
  services: {
    badge: "bg-[var(--cat-services-bg)] text-[var(--cat-services)]",
    dot: "bg-[var(--cat-services)]",
  },
  software: {
    badge: "bg-[var(--cat-software-bg)] text-[var(--cat-software)]",
    dot: "bg-[var(--cat-software)]",
  },
  transport: {
    badge: "bg-[var(--cat-transport-bg)] text-[var(--cat-transport)]",
    dot: "bg-[var(--cat-transport)]",
  },
};

const fixedExpenseIconMap: Record<string, LucideIcon> = {
  Hipoteca: House,
  "Internet + Móvil": Wifi,
  Seguros: Wallet,
};

const fixedExpenseToneClasses: Record<string, string> = {
  housing: "text-[var(--cat-housing)]",
  services: "text-[var(--cat-services)]",
  software: "text-[var(--cat-software)]",
};

const navIconMap: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  "Historial de pagos": ReceiptText,
  "Pagos por categoría": Shapes,
  "Pagos por empresa": Building2,
  "Pagos pendientes": CalendarCheck,
  "Gastos variables": Activity,
  Deudas: Wallet,
  Usuario: UserRound,
  Cuenta: Wallet,
  "Cerrar sesión": ChevronRight,
};

const ALL_BUSINESSES_LABEL = "Todos los negocios";
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
const selectableMonthOptions = [...monthNameByIndex].reverse();
const defaultPeriodSelection = getPreviousMonthPeriod();
const selectableYearOptions = Array.from({ length: 6 }, (_, index) => String(Number(defaultPeriodSelection.year) - index));
const defaultCustomDateRange = buildDateRange("Mensual", defaultPeriodSelection.month, defaultPeriodSelection.year);
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

const paymentCategoryFallbacks: Record<PaymentCategoryTone, { label: string; keywords: string[] }> = {
  office: { label: "Oficina", keywords: ["amazon", "papeler", "office", "material"] },
  restaurant: { label: "Restaurantes", keywords: ["rest", "cafe", "bar", "uber eats", "glovo", "deliveroo"] },
  services: { label: "Servicios", keywords: ["stripe", "tax", "seguro", "agency", "freelance", "service"] },
  software: { label: "Software", keywords: ["notion", "google", "microsoft", "slack", "figma", "software"] },
  transport: { label: "Transporte", keywords: ["uber", "metro", "renfe", "cabify", "bolt", "transport"] },
};

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

function getCategoryToneFromPayment(payment: {
  businessName: string | null;
  category: string | null;
  type: "ADD" | "SUBTRACT";
}): PaymentCategoryTone {
  const source = `${payment.category || ""} ${payment.businessName || ""}`.toLowerCase();

  for (const [tone, config] of Object.entries(paymentCategoryFallbacks) as [PaymentCategoryTone, (typeof paymentCategoryFallbacks)[PaymentCategoryTone]][]) {
    if (config.keywords.some((keyword) => source.includes(keyword))) {
      return tone;
    }
  }

  return payment.type === "ADD" ? "services" : "office";
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

function mapPaymentToEntry(payment: PaymentDto): PaymentEntry {
  const categoryTone = getCategoryToneFromPayment(payment);

  return {
    amount: payment.amount,
    business: payment.businessName || (payment.type === "ADD" ? "Ingreso" : "Sin negocio"),
    category: payment.category || paymentCategoryFallbacks[categoryTone].label,
    categoryTone,
    description: payment.description || (payment.type === "ADD" ? "Ingreso registrado" : "Movimiento registrado"),
    direction: payment.type === "ADD" ? "incoming" : "outgoing",
    displayDate: toDisplayDate(payment.date),
    id: payment.id,
    periodMonth: toPeriodMonth(payment.date),
    periodYear: payment.date.slice(0, 4),
    statusLabel: payment.needsReview ? "Pendiente de procesar" : undefined,
  };
}

function formatEuroAmount(amount: number) {
  return `${euroFormatter.format(amount)} EUR`;
}

function formatSignedAmount(amount: number, direction: "incoming" | "outgoing") {
  const prefix = direction === "incoming" ? "+" : "";
  return `${prefix}${formatEuroAmount(amount)}`;
}

function SidebarNavItem({
  label,
  href,
  active = false,
}: {
  label: string;
  href?: string;
  active?: boolean;
}) {
  const Icon = navIconMap[label] ?? ReceiptText;
  const itemClassName = cn(
    "flex h-11 items-center gap-3 rounded-[14px] px-3 text-[14px] font-semibold transition-colors",
    active
      ? "border border-[var(--white-alpha-15)] bg-[var(--white-alpha-10)] text-[var(--white)]"
      : "text-[var(--payments-drawer-muted)] hover:bg-[var(--white-alpha-06)] hover:text-[var(--white)]",
  );

  if (href) {
    return (
      <Link aria-current={active ? "page" : undefined} className={itemClassName} href={href}>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <div className={itemClassName}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-[12px] font-semibold tracking-[0.02em] text-[var(--payments-drawer-label)]">{children}</p>;
}

function PaymentCategoryBadge({
  label,
  tone,
}: {
  label: string;
  tone: PaymentCategoryTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-2 rounded-full px-2.5 text-[12px] font-medium",
        categoryToneClasses[tone].badge,
      )}
    >
      <span className={cn("h-[7px] w-[7px] rounded-full", categoryToneClasses[tone].dot)} />
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
  categoryTone,
  description,
  displayDate,
  direction,
  statusLabel,
}: {
  amount: number;
  business: string;
  category: string;
  categoryTone: PaymentCategoryTone;
  description: string;
  displayDate: string;
  direction: "incoming" | "outgoing";
  statusLabel?: string;
}) {
  return (
    <article className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-white)] p-4 shadow-[0_18px_30px_var(--navy-alpha-03)]">
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
        <PaymentCategoryBadge label={category} tone={categoryTone} />
        {statusLabel ? <ReviewStatusBadge label={statusLabel} /> : null}
      </div>
    </article>
  );
}

export function PaymentsHistoryScreen() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [totalIncoming, setTotalIncoming] = useState(0);
  const [totalOutgoing, setTotalOutgoing] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);
  const [hasResolvedPayments, setHasResolvedPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [period, setPeriod] = useState<"Mensual" | "Anual" | "Personalizado">("Mensual");
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultPeriodSelection.month);
  const [selectedYear, setSelectedYear] = useState<string>(defaultPeriodSelection.year);
  const [customStartDate, setCustomStartDate] = useState(defaultCustomDateRange.startDate);
  const [customEndDate, setCustomEndDate] = useState(defaultCustomDateRange.endDate);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_LABEL);
  const [selectedBusiness, setSelectedBusiness] = useState(ALL_BUSINESSES_LABEL);
  const [sortField, setSortField] = useState<PaymentSortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [rowsPerPage, setRowsPerPage] = useState<(typeof rowsPerPageOptions)[number]>(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableCategoryValues, setAvailableCategoryValues] = useState<string[]>([]);
  const [availableBusinessValues, setAvailableBusinessValues] = useState<string[]>([]);
  const availableYearOptions = selectableYearOptions;
  const availableMonthOptions = selectableMonthOptions;
  const availableCategoryOptions = [ALL_CATEGORIES_LABEL, ...availableCategoryValues];
  const availableBusinessOptions = [ALL_BUSINESSES_LABEL, ...availableBusinessValues];
  const monthSelectOptions: SelectFieldOption[] = availableMonthOptions.map((option) => ({ label: option, value: option }));
  const yearSelectOptions: SelectFieldOption[] = availableYearOptions.map((option) => ({ label: option, value: option }));
  const categorySelectOptions: SelectFieldOption[] = availableCategoryOptions.map((option) => ({ label: option, value: option }));
  const businessSelectOptions: SelectFieldOption[] = availableBusinessOptions.map((option) => ({ label: option, value: option }));
  const rowsPerPageSelectOptions: SelectFieldOption[] = rowsPerPageOptions.map((option) => ({
    label: `${option} por página`,
    value: option,
  }));
  const pageSelectOptions: SelectFieldOption[] = Array.from({ length: totalPages }, (_, index) => ({
    label: `Página ${index + 1} de ${totalPages}`,
    value: index + 1,
  }));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

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
    if (![ALL_CATEGORIES_LABEL, ...availableCategoryValues].includes(selectedCategory)) {
      setSelectedCategory(ALL_CATEGORIES_LABEL);
    }
  }, [availableCategoryValues, selectedCategory]);

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

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.replace("/");
    });
  };
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const isInitialPaymentsLoad = isPaymentsLoading && !hasResolvedPayments;

  useEffect(() => {
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
    const businessFilter = selectedBusiness === ALL_BUSINESSES_LABEL ? undefined : selectedBusiness;
    let cancelled = false;

    const loadPayments = async () => {
      setIsPaymentsLoading(true);
      setPaymentsError(null);

      try {
        const [paymentsPage, summary, groupedCategories, groupedBusinesses] = await Promise.all([
          paymentsService.listPayments({
            business: businessFilter,
            category: categoryFilter,
            direction: sortDirection,
            endDate,
            page: currentPage - 1,
            size: rowsPerPage,
            sort: sortField,
            startDate,
          }),
          paymentsService.getSummary({ endDate, startDate }),
          paymentsService.getGroupByCategory({ endDate, startDate }),
          paymentsService.getGroupByBusiness({ endDate, startDate }),
        ]);

        if (cancelled) {
          return;
        }

        setPayments(paymentsPage.items.map(mapPaymentToEntry));
        setTotalItems(paymentsPage.totalItems);
        setTotalPages(Math.max(1, paymentsPage.totalPages));
        setAvailableCategoryValues(groupedCategories.map((group) => group.categoryName));
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
    isAuthenticated,
    isLoading,
    period,
    reloadKey,
    rowsPerPage,
    selectedBusiness,
    selectedCategory,
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
    setCurrentPage(1);
  };

  const handleBusinessChange = (value: string) => {
    setSelectedBusiness(value);
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
    setImportFeedback(null);
    fileInputRef.current?.click();
  };

  const handleExcelFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setIsImportingExcel(true);
    setImportFeedback(null);

    try {
      const importedPayments = await bankService.extractPayments(selectedFile);

      setCurrentPage(1);
      setSelectedCategory(ALL_CATEGORIES_LABEL);
      setSelectedBusiness(ALL_BUSINESSES_LABEL);
      setReloadKey((value) => value + 1);
      setImportFeedback(`Importación completada: ${importedPayments.length} pagos guardados.`);
    } catch (error) {
      setImportFeedback(normalizeImportMessage(error));
    } finally {
      event.target.value = "";
      setIsImportingExcel(false);
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
        <aside className="flex w-full shrink-0 flex-col gap-5 bg-[linear-gradient(180deg,var(--payments-drawer-start)_0%,var(--payments-drawer-end)_100%)] px-6 py-7 text-[var(--white)] xl:fixed xl:inset-y-0 xl:left-0 xl:z-30 xl:h-screen xl:w-[284px] xl:overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,var(--payments-brand-start)_0%,var(--payments-brand-end)_100%)] text-[20px] font-bold text-[var(--white)]">
              L
            </div>
            <div>
              <p className="text-[18px] font-bold">Lizy finance</p>
              <p className="text-[12px] font-medium text-[var(--payments-drawer-muted)]">Workspace overview</p>
            </div>
          </div>
          <div className="space-y-5">
            {sidebarSections.map((section) => (
              <div className="space-y-2" key={section.title}>
                <SectionTitle>{section.title}</SectionTitle>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <SidebarNavItem
                      active={"active" in item ? item.active : false}
                      href={"href" in item ? item.href : undefined}
                      key={item.label}
                      label={item.label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto rounded-[20px] border border-[var(--white-alpha-10)] bg-[var(--white-alpha-08)] p-4">
            <p className="text-[13px] font-bold text-[var(--white)]">Version 0.0.1</p>
            <p className="mt-2 text-[12px] leading-5 text-[var(--payments-drawer-muted)]">
              Tenga en cuenta que esta app esta en desarrollo. Es probable que encuentre fallos, si esto sucede no dude en ponerse en contacto con nosotros enviando un email: info@visco.uno
            </p>
          </div>
          <Button
            className="h-11 rounded-[14px] bg-[var(--white-alpha-10)] text-[var(--white)] hover:bg-[var(--white-alpha-14)]"
            disabled={isPending}
            onClick={handleLogout}
            type="button"
          >
            Cerrar sesión
          </Button>
        </aside>
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
                <Button className="h-9 rounded-[8px] bg-[var(--bg-white)] px-3 text-[13px] font-semibold text-[var(--text-primary)] shadow-none ring-1 ring-[var(--border-color)] hover:bg-[var(--accent-blue-light)]">
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
            {importFeedback ? (
              <p
                className={cn(
                  "text-[13px] font-medium",
                  importFeedback.startsWith("Importación")
                    ? "text-[var(--success-green)]"
                    : "text-[var(--danger-red)]",
                )}
              >
                {importFeedback}
              </p>
            ) : null}
            {paymentsError ? <p className="text-[13px] font-medium text-[var(--danger-red)]">{paymentsError}</p> : null}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-[var(--text-secondary)]">Periodo:</span>
                  <div className="inline-flex h-[38px] rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-white)] p-1">
                    {(["Mensual", "Anual", "Personalizado"] as const).map((value) => (
                      <button
                        className={cn(
                          "rounded-[8px] px-3 text-[13px] font-semibold transition-colors",
                          period === value
                            ? "bg-[var(--accent-blue-light)] text-[var(--accent-blue)]"
                            : "text-[var(--text-secondary)]",
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
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]">
                    <Tag className="h-4 w-4 text-[var(--text-secondary)]" />
                    <span>Filtros:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
                    <SelectField
                      icon={Tag}
                      label="Categoría"
                      onChange={handleCategoryChange}
                      options={categorySelectOptions}
                      value={selectedCategory}
                    />
                    <SelectField
                      icon={Building2}
                      label="Negocio"
                      onChange={handleBusinessChange}
                      options={businessSelectOptions}
                      value={selectedBusiness}
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
                <table className="w-full min-w-[980px] border-separate border-spacing-0">
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
                      <th className="w-[180px] px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <SortableHeader
                          active={sortField === "category"}
                          direction={sortDirection}
                          icon={Tag}
                          label="Categoría"
                          onClick={() => handleSortChange("category")}
                        />
                      </th>
                      <th className="w-[150px] px-5 py-4 text-right text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <SortableHeader
                          active={sortField === "amount"}
                          align="right"
                          direction={sortDirection}
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
                          colSpan={4}
                        >
                          Cargando pagos...
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td
                          className="border-t border-[var(--border-color)] px-5 py-10 text-center text-[13px] font-medium text-[var(--text-secondary)]"
                          colSpan={4}
                        >
                          No hay pagos para el rango seleccionado.
                        </td>
                      </tr>
                    ) : (
                      payments.map((entry) => (
                      <tr key={entry.id}>
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
                          <PaymentCategoryBadge label={entry.category} tone={entry.categoryTone} />
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
                  payments.map((entry) => (
                    <MobilePaymentCard
                      amount={entry.amount}
                      business={entry.business}
                      category={entry.category}
                      categoryTone={entry.categoryTone}
                      description={entry.description}
                      direction={entry.direction}
                      displayDate={entry.displayDate}
                      key={entry.id}
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
              <SummaryCard icon={Repeat2} iconClassName="text-[var(--cat-services)]" title="Gastos fijos">
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
    </main>
  );
}
