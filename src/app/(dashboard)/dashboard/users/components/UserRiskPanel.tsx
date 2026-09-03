"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import type {
  RiskLevel,
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";

interface UserRiskPanelProps {
  user: UserRecord;
  onUpdate: (id: string, patch: UpdateUserInput) => Promise<void> | void;
}

export default function UserRiskPanel({
  user,
  onUpdate,
}: UserRiskPanelProps) {
  const getProgressColor = (score: number) => {
    if (score >= 70) return "#F43F5E";
    if (score >= 40) return "#F59E0B";
    return "#10B981";
  };

  const handleUpdateRisk = (riskLevel: RiskLevel, riskScore: number) => {
    void onUpdate(user.id, { riskLevel, riskScore });
  };

  const progressColor = getProgressColor(user.riskScore);
  const isHighRisk = user.riskLevel === "high";

  return (
    <section>
      {/* Risk Score Progress Card */}
      <div className="rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Composite risk score
            </p>
            <p className="mt-1 text-4xl font-black text-slate-900">
              {user.riskScore}
              <span className="text-sm font-normal text-slate-300">/100</span>
            </p>
          </div>

          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              isHighRisk
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isHighRisk ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </span>
        </div>

        {/* Risk Progress Bar */}
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${user.riskScore}%`, background: progressColor }}
          />
        </div>

        <p className="mt-3 text-[10px] leading-5 text-slate-400">
          Score should be calculated on the server from login, KYC, transaction
          and device signals.
        </p>
      </div>

      {/* Action Preset Buttons */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleUpdateRisk("low", 15)}
          className="h-10 rounded-xl bg-emerald-50 text-[10px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          Set low
        </button>
        <button
          type="button"
          onClick={() => handleUpdateRisk("medium", 50)}
          className="h-10 rounded-xl bg-amber-50 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        >
          Set medium
        </button>
        <button
          type="button"
          onClick={() => handleUpdateRisk("high", 85)}
          className="h-10 rounded-xl bg-rose-50 text-[10px] font-bold text-rose-700 transition-colors hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        >
          Set high
        </button>
      </div>
    </section>
  );
}