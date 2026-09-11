"use client";

import {
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

import type { KYCRequest } from "./KYCManagementTypes";

export default function KYCRiskPanel({
  request,
}: {
  request: KYCRequest;
}) {
  const score = Math.max(
    0,
    Math.min(100, request.riskScore)
  );

  const style =
    request.riskLevel === "Critical" ||
    request.riskLevel === "High"
      ? {
          border:
            "border-rose-500/20",
          soft:
            "bg-rose-500/10",
          text:
            "text-rose-600 dark:text-rose-300",
          bar:
            "bg-rose-500",
        }
      : request.riskLevel === "Medium"
        ? {
            border:
              "border-amber-500/20",
            soft:
              "bg-amber-500/10",
            text:
              "text-amber-600 dark:text-amber-300",
            bar:
              "bg-amber-500",
          }
        : request.riskLevel === "Low"
          ? {
              border:
                "border-emerald-500/20",
              soft:
                "bg-emerald-500/10",
              text:
                "text-emerald-600 dark:text-emerald-300",
              bar:
                "bg-emerald-500",
            }
          : {
              border:
                "border-border",
              soft:
                "bg-muted",
              text:
                "text-muted-foreground",
              bar:
                "bg-muted-foreground/50",
            };

  const signals = [
    {
      label: "Failed login count",
      value:
        request.failedLoginCount.toLocaleString(),
    },
    {
      label: "Account age",
      value:
        request.accountAgeDays > 0
          ? `${request.accountAgeDays} days`
          : "Unknown",
    },
    {
      label: "Transaction count",
      value:
        request.transactionCount.toLocaleString(),
    },
    {
      label: "2FA",
      value:
        request.twoFactorEnabled
          ? "Enabled"
          : "Not enabled",
    },
  ];

  return (
    <section
      className={`rounded-[22px] border p-5 ${style.border} ${style.soft}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] opacity-55">
            Risk Assessment
          </p>

          <h3
            className={`mt-1 text-base font-black ${style.text}`}
          >
            {request.riskLevel} risk
          </h3>
        </div>

        <ShieldAlert
          className={`h-5 w-5 ${style.text}`}
        />
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.1em] opacity-55">
            Risk score
          </p>

          <p
            className={`mt-1 text-3xl font-black ${style.text}`}
          >
            {request.riskScore > 0
              ? score
              : "—"}
          </p>
        </div>

        <span
          className={`rounded-full border bg-background/65 px-3 py-1.5 text-[8px] font-black ${style.border} ${style.text}`}
        >
          {request.verificationResult}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/70">
        <div
          className={`h-full rounded-full ${style.bar}`}
          style={{
            width: `${
              request.riskScore > 0
                ? score
                : 0
            }%`,
          }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {signals.map((signal) => (
          <div
            key={signal.label}
            className="rounded-[14px] border border-border bg-background/65 p-3"
          >
            <p className="text-[7px] font-black uppercase tracking-[0.09em] text-muted-foreground">
              {signal.label}
            </p>

            <p className="mt-1 text-[9px] font-black text-foreground">
              {signal.value}
            </p>
          </div>
        ))}
      </div>

      {request.riskLevel === "Unknown" && (
        <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-border bg-background/65 p-3">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <p className="text-[8px] leading-4 text-muted-foreground">
            No backend risk score is available yet. Do not treat this applicant
            as low risk by default.
          </p>
        </div>
      )}
    </section>
  );
}