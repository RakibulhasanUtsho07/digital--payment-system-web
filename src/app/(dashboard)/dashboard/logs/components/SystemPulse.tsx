import React from "react";
import { motion } from "framer-motion";
import { Database, Globe, Lock, Bell, Activity, Server, Cpu } from "lucide-react";

const nodes = [
  { id: "api", label: "API", icon: Globe, status: "ok", x: 10, y: 20 },
  { id: "auth", label: "Auth", icon: Lock, status: "ok", x: 80, y: 15 },
  { id: "db", label: "Database", icon: Database, status: "warn", x: 85, y: 80 },
  { id: "kyc", label: "KYC", icon: Activity, status: "ok", x: 15, y: 85 },
  { id: "notify", label: "Notifications", icon: Bell, status: "ok", x: 50, y: 90 },
];

export function SystemPulse() {
  return (
    <div className="relative w-full h-[300px] flex items-center justify-center">
      {/* Animated connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        {nodes.map((node, i) => (
          <motion.line
            key={`line-${i}`}
            x1="50%" y1="50%"
            x2={`${node.x}%`} y2={`${node.y}%`}
            stroke={node.status === "warn" ? "#f59e0b" : "#10b981"}
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: i * 0.2 }}
          />
        ))}
      </svg>

      {/* Central Node */}
      <motion.div 
        className="relative z-10 w-24 h-24 bg-slate-900 border-2 border-emerald-500/50 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        animate={{ boxShadow: ["0 0 20px rgba(16,185,129,0.2)", "0 0 40px rgba(16,185,129,0.4)", "0 0 20px rgba(16,185,129,0.2)"] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <Server className="w-6 h-6 text-emerald-400 mb-1" />
        <span className="text-xs font-bold text-white">SYSTEM</span>
      </motion.div>

      {/* Peripheral Nodes */}
      {nodes.map((node, i) => {
        const Icon = node.icon;
        const isWarn = node.status === "warn";
        return (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
            className={`absolute flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center bg-slate-900 ${isWarn ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "border-slate-700"}`}>
              <Icon className={`w-5 h-5 ${isWarn ? "text-amber-500" : "text-slate-400"}`} />
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-950/80 px-2 rounded-md">{node.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}