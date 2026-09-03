"use client";

import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";

import type { KYCRequest } from "./KYCManagementTypes";

export default function KYCReviewTimeline({
  request,
}: {
  request: KYCRequest;
}) {
  const steps = [
    {
      label: "Application created",
      value: request.createdAt,
      icon: FileCheck2,
      active: true,
    },
    {
      label: "Submitted for review",
      value: request.submittedAt,
      icon: Clock3,
      active: true,
    },
    {
      label: "Last reviewed",
      value: request.lastReviewedAt,
      icon: ShieldAlert,
      active: Boolean(request.lastReviewedAt),
    },
    {
      label: "Current state",
      value: request.status,
      icon: CheckCircle2,
      active:
        request.status === "Verified" ||
        request.status === "Rejected",
    },
  ];

  return (
    <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
        Review Timeline
      </p>

      <h3 className="mt-1 text-base font-black text-[#0F2745]">
        Case activity
      </h3>

      <div className="mt-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.label}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              <div className="relative z-10">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                    step.active
                      ? "border-blue-100 bg-blue-50 text-blue-600"
                      : "border-slate-200 bg-slate-50 text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="text-[9px] font-black text-[#174A7A]">
                  {step.label}
                </p>

                <p className="mt-1 text-[8px] text-slate-400">
                  {formatValue(step.value)}
                </p>
              </div>

              {index < steps.length - 1 && (
                <span className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-200" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatValue(
  value?: string
) {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}
