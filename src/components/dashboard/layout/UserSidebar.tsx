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
    <div className="flex h-full flex-col bg-[#123B66]">
      {/* ======================= BRANDING ======================= */}
      <div className="border-b border-white/10 px-5 py-5 shrink-0">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 text-[#9DDCFF] shadow-lg ring-1 ring-white/10 transition-all duration-300 group-hover:rotate-12 group-hover:shadow-blue-500/20">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-white tracking-wide">
              My Wallet
            </p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-blue-100/45">
              User Portal
            </p>
          </div>
        </Link>
      </div>

      {/* ======================= NAVIGATION ======================= */}
      <div className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/35">
          Main Menu
        </p>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Dashboard should match exactly, others can match partially (nested routes)
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
                  text-sm font-medium transition-all duration-300 ease-in-out
                  overflow-hidden
                  ${
                    active
                      ? "bg-white text-[#173D68] shadow-[0_8px_20px_rgba(0,0,0,0.15)] translate-x-1"
                      : "text-blue-100/65 hover:bg-white/[0.08] hover:text-white hover:translate-x-1"
                  }
                `}
              >
                {/* Active Left Border Indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#4EA3E3] animate-pulse" />
                )}

                {/* Icon wrapper with hover scale effect */}
                <span
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300
                    ${
                      active
                        ? "bg-[#EAF3FC] text-[#1F5EA8]"
                        : "bg-white/[0.05] text-blue-100/60 group-hover:bg-white/10 group-hover:text-[#9DDCFF] group-hover:scale-110"
                    }
                  `}
                >
                  <Icon className="h-4 w-4 transition-transform duration-300" />
                </span>

                <span className="flex-1">{item.label}</span>

                {/* Chevron icon appearing on hover or active */}
                <ChevronRight
                  className={`h-4 w-4 transition-all duration-300 
                    ${
                      active
                        ? "text-[#1F5EA8] opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    }
                  `}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ======================= LOGOUT ======================= */}
      <div className="border-t border-white/10 p-4 shrink-0 bg-black/10">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-200 transition-all duration-300 hover:bg-red-500/20 hover:text-red-100 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <LogOut className="h-4 w-4" />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}