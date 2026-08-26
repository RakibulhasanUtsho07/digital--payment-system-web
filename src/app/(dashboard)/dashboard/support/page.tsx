// src/app/(dashboard)/dashboard/support/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, CheckCircle2, Clock, CloudLightning, 
  Download, FileText, Filter, MessageSquare, 
  MoreVertical, RefreshCcw, Search, ShieldAlert, 
  Sun, User, Zap, X, ChevronRight, Activity
} from "lucide-react";

// --- TYPES & INTERFACES ---

export type TicketStatus = "Open" | "Waiting for Customer" | "In Progress" | "Escalated" | "Resolved";
export type TicketPriority = "Low" | "Normal" | "High" | "Urgent";

export interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  slaMinutes: number;
  assignee: string;
  lastActivity: string;
}

export interface SupportMetrics {
  openTickets: number;
  pendingReplies: number;
  slaRisk: number;
  resolvedToday: number;
  csat: number;
}

// --- DEMO DATA (Local Aggregation) ---

const DEMO_METRICS: SupportMetrics = {
  openTickets: 248,
  pendingReplies: 72,
  slaRisk: 18,
  resolvedToday: 186,
  csat: 94.6,
};

const DEMO_TICKETS: SupportTicket[] = [
  {
    id: "SUP-10482",
    customerName: "Rakib Hasan",
    customerEmail: "rakib.h@example.com",
    subject: "Unable to complete transfer to Dutch-Bangla",
    category: "Transfer",
    priority: "Urgent",
    status: "Open",
    slaMinutes: 11,
    assignee: "Sayem M.",
    lastActivity: "2 mins ago"
  },
  {
    id: "SUP-10483",
    customerName: "Nadia Rahman",
    customerEmail: "nadia.r@example.com",
    subject: "NID verification rejected",
    category: "KYC",
    priority: "High",
    status: "Waiting for Customer",
    slaMinutes: 45,
    assignee: "Unassigned",
    lastActivity: "15 mins ago"
  },
  {
    id: "SUP-10484",
    customerName: "Tariqul Islam",
    customerEmail: "tariqul.i@example.com",
    subject: "Wallet frozen after login attempt",
    category: "Security",
    priority: "Urgent",
    status: "Escalated",
    slaMinutes: 0,
    assignee: "Security Team",
    lastActivity: "1 hour ago"
  }
];

// --- COMPONENTS (Architecturally meant for /components/ folder) ---

const CommandHeader = () => (
  <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-[#0F2745]">Support Operations</h1>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
          </span>
          <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full border border-slate-300">
            Administrator
          </span>
        </div>
      </div>
      <p className="text-slate-500">Resolve customer issues faster with real-time support intelligence and operational visibility.</p>
    </div>

    <div className="flex items-center gap-3">
      <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#173F6D] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm">
        <Download className="w-4 h-4" /> Export
      </button>
      <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#173F6D] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm">
        <RefreshCcw className="w-4 h-4" /> Refresh
      </button>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1F5EA8] text-white rounded-xl hover:bg-[#173F6D] transition-colors text-sm font-semibold shadow-md shadow-blue-900/20">
        <MessageSquare className="w-4 h-4" /> Create Ticket
      </button>
    </div>
  </header>
);

const SupportPulse = ({ metrics }: { metrics: SupportMetrics }) => (
  <div className="bg-[#0F2745] text-white rounded-3xl p-8 relative overflow-hidden shadow-xl mb-6">
    {/* Animated Pulse Line */}
    <div className="absolute top-1/2 left-0 w-full h-px bg-[#1F5EA8] opacity-30">
      <motion.div 
        className="h-full w-1/4 bg-cyan-400 opacity-50 shadow-[0_0_15px_3px_rgba(34,211,238,0.5)]"
        animate={{ x: ['-100%', '400%'] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />
    </div>
    
    <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
      <div className="flex-shrink-0">
        <h2 className="text-lg font-medium text-[#1F5EA8] mb-1">Support Pulse</h2>
        <p className="text-sm text-slate-400">Live Operations</p>
      </div>
      
      <div className="flex w-full justify-between items-center gap-4">
        {[
          { label: "Open Tickets", value: metrics.openTickets, icon: MessageSquare },
          { label: "Pending Replies", value: metrics.pendingReplies, icon: Clock },
          { label: "SLA Risk", value: metrics.slaRisk, icon: AlertCircle, color: "text-amber-400" },
          { label: "Resolved Today", value: metrics.resolvedToday, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "CSAT", value: `${metrics.csat}%`, icon: Zap, color: "text-cyan-400" },
        ].map((metric, i) => (
          <motion.div 
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center group cursor-default"
          >
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">{metric.label}</div>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${metric.color || 'text-white'}`}>
                {metric.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const SupportWeather = ({ slaRisk }: { slaRisk: number }) => {
  const isClear = slaRisk < 20;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200"
    >
      <div className={`p-4 rounded-2xl ${isClear ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
        {isClear ? <Sun className="w-8 h-8" /> : <CloudLightning className="w-8 h-8" />}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#173F6D] uppercase tracking-wider mb-1">Support Weather</p>
        <h3 className="text-xl font-bold text-[#0F2745]">{isClear ? "Clear Skies" : "Cloudy"}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {isClear ? "Backlog is healthy and SLAs are intact." : "SLA pressure is rising. Monitor queue closely."}
          <span className="ml-2 inline-block px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px] uppercase tracking-wide">Demo Indicator</span>
        </p>
      </div>
    </motion.div>
  );
};

const TicketDrawer = ({ ticket, onClose }: { ticket: SupportTicket, onClose: () => void }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-[#F6F8FB]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-[#0F2745]">{ticket.id}</h2>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">{ticket.priority}</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{ticket.status}</span>
            </div>
            <h3 className="text-lg text-slate-700 font-medium">{ticket.subject}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* One Click Context Strip */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between text-sm bg-white">
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> <span className="font-medium text-[#0F2745]">{ticket.customerName}</span></div>
          <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-emerald-500"/> <span className="text-slate-500">KYC Verified</span></div>
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500"/> <span className="text-slate-500">Wallet Active</span></div>
        </div>

        {/* Next Best Action (Demo) */}
        <div className="m-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
          <Zap className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-indigo-900 mb-1">Recommended Next Step</h4>
            <p className="text-sm text-indigo-700">Inspect the related failed transaction (TXN-8829) before responding to the customer.</p>
            <span className="mt-2 inline-block px-2 py-0.5 bg-white text-indigo-400 rounded text-[10px] uppercase tracking-wide border border-indigo-100">Demo Insight</span>
          </div>
        </div>

        {/* Placeholder for Conversation Component */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex items-center justify-center text-slate-400 font-medium">
          [Interactive Conversation Thread Loading...]
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- MAIN PAGE ORCHESTRATOR ---

export default function SupportDashboard() {
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  const metrics = useMemo(() => DEMO_METRICS, []);
  const tickets = useMemo(() => DEMO_TICKETS, []);

  return (
    <div className="min-h-screen bg-[#F6F8FB] p-6 md:p-8 font-sans relative overflow-hidden">
      <CommandHeader />

      <div className="space-y-6">
        {/* Top Intelligence Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SupportPulse metrics={metrics} />
          </div>
          <div className="xl:col-span-1">
            <SupportWeather slaRisk={metrics.slaRisk} />
          </div>
        </div>

        {/* Attention Required */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-[#173F6D] uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" /> Attention Required
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm">
              <h4 className="font-bold text-[#0F2745] mb-1">SLA Breach Risk</h4>
              <p className="text-sm text-slate-500 mb-3">18 tickets may breach SLA within 15 minutes.</p>
              <button className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">Review Queue <ChevronRight className="w-4 h-4"/></button>
            </div>
            <div className="bg-white border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
              <h4 className="font-bold text-[#0F2745] mb-1">VIP Customer Waiting</h4>
              <p className="text-sm text-slate-500 mb-3">3 priority customers are awaiting a response.</p>
              <button className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">Open Priority <ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        </section>

        {/* Support Queue Workspace */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-[#F6F8FB]/50">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ticket, customer, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5EA8]/20 transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-[#173F6D] rounded-xl text-sm font-semibold hover:bg-slate-50">
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>
          </div>

          {/* Table Shell */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets.map((ticket) => (
                  <motion.tr 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <td className="px-6 py-4 font-medium text-[#1F5EA8]">{ticket.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#0F2745]">{ticket.customerName}</div>
                      <div className="text-xs text-slate-500">{ticket.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#0F2745]">{ticket.subject}</div>
                      <div className="text-xs text-slate-500">{ticket.category} • {ticket.lastActivity}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${ticket.slaMinutes < 15 ? 'text-rose-500' : 'text-slate-600'}`}>
                        {ticket.slaMinutes > 0 ? `${ticket.slaMinutes}m rem.` : 'Breached'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-[#173F6D] hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Ticket Drawer Overlay */}
      {selectedTicket && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F2745] z-40"
            onClick={() => setSelectedTicket(null)}
          />
          <TicketDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        </>
      )}
    </div>
  );
}