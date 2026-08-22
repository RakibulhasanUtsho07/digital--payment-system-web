"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Calendar,
  ChevronDown,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* =========================================================
   TYPES & INTERFACES
========================================================= */

type TimeRange = "week" | "month" | "year";

interface CashflowData {
  name: string;
  income: number;
  expense: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface SummaryData {
  totalIncome: number;
  totalSpent: number;
  netBalance: number;
}

/* =========================================================
   MOCK DATA
========================================================= */

const MOCK_CASHFLOW: Record<TimeRange, CashflowData[]> = {
  week: [
    { name: "Mon", income: 120, expense: 80 },
    { name: "Tue", income: 200, expense: 150 },
    { name: "Wed", income: 150, expense: 100 },
    { name: "Thu", income: 300, expense: 200 },
    { name: "Fri", income: 250, expense: 120 },
    { name: "Sat", income: 400, expense: 300 },
    { name: "Sun", income: 350, expense: 250 },
  ],
  month: [
    { name: "Week 1", income: 4000, expense: 2400 },
    { name: "Week 2", income: 3000, expense: 1398 },
    { name: "Week 3", income: 2000, expense: 9800 },
    { name: "Week 4", income: 2780, expense: 3908 },
  ],
  year: [
    { name: "Jan", income: 4000, expense: 2400 },
    { name: "Feb", income: 3000, expense: 1398 },
    { name: "Mar", income: 2000, expense: 9800 },
    { name: "Apr", income: 2780, expense: 3908 },
    { name: "May", income: 1890, expense: 4800 },
    { name: "Jun", income: 2390, expense: 3800 },
    { name: "Jul", income: 3490, expense: 4300 },
    { name: "Aug", income: 4000, expense: 2400 },
    { name: "Sep", income: 3000, expense: 1398 },
    { name: "Oct", income: 2000, expense: 9800 },
    { name: "Nov", income: 2780, expense: 3908 },
    { name: "Dec", income: 1890, expense: 4800 },
  ],
};

const MOCK_CATEGORIES: CategoryData[] = [
  { name: "Food & Dining", value: 1250, color: "#06b6d4" }, // Cyan-500
  { name: "Transfers", value: 850, color: "#3b82f6" }, // Blue-500
  { name: "Bills & Utilities", value: 650, color: "#10b981" }, // Emerald-500
  { name: "Entertainment", value: 300, color: "#8b5cf6" }, // Violet-500
];

const MOCK_SUMMARY: Record<TimeRange, SummaryData> = {
  week: { totalIncome: 1770, totalSpent: 1200, netBalance: 570 },
  month: { totalIncome: 11780, totalSpent: 17506, netBalance: -5726 },
  year: { totalIncome: 33130, totalSpent: 48312, netBalance: -15182 },
};

/* =========================================================
   UTILITIES
========================================================= */

function formatCurrency(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/* =========================================================
   FRAMER MOTION VARIANTS
========================================================= */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

/* =========================================================
   PAGE COMPONENT
========================================================= */

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Simulate API loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [timeRange]);

  const summary = MOCK_SUMMARY[timeRange];
  const cashflow = MOCK_CASHFLOW[timeRange];

  // Calculate percentage changes (mock logic for UI display)
  const incomeTrend = "+12.5%";
  const expenseTrend = timeRange === "month" ? "+20.1%" : "-5.4%";

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (isLoading && !summary) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5EA8] text-white shadow-lg shadow-blue-500/20">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-800">Analyzing data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* =====================================================
          HEADER SECTION
      ====================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F5EA8]">
            <Activity className="h-3.5 w-3.5" />
            Analytics
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Financial Insights
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your spending habits and cashflow trends.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="capitalize">This {timeRange}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white p-1 shadow-lg shadow-slate-200/50 z-50"
              >
                {(["week", "month", "year"] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold capitalize transition-colors ${
                      timeRange === range
                        ? "bg-blue-50 text-[#1F5EA8]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    This {range}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Income */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2745] to-[#173F6D] p-6 text-white shadow-lg"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-200">Total Income</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight">
              {isLoading ? "---" : formatCurrency(summary.totalIncome)}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-200">
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-400/20 px-2 py-0.5 text-emerald-300">
                <ArrowUpRight className="h-3 w-3" />
                {incomeTrend}
              </span>
              <span>vs last {timeRange}</span>
            </div>
          </motion.div>

          {/* Total Spent */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Total Spent</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              {isLoading ? "---" : formatCurrency(summary.totalSpent)}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-red-600">
                <ArrowDownRight className="h-3 w-3" />
                {expenseTrend}
              </span>
              <span>vs last {timeRange}</span>
            </div>
          </motion.div>

          {/* Net Balance */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.04)] border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Net Flow</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              {isLoading ? "---" : formatCurrency(summary.netBalance)}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              {summary.netBalance > 0 ? (
                <span className="text-emerald-500">Positive cashflow</span>
              ) : (
                <span className="text-red-500">Deficit cashflow</span>
              )}
            </div>
          </motion.div>
        </div>

        {/* =====================================================
            SMART INSIGHTS BANNER
        ====================================================== */}
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-4 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-5 shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-cyan-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">AI Financial Assistant</h3>
            <p className="mt-1 text-sm text-slate-600">
              You spent <span className="font-bold text-red-500">20% more</span> on Food & Dining this {timeRange} compared to the last. Consider setting a budget limit to keep your savings on track.
            </p>
          </div>
        </motion.div>

        {/* =====================================================
            CHARTS SECTION
        ====================================================== */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* CASHFLOW CHART */}
          <motion.div
            variants={itemVariants}
            className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.03)] lg:col-span-2"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Cashflow Analytics</h2>
                <p className="text-xs text-slate-500">Income vs Expenses over time</p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(val) => `৳${val / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                      name="Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorExpense)" 
                      name="Expense"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* SPENDING CATEGORIES PIE CHART */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.03)] lg:col-span-1"
          >
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Top Expenses</h2>
              <p className="text-xs text-slate-500">By category</p>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[250px]">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-50">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              ) : (
                <>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOCK_CATEGORIES}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {MOCK_CATEGORIES.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                           formatter={(value: number) => formatCurrency(value)}
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Custom Legend */}
                  <div className="mt-4 space-y-3">
                    {MOCK_CATEGORIES.map((category, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-semibold text-slate-700">{category.name}</span>
                        </div>
                        <span className="font-black text-slate-900">{formatCurrency(category.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}