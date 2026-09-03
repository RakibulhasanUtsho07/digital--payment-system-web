"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldAlert,
  TimerReset,
} from "lucide-react";

import type { KYCOverviewData } from "./KYCManagementTypes";

const tone = {
  blue: {
    icon: "border-blue-100 bg-blue-50 text-blue-600",
    bar: "bg-blue-500",
  },
  amber: {
    icon: "border-amber-100 bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
  },
  emerald: {
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
  },
  rose: {
    icon: "border-rose-100 bg-rose-50 text-rose-600",
    bar: "bg-rose-500",
  },
  orange: {
    icon: "border-orange-100 bg-orange-50 text-orange-600",
    bar: "bg-orange-500",
  },
  cyan: {
    icon: "border-cyan-100 bg-cyan-50 text-cyan-600",
    bar: "bg-cyan-500",
  },
} as const;

function formatReviewTime(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes)) {
    return "—";
  }

  const safe = Math.max(0, minutes);
  const mins = Math.floor(safe);
  const seconds = Math.round((safe - mins) * 60);

  return `${mins}m ${seconds.toString().padStart(2, "0")}s`;
}

export default function KYCStats({
  stats,
}: {
  stats: KYCOverviewData;
}) {
  const maxCount = Math.max(
    1,
    stats.pending,
    stats.underReview,
    stats.approvedToday,
    stats.rejectedToday,
    stats.highRisk
  );

  const cards = [
    {
      key: "pending",
      title: "Pending Review",
      value: stats.pending,
      helper: "Waiting to be opened",
      icon: FileCheck2,
      color: "blue" as const,
    },
    {
      key: "underReview",
      title: "Under Review",
      value: stats.underReview,
      helper: "Active compliance reviews",
      icon: Clock3,
      color: "amber" as const,
    },
    {
      key: "approvedToday",
      title: "Approved Today",
      value: stats.approvedToday,
      helper: "Finalized as verified",
      icon: CheckCircle2,
      color: "emerald" as const,
    },
    {
      key: "rejectedToday",
      title: "Rejected Today",
      value: stats.rejectedToday,
      helper: "Finalized as rejected",
      icon: ShieldAlert,
      color: "rose" as const,
    },
    {
      key: "highRisk",
      title: "High Risk",
      value: stats.highRisk,
      helper: "High / critical screening",
      icon: AlertTriangle,
      color: "orange" as const,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const style = tone[card.color];
        const progress = (card.value / maxCount) * 100;

        return (
          <motion.article
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -2 }}
            className="rounded-[22px] border border-[#DCE7F0] bg-white p-4 shadow-[0_8px_26px_rgba(15,39,69,0.04)] transition hover:border-blue-100 hover:shadow-[0_14px_34px_rgba(15,39,69,0.075)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${style.icon}`}>
                <Icon className="h-4 w-4" />
              </div>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[7px] font-black uppercase tracking-[0.09em] text-slate-400">
                Live
              </span>
            </div>

            <p className="mt-4 text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
              {card.title}
            </p>

            <p className="mt-1 text-2xl font-black text-[#0F2745]">
              {card.value.toLocaleString()}
            </p>

            <p className="mt-1 truncate text-[8px] text-slate-400">
              {card.helper}
            </p>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                transition={{ duration: 0.65, delay: 0.1 + index * 0.04 }}
                className={`h-full rounded-full ${style.bar}`}
              />
            </div>
          </motion.article>
        );
      })}

      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className="relative overflow-hidden rounded-[22px] border border-[#173D61] bg-[linear-gradient(145deg,#0B2A48,#123E64)] p-4 text-white shadow-[0_14px_35px_rgba(15,39,69,0.14)]"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07]">
            <TimerReset className="h-4 w-4 text-cyan-200" />
          </div>

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.13em] text-blue-100/45">
            Average Review Time
          </p>

          <p className="mt-1 text-2xl font-black">
            {formatReviewTime(stats.averageReviewMinutes)}
          </p>

          <p className="mt-1 text-[8px] leading-4 text-blue-100/45">
            {stats.averageReviewMinutes === null
              ? "No completed review timing yet"
              : "Based on completed reviews"}
          </p>
        </div>
      </motion.article>
    </section>
  );
}
