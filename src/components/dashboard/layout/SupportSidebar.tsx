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
  const pathname =
    usePathname();

  const isOverview =
    pathname ===
    "/dashboard/support-dashboard";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-emerald-100 bg-white">
      {/* ===================================================
          BRAND
      ==================================================== */}

      <div className="shrink-0 border-b border-emerald-100 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard/support-dashboard"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_24px_rgba(16,185,129,0.25)]">
              <HeadsetIcon />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-slate-900">
                Coffer
              </p>

              <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                Support Console
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close support sidebar"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* =================================================
            ROLE PILL
        ================================================= */}

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          <div className="min-w-0">
            <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
              Support Agent
            </p>

            <p className="truncate text-[8px] font-medium text-emerald-600/80">
              Live support operations
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          NAVIGATION
      ==================================================== */}

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        <div className="space-y-1">
          {NAV_ITEMS.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                item.href ===
                "/dashboard/support-dashboard"
                  ? isOverview
                  : pathname ===
                      item.href ||
                    pathname.startsWith(
                      `${item.href}/`
                    );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 ${
                    active
                      ? "bg-emerald-50 text-emerald-700 shadow-[inset_3px_0_0_#10B981]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${
                      active
                        ? "border-emerald-200 bg-white text-emerald-600 shadow-sm"
                        : "border-transparent bg-slate-50 text-slate-400 group-hover:border-emerald-100 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[11px] font-black ${
                        active
                          ? "text-emerald-700"
                          : "text-slate-600 group-hover:text-emerald-700"
                      }`}
                    >
                      {item.label}
                    </span>

                    <span
                      className={`mt-0.5 hidden truncate text-[8px] font-medium xl:block ${
                        active
                          ? "text-emerald-600/70"
                          : "text-slate-400"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>

                  {active && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  )}
                </Link>
              );
            }
          )}
        </div>
      </nav>

      {/* ===================================================
          FOOTER
      ==================================================== */}

      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className="mb-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
            Support Principle
          </p>

          <p className="mt-1 text-[10px] font-bold leading-4 text-slate-600">
            Investigate clearly. Document everything. Escalate responsibly.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <LogOut className="h-4 w-4" />
          </span>

          <span className="text-[11px] font-black">
            Sign out
          </span>
        </button>
      </div>
    </div>
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
      className="h-5 w-5"
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