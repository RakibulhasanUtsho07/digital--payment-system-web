"use client";

import React from "react";
import { Users, Banknote, ShieldAlert, Activity, ArrowUpRight } from "lucide-react";

export default function AdminDashboardOverview({ user }: { user: any }) {
  const systemStats = [
    { title: "Total Users", value: "14,250", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Platform Volume", value: "৳ 45.2M", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Pending KYCs", value: "128", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-100" },
    { title: "Active Transactions", value: "1,432", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  return (
    <div className="animate-in fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
        <p className="text-sm text-slate-500">Welcome back {user.name}, here is the current system status.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">{stat.title}</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h2>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">Recent KYC Requests</h3>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-slate-100">
               <div>
                 <p className="font-semibold text-sm">Md. Rakibul Islam</p>
                 <p className="text-xs text-slate-500">Submitted 2 hours ago</p>
               </div>
               <button className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">Review</button>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">System Alerts</h3>
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-800">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Unusual Transaction Volume</p>
              <p className="text-xs opacity-80">High volume detected in node US-East. Immediate review recommended.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}