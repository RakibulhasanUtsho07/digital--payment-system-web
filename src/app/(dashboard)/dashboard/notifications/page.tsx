"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, ShieldAlert, AlertTriangle, ArrowRightLeft, PieChart, CheckCircle2,
  FileText, Clock, Settings, ShieldCheck, Mail, Smartphone, BellOff, X,
  Trash2, Archive, Check, ChevronRight, Zap, Filter, Search, Receipt,
  TrendingDown, TrendingUp, Lock, ArrowUpRight
} from "lucide-react";

// --- TYPES & INTERFACES ---

type NotificationType = "security" | "transaction" | "budget" | "kyc" | "receipt" | "system";
type Priority = "critical" | "high" | "normal" | "low";

interface Notification {
  id: string;
  type: NotificationType;
  priority: Priority;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  isArchived: boolean;
  actionLink?: string;
  actionText?: string;
  amount?: number;
  currency?: string;
  merchant?: string;
}

interface Preferences {
  channels: { inApp: boolean; email: boolean; push: boolean };
  categories: Record<NotificationType, boolean>;
  quietHours: { enabled: boolean; start: string; end: string };
  digest: "off" | "daily" | "weekly";
}

// --- MOCK DATA GENERATOR ---

const generateMockNotifications = (): Notification[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 5);

  return [
    {
      id: "n-1",
      type: "security",
      priority: "critical",
      title: "New device sign-in detected",
      message: "A new Chrome session was detected in Dhaka. Wasn't you? Secure your account now.",
      date: now.toISOString(),
      isRead: false,
      isArchived: false,
      actionLink: "/dashboard/security",
      actionText: "Secure Account",
    },
    {
      id: "n-2",
      type: "budget",
      priority: "high",
      title: "Food budget is 84% used",
      message: "You have approximately ৳960 remaining this month for Food & Dining.",
      date: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      isRead: false,
      isArchived: false,
      actionLink: "/dashboard/budgeting",
      actionText: "Review Budget",
    },
    {
      id: "n-3",
      type: "transaction",
      priority: "normal",
      title: "Payment completed",
      message: "Your payment to TechLand was successfully processed.",
      date: new Date(now.getTime() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      isRead: true,
      isArchived: false,
      amount: 1450,
      currency: "৳",
      merchant: "TechLand",
      actionLink: "/dashboard/transactions",
      actionText: "View Transaction",
    },
    {
      id: "n-4",
      type: "kyc",
      priority: "normal",
      title: "KYC verification approved",
      message: "Your identity verification is complete. Your account limits have been upgraded.",
      date: yesterday.toISOString(),
      isRead: false,
      isArchived: false,
      actionLink: "/dashboard/kyc",
      actionText: "View Profile",
    },
    {
      id: "n-5",
      type: "receipt",
      priority: "high",
      title: "Warranty expiring soon",
      message: "Your Sony Headphones warranty expires in 14 days.",
      date: yesterday.toISOString(),
      isRead: true,
      isArchived: false,
      merchant: "Gadget Zone",
      actionLink: "/dashboard/receipts",
      actionText: "View Receipt",
    },
    {
      id: "n-6",
      type: "transaction",
      priority: "normal",
      title: "Money Received",
      message: "You received a transfer from Rahim Uddin.",
      date: lastWeek.toISOString(),
      isRead: true,
      isArchived: false,
      amount: 5000,
      currency: "৳",
    },
  ];
};

const DEFAULT_PREFERENCES: Preferences = {
  channels: { inApp: true, email: true, push: false },
  categories: { security: true, transaction: true, budget: true, kyc: true, receipt: true, system: true },
  quietHours: { enabled: false, start: "22:00", end: "07:00" },
  digest: "daily",
};

// --- MAIN PAGE COMPONENT ---

export default function NotificationCenterPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [activeTab, setActiveTab] = useState<"inbox" | "insights" | "settings">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | NotificationType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerNotification, setDrawerNotification] = useState<Notification | null>(null);

  // Hydration & Local Storage Initialization
  useEffect(() => {
    setIsMounted(true);
    const storedNotifs = localStorage.getItem("novawallet_notifications");
    const storedPrefs = localStorage.getItem("novawallet_notif_prefs");
    
    if (storedNotifs) {
      setNotifications(JSON.parse(storedNotifs));
    } else {
      const initial = generateMockNotifications();
      setNotifications(initial);
      localStorage.setItem("novawallet_notifications", JSON.stringify(initial));
    }

    if (storedPrefs) setPreferences(JSON.parse(storedPrefs));
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("novawallet_notifications", JSON.stringify(notifications));
      localStorage.setItem("novawallet_notif_prefs", JSON.stringify(preferences));
    }
  }, [notifications, preferences, isMounted]);

  // Derived State
  const activeNotifications = useMemo(() => notifications.filter(n => !n.isArchived), [notifications]);
  const unreadCount = activeNotifications.filter(n => !n.isRead).length;
  const criticalCount = activeNotifications.filter(n => n.priority === "critical" && !n.isRead).length;
  const actionRequiredCount = activeNotifications.filter(n => (n.priority === "high" || n.priority === "critical") && !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    let result = activeNotifications;
    if (filterType === "unread") result = result.filter(n => !n.isRead);
    else if (filterType !== "all") result = result.filter(n => n.type === filterType);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.message.toLowerCase().includes(q) ||
        (n.merchant && n.merchant.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeNotifications, filterType, searchQuery]);

  // Actions
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleArchive = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isArchived: true } : n));
    setDrawerNotification(null);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = (action: "read" | "archive" | "delete") => {
    setNotifications(prev => prev.map(n => {
      if (!selectedIds.has(n.id)) return n;
      if (action === "read") return { ...n, isRead: true };
      if (action === "archive") return { ...n, isArchived: true };
      return n; // Delete would filter, but keeping simple for demo
    }).filter(n => !(action === "delete" && selectedIds.has(n.id))));
    setSelectedIds(new Set());
  };

  if (!isMounted) return <div className="min-h-screen bg-[#F6F8FB]" />; // Prevent hydration mismatch

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F2745] font-sans selection:bg-[#1F5EA8] selection:text-white pb-32">
      
      {/* 1. HERO: COMMAND CENTER */}
      <div className="bg-[#0F2745] text-white pt-12 pb-24 px-4 md:px-8 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#1F5EA8] rounded-full blur-[120px] opacity-40 mix-blend-screen" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Notification Center</h1>
            <p className="text-slate-300 text-lg max-w-xl">
              Stay informed about your wallet, payments, security, and financial activity.
            </p>
          </div>
          
          <div className="flex gap-4 items-center">
            <button onClick={handleMarkAllRead} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-sm font-medium transition-colors flex items-center gap-2 border border-white/10">
              <CheckCircle2 className="w-4 h-4" /> Mark all read
            </button>
            <div className="relative p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center">
               <Bell className="w-8 h-8 text-white" />
               {unreadCount > 0 && (
                 <motion.span 
                   initial={{ scale: 0 }} animate={{ scale: 1 }} 
                   className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0F2745]" 
                 />
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-20 space-y-8">
        
        {/* 2. SMART SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Unread" count={unreadCount} icon={<Bell />} color="blue" />
          <StatCard title="Action Required" count={actionRequiredCount} icon={<AlertTriangle />} color="amber" highlight={actionRequiredCount > 0} />
          <StatCard title="Critical Alerts" count={criticalCount} icon={<ShieldAlert />} color="red" highlight={criticalCount > 0} />
          <StatCard title="Recent Activity" count={activeNotifications.length} icon={<Zap />} color="emerald" />
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 bg-white p-1.5 rounded-2xl w-full md:w-fit border border-slate-200 shadow-sm">
          {(["inbox", "insights", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all capitalize whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-[#F6F8FB] text-[#1F5EA8] shadow-sm" 
                  : "text-slate-500 hover:text-[#0F2745] hover:bg-slate-50"
              }`}
            >
              {tab === "inbox" ? "Inbox & Alerts" : tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "inbox" && (
            <motion.div key="inbox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: FILTERS & INBOX */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 3. PRIORITY ALERTS CENTER */}
                {criticalCount > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                    <h3 className="text-red-800 font-bold flex items-center gap-2 mb-4">
                      <ShieldAlert className="w-5 h-5" /> Critical Security Alerts
                    </h3>
                    <div className="space-y-3">
                      {activeNotifications.filter(n => n.priority === "critical" && !n.isRead).map(alert => (
                        <div key={alert.id} className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h4 className="font-bold text-[#0F2745]">{alert.title}</h4>
                            <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                          </div>
                          <button onClick={() => setDrawerNotification(alert)} className="whitespace-nowrap px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
                            {alert.actionText || "Review Issue"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. INBOX CONTROLS */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#F6F8FB] border-none rounded-2xl focus:ring-2 focus:ring-[#1F5EA8]/20 outline-none transition-all text-[#0F2745]"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {["all", "unread", "transaction", "security", "budget"].map(filter => (
                      <button 
                        key={filter} 
                        onClick={() => setFilterType(filter as any)}
                        className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border capitalize ${
                          filterType === filter ? "bg-[#1F5EA8] text-white border-[#1F5EA8]" : "bg-[#F6F8FB] hover:bg-slate-100 text-slate-600 border-transparent"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. NOTIFICATION LIST */}
                <div className="space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <AnimatePresence>
                      {filteredNotifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          isSelected={selectedIds.has(notification.id)}
                          onSelect={() => toggleSelection(notification.id)}
                          onClick={() => {
                            if (!notification.isRead) handleMarkAsRead(notification.id);
                            setDrawerNotification(notification);
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: ACTION CENTER */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sticky top-6">
                  <h3 className="font-bold text-lg text-[#0F2745] mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1F5EA8]" /> Things You Should Do
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Action Items based on mock unread data */}
                    <ActionCard 
                      title="Complete KYC Profile" 
                      desc="Upgrade your limits by finishing verification."
                      icon={<FileText className="w-5 h-5" />} 
                      color="blue"
                      link="/dashboard/kyc"
                    />
                    <ActionCard 
                      title="Review Food Budget" 
                      desc="You are near your ৳10,000 monthly limit."
                      icon={<PieChart className="w-5 h-5" />} 
                      color="amber"
                      link="/dashboard/budgeting"
                    />
                    <ActionCard 
                      title="Secure Account" 
                      desc="A new sign-in requires your attention."
                      icon={<ShieldAlert className="w-5 h-5" />} 
                      color="red"
                      link="/dashboard/security"
                    />
                  </div>

                  {/* Quick Links */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Links</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <QuickLink icon={<ArrowRightLeft />} label="Transactions" />
                      <QuickLink icon={<Receipt />} label="Receipts" />
                      <QuickLink icon={<Settings />} label="Preferences" />
                      <QuickLink icon={<Archive />} label="Archived" />
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-6">Notification Activity</h2>
                  {/* Mock CSS Bar Chart */}
                  <div className="h-64 flex items-end justify-between gap-2 border-b border-slate-100 pb-2">
                    {[40, 65, 30, 80, 45, 90, 50].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <motion.div 
                          initial={{ height: 0 }} animate={{ height: `${h}%` }}
                          className="w-full max-w-[40px] bg-gradient-to-t from-[#1F5EA8] to-cyan-400 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity relative"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0F2745] text-white text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            {h} Alerts
                          </div>
                        </motion.div>
                        <span className="text-xs text-slate-400 font-medium">Day {i+1}</span>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                   <div>
                     <h3 className="font-bold text-lg mb-1">Top Category</h3>
                     <p className="text-slate-500 text-sm">Most of your alerts are transactions.</p>
                   </div>
                   <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#1F5EA8] border-r-[#1F5EA8] flex items-center justify-center">
                     <span className="font-bold text-sm">48%</span>
                   </div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" /> Smart Batching Demo
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">NovaWallet groups similar notifications to reduce clutter.</p>
                    <div className="bg-[#F6F8FB] p-3 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                       <div className="flex items-center gap-3">
                         <div className="flex -space-x-2">
                           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white z-20"><ArrowRightLeft className="w-4 h-4 text-blue-600"/></div>
                           <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white z-10"><ArrowRightLeft className="w-4 h-4 text-emerald-600"/></div>
                         </div>
                         <span className="font-medium text-sm">3 Transaction Updates</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                 </div>
               </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-[#0F2745] mb-2">Delivery Channels</h2>
                  <p className="text-sm text-slate-500 mb-6">How do you want to receive notifications from NovaWallet?</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ToggleCard title="In-App Vault" icon={<Bell />} active={preferences.channels.inApp} onChange={(val) => setPreferences(p => ({...p, channels: {...p.channels, inApp: val}}))} />
                    <ToggleCard title="Email Delivery" icon={<Mail />} active={preferences.channels.email} onChange={(val) => setPreferences(p => ({...p, channels: {...p.channels, email: val}}))} />
                    <ToggleCard title="Push Notifications" icon={<Smartphone />} active={preferences.channels.push} onChange={(val) => setPreferences(p => ({...p, channels: {...p.channels, push: val}}))} />
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div>
                  <h2 className="text-xl font-bold text-[#0F2745] mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-slate-400" /> Notification Privacy
                  </h2>
                  <p className="text-sm text-slate-500 mb-6 max-w-2xl">
                    Financial notification best practices hide sensitive account details in preview messages. Detailed transaction info remains securely inside the authenticated app. Critical security alerts cannot be fully disabled.
                  </p>
                  
                  <div className="space-y-3 bg-[#F6F8FB] rounded-2xl p-4 border border-slate-100">
                     <CategoryToggle title="Security Alerts (Required)" desc="New logins, password changes, suspicious activity." active={true} disabled />
                     <CategoryToggle title="Transactions" desc="Money sent, received, or failed." active={preferences.categories.transaction} onChange={(v) => setPreferences(p => ({...p, categories: {...p.categories, transaction: v}}))} />
                     <CategoryToggle title="Budget & Cash Flow" desc="Warnings when nearing limits." active={preferences.categories.budget} onChange={(v) => setPreferences(p => ({...p, categories: {...p.categories, budget: v}}))} />
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div>
                    <h3 className="font-bold text-[#0F2745] flex items-center gap-2">
                      <BellOff className="w-5 h-5 text-slate-500" /> Quiet Hours
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">Pause routine notifications at night. Critical alerts will still come through.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="time" value={preferences.quietHours.start} onChange={(e) => setPreferences(p => ({...p, quietHours: {...p.quietHours, start: e.target.value}}))} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none" />
                    <span className="text-slate-400">to</span>
                    <input type="time" value={preferences.quietHours.end} onChange={(e) => setPreferences(p => ({...p, quietHours: {...p.quietHours, end: e.target.value}}))} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none" />
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 23. BULK ACTION BAR */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: "-50%" }} 
            animate={{ y: 0, opacity: 1, x: "-50%" }} 
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            className="fixed bottom-8 left-1/2 bg-[#0F2745] text-white px-6 py-4 rounded-2xl shadow-2xl z-40 flex items-center gap-6 w-[90%] md:w-auto min-w-[320px]"
          >
            <div className="font-medium whitespace-nowrap">
              {selectedIds.size} Selected
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction("read")} className="px-4 py-2 hover:bg-white/10 rounded-xl transition-colors text-sm flex items-center gap-2">
                <Check className="w-4 h-4" /> Read
              </button>
              <button onClick={() => handleBulkAction("archive")} className="px-4 py-2 hover:bg-white/10 rounded-xl transition-colors text-sm flex items-center gap-2">
                <Archive className="w-4 h-4" /> Archive
              </button>
            </div>
            <button onClick={() => setSelectedIds(new Set())} className="ml-auto p-2 hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 15. NOTIFICATION DETAILS DRAWER */}
      <AnimatePresence>
        {drawerNotification && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0F2745]/20 backdrop-blur-sm z-50" onClick={() => setDrawerNotification(null)} />
            <motion.div 
              initial={{ x: "100%", opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    {drawerNotification.type}
                  </span>
                  {!drawerNotification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#1F5EA8] animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleArchive(drawerNotification.id)} className="p-2 text-slate-400 hover:text-[#0F2745] hover:bg-slate-50 rounded-xl transition-colors tooltip" title="Archive">
                    <Archive className="w-5 h-5" />
                  </button>
                  <button onClick={() => setDrawerNotification(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Icon & Title */}
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${getIconColors(drawerNotification.type, drawerNotification.priority)}`}>
                    {getTypeIcon(drawerNotification.type)}
                  </div>
                  <h2 className="text-2xl font-bold text-[#0F2745] leading-tight mb-2">
                    {drawerNotification.title}
                  </h2>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 
                    {new Date(drawerNotification.date).toLocaleString()}
                  </p>
                </div>

                {/* Main Message */}
                <div className="bg-[#F6F8FB] p-5 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed text-sm">
                  {drawerNotification.message}
                </div>

                {/* Metadata details if present */}
                {(drawerNotification.amount || drawerNotification.merchant) && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    {drawerNotification.amount && (
                      <div className="flex justify-between p-4 border-b border-slate-100">
                        <span className="text-slate-500 text-sm">Amount</span>
                        <span className="font-bold text-[#0F2745]">{drawerNotification.currency}{drawerNotification.amount.toLocaleString()}</span>
                      </div>
                    )}
                    {drawerNotification.merchant && (
                      <div className="flex justify-between p-4">
                        <span className="text-slate-500 text-sm">Merchant</span>
                        <span className="font-medium text-[#0F2745]">{drawerNotification.merchant}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {drawerNotification.actionLink && (
                  <button className="w-full py-4 bg-[#1F5EA8] hover:bg-[#173F6D] text-white rounded-2xl font-bold transition-colors shadow-md flex items-center justify-center gap-2">
                    {drawerNotification.actionText} <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, count, icon, color, highlight = false }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <div className={`bg-white p-5 rounded-3xl border ${highlight ? 'border-amber-300 shadow-md ring-1 ring-amber-100' : 'border-slate-200 shadow-sm'} flex items-center justify-between transition-all`}>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-amber-600' : 'text-[#0F2745]'}`}>{count}</p>
      </div>
      <div className={`p-3 rounded-2xl ${colors[color as keyof typeof colors]} border`}>
        {icon}
      </div>
    </div>
  );
}

function NotificationCard({ notification, isSelected, onSelect, onClick }: { notification: Notification, isSelected: boolean, onSelect: () => void, onClick: () => void }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group flex items-start gap-4 p-4 rounded-3xl border transition-all cursor-pointer ${
        notification.isRead 
          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' 
          : 'bg-blue-50/30 border-[#1F5EA8]/20 hover:border-[#1F5EA8]/40 shadow-sm'
      }`}
    >
      <div className="pt-1 flex items-center gap-3">
        <div 
          onClick={(e) => { e.stopPropagation(); onSelect(); }} 
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${isSelected ? 'bg-[#1F5EA8] border-[#1F5EA8]' : 'border-slate-300 bg-white group-hover:border-[#1F5EA8]'}`}
        >
          {isSelected && <Check className="w-3. h-3 text-white" />}
        </div>
        <div onClick={onClick} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border ${getIconColors(notification.type, notification.priority)}`}>
          {getTypeIcon(notification.type)}
        </div>
      </div>

      <div onClick={onClick} className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="pr-4">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold truncate ${notification.isRead ? 'text-[#0F2745]' : 'text-[#0F2745]'}`}>
              {notification.title}
            </h4>
            {!notification.isRead && <span className="w-2 h-2 rounded-full bg-[#1F5EA8] shrink-0" />}
            {notification.priority === 'critical' && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase">Critical</span>}
          </div>
          <p className="text-sm text-slate-500 line-clamp-1">{notification.message}</p>
        </div>
        
        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            {formatTime(notification.date)}
          </span>
          {notification.actionText && (
            <span className="text-xs font-bold text-[#1F5EA8] group-hover:underline flex items-center gap-1">
              {notification.actionText} <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({ title, desc, icon, color, link }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200",
    amber: "bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-200",
    red: "bg-red-50 text-red-600 border-red-100 hover:border-red-200",
  };
  return (
    <div className={`p-4 rounded-2xl border transition-colors cursor-pointer group ${colors[color as keyof typeof colors]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <h4 className="font-bold mb-1 group-hover:underline">{title}</h4>
          <p className="text-xs opacity-80">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex items-center gap-2 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-sm font-medium text-slate-600 w-full">
      <span className="text-[#1F5EA8] w-5 h-5">{icon}</span> {label}
    </button>
  );
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Bell className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-[#0F2745] mb-2">You're all caught up!</h3>
      <p className="text-slate-500 max-w-sm">We'll let you know when something important happens with your account.</p>
    </motion.div>
  );
}

function ToggleCard({ title, icon, active, onChange }: any) {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 ${active ? 'border-[#1F5EA8] bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`} onClick={() => onChange(!active)}>
      <div className={`p-3 rounded-full ${active ? 'bg-[#1F5EA8] text-white' : 'bg-slate-100 text-slate-400'}`}>
        {icon}
      </div>
      <h4 className="font-bold text-sm text-[#0F2745]">{title}</h4>
    </div>
  );
}

function CategoryToggle({ title, desc, active, disabled, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-3">
      <div>
        <h4 className="font-bold text-sm text-[#0F2745]">{title}</h4>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <div 
        onClick={() => !disabled && onChange && onChange(!active)} 
        className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${active ? 'bg-[#1F5EA8]' : 'bg-slate-300'}`}
      >
        <motion.div layout className={`w-4 h-4 bg-white rounded-full shadow-sm ${active ? 'ml-auto' : 'mr-auto'}`} />
      </div>
    </div>
  );
}

// --- UTILS ---

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case 'security': return <ShieldAlert className="w-5 h-5" />;
    case 'transaction': return <ArrowRightLeft className="w-5 h-5" />;
    case 'budget': return <PieChart className="w-5 h-5" />;
    case 'kyc': return <FileText className="w-5 h-5" />;
    case 'receipt': return <Receipt className="w-5 h-5" />;
    default: return <Bell className="w-5 h-5" />;
  }
}

function getIconColors(type: NotificationType, priority: Priority) {
  if (priority === 'critical') return "bg-red-50 text-red-600 border-red-100";
  if (type === 'security') return "bg-amber-50 text-amber-600 border-amber-100";
  if (type === 'transaction') return "bg-emerald-50 text-emerald-600 border-emerald-100";
  return "bg-blue-50 text-blue-600 border-blue-100";
}

function formatTime(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}