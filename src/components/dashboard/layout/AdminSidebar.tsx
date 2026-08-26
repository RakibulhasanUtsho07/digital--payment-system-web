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
    // Outer container: takes full height of parent, fixed width, deep dark premium theme.
    <aside className="flex h-full w-[260px] flex-col bg-[#0B1320] text-slate-300 shadow-2xl overflow-hidden border-r border-slate-800/50">
      
      {/* ======================= BRANDING (Fixed Height) ======================= */}
      {/* 
        h-20 (80px) aligns the bottom border perfectly with the dashboard navbar.
      */}
      <div className="flex h-20 shrink-0 items-center border-b border-slate-800/80 px-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
        >
          {/* Admin Logo with Indigo/Purple premium gradient */}
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              Admin Panel
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              System Control
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
          Management
        </p>

        <nav className="space-y-1.5 pb-4">
          {adminNavItems.map((item) => {
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
                  <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-400" />
                )}

                {/* Icon wrapper matching the image style but with Indigo tint */}
                <span
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-[10px] transition-all duration-300
                    ${
                      active
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-transparent text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 transition-transform duration-300" />
                </span>

                <span className="flex-1">{item.label}</span>

                {/* Active arrow indicator */}
                {active && (
                  <ChevronRight className="h-4 w-4 text-indigo-400" />
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
          <span>Secure Logout</span>
        </button>
      </div>
      
    </aside>
  );
}