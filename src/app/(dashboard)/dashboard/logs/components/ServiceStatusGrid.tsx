"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Server } from "lucide-react";

export interface ServiceHealth {
  id: string;
  name: string;
  category: string;
  status: "Operational" | "Degraded" | "Warning" | "Down" | "Maintenance";
  uptime: string;
  responseTimeMs: number;
  errorRate: string;
  requestCount: string;
  lastError: string;
}

const mockServices: ServiceHealth[] = [
  { id: "api", name: "API Gateway", category: "Core", status: "Operational", uptime: "99.99%", responseTimeMs: 42, errorRate: "0.02%", requestCount: "182K", lastError: "None in last 24h" },
  { id: "auth", name: "Authentication Service", category: "Core", status: "Operational", uptime: "99.98%", responseTimeMs: 28, errorRate: "0.11%", requestCount: "42K", lastError: "AuthTokenExpired" },
  { id: "transfer", name: "Transfer Service", category: "Finance", status: "Degraded", uptime: "98.84%", responseTimeMs: 380, errorRate: "4.80%", requestCount: "29K", lastError: "WalletLockTimeout" },
  { id: "wallet", name: "Wallet Core", category: "Finance", status: "Operational", uptime: "99.95%", responseTimeMs: 64, errorRate: "0.20%", requestCount: "94K", lastError: "BalanceCheckFailed" },
  { id: "db", name: "Primary Database", category: "Data", status: "Warning", uptime: "99.90%", responseTimeMs: 142, errorRate: "1.10%", requestCount: "310K", lastError: "ConnectionPoolExhausted" },
  { id: "kyc", name: "KYC Verification Engine", category: "Compliance", status: "Operational", uptime: "99.70%", responseTimeMs: 420, errorRate: "0.85%", requestCount: "1.8K", lastError: "OCRTimeout" },
  { id: "cloudinary", name: "Media & Cloudinary", category: "Storage", status: "Operational", uptime: "100%", responseTimeMs: 88, errorRate: "0.00%", requestCount: "12K", lastError: "None" },
  { id: "ai", name: "Fraud Detection AI", category: "Security", status: "Operational", uptime: "99.91%", responseTimeMs: 110, errorRate: "0.05%", requestCount: "18K", lastError: "InferenceTimeout" },
];

export function ServiceStatusGrid() {
  const [selectedService, setSelectedService] = useState<ServiceHealth | null>(null);

  const getStatusBadge = (status: ServiceHealth["status"]) => {
    switch (status) {
      case "Operational":
        return <span className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Operational</span>;
      case "Degraded":
        return <span className="flex items-center gap-1 text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Degraded</span>;
      case "Warning":
        return <span className="flex items-center gap-1 text-orange-400 text-xs bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Warning</span>;
      case "Down":
        return <span className="flex items-center gap-1 text-rose-400 text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Down</span>;
      default:
        return <span className="flex items-center gap-1 text-slate-400 text-xs bg-slate-800 px-2 py-0.5 rounded">Maintenance</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            Service Status Grid
          </h3>
          <p className="text-xs text-slate-400">Microservice infrastructure operational health & responsiveness</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockServices.map((svc) => (
          <motion.div
            key={svc.id}
            whileHover={{ y: -2 }}
            onClick={() => setSelectedService(svc)}
            className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{svc.category}</span>
                <h4 className="text-sm font-semibold text-slate-200 mt-0.5">{svc.name}</h4>
              </div>
              {getStatusBadge(svc.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <div className="text-slate-500 text-[10px]">Response Time</div>
                <div className="text-slate-300 font-mono font-medium">{svc.responseTimeMs}ms</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">Error Rate</div>
                <div className={parseFloat(svc.errorRate) > 1 ? "text-amber-400 font-mono font-medium" : "text-slate-300 font-mono font-medium"}>
                  {svc.errorRate}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedService(null)} 
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" 
            />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: "100%" }} 
                animate={{ x: 0 }} 
                exit={{ x: "100%" }} 
                className="w-screen max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between text-slate-300 shadow-2xl"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-slate-500 font-mono">{selectedService.category}</span>
                      <h2 className="text-xl font-bold text-white">{selectedService.name}</h2>
                    </div>
                    <button onClick={() => setSelectedService(null)} className="p-1 rounded text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Current Status</span>
                        {getStatusBadge(selectedService.status)}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">30-Day Uptime</span>
                        <span className="text-emerald-400 font-mono font-medium">{selectedService.uptime}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total Requests (24h)</span>
                        <span className="text-slate-200 font-mono">{selectedService.requestCount}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Latest Registered Error</h4>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-rose-400">
                        {selectedService.lastError}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 italic text-center pt-4 border-t border-slate-800">
                  Demo service health telemetry
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}