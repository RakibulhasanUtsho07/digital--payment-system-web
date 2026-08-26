"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Download,
  RefreshCw,
  Shield,
} from "lucide-react";

import { SystemPulse } from "./components/SystemPulse";
import { LogExplorer } from "./components/LogExplorer";
import { ServiceStatusGrid } from "./components/ServiceStatusGrid";
import { ErrorSpikeDetector } from "./components/ErrorSpikeDetector";
import { OperationalHeatmap } from "./components/OperationalHeatmap";
import { RootCauseExplorer } from "./components/RootCauseExplorer";

export default function SystemLogsPage() {
  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen space-y-8 bg-slate-950 p-6 font-sans text-slate-300">

      {/* =====================================================
          SYSTEM COMMAND HEADER
      ====================================================== */}

      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
            System Logs

            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              Monitoring Active
            </span>
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Monitor platform activity, application events,
            service health, failures, and operational signals
            from one centralized console.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5">
              Administrator
            </span>

            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5">
              System Operations
            </span>

            <span>
              • Updated 2 min ago
              (Demo Observability Dataset)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-800"
          >
            <Shield className="h-4 w-4 text-blue-400" />
            Open Security Center
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Export Logs
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isRefreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {isRefreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </header>

      {/* =====================================================
          SYSTEM PULSE + HEALTH
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* System Pulse */}

        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-6 xl:col-span-2">
          <div className="absolute left-4 top-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Activity className="h-4 w-4 text-emerald-400" />
            System Pulse
          </div>

          <SystemPulse />
        </div>

        {/* Health side */}

        <div className="flex flex-col gap-4">

          {/* Health Score */}

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="mb-1 text-sm font-medium text-slate-400">
              System Health Score
            </div>

            <div className="flex items-baseline gap-2 text-4xl font-bold text-white">
              99.8

              <span className="text-lg text-slate-500">
                / 100
              </span>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: "99.8%",
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          {/* Operational Signals */}

          <div className="flex-1 rounded-xl border border-slate-800 border-l-4 border-l-amber-500 bg-slate-900/50 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-500">
              <AlertTriangle className="h-4 w-4" />
              Active Operational Signals
            </div>

            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="font-mono text-xs text-slate-500">
                  07:42
                </span>

                <span>
                  Transfer service error rate
                  increased by 8.4%.
                </span>
              </li>

              <li className="flex gap-2">
                <span className="font-mono text-xs text-slate-500">
                  07:38
                </span>

                <span>
                  KYC processing latency
                  spiked to 420ms.
                </span>
              </li>
            </ul>

            <div className="mt-4 text-xs italic text-slate-500">
              Demo operational insight
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MICROSERVICE HEALTH
      ====================================================== */}

      <ServiceStatusGrid />

      {/* =====================================================
          ANOMALY + ROOT CAUSE
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ErrorSpikeDetector />
        <RootCauseExplorer />
      </div>

      {/* =====================================================
          LOG EXPLORER
      ====================================================== */}

      <LogExplorer
        onSelectLog={() => {
          /*
           * LogDetailsDrawer was removed.
           * Keep callback empty until another
           * log details UI is added.
           */
        }}
      />

      {/* =====================================================
          OPERATIONAL HEATMAP
      ====================================================== */}

      <OperationalHeatmap />
    </div>
  );
}