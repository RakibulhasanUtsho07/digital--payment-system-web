"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Bell,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Eye,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Activity,
} from "lucide-react";

interface UserDashboardOverviewProps {
  user: {
    name?: string;
    greeting?: string;
    email?: string;
    kycStatus?:
      | "not_started"
      | "pending"
      | "under_review"
      | "verified"
      | "rejected";
  };
}

const recentTransactions = [
  {
    id: 1,
    title: "Received from Rahim",
    date: "Today, 10:42 AM",
    amount: "+ ৳4,500",
    type: "credit",
    icon: ArrowDownLeft,
  },
  {
    id: 2,
    title: "Sent to Karim",
    date: "Today, 09:15 AM",
    amount: "- ৳1,250",
    type: "debit",
    icon: ArrowUpRight,
  },
  {
    id: 3,
    title: "Wallet Top Up",
    date: "Yesterday, 07:34 PM",
    amount: "+ ৳8,000",
    type: "credit",
    icon: Plus,
  },
  {
    id: 4,
    title: "Electricity Bill",
    date: "Yesterday, 04:20 PM",
    amount: "- ৳2,450",
    type: "debit",
    icon: Banknote,
  },
];

const spendingData = [
  { label: "Food", value: 72 },
  { label: "Bills", value: 54 },
  { label: "Shopping", value: 42 },
  { label: "Transport", value: 28 },
];

export default function UserDashboardOverview({
  user,
}: UserDashboardOverviewProps) {
  const greeting =
    user.greeting ||
    getGreeting();

  const kycStatus =
    user.kycStatus ||
    "not_started";

  return (
    <div className="space-y-6 pb-10">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-[#0F2745] via-[#173F6D] to-[#1F5EA8] p-6 text-white shadow-[0_18px_50px_rgba(23,63,109,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Wallet Overview
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {greeting},{" "}
              <span className="text-cyan-200">
                {user.name || "User"}
              </span>
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
              Here is everything happening across your wallet,
              balances, transactions, and financial activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/send"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#173F6D] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <Send className="h-4 w-4" />
              Send Money
            </Link>

            <Link
              href="/dashboard/receive"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Receive
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available Balance"
          value="৳ 25,450"
          subtitle="Ready to spend"
          icon={Wallet}
          iconClass="bg-blue-50 text-blue-600"
          valueClass="text-slate-900"
        />

        <StatCard
          title="Total Received"
          value="৳ 42,800"
          subtitle="+12.4% this month"
          icon={ArrowDownLeft}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-600"
        />

        <StatCard
          title="Total Sent"
          value="৳ 17,350"
          subtitle="-4.8% this month"
          icon={ArrowUpRight}
          iconClass="bg-rose-50 text-rose-600"
          valueClass="text-rose-600"
        />

        <StatCard
          title="Monthly Spending"
          value="৳ 8,420"
          subtitle="Within your budget"
          icon={TrendingUp}
          iconClass="bg-violet-50 text-violet-600"
          valueClass="text-violet-600"
        />
      </section>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* RECENT TRANSACTIONS */}

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Activity
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Recent Transactions
              </h2>
            </div>

            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1F5EA8] transition hover:text-[#123B66]"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.map(
              (transaction) => {
                const Icon =
                  transaction.icon;

                const isCredit =
                  transaction.type ===
                  "credit";

                return (
                  <div
                    key={transaction.id}
                    className="group flex items-center justify-between rounded-2xl border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isCredit
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {transaction.title}
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          {transaction.date}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`shrink-0 pl-4 text-sm font-extrabold ${
                        isCredit
                          ? "text-emerald-600"
                          : "text-slate-900"
                      }`}
                    >
                      {transaction.amount}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* WALLET SNAPSHOT */}

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Wallet
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Quick Snapshot
            </h2>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Current Balance
                </p>

                <p className="mt-1 text-2xl font-black text-slate-900">
                  ৳ 25,450
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1F5EA8] shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <Activity className="h-4 w-4" />
              Wallet is active
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <QuickAction
              href="/dashboard/wallet"
              icon={Eye}
              label="View Wallet"
            />

            <QuickAction
              href="/dashboard/transactions"
              icon={Download}
              label="Statements"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          LOWER GRID
      ====================================================== */}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* SPENDING INSIGHTS */}

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Analytics
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Spending Insights
              </h2>
            </div>

            <Link
              href="/dashboard/insights"
              className="text-xs font-bold text-[#1F5EA8] hover:underline"
            >
              Open insights
            </Link>
          </div>

          <div className="space-y-4">
            {spendingData.map(
              (item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      {item.label}
                    </span>

                    <span className="text-xs font-bold text-slate-800">
                      {item.value}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${item.value}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-[#1F5EA8] to-cyan-400"
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* KYC + SMART TIP */}

        <div className="space-y-6">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />

                  <h2 className="text-lg font-extrabold text-slate-900">
                    Identity Verification
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Keep your account verified to unlock
                  secure wallet features.
                </p>
              </div>

              <KycBadge
                status={kycStatus}
              />
            </div>

            {kycStatus !==
              "verified" && (
              <Link
                href="/dashboard/kyc"
                className="mt-5 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div>
                  <p className="text-sm font-bold text-[#173F6D]">
                    Complete KYC verification
                  </p>

                  <p className="mt-1 text-[11px] text-blue-700/70">
                    Submit your identity documents.
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-[#1F5EA8]" />
              </Link>
            )}
          </div>

          <div className="rounded-[26px] border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-5 sm:p-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  Smart Wallet Tip
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Your spending is currently highest in
                  food and daily expenses. Setting a small
                  weekly limit can improve your savings rate.
                </p>

                <Link
                  href="/dashboard/budgeting"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1F5EA8] hover:underline"
                >
                  Open budgeting
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  valueClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  valueClass: string;
}) {
  return (
    <div className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {title}
          </p>

          <p
            className={`mt-3 text-2xl font-black tracking-tight ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

/* =========================================================
   KYC BADGE
========================================================= */

function KycBadge({
  status,
}: {
  status:
    | "not_started"
    | "pending"
    | "under_review"
    | "verified"
    | "rejected";
}) {
  const config = {
    not_started: {
      label: "Not Started",
      className:
        "bg-slate-100 text-slate-600",
    },

    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700",
    },

    under_review: {
      label: "Under Review",
      className:
        "bg-blue-50 text-blue-700",
    },

    verified: {
      label: "Verified",
      className:
        "bg-emerald-50 text-emerald-700",
    },

    rejected: {
      label: "Rejected",
      className:
        "bg-red-50 text-red-700",
    },
  } as const;

  const item =
    config[status];

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

/* =========================================================
   GREETING
========================================================= */

function getGreeting() {
  const hour =
    new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}