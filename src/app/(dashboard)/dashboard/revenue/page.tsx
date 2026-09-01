// src/app/(dashboard)/dashboard/revenue/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldAlert,
  Layers,
  Activity,
  Play,
  X,
  ChevronRight,
  Sliders,
  Download,
  RefreshCcw,
  Sun,
  CloudLightning,
  BarChart3,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  PieChart,
  Users,
  MapPin,
  Filter,
  Info,
  Calendar,
  Check,
  Eye
} from "lucide-react";

import {
  revenueApi,
  type RevenueRange,
} from "@/lib/api/revenueApi";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TimeRange = "24H" | "7D" | "30D" | "90D" | "6M" | "1Y";

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

export interface FeeConfigItem {
  id: string;
  type: string;
  fixedAmount: number;
  percentageRate: number;
  minFee: number;
  maxFee: number;
  volumeShare: string;
}

export interface RevenueInsight {
  id: string;
  title: string;
  metric: string;
  change: string;
  isPositive: boolean;
  reason: string;
  impact: string;
  category: "growth" | "loss" | "opportunity";
}

export interface RevenueLeakage {
  id: string;
  category: string;
  amount: string;
  rawAmount: number;
  reason: string;
  riskLevel: "High" | "Medium" | "Low";
  action: string;
}

export interface TopUserRevenue {
  id: string;
  name: string;
  email: string;
  type: "VIP" | "Business" | "Premium" | "Standard";
  volume: string;
  feesPaid: string;
  transactionsCount: number;
}

// ============================================================================
// TYPED DEMO DATASETS
// ============================================================================

const DEMO_KPIS: FinancialKPI[] = [
  {
    id: "gross-rev",
    label: "Gross Revenue",
    value: "৳ 1,420,500",
    change: "+14.8%",
    isPositive: true,
    subtext: "vs previous 30 days",
    sparklineData: [40, 48, 52, 58, 64, 72, 85]
  },
  {
    id: "net-rev",
    label: "Net Revenue",
    value: "৳ 1,240,500",
    change: "+12.4%",
    isPositive: true,
    subtext: "After refunds & waivers",
    sparklineData: [35, 42, 48, 51, 59, 68, 78]
  },
  {
    id: "fees-collected",
    label: "Fees Collected",
    value: "৳ 1,380,200",
    change: "+13.1%",
    isPositive: true,
    subtext: "98.7% capture rate",
    sparklineData: [38, 44, 49, 54, 61, 70, 80]
  },
  {
    id: "refunds",
    label: "Refunds & Adjustments",
    value: "৳ 180,000",
    change: "-4.6%",
    isPositive: true,
    subtext: "1.2% total volume ratio",
    sparklineData: [22, 20, 19, 18, 17, 16, 15]
  },
  {
    id: "rev-per-txn",
    label: "Revenue per Transaction",
    value: "৳ 96.50",
    change: "+5.8%",
    isPositive: true,
    subtext: "Avg fee load yield",
    sparklineData: [88, 90, 91, 93, 94, 95, 96.5]
  },
  {
    id: "rev-per-user",
    label: "Revenue per Active User",
    value: "৳ 51.20",
    change: "+7.2%",
    isPositive: true,
    subtext: "Monthly ARPU",
    sparklineData: [42, 44, 45, 47, 48, 49.5, 51.2]
  },
  {
    id: "txn-volume",
    label: "Transaction Volume",
    value: "৳ 18.42M",
    change: "+12.8%",
    isPositive: true,
    subtext: "148,290 total transfers",
    sparklineData: [12, 13.5, 14.2, 15.8, 16.5, 17.1, 18.42]
  },
  {
    id: "net-margin",
    label: "Contribution Proxy Margin",
    value: "8.7%",
    change: "+1.2%",
    isPositive: true,
    subtext: "Estimated operational net",
    sparklineData: [6.8, 7.1, 7.5, 7.8, 8.2, 8.4, 8.7]
  }
];

const DEMO_STREAMS: RevenueStream[] = [
  { id: "transfer", name: "Transfer Fees", amount: "৳ 480,200", rawAmount: 480200, percentage: 34.1, change: "+18.4%", isPositive: true, color: "#1F5EA8" },
  { id: "withdrawal", name: "Withdrawal Fees", amount: "৳ 365,000", rawAmount: 365000, percentage: 25.9, change: "+9.1%", isPositive: true, color: "#173F6D" },
  { id: "deposit", name: "Deposit Fees", amount: "৳ 240,800", rawAmount: 240800, percentage: 17.1, change: "+4.2%", isPositive: true, color: "#22D3EE" },
  { id: "service", name: "Service Fees", amount: "৳ 200,000", rawAmount: 200000, percentage: 14.2, change: "+14.2%", isPositive: true, color: "#10B981" },
  { id: "payment", name: "Merchant Payments", amount: "৳ 134,500", rawAmount: 134500, percentage: 8.7, change: "+6.5%", isPositive: true, color: "#F59E0B" }
];

const DEMO_INSIGHTS: RevenueInsight[] = [
  {
    id: "m-1",
    title: "Transfer Fees Surge",
    metric: "Transfer Fees",
    change: "+18.4%",
    isPositive: true,
    reason: "Driven by P2P Bangla-QR transfers and weekend remittance spike.",
    impact: "+৳ 74,800 net contribution",
    category: "growth"
  },
  {
    id: "m-2",
    title: "Withdrawal Volume Growth",
    metric: "Withdrawal Revenue",
    change: "+9.1%",
    isPositive: true,
    reason: "Increased partner ATM cash-out transactions in Dhaka & Chattogram.",
    impact: "+৳ 30,500 fee revenue",
    category: "growth"
  },
  {
    id: "m-3",
    title: "Refund Rate Improvement",
    metric: "Refund Losses",
    change: "-6.8%",
    isPositive: true,
    reason: "Improved gateway timeout handling reduced duplicate payment reversals.",
    impact: "Saved ~৳ 13,100 in leakage",
    category: "opportunity"
  },
  {
    id: "m-4",
    title: "Premium Account Upgrades",
    metric: "Service Fees",
    change: "+14.2%",
    isPositive: true,
    reason: "Higher adoption of NovaWallet VIP subscription tier among business users.",
    impact: "+৳ 24,800 recurring yield",
    category: "growth"
  }
];

const DEMO_LEAKAGES: RevenueLeakage[] = [
  {
    id: "l-1",
    category: "Gateway Fee Reversals",
    amount: "৳ 18,400",
    rawAmount: 18400,
    reason: "Failed bank settlement after initial user confirmation",
    riskLevel: "High",
    action: "Review Gateway Timeout Thresholds"
  },
  {
    id: "l-2",
    category: "Manual Fee Waivers",
    amount: "৳ 14,200",
    rawAmount: 14200,
    reason: "Support level 2 concessions granted on disputed transfers",
    riskLevel: "Medium",
    action: "Enforce Approval Cap on Waivers"
  },
  {
    id: "l-3",
    category: "Uncaptured Micro-Fees",
    amount: "৳ 10,200",
    rawAmount: 10200,
    reason: "Rounding discrepancies in sub-percentage tier calculations",
    riskLevel: "Low",
    action: "Adjust Precision in Fee Calculation Engine"
  }
];

const DEMO_FEE_CONFIGS: FeeConfigItem[] = [
  { id: "cfg-1", type: "P2P Transfer Fee", fixedAmount: 5, percentageRate: 0.5, minFee: 5, maxFee: 50, volumeShare: "38.2%" },
  { id: "cfg-2", type: "ATM Withdrawal Fee", fixedAmount: 15, percentageRate: 1.0, minFee: 15, maxFee: 150, volumeShare: "26.4%" },
  { id: "cfg-3", type: "Bank Deposit Fee", fixedAmount: 0, percentageRate: 0.2, minFee: 0, maxFee: 30, volumeShare: "18.1%" },
  { id: "cfg-4", type: "Merchant Payment Fee", fixedAmount: 2, percentageRate: 1.2, minFee: 2, maxFee: 200, volumeShare: "17.3%" }
];

const DEMO_TOP_USERS: TopUserRevenue[] = [
  { id: "usr-1", name: "Rahim Textiles Ltd", email: "finance@rahimtextiles.bd", type: "Business", volume: "৳ 2,450,000", feesPaid: "৳ 28,400", transactionsCount: 412 },
  { id: "usr-2", name: "Tanvir Ahmed", email: "tanvir.a@techbd.com", type: "VIP", volume: "৳ 1,820,000", feesPaid: "৳ 19,800", transactionsCount: 289 },
  { id: "usr-3", name: "Sylhet Traders", email: "contact@sylhettraders.com", type: "Business", volume: "৳ 1,410,000", feesPaid: "৳ 15,200", transactionsCount: 198 },
  { id: "usr-4", name: "Nusrat Jahan", email: "nusrat.j@example.com", type: "Premium", volume: "৳ 980,000", feesPaid: "৳ 11,400", transactionsCount: 145 }
];

// ============================================================================
// COMPONENT 1: REVENUE COMMAND HEADER
// ============================================================================

interface HeaderProps {
  onOpenReportBuilder: () => void;
  onOpenStoryMode: () => void;
}

const RevenueHeader: React.FC<HeaderProps> = ({ onOpenReportBuilder, onOpenStoryMode }) => (
  <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-[#0F2745] tracking-tight">Revenue Intelligence</h1>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Revenue System Operational
          </span>
          <span className="px-2.5 py-1 bg-slate-200/80 text-slate-700 text-xs font-bold rounded-full border border-slate-300">
            Administrator
          </span>
          <span className="px-2.5 py-1 bg-[#173F6D]/10 text-[#173F6D] text-xs font-bold rounded-full border border-[#173F6D]/20">
            Finance Operations
          </span>
        </div>
      </div>
      <p className="text-slate-500 text-sm md:text-base">
        Understand NovaWallet&apos;s fees, revenue streams, margins, refunds, and financial performance from one command center.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
      <div className="text-xs text-slate-400 hidden xl:block mr-2 font-mono">
        Updated 2 min ago • <span className="text-amber-600 font-semibold">Demo Finance Dataset</span>
      </div>
      <button
        onClick={onOpenStoryMode}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#0F2745] text-cyan-400 border border-slate-800 rounded-xl hover:bg-[#173F6D] transition-colors text-sm font-semibold shadow-md"
      >
        <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" /> Present Revenue
      </button>
      <button
        onClick={onOpenReportBuilder}
        className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#173F6D] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm"
      >
        <FileSpreadsheet className="w-4 h-4" /> Report Builder
      </button>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1F5EA8] text-white rounded-xl hover:bg-[#173F6D] transition-colors text-sm font-semibold shadow-md shadow-blue-900/20">
        <Download className="w-4 h-4" /> Export Data
      </button>
    </div>
  </header>
);

// ============================================================================
// COMPONENT 2: SIGNATURE VISUAL — REVENUE PULSE
// ============================================================================

const RevenuePulse: React.FC = () => {
  return (
    <div className="bg-[#0F2745] text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl border border-slate-800 mb-8">
      {/* Dynamic Background Glow */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#1F5EA8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title & Tag */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">Revenue Pulse</h2>
        </div>
        <span className="text-xs font-mono bg-[#173F6D] text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30">
          5 Live Revenue Signals → 1 Platform Net Yield
        </span>
      </div>

      {/* Orbital / Flow Diagram */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        {/* Left Signals */}
        <div className="lg:col-span-2 space-y-3">
          {[
            { label: "Transfer Fees", value: "৳ 480.2K", trend: "+18.4%", color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Withdrawal Fees", value: "৳ 365.0K", trend: "+9.1%", color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { label: "Deposit Fees", value: "৳ 240.8K", trend: "+4.2%", color: "text-emerald-400", bg: "bg-emerald-500/10" }
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3.5 rounded-2xl border border-slate-700/60 ${item.bg} backdrop-blur-sm flex justify-between items-center hover:border-slate-500 transition-colors`}
            >
              <div>
                <span className="text-xs text-slate-400 font-medium block">{item.label}</span>
                <span className={`text-base font-bold ${item.color}`}>{item.value}</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                {item.trend}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Central Net Yield Anchor */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center my-4 lg:my-0">
          <div className="relative">
            <motion.div
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-[#173F6D] to-[#1F5EA8] border-2 border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.25)] flex flex-col items-center justify-center text-center p-3 relative z-10"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <span className="text-xs text-cyan-200 uppercase tracking-wider font-semibold">Net Revenue</span>
              <span className="text-2xl font-black text-white my-1">৳ 1.24M</span>
              <span className="text-[10px] text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                +12.4% MoM
              </span>
            </motion.div>
            {/* Animated Pulsing Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border border-cyan-400/50 pointer-events-none"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Right Signals */}
        <div className="lg:col-span-2 space-y-3">
          {[
            { label: "Service Revenue", value: "৳ 200.0K", trend: "+14.2%", color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Merchant Payments", value: "৳ 134.5K", trend: "+6.5%", color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Refunds & Adjustments", value: "-৳ 180.0K", trend: "-4.6%", color: "text-rose-400", bg: "bg-rose-500/10" }
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 + 0.3 }}
              className={`p-3.5 rounded-2xl border border-slate-700/60 ${item.bg} backdrop-blur-sm flex justify-between items-center hover:border-slate-500 transition-colors`}
            >
              <div>
                <span className="text-xs text-slate-400 font-medium block">{item.label}</span>
                <span className={`text-base font-bold ${item.color}`}>{item.value}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${item.label.includes('Refunds') ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50'}`}>
                {item.trend}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT 3: EXECUTIVE FINANCIAL KPIS
// ============================================================================

interface KPIGridProps {
  onSelectKPI: (kpi: FinancialKPI) => void;
}

const RevenueKPIGrid: React.FC<KPIGridProps> = ({ onSelectKPI }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {DEMO_KPIS.map((kpi, idx) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelectKPI(kpi)}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-[#1F5EA8]/40 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#1F5EA8] transition-colors">
              {kpi.label}
            </span>
            <span
              className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                kpi.isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {kpi.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {kpi.change}
            </span>
          </div>

          <div className="text-2xl font-black text-[#0F2745] tracking-tight mb-1">{kpi.value}</div>
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>{kpi.subtext}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1F5EA8] group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Micro Sparkline Preview */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-1 h-8">
            {kpi.sparklineData.map((val, i) => {
              const max = Math.max(...kpi.sparklineData);
              const heightPct = Math.round((val / max) * 100);
              return (
                <div
                  key={i}
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-sm transition-all ${
                    kpi.isPositive ? "bg-[#1F5EA8]/20 group-hover:bg-[#1F5EA8]" : "bg-rose-400/30 group-hover:bg-rose-500"
                  }`}
                />
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// COMPONENT 4: "WHAT MOVED REVENUE?" & REVENUE WEATHER
// ============================================================================

const WhatMovedRevenue: React.FC = () => {
  const insightTone = (
    category: RevenueInsight["category"]
  ) => {
    if (category === "loss") {
      return {
        badge:
          "border-rose-200 bg-rose-50 text-rose-700",
        glow: "bg-rose-200/40",
        bar: "from-rose-400 to-orange-300",
        iconBg: "bg-rose-50 text-rose-600",
      };
    }

    if (category === "opportunity") {
      return {
        badge:
          "border-violet-200 bg-violet-50 text-violet-700",
        glow: "bg-violet-200/40",
        bar: "from-violet-400 to-fuchsia-300",
        iconBg: "bg-violet-50 text-violet-600",
      };
    }

    return {
      badge:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      glow: "bg-cyan-200/40",
      bar: "from-[#1F5EA8] via-cyan-400 to-emerald-300",
      iconBg: "bg-blue-50 text-[#1F5EA8]",
    };
  };

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[30px] border border-[#D7E3EF] bg-gradient-to-br from-white via-[#F8FBFF] to-[#EEF5FB] p-5 shadow-[0_18px_50px_rgba(15,39,69,0.08)] md:p-6 lg:col-span-2"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-cyan-200/25 blur-3xl" />

        <div className="relative z-10 mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, 8, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#1F5EA8] shadow-sm"
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5D88AF]">
                Revenue Movement Intelligence
              </p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-[#0F2745]">
                What Moved Revenue?
              </h3>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                The strongest signals behind fee growth, savings, and recurring platform yield.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[10px] font-black text-[#1F5EA8] shadow-sm">
            <Activity className="h-3.5 w-3.5" />
            Signal snapshot
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {DEMO_INSIGHTS.map((insight, index) => {
            const tone = insightTone(insight.category);

            return (
              <motion.article
                key={insight.id}
                initial={{ opacity: 0, y: 14, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.06 * index, duration: 0.35 }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-[22px] border border-[#DCE7F1] bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,39,69,0.04)] backdrop-blur transition-shadow hover:shadow-[0_16px_35px_rgba(15,39,69,0.10)]"
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full ${tone.glow} blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${tone.bar}`} />

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone.iconBg}`}>
                      {insight.category === "opportunity" ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black leading-5 text-[#173F6D]">
                        {insight.title}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {insight.metric}
                      </p>
                    </div>
                  </div>

                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${tone.badge}`}>
                    {insight.change}
                  </span>
                </div>

                <p className="relative z-10 mt-3 min-h-10 text-[11px] leading-5 text-slate-500">
                  {insight.reason}
                </p>

                <div className="relative z-10 mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-black text-[#1F5EA8]">
                    {insight.impact}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#1F5EA8] transition-transform group-hover:translate-x-1">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <motion.aside
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="relative flex min-h-[330px] flex-col justify-between overflow-hidden rounded-[30px] border border-[#173F6D] bg-gradient-to-br from-[#0D2947] via-[#123B61] to-[#1A5685] p-6 text-white shadow-[0_20px_55px_rgba(15,39,69,0.18)]"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-amber-300">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/55">
                  Revenue Health
                </p>
                <h3 className="mt-0.5 text-lg font-black">Revenue Weather</h3>
              </div>
            </div>

            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-black text-emerald-200">
              Stable
            </span>
          </div>

          <div className="mt-7 flex items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border border-cyan-200/15"
                animate={{ scale: [1, 1.1, 1], opacity: [0.55, 0.15, 0.55] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
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
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 0.91 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-black">91</p>
                <p className="text-[8px] font-black uppercase tracking-wider text-cyan-100/55">score</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200/70">
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
              >
                <p className="text-[8px] font-bold uppercase tracking-wide text-blue-100/45">{label}</p>
                <p className="mt-1 text-xs font-black text-cyan-100">{value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[9px] text-blue-100/45">
          <span>Growth • Margin • Refund Rate</span>
          <span className="font-black text-cyan-200/80">Live model UI</span>
        </div>
      </motion.aside>
    </div>
  );
};

// ============================================================================
// COMPONENT 5: REVENUE STREAMS ORBIT & FEE ECONOMICS MATRIX
// ============================================================================

interface StreamsOrbitProps {
  onSelectStream: (stream: RevenueStream) => void;
}

const RevenueStreamsOrbit: React.FC<StreamsOrbitProps> = ({ onSelectStream }) => {
  const [activeTab, setActiveTab] = useState<"orbit" | "matrix">("orbit");

  const totalRevenue = DEMO_STREAMS.reduce(
    (sum, stream) => sum + stream.rawAmount,
    0
  );

  const matrixPoints = [
    {
      label: "Transfers",
      x: 78,
      y: 58,
      size: 88,
      amount: "34.1%",
      className: "border-blue-300 bg-blue-500/15 text-blue-700",
    },
    {
      label: "Withdrawals",
      x: 36,
      y: 28,
      size: 78,
      amount: "25.9%",
      className: "border-cyan-300 bg-cyan-500/15 text-cyan-700",
    },
    {
      label: "Deposits",
      x: 61,
      y: 67,
      size: 66,
      amount: "17.1%",
      className: "border-emerald-300 bg-emerald-500/15 text-emerald-700",
    },
    {
      label: "Service",
      x: 45,
      y: 49,
      size: 60,
      amount: "14.2%",
      className: "border-violet-300 bg-violet-500/15 text-violet-700",
    },
    {
      label: "Merchant",
      x: 70,
      y: 76,
      size: 54,
      amount: "8.7%",
      className: "border-amber-300 bg-amber-500/15 text-amber-700",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative mb-8 overflow-hidden rounded-[30px] border border-[#D7E3EF] bg-white p-5 shadow-[0_18px_50px_rgba(15,39,69,0.07)] md:p-6"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-100/55 blur-3xl" />

      <div className="relative z-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#1F5EA8]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5D88AF]">
              Revenue Architecture
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[#0F2745]">
              Revenue Streams & Economics
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Explore yield concentration, fee efficiency, and transaction-volume economics.
            </p>
          </div>
        </div>

        <div className="inline-flex w-fit rounded-2xl border border-[#D7E3EF] bg-[#F4F8FC] p-1 shadow-inner">
          {[
            ["orbit", "Revenue Orbit"],
            ["matrix", "Economics Matrix"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as "orbit" | "matrix")}
              className={`relative rounded-xl px-3.5 py-2 text-[10px] font-black transition-colors sm:text-xs ${
                activeTab === value
                  ? "text-[#0F2745]"
                  : "text-slate-500 hover:text-[#173F6D]"
              }`}
            >
              {activeTab === value && (
                <motion.span
                  layoutId="revenue-tab-active"
                  className="absolute inset-0 rounded-xl border border-blue-100 bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "orbit" ? (
          <motion.div
            key="orbit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]"
          >
            <div className="relative min-h-[390px] overflow-hidden rounded-[26px] border border-[#173F6D] bg-gradient-to-br from-[#0D2947] via-[#123B61] to-[#164E7A] p-5 text-white shadow-[0_20px_45px_rgba(15,39,69,0.16)]">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/10" />

              <motion.div
                className="absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
              >
                <span className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.8)]" />
              </motion.div>

              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
                <motion.div
                  animate={{ scale: [1, 1.025, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-[24px] border border-white/10 bg-white/[0.08] px-6 py-5 backdrop-blur-md shadow-[0_15px_45px_rgba(0,0,0,0.16)]"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
                    Total Platform Yield
                  </p>
                  <p className="mt-2 whitespace-nowrap text-3xl font-black tracking-tight text-white">
                    ৳ {totalRevenue.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[10px] text-blue-100/45">
                    100% gross fee revenue
                  </p>
                </motion.div>
              </div>

              {DEMO_STREAMS.map((stream, index) => {
                const positions = [
                  "left-[66%] top-[29%]",
                  "left-[58%] top-[70%]",
                  "left-[22%] top-[60%]",
                  "left-[20%] top-[24%]",
                  "left-[48%] top-[8%]",
                ];

                return (
                  <motion.button
                    key={stream.id}
                    type="button"
                    onClick={() => onSelectStream(stream)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: [0, -5, 0],
                    }}
                    transition={{
                      opacity: { delay: 0.08 * index },
                      scale: { delay: 0.08 * index },
                      y: {
                        delay: index * 0.35,
                        duration: 3.5 + index * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                    whileHover={{ scale: 1.07 }}
                    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-white/[0.08] px-3 py-2.5 text-left backdrop-blur-md shadow-lg ${positions[index]}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: stream.color }}
                      />
                      <span className="max-w-[88px] truncate text-[9px] font-black text-white/75">
                        {stream.name}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-black text-cyan-200">
                      {stream.percentage}%
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="space-y-3">
              {DEMO_STREAMS.map((stream, index) => (
                <motion.button
                  key={stream.id}
                  type="button"
                  onClick={() => onSelectStream(stream)}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 3 }}
                  className="group w-full rounded-[20px] border border-[#DCE7F1] bg-gradient-to-r from-white to-[#F8FBFE] p-4 text-left transition-shadow hover:shadow-[0_12px_28px_rgba(15,39,69,0.08)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-9 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: stream.color }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#173F6D]">
                          {stream.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {stream.percentage}% of platform revenue
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-[#0F2745]">{stream.amount}</p>
                      <p className="mt-0.5 text-[10px] font-black text-emerald-600">{stream.change}</p>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stream.percentage}%` }}
                      transition={{ delay: 0.15 + index * 0.05, duration: 0.55 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stream.color }}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 overflow-hidden rounded-[26px] border border-[#D7E3EF] bg-gradient-to-br from-[#FBFDFF] to-[#F1F6FA] p-4 md:p-6"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5D88AF]">
                  Interactive economics field
                </p>
                <p className="mt-1 text-sm font-black text-[#173F6D]">
                  Revenue per transaction × transaction volume
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-400">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">X = Volume</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Y = Yield / txn</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Size = Total yield</span>
              </div>
            </div>

            <div className="relative h-[360px] overflow-hidden rounded-[22px] border border-[#DCE7F1] bg-white">
              <div className="absolute inset-0 [background-image:linear-gradient(to_right,#EAF0F5_1px,transparent_1px),linear-gradient(to_bottom,#EAF0F5_1px,transparent_1px)] [background-size:48px_48px]" />
              <div className="absolute bottom-8 left-10 right-5 h-px bg-[#BFD0DE]" />
              <div className="absolute bottom-8 left-10 top-5 w-px bg-[#BFD0DE]" />

              <span className="absolute bottom-2 right-5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                Transaction volume →
              </span>
              <span className="absolute left-2 top-5 [writing-mode:vertical-rl] rotate-180 text-[9px] font-black uppercase tracking-wider text-slate-400">
                Revenue / txn →
              </span>

              {matrixPoints.map((point, index) => (
                <motion.div
                  key={point.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.08,
                    type: "spring",
                    stiffness: 180,
                    damping: 16,
                  }}
                  whileHover={{ scale: 1.08, zIndex: 30 }}
                  className={`absolute flex -translate-x-1/2 translate-y-1/2 cursor-default flex-col items-center justify-center rounded-full border text-center shadow-sm backdrop-blur ${point.className}`}
                  style={{
                    left: `${point.x}%`,
                    bottom: `${point.y}%`,
                    width: point.size,
                    height: point.size,
                  }}
                >
                  <span className="text-[9px] font-black leading-3">{point.label}</span>
                  <span className="mt-1 text-xs font-black">{point.amount}</span>
                </motion.div>
              ))}

              <div className="absolute bottom-12 left-14 rounded-xl border border-blue-100 bg-white/90 px-3 py-2 text-[9px] font-bold text-[#1F5EA8] shadow-sm backdrop-blur">
                High yield / lower volume
              </div>
              <div className="absolute right-6 top-8 rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 text-[9px] font-bold text-emerald-700 shadow-sm backdrop-blur">
                High volume / efficient yield
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

// ============================================================================
// COMPONENT 6: FEE CONFIGURATION & FEE OPTIMIZATION LAB / SIMULATOR
// ============================================================================

const FeeOptimizationLab: React.FC = () => {
  const [transferFee, setTransferFee] = useState<number>(10);
  const [withdrawalFee, setWithdrawalFee] = useState<number>(18);
  const [estMonthlyTxns, setEstMonthlyTxns] = useState<number>(150000);
  const [policyLoaded, setPolicyLoaded] = useState(false);
  const [simulation, setSimulation] = useState<Awaited<ReturnType<typeof revenueApi.simulate>>["simulation"] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState("");

  useEffect(() => {
    let active = true;

    const loadPolicy = async () => {
      try {
        const response = await revenueApi.getFeePolicy();
        if (!active) return;

        setTransferFee(response.policy.transferFeeMinor / 100);
        setWithdrawalFee(response.policy.withdrawalFeeMinor / 100);
        setEstMonthlyTxns(response.policy.monthlyTxnEstimate);
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
    const timer = window.setTimeout(async () => {
      setIsSimulating(true);
      setSimulationError("");

      try {
        const response = await revenueApi.simulate({
          transferFeeMinor: Math.round(transferFee * 100),
          withdrawalFeeMinor: Math.round(withdrawalFee * 100),
          monthlyTransactions: estMonthlyTxns,
        });

        if (active) setSimulation(response.simulation);
      } catch (error) {
        if (active) {
          setSimulationError(
            error instanceof Error
              ? error.message
              : "Unable to run the revenue simulation."
          );
        }
      } finally {
        if (active) setIsSimulating(false);
      }
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [estMonthlyTxns, policyLoaded, transferFee, withdrawalFee]);

  const projectedRevenue = (simulation?.projectedRevenueMinor ?? 0) / 100;
  const difference = (simulation?.differenceMinor ?? 0) / 100;
  const transferContribution = (simulation?.transferContributionMinor ?? 0) / 100;
  const withdrawalContribution = (simulation?.withdrawalContributionMinor ?? 0) / 100;
  const transferMix = simulation ? simulation.assumptions.transferShare * 100 : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative mb-8 overflow-hidden rounded-[30px] border border-[#D6E4F0] bg-gradient-to-br from-white via-[#F8FBFF] to-[#EEF6FC] p-5 shadow-[0_18px_55px_rgba(15,39,69,0.08)] md:p-7"
    >
      <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-200/25 blur-3xl" />

      <div className="relative z-10 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#1F5EA8] shadow-sm"
          >
            <Sliders className="h-5 w-5" />
          </motion.div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5D88AF]">
              Pricing Intelligence Sandbox
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-[#0F2745]">
              Fee Optimization Lab
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Test pricing scenarios against the backend projection model without changing production fees.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Simulation only
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[10px] font-black text-[#1F5EA8] shadow-sm">
            {isSimulating ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {isSimulating ? "Recalculating" : "Model ready"}
          </span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(330px,0.7fr)]">
        <div className="rounded-[26px] border border-[#D8E6F1] bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,39,69,0.04)] backdrop-blur md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm font-black text-[#173F6D]">Scenario Controls</p>
              <p className="mt-0.5 text-[10px] text-slate-400">Adjust inputs to recalculate projected monthly yield.</p>
            </div>
            <div className="hidden rounded-2xl border border-blue-100 bg-blue-50 p-2 text-[#1F5EA8] sm:block">
              <Zap className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-7">
            <FeeSlider
              label="P2P Transfer Fee"
              description="Fixed fee applied to each simulated P2P transfer"
              value={transferFee}
              suffix=" / txn"
              min={0}
              max={25}
              step={1}
              minLabel="৳0 Free"
              currentLabel="Pricing range"
              maxLabel="৳25"
              onChange={setTransferFee}
            />

            <FeeSlider
              label="ATM Withdrawal Fee"
              description="Fixed fee applied to each simulated cash-out"
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
                  <p className="text-sm font-black text-[#173F6D]">Estimated Monthly Transactions</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Monthly volume used by the backend projection model.
                  </p>
                </div>
                <span className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 font-mono text-xs font-black text-[#1F5EA8]">
                  {estMonthlyTxns.toLocaleString()} txns
                </span>
              </div>

              <input
                type="range"
                min="50000"
                max="300000"
                step="10000"
                value={estMonthlyTxns}
                onChange={(event) => setEstMonthlyTxns(Number(event.target.value))}
                style={{
                  background: `linear-gradient(90deg, #1F5EA8 ${((estMonthlyTxns - 50000) / 250000) * 100}%, #DCE8F2 ${((estMonthlyTxns - 50000) / 250000) * 100}%)`,
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[#1F5EA8]"
              />

              <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-400">
                <span>50K</span>
                <span>150K</span>
                <span>300K</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-[#173F6D] bg-gradient-to-br from-[#0D2947] via-[#123B61] to-[#18547F] p-5 text-white shadow-[0_20px_45px_rgba(15,39,69,0.18)] md:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100/55">
                  Projected Monthly Yield
                </p>
                <motion.div
                  key={Math.round(projectedRevenue)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl"
                >
                  ৳ {projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </motion.div>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-cyan-200">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {simulation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black ${
                  difference >= 0
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-rose-300/20 bg-rose-300/10 text-rose-200"
                }`}
              >
                {difference >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {difference >= 0 ? "+" : "-"}৳ {Math.abs(difference).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="opacity-70">({simulation.percentageChange.toFixed(1)}%)</span>
              </motion.div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <ProjectionMetric
                label="Transfers"
                value={`৳ ${transferContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                detail={`${transferMix.toFixed(0)}% mix`}
              />
              <ProjectionMetric
                label="Withdrawals"
                value={`৳ ${withdrawalContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                detail={`${simulation ? (simulation.assumptions.withdrawalShare * 100).toFixed(0) : 0}% mix`}
              />
            </div>

            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wide text-blue-100/50">Projected contribution mix</span>
                <span className="text-[10px] font-black text-cyan-200">{transferMix.toFixed(0)} / {(100 - transferMix).toFixed(0)}</span>
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${transferMix}%` }}
                  className="h-full bg-cyan-300"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - transferMix}%` }}
                  className="h-full bg-blue-300/60"
                />
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-[18px] border border-cyan-200/10 bg-cyan-100/[0.04] p-3 text-[10px] leading-5 text-blue-100/55">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200/70" />
              <span>
                Backend simulation applies current transaction mix and elasticity assumptions. No production pricing is changed.
              </span>
            </div>

            {simulationError && (
              <div className="mt-3 flex items-start gap-2 rounded-[18px] border border-amber-300/15 bg-amber-300/10 p-3 text-[10px] leading-5 text-amber-100">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{simulationError}</span>
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
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[#173F6D]">{label}</p>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">{description}</p>
        </div>
        <motion.span
          key={value}
          initial={{ scale: 0.94, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="shrink-0 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-1.5 font-mono text-xs font-black text-[#0F6F91]"
        >
          ৳ {value}{suffix}
        </motion.span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(90deg, #1F5EA8 ${progress}%, #DCE8F2 ${progress}%)`,
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[#1F5EA8]"
      />

      <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-400">
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
    <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-3.5">
      <p className="text-[9px] font-black uppercase tracking-wide text-blue-100/45">{label}</p>
      <p className="mt-1.5 text-sm font-black text-cyan-100">{value}</p>
      <p className="mt-1 text-[9px] text-blue-100/40">{detail}</p>
    </div>
  );
}

// ============================================================================
// COMPONENT 7: REVENUE LEAKAGE & RECOVERY OPPORTUNITIES
// ============================================================================

const RevenueLeakageMonitor: React.FC = () => {
  const [range, setRange] = useState<RevenueRange>("30D");
  const [leakage, setLeakage] = useState<Awaited<ReturnType<typeof revenueApi.getLeakage>> | null>(null);
  const [contributors, setContributors] = useState<Awaited<ReturnType<typeof revenueApi.getContributors>>["contributors"]>([]);
  const [contributorLimit, setContributorLimit] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [investigatingCategory, setInvestigatingCategory] = useState<string | null>(null);

  const loadRevenueSignals = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [leakageResponse, contributorsResponse] = await Promise.all([
        revenueApi.getLeakage(range),
        revenueApi.getContributors(range, contributorLimit),
      ]);

      setLeakage(leakageResponse);
      setContributors(contributorsResponse.contributors);
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
  }, [contributorLimit, range]);

  const startInvestigation = async (category: string) => {
    setInvestigatingCategory(category);

    try {
      await revenueApi.investigateLeakage({
        category,
        range,
        note: "Investigation opened from Revenue Intelligence dashboard.",
      });
      await loadRevenueSignals();
    } catch (investigateError) {
      setError(
        investigateError instanceof Error
          ? investigateError.message
          : "Unable to start the leakage investigation."
      );
    } finally {
      setInvestigatingCategory(null);
    }
  };

  const totalLeakage = (leakage?.totalLeakageMinor ?? 0) / 100;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[30px] border border-[#E4DDE1] bg-gradient-to-br from-white via-[#FFF9FA] to-[#F5F7FA] p-5 shadow-[0_18px_50px_rgba(74,39,51,0.06)] md:p-6"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-0 h-56 w-56 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-500 shadow-sm"
            >
              <ShieldAlert className="h-5 w-5" />
            </motion.div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-400">
                Revenue Protection
              </p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-[#0F2745]">
                Leakage Monitor
              </h3>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                Detect fee reversals, waivers, and micro-fee losses before they become recurring leakage.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as RevenueRange)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 shadow-sm outline-none transition focus:border-[#1F5EA8]"
            >
              <option value="7D">7D</option>
              <option value="30D">30D</option>
              <option value="90D">90D</option>
              <option value="1Y">1Y</option>
            </select>

            <motion.span
              key={Math.round(totalLeakage)}
              initial={{ opacity: 0.5, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full border border-rose-100 bg-white px-3 py-1.5 text-[10px] font-black text-rose-600 shadow-sm"
            >
              Est. ৳ {totalLeakage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </motion.span>
          </div>
        </div>

        <div className="relative z-10 mt-5 space-y-3">
          {isLoading ? (
            <RevenueLoadingState label="Scanning revenue leakage signals..." />
          ) : leakage && leakage.signals.length > 0 ? (
            leakage.signals.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="group rounded-[20px] border border-[#E9E0E3] bg-white/90 p-4 shadow-[0_8px_22px_rgba(74,39,51,0.03)] backdrop-blur transition-shadow hover:shadow-[0_14px_30px_rgba(74,39,51,0.08)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#173F6D]">{item.category}</span>
                      <LeakageRiskBadge risk={item.riskLevel} />
                      {item.investigationStatus !== "none" && (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-black capitalize text-blue-600">
                          {item.investigationStatus}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] leading-5 text-slate-500">{item.reason}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-[#2A6EA6]">
                      <Eye className="h-3.5 w-3.5" />
                      {item.action}
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-lg font-black text-rose-600">
                      ৳ {(item.amountMinor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400">
                      {item.sourceEventCount.toLocaleString()} source events
                    </p>
                    <button
                      type="button"
                      disabled={investigatingCategory === item.category}
                      onClick={() => startInvestigation(item.category)}
                      className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black text-[#1F5EA8] transition hover:text-[#173F6D] disabled:opacity-50"
                    >
                      {investigatingCategory === item.category ? (
                        <RefreshCcw className="h-3 w-3 animate-spin" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {investigatingCategory === item.category
                        ? "Opening..."
                        : item.investigationStatus === "none"
                          ? "Investigate"
                          : "Review investigation"}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))
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
              onRetry={() => void loadRevenueSignals()}
            />
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="relative overflow-hidden rounded-[30px] border border-[#D5E3EF] bg-gradient-to-br from-white via-[#F8FBFF] to-[#EDF5FB] p-5 shadow-[0_18px_50px_rgba(15,39,69,0.07)] md:p-6"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#1F5EA8] shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5D88AF]">
                Contribution Intelligence
              </p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-[#0F2745]">
                Top Revenue Contributors
              </h3>
              <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                Accounts ranked by captured platform fees during the selected period.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setContributorLimit((current) => (current === 4 ? 12 : 4))}
            className="shrink-0 rounded-xl border border-blue-100 bg-white px-3 py-2 text-[10px] font-black text-[#1F5EA8] shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            {contributorLimit === 4 ? "View All" : "Top 4"}
          </button>
        </div>

        <div className="relative z-10 mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading ? (
            <RevenueLoadingState label="Ranking revenue contributors..." />
          ) : contributors.length > 0 ? (
            contributors.map((user, index) => {
              const maxFees = Math.max(...contributors.map((item) => item.feesPaidMinor), 1);
              const share = (user.feesPaidMinor / maxFees) * 100;

              return (
                <motion.article
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.045 }}
                  whileHover={{ x: 3 }}
                  className="group rounded-[20px] border border-[#DDE8F1] bg-white/90 p-4 shadow-[0_8px_22px_rgba(15,39,69,0.03)] transition-shadow hover:shadow-[0_14px_30px_rgba(15,39,69,0.08)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-xs font-black ${
                        index === 0
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : index === 1
                            ? "border-slate-200 bg-slate-50 text-slate-600"
                            : "border-blue-100 bg-blue-50 text-[#1F5EA8]"
                      }`}>
                        #{index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-black text-[#173F6D]">{user.name}</span>
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-black text-[#1F5EA8]">
                            {user.type}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[10px] text-slate-400">
                          {user.email} • {user.transactionsCount.toLocaleString()} txns
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-[#0F2745]">
                        ৳ {(user.feesPaidMinor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Vol ৳ {(user.volumeMinor / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDF3F8]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ delay: 0.12 + index * 0.04, duration: 0.55 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#1F5EA8] via-[#2F83C5] to-cyan-400"
                    />
                  </div>
                </motion.article>
              );
            })
          ) : (
            <RevenueEmptyState
              icon="users"
              title="No contributor data yet"
              text="No captured contributor revenue events are available for this period."
            />
          )}
        </div>
      </motion.section>
    </div>
  );
};

function LeakageRiskBadge({ risk }: { risk: "High" | "Medium" | "Low" }) {
  const tone =
    risk === "High"
      ? "border-rose-100 bg-rose-50 text-rose-600"
      : risk === "Medium"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : "border-emerald-100 bg-emerald-50 text-emerald-700";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${tone}`}>
      {risk} Risk
    </span>
  );
}

function RevenueLoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-[22px] border border-dashed border-[#D7E3EF] bg-white/60 p-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#1F5EA8]"
      >
        <RefreshCcw className="h-4 w-4" />
      </motion.div>
      <p className="mt-3 text-[10px] font-bold text-slate-400">{label}</p>
    </div>
  );
}

function RevenueEmptyState({
  icon,
  title,
  text,
}: {
  icon: "shield" | "users";
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-[22px] border border-dashed border-[#D7E3EF] bg-white/65 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#1F5EA8]">
        {icon === "shield" ? <ShieldAlert className="h-5 w-5" /> : <Users className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-sm font-black text-[#173F6D]">{title}</p>
      <p className="mt-1 max-w-sm text-[10px] leading-5 text-slate-400">{text}</p>
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
    <div className="flex flex-col gap-3 rounded-[18px] border border-amber-200 bg-amber-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="text-[10px] font-black text-amber-800">Revenue data source unavailable</p>
          <p className="mt-0.5 truncate text-[9px] text-amber-700/70">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-[9px] font-black text-amber-700 shadow-sm"
      >
        <RefreshCcw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}

// ============================================================================
// COMPONENT 8: REVENUE STORY MODE (EXECUTIVE PRESENTATION OVERLAY)
// ============================================================================

interface StoryModeProps {
  isOpen: boolean;
  onClose: () => void;
}

const RevenueStoryMode: React.FC<StoryModeProps> = ({ isOpen, onClose }) => {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: "Executive Revenue Summary",
      subtitle: "NovaWallet MoM Revenue Overview & Yield Performance",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 bg-[#173F6D] rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-300 uppercase">Gross Revenue</span>
              <div className="text-3xl font-black text-white mt-2">৳ 1.42M</div>
              <span className="text-xs text-emerald-400 font-bold">+14.8% vs last month</span>
            </div>
            <div className="p-6 bg-[#173F6D] rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-300 uppercase">Net Yield</span>
              <div className="text-3xl font-black text-cyan-300 mt-2">৳ 1.24M</div>
              <span className="text-xs text-emerald-400 font-bold">+12.4% net retention</span>
            </div>
            <div className="p-6 bg-[#173F6D] rounded-2xl border border-slate-700">
              <span className="text-xs text-slate-300 uppercase">Total Volume</span>
              <div className="text-3xl font-black text-white mt-2">৳ 18.42M</div>
              <span className="text-xs text-emerald-400 font-bold">148,290 transfers</span>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            NovaWallet achieved steady revenue acceleration this period, anchored primarily by P2P transfer growth and increased ATM cash-out transactions across core metropolitan regions.
          </p>
        </div>
      )
    },
    {
      title: "Fee Stream Contribution",
      subtitle: "Breakdown of Revenue Sources across NovaWallet",
      content: (
        <div className="grid grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            {DEMO_STREAMS.map((s) => (
              <div key={s.id} className="p-4 bg-[#173F6D] rounded-xl flex justify-between items-center">
                <span className="font-bold text-white text-sm">{s.name}</span>
                <span className="text-sm font-mono text-cyan-300">{s.amount} ({s.percentage}%)</span>
              </div>
            ))}
          </div>
          <div className="p-6 bg-[#173F6D] rounded-2xl text-center space-y-3">
            <h4 className="text-lg font-bold text-white">Stream Dominance</h4>
            <p className="text-xs text-slate-300">
              Transfer Fees continue to represent the largest singular contributor at 34.1% of total yield, followed closely by ATM Withdrawals at 25.9%.
            </p>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0F2745] z-50 p-8 flex flex-col justify-between text-white"
      >
        {/* Story Mode Top Bar */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold rounded-full">
              REVENUE STORY MODE
            </span>
            <span className="text-xs text-slate-400">Slide {slide + 1} of {slides.length}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Slide Content */}
        <div className="max-w-4xl mx-auto w-full my-auto">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl font-black text-white mb-2">{slides[slide].title}</h2>
            <p className="text-cyan-300 text-sm mb-8">{slides[slide].subtitle}</p>
            {slides[slide].content}
          </motion.div>
        </div>

        {/* Story Mode Navigation */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-4">
          <button
            disabled={slide === 0}
            onClick={() => setSlide((s) => s - 1)}
            className="px-5 py-2.5 bg-slate-800 rounded-xl disabled:opacity-40 text-sm font-semibold hover:bg-slate-700"
          >
            Previous
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <span key={i} className={`w-3 h-3 rounded-full ${i === slide ? "bg-cyan-400" : "bg-slate-700"}`} />
            ))}
          </div>
          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide((s) => s + 1)}
              className="px-5 py-2.5 bg-[#1F5EA8] text-white rounded-xl text-sm font-semibold hover:bg-[#173F6D]"
            >
              Next Slide
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
            >
              Finish Presentation
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// COMPONENT 9: REVENUE REPORT BUILDER MODAL
// ============================================================================

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RevenueReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState("Executive Revenue Summary");
  const [period, setPeriod] = useState("30D");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0F2745]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1F5EA8]" />
            <h3 className="text-xl font-bold text-[#0F2745]">Generate Revenue Report</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Report Template</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-3 bg-[#F6F8FB] border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
            >
              <option>Executive Revenue Summary</option>
              <option>Fee Stream Breakdown & Yield</option>
              <option>Refund & Adjustment Audit</option>
              <option>Revenue Leakage & Recovery</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Time Horizon</label>
            <div className="grid grid-cols-4 gap-2">
              {["7D", "30D", "90D", "1Y"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`py-2 text-xs font-bold rounded-xl border ${
                    period === p ? "bg-[#1F5EA8] text-white border-[#1F5EA8]" : "bg-[#F6F8FB] text-slate-600 border-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#F6F8FB] text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Report generated (${reportType} - ${period}). Downloading CSV demo dataset.`);
              onClose();
            }}
            className="flex-1 py-3 bg-[#1F5EA8] text-white font-bold rounded-xl hover:bg-[#173F6D] transition-colors text-sm shadow-md"
          >
            Download CSV Report
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// MAIN REVENUE PAGE ORCHESTRATOR
// ============================================================================

export default function RevenueIntelligencePage() {
  const [selectedKPI, setSelectedKPI] = useState<FinancialKPI | null>(null);
  const [selectedStream, setSelectedStream] = useState<RevenueStream | null>(null);
  const [isStoryModeOpen, setIsStoryModeOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-6 md:p-8 font-sans">
      {/* Header */}
      <RevenueHeader
        onOpenReportBuilder={() => setIsReportModalOpen(true)}
        onOpenStoryMode={() => setIsStoryModeOpen(true)}
      />

      {/* Signature Pulse */}
      <RevenuePulse />

      {/* KPI Grid */}
      <RevenueKPIGrid onSelectKPI={(kpi) => setSelectedKPI(kpi)} />

      {/* Insights & Weather */}
      <WhatMovedRevenue />

      {/* Orbit & Economics */}
      <RevenueStreamsOrbit onSelectStream={(s) => setSelectedStream(s)} />

      {/* Fee Optimization Lab */}
      <FeeOptimizationLab />

      {/* Leakage & Top Users */}
      <RevenueLeakageMonitor />

      {/* Overlays / Modals */}
      <RevenueStoryMode isOpen={isStoryModeOpen} onClose={() => setIsStoryModeOpen(false)} />
      <RevenueReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />

      {/* Drawer for Selected Stream or KPI Details */}
      {(selectedKPI || selectedStream) && (
        <div className="fixed inset-0 bg-[#0F2745]/50 backdrop-blur-xs z-50 flex justify-end">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-[#0F2745]">
                  {selectedKPI ? selectedKPI.label : selectedStream?.name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedKPI(null);
                    setSelectedStream(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="p-4 bg-[#F6F8FB] rounded-2xl">
                  <span className="text-xs text-slate-400 block font-semibold">Selected Detail Yield</span>
                  <span className="text-2xl font-black text-[#0F2745]">
                    {selectedKPI ? selectedKPI.value : selectedStream?.amount}
                  </span>
                </div>
                <p>
                  Detailed drill-down inspection for this revenue category. Yield captures direct fee load, partner splits, and refund deductions.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedKPI(null);
                setSelectedStream(null);
              }}
              className="w-full py-3 bg-[#0F2745] text-white font-bold rounded-xl hover:bg-[#173F6D] transition-colors text-sm"
            >
              Close Detail View
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}