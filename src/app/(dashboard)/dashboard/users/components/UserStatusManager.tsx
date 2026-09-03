"use client";

import React from "react";
import { Activity } from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
  UserStatus,
} from "./UserManagementTypes";

interface UserStatusManagerProps {
  user: UserRecord;
  onUpdate: (id: string, patch: UpdateUserInput) => Promise<void> | void;
}

const STATUSES: readonly UserStatus[] = [
  "active",
  "pending",
  "restricted",
  "suspended",
] as const;

export default function UserStatusManager({
  user,
  onUpdate,
}: UserStatusManagerProps) {
  const handleStatusChange = (status: UserStatus) => {
    void onUpdate(user.id, { status });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      {/* Account Status Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Activity className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-xs font-black text-slate-800">
            Account status
          </h3>
          <p className="text-[10px] text-slate-400">
            Controls access to protected features.
          </p>
        </div>
      </div>

      {/* Status Action Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((status) => {
          const isActive = user.status === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              className={`rounded-xl px-3 py-2 text-[10px] font-extrabold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>
    </section>
  );
}