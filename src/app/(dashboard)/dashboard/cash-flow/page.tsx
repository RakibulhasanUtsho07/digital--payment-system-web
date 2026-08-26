"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, 
  Calendar as CalendarIcon, Plus, Info, RefreshCw, BarChart3, 
  PieChart, Activity, AlertTriangle, Zap, CheckCircle2, ChevronRight, 
  X, Target, Clock, Calculator
} from "lucide-react";

// --- Types & Interfaces ---
type TransactionType = "income" | "expense";

interface CashFlowEvent {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  isRecurring: boolean;
  status: "completed" | "pending";
}

interface SimulatorState {
  active: boolean;
  amount: number;
  type: TransactionType;
  daysFromNow: number;
}

// --- Default Mock Data ---
const CURRENT_BALANCE = 25450;
const BUFFER_AMOUNT = 5000; // Minimum safety buffer

const DEFAULT_EVENTS: CashFlowEvent[] = [
  { id: "e1", title: "Salary", amount: 42800, type: "income", category: "Salary", date: new Date(Date.now() - 86400000 * 2).toISOString(), isRecurring: true, status: "completed" },
  { id: "e2", title: "Office Rent", amount: 12000, type: "expense", category: "Bills", date: new Date(Date.now() - 86400000 * 1).toISOString(), isRecurring: true, status: "completed" },
  { id: "e3", title: "Freelance Client", amount: 8500, type: "income", category: "Freelance", date: new Date(Date.now() + 86400000 * 3).toISOString(), isRecurring: false, status: "pending" },
  { id: "e4", title: "Electricity Bill", amount: 2450, type: "expense", category: "Utilities", date: new Date(Date.now() + 86400000 * 5).toISOString(), isRecurring: true, status: "pending" },
  { id: "e5", title: "Netflix", amount: 650, type: "expense", category: "Subscriptions", date: new Date(Date.now() + 86400000 * 7).toISOString(), isRecurring: true, status: "pending" },
  { id: "e6", title: "Planned Grocery", amount: 4000, type: "expense", category: "Food", date: new Date(Date.now() + 86400000 * 10).toISOString(), isRecurring: false, status: "pending" },
];

// --- Helpers ---
const formatCurrency = (amount: number) => `৳ ${amount.toLocaleString("en-IN")}`;
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

export default function CashFlowPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [events, setEvents] = useState<CashFlowEvent[]>(DEFAULT_EVENTS);
  const [balance, setBalance] = useState(CURRENT_BALANCE);
  
  // UI States
  const [timeframe, setTimeframe] = useState<"30D" | "90D" | "6M">("30D");
  const [showSafeToSpendDetails, setShowSafeToSpendDetails] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  
  // Simulator State
  const [simulator, setSimulator] = useState<SimulatorState>({ active: false, amount: 5000, type: "expense", daysFromNow: 5 });

  // Add Event Form States
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formDate, setFormDate] = useState("");

  // Initialization
  useEffect(() => {
    setIsMounted(true);
    const savedEvents = localStorage.getItem("nova_cashflow_events");
    const savedBalance = localStorage.getItem("nova_cashflow_balance");
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedBalance) setBalance(JSON.parse(savedBalance));
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("nova_cashflow_events", JSON.stringify(events));
      localStorage.setItem("nova_cashflow_balance", JSON.stringify(balance));
    }
  }, [events, balance, isMounted]);

  // --- Core Calculations ---
  
  const upcomingEvents = useMemo(() => {
    return events.filter(e => e.status === "pending").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const upcomingExpensesAmount = useMemo(() => {
    return upcomingEvents.filter(e => e.type === "expense" && new Date(e.date).getTime() < Date.now() + (14 * 86400000))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [upcomingEvents]);

  // SAFE TO SPEND CALCULATION
  const safeToSpend = useMemo(() => {
    const safe = balance - upcomingExpensesAmount - BUFFER_AMOUNT;
    return safe > 0 ? safe : 0;
  }, [balance, upcomingExpensesAmount]);

  const netFlow = useMemo(() => {
    const recentEvents = events.filter(e => e.status === "completed");
    const income = recentEvents.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expense = recentEvents.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return income - expense;
  }, [events]);

  const healthScore = useMemo(() => {
    let score = 100;
    if (netFlow < 0) score -= 20;
    if (safeToSpend < 2000) score -= 15;
    if (upcomingExpensesAmount > balance * 0.5) score -= 15;
    return Math.max(0, Math.min(100, score));
  }, [netFlow, safeToSpend, upcomingExpensesAmount, balance]);

  // Forecast Logic (For SVG Chart)
  const forecastData = useMemo(() => {
    let currentBal = balance;
    const points: { day: number, balance: number, isForecast: boolean }[] = [];
    const days = timeframe === "30D" ? 30 : timeframe === "90D" ? 90 : 180;
    
    // Past 7 days for historical context
    for (let i = -7; i < 0; i++) {
      points.push({ day: i, balance: balance * (1 + (i * 0.01)), isForecast: false }); // mock past
    }
    
    // Future projection
    for (let i = 0; i <= days; i++) {
      const currentDate = addDays(new Date(), i);
      const dayEvents = upcomingEvents.filter(e => new Date(e.date).toDateString() === currentDate.toDateString());
      
      dayEvents.forEach(e => {
        if (e.type === "income") currentBal += e.amount;
        else currentBal -= e.amount;
      });

      // What-If Simulation Injection
      if (simulator.active && i === simulator.daysFromNow) {
        if (simulator.type === "income") currentBal += simulator.amount;
        else currentBal -= simulator.amount;
      }

      points.push({ day: i, balance: currentBal, isForecast: true });
    }
    return points;
  }, [balance, upcomingEvents, timeframe, simulator]);

  // Chart SVG Path Generator
  const generateChartPath = (isForecast: boolean) => {
    const relevantPoints = forecastData.filter(p => p.isForecast === isForecast || p.day === 0);
    if (relevantPoints.length === 0) return "";
    
    const minBal = Math.min(...forecastData.map(p => p.balance)) * 0.9;
    const maxBal = Math.max(...forecastData.map(p => p.balance)) * 1.1;
    const rangeY = maxBal - minBal || 1;
    
    const minDay = Math.min(...relevantPoints.map(p => p.day));
    const maxDay = Math.max(...relevantPoints.map(p => p.day));
    const rangeX = maxDay - minDay || 1;

    return relevantPoints.map((p, i) => {
      const x = ((p.day - minDay) / rangeX) * 100;
      const y = 100 - (((p.balance - minBal) / rangeY) * 100);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!formTitle || isNaN(amount) || amount <= 0 || !formDate) return;
    
    const isPast = new Date(formDate).getTime() <= Date.now();
    const newEvent: CashFlowEvent = {
      id: `ev_${Date.now()}`,
      title: formTitle, amount, type: formType, category: "General",
      date: new Date(formDate).toISOString(), isRecurring: false,
      status: isPast ? "completed" : "pending"
    };
    
    setEvents([...events, newEvent]);
    if (isPast) {
      setBalance(prev => formType === "income" ? prev + amount : prev - amount);
    }
    setAddEventModalOpen(false);
    setFormTitle(""); setFormAmount(""); setFormDate("");
  };

  if (!isMounted) return null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-16 bg-[#F6F8FB] min-h-screen font-sans">
      
      {/* 1. HERO SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0F2745] to-[#1F5EA8] p-8 md:p-10 text-white shadow-xl"
      >
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 pointer-events-none">
           {/* Abstract Data Visualization Background */}
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <motion.path 
               d="M0,50 Q25,30 50,50 T100,50" 
               fill="none" stroke="cyan" strokeWidth="0.5" 
               initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
             />
             <motion.path 
               d="M0,60 Q25,80 50,60 T100,60" 
               fill="none" stroke="#3b82f6" strokeWidth="0.5" 
               initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.3 }} transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
             />
           </svg>
        </div>
        
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
          <div className="space-y-4 w-full xl:w-1/2">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Cash Flow</h1>
              <p className="text-blue-100/80 text-lg max-w-md">Understand today's balance, tomorrow's commitments, and your financial direction.</p>
            </div>
            
            <div className="flex flex-wrap items-end gap-8 pt-4">
              <div>
                <p className="text-sm text-blue-200 font-medium mb-1">Current Balance</p>
                <h2 className="text-4xl font-bold">{formatCurrency(balance)}</h2>
              </div>
              <div>
                <p className="text-sm text-blue-200 font-medium mb-1">Net Flow (30 Days)</p>
                <div className={`flex items-center gap-2 text-xl font-bold ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netFlow >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {netFlow >= 0 ? '+' : '-'} {formatCurrency(Math.abs(netFlow))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button onClick={() => { setFormType("income"); setAddEventModalOpen(true); }} className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#1F5EA8] shadow-lg hover:bg-blue-50 active:scale-95 transition-all">
                Add Income
              </button>
              <button onClick={() => { setFormType("expense"); setAddEventModalOpen(true); }} className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all">
                Add Expense
              </button>
            </div>
          </div>

          {/* 2. SAFE TO SPEND TODAY */}
          <div className="relative w-full xl:w-auto shrink-0">
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative z-20 rounded-3xl bg-white/10 p-6 md:p-8 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Safe to Spend Today
                </h3>
                <button onClick={() => setShowSafeToSpendDetails(!showSafeToSpendDetails)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                  <Info className="h-5 w-5 text-blue-200" />
                </button>
              </div>
              <p className="text-5xl font-extrabold tracking-tight text-white mb-2">{formatCurrency(safeToSpend)}</p>
              <p className="text-sm text-blue-100/80 mb-4 max-w-xs">You can spend this amount today while staying on track with upcoming commitments.</p>

              <AnimatePresence>
                {showSafeToSpendDetails && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/10 pt-4 mt-4 space-y-2 text-sm text-blue-100"
                  >
                    <div className="flex justify-between"><span>Current Balance</span> <span>{formatCurrency(balance)}</span></div>
                    <div className="flex justify-between text-rose-300"><span>Upcoming Bills (14d)</span> <span>- {formatCurrency(upcomingExpensesAmount)}</span></div>
                    <div className="flex justify-between text-amber-300"><span>Safety Buffer</span> <span>- {formatCurrency(BUFFER_AMOUNT)}</span></div>
                    <div className="h-px w-full bg-white/20 my-2" />
                    <div className="flex justify-between font-bold text-white"><span>Safe to Spend</span> <span>{formatCurrency(safeToSpend)}</span></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* --- MAIN COLUMN (Charts & Calendar) --- */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 3 & 4. FORECAST CHART */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0F2745] flex items-center gap-2">
                    <Activity className="h-6 w-6 text-[#1F5EA8]" /> Balance Forecast
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Projected cash flow based on commitments</p>
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {(["30D", "90D", "6M"] as const).map(t => (
                    <button key={t} onClick={() => setTimeframe(t)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${timeframe === t ? 'bg-white text-[#1F5EA8] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom SVG Chart Area */}
              <div className="relative h-64 w-full border-b border-slate-100">
                <svg className="w-full h-full overflow-visible" viewBox="0 -10 100 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f5f9" strokeWidth="0.5" />
                  ))}
                  
                  {/* Historical Line */}
                  <motion.path
                    d={generateChartPath(false)}
                    fill="none" stroke="#1F5EA8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }}
                  />
                  
                  {/* Forecast Line */}
                  <motion.path
                    d={generateChartPath(true)}
                    fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5 }}
                  />
                  
                  {/* Divider Line (Today) */}
                  <line x1="20" y1="0" x2="20" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
                
                {/* Labels */}
                <div className="absolute inset-0 flex items-end justify-between pointer-events-none pb-2">
                  <div className="flex gap-4 px-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#1F5EA8]"></div> Historical</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-cyan-400 border-dashed border-b-2 border-cyan-400 bg-transparent"></div> Projected</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 5. CASH FLOW CALENDAR (Simplified Strip) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#0F2745] flex items-center gap-2">
                  <CalendarIcon className="h-6 w-6 text-[#1F5EA8]" /> Upcoming Schedule
                </h2>
                <button className="text-sm font-semibold text-[#1F5EA8] hover:underline flex items-center gap-1">
                  Full Calendar <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                {Array.from({length: 14}).map((_, i) => {
                  const date = addDays(new Date(), i);
                  const isToday = i === 0;
                  const dayEvents = upcomingEvents.filter(e => new Date(e.date).toDateString() === date.toDateString());
                  const hasIncome = dayEvents.some(e => e.type === "income");
                  const hasExpense = dayEvents.some(e => e.type === "expense");

                  return (
                    <div key={i} className={`flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center relative transition-all cursor-pointer hover:-translate-y-1 ${isToday ? 'border-[#1F5EA8] bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                      <span className="text-xs font-bold text-slate-400 uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className={`text-xl font-bold mt-1 ${isToday ? 'text-[#1F5EA8]' : 'text-[#0F2745]'}`}>{date.getDate()}</span>
                      <div className="absolute bottom-2 flex gap-1">
                        {hasIncome && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
                        {hasExpense && <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Event List for selected timeframe */}
              <div className="mt-4 divide-y divide-slate-100">
                {upcomingEvents.slice(0, 4).map(event => (
                  <div key={event.id} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${event.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {event.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F2745]">{event.title}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(event.date).toLocaleDateString()} • {event.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${event.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {event.type === 'income' ? '+' : '-'} {formatCurrency(event.amount)}
                      </p>
                      {event.isRecurring && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold inline-block mt-1">Recurring</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- SIDEBAR (Insights, Health, What-If) --- */}
        <div className="space-y-8">
          
          {/* 11. CASH FLOW HEALTH SCORE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center">
              <h3 className="font-bold text-[#0F2745] flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-emerald-500" /> Cash Flow Health
              </h3>
              
              <div className="relative h-32 w-32 mb-4">
                <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none" 
                    stroke={healthScore > 75 ? "#10b981" : healthScore > 50 ? "#f59e0b" : "#ef4444"} 
                    strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - healthScore / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[#0F2745]">{Math.round(healthScore)}</span>
                </div>
              </div>
              
              <h4 className="font-bold text-slate-800">{healthScore > 75 ? "Excellent" : healthScore > 50 ? "Healthy" : "Needs Attention"}</h4>
              <p className="text-sm text-slate-500 mt-1 mb-5">Your inflow currently covers your outflow efficiently.</p>
              
              <div className="w-full space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Positive Net Flow</div>
                <div className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Strong Balance Buffer</div>
              </div>
            </div>
          </motion.div>

          {/* 15. WHAT-IF SIMULATOR */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="rounded-3xl border border-[#1F5EA8]/20 bg-blue-50/50 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-[#1F5EA8] rounded-xl text-white"><Calculator className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-[#0F2745]">What If?</h3>
                  <p className="text-xs text-[#1F5EA8]">Simulate future cash flow</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 bg-white rounded-xl p-1 border border-blue-100">
                  <button onClick={() => setSimulator({...simulator, type: "expense"})} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${simulator.type === "expense" ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}>Expense</button>
                  <button onClick={() => setSimulator({...simulator, type: "income"})} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${simulator.type === "income" ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}>Income</button>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Amount (৳)</label>
                  <input type="number" value={simulator.amount} onChange={e => setSimulator({...simulator, amount: Number(e.target.value)})} className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-[#0F2745] outline-none focus:border-[#1F5EA8]" />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">When? (Days from now)</label>
                  <input type="range" min="1" max="30" value={simulator.daysFromNow} onChange={e => setSimulator({...simulator, daysFromNow: Number(e.target.value)})} className="w-full accent-[#1F5EA8]" />
                  <div className="text-right text-xs font-bold text-[#1F5EA8]">In {simulator.daysFromNow} days</div>
                </div>

                <button 
                  onClick={() => setSimulator({...simulator, active: !simulator.active})}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${simulator.active ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-[#1F5EA8] text-white hover:bg-[#173F6D]'}`}
                >
                  {simulator.active ? 'Clear Simulation' : 'Run Simulation'}
                </button>
              </div>

              <AnimatePresence>
                {simulator.active && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 p-3 bg-white rounded-xl border border-blue-100">
                    <p className="text-xs text-slate-500 text-center font-medium">Projected impact on balance is now visible on the forecast chart.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 12. LOW BALANCE / ALERTS */}
          {upcomingExpensesAmount > balance * 0.8 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-amber-50 p-5 border border-amber-200">
              <div className="flex gap-3">
                <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
                <div>
                  <h4 className="font-bold text-amber-900">Low Balance Alert</h4>
                  <p className="text-sm text-amber-700 mt-1">Your upcoming commitments are very close to your current balance. Consider postponing non-essential expenses.</p>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* --- ADD EVENT MODAL --- */}
      <AnimatePresence>
        {addEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#0F2745] capitalize">Add {formType}</h3>
                <button onClick={() => setAddEventModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
              
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Title</label>
                  <input required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} type="text" placeholder="e.g. Salary, Rent" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Amount (৳)</label>
                  <input required value={formAmount} onChange={(e) => setFormAmount(e.target.value)} type="number" min="1" placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Date (Past or Future)</label>
                  <input required value={formDate} onChange={(e) => setFormDate(e.target.value)} type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-2 focus:ring-[#1F5EA8]/20" />
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                  <button type="button" onClick={() => setAddEventModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3.5 font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
                  <button type="submit" className="flex-1 rounded-xl bg-[#1F5EA8] py-3.5 font-semibold text-white hover:bg-[#173F6D] shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Save Event</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}