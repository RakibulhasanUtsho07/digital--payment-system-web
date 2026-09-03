"use client";

import React from "react";
import {
  CheckCircle2,
  FileCheck2,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type {
  KYCStatus,
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";
import { Badge } from "./UserTableRow";

interface UserKYCPanelProps {
  user: UserRecord;
  onUpdate: (id: string, patch: UpdateUserInput) => Promise<void> | void;
}

interface KycActionProps {
  icon: LucideIcon;
  label: string;
  color: string;
  onClick: () => void;
}

export default function UserKYCPanel({ user, onUpdate }: UserKYCPanelProps) {
  const handleSetStatus = (kycStatus: KYCStatus) => {
    void onUpdate(user.id, { kycStatus });
  };

  return (
    <section>
      {/* Identity Verification Header Card */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <FileCheck2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Identity verification
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Manual review and approval
            </p>
          </div>
        </div>
        <Badge value={user.kycStatus} />
      </div>

      {/* Action Buttons Grid */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <KycAction
          icon={CheckCircle2}
          label="Approve"
          color="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => handleSetStatus("verified")}
        />
        <KycAction
          icon={RotateCcw}
          label="Review"
          color="bg-amber-500 hover:bg-amber-600"
          onClick={() => handleSetStatus("under_review")}
        />
        <KycAction
          icon={XCircle}
          label="Reject"
          color="bg-rose-600 hover:bg-rose-700"
          onClick={() => handleSetStatus("rejected")}
        />
      </div>

      {/* Production Note Banner */}
      <p className="mt-4 rounded-xl bg-blue-50 p-3 text-[10px] leading-5 text-blue-700">
        Production note: decisions should require an admin reason, document
        checks and an immutable audit event.
      </p>
    </section>
  );
}

// Action Button Sub-component
function KycAction({ icon: Icon, label, color, onClick }: KycActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl text-[10px] font-extrabold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}