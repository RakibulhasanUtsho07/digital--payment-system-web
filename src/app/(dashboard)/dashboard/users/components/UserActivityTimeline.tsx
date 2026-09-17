import React from "react";
import {
  Activity,
  KeyRound,
  ShieldCheck,
  UserRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { UserActivity, UserRecord } from "./UserManagementTypes";

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  login: KeyRound,
  profile: UserRound,
  security: ShieldCheck,
  wallet: WalletCards,
  kyc: ShieldCheck,
  admin: Activity,
};

interface UserActivityTimelineProps {
  user: UserRecord;
}

interface TimelineItemProps {
  entry: UserActivity;
  last: boolean;
}

export default function UserActivityTimeline({
  user,
}: UserActivityTimelineProps) {
  const entries = user.activities ?? [];

  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
        No activity has been loaded yet.
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => (
        <TimelineItem
          key={entry.id}
          entry={entry}
          last={index === entries.length - 1}
        />
      ))}
    </ol>
  );
}

function TimelineItem({ entry, last }: TimelineItemProps) {
  const Icon = ACTIVITY_ICONS[entry.type] || Activity;

  return (
    <li className="relative flex gap-3.5 pb-5">
      {/* Icon Node */}
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>

      {/* Vertical Connecting Line */}
      {!last && (
        <span className="absolute left-[17px] top-9 h-[calc(100%-24px)] w-px bg-slate-200" />
      )}

      {/* Activity Details */}
      <div className="min-w-0 pt-0.5">
        <p className="text-xs font-bold text-slate-800">{entry.title}</p>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          {entry.description}
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-slate-400">
          {new Date(entry.createdAt).toLocaleString("en-BD")}
          {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
        </p>
      </div>
    </li>
  );
}