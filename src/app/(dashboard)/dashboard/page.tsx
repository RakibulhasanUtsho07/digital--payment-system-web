"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Download,
  Send,
  Sparkles,
  Wallet,
  BellRing
} from "lucide-react";

/* =========================================================
   DUMMY DATA (Replace these with real API data later)
========================================================= */
const userData = {
  name: "Rakibul",
  greeting: "Good morning",
};

const statsData = [
  {
    title: "Available Balance",
    amount: "25,450",
    icon: Wallet,
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-500",
  },
  {
    title: "Pending Balance",
    amount: "1,250",
    icon: Clock,
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-500",
  },
  {
    title: "Total Received",
    amount: "42,800",
    icon: ArrowDownLeft,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-500",
  },
  {
    title: "Total Sent",
    amount: "17,350",
    icon: ArrowUpRight,
    color: "bg-indigo-500",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-500",
  },
];

const recentTransactions = [
  {
    id: 1,
    title: "Received from Abib",
    amount: "+৳1,200",
    type: "credit",
    status: "Completed",
    date: "Today, 10:30 AM",
  },
  {
    id: 2,
    title: "Sent to Salauddin",
    amount: "-৳500",
    type: "debit",
    status: "Completed",
    date: "Yesterday, 04:15 PM",
  },
  {
    id: 3,
    title: "KYC submission",
    amount: "৳0",
    type: "neutral",
    status: "Pending",
    date: "2 days ago",
  },
  {
    id: 4,
    title: "Received from Taj",
    amount: "+৳900",
    type: "credit",
    status: "Completed",
    date: "2 days ago",
  },
];

/* =========================================================
   COMPONENT
========================================================= */
export default function DashboardOverview() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#162A43] sm:text-3xl">
          {userData.greeting}, {userData.name}
        </h1>
        <p className="text-sm text-slate-500">
          Here is your wallet overview.
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {stat.title}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#162A43]">
                    ৳ {stat.amount}
                  </h2>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.lightColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
              {/* Bottom colored line effect */}
              <div
                className={`absolute bottom-0 left-0 h-1 w-0 ${stat.color} transition-all duration-300 group-hover:w-full`}
              />
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#162A43]">Quick Actions</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/send"
            className="flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#123B66] hover:shadow-md active:scale-95"
          >
            <Send className="h-4 w-4" />
            Send Money
          </Link>
          <Link
            href="/dashboard/receive"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Receive Money
          </Link>
          <Link
            href="/dashboard/wallet"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <Wallet className="h-4 w-4" />
            View Wallet
          </Link>
        </div>
      </div>

      {/* BOTTOM GRID (Transactions & Insights) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Recent Transactions (Takes 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#162A43]">
              Recent Transactions
            </h3>
            <Link
              href="/dashboard/transactions"
              className="group flex items-center gap-1 text-sm font-medium text-[#1F5EA8] hover:underline"
            >
              View all
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col">
              {recentTransactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-5 transition-colors hover:bg-slate-50 ${
                    index !== recentTransactions.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      {tx.type === "credit" ? (
                        <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                      ) : tx.type === "debit" ? (
                        <ArrowUpRight className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#162A43]">
                        {tx.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{tx.date}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        tx.type === "credit"
                          ? "text-emerald-600"
                          : tx.type === "debit"
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {tx.amount !== "৳0" ? tx.amount : ""}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        tx.status === "Completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Insights & Notifications */}
        <div className="space-y-6">
          {/* AI Insight */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#162A43]">AI Insight</h3>
            <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-400/30 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm transition-all hover:border-blue-400">
              <div className="absolute -right-4 -top-4 rounded-full bg-blue-100/50 p-6 blur-2xl transition-all group-hover:scale-150" />
              
              <div className="relative z-10 flex flex-col items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#162A43]">
                    Spending increased in Food
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    You spent more on food than your recent average. Let's manage your budget.
                  </p>
                </div>
                <button className="mt-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-sm transition-colors hover:bg-blue-50">
                  View Insights
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Placeholder */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#162A43]">Notifications</h3>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <BellRing className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#162A43]">
                    Security Alert
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    New login detected from a new device (Windows 11).
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}