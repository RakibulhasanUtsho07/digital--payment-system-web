"use client";

import {
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import type {
  VerificationCheck,
} from "./KYCManagementTypes";

export default function KYCVerificationChecks({
  checks,
}: {
  checks: VerificationCheck[];
}) {
  return (
    <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
        Verification Checks
      </p>

      <h3 className="mt-1 text-base font-black text-[#0F2745]">
        Evidence signals
      </h3>

      <div className="mt-4 space-y-2.5">
        {checks.length > 0 ? (
          checks.map((check, index) => (
            <VerificationRow
              key={`${check.label}-${index}`}
              check={check}
            />
          ))
        ) : (
          <p className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-4 text-[9px] text-slate-400">
            No verification checks have been recorded yet.
          </p>
        )}
      </div>
    </section>
  );
}

function VerificationRow({
  check,
}: {
  check: VerificationCheck;
}) {
  const config =
    check.status === "Pass"
      ? {
          icon: CheckCircle2,
          className:
            "border-emerald-100 bg-emerald-50 text-emerald-700",
        }
      : check.status === "Fail"
        ? {
            icon: XCircle,
            className:
              "border-rose-100 bg-rose-50 text-rose-700",
          }
        : {
            icon: AlertCircle,
            className:
              "border-amber-100 bg-amber-50 text-amber-700",
          };

  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-[16px] border p-3 ${config.className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black">
            {check.label}
          </p>

          <span className="text-[8px] font-black">
            {check.status}
          </span>
        </div>

        {check.reason && (
          <p className="mt-1 text-[8px] leading-4 opacity-65">
            {check.reason}
          </p>
        )}
      </div>
    </div>
  );
}
