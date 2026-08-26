"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, UploadCloud, Camera, FileText, CheckCircle2, AlertCircle,
  Clock, ShieldAlert, Tag, MoreVertical, X, Download, Trash2, Edit3,
  BarChart3, Star, ShieldCheck, ChevronRight, FileDigit, Smartphone, Zap
} from "lucide-react";

// --- TYPES & INTERFACES ---

type ReceiptStatus = "normal" | "warranty_active" | "warranty_expiring" | "return_open";

interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

interface Receipt {
  id: string;
  merchant: string;
  date: string;
  total: number;
  tax: number;
  currency: string;
  category: string;
  paymentMethod: string;
  receiptNumber: string;
  status: ReceiptStatus;
  warrantyExpiry?: string;
  returnDeadline?: string;
  isFavorite: boolean;
  tags: string[];
  lineItems: LineItem[];
}

// --- MOCK DATA FOR DEMO ---

const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: "r-1",
    merchant: "TechLand",
    date: "2026-08-18",
    total: 24500,
    tax: 3675,
    currency: "৳",
    category: "Electronics",
    paymentMethod: "Visa ending in 4242",
    receiptNumber: "INV-8472-A",
    status: "warranty_active",
    warrantyExpiry: "2027-08-18",
    returnDeadline: "2026-09-02",
    isFavorite: true,
    tags: ["Business", "Hardware"],
    lineItems: [
      { id: "li-1", name: "Mechanical Keyboard", quantity: 1, unitPrice: 12000, total: 12000, category: "Electronics" },
      { id: "li-2", name: "Wireless Mouse", quantity: 1, unitPrice: 8500, total: 8500, category: "Electronics" },
      { id: "li-3", name: "USB-C Hub", quantity: 1, unitPrice: 4000, total: 4000, category: "Accessories" },
    ],
  },
  {
    id: "r-2",
    merchant: "Gadget Zone",
    date: "2026-08-05",
    total: 5200,
    tax: 780,
    currency: "৳",
    category: "Electronics",
    paymentMethod: "NovaPay",
    receiptNumber: "GZ-99381",
    status: "warranty_expiring",
    warrantyExpiry: "2026-09-05",
    isFavorite: false,
    tags: ["Personal"],
    lineItems: [
      { id: "li-4", name: "Bluetooth Earbuds", quantity: 1, unitPrice: 5200, total: 5200, category: "Electronics" },
    ],
  },
  {
    id: "r-3",
    merchant: "Urban Supermarket",
    date: "2026-08-21",
    total: 3840,
    tax: 192,
    currency: "৳",
    category: "Grocery",
    paymentMethod: "Cash",
    receiptNumber: "URB-1123",
    status: "normal",
    isFavorite: false,
    tags: ["Home"],
    lineItems: [
      { id: "li-5", name: "Weekly Groceries", quantity: 1, unitPrice: 3840, total: 3840, category: "Grocery" },
    ],
  }
];

// --- MAIN PAGE COMPONENT ---

export default function PurchaseVaultPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"vault" | "analytics" | "warranties">("vault");
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Prevent hydration errors by waiting for mount
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("novawallet_receipts");
    if (stored) {
      setReceipts(JSON.parse(stored));
    } else {
      setReceipts(INITIAL_RECEIPTS);
      localStorage.setItem("novawallet_receipts", JSON.stringify(INITIAL_RECEIPTS));
    }
  }, []);

  const totalSpend = useMemo(() => receipts.reduce((acc, curr) => acc + curr.total, 0), [receipts]);
  const activeWarrantiesCount = receipts.filter(r => r.status.includes("warranty")).length;

  const filteredReceipts = useMemo(() => {
    if (!searchQuery) return receipts;
    const lowerQ = searchQuery.toLowerCase();
    return receipts.filter(r => 
      r.merchant.toLowerCase().includes(lowerQ) || 
      r.category.toLowerCase().includes(lowerQ) ||
      r.total.toString().includes(lowerQ)
    );
  }, [receipts, searchQuery]);

  if (!isMounted) return <div className="min-h-screen bg-[#F6F8FB] p-8" />; // Hydration skeleton

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F2745] p-4 md:p-8 font-sans selection:bg-[#1F5EA8] selection:text-white pb-24">
      {/* 1. HERO SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0F2745]">
              Receipts & Purchase Vault
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Keep every purchase organized, searchable, and ready when you need it.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none bg-[#1F5EA8] hover:bg-[#173F6D] text-white px-6 py-3 rounded-2xl font-medium transition-colors shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Receipt
            </button>
            <button className="bg-white hover:bg-slate-50 text-[#1F5EA8] px-4 py-3 rounded-2xl font-medium transition-colors shadow-sm border border-slate-200 flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              Scan
            </button>
          </div>
        </div>

        {/* HERO STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Tracked" value={`৳ ${totalSpend.toLocaleString()}`} icon={<BarChart3 />} color="blue" />
          <StatCard title="Total Receipts" value={receipts.length.toString()} icon={<FileText />} color="slate" />
          <StatCard title="Active Warranties" value={activeWarrantiesCount.toString()} icon={<ShieldCheck />} color="emerald" />
          <StatCard title="Action Needed" value="2" icon={<AlertCircle />} color="amber" subtitle="Expiring soon" />
        </div>

        {/* MAIN NAVIGATION TABS */}
        <div className="flex space-x-1 bg-white p-1 rounded-2xl w-full md:w-fit border border-slate-200 shadow-sm">
          {(["vault", "warranties", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all capitalize ${
                activeTab === tab 
                  ? "bg-[#F6F8FB] text-[#1F5EA8] shadow-sm" 
                  : "text-slate-500 hover:text-[#0F2745] hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* DYNAMIC CONTENT AREA */}
        <AnimatePresence mode="wait">
          {activeTab === "vault" && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* SEARCH & FILTERS */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search merchant, category, or amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#F6F8FB] border-none rounded-2xl focus:ring-2 focus:ring-[#1F5EA8]/20 outline-none transition-all text-[#0F2745] placeholder:text-slate-400"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                  {["All", "Electronics", "Grocery", "Travel", "Business"].map(filter => (
                    <button key={filter} className="whitespace-nowrap px-4 py-2.5 bg-[#F6F8FB] hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-medium transition-colors border border-transparent">
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* RECEIPT GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReceipts.map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} onClick={() => setSelectedReceipt(receipt)} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Purchase Insights</h3>
                {/* Mock Chart Area */}
                <div className="h-64 bg-[#F6F8FB] rounded-2xl border border-slate-100 flex items-end justify-between p-6 gap-2">
                   {[40, 70, 45, 90, 65, 120, 85].map((h, i) => (
                     <motion.div 
                       initial={{ height: 0 }} animate={{ height: `${(h/120)*100}%` }} 
                       key={i} className="w-full bg-gradient-to-t from-[#1F5EA8] to-cyan-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" 
                     />
                   ))}
                </div>
              </div>
              <div className="space-y-6">
                 <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                   <h3 className="font-bold mb-4">Organization Score</h3>
                   <div className="flex items-center justify-center">
                     <div className="relative w-32 h-32 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                         <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.8" strokeDashoffset="42.2" className="text-emerald-500 transition-all duration-1000" />
                       </svg>
                       <span className="absolute text-2xl font-bold text-[#0F2745]">88</span>
                     </div>
                   </div>
                   <p className="text-center text-sm text-slate-500 mt-4">Great job! 88% of your receipts are categorized and tagged.</p>
                 </div>
                 <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                   <h3 className="font-bold mb-2">Purchase Story</h3>
                   <p className="text-sm text-slate-600 leading-relaxed">
                     You made <strong className="text-[#0F2745]">3 purchases</strong> this month. Electronics represented <strong className="text-[#0F2745]">88%</strong> of your receipt value. Your average purchase is <strong className="text-[#0F2745]">৳11,180</strong>.
                   </p>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === "warranties" && (
            <motion.div key="warranties" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="text-[#1F5EA8]" /> Active Warranties & Returns
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receipts.filter(r => r.status.includes('warranty')).map(receipt => (
                    <div key={receipt.id} className="p-4 rounded-2xl border border-slate-200 bg-[#F6F8FB] flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-bold text-[#0F2745]">{receipt.merchant}</p>
                        <p className="text-sm text-slate-500">Exp: {receipt.warrantyExpiry}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${receipt.status === 'warranty_expiring' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {receipt.status === 'warranty_expiring' ? 'Expiring Soon' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* OVERLAYS & MODALS */}
      <AnimatePresence>
        {selectedReceipt && (
          <ReceiptDetailDrawer receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        )}
        {isAddModalOpen && (
          <AddReceiptModal 
            onClose={() => setIsAddModalOpen(false)} 
            onSave={(newReceipt) => {
              const updated = [newReceipt, ...receipts];
              setReceipts(updated);
              localStorage.setItem("novawallet_receipts", JSON.stringify(updated));
              setIsAddModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon, color, subtitle }: any) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-[#0F2745] mt-1">{value}</p>
        {subtitle && <p className="text-xs text-amber-600 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-2xl ${colors[color as keyof typeof colors]}`}>
        {icon}
      </div>
    </div>
  );
}

function ReceiptCard({ receipt, onClick }: { receipt: Receipt; onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm cursor-pointer group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F6F8FB] flex items-center justify-center text-xl shadow-inner border border-slate-100">
            {receipt.merchant.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-[#0F2745] group-hover:text-[#1F5EA8] transition-colors">{receipt.merchant}</h3>
            <p className="text-xs text-slate-400 font-medium">{new Date(receipt.date).toLocaleDateString()}</p>
          </div>
        </div>
        {receipt.isFavorite && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-slate-500 mb-1">{receipt.category}</p>
          <p className="text-lg font-bold text-[#0F2745]">{receipt.currency} {receipt.total.toLocaleString()}</p>
        </div>
        
        {/* Status Indicators */}
        {receipt.status.includes('warranty') && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <ShieldCheck className={`w-3.5 h-3.5 ${receipt.status === 'warranty_expiring' ? 'text-amber-500' : 'text-emerald-500'}`} />
            Warranty
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReceiptDetailDrawer({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#0F2745]/20 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div 
        initial={{ x: "100%", opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6F8FB] flex items-center justify-center font-bold text-[#0F2745]">
              {receipt.merchant.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-lg">{receipt.merchant}</h2>
              <p className="text-xs text-slate-500">{receipt.receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-[#0F2745] hover:bg-slate-50 rounded-xl transition-colors"><ShareIcon className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:text-[#0F2745] hover:bg-slate-50 rounded-xl transition-colors"><Download className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 custom-scrollbar">
          {/* Top Summary Amount */}
          <div className="text-center py-6 bg-[#F6F8FB] rounded-3xl border border-slate-100">
            <p className="text-sm text-slate-500 font-medium mb-1">Total Amount</p>
            <h1 className="text-4xl font-bold text-[#0F2745]">{receipt.currency} {receipt.total.toLocaleString()}</h1>
            <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified Purchase
            </p>
          </div>

          {/* Details Grid */}
          <div>
            <h3 className="text-sm font-bold text-[#0F2745] uppercase tracking-wider mb-4">Purchase Details</h3>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <DetailRow label="Date" value={new Date(receipt.date).toLocaleDateString()} />
              <DetailRow label="Payment Method" value={receipt.paymentMethod} />
              <DetailRow label="Category" value={receipt.category} />
              <DetailRow label="Tax / VAT" value={`${receipt.currency} ${receipt.tax.toLocaleString()}`} isLast />
            </div>
          </div>

          {/* Line Items */}
          {receipt.lineItems.length > 0 && (
            <div>
               <h3 className="text-sm font-bold text-[#0F2745] uppercase tracking-wider mb-4">Line Items</h3>
               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                 {receipt.lineItems.map((item, idx) => (
                   <div key={item.id} className={`p-4 flex justify-between items-center ${idx !== receipt.lineItems.length - 1 ? 'border-b border-slate-100' : ''}`}>
                     <div>
                       <p className="font-medium text-[#0F2745]">{item.name}</p>
                       <p className="text-xs text-slate-500">{item.quantity} x {receipt.currency} {item.unitPrice.toLocaleString()}</p>
                     </div>
                     <p className="font-bold text-[#0F2745]">{receipt.currency} {item.total.toLocaleString()}</p>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Tags */}
          <div>
             <h3 className="text-sm font-bold text-[#0F2745] uppercase tracking-wider mb-3">Tags</h3>
             <div className="flex gap-2 flex-wrap">
               {receipt.tags.map(tag => (
                 <span key={tag} className="px-3 py-1.5 bg-[#F6F8FB] border border-slate-200 rounded-lg text-sm text-slate-600 flex items-center gap-1.5">
                   <Tag className="w-3.5 h-3.5" /> {tag}
                 </span>
               ))}
               <button className="px-3 py-1.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:text-[#0F2745] hover:border-slate-400 transition-colors">
                 + Add Tag
               </button>
             </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function DetailRow({ label, value, isLast }: { label: string, value: string, isLast?: boolean }) {
  return (
    <div className={`flex justify-between items-center p-4 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-[#0F2745]">{value}</span>
    </div>
  );
}

// Mock Add/OCR Modal Flow
function AddReceiptModal({ onClose, onSave }: { onClose: () => void, onSave: (r: Receipt) => void }) {
  const [step, setStep] = useState<"upload" | "scanning" | "form">("upload");
  const [scanProgress, setScanProgress] = useState(0);

  // Simulate OCR Flow
  const startScan = () => {
    setStep("scanning");
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep("form"), 500);
      }
    }, 100);
  };

  const handleSaveMock = () => {
    onSave({
      id: `r-${Date.now()}`,
      merchant: "Coffee House Demo",
      date: new Date().toISOString().split('T')[0],
      total: 850,
      tax: 120,
      currency: "৳",
      category: "Dining",
      paymentMethod: "Card",
      receiptNumber: "CH-10294",
      status: "normal",
      isFavorite: false,
      tags: ["Demo", "Food"],
      lineItems: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F2745]/30 backdrop-blur-sm" onClick={step !== 'scanning' ? onClose : undefined} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#F6F8FB]">
          <h2 className="font-bold text-[#0F2745] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#1F5EA8]" /> Smart Receipt Capture
          </h2>
          {step !== 'scanning' && <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>}
        </div>

        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          {step === "upload" && (
            <div className="space-y-6">
              <div onClick={startScan} className="border-2 border-dashed border-[#1F5EA8]/30 bg-blue-50/50 hover:bg-blue-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-[#1F5EA8]" />
                </div>
                <h3 className="font-bold text-lg text-[#0F2745]">Upload or Scan Receipt</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">Drop an image or PDF here. We'll automatically extract the details.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="py-4 border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
                  <Camera className="w-6 h-6 text-slate-400" /> Use Camera
                </button>
                <button onClick={() => setStep("form")} className="py-4 border border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
                  <Edit3 className="w-6 h-6 text-slate-400" /> Manual Entry
                </button>
              </div>
            </div>
          )}

          {step === "scanning" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-48 h-64 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner">
                 <div className="absolute inset-x-0 h-1 bg-[#1F5EA8] shadow-[0_0_15px_rgba(31,94,168,0.8)]" style={{ top: `${scanProgress}%` }} />
                 <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-slate-300" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[#0F2745] text-lg">Extracting Data...</h3>
                <p className="text-sm text-slate-500 mt-1">Simulated OCR identifying merchant and totals.</p>
              </div>
              <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-[#1F5EA8]" initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}

          {step === "form" && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Extraction Complete</p>
                  <p className="text-xs text-emerald-600 mt-1">Review the automatically extracted details below.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Merchant (98% confidence)</label>
                  <input type="text" defaultValue="Coffee House Demo" className="w-full bg-[#F6F8FB] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#1F5EA8] focus:ring-1 focus:ring-[#1F5EA8] text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Total Amount (99% confidence)</label>
                  <input type="text" defaultValue="850" className="w-full bg-[#F6F8FB] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#1F5EA8] focus:ring-1 focus:ring-[#1F5EA8] text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Date (96% confidence)</label>
                  <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[#F6F8FB] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#1F5EA8] focus:ring-1 focus:ring-[#1F5EA8] text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Category</label>
                  <select className="w-full bg-[#F6F8FB] border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#1F5EA8] focus:ring-1 focus:ring-[#1F5EA8] text-sm">
                    <option>Dining</option>
                    <option>Electronics</option>
                    <option>Grocery</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors text-sm">Cancel</button>
                <button onClick={handleSaveMock} className="px-5 py-2.5 bg-[#1F5EA8] hover:bg-[#173F6D] text-white rounded-xl font-medium transition-colors shadow-md text-sm">
                  Save to Vault
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Icon Helper for Drawer
function ShareIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}