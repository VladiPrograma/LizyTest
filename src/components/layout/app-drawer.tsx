"use client";

import Link from "next/link";
import {
  Activity,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Mail,
  ReceiptText,
  Shapes,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { sidebarSections } from "@/components/payments-history/payments-history-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DrawerActionMap = Partial<Record<string, () => void>>;

type AppDrawerProps = {
  userName: string;
  userSubtitle: string;
  userPhotoUrl?: string | null;
  userInitial: string;
  avatarBadge?: string;
  activeLabel?: string;
  itemActions?: DrawerActionMap;
  footerTitle: string;
  footerDescription: string;
  primaryActionLabel: string;
  primaryActionIcon?: LucideIcon;
  primaryActionOnClick: () => void;
  primaryActionDisabled?: boolean;
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
  "Cerrar sesión": LogOut,
};

function SidebarNavItem({
  label,
  href,
  onClick,
  active = false,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
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

  if (onClick) {
    return (
      <button className={cn(itemClassName, "w-full")} onClick={onClick} type="button">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={itemClassName}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-semibold tracking-[0.02em] text-[var(--payments-drawer-label)]">{children}</p>;
}

export function AppDrawer({
  userName,
  userSubtitle,
  userPhotoUrl,
  userInitial,
  avatarBadge = "L",
  activeLabel,
  itemActions,
  footerTitle,
  footerDescription,
  primaryActionLabel,
  primaryActionIcon: PrimaryActionIcon = Mail,
  primaryActionOnClick,
  primaryActionDisabled = false,
}: AppDrawerProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 bg-[linear-gradient(180deg,var(--payments-drawer-start)_0%,var(--payments-drawer-end)_100%)] px-6 py-7 text-[var(--white)] xl:fixed xl:inset-y-0 xl:left-0 xl:z-30 xl:h-screen xl:w-[284px]">
      <div className="flex items-center gap-3">
        {userPhotoUrl ? (
          <div
            aria-hidden="true"
            className="h-11 w-11 shrink-0 rounded-[14px] bg-[var(--white-alpha-10)] bg-cover bg-center ring-1 ring-[var(--white-alpha-12)]"
            style={{ backgroundImage: `url(${userPhotoUrl})` }}
          />
        ) : (
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--white-alpha-12)] bg-[var(--white-alpha-10)] text-[17px] font-bold text-[var(--white)] shadow-[0_14px_28px_var(--navy-alpha-18)]">
            <span>{userInitial}</span>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,var(--payments-brand-start)_0%,var(--payments-brand-end)_100%)] text-[10px] font-black text-[var(--white)] ring-2 ring-[var(--payments-drawer-end)]">
              {avatarBadge}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold text-[var(--white)]">{userName}</p>
          <p className="mt-0.5 truncate text-[12px] font-medium text-[var(--payments-drawer-muted)]">{userSubtitle}</p>
        </div>
      </div>
      <div className="space-y-5">
        {sidebarSections.map((section) => (
          <div className="space-y-2" key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <SidebarNavItem
                  active={item.label === activeLabel || (!activeLabel && "active" in item && item.active)}
                  href={"href" in item ? item.href : undefined}
                  key={item.label}
                  label={item.label}
                  onClick={itemActions?.[item.label]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-[20px] border border-[var(--white-alpha-10)] bg-[var(--white-alpha-08)] p-4">
        <p className="text-[13px] font-bold text-[var(--white)]">{footerTitle}</p>
        <p className="mt-2 text-[12px] leading-5 text-[var(--payments-drawer-muted)]">{footerDescription}</p>
      </div>
      <Button
        className="h-11 rounded-[14px] bg-[var(--white-alpha-10)] text-[var(--white)] hover:bg-[var(--white-alpha-14)]"
        disabled={primaryActionDisabled}
        onClick={primaryActionOnClick}
        type="button"
      >
        <PrimaryActionIcon className="h-4 w-4" />
        {primaryActionLabel}
      </Button>
    </aside>
  );
}
