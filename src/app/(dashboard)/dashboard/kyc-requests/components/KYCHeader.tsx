"use client";

import { motion } from "framer-motion";

import {
  Download,
  RefreshCw,
  ShieldCheck,
  Activity,
  Clock3,
} from "lucide-react";

export default function KYCHeader({
  refreshing,
  onRefresh,
  onExport,
  lastUpdated,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  lastUpdated?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-[30px] border border-indigo-400/20 bg-[linear-gradient(120deg,#312E81_0%,#4F46E5_52%,#6D28D9_100%)] px-5 py-6 text-white shadow-[0_20px_55px_rgba(79,70,229,0.2)] sm:px-7 sm:py-7"
    >
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-indigo-200/15 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-violet-200/15 blur-3xl" />

      <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-indigo-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administrator
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-bold text-indigo-100/75">
              Compliance Operations
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[9px] font-black text-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Queue Operational
            </span>
          </div>

          <div className="mt-5">
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-indigo-100/60">
              Identity Verification
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-[38px]">
              KYC Review Center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/75">
              Review submitted identity evidence, inspect automated screening
              signals, and make the final manual compliance decision from one
              workspace.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-semibold text-indigo-100/60">
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-3 w-3" />
                Live review queue
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" />
                Updated {lastUpdated || "just now"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex xl:grid-cols-1 xl:flex-col">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[10px] font-black text-indigo-700 shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh Queue
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.075] px-4 text-[10px] font-black text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.12]"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>
    </motion.section>
  );
}