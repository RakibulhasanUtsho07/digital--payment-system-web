"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Banknote,
  ChevronRight,
  Clock3,
  FileClock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

interface AdminDashboardOverviewProps {
  user: {
    name?: string;
  };
}

const systemStats = [
  {
    title: "Total Users",
    value: "14,250",
    change: "+8.2%",
    icon: Users,
    iconClass:
      "bg-blue-50 text-blue-600",
  },
  {
    title: "Platform Volume",
    value: "৳ 45.2M",
    change: "+12.6%",
    icon: Banknote,
    iconClass:
      "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Pending KYCs",
    value: "128",
    change: "+14 today",
    icon: ShieldAlert,
    iconClass:
      "bg-amber-50 text-amber-600",
  },
  {
    title: "Active Transactions",
    value: "1,432",
    change: "+5.4%",
    icon: Activity,
    iconClass:
      "bg-violet-50 text-violet-600",
  },
];

const recentKycRequests = [
  {
    name: "Md. Rakibul Islam",
    document: "National ID",
    submitted: "2 hours ago",
    status: "Pending",
    initials: "RI",
  },
  {
    name: "Sadia Rahman",
    document: "Passport",
    submitted: "3 hours ago",
    status: "Pending",
    initials: "SR",
  },
  {
    name: "Arif Hossain",
    document: "National ID",
    submitted: "5 hours ago",
    status: "Pending",
    initials: "AH",
  },
];

const systemAlerts = [
  {
    title: "High transaction volume",
    description:
      "Unusual activity was detected across several transfer routes.",
    time: "12 min ago",
    severity: "warning",
  },
  {
    title: "KYC queue growing",
    description:
      "128 applications are currently waiting for admin review.",
    time: "38 min ago",
    severity: "danger",
  },
];

export default function AdminDashboardOverview({
  user,
}: AdminDashboardOverviewProps) {
  return (
    <div className="space-y-6 pb-10">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-[#101827] via-[#17263A] to-[#203C63] p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-200 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              Admin Control Center
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              System Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Welcome back,{" "}
              <span className="font-bold text-white">
                {user.name ||
                  "Administrator"}
              </span>
              . Monitor users, KYC activity, transactions,
              revenue, and platform health from one place.
            </p>
          </div>

          <Link
            href="/dashboard/analytics"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#17263A] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Link>
        </div>
      </section>

      {/* =====================================================
          SYSTEM STATS
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {systemStats.map(
          (stat) => {
            const Icon =
              stat.icon;

            return (
              <div
                key={stat.title}
                className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.07)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      {stat.title}
                    </p>

                    <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                      {stat.change}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          }
        )}
      </section>

      {/* =====================================================
          SECONDARY STATS
      ====================================================== */}

      <section className="grid gap-4 md:grid-cols-3">
        <MiniMetric
          icon={TrendingUp}
          title="Monthly Growth"
          value="+18.4%"
          subtitle="Compared with last month"
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <MiniMetric
          icon={Banknote}
          title="Daily Revenue"
          value="৳ 184,250"
          subtitle="Across all payment rails"
          iconClass="bg-blue-50 text-blue-600"
        />

        <MiniMetric
          icon={Activity}
          title="Platform Health"
          value="99.98%"
          subtitle="All major services operational"
          iconClass="bg-violet-50 text-violet-600"
        />
      </section>

      {/* =====================================================
          MAIN ADMIN GRID
      ====================================================== */}

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* KYC REQUESTS */}

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Verification Queue
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                Recent KYC Requests
              </h2>
            </div>

            <Link
              href="/dashboard/kyc-requests"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1F5EA8] hover:underline"
            >
              Review all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentKycRequests.map(
              (request) => (
                <div
                  key={request.name}
                  className="group flex items-center justify-between rounded-2xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-black text-slate-600">
                      {request.initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {request.name}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {request.document} ·{" "}
                        {request.submitted}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pl-3">
                    <span className="hidden rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700 sm:inline-flex">
                      {request.status}
                    </span>

                    <Link
                      href="/dashboard/kyc-requests"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#1F5EA8]"
                    >
                      Review
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ALERTS */}

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Monitoring
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                System Alerts
              </h2>
            </div>

            <Link
              href="/dashboard/logs"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1F5EA8] hover:underline"
            >
              Logs
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {systemAlerts.map(
              (alert) => {
                const isDanger =
                  alert.severity ===
                  "danger";

                return (
                  <div
                    key={alert.title}
                    className={`rounded-2xl border p-4 ${
                      isDanger
                        ? "border-rose-100 bg-rose-50"
                        : "border-amber-100 bg-amber-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isDanger
                            ? "bg-white text-rose-600"
                            : "bg-white text-amber-600"
                        }`}
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-sm font-extrabold ${
                              isDanger
                                ? "text-rose-900"
                                : "text-amber-900"
                            }`}
                          >
                            {alert.title}
                          </p>

                          <span
                            className={`text-[10px] font-semibold ${
                              isDanger
                                ? "text-rose-500"
                                : "text-amber-600"
                            }`}
                          >
                            {alert.time}
                          </span>
                        </div>

                        <p
                          className={`mt-1 text-xs leading-5 ${
                            isDanger
                              ? "text-rose-700"
                              : "text-amber-700"
                          }`}
                        >
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK ADMIN ACTIONS
      ====================================================== */}

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Shortcuts
          </p>

          <h2 className="mt-1 text-lg font-extrabold text-slate-900">
            Quick Administration
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminQuickAction
            href="/dashboard/users"
            icon={Users}
            title="Manage Users"
            description="View and manage accounts"
          />

          <AdminQuickAction
            href="/dashboard/kyc-requests"
            icon={ShieldCheck}
            title="Review KYC"
            description="Verify pending identities"
          />

          <AdminQuickAction
            href="/dashboard/all-transactions"
            icon={Activity}
            title="Transactions"
            description="Monitor platform activity"
          />

          <AdminQuickAction
            href="/dashboard/revenue"
            icon={Banknote}
            title="Revenue"
            description="Review financial performance"
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  icon: Icon,
  title,
  value,
  subtitle,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-lg font-black text-slate-900">
          {value}
        </p>

        <p className="mt-1 truncate text-[10px] text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN QUICK ACTION
========================================================= */

function AdminQuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm transition group-hover:bg-[#1F5EA8] group-hover:text-white">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#1F5EA8]" />
    </Link>
  );
}