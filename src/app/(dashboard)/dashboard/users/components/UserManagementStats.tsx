"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserStats } from "./UserManagementTypes";

interface UserManagementStatsProps {
  stats: UserStats;
}

interface StatItemConfig {
  key: keyof UserStats;
  label: string;
  note: string;
  icon: LucideIcon;
  color: string;
  soft: string;
}

const STAT_ITEMS: readonly StatItemConfig[] = [
  {
    key: "totalUsers",
    label: "Total users",
    note: "All registered accounts",
    icon: Users,
    color: "#3B82F6",
    soft: "bg-blue-50 text-blue-600",
  },
  {
    key: "activeUsers",
    label: "Active users",
    note: "Currently enabled",
    icon: Activity,
    color: "#10B981",
    soft: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "pendingKyc",
    label: "Pending KYC",
    note: "Requires attention",
    icon: UserCheck,
    color: "#F59E0B",
    soft: "bg-amber-50 text-amber-600",
  },
  {
    key: "suspended",
    label: "Suspended",
    note: "Account restrictions",
    icon: ShieldAlert,
    color: "#F43F5E",
    soft: "bg-rose-50 text-rose-600",
  },
  {
    key: "highRisk",
    label: "High risk",
    note: "Review recommended",
    icon: AlertTriangle,
    color: "#F97316",
    soft: "bg-orange-50 text-orange-600",
  },
  {
    key: "newThisWeek",
    label: "New this week",
    note: "Fresh registrations",
    icon: TrendingUp,
    color: "#06B6D4",
    soft: "bg-cyan-50 text-cyan-600",
  },
] as const;

export default function UserManagementStats({
  stats,
}: UserManagementStatsProps) {
  return (
    <section
      aria-label="User statistics"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6"
    >
      {STAT_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key];

        return (
          <motion.article
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,.04)] sm:p-5"
          >
            {/* Header Icon & Status Badge */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.soft}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {index === 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700">
                  Live
                </span>
              )}
            </div>

            {/* Label, Value & Note */}
            <p className="mt-4 truncate text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight text-[#0F2745]">
              {value.toLocaleString()}
            </p>
            <p className="mt-1 truncate text-[10px] text-slate-400">
              {item.note}
            </p>

            {/* Animated Micro Bar Chart */}
            <div
              className="mt-4 flex h-7 items-end gap-1"
              aria-hidden="true"
            >
              {[12, 20, 15, 25, 18, 30, 24].map((height, barIndex) => (
                <motion.span
                  key={barIndex}
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ delay: index * 0.05 + barIndex * 0.025 }}
                  className="min-w-0 flex-1 rounded-full"
                  style={{
                    backgroundColor: item.color,
                    opacity: 0.34,
                  }}
                />
              ))}
            </div>
          </motion.article>
        );
      })}
    </section>
  );
}