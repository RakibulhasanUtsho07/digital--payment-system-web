"use client";

import React from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

import type { UserRecord } from "./UserManagementTypes";

interface UserAnalyticsProps {
  users: UserRecord[];
  onOpenUser: (user: UserRecord) => void;
}

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutProps {
  total: number;
  segments: Segment[];
}

export default function UserAnalytics({
  users,
  onOpenUser,
}: UserAnalyticsProps) {
  const total = Math.max(1, users.length);

  const healthy = users.filter(
    (user) =>
      user.status === "active" &&
      user.riskLevel === "low" &&
      user.kycStatus === "verified"
  ).length;

  const pending = users.filter((user) =>
    ["pending", "under_review"].includes(user.kycStatus)
  ).length;

  const risky = users.filter((user) => user.riskLevel === "high");
  const suspended = users.filter((user) => user.status === "suspended").length;

  const initialSegments: Segment[] = [
    { label: "Healthy", value: healthy, color: "#10B981" },
    { label: "KYC pending", value: pending, color: "#F59E0B" },
    { label: "High risk", value: risky.length, color: "#F43F5E" },
    { label: "Suspended", value: suspended, color: "#94A3B8" },
  ];

  const allocated = initialSegments.reduce((sum, item) => sum + item.value, 0);
  const remaining = users.length - allocated;

  const segments =
    remaining > 0
      ? [
          ...initialSegments,
          { label: "Other", value: remaining, color: "#3B82F6" },
        ]
      : initialSegments;

  const healthyPercent = Math.round((healthy / total) * 100);

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
      {/* Population Overview Card */}
      <article className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-slate-400">
              User base health
            </p>
            <h2 className="mt-1 text-xl font-black text-[#0F2745]">
              Population overview
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Live distribution of operational account states.
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
            <p className="text-[9px] font-extrabold uppercase text-emerald-600">
              Healthy base
            </p>
            <p className="text-2xl font-black text-emerald-800">
              {healthyPercent}%
            </p>
          </div>
        </div>

        <div className="mt-6 grid items-center gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
          <Donut total={users.length} segments={segments} />

          <div className="grid gap-3 sm:grid-cols-2">
            {segments.slice(0, 4).map((segment) => (
              <div
                key={segment.label}
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5"
              >
                <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-600">
                  <i
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: segment.color }}
                  />
                  <span className="truncate">{segment.label}</span>
                </span>
                <strong className="text-xs text-slate-900">
                  {Math.round((segment.value / total) * 100)}%
                </strong>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Risk Watchlist Card */}
      <article className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-slate-400">
              Risk watchlist
            </p>
            <h2 className="mt-1 text-xl font-black text-[#0F2745]">
              Needs attention
            </h2>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {risky.length > 0 ? (
            risky.slice(0, 4).map((user) => (
              <motion.button
                key={user.id}
                type="button"
                whileHover={{ x: 3 }}
                onClick={() => onOpenUser(user)}
                className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-xs font-black text-rose-600">
                    {getInitials(user.name)}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm text-slate-900">
                      {user.name}
                    </strong>
                    <small className="text-[10px] text-slate-400">
                      Risk score {user.riskScore}/100
                    </small>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-amber-600" />
              </motion.button>
            ))
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              No high-risk users right now.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

// Sub-component: Donut SVG Chart
function Donut({ total, segments }: DonutProps) {
  const safeTotal = Math.max(1, total);
  const radius = 39;
  const circumference = 2 * Math.PI * radius;

  // Pure state calculation before rendering map
  let accumulatedValue = 0;
  const computedSegments = segments.map((segment) => {
    const offset = -(accumulatedValue / safeTotal) * circumference;
    accumulatedValue += segment.value;
    const dash = (segment.value / safeTotal) * circumference;

    return {
      ...segment,
      dash,
      offset,
    };
  });

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label="User population distribution"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="12"
        />
        {computedSegments.map((segment, index) => (
          <motion.circle
            key={segment.label}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="12"
            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
            strokeDashoffset={segment.offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-3xl font-black text-[#0F2745]">
          {total}
        </strong>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
          Users
        </span>
      </div>
    </div>
  );
}

// Helper: Safe Initials Extractor
function getInitials(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}