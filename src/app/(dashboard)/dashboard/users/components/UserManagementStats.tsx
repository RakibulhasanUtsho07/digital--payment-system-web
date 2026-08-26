"use client";

import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import type {
  UserStats,
} from "./UserManagementTypes";

const statMeta = [
  {
    key: "totalUsers",
    title: "Total Users",
    icon: Users,
    note: "+8.4% this month",
    tone: "blue",
  },
  {
    key: "activeUsers",
    title: "Active Users",
    icon: Activity,
    note: "87% of user base",
    tone: "emerald",
  },
  {
    key: "pendingKyc",
    title: "Pending KYC",
    icon: UserCheck,
    note: "Requires attention",
    tone: "amber",
  },
  {
    key: "suspended",
    title: "Suspended",
    icon: ShieldAlert,
    note: "Account restrictions",
    tone: "rose",
  },
  {
    key: "highRisk",
    title: "High Risk",
    icon: AlertTriangle,
    note: "Review recommended",
    tone: "orange",
  },
  {
    key: "newThisWeek",
    title: "New This Week",
    icon: TrendingUp,
    note: "Fresh registrations",
    tone: "cyan",
  },
] as const;

type StatTone =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "orange"
  | "cyan";

const toneMap: Record<
  StatTone,
  string
> = {
  blue:
    "bg-blue-50 text-blue-600",
  emerald:
    "bg-emerald-50 text-emerald-600",
  amber:
    "bg-amber-50 text-amber-600",
  rose:
    "bg-rose-50 text-rose-600",
  orange:
    "bg-orange-50 text-orange-600",
  cyan:
    "bg-cyan-50 text-cyan-600",
};

export default function UserManagementStats({
  stats,
}: {
  stats: UserStats;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {statMeta.map(
        (item, index) => {
          const Icon =
            item.icon;

          const value =
            stats[
              item.key
            ];

          return (
            <motion.div
              key={
                item.key
              }
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.05,
              }}
              whileHover={{
                y: -3,
              }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,0.035)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap[item.tone]}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {index === 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                    Growing
                  </span>
                )}
              </div>

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {item.title}
              </p>

              <p className="mt-1 text-2xl font-black tracking-tight text-[#0F2745]">
                {value.toLocaleString()}
              </p>

              <p className="mt-2 text-[10px] leading-4 text-slate-400">
                {item.note}
              </p>

              <div className="mt-4 flex items-end gap-1">
                {[12, 19, 15, 24, 18, 30, 26].map(
                  (
                    height,
                    barIndex
                  ) => (
                    <motion.span
                      key={
                        barIndex
                      }
                      initial={{
                        height: 0,
                      }}
                      animate={{
                        height,
                      }}
                      transition={{
                        duration:
                          0.35,
                        delay:
                          index *
                            0.05 +
                          barIndex *
                            0.03,
                      }}
                      className={`w-full rounded-full ${toneMap[item.tone].split(" ")[0].replace("bg-", "bg-")}`}
                      style={{
                        background:
                          item.tone ===
                          "emerald"
                            ? "#10B981"
                            : item.tone ===
                              "amber"
                            ? "#F59E0B"
                            : item.tone ===
                              "rose"
                            ? "#F43F5E"
                            : item.tone ===
                              "orange"
                            ? "#F97316"
                            : item.tone ===
                              "cyan"
                            ? "#06B6D4"
                            : "#3B82F6",
                        opacity:
                          0.35,
                      }}
                    />
                  )
                )}
              </div>
            </motion.div>
          );
        }
      )}
    </div>
  );
}