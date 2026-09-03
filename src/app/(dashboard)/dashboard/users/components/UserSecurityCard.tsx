"use client";

import React, { type ReactNode } from "react";
import {
  Fingerprint,
  KeyRound,
  Laptop2,
  Lock,
  type LucideIcon,
} from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
} from "./UserManagementTypes";

interface UserSecurityCardProps {
  user: UserRecord;
  onUpdate: (id: string, patch: UpdateUserInput) => Promise<void> | void;
}

interface SecurityRowProps {
  icon: LucideIcon;
  title: string;
  note: string;
  action?: ReactNode;
}

export default function UserSecurityCard({
  user,
  onUpdate,
}: UserSecurityCardProps) {
  const handleToggle2FA = () => {
    void onUpdate(user.id, { twoFactorEnabled: !user.twoFactorEnabled });
  };

  return (
    <section className="space-y-3">
      {/* Two-Factor Authentication */}
      <SecurityRow
        icon={Fingerprint}
        title="Two-factor authentication"
        note={user.twoFactorEnabled ? "Enabled" : "Not enabled"}
        action={
          <button
            type="button"
            onClick={handleToggle2FA}
            className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              user.twoFactorEnabled
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500/20"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500/20"
            }`}
          >
            {user.twoFactorEnabled ? "Disable" : "Enable"}
          </button>
        }
      />

      {/* Active Sessions Counter */}
      <SecurityRow
        icon={Laptop2}
        title="Active sessions"
        note={`${user.activeSessions} signed-in device(s)`}
      />

      {/* Failed Login Attempts */}
      <SecurityRow
        icon={KeyRound}
        title="Failed sign-ins"
        note={`${user.failedLoginCount} recent attempt(s)`}
      />

      {/* Password Reset Action */}
      <SecurityRow
        icon={Lock}
        title="Password access"
        note="Reset through a secure one-time link"
        action={
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
          >
            Send reset
          </button>
        }
      />
    </section>
  );
}

// Sub-component: Security Row Detail Item
function SecurityRow({ icon: Icon, title, note, action }: SecurityRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800">{title}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{note}</p>
      </div>
      {action}
    </div>
  );
}