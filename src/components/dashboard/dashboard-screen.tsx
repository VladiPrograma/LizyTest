"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BellDot,
  Boxes,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  Mail,
  Megaphone,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Products", icon: ShoppingBag },
  { label: "Transactions", icon: CreditCard },
  { label: "Reports & Analytics", icon: ChartNoAxesCombined },
  { label: "Messages", icon: MessageSquare },
  { label: "Team Performance", icon: Users },
  { label: "Campaigns", icon: Megaphone },
];

const customerNavigation = [
  { label: "Customer List", icon: Users },
  { label: "Channels", icon: Mail },
  { label: "Order Management", icon: ListOrdered },
];

const managementNavigation = [
  { label: "Roles & Permissions", icon: ShieldCheck },
  { label: "Billing & Subscription", icon: CircleDollarSign },
  { label: "Integrations", icon: Boxes },
];

const statCards = [
  {
    label: "TOTAL REVENUE",
    value: "$20,320",
    detail: "",
    trend: "+0.94",
    trendLabel: "last year",
  },
  {
    label: "TOTAL ORDERS",
    value: "10,320",
    detail: "Orders",
    trend: "+0.94",
    trendLabel: "last year",
  },
  {
    label: "NEW CUSTOMERS",
    value: "4,305",
    detail: "New Users",
    trend: "+0.94",
    trendLabel: "last year",
  },
];

const chartBars = [5, 12, 18, 14, 9, 16, 22, 11, 7, 19, 24, 13];
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function SidebarSection({
  title,
  items,
  collapsed,
}: {
  title: string;
  items: { label: string; icon: React.ComponentType<{ className?: string }>; active?: boolean }[];
  collapsed: boolean;
}) {
  return (
    <div className="border-t border-[#ece7de] pt-5">
      <p className={cn("mb-4 text-[13px] font-semibold text-[#5f594f]", collapsed && "sr-only")}>{title}</p>
      <div className="space-y-1.5">
        {items.map(({ label, icon: Icon, active }) => (
          <div
            className={cn(
              "flex h-10 items-center rounded-xl text-[14px] font-medium transition-colors",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
              active ? "bg-white text-[#22201b] shadow-[0_10px_24px_rgba(0,0,0,0.05)]" : "text-[#7e776d]",
            )}
            key={label}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{label}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityGlyph() {
  return (
    <div className="flex h-12 items-end gap-1.5">
      {[16, 30, 20, 38, 26, 44].map((height, index) => (
        <span
          className={cn("w-[3px] rounded-full", index === 3 ? "bg-[#121212]" : "bg-[#d2cec6]")}
          key={height}
          style={{ height }}
        />
      ))}
    </div>
  );
}

export function DashboardScreen() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#e7e3db] text-[#3d372f]">
        <p className="text-lg font-medium">Loading dashboard...</p>
      </main>
    );
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Salung";

  return (
    <main className="flex min-h-screen min-w-[1280px] bg-[#e7e3db] text-[#221f1b]">
      <aside
        className={cn(
          "flex min-h-screen shrink-0 flex-col border-r border-[#e5ded2] bg-[#f3efe8] px-4 py-5 transition-[width] duration-300 ease-out",
          isSidebarCollapsed ? "w-[96px]" : "w-[292px]",
        )}
      >
        <div className={cn("mb-6 flex items-center", isSidebarCollapsed ? "justify-center" : "justify-between gap-3")}>
          <div
            className={cn(
              "rounded-[20px] border border-[#e4ded5] bg-[#f7f4ee] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300",
              isSidebarCollapsed ? "flex h-16 w-16 items-center justify-center p-0" : "flex-1 p-4",
            )}
          >
            <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center" : "gap-3")}>
              <Image alt="Lizy logo" className="h-12 w-12 rounded-2xl object-contain" height={48} src="/logo.png" width={48} />
              {!isSidebarCollapsed ? (
                <div>
                  <p className="text-[13px] text-[#8f887d]">Agency</p>
                  <p className="text-[18px] font-semibold leading-tight text-[#27231d]">Spark Pixel Team</p>
                </div>
              ) : null}
            </div>
          </div>

          <button
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#e4ded5] bg-[#f7f4ee] text-[#6e675d] shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            type="button"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="space-y-5">
          <SidebarSection collapsed={isSidebarCollapsed} items={primaryNavigation} title="Main Menu" />
          <SidebarSection collapsed={isSidebarCollapsed} items={customerNavigation} title="Customers" />
          <SidebarSection collapsed={isSidebarCollapsed} items={managementNavigation} title="Management" />
          <SidebarSection collapsed={isSidebarCollapsed} items={[{ label: "Settings", icon: Settings }]} title="Settings" />
        </div>

        <Button
          className={cn(
            "mt-auto h-11 rounded-2xl bg-[#23211d] text-white hover:bg-[#171512]",
            isSidebarCollapsed && "px-0 text-[18px]",
          )}
          disabled={isPending}
          onClick={handleLogout}
          title={isSidebarCollapsed ? "Sign out" : undefined}
          type="button"
        >
          {isSidebarCollapsed ? "↩" : "Sign out"}
        </Button>
      </aside>

      <section className="flex min-h-screen flex-1 flex-col bg-[#fbf9f5]">
        <header className="flex items-center justify-between border-b border-[#efe9df] px-8 py-5">
          <div className="flex items-center gap-2 text-[15px] text-[#9a9388]">
            <span>Dashboard</span>
            <span>›</span>
            <span className="font-semibold text-[#5c564d]">Overview</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex h-11 w-[220px] items-center gap-3 rounded-2xl border border-[#eee8df] bg-white px-4 text-[#9e978c] shadow-[0_10px_25px_rgba(0,0,0,0.03)]">
              <Search className="h-4 w-4" />
              <input
                className="w-full bg-transparent text-[14px] text-[#3d372f] outline-none placeholder:text-[#b4ada1]"
                placeholder="Search..."
                type="text"
              />
            </label>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eee8df] bg-white text-[#7f786e] shadow-[0_10px_25px_rgba(0,0,0,0.03)]"
              type="button"
            >
              <BellDot className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 px-8 py-7">
          <h1 className="text-[42px] font-semibold tracking-[-0.04em] text-[#211d18]">
            Welcome back, {displayName}
          </h1>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {statCards.map((card) => (
              <div
                className="rounded-[24px] border border-[#ece6dc] bg-white p-5 shadow-[0_18px_30px_rgba(0,0,0,0.035)]"
                key={card.label}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold tracking-[0.18em] text-[#9c9589]">{card.label}</p>
                    <div className="mt-3 flex items-end gap-2">
                      <p className="text-[38px] font-semibold tracking-[-0.04em] text-[#231f1a]">{card.value}</p>
                      {card.detail ? <span className="pb-1 text-[14px] text-[#8f887d]">{card.detail}</span> : null}
                    </div>
                  </div>
                  <ActivityGlyph />
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#f1ece3] pt-3">
                  <span className="h-5 w-5 rounded-full bg-[#f4f0e8] text-center text-[12px] leading-5 text-[#aea69a]">i</span>
                  <p className="text-[14px] font-medium text-[#9a9388]">
                    <span className="font-semibold text-[#4da58e]">{card.trend}</span> {card.trendLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[28px] border border-[#ece5db] bg-[#f6f2eb] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
            <div className="rounded-[24px] border border-[#ece5db] bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold tracking-[0.18em] text-[#8f887d]">SALES TREND</p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-[15px] text-[#8d867b]">Total Revenue :</span>
                    <span className="text-[42px] font-semibold tracking-[-0.04em] text-[#1f1b17]">$20,320</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-5 text-[13px] font-medium text-[#8f887d]">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d8d3cb]" />
                      NEW USER
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#1c1b1a]" />
                      EXISTING USER
                    </span>
                  </div>
                  <div className="flex rounded-full border border-[#ebe4da] bg-[#f8f5ef] p-1 text-[14px] font-medium text-[#847d72]">
                    <span className="rounded-full px-4 py-1.5">Weekly</span>
                    <span className="rounded-full bg-white px-4 py-1.5 text-[#26221d] shadow-[0_8px_16px_rgba(0,0,0,0.06)]">Monthly</span>
                    <span className="rounded-full px-4 py-1.5">Yearly</span>
                  </div>
                </div>
              </div>

              <div className="relative mt-8 rounded-[24px] bg-[#fbf9f5] p-6">
                <div className="grid grid-cols-[56px_1fr] gap-4">
                  <div className="flex flex-col justify-between py-2 text-[13px] font-medium text-[#9d968a]">
                    {["60k", "50k", "40k", "30k", "20k", "10k", "0k"].map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>

                  <div>
                    <div className="grid grid-cols-12 gap-3">
                      {chartBars.map((value, index) => (
                        <div className="flex flex-col items-center" key={months[index]}>
                          <div className="grid h-[320px] w-full grid-cols-3 content-end gap-1 rounded-[18px] bg-[linear-gradient(180deg,#fbf9f5_0%,#f5f1ea_100%)] p-3">
                            {Array.from({ length: 36 }).map((_, cellIndex) => {
                              const isFilled = cellIndex >= 36 - value;
                              const isHighlightMonth = months[index] === "JUN";

                              return (
                                <span
                                  className={cn(
                                    "h-4 rounded-[4px]",
                                    isFilled
                                      ? isHighlightMonth
                                        ? "bg-[#1f1e1d]"
                                        : "bg-[#262422]"
                                      : "bg-[#ede8df]",
                                  )}
                                  key={`${months[index]}-${cellIndex}`}
                                />
                              );
                            })}
                          </div>
                          <span className="mt-4 text-[13px] font-medium tracking-[0.14em] text-[#8d867b]">
                            {months[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute right-[220px] top-[180px] rounded-[20px] border border-[#ebe4da] bg-white px-5 py-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                  <p className="text-[20px] font-semibold text-[#2a2621]">Jun 2025</p>
                  <div className="mt-3 space-y-2 text-[15px] text-[#7f786d]">
                    <p>• New User <span className="font-semibold text-[#23201b]">38k</span></p>
                    <p>• Existing User <span className="font-semibold text-[#23201b]">18k</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
