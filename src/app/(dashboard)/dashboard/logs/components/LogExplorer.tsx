import React, { useState } from "react";
import { Search, Filter, AlertCircle, Info, AlertTriangle, Play } from "lucide-react";
import { SystemLog } from "./SystemLogTypes";
import { SystemStoryViewer } from "./SystemStoryViewer";


interface LogExplorerProps {
  onSelectLog: (log: SystemLog) => void;
}

// Demo Dataset
const mockLogs: SystemLog[] = [
  {
    id: "log_1", timestamp: "07:42:21.384", level: "ERROR", service: "Transfers",
    category: "Transaction", event: "TransactionProcessingFailed",
    message: "Transaction processing failed because the wallet service returned an unavailable state.",
    requestId: "req_73a1f9", durationMs: 428, statusCode: 500,
    environment: "Production", result: "Failed", source: "API"
  },
  {
    id: "log_2", timestamp: "07:42:21.102", level: "WARN", service: "Wallet",
    category: "State", event: "StateLockTimeout",
    message: "Failed to acquire lock for wallet balance check.",
    requestId: "req_73a1f9", durationMs: 150, statusCode: 409,
    environment: "Production", result: "Timeout", source: "System"
  },
  {
    id: "log_3", timestamp: "07:42:19.045", level: "INFO", service: "API",
    category: "Request", event: "TransferInitiated",
    message: "Received internal transfer request.",
    requestId: "req_73a1f9", durationMs: 12, statusCode: 200,
    environment: "Production", result: "Success", source: "User"
  },
];

const LevelBadge = ({ level }: { level: string }) => {
  const styles: Record<string, string> = {
    ERROR: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    WARN: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    INFO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  
  const Icon = level === "ERROR" ? AlertCircle : level === "WARN" ? AlertTriangle : Info;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${styles[level] || "bg-slate-800 text-slate-300 border-slate-700"}`}>
      <Icon className="w-3 h-3" />
      {level}
    </span>
  );
};

export function LogExplorer({ onSelectLog }: LogExplorerProps) {
  const [showStory, setShowStory] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search request ID, event, service..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={() => setShowStory(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Play className="w-4 h-4" />
            Play System Story
          </button>
        </div>
      </div>

      {/* Active Filters */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-slate-500 font-medium mr-2">Active:</span>
        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">
          Environment: Production <button className="ml-2 text-slate-500 hover:text-white">×</button>
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 border border-slate-700">
          Time: Last 24H <button className="ml-2 text-slate-500 hover:text-white">×</button>
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950/80 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800 whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800">Level</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800">Service</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800">Event</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800">Req ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800 text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-sm">
            {mockLogs.map((log) => (
              <tr 
                key={log.id} 
                onClick={() => onSelectLog(log)}
                className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">{log.timestamp}</td>
                <td className="px-4 py-3"><LevelBadge level={log.level} /></td>
                <td className="px-4 py-3 text-slate-300">{log.service}</td>
                <td className="px-4 py-3">
                  <div className="text-slate-200 font-medium">{log.event}</div>
                  <div className="text-slate-500 text-xs truncate max-w-md mt-0.5">{log.message}</div>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.requestId}</td>
                <td className="px-4 py-3 text-slate-400 text-right">{log.durationMs}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
        <div>Showing 1–3 of 842,420 events</div>
        <div className="flex gap-1">
          <button className="px-2 py-1 rounded hover:bg-slate-800 transition-colors">Previous</button>
          <button className="px-2 py-1 rounded bg-slate-800 text-slate-300">1</button>
          <button className="px-2 py-1 rounded hover:bg-slate-800 transition-colors">2</button>
          <button className="px-2 py-1 rounded hover:bg-slate-800 transition-colors">Next</button>
        </div>
      </div>

      {showStory && <SystemStoryViewer onClose={() => setShowStory(false)} />}
    </div>
  );
}