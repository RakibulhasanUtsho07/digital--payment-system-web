import React from "react";
import { TrendingUp, AlertTriangle, ArrowUpRight, Zap } from "lucide-react";

interface Spike {
  service: string;
  change: string;
  time: string;
  severity: "high" | "medium";
  suggestedAction: string;
}

const spikes: Spike[] = [
  { service: "Transfer Service", change: "+48% errors", time: "12m ago", severity: "high", suggestedAction: "Check wallet balance lock contention & DB connection pool" },
  { service: "KYC Service", change: "+31% latency", time: "25m ago", severity: "medium", suggestedAction: "Verify third-party OCR API status page" },
  { service: "Notification Queue", change: "+18% retry rate", time: "42m ago", severity: "medium", suggestedAction: "Inspect SMS gateway provider rate limits" },
];

export function ErrorSpikeDetector() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Error Spike Detector</h3>
        </div>
        <span className="text-[10px] text-slate-500 italic bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          Demo anomaly indicator
        </span>
      </div>

      <div className="space-y-3">
        {spikes.map((spike, idx) => (
          <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">{spike.service}</span>
                <span className={`px-2 py-0.2 text-[10px] font-mono font-bold rounded ${
                  spike.severity === "high" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                  {spike.change}
                </span>
                <span className="text-[10px] text-slate-500">{spike.time}</span>
              </div>
              <p className="text-xs text-slate-400">{spike.suggestedAction}</p>
            </div>
            
            <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start sm:self-center shrink-0 font-medium">
              Investigate <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}