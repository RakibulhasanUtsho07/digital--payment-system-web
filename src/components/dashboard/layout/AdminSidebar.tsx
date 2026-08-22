import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Activity, Settings, Banknote, LogOut, ShieldCheck } from "lucide-react";

const adminNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/dashboard/users", icon: Users },
  { label: "KYC Approvals", href: "/dashboard/kyc-requests", icon: ShieldAlert },
  { label: "System Transactions", href: "/dashboard/all-transactions", icon: Banknote },
  { label: "System Logs", href: "/dashboard/logs", icon: Activity },
  { label: "Platform Settings", href: "/dashboard/settings", icon: Settings },
];

export default function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-white">Admin Panel</p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">System Control</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden">
        <nav className="space-y-1.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-white/10 p-4 shrink-0">
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
          <LogOut className="h-4 w-4" /> Secure Logout
        </button>
      </div>
    </div>
  );
}