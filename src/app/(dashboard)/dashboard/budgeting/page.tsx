"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Target, Plus, Edit2, AlertCircle, CheckCircle2,
  Info, Calendar as CalendarIcon, ArrowRight, Utensils,
  ShoppingBag, Car, FileText, Film, Activity, BookOpen,
  Plane, Zap, MoreHorizontal, X, TrendingUp, TrendingDown,
  ChevronRight, PieChart, BarChart3, AlertTriangle, ShieldCheck
} from "lucide-react";

// --- Types & Interfaces ---
interface Category {
  id: string;
  name: string;
  iconName: string;
  limit: number;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  date: string;
  method: string;
}

interface BudgetSettings {
  totalLimit: number;
  savingsGoal: number;
  currentSavings: number;
}

interface ToastInfo {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

// --- Default/Mock Data ---
const DEFAULT_CATEGORIES: Category[] = [
  { id: "c1", name: "Food & Dining", iconName: "Utensils", limit: 8000 },
  { id: "c2", name: "Shopping", iconName: "ShoppingBag", limit: 5000 },
  { id: "c3", name: "Transport", iconName: "Car", limit: 4000 },
  { id: "c4", name: "Bills & Utilities", iconName: "Zap", limit: 6000 },
  { id: "c5", name: "Entertainment", iconName: "Film", limit: 3000 },
];

const DEFAULT_SETTINGS: BudgetSettings = {
  totalLimit: 30000,
  savingsGoal: 100000,
  currentSavings: 62500,
};

const DEFAULT_EXPENSES: Expense[] = [
  { id: "e1", title: "Uber Ride", amount: 450, categoryId: "c3", date: new Date().toISOString(), method: "NovaWallet" },
  { id: "e2", title: "Agora Grocery", amount: 1240, categoryId: "c1", date: new Date(Date.now() - 86400000).toISOString(), method: "Card ending 4242" },
  { id: "e3", title: "Netflix Subscription", amount: 650, categoryId: "c5", date: new Date(Date.now() - 86400000 * 2).toISOString(), method: "NovaWallet" },
];

// --- Helpers ---
const formatCurrency = (amount: number) => `৳ ${amount.toLocaleString("en-IN")}`;
const getIcon = (name: string) => {
  const icons: any = { Utensils, ShoppingBag, Car, FileText, Film, Activity, BookOpen, Plane, Zap, MoreHorizontal };
  const Icon = icons[name] || MoreHorizontal;
  return <Icon className="h-5 w-5" />;
};
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getRemainingDays = () => {
  const now = new Date();
  return getDaysInMonth(now.getFullYear(), now.getMonth()) - now.getDate();
};

// --- Main Component ---
export default function BudgetingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Core States
  const [settings, setSettings] = useState<BudgetSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>(DEFAULT_EXPENSES);

  // Modal States
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  // Form States (Add Expense)
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState(DEFAULT_CATEGORIES[0]?.id || "");

  // Form States (Edit Budget)
  const [editTotalLimit, setEditTotalLimit] = useState("");
  const [editSavingsGoal, setEditSavingsGoal] = useState("");

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedSettings = localStorage.getItem("nova_budget_settings");
    const savedCategories = localStorage.getItem("nova_budget_categories");
    const savedExpenses = localStorage.getItem("nova_budget_expenses");

    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
  }, []);

  // Save to localStorage whenever core state changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("nova_budget_settings", JSON.stringify(settings));
      localStorage.setItem("nova_budget_categories", JSON.stringify(categories));
      localStorage.setItem("nova_budget_expenses", JSON.stringify(expenses));
    }
  }, [settings, categories, expenses, isMounted]);

  const showToast = (message: string, type: ToastInfo["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- Calculations ---
  const totalSpent = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  const percentageUsed = useMemo(() => Math.min((totalSpent / settings.totalLimit) * 100, 100), [totalSpent, settings.totalLimit]);
  const remainingBudget = settings.totalLimit - totalSpent;

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const spent = expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
      const percentage = cat.limit > 0 ? Math.min((spent / cat.limit) * 100, 100) : 0;
      return { ...cat, spent, percentage, remaining: cat.limit - spent };
    });
  }, [categories, expenses]);

  const categoriesOverBudget = categoryStats.filter(c => c.spent > c.limit).length;

  // Health Score Logic (Max 100)
  const healthScore = useMemo(() => {
    let score = 100;
    if (percentageUsed > 90) score -= 30;
    else if (percentageUsed > 75) score -= 15;
    score -= (categoriesOverBudget * 10);
    const savingsProgress = settings.currentSavings / settings.savingsGoal;
    if (savingsProgress > 0.5) score += 5;
    return Math.max(0, Math.min(100, score));
  }, [percentageUsed, categoriesOverBudget, settings]);

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-emerald-500", bg: "bg-emerald-100" };
    if (score >= 75) return { label: "Healthy", color: "text-blue-500", bg: "bg-blue-100" };
    if (score >= 50) return { label: "Needs Attention", color: "text-amber-500", bg: "bg-amber-100" };
    return { label: "At Risk", color: "text-rose-500", bg: "bg-rose-100" };
  };
  const scoreStatus = getScoreStatus(healthScore);

  // --- Handlers ---
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (!expTitle || isNaN(amount) || amount <= 0 || !expCategory) {
      showToast("Please enter valid expense details.", "error");
      return;
    }
    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      title: expTitle,
      amount,
      categoryId: expCategory,
      date: new Date().toISOString(),
      method: "Manual Entry"
    };
    setExpenses([newExpense, ...expenses]);
    setExpenseModalOpen(false);
    setExpTitle(""); setExpAmount("");
    showToast("Expense added successfully!");
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(editTotalLimit);
    const goal = parseFloat(editSavingsGoal);
    if (isNaN(limit) || limit <= 0 || isNaN(goal) || goal <= 0) {
      showToast("Please enter valid amounts.", "error");
      return;
    }
    setSettings({ ...settings, totalLimit: limit, savingsGoal: goal });
    setBudgetModalOpen(false);
    showToast("Budget settings updated!");
  };

  if (!isMounted) return null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-16 bg-[#F6F8FB] min-h-screen font-sans">
      
      {/* 1. Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0F2745] to-[#1F5EA8] p-8 md:p-10 text-white shadow-xl shadow-blue-900/10"
      >
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-5 w-full lg:w-1/2">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Budget & Spending</h1>
              <p className="text-blue-100/80 text-lg">Plan your spending, monitor limits, and improve your savings seamlessly.</p>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <div>
                <p className="text-sm text-blue-200 font-medium">Monthly Budget</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(settings.totalLimit)}</p>
              </div>
              <div className="w-px bg-white/20 hidden md:block"></div>
              <div>
                <p className="text-sm text-blue-200 font-medium">Spent so far</p>
                <p className="text-3xl font-bold mt-1 text-cyan-300">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => { setEditTotalLimit(settings.totalLimit.toString()); setEditSavingsGoal(settings.savingsGoal.toString()); setBudgetModalOpen(true); }} className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#1F5EA8] transition-all hover:bg-blue-50 active:scale-95 shadow-lg">
                Edit Budget
              </button>
              <button onClick={() => setExpenseModalOpen(true)} className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95">
                Add Expense
              </button>
            </div>
          </div>

          {/* Budget Health Score */}
          <div className="flex shrink-0 flex-col items-center justify-center p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm w-full sm:w-auto">
            <h3 className="text-sm font-semibold text-blue-200 mb-4">Budget Health Score</h3>
            <div className="relative h-40 w-40">
              <svg className="h-full w-full rotate-[-90deg] drop-shadow-xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke={healthScore > 74 ? "#10b981" : healthScore > 49 ? "#f59e0b" : "#ef4444"} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - healthScore / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }} className="text-4xl font-bold tracking-tighter">
                  {Math.round(healthScore)}
                </motion.span>
                <span className="text-xs font-medium text-white/60">/ 100</span>
              </div>
            </div>
            <div className={`mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${scoreStatus.bg} ${scoreStatus.color}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> {scoreStatus.label}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left/Main Column */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 2. Monthly Budget Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0F2745] flex items-center gap-2">
                    <PieChart className="h-6 w-6 text-[#1F5EA8]" /> Monthly Overview
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{getRemainingDays()} days remaining in this month</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm font-semibold text-slate-500 mb-1">Remaining Budget</p>
                  <p className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {formatCurrency(remainingBudget)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-[#0F2745]">{percentageUsed.toFixed(1)}% Used</span>
                  <span className="text-slate-500">{formatCurrency(totalSpent)} / {formatCurrency(settings.totalLimit)}</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${percentageUsed}%` }} transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${percentageUsed > 90 ? 'bg-rose-500' : percentageUsed > 75 ? 'bg-amber-500' : 'bg-[#1F5EA8]'}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. Budget Categories */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0F2745]">Categories</h2>
              <button className="text-sm font-semibold text-[#1F5EA8] hover:underline flex items-center gap-1">
                Manage <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryStats.map((cat, i) => (
                <motion.div 
                  key={cat.id} whileHover={{ y: -4 }}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.percentage > 90 ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-[#1F5EA8]'}`}>
                        {getIcon(cat.iconName)}
                      </div>
                      <p className="font-bold text-[#0F2745]">{cat.name}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{cat.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>{formatCurrency(cat.spent)}</span>
                      <span>{formatCurrency(cat.limit)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${cat.percentage}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full ${cat.percentage > 100 ? 'bg-rose-500' : cat.percentage > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    </div>
                    <p className={`text-[11px] font-medium text-right mt-1 ${cat.remaining < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {cat.remaining < 0 ? `Over by ${formatCurrency(Math.abs(cat.remaining))}` : `${formatCurrency(cat.remaining)} left`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 6. Spending Analytics (CSS Based) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-bold text-[#0F2745] mb-6 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-[#1F5EA8]" /> Weekly Spending Trend
              </h2>
              <div className="h-48 flex items-end justify-between gap-2 md:gap-4 pt-4 border-b border-slate-100 pb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  // Mock heights for visual effect
                  const heights = [40, 70, 30, 90, 50, 80, 20]; 
                  return (
                    <div key={day} className="flex flex-col items-center gap-2 w-full group">
                      <div className="relative flex h-full w-full justify-center items-end">
                        <motion.div 
                          initial={{ height: 0 }} animate={{ height: `${heights[idx]}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className="w-full max-w-[40px] rounded-t-xl bg-[#1F5EA8]/20 group-hover:bg-[#1F5EA8] transition-colors relative"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded font-semibold whitespace-nowrap">
                            ৳ {(heights[idx] * 120).toFixed(0)}
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-[#0F2745] transition-colors">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* 10. Recent Spending */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#0F2745]">Recent Expenses</h2>
                <button className="text-sm font-semibold text-[#1F5EA8] hover:underline">View All</button>
              </div>
              <div className="divide-y divide-slate-100">
                {expenses.slice(0, 5).map((expense) => {
                  const cat = categories.find(c => c.id === expense.categoryId);
                  return (
                    <div key={expense.id} className="py-4 flex items-center justify-between hover:bg-slate-50/50 -mx-4 px-4 rounded-xl transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          {cat ? getIcon(cat.iconName) : <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-[#0F2745]">{expense.title}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{cat?.name || 'Uncategorized'} • {new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0F2745]">- {formatCurrency(expense.amount)}</p>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{expense.method}</p>
                      </div>
                    </div>
                  )
                })}
                {expenses.length === 0 && (
                  <p className="text-center py-6 text-sm text-slate-500">No recent expenses found.</p>
                )}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column / Sidebar Widgets */}
        <div className="space-y-8">
          
          {/* 7. Savings Goal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#0F2745] flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" /> Savings Goal
                </h3>
                <button className="text-slate-400 hover:text-[#1F5EA8]"><Edit2 className="h-4 w-4" /></button>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="relative h-32 w-32 mb-4">
                  <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - settings.currentSavings / settings.savingsGoal) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-[#0F2745]">
                      {Math.round((settings.currentSavings / settings.savingsGoal) * 100)}%
                    </span>
                  </div>
                </div>
                
                <h4 className="font-bold text-slate-800">Emergency Fund</h4>
                <p className="text-sm text-slate-500 mt-1 mb-5">You're on track! Keep it up.</p>
                
                <div className="w-full space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">Saved</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(settings.currentSavings)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-500">Target</span>
                    <span className="font-bold text-[#0F2745]">{formatCurrency(settings.savingsGoal)}</span>
                  </div>
                </div>
                
                <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95 border border-emerald-200">
                  <Plus className="h-4 w-4" /> Add Funds
                </button>
              </div>
            </div>
          </motion.div>

          {/* 8. Smart Budget Recommendations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="font-bold text-[#0F2745] flex items-center gap-2 mb-5">
                <Zap className="h-5 w-5 text-amber-500" /> Smart Insights
              </h3>
              <div className="space-y-4">
                {categoriesOverBudget > 0 && (
                  <div className="flex gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                    <div>
                      <p className="text-sm font-bold text-rose-800">Action Required</p>
                      <p className="text-xs text-rose-600 mt-1">You have exceeded your limit in {categoriesOverBudget} categor{categoriesOverBudget > 1 ? 'ies' : 'y'}. Consider adjusting budgets.</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 rounded-2xl bg-blue-50 p-4 border border-blue-100">
                  <TrendingDown className="h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Spending Trend</p>
                    <p className="text-xs text-blue-700 mt-1">Your weekend spending is 18% lower than last month. Great job!</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Savings Projection</p>
                    <p className="text-xs text-emerald-700 mt-1">At this rate, you will hit your savings goal 2 months early.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 12. Budget Calendar (Simplified) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#0F2745] flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-[#1F5EA8]" /> August 2026
                </h3>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-xs font-bold text-slate-400">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Pad empty days for visual */}
                <div className="p-2"></div><div className="p-2"></div><div className="p-2"></div>
                {Array.from({length: 31}).map((_, i) => {
                  const isToday = i + 1 === 23; // Assuming Aug 23, 2026 as per context
                  const hasBill = i + 1 === 15 || i + 1 === 28;
                  return (
                    <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold mx-auto transition-colors cursor-pointer
                      ${isToday ? 'bg-[#1F5EA8] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}
                      ${hasBill && !isToday ? 'border-2 border-rose-200 text-rose-600' : ''}
                    `}>
                      {i + 1}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 justify-center">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <div className="h-2 w-2 rounded-full bg-[#1F5EA8]"></div> Today
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <div className="h-2 w-2 rounded-full border-2 border-rose-300"></div> Upcoming Bill
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        
        {/* 13. Add Expense Modal */}
        {expenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#0F2745]">Add Expense</h3>
                <button onClick={() => setExpenseModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Title / Merchant</label>
                  <input required value={expTitle} onChange={(e) => setExpTitle(e.target.value)} type="text" placeholder="e.g. Uber Ride" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Amount (৳)</label>
                  <input required value={expAmount} onChange={(e) => setExpAmount(e.target.value)} type="number" min="1" placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Category</label>
                  <select required value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20 appearance-none">
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => setExpenseModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3.5 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="flex-1 rounded-xl bg-[#1F5EA8] py-3.5 font-semibold text-white hover:bg-[#173F6D] shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Add Record</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 4. Edit Budget Modal */}
        {budgetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#0F2745]">Update Budget</h3>
                <button onClick={() => setBudgetModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateBudget} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Total Monthly Budget Limit (৳)</label>
                  <input required value={editTotalLimit} onChange={(e) => setEditTotalLimit(e.target.value)} type="number" min="1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Savings Goal (৳)</label>
                  <input required value={editSavingsGoal} onChange={(e) => setEditSavingsGoal(e.target.value)} type="number" min="1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => setBudgetModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3.5 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="flex-1 rounded-xl bg-[#1F5EA8] py-3.5 font-semibold text-white hover:bg-[#173F6D] shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* --- Global Custom Toast --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100"
          >
            {toast.type === 'success' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            ) : toast.type === 'error' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600"><AlertTriangle className="h-5 w-5" /></div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Info className="h-5 w-5" /></div>
            )}
            <p className="text-sm font-semibold text-slate-800">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}