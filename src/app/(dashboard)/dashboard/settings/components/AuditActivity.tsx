"use client";

import {
  History,
  Clock3,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";

const AUDIT_ITEMS = [
  {
    user: "Rakibul H.",
    action: "Risk threshold updated",
    detail:
      "৳20,000 → ৳25,000",
    time: "10 mins ago",
  },
  {
    user: "System",
    action: "Automated backup",
    detail:
      "Database & object store",
    time: "2 hours ago",
  },
  {
    user: "Support Admin",
    action: "User suspended",
    detail:
      "Security review required",
    time: "Yesterday",
  },
];

export default function AuditActivity() {
  return (
    <section className="space-y-7">
      <Header
        title="Audit Activity"
        description="Review recent administrative configuration changes and operational activity."
      />

      <div className="space-y-3">
        {AUDIT_ITEMS.map(
          (item, index) => (
            <motion.div
              key={`${item.user}-${item.time}`}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.05,
              }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {item.action}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.detail}
                    </p>

                    <p className="mt-2 text-[10px] text-slate-400">
                      By {item.user}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {item.time}
                </span>
              </div>
            </motion.div>
          )
        )}
      </div>

      <button
        type="button"
        className="w-full rounded-2xl border border-dashed border-slate-200 py-3 text-xs font-bold text-[#1F5EA8] transition hover:bg-slate-50"
      >
        View Full Audit Trail
      </button>
    </section>
  );
}

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
          <History className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#0F2745]">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}