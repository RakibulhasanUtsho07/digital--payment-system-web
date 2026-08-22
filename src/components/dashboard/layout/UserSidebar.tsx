import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, WalletCards, Send, Download, ReceiptText, FileCheck2, Sparkles, PieChart, TrendingUp, Receipt, Settings, ShieldCheck, LogOut, ChevronRight } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallet", href: "/dashboard/wallet", icon: WalletCards },
  { label: "Send Money", href: "/dashboard/send", icon: Send },
  { label: "Receive Money", href: "/dashboard/receive", icon: Download },
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptText },
  { label: "KYC", href: "/dashboard/kyc", icon: FileCheck2 },
]; // Add other user routes here...

export default function UserSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#123B66]">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#9DDCFF]">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-white">My Wallet</p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-blue-100/45">User Portal</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${active ? "bg-white text-[#173D68]" : "text-blue-100/65 hover:bg-white/[0.07] hover:text-white"}`}>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-white/10 p-4 shrink-0">
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-200 hover:bg-red-400/10 hover:text-red-100">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
}