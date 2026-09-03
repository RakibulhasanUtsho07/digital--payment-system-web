"use client";

import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Snowflake,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";
import { Badge } from "./UserTableRow";

interface UserWalletCardProps {
  user: UserRecord;
  onUpdate: (id: string, patch: UpdateUserInput) => Promise<void> | void;
}

interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}

export default function UserWalletCard({
  user,
  onUpdate,
}: UserWalletCardProps) {
  const isFrozen = user.walletStatus === "frozen";

  const handleToggleFreeze = () => {
    void onUpdate(user.id, {
      walletStatus: isFrozen ? "active" : "frozen",
    });
  };

  return (
    <section>
      {/* Wallet Balance Card */}
      <div className="rounded-[22px] bg-gradient-to-br from-[#0F2745] to-[#1F5EA8] p-5 text-white shadow-sm">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <WalletCards className="h-5 w-5" />
          </span>
          <Badge value={user.walletStatus} />
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-wider text-blue-100/65">
          Available balance
        </p>
        <p className="mt-1 text-3xl font-black">{formatMoney(user.balance)}</p>
        <p className="mt-4 text-[10px] text-blue-100/60">
          Wallet ID: {user.walletId}
        </p>
      </div>

      {/* Transaction Metrics Grid */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric
          icon={ArrowDownLeft}
          label="Received"
          value={formatMoney(user.totalReceived)}
          tone="text-emerald-600 bg-emerald-50"
        />
        <Metric
          icon={ArrowUpRight}
          label="Sent"
          value={formatMoney(user.totalSent)}
          tone="text-blue-600 bg-blue-50"
        />
      </div>

      {/* Freeze / Unfreeze Action Button */}
      <button
        type="button"
        onClick={handleToggleFreeze}
        className={`mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition-colors focus:outline-none focus:ring-2 ${
          isFrozen
            ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/20"
            : "bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-500/20"
        }`}
      >
        <Snowflake className="h-4 w-4" />
        {isFrozen ? "Unfreeze wallet" : "Freeze wallet"}
      </button>
    </section>
  );
}

// Sub-component: Metric Card Item
function Metric({ icon: Icon, label, value, tone }: MetricProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-[9px] uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

// Helper Function: BDT Currency Formatting
function formatMoney(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}