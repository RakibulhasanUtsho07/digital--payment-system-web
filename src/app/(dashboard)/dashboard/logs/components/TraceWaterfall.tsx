import React from "react";
import { motion } from "framer-motion";

interface TraceSpan {
  service: string;
  duration: number;
  startOffset: number;
  status: "ok" | "error";
}

const demoSpans: TraceSpan[] = [
  { service: "API Gateway", duration: 42, startOffset: 0, status: "ok" },
  { service: "Auth Service", duration: 18, startOffset: 42, status: "ok" },
  { service: "Wallet Validation", duration: 64, startOffset: 60, status: "ok" },
  { service: "Transfer Service", duration: 188, startOffset: 124, status: "error" },
  { service: "Database", duration: 112, startOffset: 140, status: "ok" },
];

export function TraceWaterfall() {
  const maxDuration = 312; // Total trace time

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Request Trace</h3>
      <div className="space-y-3">
        {demoSpans.map((span, i) => {
          const widthPct = (span.duration / maxDuration) * 100;
          const leftPct = (span.startOffset / maxDuration) * 100;
          const isError = span.status === "error";

          return (
            <div key={i} className="relative h-8 text-xs flex items-center group">
              <div className="w-32 shrink-0 text-slate-400 truncate pr-4">{span.service}</div>
              <div className="flex-1 relative h-full flex items-center bg-slate-950/50 rounded border border-slate-800/50">
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${widthPct}%`, opacity: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.4, ease: "easeOut" }}
                  style={{ marginLeft: `${leftPct}%` }}
                  className={`h-4 rounded-sm flex items-center px-2 text-[10px] font-mono text-white/90 shadow-sm
                    ${isError ? "bg-rose-500/80 border border-rose-400" : "bg-blue-500/80 border border-blue-400"}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {span.duration}ms
                  </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-slate-500 italic text-right">Demo request trace</div>
    </div>
  );
}