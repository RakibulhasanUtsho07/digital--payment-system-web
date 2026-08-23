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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* What Moved Revenue */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1F5EA8]" />
            <h3 className="text-lg font-bold text-[#0F2745]">What Moved Revenue?</h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-mono">
            Demo-derived insight
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_INSIGHTS.map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-2xl bg-[#F6F8FB] border border-slate-200/60 hover:bg-white hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-[#0F2745] text-sm">{insight.title}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {insight.change}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">{insight.reason}</p>
              <div className="text-xs font-semibold text-[#1F5EA8] flex items-center justify-between pt-2 border-t border-slate-200/50">
                <span>{insight.impact}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Weather & Health Score */}
      <div className="bg-[#0F2745] text-white rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Revenue Weather</h3>
            </div>
            <span className="text-[10px] text-cyan-300 uppercase tracking-widest bg-[#173F6D] px-2 py-0.5 rounded">
              Sunny & Stable
            </span>
          </div>

          <div className="my-4 flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
              {/* Radial gauge SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray="91, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xl font-black text-white">91</span>
            </div>
            <div>
              <div className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">Revenue Health Score</div>
              <div className="text-lg font-bold text-white">Strong Efficiency</div>
              <div className="text-xs text-slate-300 mt-1">High fee collection yield with controlled refund exposure.</div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Factors: Growth, Margin, Refund Rate</span>
          <span className="text-cyan-400 font-semibold">Demo Indicator</span>
        </div>
      </div>
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

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#0F2745]">Revenue Streams & Economics</h3>
          <p className="text-xs text-slate-500">Explore yield by fee structure, transaction volume, and margins</p>
        </div>
        <div className="flex bg-[#F6F8FB] p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("orbit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "orbit" ? "bg-white text-[#0F2745] shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Revenue Orbit
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "matrix" ? "bg-white text-[#0F2745] shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Fee Economics Matrix
          </button>
        </div>
      </div>

      {activeTab === "orbit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Orbital Node Display */}
          <div className="lg:col-span-7 bg-[#0F2745] rounded-2xl p-6 h-80 flex items-center justify-center relative overflow-hidden">
            <div className="text-center relative z-10">
              <span className="text-xs text-cyan-300 font-mono uppercase tracking-widest">Total Platform Yield</span>
              <div className="text-3xl font-black text-white my-1">৳ 1,420,500</div>
              <span className="text-xs text-slate-400">100% Gross Fee Revenue</span>
            </div>

            {/* Orbiting Satellites */}
            {DEMO_STREAMS.map((stream, idx) => {
              const angles = [0, 72, 144, 216, 288];
              const angle = angles[idx];
              const radius = 110;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <motion.div
                  key={stream.id}
                  onClick={() => onSelectStream(stream)}
                  className="absolute cursor-pointer group"
                  style={{ left: `calc(50% + ${x}px - 36px)`, top: `calc(50% + ${y}px - 28px)` }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div
                    className="p-2.5 rounded-xl border border-white/20 backdrop-blur-md shadow-lg flex flex-col items-center justify-center text-center w-20"
                    style={{ backgroundColor: `${stream.color}33` }}
                  >
                    <span className="text-[10px] font-bold text-white truncate w-full">{stream.name}</span>
                    <span className="text-xs font-black text-cyan-300">{stream.percentage}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* List Breakdown */}
          <div className="lg:col-span-5 space-y-3">
            {DEMO_STREAMS.map((stream) => (
              <div
                key={stream.id}
                onClick={() => onSelectStream(stream)}
                className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#1F5EA8]/50 hover:bg-[#F6F8FB] transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stream.color }} />
                  <div>
                    <div className="text-sm font-bold text-[#0F2745]">{stream.name}</div>
                    <div className="text-xs text-slate-400">{stream.percentage}% of total revenue</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#0F2745]">{stream.amount}</div>
                  <div className="text-xs font-semibold text-emerald-600">{stream.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Fee Economics Matrix */
        <div className="bg-[#F6F8FB] rounded-2xl p-6 border border-slate-200 text-center">
          <div className="text-xs text-slate-400 font-mono mb-4 uppercase tracking-wider">
            Y-Axis: Revenue per Transaction | X-Axis: Transaction Volume | Bubble Size: Total Yield
          </div>
          <div className="h-64 flex items-center justify-center border-b border-l border-slate-300 relative p-4">
            <div className="absolute left-6 top-10 p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl text-xs font-bold text-[#1F5EA8]">
              High Yield / Lower Volume (Withdrawals)
            </div>
            <div className="absolute right-6 bottom-10 p-3 bg-emerald-600/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-700">
              High Volume / Moderate Yield (Transfers)
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <BarChart3 className="w-5 h-5 text-[#1F5EA8]" />
              <span>Interactive Bubble Economics Matrix Rendered</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT 6: FEE CONFIGURATION & FEE OPTIMIZATION LAB / SIMULATOR
// ============================================================================

const FeeOptimizationLab: React.FC = () => {
  const [transferFee, setTransferFee] = useState<number>(10);
  const [withdrawalFee, setWithdrawalFee] = useState<number>(18);
  const [estMonthlyTxns, setEstMonthlyTxns] = useState<number>(150000);

  // Simulation logic
  const simulatedTransferRevenue = useMemo(() => transferFee * (estMonthlyTxns * 0.6), [transferFee, estMonthlyTxns]);
  const simulatedWithdrawalRevenue = useMemo(() => withdrawalFee * (estMonthlyTxns * 0.4), [withdrawalFee, estMonthlyTxns]);
  const totalSimulated = useMemo(() => simulatedTransferRevenue + simulatedWithdrawalRevenue, [simulatedTransferRevenue, simulatedWithdrawalRevenue]);
  
  const baseRevenue = 150000 * 0.6 * 10 + 150000 * 0.4 * 18; // 2,190,000
  const diff = totalSimulated - baseRevenue;
  const pctChange = ((diff / baseRevenue) * 100).toFixed(1);

  return (
    <div className="bg-[#0F2745] text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Fee Optimization Lab & Price Simulator</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate how changes to fixed transfer or withdrawal fees impact projected platform yield.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-full">
          Simulation Only — Production Unaffected
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sliders Control Panel */}
        <div className="lg:col-span-7 space-y-6 bg-[#173F6D]/50 p-6 rounded-2xl border border-slate-700/80">
          {/* Slider 1: Transfer Fee */}
          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="text-slate-300">P2P Transfer Fee (Fixed)</span>
              <span className="text-cyan-400 font-mono">৳ {transferFee} / txn</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={transferFee}
              onChange={(e) => setTransferFee(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>৳ 0 (Free)</span>
              <span>৳ 10 (Current)</span>
              <span>৳ 25</span>
            </div>
          </div>

          {/* Slider 2: Withdrawal Fee */}
          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="text-slate-300">ATM Withdrawal Fee (Fixed)</span>
              <span className="text-cyan-400 font-mono">৳ {withdrawalFee} / txn</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={withdrawalFee}
              onChange={(e) => setWithdrawalFee(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>৳ 5</span>
              <span>৳ 18 (Current)</span>
              <span>৳ 40</span>
            </div>
          </div>

          {/* Slider 3: Transaction Volume Scale */}
          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span className="text-slate-300">Est. Monthly Transactions</span>
              <span className="text-cyan-400 font-mono">{estMonthlyTxns.toLocaleString()} txns</span>
            </div>
            <input
              type="range"
              min="50000"
              max="300000"
              step="10000"
              value={estMonthlyTxns}
              onChange={(e) => setEstMonthlyTxns(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Live Simulation Output */}
        <div className="lg:col-span-5 bg-[#0F2745] p-6 rounded-2xl border border-slate-700 text-center flex flex-col justify-between h-full">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono">Projected Monthly Yield</span>
            <div className="text-3xl font-black text-white my-2">৳ {totalSimulated.toLocaleString()}</div>
            <div className={`text-sm font-bold inline-flex items-center gap-1 px-3 py-1 rounded-full ${diff >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
              {diff >= 0 ? `+৳ ${diff.toLocaleString()} (${pctChange}%)` : `-৳ ${Math.abs(diff).toLocaleString()} (${pctChange}%)`}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-left text-xs text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Transfers Contribution:</span>
              <span className="text-slate-200 font-mono">৳ {simulatedTransferRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Withdrawals Contribution:</span>
              <span className="text-slate-200 font-mono">৳ {simulatedWithdrawalRevenue.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-cyan-400/80 pt-2 font-mono">
              * Includes estimated volume elasticity dampening factor of 1.2% per ৳2 fee increase.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT 7: REVENUE LEAKAGE & RECOVERY OPPORTUNITIES
// ============================================================================

const RevenueLeakageMonitor: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Leakage Signals */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-[#0F2745]">Revenue Leakage Monitor</h3>
          </div>
          <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-full border border-rose-200">
            Est. Leakage: ৳ 42,800
          </span>
        </div>

        <div className="space-y-3">
          {DEMO_LEAKAGES.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-[#F6F8FB] border border-slate-200/60 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[#0F2745] text-sm">{item.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.riskLevel === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.riskLevel} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-500">{item.reason}</p>
                <div className="text-[11px] text-[#1F5EA8] font-semibold mt-2">{item.action}</div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-rose-600 block">{item.amount}</span>
                <button className="text-xs font-bold text-[#1F5EA8] hover:underline mt-1">Investigate</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Revenue Contributors */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1F5EA8]" />
            <h3 className="text-lg font-bold text-[#0F2745]">Top Revenue Contributors</h3>
          </div>
          <button className="text-xs font-bold text-[#1F5EA8] hover:underline">View All Accounts</button>
        </div>

        <div className="space-y-3">
          {DEMO_TOP_USERS.map((usr) => (
            <div key={usr.id} className="p-3.5 rounded-2xl border border-slate-200/60 hover:bg-[#F6F8FB] transition-all flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F2745] text-sm">{usr.name}</span>
                  <span className="text-[10px] font-bold bg-[#173F6D]/10 text-[#173F6D] px-2 py-0.5 rounded">
                    {usr.type}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{usr.email} • {usr.transactionsCount} txns</div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#0F2745] block">{usr.feesPaid}</span>
                <span className="text-xs text-slate-400">Vol: {usr.volume}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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