"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

import type {
  UpdateUserInput,
  UserRecord,
  UserRole,
} from "./UserManagementTypes";

interface UserRoleManagerProps {
  user: UserRecord;
  onUpdate: (id: string, patch: UpdateUserInput) => Promise<void> | void;
}

const ROLES: readonly UserRole[] = [
  "user",
  "support",
  "analyst",
  "admin",
] as const;

export default function UserRoleManager({
  user,
  onUpdate,
}: UserRoleManagerProps) {
  const handleRoleChange = (role: UserRole) => {
    void onUpdate(user.id, { role });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      {/* Role Management Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-xs font-black text-slate-800">
            Role and permissions
          </h3>
          <p className="text-[10px] text-slate-400">
            RBAC must also be enforced on the server.
          </p>
        </div>
      </div>

      {/* Role Selection Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {ROLES.map((role) => {
          const isActive = user.role === role;

          return (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleChange(role)}
              className={`h-10 rounded-xl text-[10px] font-extrabold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>
    </section>
  );
}