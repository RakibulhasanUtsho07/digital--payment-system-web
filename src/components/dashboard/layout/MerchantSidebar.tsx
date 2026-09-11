"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  CreditCard,
  FileBarChart,
  FileText,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Receipt,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Store,
  Users,
  WalletCards,
  Webhook,
  X,
  Zap,
} from "lucide-react";

interface MerchantSidebarProps {
  onLogout: () => void | Promise<void>;
  onClose?: () => void;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const mainItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard/merchant",
    icon: LayoutDashboard,
  },
  {
    label: "Payments",
    href: "/dashboard/merchant/payments",
    icon: CreditCard,
  },
  {
    label: "Transactions",
    href: "/dashboard/merchant/transactions",
    icon: Activity,
  },
  {
    label: "Orders",
    href: "/dashboard/merchant/orders",
    icon: BriefcaseBusiness,
  },
  {
    label: "Customers",
    href: "/dashboard/merchant/customers",
    icon: Users,
  },
];

const financeItems: NavItem[] = [
  {
    label: "Refunds",
    href: "/dashboard/merchant/refunds",
    icon: RefreshCcw,
  },
  {
    label: "Invoices",
    href: "/dashboard/merchant/invoices",
    icon: FileText,
  },
  {
    label: "Subscriptions",
    href: "/dashboard/merchant/subscriptions",
    icon: Receipt,
  },
  {
    label: "Payouts",
    href: "/dashboard/merchant/payouts",
    icon: HandCoins,
  },
  {
    label: "Settlement",
    href: "/dashboard/merchant/settlement",
    icon: WalletCards,
  },
  {
    label: "Disputes",
    href: "/dashboard/merchant/disputes",
    icon: ShieldCheck,
  },
];

const analyticsItems: NavItem[] = [
  {
    label: "Analytics",
    href: "/dashboard/merchant/analytics",
    icon: BarChart3,
  },
  {
    label: "Reports",
    href: "/dashboard/merchant/reports",
    icon: FileBarChart,
  },
];

const developerItems: NavItem[] = [
  {
    label: "API Keys",
    href: "/dashboard/merchant/api-keys",
    icon: Code2,
  },
  {
    label: "Webhooks",
    href: "/dashboard/merchant/webhooks",
    icon: Webhook,
  },
  {
    label: "Developers",
    href: "/dashboard/merchant/developers",
    icon: BookOpen,
  },
];

const settingsItems: NavItem[] = [
  {
    label: "Settings",
    href: "/dashboard/merchant/settings",
    icon: Settings,
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard/merchant") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 rounded-xl px-3 py-2.5
                text-sm font-semibold transition-all duration-200
                ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <Icon
                className={`
                  h-[18px] w-[18px] shrink-0 transition-transform duration-200
                  group-hover:scale-105
                  ${active ? "text-primary-foreground" : ""}
                `}
              />

              <span className="truncate">
                {item.label}
              </span>

              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function MerchantSidebar({
  onLogout,
  onClose,
}: MerchantSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className="
        flex h-full min-h-dvh w-full flex-col
        border-r border-border
        bg-card
      "
    >
      {/* Header */}
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-border px-5">
        <Link
          href="/dashboard/merchant"
          onClick={onClose}
          className="flex items-center gap-3"
        >
          <div
            className="
              flex h-10 w-10 items-center justify-center
              rounded-2xl text-white shadow-sm
            "
            style={{
              background: "var(--dashboard-primary)",
            }}
          >
            <Store className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-card-foreground">
              DAMO
            </p>

            <p className="truncate text-[11px] font-medium text-muted-foreground">
              Merchant Portal
            </p>
          </div>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="
              rounded-lg p-2 text-muted-foreground
              transition hover:bg-muted hover:text-foreground
              lg:hidden
            "
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Merchant badge */}
      <div className="px-4 pt-4">
        <div
          className="
            rounded-2xl border border-border
            bg-background/70 p-3
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-9 w-9 items-center justify-center
                rounded-xl bg-primary/10 text-primary
              "
            >
              <BriefcaseBusiness className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">
                Business Account
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Merchant Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5">
        <NavSection
          title="Business"
          items={mainItems}
          pathname={pathname}
        />

        <NavSection
          title="Finance"
          items={financeItems}
          pathname={pathname}
        />

        <NavSection
          title="Insights"
          items={analyticsItems}
          pathname={pathname}
        />

        <NavSection
          title="Developer"
          items={developerItems}
          pathname={pathname}
        />

        <NavSection
          title="Configuration"
          items={settingsItems}
          pathname={pathname}
        />
      </div>

      {/* Bottom quick action */}
      <div className="border-t border-border p-4">
        <Link
          href="/dashboard/merchant/payments"
          className="
            mb-3 flex items-center gap-3 rounded-xl
            border border-border bg-background px-3 py-3
            text-sm font-bold text-foreground
            transition hover:bg-muted
          "
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Zap className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">
              Manage Payments
            </p>
            <p className="truncate text-[10px] font-medium text-muted-foreground">
              View your latest payment activity
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="
            flex w-full items-center gap-3 rounded-xl px-3 py-2.5
            text-sm font-semibold text-muted-foreground
            transition hover:bg-red-50 hover:text-red-600
            dark:hover:bg-red-950/20
          "
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}