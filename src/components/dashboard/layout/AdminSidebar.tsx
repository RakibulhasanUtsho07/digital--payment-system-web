"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Activity,
  Settings,
  Banknote,
  LogOut,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  MessageSquareWarning,
  Lock,
  Percent,
  UserCheck
} from "lucide-react";

const adminNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/dashboard/users", icon: Users },
  { label: "KYC Approvals", href: "/dashboard/kyc-requests", icon: ShieldAlert },
  { label: "System Transactions", href: "/dashboard/all-transactions", icon: Banknote },
  { label: "Analytics & Reports", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Support Tickets", href: "/dashboard/support", icon: MessageSquareWarning },
  { label: "Fee & Revenue", href: "/dashboard/revenue", icon: Percent },
  { label: "Security & Audits", href: "/dashboard/security", icon: Lock },
  { label: "System Logs", href: "/dashboard/logs", icon: Activity },
  { label: "Platform Settings", href: "/dashboard/settings", icon: Settings },
];

export default function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* ======================= BRANDING ======================= */}
      <div className="border-b border-white/10 px-5 py-5 shrink-0">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-900/30 transition-all duration-300 group-hover:rotate-12">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-white tracking-wide">
              Admin Panel
            </p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              System Control
            </p>
          </div>
        </Link>
      </div>

      {/* ======================= NAVIGATION ======================= */}
      <div className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Management
        </p>

        <nav className="space-y-1.5">
          {adminNavItems.map((item) => {
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
                  text-sm font-medium transition-all duration-300 ease-in-out
                  overflow-hidden
                  ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white hover:translate-x-1"
                  }
                `}
              >
                {/* Active Left Border Indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-300 animate-pulse" />
                )}

                {/* Icon wrapper with hover scale */}
                <span
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300
                    ${
                      active
                        ? "bg-indigo-700/60 text-white"
                        : "bg-white/[0.04] text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 group-hover:scale-110"
                    }
                  `}
                >
                  <Icon className="h-4 w-4 transition-transform duration-300" />
                </span>

                <span className="flex-1">{item.label}</span>

                {/* Chevron icon sliding on hover */}
                <ChevronRight
                  className={`h-4 w-4 transition-all duration-300 
                    ${
                      active
                        ? "text-white opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-slate-400"
                    }
                  `}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ======================= LOGOUT ======================= */}
      <div className="border-t border-white/10 p-4 shrink-0 bg-black/20">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-rose-400 transition-all duration-300 hover:bg-rose-500/20 hover:text-rose-200 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <LogOut className="h-4 w-4" />
          </span>
          <span>Secure Logout</span>
        </button>
      </div>
    </div>
  );
}