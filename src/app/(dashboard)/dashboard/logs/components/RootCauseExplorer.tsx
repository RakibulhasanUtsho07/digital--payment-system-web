import React from "react";
import { motion } from "framer-motion";
import { Server, Database, Globe, AlertCircle, ArrowDown } from "lucide-react";

const causeNodes = [
  { id: 1, service: "Transfer Service", event: "Transaction Failed", type: "error", icon: Server },
  { id: 2, service: "Wallet Service", event: "State Unavailable", type: "warn", icon: Globe },
  { id: 3, service: "Database", event: "Connection Timeout", type: "critical", icon: Database },
];

export function RootCauseExplorer() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-white">Root Cause Explorer</h3>
        <span className="text-xs text-slate-500 italic bg-slate-950 px-2 py-1 rounded">Demo correlation view</span>
      </div>

      <div className="relative pl-6">
        {causeNodes.map((node, index) => {
          const Icon = node.icon;
          const isLast = index === causeNodes.length - 1;
          const statusColor = node.type === "critical" ? "text-rose-500 border-rose-500/30 bg-rose-500/10" 
                            : node.type === "warn" ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                            : "text-rose-400 border-rose-400/30 bg-rose-400/10";

          return (
            <div key={node.id} className="relative pb-8">
              {/* Vertical connector line */}
              {!isLast && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ duration: 0.5, delay: index * 0.4 }}
                  className="absolute left-[11px] top-8 w-0.5 bg-slate-700"
                />
              )}

              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.4 }}
                className="flex items-start gap-4"
              >
                <div className={`relative z-10 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${statusColor}`}>
                  {node.type === "critical" ? <AlertCircle className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                </div>
                
                <div className="flex-1 bg-slate-950/50 border border-slate-800/80 rounded-lg p-3 mt-[-6px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-200">{node.service}</span>
                  </div>
                  <div className="text-xs text-slate-500">{node.event}</div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}