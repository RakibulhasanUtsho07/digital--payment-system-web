"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileSearch,
  HelpCircle,
  Inbox,
  LogOut,
  MessageSquare,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface SupportSidebarProps {
  onLogout: () => void;
  onClose?: () => void;
}

interface SupportNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

/* =========================================================
   NAVIGATION
========================================================= */

const NAV_ITEMS: SupportNavItem[] = [
  {
    label: "Overview",
    href: "/dashboard/support-dashboard",
    icon: Inbox,
    description: "Support operations overview",
  },
  {
    label: "Ticket Queue",
    href: "/dashboard/support-dashboard/tickets",
    icon: MessageSquare,
    description: "Manage support tickets",
  },
  {
    label: "Customer Search",
    href: "/dashboard/support-dashboard/customers",
    icon: Search,
    description: "Find customers and merchants",
  },
  {
    label: "Conversations",
    href: "/dashboard/support-dashboard/conversations",
    icon: MessageSquare,
    description: "Customer conversation history",
  },
  {
    label: "Payment Lookup",
    href: "/dashboard/support-dashboard/payments",
    icon: CircleDollarSign,
    description: "Investigate payment references",
  },
  {
    label: "Transaction Lookup",
    href: "/dashboard/support-dashboard/transactions",
    icon: WalletCards,
    description: "Inspect wallet transactions",
  },
  {
    label: "Refund Requests",
    href: "/dashboard/support-dashboard/refunds",
    icon: WalletCards,
    description: "Review refund cases",
  },
  {
    label: "Dispute Cases",
    href: "/dashboard/support-dashboard/disputes",
    icon: ShieldCheck,
    description: "Manage dispute cases",
  },
  {
    label: "KYC Cases",
    href: "/dashboard/support-dashboard/kyc",
    icon: FileSearch,
    description: "Review verification cases",
  },
  {
    label: "Account Issues",
    href: "/dashboard/support-dashboard/account-issues",
    icon: Users,
    description: "Resolve account issues",
  },
  {
    label: "Escalations",
    href: "/dashboard/support-dashboard/escalations",
    icon: ChevronRight,
    description: "Track escalated cases",
  },
  {
    label: "SLA Monitoring",
    href: "/dashboard/support-dashboard/sla",
    icon: Clock3,
    description: "Monitor SLA performance",
  },
  {
    label: "AI Copilot",
    href: "/dashboard/support-dashboard/ai-copilot",
    icon: BrainCircuit,
    description: "AI-assisted support workflows",
  },
  {
    label: "Knowledge Base",
    href: "/dashboard/support-dashboard/knowledge-base",
    icon: BookOpen,
    description: "Support documentation",
  },
  {
    label: "Saved Replies",
    href: "/dashboard/support-dashboard/saved-replies",
    icon: HelpCircle,
    description: "Reusable support responses",
  },
  {
    label: "Analytics",
    href: "/dashboard/support-dashboard/analytics",
    icon: BarChart3,
    description: "Support performance analytics",
  },
  {
    label: "Settings",
    href: "/dashboard/support-dashboard/settings",
    icon: Settings2,
    description: "Support workspace settings",
  },
  {
    label: "Activity",
    href: "/dashboard/support-dashboard/activity",
    icon: Activity,
    description: "Support audit activity",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function SupportSidebar({
  onLogout,
  onClose,
}: SupportSidebarProps) {
  const pathname = usePathname();

  const isOverview =
    pathname === "/dashboard/support-dashboard";

  return (
    <aside className="support-sidebar-shell relative flex h-full w-full flex-col overflow-hidden border-r border-border bg-card text-card-foreground">
      {/* ===================================================
          DECORATIVE BACKGROUND
      ==================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="support-sidebar-grid absolute inset-0 opacity-[0.17] dark:opacity-[0.10]" />

        <div className="support-sidebar-orb absolute -right-20 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="support-sidebar-orb-delayed absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* ===================================================
          BRAND
      ==================================================== */}

      <div className="relative z-10 shrink-0 border-b border-border/80 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard/support-dashboard"
            onClick={onClose}
            className="group flex min-w-0 items-center gap-3"
          >
            <div className="support-sidebar-brand-icon relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-[0_10px_28px_rgba(16,185,129,0.24)]">
              <div className="support-sidebar-brand-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <HeadsetIcon />

              <span className="support-sidebar-brand-ring absolute inset-0 rounded-2xl border border-white/20" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-foreground transition group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                Coffer
              </p>

              <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                Support Console
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close support sidebar"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* =================================================
            ROLE PILL
        ================================================= */}

        <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.07]">
          <div className="support-sidebar-status-line h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-45" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Support Agent
              </p>

              <p className="truncate text-[8px] font-medium text-muted-foreground">
                Live support operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          NAVIGATION
      ==================================================== */}

      <nav className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(16,185,129,.28)_transparent]">
        <div className="mb-2 px-2">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground/70">
            Workspace
          </p>
        </div>

        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            const active =
              item.href ===
              "/dashboard/support-dashboard"
                ? isOverview
                : pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 transition-all duration-200 ${
                  active
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[0_8px_22px_rgba(16,185,129,0.08)] dark:text-emerald-300"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/65 hover:text-foreground"
                }`}
              >
                {active && (
                  <>
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-emerald-500" />

                    <span className="support-sidebar-active-glow pointer-events-none absolute -left-7 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-xl" />
                  </>
                )}

                <span
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${
                    active
                      ? "border-emerald-500/20 bg-background/80 text-emerald-700 shadow-sm dark:text-emerald-400"
                      : "border-border/60 bg-muted/60 text-muted-foreground group-hover:border-emerald-500/20 group-hover:bg-emerald-500/10 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="relative min-w-0 flex-1">
                  <span
                    className={`block truncate text-[11px] font-black ${
                      active
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-foreground/80 group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>

                  <span
                    className={`mt-0.5 hidden truncate text-[8px] font-medium xl:block ${
                      active
                        ? "text-emerald-700/70 dark:text-emerald-300/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>

                {active ? (
                  <span className="support-sidebar-active-dot relative h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ===================================================
          FOOTER
      ==================================================== */}

      <div className="relative z-10 shrink-0 border-t border-border/80 bg-card/80 p-3 backdrop-blur-md">
        <div className="mb-2 rounded-2xl border border-border bg-muted/45 px-3 py-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>

            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Support Principle
              </p>

              <p className="mt-1 text-[10px] font-bold leading-4 text-foreground/75">
                Investigate clearly. Document everything. Escalate responsibly.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left text-muted-foreground transition hover:border-rose-500/15 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground transition group-hover:bg-rose-500/10 group-hover:text-rose-600 dark:group-hover:text-rose-400">
            <LogOut className="h-4 w-4" />
          </span>

          <span className="text-[11px] font-black">
            Sign out
          </span>
        </button>
      </div>

      <style>{`
        .support-sidebar-shell {
          isolation: isolate;
        }

        .support-sidebar-grid {
          background-image:
            linear-gradient(
              rgba(16, 185, 129, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(16, 185, 129, 0.08) 1px,
              transparent 1px
            );
          background-size: 26px 26px;
          mask-image: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.9),
            rgba(0, 0, 0, 0.25) 55%,
            transparent 100%
          );
          animation: supportSidebarGrid 22s linear infinite;
        }

        .support-sidebar-orb {
          animation: supportSidebarOrb 8s ease-in-out infinite;
        }

        .support-sidebar-orb-delayed {
          animation: supportSidebarOrb 10s ease-in-out 1.4s infinite reverse;
        }

        .support-sidebar-brand-shine {
          animation: supportSidebarShine 6s ease-in-out infinite;
        }

        .support-sidebar-brand-ring {
          animation: supportSidebarBrandPulse 3s ease-out infinite;
        }

        .support-sidebar-status-line {
          background-size: 180% 100%;
          animation: supportSidebarStatusLine 4s linear infinite;
        }

        .support-sidebar-active-glow {
          animation: supportSidebarActiveGlow 3.4s ease-in-out infinite;
        }

        .support-sidebar-active-dot {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
          animation: supportSidebarDot 2s ease-out infinite;
        }

        @keyframes supportSidebarGrid {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(26px, 26px, 0);
          }
        }

        @keyframes supportSidebarOrb {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate3d(0, -10px, 0) scale(1.06);
            opacity: 1;
          }
        }

        @keyframes supportSidebarShine {
          0%,
          30% {
            transform: translateX(-180%);
            opacity: 0;
          }
          45% {
            opacity: 1;
          }
          75%,
          100% {
            transform: translateX(450%);
            opacity: 0;
          }
        }

        @keyframes supportSidebarBrandPulse {
          0% {
            transform: scale(0.94);
            opacity: 0.45;
          }
          70%,
          100% {
            transform: scale(1.16);
            opacity: 0;
          }
        }

        @keyframes supportSidebarStatusLine {
          from {
            background-position: 180% 0;
          }
          to {
            background-position: -180% 0;
          }
        }

        @keyframes supportSidebarActiveGlow {
          0%,
          100% {
            opacity: 0.55;
            transform: translateY(-50%) scale(0.95);
          }
          50% {
            opacity: 1;
            transform: translateY(-50%) scale(1.08);
          }
        }

        @keyframes supportSidebarDot {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          75%,
          100% {
            box-shadow: 0 0 0 7px rgba(16, 185, 129, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-sidebar-grid,
          .support-sidebar-orb,
          .support-sidebar-orb-delayed,
          .support-sidebar-brand-shine,
          .support-sidebar-brand-ring,
          .support-sidebar-status-line,
          .support-sidebar-active-glow,
          .support-sidebar-active-dot {
            animation: none !important;
          }
        }
      `}</style>
    </aside>
  );
}

/* =========================================================
   BRAND ICON
========================================================= */

function HeadsetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="relative z-10 h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 13v-1a8 8 0 0 1 16 0v1"
        strokeLinecap="round"
      />

      <path
        d="M4 13h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1v-5Z"
        strokeLinejoin="round"
      />

      <path
        d="M20 13h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-5Z"
        strokeLinejoin="round"
      />

      <path
        d="M16 19c-.7 1-1.8 1.5-3.2 1.5H11"
        strokeLinecap="round"
      />
    </svg>
  );
}
