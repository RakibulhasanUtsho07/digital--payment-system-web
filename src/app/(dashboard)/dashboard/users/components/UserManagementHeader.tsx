"use client";

import type { LucideIcon } from "lucide-react";
import {
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";

interface UserManagementHeaderProps {
  refreshing: boolean;
  onRefresh: () => void;
  onAddUser: () => void;
  onExport: () => void;
}

export default function UserManagementHeader({
  refreshing,
  onRefresh,
  onAddUser,
  onExport,
}: UserManagementHeaderProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#081D34] via-[#103B63] to-[#1E64AD] p-5 text-white shadow-[0_22px_60px_rgba(15,39,69,.18)] sm:p-7"
    >
      {/* Background Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:34px_34px]" />

      {/* Decorative Blur Effect */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-300 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-cyan-50">
              <ShieldCheck className="h-3.5 w-3.5" /> Administrator
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />{" "}
              System operational
            </span>
          </div>

          {/* Title and Subtitle */}
          <div className="mt-5 flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_8px_24px_rgba(6,182,212,.12)]"
            >
              <UsersRound className="h-6 w-6 text-cyan-100" strokeWidth={2} />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                User Operations
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100/75">
                Manage accounts, verification, wallet access, security posture
                and activity from one place.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]">
          <ActionButton
            onClick={onAddUser}
            icon={Plus}
            label="Add user"
            primary
          />
          <ActionButton
            onClick={onExport}
            icon={Download}
            label="Export users"
          />
          <ActionButton
            onClick={onRefresh}
            icon={RefreshCw}
            label="Refresh"
            disabled={refreshing}
            spin={refreshing}
          />
        </div>
      </div>
    </motion.section>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  spin?: boolean;
}

function ActionButton({
  onClick,
  icon: Icon,
  label,
  primary = false,
  disabled = false,
  spin = false,
}: ActionButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? "border-white bg-white text-[#164A7E] shadow-lg hover:bg-blue-50"
          : "border-white/15 bg-white/10 text-white hover:bg-white/15"
      }`}
    >
      <Icon className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
      {label}
    </motion.button>
  );
}
