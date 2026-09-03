"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Mail, MapPin, Phone, UserRound } from "lucide-react";

import type { UserRecord } from "./UserManagementTypes";
import { Badge } from "./UserTableRow";

interface UserProfileCardProps {
  user: UserRecord;
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  const location = [user.city, user.country].filter(Boolean).join(", ");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header Info */}
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <UserRound className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-slate-900">
            {user.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge value={user.role} />
            <Badge value={user.status} />
          </div>
        </div>
      </div>

      {/* Metadata Items */}
      <div className="mt-4 grid gap-2 text-xs text-slate-500">
        <InfoLine icon={Mail}>{user.email}</InfoLine>
        {user.phone && <InfoLine icon={Phone}>{user.phone}</InfoLine>}
        {location && <InfoLine icon={MapPin}>{location}</InfoLine>}
      </div>
    </section>
  );
}

interface InfoLineProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

function InfoLine({ icon: Icon, children }: InfoLineProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{children}</span>
    </div>
  );
}