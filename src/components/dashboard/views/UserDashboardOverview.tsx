"use client";

import React from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Clock, Download, Send, Sparkles, Wallet, ChevronRight } from "lucide-react";

export default function UserDashboardOverview({ user }: { user: any }) {
  // You can fetch dynamic stats here using SWR or React Query
  return (
    <div className="animate-in fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#162A43]">{user.greeting}, {user.name}</h1>
        <p className="text-sm text-slate-500">Here is your wallet overview.</p>
      </div>
      
      {/* 4 Overview Cards (Similar to your existing code) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
           <p className="text-xs font-semibold uppercase text-slate-400">Available Balance</p>
           <h2 className="mt-2 text-2xl font-bold text-[#162A43]">৳ 25,450</h2>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
           <p className="text-xs font-semibold uppercase text-slate-400">Total Received</p>
           <h2 className="mt-2 text-2xl font-bold text-emerald-600">৳ 42,800</h2>
        </div>
        {/* Add others... */}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/dashboard/send" className="flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-6 py-3 text-sm text-white hover:bg-[#123B66]">
          <Send className="h-4 w-4" /> Send Money
        </Link>
      </div>
    </div>
  );
}