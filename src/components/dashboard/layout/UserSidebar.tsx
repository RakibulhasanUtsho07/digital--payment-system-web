"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  WalletCards,
  Send,
  Download,
  ReceiptText,
  FileCheck2,
  Sparkles,
  PieChart,
  TrendingUp,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  Bell
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallet", href: "/dashboard/wallet", icon: WalletCards },
  { label: "Send Money", href: "/dashboard/send", icon: Send },
  { label: "Receive Money", href: "/dashboard/receive", icon: Download },
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "KYC", href: "/dashboard/kyc", icon: FileCheck2 },
  { label: "AI Insights", href: "/dashboard/insights", icon: Sparkles },
  { label: "Budgeting", href: "/dashboard/budgeting", icon: PieChart },
  { label: "Cash Flow", href: "/dashboard/cash-flow", icon: TrendingUp },
  { label: "Receipts", href: "/dashboard/receipts", icon: Receipt },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function UserSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    // Outer container: takes full height of parent.
    // Using a very deep, rich navy blue matching your images perfectly.
    <aside className="flex h-full w-[260px] flex-col bg-[#0B1320] text-slate-300 shadow-2xl overflow-hidden border-r border-slate-800/50">
      
      {/* ======================= BRANDING (Fixed Height) ======================= */}
      {/* 
        h-20 (80px) is standard for navbars. This perfectly aligns the bottom border 
        with your dashboard navbar. If your navbar is slightly smaller/larger, change `h-20` to `h-16` (64px) or `h-[72px]`.
      */}
      <div className="flex h-20 shrink-0 items-center border-b border-slate-800/80 px-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
        >
          {/* Logo matching the image */}
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#4EA3E3] to-[#1F5EA8] text-white shadow-lg shadow-blue-500/20">
            <WalletCards className="h-6 w-6" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              NovaWallet
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#4EA3E3]">
              User Portal
            </span>
          </div>
        </Link>
      </div>

      {/* ======================= NAVIGATION (Scrollable independently) ======================= */}
      {/* 
        flex-1: takes up remaining space
        overflow-y-auto: enables scrolling JUST for this section
        [&::-webkit-scrollbar]:hidden: completely hides the scrollbar across all browsers
      */}
      <div className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
          Main Menu
        </p>

        <nav className="space-y-1.5 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Matches exact route for dashboard, and startsWith for nested pages
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center gap-3 rounded-xl px-3 py-2.5 
                  text-sm font-semibold transition-all duration-300 ease-out overflow-hidden
                  ${
                    active
                      ? "bg-[#14233A] text-white" 
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }
                `}
              >
                {/* Active Left Glow Bar (Flush left) */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[#4EA3E3]" />
                )}

                {/* Icon wrapper matching the image style */}
                <span
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-[10px] transition-all duration-300
                    ${
                      active
                        ? "bg-[#1F3A60] text-[#4EA3E3]"
                        : "bg-transparent text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 transition-transform duration-300" />
                </span>

                <span className="flex-1">{item.label}</span>

                {/* Active arrow indicator matching your image */}
                {active && (
                  <ChevronRight className="h-4 w-4 text-[#4EA3E3]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ======================= LOGOUT (Fixed at Bottom) ======================= */}
      <div className="shrink-0 border-t border-slate-800/80 bg-[#080D16] p-4">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-400 transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-transparent text-slate-500 transition-all duration-300 group-hover:bg-rose-500/20 group-hover:text-rose-400 group-hover:scale-110">
            <LogOut className="h-5 w-5" />
          </span>
          <span>Sign Out</span>
        </button>
      </div>
      
    </aside>
  );
}