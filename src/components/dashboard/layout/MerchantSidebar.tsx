"use client";

import React from "react";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  Activity,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Code2,
  CreditCard,
  FileBarChart,
  FlaskConical,
  HandCoins,
  LayoutDashboard,
  LogOut,
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

/* =========================================================
   TYPES
========================================================= */

interface MerchantSidebarProps {
  onLogout:
    () => void | Promise<void>;

  onClose?: () => void;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

/* =========================================================
   BUSINESS NAVIGATION
========================================================= */

const mainItems: NavItem[] = [
  {
    label: "Overview",
    href:
      "/dashboard/merchant",
    icon:
      LayoutDashboard,
  },

  {
    label: "Verification",
    href:
      "/dashboard/merchant/verification",
    icon:
      BadgeCheck,
  },

  {
    label: "Payments",
    href:
      "/dashboard/merchant/payments",
    icon:
      CreditCard,
  },

  {
    label: "Transactions",
    href:
      "/dashboard/merchant/transactions",
    icon:
      Activity,
  },

  {
    label: "Customers",
    href:
      "/dashboard/merchant/customers",
    icon:
      Users,
  },
];

/* =========================================================
   FINANCE NAVIGATION

   REMOVED:
   - Orders
   - Invoices
   - Subscriptions
========================================================= */

const financeItems: NavItem[] = [
  {
    label: "Refunds",
    href:
      "/dashboard/merchant/refunds",
    icon:
      RefreshCcw,
  },

  {
    label: "Payouts",
    href:
      "/dashboard/merchant/payouts",
    icon:
      HandCoins,
  },

  {
    label: "Settlement",
    href:
      "/dashboard/merchant/settlement",
    icon:
      WalletCards,
  },

  {
    label: "Disputes",
    href:
      "/dashboard/merchant/disputes",
    icon:
      ShieldCheck,
  },
];

/* =========================================================
   ANALYTICS NAVIGATION
========================================================= */

const analyticsItems: NavItem[] = [
  {
    label: "Analytics",
    href:
      "/dashboard/merchant/analytics",
    icon:
      BarChart3,
  },

  {
    label: "Reports",
    href:
      "/dashboard/merchant/reports",
    icon:
      FileBarChart,
  },
];

/* =========================================================
   DEVELOPER NAVIGATION
========================================================= */

const developerItems: NavItem[] = [
  {
    label:
      "AI Assistant",

    href:
      "/dashboard/merchant/ai-assistant",

    icon:
      Bot,
  },

  {
    label:
      "API Keys",

    href:
      "/dashboard/merchant/api-keys",

    icon:
      Code2,
  },

  {
    label:
      "Test Payments",

    href:
      "/dashboard/merchant/test-payments",

    icon:
      FlaskConical,
  },

  {
    label:
      "Webhooks",

    href:
      "/dashboard/merchant/webhooks",

    icon:
      Webhook,
  },

  {
    label:
      "Developers",

    href:
      "/dashboard/merchant/developers",

    icon:
      BookOpen,
  },
];

/* =========================================================
   SETTINGS NAVIGATION
========================================================= */

const settingsItems: NavItem[] = [
  {
    label: "Settings",
    href:
      "/dashboard/merchant/settings",
    icon:
      Settings,
  },
];

/* =========================================================
   ACTIVE ROUTE CHECK
========================================================= */

function isItemActive(
  pathname: string,
  href: string
): boolean {
  if (
    href ===
    "/dashboard/merchant"
  ) {
    return (
      pathname ===
      href
    );
  }

  return (
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

/* =========================================================
   NAVIGATION SECTION
========================================================= */

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mb-6">
      <p
        className="
          mb-2
          px-3
          text-[10px]
          font-bold
          uppercase
          tracking-[0.16em]
          text-muted-foreground/70
        "
      >
        {title}
      </p>

      <div className="space-y-1">
        {items.map(
          (
            item
          ) => {
            const Icon =
              item.icon;

            const active =
              isItemActive(
                pathname,
                item.href
              );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                onClick={
                  onNavigate
                }
                className={`
                  group
                  relative
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2.5
                  text-sm
                  font-semibold
                  transition-all
                  duration-200

                  ${
                    active
                      ? `
                        bg-primary
                        text-primary-foreground
                        shadow-sm
                      `
                      : `
                        text-muted-foreground
                        hover:bg-muted
                        hover:text-foreground
                      `
                  }
                `}
              >
                <Icon
                  className={`
                    h-[18px]
                    w-[18px]
                    shrink-0
                    transition-transform
                    duration-200

                    group-hover:scale-105

                    ${
                      active
                        ? "text-primary-foreground"
                        : ""
                    }
                  `}
                />

                <span className="truncate">
                  {
                    item.label
                  }
                </span>

                {active && (
                  <span
                    className="
                      ml-auto
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-primary-foreground
                    "
                  />
                )}
              </Link>
            );
          }
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MERCHANT SIDEBAR
========================================================= */

export default function MerchantSidebar({
  onLogout,
  onClose,
}: MerchantSidebarProps) {
  const pathname =
    usePathname();

  return (
    <div
      className="
        flex
        h-full
        min-h-dvh
        w-full
        flex-col
        overflow-hidden
        border-r
        border-border
        bg-card
      "
    >
      {/* ==================================================
          HEADER
      =================================================== */}

      <div
        className="
          flex
          h-[76px]
          shrink-0
          items-center
          justify-between
          border-b
          border-border
          px-5
        "
      >
        <Link
          href="/dashboard/merchant"
          onClick={
            onClose
          }
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-2xl
              text-white
              shadow-sm
            "
            style={{
              background:
                "var(--dashboard-primary)",
            }}
          >
            <Store className="h-5 w-5" />
          </div>

          {/* ==============================================
              DAMO REMOVED
          =============================================== */}

          <div className="min-w-0">
            <p
              className="
                truncate
                text-sm
                font-extrabold
                text-card-foreground
              "
            >
              Merchant Portal
            </p>

            <p
              className="
                mt-0.5
                truncate
                text-[10px]
                font-medium
                text-muted-foreground
              "
            >
              Payment Gateway
            </p>
          </div>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close sidebar"
            className="
              rounded-lg
              p-2
              text-muted-foreground
              transition

              hover:bg-muted
              hover:text-foreground

              lg:hidden
            "
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ==================================================
          MERCHANT STATUS CARD
      =================================================== */}

      <div className="shrink-0 px-4 pt-4">
        <div
          className="
            rounded-2xl
            border
            border-border
            bg-background/70
            p-3
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-primary/10
                text-primary
              "
            >
              <BriefcaseBusiness className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-xs
                  font-bold
                  text-foreground
                "
              >
                Business Account
              </p>

              <div
                className="
                  mt-1
                  flex
                  items-center
                  gap-1.5
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    shrink-0
                    rounded-full
                    bg-emerald-500
                  "
                />

                <span
                  className="
                    truncate
                    text-[10px]
                    font-semibold
                    text-muted-foreground
                  "
                >
                  Merchant Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          SCROLLABLE NAVIGATION

          Scroll works.
          Scrollbar is hidden.
      =================================================== */}

      <div
        className="
          flex-1
          overflow-y-auto
          overscroll-contain
          px-4
          py-5

          [scrollbar-width:none]
          [-ms-overflow-style:none]

          [&::-webkit-scrollbar]:hidden
        "
      >
        <NavSection
          title="Business"
          items={
            mainItems
          }
          pathname={
            pathname
          }
          onNavigate={
            onClose
          }
        />

        <NavSection
          title="Finance"
          items={
            financeItems
          }
          pathname={
            pathname
          }
          onNavigate={
            onClose
          }
        />

        <NavSection
          title="Insights"
          items={
            analyticsItems
          }
          pathname={
            pathname
          }
          onNavigate={
            onClose
          }
        />

        <NavSection
          title="Developer"
          items={
            developerItems
          }
          pathname={
            pathname
          }
          onNavigate={
            onClose
          }
        />

        <NavSection
          title="Configuration"
          items={
            settingsItems
          }
          pathname={
            pathname
          }
          onNavigate={
            onClose
          }
        />
      </div>

      {/* ==================================================
          BOTTOM AREA
          ALWAYS FIXED
      =================================================== */}

      <div
        className="
          shrink-0
          border-t
          border-border
          bg-card
          p-4
        "
      >
        {/* ================================================
            MANAGE PAYMENTS
        ================================================= */}

        <Link
          href="/dashboard/merchant/payments"
          onClick={
            onClose
          }
          className="
            mb-3
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-border
            bg-background
            px-3
            py-3
            text-sm
            font-bold
            text-foreground
            transition

            hover:bg-muted
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-primary/10
              text-primary
            "
          >
            <Zap className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="
                truncate
                text-xs
                font-bold
              "
            >
              Manage Payments
            </p>

            <p
              className="
                truncate
                text-[10px]
                font-medium
                text-muted-foreground
              "
            >
              View your latest payment activity
            </p>
          </div>
        </Link>

        {/* ================================================
            LOGOUT
        ================================================= */}

        <button
          type="button"
          onClick={
            onLogout
          }
          className="
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-2.5
            text-sm
            font-semibold
            text-muted-foreground
            transition

            hover:bg-red-50
            hover:text-red-600

            dark:hover:bg-red-950/20
          "
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />

          <span>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}