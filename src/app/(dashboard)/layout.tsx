"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  CircleUserRound,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Send,
  ShieldCheck,
  WalletCards,
  X,
  Download,
  Sparkles,
  PieChart,
  TrendingUp,
  Receipt,
  Settings,
} from "lucide-react";

import { clearAuth } from "@/lib/auth/auth";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Wallet",
    href: "/dashboard/wallet",
    icon: WalletCards,
  },
  {
    label: "Send Money",
    href: "/dashboard/send",
    icon: Send,
  },
  {
    label: "Receive Money",
    href: "/dashboard/receive",
    icon: Download,
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptText,
  },
  {
    label: "KYC",
    href: "/dashboard/kyc",
    icon: FileCheck2,
  },
  {
    label: "AI Insights",
    href: "/dashboard/ai-insights",
    icon: Sparkles,
  },
  {
    label: "Budgeting",
    href: "/dashboard/budgeting",
    icon: PieChart,
  },
  {
    label: "Cash Flow",
    href: "/dashboard/cash-flow",
    icon: TrendingUp,
  },
  {
    label: "Receipts",
    href: "/dashboard/receipts",
    icon: Receipt,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#162A43]">
      {/* Mobile drawer checkbox */}
      <input
        id="dashboard-drawer"
        type="checkbox"
        className="peer hidden"
      />

      {/* =========================================================
         SIDEBAR
      ========================================================== */}
      <aside
        className="
          fixed inset-y-0 left-0 z-50 w-[280px]
          -translate-x-full
          border-r border-white/10
          bg-[#123B66]
          shadow-2xl
          transition-transform duration-300
          peer-checked:translate-x-0
          lg:translate-x-0
        "
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="border-b border-white/10 px-5 py-5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#9DDCFF]">
                <WalletCards className="h-5 w-5" />
              </div>

              <div>
                <p className="font-serif text-lg font-bold text-white">
                  Wallet
                </p>

                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-blue-100/45">
                  Digital Wallet System
                </p>
              </div>
            </Link>
          </div>

          {/* Sidebar content - Scrollbar Hidden here */}
          <div className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-100/35">
              Main Menu
            </p>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;

                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group relative flex items-center gap-3 rounded-xl px-3.5 py-3
                      text-sm font-medium transition-all duration-200
                      ${
                        active
                          ? "bg-white text-[#173D68] shadow-[0_8px_20px_rgba(0,0,0,0.10)]"
                          : "text-blue-100/65 hover:bg-white/[0.07] hover:text-white"
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#4EA3E3]" />
                    )}

                    <span
                      className={`
                        flex h-9 w-9 items-center justify-center rounded-xl
                        transition-colors
                        ${
                          active
                            ? "bg-[#EAF3FC] text-[#1F5EA8]"
                            : "bg-white/[0.06] text-blue-100/60 group-hover:bg-white/10 group-hover:text-[#9DDCFF]"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="flex-1">
                      {item.label}
                    </span>

                    {active && (
                      <ChevronRight className="h-4 w-4 text-[#1F5EA8]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Security section */}
            <div className="mt-8">
              <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-100/35">
                Security
              </p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      Account Protected
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-blue-100/40">
                      Secure wallet access and protected transaction flows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="border-t border-white/10 p-4 shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-200 transition-all hover:bg-red-400/10 hover:text-red-100"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
                <LogOut className="h-4 w-4" />
              </span>

              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================
         MOBILE OVERLAY
      ========================================================== */}
      <label
        htmlFor="dashboard-drawer"
        className="
          fixed inset-0 z-40 hidden
          bg-[#0B1F33]/40
          backdrop-blur-sm
          peer-checked:block
          lg:hidden
        "
      />

      {/* =========================================================
         MAIN AREA
      ========================================================== */}
      <div className="flex min-h-screen flex-col lg:pl-[280px]">
        {/* =======================================================
            TOP NAVBAR
        ======================================================== */}
        <header className="sticky top-0 z-30 border-b border-[#E3EAF1] bg-white/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left */}
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <label
                htmlFor="dashboard-drawer"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-[#405169] transition hover:bg-[#F5F8FB] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </label>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Digital Wallet
                </p>

                <h1 className="mt-0.5 text-sm font-bold text-[#162A43] sm:text-base">
                  {getPageTitle(pathname)}
                </h1>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* System status */}
              <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <span className="text-[9px] font-semibold text-emerald-700">
                  System Secure
                </span>
              </div>

              {/* Notification */}
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-[#506176] transition hover:bg-[#F5F8FB]"
              >
                <Bell className="h-4 w-4" />

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#1F5EA8] ring-2 ring-white" />
              </button>

              {/* Profile */}
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-[#DCE5EE] bg-white px-2.5 py-1.5 transition hover:bg-[#F5F8FB] sm:px-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FC] text-[#1F5EA8]">
                  <CircleUserRound className="h-4 w-4" />
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-[10px] font-bold text-[#334155]">
                    My Account
                  </p>

                  <p className="text-[8px] text-slate-400">
                    Personal Wallet
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* =======================================================
            CONTENT
        ======================================================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>

      {/* =========================================================
         MOBILE CLOSE BUTTON
      ========================================================== */}
      <label
        htmlFor="dashboard-drawer"
        className="
          fixed left-[248px] top-4 z-[60]
          hidden h-10 w-10 cursor-pointer
          items-center justify-center rounded-xl
          border border-white/10
          bg-white/10 text-white
          peer-checked:flex
          lg:hidden
        "
      >
        <X className="h-5 w-5" />
      </label>
    </div>
  );
}

/* =============================================================
   PAGE TITLE
============================================================= */

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/dashboard/wallet")) return "Wallet";
  if (pathname.startsWith("/dashboard/send")) return "Send Money";
  if (pathname.startsWith("/dashboard/receive")) return "Receive Money";
  if (pathname.startsWith("/dashboard/transactions")) return "Transactions";
  if (pathname.startsWith("/dashboard/kyc")) return "KYC";
  if (pathname.startsWith("/dashboard/ai-insights")) return "AI Insights";
  if (pathname.startsWith("/dashboard/budgeting")) return "Budgeting";
  if (pathname.startsWith("/dashboard/cash-flow")) return "Cash Flow";
  if (pathname.startsWith("/dashboard/receipts")) return "Receipts";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  
  return "Dashboard";
}