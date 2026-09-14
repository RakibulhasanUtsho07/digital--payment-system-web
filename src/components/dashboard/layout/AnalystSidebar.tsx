"use client";

import type {
  ElementType,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  Activity,
  BarChart3,
  BrainCircuit,
  Building2,
  CircleDollarSign,
  FileBarChart,
  FileSearch,
  Gauge,
  GitCompareArrows,
  Landmark,
  LogOut,
  Radar,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";

/* =========================================================
   PROPS
========================================================= */

interface AnalystSidebarProps {
  onLogout:
    () => void | Promise<void>;

  onClose?:
    () => void;
}

/* =========================================================
   NAV TYPES
========================================================= */

interface NavItem {
  label:
    string;

  href:
    string;

  icon:
    ElementType;

  available:
    boolean;
}

interface NavSectionData {
  title:
    string;

  items:
    NavItem[];
}

/* =========================================================
   ANALYST NAVIGATION
========================================================= */

const sections:
  NavSectionData[] = [
    {
      title:
        "Command Center",

      items: [
        {
          label:
            "Executive Overview",

          href:
            "/dashboard/analyst",

          icon:
            Gauge,

          available:
            true,
        },

        {
          label:
            "Live Platform Pulse",

          href:
            "/dashboard/analyst/live",

          icon:
            Activity,

          available:
            true,
        },

        {
          label:
            "AI Intelligence",

          href:
            "/dashboard/analyst/intelligence",

          icon:
            BrainCircuit,

          available:
            true,
        },
      ],
    },

    {
      title:
        "Performance",

      items: [
        {
          label:
            "Payments",

          href:
            "/dashboard/analyst/payments",

          icon:
            CircleDollarSign,

          /*
           * Payment Analytics is implemented.
           */
          available:
            true,
        },

        {
          label:
            "Transactions",

          href:
            "/dashboard/analyst/transactions",

          icon:
            GitCompareArrows,

          available:
            true,
        },

        {
          label:
            "Conversion",

          href:
            "/dashboard/analyst/conversion",

          icon:
            TrendingUp,

          available:
            true,
        },

        {
          label:
            "Revenue",

          href:
            "/dashboard/analyst/revenue",

          icon:
            BarChart3,

          available:
            true,
        },
      ],
    },

    {
      title:
        "Business",

      items: [
        {
          label:
            "Merchants",

          href:
            "/dashboard/analyst/merchants",

          icon:
            Building2,

          available:
            true,
        },

        {
          label:
            "Customers",

          href:
            "/dashboard/analyst/customers",

          icon:
            Users,

          available:
            false,
        },

        {
          label:
            "Cohorts",

          href:
            "/dashboard/analyst/cohorts",

          icon:
            Radar,

          available:
            false,
        },
      ],
    },

    {
      title:
        "Risk & Operations",

      items: [
        {
          label:
            "Risk & Fraud",

          href:
            "/dashboard/analyst/risk",

          icon:
            ShieldAlert,

          available:
            true,
        },

        {
          label:
            "Refunds",

          href:
            "/dashboard/analyst/refunds",

          icon:
            RefreshCcw,

          available:
            true,
        },

        {
          label:
            "Disputes",

          href:
            "/dashboard/analyst/disputes",

          icon:
            FileSearch,

          available:
            true,
        },

        {
          label:
            "Settlement",

          href:
            "/dashboard/analyst/settlement",

          icon:
            Landmark,

          available:
            true,
        },

        {
          label:
            "Payouts",

          href:
            "/dashboard/analyst/payouts",

          icon:
            WalletCards,

          available:
            true,
        },

        {
          label:
            "Compliance",

          href:
            "/dashboard/analyst/compliance",

          icon:
            ShieldCheck,

          available:
            true,
        },
      ],
    },

    {
      title:
        "Reporting",

      items: [
        {
          label:
            "Report Builder",

          href:
            "/dashboard/analyst/reports",

          icon:
            FileBarChart,

          available:
            true,
        },

        {
          label:
            "Saved Views",

          href:
            "/dashboard/analyst/saved-views",

          icon:
            ReceiptText,

          available:
            true,
        },

        {
          label:
            "Export History",

          href:
            "/dashboard/analyst/exports",

          icon:
            WalletCards,

          available:
            true,
        },
      ],
    },
  ];

/* =========================================================
   ACTIVE ROUTE
========================================================= */

function isActive(
  pathname:
    string,
  href:
    string
): boolean {
  if (
    href ===
    "/dashboard/analyst"
  ) {
    return (
      pathname === href
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
   COMPONENT
========================================================= */

export default function AnalystSidebar({
  onLogout,
  onClose,
}: AnalystSidebarProps) {
  const pathname =
    usePathname();

  return (
    <div className="flex h-full min-h-dvh w-full flex-col border-r border-border bg-card">
      {/* ===================================================
          BRAND
      ==================================================== */}

      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-border px-5">
        <Link
          href="/dashboard/analyst"
          onClick={onClose}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20">
            <BrainCircuit className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-card-foreground">
              DAMO Intelligence
            </p>

            <p className="truncate text-[11px] font-medium text-muted-foreground">
              Analyst Workspace
            </p>
          </div>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close analyst sidebar"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ===================================================
          READ ONLY BADGE
      ==================================================== */}

      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-violet-500/10 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">
                Read-only intelligence
              </p>

              <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
                Aggregated and privacy-safe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          NAVIGATION
      ==================================================== */}

      <nav
        aria-label="Analyst navigation"
        className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5"
      >
        {sections.map(
          (
            section
          ) => (
            <div
              key={
                section.title
              }
              className="mb-6"
            >
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                {
                  section.title
                }
              </p>

              <div className="space-y-1">
                {section.items.map(
                  (
                    item
                  ) => {
                    const Icon =
                      item.icon;

                    const active =
                      item.available &&
                      isActive(
                        pathname,
                        item.href
                      );

                    /* =======================================
                       FUTURE ROUTE
                    ======================================== */

                    if (
                      !item.available
                    ) {
                      return (
                        <div
                          key={
                            item.href
                          }
                          aria-disabled="true"
                          className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground/55"
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />

                          <span className="min-w-0 flex-1 truncate">
                            {
                              item.label
                            }
                          </span>

                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                            Next
                          </span>
                        </div>
                      );
                    }

                    /* =======================================
                       ACTIVE ROUTE
                    ======================================== */

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        onClick={
                          onClose
                        }
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105" />

                        <span className="min-w-0 flex-1 truncate">
                          {
                            item.label
                          }
                        </span>

                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary-foreground" />
                        )}
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          )
        )}
      </nav>

      {/* ===================================================
          FOOTER
      ==================================================== */}

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-[10px] font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />

          <span>
            No financial mutation access
          </span>
        </div>

        <button
          type="button"
          onClick={
            onLogout
          }
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-[18px] w-[18px]" />

          <span>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}