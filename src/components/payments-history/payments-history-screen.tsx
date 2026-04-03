"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUpDown,
  BadgeEuro,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronDown,
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
import {
  fixedExpenses,
  monthOptions,
  mortgageSummary,
  paymentEntries,
  rowsPerPageOptions,
  sidebarSections,
  type PaymentCategoryTone,
  variableExpenses,
  yearOptions,
} from "@/components/payments-history/payments-history-data";
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

const businessOptions = ["Todos los negocios", ...new Set(paymentEntries.map((entry) => entry.business))];
const categoryOptions = ["Todas las categorías", ...new Set(paymentEntries.map((entry) => entry.category))];

function formatEuroAmount(amount: number) {
  return `${euroFormatter.format(amount)} EUR`;
}

function formatSignedAmount(amount: number, direction: "incoming" | "outgoing") {
  const prefix = direction === "incoming" ? "+" : "";
  return `${prefix}${formatEuroAmount(amount)}`;
}

function SelectShell({
  icon: Icon,
  label,
  value,
  onChange,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex h-9 items-center gap-2 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-white)] px-3 text-[13px] text-[var(--text-primary)] shadow-[0_1px_0_rgba(255,255,255,0.7)]",
        className,
      )}
    >
      <Icon className="h-[14px] w-[14px] text-[var(--accent-blue)]" />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-full w-full appearance-none bg-transparent pr-5 text-[13px] font-medium outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-muted)]" />
    </label>
  );
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
      ? "border border-white/[0.15] bg-white/[0.1] text-white"
      : "text-[var(--payments-drawer-muted)] hover:bg-white/[0.06] hover:text-white",
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
    <article className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-white)] p-4 shadow-[0_18px_30px_rgba(15,23,42,0.03)]">
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
        {statusLabel ? (
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[var(--cat-restaurant-bg)] px-2 text-[11px] font-semibold text-[var(--cat-restaurant)]">
            <CircleAlert className="h-3 w-3" />
            {statusLabel}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function PaymentsHistoryScreen() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState<"Mensual" | "Anual">("Mensual");
  const [selectedMonth, setSelectedMonth] = useState<(typeof monthOptions)[number]>("Abril");
  const [selectedYear, setSelectedYear] = useState<(typeof yearOptions)[number]>("2026");
  const [selectedCategory, setSelectedCategory] = useState("Todas las categorías");
  const [selectedBusiness, setSelectedBusiness] = useState("Todos los negocios");
  const [rowsPerPage, setRowsPerPage] = useState<(typeof rowsPerPageOptions)[number]>(6);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.replace("/");
    });
  };

  const filteredPayments = paymentEntries.filter((entry) => {
    const matchesPeriod =
      period === "Anual"
        ? entry.periodYear === selectedYear
        : entry.periodYear === selectedYear && entry.periodMonth === selectedMonth;
    const matchesCategory = selectedCategory === "Todas las categorías" || entry.category === selectedCategory;
    const matchesBusiness = selectedBusiness === "Todos los negocios" || entry.business === selectedBusiness;

    return matchesPeriod && matchesCategory && matchesBusiness;
  });

  const totalIncoming = filteredPayments.reduce(
    (sum, entry) => sum + (entry.direction === "incoming" ? entry.amount : 0),
    0,
  );
  const totalOutgoing = filteredPayments.reduce(
    (sum, entry) => sum + (entry.direction === "outgoing" ? entry.amount : 0),
    0,
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const paginatedPayments = filteredPayments.slice(pageStart, pageStart + rowsPerPage);

  const handlePeriodChange = (nextPeriod: "Mensual" | "Anual") => {
    setPeriod(nextPeriod);
    setCurrentPage(1);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value as (typeof monthOptions)[number]);
    setCurrentPage(1);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value as (typeof yearOptions)[number]);
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

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value) as (typeof rowsPerPageOptions)[number]);
    setCurrentPage(1);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--payments-page-background)] px-6 text-[var(--payments-shell-ink)]">
        <div className="rounded-[24px] border border-white/[0.7] bg-white/[0.85] px-6 py-5 text-[16px] font-semibold shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          Cargando historial de pagos...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,var(--payments-page-background)_0%,var(--payments-page-warm)_100%)] text-[var(--payments-shell-ink)]">
      <div className="pointer-events-none absolute right-8 top-14 hidden h-[220px] w-[220px] rounded-full bg-[var(--payments-accent-glow)] blur-3xl lg:block" />
      <div className="pointer-events-none absolute bottom-8 right-16 hidden h-[300px] w-[300px] rounded-full bg-[var(--payments-amber-glow)] blur-3xl lg:block" />
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[var(--bg-page)] xl:flex-row">
        <aside className="flex shrink-0 flex-col gap-5 bg-[linear-gradient(180deg,var(--payments-drawer-start)_0%,var(--payments-drawer-end)_100%)] px-6 py-7 text-white xl:w-[284px]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,var(--payments-brand-start)_0%,var(--payments-brand-end)_100%)] text-[20px] font-bold text-white">
              L
            </div>
            <div>
              <p className="text-[18px] font-bold">Lizy finance</p>
              <p className="text-[12px] font-medium text-[var(--payments-drawer-muted)]">Workspace overview</p>
            </div>
          </div>
          <div className="rounded-[16px] border border-white/[0.1] bg-white/[0.08] p-1.5">
            <p className="mb-2 px-2 text-[12px] font-semibold text-[var(--payments-drawer-label)]">Periodo activo</p>
            <div className="grid grid-cols-2 gap-2">
              {(["Mensual", "Anual"] as const).map((value) => (
                <button
                  className={cn(
                    "h-10 rounded-[12px] text-[13px] font-semibold transition-colors",
                    period === value ? "bg-white text-[var(--payments-shell-ink)]" : "text-[var(--payments-drawer-muted)] hover:bg-white/[0.08]",
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
          <div className="mt-auto rounded-[20px] border border-white/[0.1] bg-white/[0.08] p-4">
            <p className="text-[13px] font-bold text-white">Vista integrada</p>
            <p className="mt-2 text-[12px] leading-5 text-[var(--payments-drawer-muted)]">
              La tabla vive dentro del shell principal con drawer persistente y fondo ambiental estable para desktop.
            </p>
          </div>
          <Button
            className="h-11 rounded-[14px] bg-white/[0.1] text-white hover:bg-white/[0.14]"
            disabled={isPending}
            onClick={handleLogout}
            type="button"
          >
            Cerrar sesión
          </Button>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col bg-[var(--bg-page)] p-5 sm:p-6 lg:p-10">
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
                <Button className="h-9 rounded-[8px] bg-[var(--bg-white)] px-3 text-[13px] font-semibold text-[var(--text-primary)] shadow-none ring-1 ring-[var(--border-color)] hover:bg-[var(--accent-blue-light)]">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
                <Button className="h-9 rounded-[8px] bg-[var(--bg-white)] px-3 text-[13px] font-semibold text-[var(--text-secondary)] shadow-none ring-1 ring-[var(--border-color)] hover:bg-[var(--accent-blue-light)]">
                  <Download className="h-4 w-4" />
                  JSON
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-[var(--text-secondary)]">Periodo:</span>
                  <div className="inline-flex h-[38px] rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-white)] p-1">
                    {(["Mensual", "Anual"] as const).map((value) => (
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {period === "Mensual" ? (
                    <SelectShell icon={CalendarRange} label="Mes" onChange={handleMonthChange} value={selectedMonth}>
                      {monthOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectShell>
                  ) : null}
                  <SelectShell icon={CalendarDays} label="Año" onChange={handleYearChange} value={selectedYear}>
                    {yearOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectShell>
                </div>
              </div>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]">
                    <Tag className="h-4 w-4 text-[var(--text-secondary)]" />
                    <span>Filtros:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <SelectShell icon={Tag} label="Categoría" onChange={handleCategoryChange} value={selectedCategory}>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectShell>
                    <SelectShell icon={Building2} label="Negocio" onChange={handleBusinessChange} value={selectedBusiness}>
                      {businessOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </SelectShell>
                    <SelectShell
                      className="min-w-[170px]"
                      icon={BadgeEuro}
                      label="Importe"
                      onChange={handleRowsPerPageChange}
                      value={rowsPerPage}
                    >
                      {rowsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                          {option} por página
                        </option>
                      ))}
                    </SelectShell>
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
            <div className="overflow-hidden rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-white)]">
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] border-separate border-spacing-0">
                  <thead className="bg-[var(--bg-light)] text-left">
                    <tr>
                      <th className="w-[140px] px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--accent-blue)]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-[13px] w-[13px]" />
                          Fecha
                          <ArrowDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-[13px] w-[13px]" />
                          Negocio
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="w-[180px] px-5 py-4 text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Tag className="h-[13px] w-[13px]" />
                          Categoría
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="w-[150px] px-5 py-4 text-right text-[12px] font-semibold tracking-[0.04em] text-[var(--text-secondary)]">
                        <div className="flex items-center justify-end gap-2">
                          Importe
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((entry) => (
                      <tr key={entry.id}>
                        <td className="border-t border-[var(--border-color)] px-5 py-4 align-middle text-[13px] text-[var(--text-primary)]">
                          {entry.displayDate}
                        </td>
                        <td className="border-t border-[var(--border-color)] px-5 py-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <span className="text-[13px] font-medium text-[var(--text-primary)]">{entry.business}</span>
                            <span className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                              <FileText className="h-3 w-3 text-[var(--text-muted)]" />
                              {entry.description}
                            </span>
                            {entry.statusLabel ? (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--cat-restaurant-bg)] px-2 py-1 text-[11px] font-semibold text-[var(--cat-restaurant)]">
                                <CircleAlert className="h-3 w-3" />
                                {entry.statusLabel}
                              </span>
                            ) : null}
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
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 p-3 lg:hidden">
                {paginatedPayments.map((entry) => (
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
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--border-color)] px-4 py-4 text-[12px] font-medium text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span>
                  Mostrando {filteredPayments.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + rowsPerPage, filteredPayments.length)} de{" "}
                  {filteredPayments.length} pagos
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-white)] px-3 py-2 text-[12px] font-medium text-[var(--text-primary)]">
                    Página {safePage} de {totalPages}
                  </span>
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
                    className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--accent-blue)] bg-[var(--accent-blue-light)] text-[var(--accent-blue)] disabled:opacity-40"
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
                      <p className="text-[22px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
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
                  className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--payments-soft-blue-border)] bg-white px-4 text-[13px] font-bold text-[var(--accent-blue)]"
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
