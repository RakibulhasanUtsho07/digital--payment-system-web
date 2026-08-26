// src/app/(dashboard)/dashboard/analytics/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Activity, ShieldAlert, TrendingUp, Users, Sun, Zap, 
  Download, RefreshCcw, FileText, Presentation, CloudLightning
} from "lucide-react";

// --- TYPES & INTERFACES ---

export interface AnalyticsOverview {
  transactionVolume: number;
  transactionCount: number;
  activeUsers: number;
  walletBalance: number;
  kycCompletion: number;
  platformRevenue: number;
  failedRate: number;
  highRiskExposure: number;
}

export interface PulseMetric {
  id: string;
  label: string;
  score: number;
  trend: "up" | "down" | "flat";
}

// --- DEMO DATA (Rule-based / Local Aggregation) ---

const DEMO_OVERVIEW: AnalyticsOverview = {
  transactionVolume: 18420000,
  transactionCount: 128420,
  activeUsers: 24592,
  walletBalance: 84700000,
  kycCompletion: 82.4,
  platformRevenue: 1240000,
  failedRate: 1.8,
  highRiskExposure: 4200000,
};

const DEMO_PULSE: PulseMetric[] = [
  { id: "growth", label: "Growth", score: 92, trend: "up" },
  { id: "liquidity", label: "Liquidity", score: 87, trend: "flat" },
  { id: "tx", label: "Transactions", score: 95, trend: "up" },
  { id: "security", label: "Security", score: 94, trend: "flat" },
  { id: "risk", label: "Risk", score: 76, trend: "down" },
];

// --- COMPONENTS ---

const FinancialWeather = ({ failedRate, riskExposure }: { failedRate: number; riskExposure: number }) => {
  // Demo Rule-based Weather Indicator
  const isClear = failedRate < 2.0 && riskExposure < 5000000;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,39,69,0.05)] border border-[#F6F8FB]"
    >
      <div className={`p-4 rounded-2xl ${isClear ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
        {isClear ? <Sun className="w-8 h-8" /> : <CloudLightning className="w-8 h-8" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-[#173F6D] uppercase tracking-wider mb-1">Financial Weather</p>
        <h3 className="text-2xl font-bold text-[#0F2745]">{isClear ? "Clear Skies" : "Volatile"}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {isClear 
            ? "Transaction health is strong and risk exposure remains controlled." 
            : "Elevated failure rates or risk detected. Monitoring advised."}
          <span className="ml-2 inline-block px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] uppercase tracking-wide">Demo Insight</span>
        </p>
      </div>
    </motion.div>
  );
};

const PlatformPulse = ({ metrics }: { metrics: PulseMetric[] }) => {
  return (
    <div className="bg-[#0F2745] text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
      {/* Abstract Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#1F5EA8] to-transparent opacity-50" />
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div className="flex-shrink-0">
          <h2 className="text-lg font-medium text-[#1F5EA8] mb-1">Platform Pulse</h2>
          <p className="text-sm text-slate-400">Live System Health</p>
        </div>
        
        <div className="flex w-full justify-between items-center gap-4">
          {metrics.map((metric, i) => (
            <motion.div 
              key={metric.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center group cursor-default"
            >
              <div className="text-slate-400 text-sm mb-2">{metric.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {metric.score}
                </span>
                {metric.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                {metric.trend === "down" && <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />}
                {metric.trend === "flat" && <Activity className="w-4 h-4 text-slate-400" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CommandHeader = () => (
  <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-[#0F2745]">Reports & Analytics</h1>
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
        </span>
      </div>
      <p className="text-slate-500">Turn NovaWallet activity into clear operational, financial, and risk intelligence.</p>
      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
        <RefreshCcw className="w-3 h-3" /> Data updated 2 min ago
      </p>
    </div>

    <div className="flex items-center gap-3">
      <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#173F6D] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm">
        <Download className="w-4 h-4" /> Export
      </button>
      <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#173F6D] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm">
        <FileText className="w-4 h-4" /> Generate Report
      </button>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1F5EA8] text-white rounded-xl hover:bg-[#173F6D] transition-colors text-sm font-semibold shadow-md shadow-blue-900/20">
        <Presentation className="w-4 h-4" /> Story Mode
      </button>
    </div>
  </header>
);

// --- MAIN PAGE ---

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<string>("7D");
  
  // Memoize demo data to prevent unnecessary recalculations
  const overview = useMemo(() => DEMO_OVERVIEW, []);
  const pulseMetrics = useMemo(() => DEMO_PULSE, []);

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-6 md:p-8 font-sans">
      <CommandHeader />

      {/* Primary Intelligence Flow */}
      <div className="space-y-8">
        
        {/* Row 1: Pulse & Weather */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PlatformPulse metrics={pulseMetrics} />
          </div>
          <div className="lg:col-span-1">
            <FinancialWeather failedRate={overview.failedRate} riskExposure={overview.highRiskExposure} />
          </div>
        </div>

        {/* Row 2: Executive KPIs (Stubbed for modularity) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0F2745]">Executive Snapshot</h2>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
              {['Today', '7D', '30D', '90D', '1Y'].map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${timeRange === range ? 'bg-[#0F2745] text-white' : 'text-slate-500 hover:text-[#173F6D]'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Example KPI Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Total Transaction Volume</p>
              <div className="flex items-end gap-3">
                <h4 className="text-2xl font-bold text-[#0F2745]">৳18.42M</h4>
                <span className="text-emerald-500 text-sm font-medium flex items-center mb-1">
                  <TrendingUp className="w-3 h-3 mr-1" /> 12.8%
                </span>
              </div>
            </div>
            {/* Additional KPIs would render here... */}
          </div>
        </section>

        {/* Placeholder for complex visual modules (Money Flow, Matrices, etc.) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="h-96 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 font-medium">
            Money Flow Network Module
          </div>
          <div className="h-96 bg-[#0F2745] rounded-3xl shadow-xl flex items-center justify-center text-[#1F5EA8] font-medium">
            Transaction Risk Matrix Module
          </div>
        </div>

      </div>
    </div>
  );
}