"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Download, RefreshCw, Shield } from "lucide-react";

import { SystemPulse } from "./components/SystemPulse";
import { LogExplorer } from "./components/LogExplorer";
import { LogDetailsDrawer } from "./components/LogDetailsDrawer";
import { ServiceStatusGrid } from "./components/ServiceStatusGrid";
import { ErrorSpikeDetector } from "./components/ErrorSpikeDetector";
import { OperationalHeatmap } from "./components/OperationalHeatmap";
import { RootCauseExplorer } from "./components/RootCauseExplorer";
import { SystemLog } from "./components/SystemLogTypes";

export default function SystemLogsPage() {
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleViewTrace = (traceId: string) => {
    console.log("Correlating trace:", traceId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-6 font-sans space-y-8">
      {/* System Command Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            System Logs
            <span className="text-xs font-medium px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              Monitoring Active
            </span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm max-w-2xl">
            Monitor platform activity, application events, service health, failures, and operational signals from one centralized console.
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">Administrator</span>
            <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">System Operations</span>
            <span>• Updated 2 min ago (Demo Observability Dataset)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-sm font-medium rounded-lg border border-slate-800 transition-colors">
            <Shield className="w-4 h-4 text-blue-400" />
            Open Security Center
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-sm font-medium rounded-lg border border-slate-800 transition-colors">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Real-time System Pulse & Health Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
            <Activity className="w-4 h-4 text-emerald-400" />
            System Pulse
          </div>
          <SystemPulse />
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <div className="text-sm font-medium text-slate-400 mb-1">System Health Score</div>
            <div className="text-4xl font-bold text-white flex items-baseline gap-2">
              99.8 <span className="text-lg text-slate-500">/ 100</span>
            </div>
            <div className="mt-4 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: "99.8%" }} className="h-full bg-emerald-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex-1 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-500 mb-3">
              <AlertTriangle className="w-4 h-4" />
              Active Operational Signals
            </div>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-slate-500 font-mono text-xs">07:42</span> Transfer service error rate increased by 8.4%.
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500 font-mono text-xs">07:38</span> KYC processing latency spiked to 420ms.
              </li>
            </ul>
            <div className="mt-4 text-xs text-slate-500 italic">Demo operational insight</div>
          </div>
        </div>
      </div>

      {/* Microservice Health Grid */}
      <ServiceStatusGrid />

      {/* Anomaly Detection & Failure Dependency Cascades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorSpikeDetector />
        <RootCauseExplorer />
      </div>

      {/* Primary Interactive Log Explorer Workspace */}
      <LogExplorer onSelectLog={setSelectedLog} />

      {/* Operational Activity Heatmap */}
      <OperationalHeatmap />

      {/* Side-Drawer Detailed Log Inspection Panel */}
      <LogDetailsDrawer 
        log={selectedLog} 
        onClose={() => setSelectedLog(null)} 
        onViewTrace={handleViewTrace}
      />
    </div>
  );
}