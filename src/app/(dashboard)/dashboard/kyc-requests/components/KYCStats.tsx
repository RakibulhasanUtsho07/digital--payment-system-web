"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldAlert,
  Users,
} from "lucide-react";

export interface KYCStatsData {
  pending: number;
  underReview: number;
  approvedToday: number;
  rejectedToday: number;
  highRisk: number;
  averageReviewMinutes: number;
}

const cards = [
  {
    key: "pending",
    title: "Pending Review",
    icon: FileCheck2,
    color: "blue",
  },
  {
    key: "underReview",
    title: "Under Review",
    icon: Clock3,
    color: "amber",
  },
  {
    key: "approvedToday",
    title: "Approved Today",
    icon: CheckCircle2,
    color: "emerald",
  },
  {
    key: "rejectedToday",
    title: "Rejected Today",
    icon: ShieldAlert,
    color: "rose",
  },
  {
    key: "highRisk",
    title: "High Risk",
    icon: AlertTriangle,
    color: "orange",
  },
] as const;

export default function KYCStats({
  stats,
}: {
  stats: KYCStatsData;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const value = stats[card.key];

        const iconClass = {
          blue: "bg-blue-50 text-blue-600",
          amber: "bg-amber-50 text-amber-600",
          emerald: "bg-emerald-50 text-emerald-600",
          rose: "bg-rose-50 text-rose-600",
          orange: "bg-orange-50 text-orange-600",
        }[card.color];

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {card.title}
            </p>

            <p className="mt-1 text-2xl font-black text-[#0F2745]">
              {value.toLocaleString()}
            </p>

            <div className="mt-4 flex items-end gap-1">
              {[11, 18, 15, 25, 21, 30, 27].map(
                (height, barIndex) => (
                  <motion.span
                    key={barIndex}
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{
                      duration: 0.4,
                      delay:
                        index * 0.04 +
                        barIndex * 0.03,
                    }}
                    className="w-full rounded-full bg-slate-200"
                  />
                )
              )}
            </div>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-slate-200 bg-[#0F2745] p-4 text-white shadow-sm"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Users className="h-4 w-4 text-cyan-200" />
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100/50">
          Average Review Time
        </p>

        <p className="mt-1 text-2xl font-black">
          {Math.floor(stats.averageReviewMinutes)}m{" "}
          {Math.round(
            (stats.averageReviewMinutes %
              1) *
              60
          )
            .toString()
            .padStart(2, "0")}
        </p>

        <p className="mt-2 text-[10px] text-blue-100/50">
          Current demo queue baseline
        </p>
      </motion.div>
    </div>
  );
}