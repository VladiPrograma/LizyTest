"use client";

import { type ReactNode } from "react";
import { Mail, type LucideIcon } from "lucide-react";
import { AppDrawer } from "@/components/layout/app-drawer";
import { cn } from "@/lib/utils";

type DrawerMode = "view" | "edit";

type DashboardDrawerModeSwitch = {
  activeMode: DrawerMode;
  onModeChange?: (mode: DrawerMode) => void;
};

type DashboardDrawerUserProfile = {
  email?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePhotoUrl?: string | null;
};

export type DashboardDrawerUserInput = {
  authDisplayName?: string | null;
  authEmail?: string | null;
  authPhotoUrl?: string | null;
  inferNameFromEmail?: boolean;
  profile?: DashboardDrawerUserProfile | null;
};

type DashboardPageShellProps = {
  activeLabel: string;
  avatarBadge?: string;
  children: ReactNode;
  contentClassName?: string;
  decorations?: ReactNode;
  footerDescription: string;
  footerTitle: string;
  innerClassName?: string;
  itemActions?: Partial<Record<string, () => void>>;
  mainClassName?: string;
  modeSwitch?: DashboardDrawerModeSwitch;
  primaryActionDisabled?: boolean;
  primaryActionIcon?: LucideIcon;
  primaryActionLabel?: string;
  primaryActionOnClick: () => void;
  user: DashboardDrawerUserInput;
};

function inferDisplayNameFromEmail(email: string | null | undefined) {
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

export function resolveDashboardDrawerUser({
  authDisplayName,
  authEmail,
  authPhotoUrl,
  inferNameFromEmail = true,
  profile,
}: DashboardDrawerUserInput) {
  const profileName = [profile?.name?.trim(), profile?.lastName?.trim()].filter(Boolean).join(" ");
  const inferredName = inferNameFromEmail ? inferDisplayNameFromEmail(profile?.email || authEmail) : null;
  const displayName =
    profileName ||
    (authDisplayName?.trim() && !authDisplayName.includes("@") ? authDisplayName.trim() : "") ||
    inferredName ||
    authDisplayName?.trim() ||
    authEmail?.trim() ||
    "Usuario";

  return {
    initial: getDashboardUserInitials(displayName).charAt(0),
    name: displayName,
    photoUrl: profile?.profilePhotoUrl || authPhotoUrl || null,
    subtitle: profile?.email || authEmail || "Cuenta activa",
  };
}

export function getDashboardUserInitials(name: string) {
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

export function DashboardPageShell({
  activeLabel,
  avatarBadge = "L",
  children,
  contentClassName,
  decorations,
  footerDescription,
  footerTitle,
  innerClassName,
  itemActions,
  mainClassName,
  modeSwitch,
  primaryActionDisabled = false,
  primaryActionIcon = Mail,
  primaryActionLabel = "CONTACTA",
  primaryActionOnClick,
  user,
}: DashboardPageShellProps) {
  const drawerUser = resolveDashboardDrawerUser(user);

  return (
    <main className={cn("min-h-screen bg-[var(--bg-page)]", mainClassName)}>
      {decorations}
      <div className={cn("relative flex min-h-screen w-full flex-col bg-[var(--bg-page)] xl:flex-row", innerClassName)}>
        <AppDrawer
          activeLabel={activeLabel}
          avatarBadge={avatarBadge}
          footerDescription={footerDescription}
          footerTitle={footerTitle}
          itemActions={itemActions}
          modeSwitch={modeSwitch}
          primaryActionDisabled={primaryActionDisabled}
          primaryActionIcon={primaryActionIcon}
          primaryActionLabel={primaryActionLabel}
          primaryActionOnClick={primaryActionOnClick}
          userInitial={drawerUser.initial}
          userName={drawerUser.name}
          userPhotoUrl={drawerUser.photoUrl}
          userSubtitle={drawerUser.subtitle}
        />
        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col bg-[var(--bg-page)] p-5 sm:p-6 lg:p-10 xl:ml-[284px] xl:min-h-screen",
            contentClassName,
          )}
        >
          {children}
        </section>
      </div>
    </main>
  );
}
