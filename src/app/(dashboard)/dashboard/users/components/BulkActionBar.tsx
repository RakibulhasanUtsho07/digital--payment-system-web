"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Download, ShieldAlert, Snowflake, X } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onFreeze: () => void;
  onExport: () => void;
}

export default function BulkActionBar({
  count,
  onClear,
  onActivate,
  onSuspend,
  onFreeze,
  onExport,
}: BulkActionBarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 28, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 28, x: "-50%" }}
      className="fixed bottom-4 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-4xl flex-col gap-3 rounded-[22px] border border-white/10 bg-[#0F2745]/95 p-3.5 text-white shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Selected Counter & Info */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-black">
            {count} user{count === 1 ? "" : "s"} selected
          </p>
          <p className="text-[9px] text-slate-300">Choose a secure bulk action</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Action label="Activate" onClick={onActivate} />
        <Action label="Suspend" icon={ShieldAlert} onClick={onSuspend} tone="rose" />
        <Action label="Freeze" icon={Snowflake} onClick={onFreeze} tone="amber" />
        <Action label="Export" icon={Download} onClick={onExport} />
        
        <button
          type="button"
          onClick={onClear}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.aside>
  );
}

interface ActionProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  tone?: "slate" | "rose" | "amber";
}

function Action({
  label,
  onClick,
  icon: Icon,
  tone = "slate",
}: ActionProps) {
  const toneClasses: Record<"slate" | "rose" | "amber", string> = {
    rose: "bg-rose-500 hover:bg-rose-600 text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    slate: "bg-white/10 hover:bg-white/15 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 ${toneClasses[tone]}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}