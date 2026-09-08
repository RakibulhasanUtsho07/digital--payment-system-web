"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Info,
  Layers,
  Play,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  revenueApi,
  type RevenueRange,
} from "@/lib/api/revenueApi";

/* ============================================================================
   TYPES
============================================================================ */

export type TimeRange =
  | "24H"
  | "7D"
  | "30D"
  | "90D"
  | "6M"
  | "1Y";

export interface FinancialKPI {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
  sparklineData: number[];
}

export interface RevenueStream {
  id: string;
  name: string;
  amount: string;
  rawAmount: number;
  percentage: number;
  change: string;
  isPositive: boolean;
  color: string;
}

export interface RevenueInsight {
  id: string;
  title: string;
  metric: string;
  change: string;
  isPositive: boolean;
  reason: string;
  impact: string;
  category:
    | "growth"
    | "loss"
    | "opportunity";
}

/* ============================================================================
   DEMO DATA
============================================================================ */

const DEMO_KPIS: FinancialKPI[] = [
  {
    id: "gross-rev",
    label: "Gross Revenue",
    value: "৳ 1,420,500",
    change: "+14.8%",
    isPositive: true,
    subtext: "vs previous 30 days",
    sparklineData: [40, 48, 52, 58, 64, 72, 85],
  },
  {
    id: "net-rev",
    label: "Net Revenue",
    value: "৳ 1,240,500",
    change: "+12.4%",
    isPositive: true,
    subtext: "After refunds & waivers",
    sparklineData: [35, 42, 48, 51, 59, 68, 78],
  },
  {
    id: "fees-collected",
    label: "Fees Collected",
    value: "৳ 1,380,200",
    change: "+13.1%",
    isPositive: true,
    subtext: "98.7% capture rate",
    sparklineData: [38, 44, 49, 54, 61, 70, 80],
  },
  {
    id: "refunds",
    label: "Refunds & Adjustments",
    value: "৳ 180,000",
    change: "-4.6%",
    isPositive: true,
    subtext: "1.2% total volume ratio",
    sparklineData: [22, 20, 19, 18, 17, 16, 15],
  },
  {
    id: "rev-per-txn",
    label: "Revenue per Transaction",
    value: "৳ 96.50",
    change: "+5.8%",
    isPositive: true,
    subtext: "Avg fee load yield",
    sparklineData: [88, 90, 91, 93, 94, 95, 96.5],
  },
  {
    id: "rev-per-user",
    label: "Revenue per Active User",
    value: "৳ 51.20",
    change: "+7.2%",
    isPositive: true,
    subtext: "Monthly ARPU",
    sparklineData: [42, 44, 45, 47, 48, 49.5, 51.2],
  },
  {
    id: "txn-volume",
    label: "Transaction Volume",
    value: "৳ 18.42M",
    change: "+12.8%",
    isPositive: true,
    subtext: "148,290 total transfers",
    sparklineData: [12, 13.5, 14.2, 15.8, 16.5, 17.1, 18.42],
  },
  {
    id: "net-margin",
    label: "Contribution Proxy Margin",
    value: "8.7%",
    change: "+1.2%",
    isPositive: true,
    subtext: "Estimated operational net",
    sparklineData: [6.8, 7.1, 7.5, 7.8, 8.2, 8.4, 8.7],
  },
];

const DEMO_STREAMS: RevenueStream[] = [
  {
    id: "transfer",
    name: "Transfer Fees",
    amount: "৳ 480,200",
    rawAmount: 480200,
    percentage: 34.1,
    change: "+18.4%",
    isPositive: true,
    color: "#8B5CF6",
  },
  {
    id: "withdrawal",
    name: "Withdrawal Fees",
    amount: "৳ 365,000",
    rawAmount: 365000,
    percentage: 25.9,
    change: "+9.1%",
    isPositive: true,
    color: "#6366F1",
  },
  {
    id: "deposit",
    name: "Deposit Fees",
    amount: "৳ 240,800",
    rawAmount: 240800,
    percentage: 17.1,
    change: "+4.2%",
    isPositive: true,
    color: "#22D3EE",
  },
  {
    id: "service",
    name: "Service Fees",
    amount: "৳ 200,000",
    rawAmount: 200000,
    percentage: 14.2,
    change: "+14.2%",
    isPositive: true,
    color: "#10B981",
  },
  {
    id: "payment",
    name: "Merchant Payments",
    amount: "৳ 134,500",
    rawAmount: 134500,
    percentage: 8.7,
    change: "+6.5%",
    isPositive: true,
    color: "#F59E0B",
  },
];

const DEMO_INSIGHTS: RevenueInsight[] = [
  {
    id: "m-1",
    title: "Transfer Fees Surge",
    metric: "Transfer Fees",
    change: "+18.4%",
    isPositive: true,
    reason:
      "Driven by P2P QR transfers and weekend remittance spike.",
    impact: "+৳ 74,800 net contribution",
    category: "growth",
  },
  {
    id: "m-2",
    title: "Withdrawal Volume Growth",
    metric: "Withdrawal Revenue",
    change: "+9.1%",
    isPositive: true,
    reason:
      "Increased partner ATM cash-out transactions in Dhaka & Chattogram.",
    impact: "+৳ 30,500 fee revenue",
    category: "growth",
  },
  {
    id: "m-3",
    title: "Refund Rate Improvement",
    metric: "Refund Losses",
    change: "-6.8%",
    isPositive: true,
    reason:
      "Improved gateway timeout handling reduced duplicate payment reversals.",
    impact: "Saved ~৳ 13,100 in leakage",
    category: "opportunity",
  },
  {
    id: "m-4",
    title: "Premium Account Upgrades",
    metric: "Service Fees",
    change: "+14.2%",
    isPositive: true,
    reason:
      "Higher adoption of premium services among business users.",
    impact: "+৳ 24,800 recurring yield",
    category: "growth",
  },
];

/* ============================================================================
   HELPERS
============================================================================ */

function formatMoney(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  })}`;
}

function downloadCsv(
  filename: string,
  rows: string[][]
): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* ============================================================================
   HEADER
============================================================================ */

interface HeaderProps {
  onOpenReportBuilder: () => void;
  onOpenStoryMode: () => void;
  onExport: () => void;
}

const RevenueHeader: React.FC<HeaderProps> = ({
  onOpenReportBuilder,
  onOpenStoryMode,
  onExport,
}) => {
  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        relative
        mb-8
        overflow-hidden
        rounded-[30px]
        bg-gradient-to-br
        from-[#17133B]
        via-[#281A63]
        to-[#5226A6]
        p-6
        text-white
        shadow-[0_24px_65px_rgba(39,24,93,.18)]
        md:p-8
      "
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />

      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.09),transparent_35%)]" />

      <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-100 backdrop-blur-sm">
              <Activity className="h-3.5 w-3.5" />
              Revenue Intelligence
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black text-emerald-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
              System Operational
            </span>

            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-violet-100/70">
              Administrator
            </span>
          </div>

          <h1 className="max-w-3xl text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl lg:text-[42px]">
            Revenue Intelligence
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-violet-100/75 md:text-[15px]">
            Understand Coffer&apos;s fees, revenue streams, margins,
            refunds, and financial performance from one intelligent
            command center.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <HeaderStatus icon={ShieldCheck} text="Protected finance data" />
            <HeaderStatus icon={Zap} text="Live intelligence" />
            <HeaderStatus icon={Calendar} text="30 day view" />
          </div>
        </div>

        <div className="w-full shrink-0 xl:w-auto xl:min-w-[360px]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/50">
                    Finance Dataset
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    Demo Finance Dataset
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black text-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  Demo
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={onOpenStoryMode}
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    border
                    border-white/10
                    bg-white/10
                    px-2
                    text-[10px]
                    font-black
                    text-white
                    transition
                    hover:bg-white/15
                  "
                >
                  <Play className="h-3.5 w-3.5 fill-current text-violet-200" />
                  Present
                </button>

                <button
                  type="button"
                  onClick={onOpenReportBuilder}
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    bg-white
                    px-2
                    text-[10px]
                    font-black
                    text-indigo-950
                    transition
                    hover:bg-violet-50
                  "
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Report
                </button>

                <button
                  type="button"
                  onClick={onExport}
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    bg-violet-500
                    px-2
                    text-[10px]
                    font-black
                    text-white
                    shadow-[0_10px_25px_rgba(139,92,246,.25)]
                    transition
                    hover:bg-violet-400
                  "
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>

              <p className="text-[9px] text-violet-100/45">
                Updated 2 min ago • Simulation/demo finance environment
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

function HeaderStatus({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold text-violet-100/75 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-violet-200" />
      {text}
    </span>
  );
}

/* ============================================================================
   REVENUE PULSE
============================================================================ */

const RevenuePulse: React.FC = () => {
  const leftSignals = [
    {
      label: "Transfer Fees",
      value: "৳ 480.2K",
      trend: "+18.4%",
      tone: "text-violet-200",
      bg: "bg-violet-400/10",
    },
    {
      label: "Withdrawal Fees",
      value: "৳ 365.0K",
      trend: "+9.1%",
      tone: "text-cyan-200",
      bg: "bg-cyan-400/10",
    },
    {
      label: "Deposit Fees",
      value: "৳ 240.8K",
      trend: "+4.2%",
      tone: "text-emerald-200",
      bg: "bg-emerald-400/10",
    },
  ];

  const rightSignals = [
    {
      label: "Service Revenue",
      value: "৳ 200.0K",
      trend: "+14.2%",
      tone: "text-fuchsia-200",
      bg: "bg-fuchsia-400/10",
    },
    {
      label: "Merchant Payments",
      value: "৳ 134.5K",
      trend: "+6.5%",
      tone: "text-amber-200",
      bg: "bg-amber-400/10",
    },
    {
      label: "Refunds & Adjustments",
      value: "-৳ 180.0K",
      trend: "-4.6%",
      tone: "text-rose-200",
      bg: "bg-rose-400/10",
    },
  ];

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        relative
        mb-8
        overflow-hidden
        rounded-[30px]
        border
        border-violet-400/15
        bg-gradient-to-br
        from-[#17133B]
        via-[#281A63]
        to-[#5226A6]
        p-5
        text-white
        shadow-[0_24px_65px_rgba(39,24,93,.16)]
        md:p-7
      "
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-200">
            <Activity className="h-5 w-5" />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/50">
              Platform performance
            </p>

            <h2 className="mt-0.5 text-lg font-black tracking-tight text-white">
              Revenue Pulse
            </h2>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-black text-violet-100/70">
          5 live revenue signals → 1 platform net yield
        </span>
      </div>

      <div className="relative z-10 mt-7 grid grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_230px_1fr]">
        <div className="space-y-3">
          {leftSignals.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{
                opacity: 0,
                x: -18,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.08,
              }}
              className={`flex items-center justify-between rounded-[20px] border border-white/10 ${item.bg} p-4 backdrop-blur-sm transition hover:border-white/20`}
            >
              <div>
                <p className="text-[10px] font-semibold text-violet-100/50">
                  {item.label}
                </p>

                <p
                  className={`mt-1 text-base font-black ${item.tone}`}
                >
                  {item.value}
                </p>
              </div>

              <span className="rounded-full border border-emerald-300/10 bg-emerald-300/10 px-2 py-1 text-[9px] font-black text-emerald-200">
                {item.trend}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.025, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="
                relative
                flex
                h-44
                w-44
                flex-col
                items-center
                justify-center
                rounded-full
                border
                border-cyan-300/25
                bg-gradient-to-tr
                from-[#31206F]
                to-[#5A31BC]
                p-5
                text-center
                shadow-[0_0_50px_rgba(99,102,241,.22)]
              "
            >
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/60">
                Net Revenue
              </span>

              <span className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
                ৳ 1.24M
              </span>

              <span className="mt-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-200">
                +12.4% MoM
              </span>
            </motion.div>

            <motion.div
              animate={{
                scale: [1, 1.28, 1],
                opacity: [0.45, 0, 0.45],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="pointer-events-none absolute inset-0 rounded-full border border-cyan-300/35"
            />
          </div>
        </div>

        <div className="space-y-3">
          {rightSignals.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{
                opacity: 0,
                x: 18,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.08 + 0.2,
              }}
              className={`flex items-center justify-between rounded-[20px] border border-white/10 ${item.bg} p-4 backdrop-blur-sm transition hover:border-white/20`}
            >
              <div>
                <p className="text-[10px] font-semibold text-violet-100/50">
                  {item.label}
                </p>

                <p
                  className={`mt-1 text-base font-black ${item.tone}`}
                >
                  {item.value}
                </p>
              </div>

              <span className="rounded-full border border-emerald-300/10 bg-emerald-300/10 px-2 py-1 text-[9px] font-black text-emerald-200">
                {item.trend}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

/* ============================================================================
   KPI GRID
============================================================================ */

const RevenueKPIGrid: React.FC<{
  onSelectKPI: (kpi: FinancialKPI) => void;
}> = ({ onSelectKPI }) => {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            Executive metrics
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
            Financial KPI Dashboard
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Click any KPI to inspect the current metric.
          </p>
        </div>

        <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-[9px] font-black text-muted-foreground sm:block">
          {DEMO_KPIS.length} indicators
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_KPIS.map((kpi, index) => {
          const max =
            Math.max(...kpi.sparklineData);

          return (
            <motion.button
              key={kpi.id}
              type="button"
              onClick={() => onSelectKPI(kpi)}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.045,
              }}
              whileHover={{
                y: -4,
              }}
              className="
                group
                relative
                overflow-hidden
                rounded-[22px]
                border
                border-border
                bg-card
                p-5
                text-left
                shadow-sm
                transition-all
                hover:border-violet-300
                hover:shadow-[0_18px_40px_rgba(109,40,217,.09)]
                dark:hover:border-violet-700
              "
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-violet-500/5 blur-2xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-300">
                    {kpi.label}
                  </span>

                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-black ${
                      kpi.isPositive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                    }`}
                  >
                    {kpi.isPositive ? (
                      <ArrowUpRight className="mr-0.5 h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="mr-0.5 h-3 w-3" />
                    )}

                    {kpi.change}
                  </span>
                </div>

                <p className="mt-3 text-2xl font-black tracking-[-0.035em] text-foreground">
                  {kpi.value}
                </p>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] text-muted-foreground">
                    {kpi.subtext}
                  </p>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-300" />
                </div>

                <div className="mt-4 flex h-8 items-end gap-1 border-t border-border pt-3">
                  {kpi.sparklineData.map((value, i) => {
                    const height =
                      Math.max(
                        16,
                        Math.round(
                          (value / max) * 100
                        )
                      );

                    return (
                      <span
                        key={i}
                        className={`w-full rounded-t-sm transition-all ${
                          kpi.isPositive
                            ? "bg-violet-500/15 group-hover:bg-violet-500"
                            : "bg-rose-400/20 group-hover:bg-rose-500"
                        }`}
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

/* ============================================================================
   WHAT MOVED REVENUE
============================================================================ */

const WhatMovedRevenue: React.FC = () => {
  const getTone = (
    category: RevenueInsight["category"]
  ) => {
    if (category === "loss") {
      return {
        badge:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
        icon:
          "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300",
        bar:
          "from-rose-400 to-orange-300",
      };
    }

    if (category === "opportunity") {
      return {
        badge:
          "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300",
        icon:
          "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300",
        bar:
          "from-violet-400 to-fuchsia-300",
      };
    }

    return {
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
      icon:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300",
      bar:
        "from-violet-500 via-indigo-500 to-cyan-400",
    };
  };

  return (
    <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_.75fr]">
      <motion.div
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
        }}
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-border
          bg-card
          p-5
          shadow-sm
          md:p-6
        "
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/5 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{
                rotate: [0, 6, -4, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                Revenue movement intelligence
              </p>

              <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">
                What Moved Revenue?
              </h3>

              <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                The strongest signals behind fee growth,
                savings, and recurring platform yield.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[9px] font-black text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-violet-500" />
            Signal snapshot
          </span>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {DEMO_INSIGHTS.map(
            (insight, index) => {
              const tone =
                getTone(insight.category);

              return (
                <motion.article
                  key={insight.id}
                  initial={{
                    opacity: 0,
                    y: 12,
                    scale: 0.985,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    delay:
                      index * 0.06,
                  }}
                  whileHover={{
                    y: -3,
                  }}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-[22px]
                    border
                    border-border
                    bg-background
                    p-4
                    shadow-sm
                    transition-shadow
                    hover:shadow-md
                  "
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${tone.bar}`}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
                      >
                        {insight.category ===
                        "opportunity" ? (
                          <Zap className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black leading-5 text-foreground">
                          {insight.title}
                        </p>

                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                          {insight.metric}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${tone.badge}`}
                    >
                      {insight.change}
                    </span>
                  </div>

                  <p className="mt-3 min-h-10 text-[11px] leading-5 text-muted-foreground">
                    {insight.reason}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[10px] font-black text-violet-600 dark:text-violet-300">
                      {insight.impact}
                    </span>

                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 transition-transform group-hover:translate-x-1 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </motion.article>
              );
            }
          )}
        </div>
      </motion.div>

      <motion.aside
        initial={{
          opacity: 0,
          x: 16,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.45,
        }}
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-violet-400/15
          bg-gradient-to-br
          from-[#17133B]
          via-[#281A63]
          to-[#5226A6]
          p-6
          text-white
          shadow-[0_22px_55px_rgba(39,24,93,.16)]
        "
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-amber-300">
                <Sun className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-100/45">
                  Revenue health
                </p>

                <h3 className="mt-0.5 text-lg font-black text-white">
                  Revenue Weather
                </h3>
              </div>
            </div>

            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-200">
              Stable
            </span>
          </div>

          <div className="mt-7 flex items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.55, 0.15, 0.55],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full border border-cyan-200/15"
              />

              <svg
                className="h-full w-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-white/10"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                <motion.path
                  className="text-cyan-300"
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  initial={{
                    pathLength: 0,
                  }}
                  animate={{
                    pathLength: 0.91,
                  }}
                  transition={{
                    duration: 1.1,
                    ease: "easeOut",
                  }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute text-center">
                <p className="text-2xl font-black text-white">
                  91
                </p>

                <p className="text-[8px] font-black uppercase tracking-wider text-cyan-100/45">
                  score
                </p>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/60">
                Strong efficiency
              </p>

              <p className="mt-1 text-sm font-bold leading-5 text-white">
                Growth remains healthy while refund exposure stays controlled.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              ["Growth", "14.8%"],
              ["Margin", "8.7%"],
              ["Refund", "1.2%"],
            ].map(([label, value], index) => (
              <motion.div
                key={label}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    0.15 +
                    index * 0.06,
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
              >
                <p className="text-[8px] font-bold uppercase tracking-wide text-violet-100/35">
                  {label}
                </p>

                <p className="mt-1 text-xs font-black text-cyan-100">
                  {value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-[9px] text-violet-100/35">
          <span>Growth • Margin • Refund Rate</span>
          <span className="font-black text-cyan-200/75">
            Live model UI
          </span>
        </div>
      </motion.aside>
    </section>
  );
};

/* ============================================================================
   STREAMS
============================================================================ */

const RevenueStreamsOrbit: React.FC<{
  onSelectStream: (
    stream: RevenueStream
  ) => void;
}> = ({ onSelectStream }) => {
  const [activeTab, setActiveTab] = useState<
    "orbit" | "matrix"
  >("orbit");

  const totalRevenue = useMemo(
    () =>
      DEMO_STREAMS.reduce(
        (sum, stream) =>
          sum + stream.rawAmount,
        0
      ),
    []
  );

  const positions = [
    "left-[66%] top-[29%]",
    "left-[58%] top-[70%]",
    "left-[22%] top-[60%]",
    "left-[20%] top-[24%]",
    "left-[48%] top-[8%]",
  ];

  const matrixPoints = [
    {
      label: "Transfers",
      x: 78,
      y: 58,
      size: 88,
      amount: "34.1%",
      className:
        "border-violet-300 bg-violet-500/15 text-violet-700 dark:text-violet-200",
    },
    {
      label: "Withdrawals",
      x: 36,
      y: 28,
      size: 78,
      amount: "25.9%",
      className:
        "border-cyan-300 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200",
    },
    {
      label: "Deposits",
      x: 61,
      y: 67,
      size: 66,
      amount: "17.1%",
      className:
        "border-emerald-300 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
    },
    {
      label: "Service",
      x: 45,
      y: 49,
      size: 60,
      amount: "14.2%",
      className:
        "border-fuchsia-300 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200",
    },
    {
      label: "Merchant",
      x: 70,
      y: 76,
      size: 54,
      amount: "8.7%",
      className:
        "border-amber-300 bg-amber-500/15 text-amber-700 dark:text-amber-200",
    },
  ];

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        relative
        mb-8
        overflow-hidden
        rounded-[30px]
        border
        border-border
        bg-card
        p-5
        shadow-sm
        md:p-6
      "
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
            <Layers className="h-5 w-5" />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              Revenue architecture
            </p>

            <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">
              Revenue Streams & Economics
            </h3>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Explore yield concentration, fee efficiency, and transaction-volume economics.
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit rounded-2xl border border-border bg-background p-1">
          {[
            ["orbit", "Revenue Orbit"],
            ["matrix", "Economics Matrix"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setActiveTab(
                  value as
                    | "orbit"
                    | "matrix"
                )
              }
              className={`relative rounded-xl px-3 py-2 text-[9px] font-black transition sm:text-[10px] ${
                activeTab === value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === value && (
                <motion.span
                  layoutId="revenue-orbit-tab"
                  className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              <span className="relative z-10">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "orbit" ? (
          <motion.div
            key="orbit"
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="relative z-10 mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]"
          >
            <div
              className="
                relative
                min-h-[390px]
                overflow-hidden
                rounded-[26px]
                border
                border-violet-400/15
                bg-gradient-to-br
                from-[#17133B]
                via-[#281A63]
                to-[#5226A6]
                p-5
                text-white
                shadow-[0_20px_45px_rgba(39,24,93,.16)]
              "
            >
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,.10)_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/10" />

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 26,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15"
              >
                <span className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.8)]" />
              </motion.div>

              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.025, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-[24px] border border-white/10 bg-white/[0.07] px-6 py-5 backdrop-blur-md"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-200/60">
                    Total Platform Yield
                  </p>

                  <p className="mt-2 whitespace-nowrap text-3xl font-black tracking-tight text-white">
                    {formatMoney(totalRevenue)}
                  </p>

                  <p className="mt-1 text-[9px] text-violet-100/40">
                    100% gross fee revenue
                  </p>
                </motion.div>
              </div>

              {DEMO_STREAMS.map(
                (stream, index) => (
                  <motion.button
                    key={stream.id}
                    type="button"
                    onClick={() =>
                      onSelectStream(
                        stream
                      )
                    }
                    initial={{
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: [0, -5, 0],
                    }}
                    transition={{
                      opacity: {
                        delay:
                          0.08 *
                          index,
                      },
                      scale: {
                        delay:
                          0.08 *
                          index,
                      },
                      y: {
                        delay:
                          index *
                          0.25,
                        duration:
                          3.5 +
                          index *
                            0.15,
                        repeat:
                          Infinity,
                        ease: "easeInOut",
                      },
                    }}
                    whileHover={{
                      scale: 1.07,
                    }}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2.5 text-left backdrop-blur-md shadow-lg ${positions[index]}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            stream.color,
                        }}
                      />

                      <span className="max-w-[90px] truncate text-[9px] font-black text-white/70">
                        {stream.name}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-black text-cyan-200">
                      {stream.percentage}%
                    </p>
                  </motion.button>
                )
              )}
            </div>

            <div className="space-y-3">
              {DEMO_STREAMS.map(
                (stream, index) => (
                  <motion.button
                    key={stream.id}
                    type="button"
                    onClick={() =>
                      onSelectStream(
                        stream
                      )
                    }
                    initial={{
                      opacity: 0,
                      x: 10,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.05,
                    }}
                    whileHover={{
                      x: 3,
                    }}
                    className="
                      group
                      w-full
                      rounded-[20px]
                      border
                      border-border
                      bg-background
                      p-4
                      text-left
                      transition
                      hover:border-violet-300
                      hover:shadow-md
                      dark:hover:border-violet-700
                    "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-9 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              stream.color,
                          }}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-foreground">
                            {stream.name}
                          </p>

                          <p className="mt-0.5 text-[9px] text-muted-foreground">
                            {stream.percentage}% of platform revenue
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-foreground">
                          {stream.amount}
                        </p>

                        <p className="mt-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-300">
                          {stream.change}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${stream.percentage}%`,
                        }}
                        transition={{
                          duration: 0.55,
                        }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            stream.color,
                        }}
                      />
                    </div>
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="matrix"
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="relative z-10 mt-6 overflow-hidden rounded-[26px] border border-border bg-background p-4 md:p-6"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                  Interactive economics field
                </p>

                <p className="mt-1 text-sm font-black text-foreground">
                  Revenue per transaction × transaction volume
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-[8px] font-bold text-muted-foreground">
                <span className="rounded-full border border-border bg-card px-2.5 py-1">
                  X = Volume
                </span>

                <span className="rounded-full border border-border bg-card px-2.5 py-1">
                  Y = Yield / txn
                </span>

                <span className="rounded-full border border-border bg-card px-2.5 py-1">
                  Size = Total yield
                </span>
              </div>
            </div>

            <div className="relative h-[360px] overflow-hidden rounded-[22px] border border-border bg-card">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,hsl(var(--border)/.6)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/.6)_1px,transparent_1px)] [background-size:48px_48px]" />

              <div className="absolute bottom-8 left-10 right-5 h-px bg-border" />

              <div className="absolute bottom-8 left-10 top-5 w-px bg-border" />

              <span className="absolute bottom-2 right-5 text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                Transaction volume →
              </span>

              <span className="absolute left-2 top-5 [writing-mode:vertical-rl] rotate-180 text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                Revenue / txn →
              </span>

              {matrixPoints.map(
                (point, index) => (
                  <motion.div
                    key={point.label}
                    initial={{
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      delay:
                        index * 0.08,
                      type: "spring",
                      stiffness: 180,
                      damping: 16,
                    }}
                    whileHover={{
                      scale: 1.08,
                      zIndex: 30,
                    }}
                    className={`absolute flex -translate-x-1/2 translate-y-1/2 cursor-default flex-col items-center justify-center rounded-full border text-center shadow-sm backdrop-blur ${point.className}`}
                    style={{
                      left: `${point.x}%`,
                      bottom: `${point.y}%`,
                      width: point.size,
                      height: point.size,
                    }}
                  >
                    <span className="text-[9px] font-black leading-3">
                      {point.label}
                    </span>

                    <span className="mt-1 text-xs font-black">
                      {point.amount}
                    </span>
                  </motion.div>
                )
              )}

              <div className="absolute bottom-12 left-14 rounded-xl border border-violet-200 bg-card/90 px-3 py-2 text-[8px] font-bold text-violet-600 shadow-sm backdrop-blur dark:border-violet-800 dark:text-violet-300">
                High yield / lower volume
              </div>

              <div className="absolute right-6 top-8 rounded-xl border border-emerald-200 bg-card/90 px-3 py-2 text-[8px] font-bold text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-800 dark:text-emerald-300">
                High volume / efficient yield
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

/* ============================================================================
   FEE OPTIMIZATION
============================================================================ */

const FeeOptimizationLab: React.FC = () => {
  const [transferFee, setTransferFee] =
    useState(10);

  const [withdrawalFee, setWithdrawalFee] =
    useState(18);

  const [estMonthlyTxns, setEstMonthlyTxns] =
    useState(150000);

  const [policyLoaded, setPolicyLoaded] =
    useState(false);

  const [simulation, setSimulation] =
    useState<
      Awaited<
        ReturnType<
          typeof revenueApi.simulate
        >
      >["simulation"] | null
    >(null);

  const [isSimulating, setIsSimulating] =
    useState(false);

  const [simulationError, setSimulationError] =
    useState("");

  useEffect(() => {
    let active = true;

    const loadPolicy = async () => {
      try {
        const response =
          await revenueApi.getFeePolicy();

        if (!active) return;

        setTransferFee(
          response.policy
            .transferFeeMinor / 100
        );

        setWithdrawalFee(
          response.policy
            .withdrawalFeeMinor / 100
        );

        setEstMonthlyTxns(
          response.policy.monthlyTxnEstimate
        );

        setPolicyLoaded(true);
      } catch (error) {
        if (!active) return;

        setPolicyLoaded(true);

        setSimulationError(
          error instanceof Error
            ? error.message
            : "Unable to load the current fee policy."
        );
      }
    };

    void loadPolicy();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!policyLoaded) return;

    let active = true;

    const timer = window.setTimeout(
      async () => {
        setIsSimulating(true);
        setSimulationError("");

        try {
          const response =
            await revenueApi.simulate({
              transferFeeMinor:
                Math.round(
                  transferFee * 100
                ),
              withdrawalFeeMinor:
                Math.round(
                  withdrawalFee * 100
                ),
              monthlyTransactions:
                estMonthlyTxns,
            });

          if (active) {
            setSimulation(
              response.simulation
            );
          }
        } catch (error) {
          if (active) {
            setSimulationError(
              error instanceof Error
                ? error.message
                : "Unable to run the revenue simulation."
            );
          }
        } finally {
          if (active) {
            setIsSimulating(false);
          }
        }
      },
      280
    );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    estMonthlyTxns,
    policyLoaded,
    transferFee,
    withdrawalFee,
  ]);

  const projectedRevenue =
    (simulation?.projectedRevenueMinor ??
      0) / 100;

  const difference =
    (simulation?.differenceMinor ?? 0) / 100;

  const transferContribution =
    (simulation?.transferContributionMinor ??
      0) / 100;

  const withdrawalContribution =
    (simulation?.withdrawalContributionMinor ??
      0) / 100;

  const transferMix = simulation
    ? simulation.assumptions
        .transferShare * 100
    : 0;

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        relative
        mb-8
        overflow-hidden
        rounded-[30px]
        border
        border-border
        bg-card
        p-5
        shadow-sm
        md:p-7
      "
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="relative z-10 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{
              rotate: [0, 4, -4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
          >
            <Sliders className="h-5 w-5" />
          </motion.div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              Pricing intelligence sandbox
            </p>

            <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">
              Fee Optimization Lab
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Test pricing scenarios against the backend projection model without changing production fees.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[9px] font-black text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Simulation only
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[9px] font-black text-muted-foreground">
            {isSimulating ? (
              <RefreshCcw className="h-3.5 w-3.5 animate-spin text-violet-500" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}

            {isSimulating
              ? "Recalculating"
              : "Model ready"}
          </span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(330px,.7fr)]">
        <div className="rounded-[26px] border border-border bg-background p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm font-black text-foreground">
                Scenario Controls
              </p>

              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Adjust inputs to recalculate projected monthly yield.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-violet-200 bg-violet-50 p-2 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300 sm:block">
              <Zap className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-7">
            <FeeSlider
              label="P2P Transfer Fee"
              description="Fixed fee applied to each simulated P2P transfer."
              value={transferFee}
              suffix=" / txn"
              min={0}
              max={25}
              step={1}
              minLabel="৳0"
              currentLabel="Pricing range"
              maxLabel="৳25"
              onChange={setTransferFee}
            />

            <FeeSlider
              label="ATM Withdrawal Fee"
              description="Fixed fee applied to each simulated cash-out."
              value={withdrawalFee}
              suffix=" / txn"
              min={5}
              max={40}
              step={1}
              minLabel="৳5"
              currentLabel="Pricing range"
              maxLabel="৳40"
              onChange={setWithdrawalFee}
            />

            <div>
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-foreground">
                    Estimated Monthly Transactions
                  </p>

                  <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                    Monthly volume used by the backend projection model.
                  </p>
                </div>

                <span className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 font-mono text-[10px] font-black text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                  {estMonthlyTxns.toLocaleString()} txns
                </span>
              </div>

              <input
                type="range"
                min="50000"
                max="300000"
                step="10000"
                value={estMonthlyTxns}
                onChange={(event) =>
                  setEstMonthlyTxns(
                    Number(event.target.value)
                  )
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-violet-600"
              />

              <div className="mt-2 flex justify-between text-[8px] font-bold text-muted-foreground">
                <span>50K</span>
                <span>150K</span>
                <span>300K</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="
            relative
            overflow-hidden
            rounded-[26px]
            border
            border-violet-400/15
            bg-gradient-to-br
            from-[#17133B]
            via-[#281A63]
            to-[#5226A6]
            p-5
            text-white
            shadow-[0_20px_45px_rgba(39,24,93,.16)]
            md:p-6
          "
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-100/45">
              Projected Monthly Yield
            </p>

            <motion.div
              key={Math.round(
                projectedRevenue
              )}
              initial={{
                opacity: 0,
                y: 5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl"
            >
              {formatMoney(
                projectedRevenue
              )}
            </motion.div>

            {simulation && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black ${
                  difference >= 0
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-rose-300/20 bg-rose-300/10 text-rose-200"
                }`}
              >
                {difference >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}

                {difference >= 0
                  ? "+"
                  : "-"}
                ৳{" "}
                {Math.abs(
                  difference
                ).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 0,
                  }
                )}

                <span className="opacity-70">
                  (
                  {simulation.percentageChange.toFixed(
                    1
                  )}
                  %)
                </span>
              </motion.div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <ProjectionMetric
                label="Transfers"
                value={formatMoney(
                  transferContribution
                )}
                detail={`${transferMix.toFixed(
                  0
                )}% mix`}
              />

              <ProjectionMetric
                label="Withdrawals"
                value={formatMoney(
                  withdrawalContribution
                )}
                detail={`${
                  simulation
                    ? (
                        simulation
                          .assumptions
                          .withdrawalShare *
                        100
                      ).toFixed(0)
                    : 0
                }% mix`}
              />
            </div>

            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-wide text-violet-100/40">
                  Projected contribution mix
                </span>

                <span className="text-[9px] font-black text-cyan-200">
                  {transferMix.toFixed(0)}
                  {" / "}
                  {(100 - transferMix).toFixed(
                    0
                  )}
                </span>
              </div>

              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${transferMix}%`,
                  }}
                  className="h-full bg-cyan-300"
                />

                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${
                      100 -
                      transferMix
                    }%`,
                  }}
                  className="h-full bg-violet-300/50"
                />
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-[18px] border border-cyan-200/10 bg-cyan-100/[0.04] p-3 text-[9px] leading-5 text-violet-100/45">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200/70" />

              <span>
                Backend simulation applies current transaction mix and
                elasticity assumptions. No production pricing is changed.
              </span>
            </div>

            {simulationError && (
              <div className="mt-3 flex items-start gap-2 rounded-[18px] border border-amber-300/15 bg-amber-300/10 p-3 text-[9px] leading-5 text-amber-100">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {simulationError}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

function FeeSlider({
  label,
  description,
  value,
  suffix,
  min,
  max,
  step,
  minLabel,
  currentLabel,
  maxLabel,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  currentLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
}) {
  const progress =
    ((value - min) /
      (max - min)) *
    100;

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-foreground">
            {label}
          </p>

          <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>

        <span className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 font-mono text-[10px] font-black text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
          ৳ {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value)
          )
        }
        style={{
          background:
            `linear-gradient(90deg, #8B5CF6 ${progress}%, ` +
            `hsl(var(--muted)) ${progress}%)`,
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-violet-600"
      />

      <div className="mt-2 flex justify-between text-[8px] font-bold text-muted-foreground">
        <span>{minLabel}</span>
        <span>{currentLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ProjectionMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3.5">
      <p className="text-[8px] font-black uppercase tracking-wide text-violet-100/40">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-black text-cyan-100">
        {value}
      </p>

      <p className="mt-1 text-[8px] text-violet-100/35">
        {detail}
      </p>
    </div>
  );
};

/* ============================================================================
   LEAKAGE MONITOR
============================================================================ */

const RevenueLeakageMonitor: React.FC = () => {
  const [range, setRange] =
    useState<RevenueRange>("30D");

  const [leakage, setLeakage] =
    useState<
      Awaited<
        ReturnType<
          typeof revenueApi.getLeakage
        >
      > | null
    >(null);

  const [contributors, setContributors] =
    useState<
      Awaited<
        ReturnType<
          typeof revenueApi.getContributors
        >
      >["contributors"]
    >([]);

  const [contributorLimit, setContributorLimit] =
    useState(4);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    investigatingCategory,
    setInvestigatingCategory,
  ] = useState<string | null>(null);

  const loadRevenueSignals =
    async () => {
      setIsLoading(true);
      setError("");

      try {
        const [
          leakageResponse,
          contributorsResponse,
        ] = await Promise.all([
          revenueApi.getLeakage(
            range
          ),
          revenueApi.getContributors(
            range,
            contributorLimit
          ),
        ]);

        setLeakage(
          leakageResponse
        );

        setContributors(
          contributorsResponse.contributors
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load revenue protection intelligence."
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    void loadRevenueSignals();
  }, [
    contributorLimit,
    range,
  ]);

  const startInvestigation =
    async (category: string) => {
      setInvestigatingCategory(
        category
      );

      try {
        await revenueApi.investigateLeakage({
          category,
          range,
          note:
            "Investigation opened from Revenue Intelligence dashboard.",
        });

        await loadRevenueSignals();
      } catch (investigateError) {
        setError(
          investigateError instanceof Error
            ? investigateError.message
            : "Unable to start the leakage investigation."
        );
      } finally {
        setInvestigatingCategory(
          null
        );
      }
    };

  const totalLeakage =
    (leakage?.totalLeakageMinor ??
      0) / 100;

  return (
    <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <motion.section
        initial={{
          opacity: 0,
          x: -12,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        className="relative overflow-hidden rounded-[30px] border border-border bg-card p-5 shadow-sm md:p-6"
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-rose-500/5 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-500">
                Revenue protection
              </p>

              <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">
                Leakage Monitor
              </h3>

              <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                Detect fee reversals, waivers and micro-fee losses before
                they become recurring leakage.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={range}
              onChange={(event) =>
                setRange(
                  event.target
                    .value as RevenueRange
                )
              }
              className="h-9 rounded-xl border border-border bg-background px-3 text-[9px] font-black text-foreground outline-none"
            >
              <option value="7D">
                7D
              </option>

              <option value="30D">
                30D
              </option>

              <option value="90D">
                90D
              </option>

              <option value="1Y">
                1Y
              </option>
            </select>

            <motion.span
              key={Math.round(
                totalLeakage
              )}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[9px] font-black text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
            >
              Est.{" "}
              {formatMoney(
                totalLeakage
              )}
            </motion.span>
          </div>
        </div>

        <div className="relative z-10 mt-5 space-y-3">
          {isLoading ? (
            <RevenueLoadingState label="Scanning revenue leakage signals..." />
          ) : leakage &&
            leakage.signals.length >
              0 ? (
            leakage.signals.map(
              (item, index) => (
                <motion.article
                  key={item.id}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index * 0.04,
                  }}
                  className="rounded-[20px] border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-foreground">
                          {item.category}
                        </span>

                        <LeakageRiskBadge
                          risk={
                            item.riskLevel
                          }
                        />

                        {item.investigationStatus !==
                          "none" && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[8px] font-black capitalize text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                            {
                              item.investigationStatus
                            }
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        {item.reason}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-violet-600 dark:text-violet-300">
                        <Eye className="h-3.5 w-3.5" />
                        {item.action}
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-lg font-black text-rose-600 dark:text-rose-300">
                        {formatMoney(
                          item.amountMinor /
                            100
                        )}
                      </p>

                      <p className="mt-0.5 text-[8px] text-muted-foreground">
                        {item.sourceEventCount.toLocaleString()} source events
                      </p>

                      <button
                        type="button"
                        disabled={
                          investigatingCategory ===
                          item.category
                        }
                        onClick={() =>
                          void startInvestigation(
                            item.category
                          )
                        }
                        className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-black text-violet-600 transition hover:text-violet-500 dark:text-violet-300"
                      >
                        {investigatingCategory ===
                        item.category ? (
                          <RefreshCcw className="h-3 w-3 animate-spin" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}

                        {investigatingCategory ===
                        item.category
                          ? "Opening..."
                          : item.investigationStatus ===
                            "none"
                          ? "Investigate"
                          : "Review investigation"}
                      </button>
                    </div>
                  </div>
                </motion.article>
              )
            )
          ) : (
            <RevenueEmptyState
              icon="shield"
              title="No leakage detected"
              text="No revenue leakage events were found for the selected period."
            />
          )}

          {error && (
            <RevenueDataNotice
              message={error}
              onRetry={() =>
                void loadRevenueSignals()
              }
            />
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{
          opacity: 0,
          x: 12,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        className="relative overflow-hidden rounded-[30px] border border-border bg-card p-5 shadow-sm md:p-6"
      >
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                Contribution intelligence
              </p>

              <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">
                Top Revenue Contributors
              </h3>

              <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
                Accounts ranked by captured platform fees during the selected
                period.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setContributorLimit(
                (current) =>
                  current === 4
                    ? 12
                    : 4
              )
            }
            className="shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-[9px] font-black text-muted-foreground transition hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700 dark:hover:text-violet-300"
          >
            {contributorLimit === 4
              ? "View All"
              : "Top 4"}
          </button>
        </div>

        <div className="relative z-10 mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-0.5">
          {isLoading ? (
            <RevenueLoadingState label="Ranking revenue contributors..." />
          ) : contributors.length >
            0 ? (
            contributors.map(
              (user, index) => {
                const maxFees =
                  Math.max(
                    ...contributors.map(
                      (item) =>
                        item.feesPaidMinor
                    ),
                    1
                  );

                const share =
                  (user.feesPaidMinor /
                    maxFees) *
                  100;

                return (
                  <motion.article
                    key={user.id}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.04,
                    }}
                    className="rounded-[20px] border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-[9px] font-black ${
                            index === 0
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                              : index === 1
                              ? "border-border bg-muted text-muted-foreground"
                              : "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
                          }`}
                        >
                          #{index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-black text-foreground">
                              {user.name}
                            </span>

                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[8px] font-black text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                              {user.type}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-[9px] text-muted-foreground">
                            {user.email} •{" "}
                            {user.transactionsCount.toLocaleString()}{" "}
                            txns
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-foreground">
                          {formatMoney(
                            user.feesPaidMinor /
                              100
                          )}
                        </p>

                        <p className="mt-1 text-[9px] text-muted-foreground">
                          Vol{" "}
                          {formatMoney(
                            user.volumeMinor /
                              100
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${share}%`,
                        }}
                        transition={{
                          duration:
                            0.55,
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400"
                      />
                    </div>
                  </motion.article>
                );
              }
            )
          ) : (
            <RevenueEmptyState
              icon="users"
              title="No contributor data yet"
              text="No captured contributor revenue events are available for this period."
            />
          )}
        </div>
      </motion.section>
    </section>
  );
};

function LeakageRiskBadge({
  risk,
}: {
  risk:
    | "High"
    | "Medium"
    | "Low";
}) {
  const tone =
    risk === "High"
      ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
      : risk === "Medium"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[8px] font-black ${tone}`}
    >
      {risk} Risk
    </span>
  );
}

function RevenueLoadingState({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-background p-6 text-center">
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1.1,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
      >
        <RefreshCcw className="h-4 w-4" />
      </motion.div>

      <p className="mt-3 text-[9px] font-bold text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function RevenueEmptyState({
  icon,
  title,
  text,
}: {
  icon:
    | "shield"
    | "users";
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-background p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
        {icon === "shield" ? (
          <ShieldAlert className="h-5 w-5" />
        ) : (
          <Users className="h-5 w-5" />
        )}
      </div>

      <p className="mt-3 text-sm font-black text-foreground">
        {title}
      </p>

      <p className="mt-1 max-w-sm text-[9px] leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function RevenueDataNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />

        <div className="min-w-0">
          <p className="text-[9px] font-black text-amber-800 dark:text-amber-200">
            Revenue data source unavailable
          </p>

          <p className="mt-0.5 truncate text-[8px] text-amber-700/70 dark:text-amber-200/60">
            {message}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-amber-200 bg-background px-3 py-1.5 text-[8px] font-black text-amber-700 dark:border-amber-800 dark:text-amber-300"
      >
        <RefreshCcw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
};

/* ============================================================================
   STORY MODE
============================================================================ */

const RevenueStoryMode: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({
  isOpen,
  onClose,
}) => {
  const [slide, setSlide] =
    useState(0);

  const slides = [
    {
      title:
        "Executive Revenue Summary",
      subtitle:
        "Coffer MoM Revenue Overview & Yield Performance",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              [
                "Gross Revenue",
                "৳ 1.42M",
                "+14.8%",
              ],
              [
                "Net Yield",
                "৳ 1.24M",
                "+12.4%",
              ],
              [
                "Total Volume",
                "৳ 18.42M",
                "148,290 txns",
              ],
            ].map(
              ([label, value, meta]) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5"
                >
                  <p className="text-[9px] font-black uppercase tracking-wider text-violet-100/45">
                    {label}
                  </p>

                  <p className="mt-2 text-2xl font-black text-white">
                    {value}
                  </p>

                  <p className="mt-1 text-[9px] font-black text-emerald-300">
                    {meta}
                  </p>
                </div>
              )
            )}
          </div>

          <p className="text-sm leading-7 text-violet-100/70">
            Coffer achieved steady revenue acceleration this
            period, anchored primarily by P2P transfer growth
            and increased cash-out activity.
          </p>
        </div>
      ),
    },
    {
      title:
        "Fee Stream Contribution",
      subtitle:
        "Breakdown of Revenue Sources across Coffer",
      content: (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            {DEMO_STREAMS.map(
              (stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <span className="text-sm font-black text-white">
                    {stream.name}
                  </span>

                  <span className="text-[10px] font-mono font-black text-cyan-300">
                    {stream.amount} (
                    {stream.percentage}
                    %)
                  </span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.05] p-6 text-center">
            <div>
              <Layers className="mx-auto h-9 w-9 text-violet-300" />

              <h4 className="mt-4 text-lg font-black text-white">
                Stream Dominance
              </h4>

              <p className="mt-2 text-xs leading-6 text-violet-100/55">
                Transfer Fees continue to represent the
                largest singular contribution at 34.1%
                of total yield.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        className="
          fixed
          inset-0
          z-[100]
          flex
          flex-col
          bg-gradient-to-br
          from-[#0F0B2B]
          via-[#17133B]
          to-[#281A63]
          p-5
          text-white
          sm:p-7
        "
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-cyan-300/10 bg-cyan-300/10 px-3 py-1 text-[9px] font-black text-cyan-300">
              REVENUE STORY MODE
            </span>

            <span className="text-[9px] text-violet-100/45">
              Slide {slide + 1} of{" "}
              {slides.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-violet-100/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto my-auto w-full max-w-5xl py-8">
          <motion.div
            key={slide}
            initial={{
              opacity: 0,
              x: 24,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.3,
            }}
          >
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              {slides[slide].title}
            </h2>

            <p className="mt-2 text-sm text-cyan-300">
              {slides[slide].subtitle}
            </p>

            <div className="mt-8">
              {slides[slide].content}
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            type="button"
            disabled={
              slide === 0
            }
            onClick={() =>
              setSlide(
                (value) =>
                  value - 1
              )
            }
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-30"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {slides.map(
              (_, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() =>
                    setSlide(index)
                  }
                  className={`h-2.5 w-2.5 rounded-full ${
                    index === slide
                      ? "bg-cyan-300"
                      : "bg-white/15"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              )
            )}
          </div>

          {slide <
          slides.length - 1 ? (
            <button
              type="button"
              onClick={() =>
                setSlide(
                  (value) =>
                    value + 1
                )
              }
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-[10px] font-black text-white hover:bg-violet-500"
            >
              Next Slide
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black text-white hover:bg-emerald-500"
            >
              Finish
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ============================================================================
   REPORT MODAL
============================================================================ */

const RevenueReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({
  isOpen,
  onClose,
}) => {
  const [reportType, setReportType] =
    useState(
      "Executive Revenue Summary"
    );

  const [period, setPeriod] =
    useState("30D");

  if (!isOpen) {
    return null;
  }

  const generateReport =
    () => {
      downloadCsv(
        `coffer-revenue-report-${period.toLowerCase()}.csv`,
        [
          [
            "Report Type",
            reportType,
          ],
          [
            "Period",
            period,
          ],
          [],
          [
            "KPI",
            "Value",
            "Change",
            "Subtext",
          ],
          ...DEMO_KPIS.map(
            (kpi) => [
              kpi.label,
              kpi.value,
              kpi.change,
              kpi.subtext,
            ]
          ),
        ]
      );

      onClose();
    };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="w-full max-w-lg rounded-[28px] border border-border bg-card p-6 shadow-2xl md:p-7"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-300">
                Reporting
              </p>

              <h3 className="mt-1 text-xl font-black text-foreground">
                Generate Revenue Report
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              Report Template
            </label>

            <select
              value={reportType}
              onChange={(event) =>
                setReportType(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground outline-none focus:border-violet-500"
            >
              <option>
                Executive Revenue Summary
              </option>

              <option>
                Fee Stream Breakdown & Yield
              </option>

              <option>
                Refund & Adjustment Audit
              </option>

              <option>
                Revenue Leakage & Recovery
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              Time Horizon
            </label>

            <div className="grid grid-cols-4 gap-2">
              {[
                "7D",
                "30D",
                "90D",
                "1Y",
              ].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() =>
                    setPeriod(value)
                  }
                  className={`rounded-xl border py-2.5 text-[10px] font-black transition ${
                    period === value
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-border bg-background text-muted-foreground hover:border-violet-300"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-background py-3 text-xs font-black text-foreground transition hover:bg-muted"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={generateReport}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-black text-white transition hover:bg-violet-500"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ============================================================================
   DETAIL DRAWER
============================================================================ */

const RevenueDetailDrawer: React.FC<{
  kpi: FinancialKPI | null;
  stream: RevenueStream | null;
  onClose: () => void;
}> = ({
  kpi,
  stream,
  onClose,
}) => {
  if (!kpi && !stream) {
    return null;
  }

  const title =
    kpi?.label ??
    stream?.name ??
    "";

  const value =
    kpi?.value ??
    stream?.amount ??
    "";

  return (
    <div className="fixed inset-0 z-[105] flex justify-end bg-slate-950/50 backdrop-blur-sm">
      <motion.aside
        initial={{
          x: "100%",
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x: "100%",
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 30,
        }}
        className="
          flex
          h-full
          w-full
          max-w-md
          flex-col
          justify-between
          overflow-y-auto
          border-l
          border-border
          bg-card
          p-6
          shadow-2xl
        "
      >
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-300">
                Revenue detail
              </p>

              <h3 className="mt-1 text-lg font-black text-foreground">
                {title}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[22px] border border-border bg-background p-5">
              <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                Selected Detail Yield
              </p>

              <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
                {value}
              </p>

              {kpi && (
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-1 text-[9px] font-black ${
                      kpi.isPositive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                    }`}
                  >
                    {kpi.change}
                  </span>

                  <span className="text-[9px] text-muted-foreground">
                    {kpi.subtext}
                  </span>
                </div>
              )}

              {stream && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Revenue share
                    </span>

                    <span className="font-black text-foreground">
                      {stream.percentage}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${stream.percentage}%`,
                        backgroundColor:
                          stream.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-muted-foreground">
                      Period change
                    </span>

                    <span className="font-black text-emerald-600 dark:text-emerald-300">
                      {stream.change}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-950/20">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />

                <div>
                  <p className="text-sm font-black text-violet-900 dark:text-violet-100">
                    Analytics context
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-violet-800/70 dark:text-violet-200/70">
                    Detailed drill-down inspection for this
                    revenue category. Revenue intelligence can
                    be connected to transaction-level records,
                    partner costs, fee capture and refund data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          Close Detail View
        </button>
      </motion.aside>
    </div>
  );
};

/* ============================================================================
   MAIN PAGE
============================================================================ */

export default function RevenueIntelligencePage() {
  const [selectedKPI, setSelectedKPI] =
    useState<FinancialKPI | null>(
      null
    );

  const [selectedStream, setSelectedStream] =
    useState<RevenueStream | null>(
      null
    );

  const [isStoryModeOpen, setIsStoryModeOpen] =
    useState(false);

  const [isReportModalOpen, setIsReportModalOpen] =
    useState(false);

  const exportRevenueData =
    () => {
      downloadCsv(
        "coffer-revenue-intelligence.csv",
        [
          [
            "Revenue KPI",
            "Value",
            "Change",
            "Status",
            "Subtext",
          ],
          ...DEMO_KPIS.map(
            (item) => [
              item.label,
              item.value,
              item.change,
              item.isPositive
                ? "Positive"
                : "Negative",
              item.subtext,
            ]
          ),
          [],
          [
            "Revenue Stream",
            "Amount",
            "Raw Amount",
            "Percentage",
            "Change",
          ],
          ...DEMO_STREAMS.map(
            (stream) => [
              stream.name,
              stream.amount,
              String(
                stream.rawAmount
              ),
              `${stream.percentage}%`,
              stream.change,
            ]
          ),
        ]
      );
    };

  return (
    <>
      <main
        className="
          min-h-screen
          bg-background
          p-4
          font-sans
          text-foreground
          sm:p-6
          md:p-8
        "
      >
        <RevenueHeader
          onOpenReportBuilder={() =>
            setIsReportModalOpen(
              true
            )
          }
          onOpenStoryMode={() =>
            setIsStoryModeOpen(
              true
            )
          }
          onExport={
            exportRevenueData
          }
        />

        <RevenuePulse />

        <RevenueKPIGrid
          onSelectKPI={(kpi) =>
            setSelectedKPI(kpi)
          }
        />

        <WhatMovedRevenue />

        <RevenueStreamsOrbit
          onSelectStream={(stream) =>
            setSelectedStream(
              stream
            )
          }
        />

        <FeeOptimizationLab />

        <RevenueLeakageMonitor />

        <div className="pb-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[8px] font-bold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
            Revenue Intelligence • Protected Admin Workspace
          </div>
        </div>
      </main>

      <RevenueStoryMode
        isOpen={isStoryModeOpen}
        onClose={() =>
          setIsStoryModeOpen(false)
        }
      />

      <RevenueReportModal
        isOpen={isReportModalOpen}
        onClose={() =>
          setIsReportModalOpen(false)
        }
      />

      <AnimatePresence>
        {(selectedKPI ||
          selectedStream) && (
          <RevenueDetailDrawer
            kpi={selectedKPI}
            stream={selectedStream}
            onClose={() => {
              setSelectedKPI(null);
              setSelectedStream(
                null
              );
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}