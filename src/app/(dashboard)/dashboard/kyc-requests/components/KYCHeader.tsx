"use client";

import { motion } from "framer-motion";
import {
  Download,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function KYCHeader({
  refreshing,
  onRefresh,
  onExport,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#081A2F] via-[#123C64] to-[#1F5EA8] p-6 text-white shadow-[0_24px_70px_rgba(15,39,69,0.18)] sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]" />

      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.08, 0.2, 0.08],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administrator
            </span>

            <span className="rounded-full border border-blue-100/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-blue-100">
              Compliance Operations
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Queue Operational
            </span>
          </div>

          <div className="mt-5 flex items-start gap-4">
            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 sm:flex">
              <Sparkles className="h-5 w-5 text-cyan-200" />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                KYC Review Center
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75">
                Review identity verification requests, inspect submitted
                evidence, assess risk signals, and make compliant approval
                decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#173F6D] shadow-lg transition hover:bg-blue-50 disabled:opacity-60"
          >
            <RefreshCw
              className={
                refreshing
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />
            Refresh Queue
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-bold text-white transition hover:bg-white/15"
          >
            <Download className="h-4 w-4" />
            Export Review Data
          </button>
        </div>
      </div>
    </motion.section>
  );
}