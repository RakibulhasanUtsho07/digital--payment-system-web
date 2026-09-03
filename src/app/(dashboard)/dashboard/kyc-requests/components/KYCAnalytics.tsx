"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldAlert,
  TimerReset,
} from "lucide-react";

import type {
  KYCOverviewData,
  KYCStatus,
} from "./KYCManagementTypes";

function formatReviewTime(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes)) {
    return "—";
  }

  const safe = Math.max(0, minutes);
  const mins = Math.floor(safe);
  const seconds = Math.round((safe - mins) * 60);

  return `${mins}m ${seconds.toString().padStart(2, "0")}s`;
}

export default function KYCAnalytics({
  overview,
  onFilterStatus,
}: {
  overview: KYCOverviewData;
  onFilterStatus: (status: KYCStatus) => void;
}) {
  const total =
    overview.pending +
    overview.underReview +
    overview.verified +
    overview.rejected;

  const verifiedPercent =
    total > 0
      ? Math.round((overview.verified / total) * 100)
      : 0;

  const segments = [
    {
      label: "Verified",
      status: "Verified" as KYCStatus,
      value: overview.verified,
      color: "#10B981",
      icon: CheckCircle2,
    },
    {
      label: "Pending",
      status: "Pending" as KYCStatus,
      value: overview.pending,
      color: "#F59E0B",
      icon: Clock3,
    },
    {
      label: "Under Review",
      status: "Under Review" as KYCStatus,
      value: overview.underReview,
      color: "#3B82F6",
      icon: FileCheck2,
    },
    {
      label: "Rejected",
      status: "Rejected" as KYCStatus,
      value: overview.rejected,
      color: "#F43F5E",
      icon: ShieldAlert,
    },
  ];

  const maxQueue = Math.max(
    1,
    overview.totalSubmitted,
    overview.verified,
    overview.underReview,
    overview.rejected
  );

  const queueStats = [
    {
      label: "Submitted",
      value: overview.totalSubmitted,
      color: "#60A5FA",
    },
    {
      label: "Verified",
      value: overview.verified,
      color: "#34D399",
    },
    {
      label: "Under Review",
      value: overview.underReview,
      color: "#FBBF24",
    },
    {
      label: "Rejected",
      value: overview.rejected,
      color: "#FB7185",
    },
  ];

  const circumference = 2 * Math.PI * 40;

  return (
    <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)]">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5 }}
        className="min-w-0 rounded-[26px] border border-[#DCE7F0] bg-white p-5 shadow-[0_10px_34px_rgba(15,39,69,0.045)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#5B8BB7]">
              Verification Health
            </p>

            <h2 className="mt-1 text-lg font-black text-[#0F2745]">
              Queue distribution
            </h2>

            <p className="mt-1 max-w-xl text-[10px] leading-5 text-slate-500">
              Current KYC status mix with direct filtering into the review queue.
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
            <BarChart3 className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center">
          <div className="relative mx-auto h-[180px] w-[180px]">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#E8EFF5"
                strokeWidth="10"
              />

              {segments.map((segment, index) => {
                const previous = segments
                  .slice(0, index)
                  .reduce((sum, item) => sum + item.value, 0);

                const dash =
                  total > 0
                    ? (segment.value / total) * circumference
                    : 0;

                const offset =
                  total > 0
                    ? -((previous / total) * circumference)
                    : 0;

                return (
                  <motion.circle
                    key={segment.label}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.max(0, dash - 1)} ${Math.max(
                      0,
                      circumference - Math.max(0, dash - 1)
                    )}`}
                    strokeDashoffset={offset}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: index * 0.07 }}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-black text-[#0F2745]">
                {verifiedPercent}%
              </p>

              <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
                Verified
              </p>

              <p className="mt-1 text-[8px] text-slate-400">
                {total.toLocaleString()} total
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {segments.map((segment, index) => {
              const Icon = segment.icon;

              return (
                <motion.button
                  key={segment.label}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  onClick={() => onFilterStatus(segment.status)}
                  className="group flex items-center justify-between gap-3 rounded-[18px] border border-[#E4ECF3] bg-[#FAFCFE] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/45"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"
                      style={{ color: segment.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-black text-[#174A7A]">
                        {segment.label}
                      </p>

                      <p className="mt-0.5 text-[8px] text-slate-400">
                        Click to filter
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-black text-[#0F2745]">
                    {segment.value.toLocaleString()}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <MiniSignal
            label="AI Reviewed"
            value={overview.aiReviewed}
            tone="blue"
          />
          <MiniSignal
            label="Manual Review"
            value={overview.needsManualReview}
            tone="amber"
          />
          <MiniSignal
            label="Verified"
            value={overview.verified}
            tone="emerald"
          />
          <MiniSignal
            label="Rejected"
            value={overview.rejected}
            tone="rose"
          />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="flex h-full flex-col rounded-[26px] border border-[#173D61] bg-[linear-gradient(145deg,#0B2A48,#123E64)] p-5 text-white shadow-[0_18px_44px_rgba(15,39,69,0.14)] sm:p-6"
      >
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-blue-100/45">
            Review Operations
          </p>

          <h2 className="mt-1 text-lg font-black">
            Queue performance
          </h2>

          <p className="mt-1 text-[10px] leading-5 text-blue-100/45">
            Real queue counts; zero values stay at zero instead of showing fake minimum bars.
          </p>
        </div>

        <div className="mt-6 flex-1 space-y-4">
          {queueStats.map((item, index) => {
            const width =
              item.value > 0
                ? Math.max(2, (item.value / maxQueue) * 100)
                : 0;

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="font-semibold text-blue-100/55">
                    {item.label}
                  </span>

                  <span className="font-black text-white">
                    {item.value.toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.7, delay: index * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.055] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/10 bg-cyan-200/10 text-cyan-200">
              <TimerReset className="h-4 w-4" />
            </span>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.11em] text-blue-100/45">
                Avg. completed review
              </p>

              <p className="mt-1 text-xl font-black">
                {formatReviewTime(overview.averageReviewMinutes)}
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function MiniSignal({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "emerald" | "rose";
}) {
  const styles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className={`rounded-[16px] border p-3 ${styles}`}>
      <p className="text-[7px] font-black uppercase tracking-[0.1em] opacity-60">
        {label}
      </p>

      <p className="mt-1 text-base font-black">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
