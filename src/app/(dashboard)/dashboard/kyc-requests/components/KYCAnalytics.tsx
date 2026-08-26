"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";

export default function KYCAnalytics({
  counts,
  onFilterStatus,
}: {
  counts: {
    verified: number;
    pending: number;
    underReview: number;
    rejected: number;
  };
  onFilterStatus: (
    status: "Verified" | "Pending" | "Under Review" | "Rejected"
  ) => void;
}) {
  const total =
    counts.verified + counts.pending + counts.underReview + counts.rejected;

  const verifiedPercent =
    total > 0 ? Math.round((counts.verified / total) * 100) : 0;

  const segments = [
    {
      label: "Verified",
      value: counts.verified,
      color: "#10B981",
      icon: CheckCircle2,
    },
    {
      label: "Pending",
      value: counts.pending,
      color: "#F59E0B",
      icon: Clock3,
    },
    {
      label: "Under Review",
      value: counts.underReview,
      color: "#3B82F6",
      icon: FileCheck2,
    },
    {
      label: "Rejected",
      value: counts.rejected,
      color: "#F43F5E",
      icon: ShieldAlert,
    },
  ];

  // Fixed Array Type: Explicitly typed as an array of tuples [string, number, string]
  const queueStats: [string, number, string][] = [
    ["Submitted", total, "#60A5FA"],
    ["Verified", counts.verified, "#34D399"],
    ["Under Review", counts.underReview, "#FBBF24"],
    ["Rejected", counts.rejected, "#FB7185"],
  ];

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
      <section className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Verification Health
            </p>

            <h2 className="mt-1 text-lg font-black text-[#0F2745]">
              Queue distribution
            </h2>
          </div>

          <BarChart3 className="h-5 w-5 text-slate-300" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-8 md:flex-row">
          <div className="relative h-44 w-44 shrink-0">
            <svg viewBox="0 0 100 100" className="-rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="11"
              />

              {segments.map((segment, index) => {
                const circumference = 2 * Math.PI * 40;

                const previous = segments
                  .slice(0, index)
                  .reduce((sum, item) => sum + item.value, 0);

                const dash =
                  total > 0 ? (segment.value / total) * circumference : 0;

                return (
                  <motion.circle
                    key={segment.label}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="11"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={
                      -((previous / Math.max(1, total)) * circumference)
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-[#0F2745]">
                {verifiedPercent}%
              </p>

              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Health
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            {segments.map((segment) => {
              const Icon = segment.icon;

              return (
                <button
                  key={segment.label}
                  type="button"
                  onClick={() =>
                    onFilterStatus(
                      segment.label as
                        | "Verified"
                        | "Pending"
                        | "Under Review"
                        | "Rejected"
                    )
                  }
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-100 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-4 w-4"
                      style={{ color: segment.color }}
                    />
                    <span className="text-[10px] font-semibold text-slate-500">
                      {segment.label}
                    </span>
                  </div>

                  <span className="text-xs font-black text-slate-800">
                    {segment.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[26px] bg-[#0F2745] p-5 text-white shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-100/50">
          Review Operations
        </p>

        <h2 className="mt-1 text-lg font-black">Queue performance</h2>

        <div className="mt-6 space-y-4">
          {queueStats.map(([label, value, color]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-blue-100/60">{label}</span>
                <span className="font-black">{String(value)}</span>
              </div>

              <div className="mt-1.5 h-2 rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(
                      5,
                      total > 0 ? (Number(value) / total) * 100 : 5
                    )}%`,
                  }}
                  transition={{ duration: 0.8 }}
                  style={{
                    backgroundColor: color,
                  }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <Clock3 className="h-4 w-4 text-cyan-200" />

            <div>
              <p className="text-[10px] font-bold text-blue-100/50">
                Avg review time
              </p>

              <p className="mt-1 text-xl font-black">6m 42s</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}