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
      active: Boolean(
        request.lastReviewedAt
      ),
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
    <section className="rounded-[22px] border border-border bg-card p-5 text-card-foreground">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-indigo-500">
        Review Timeline
      </p>

      <h3 className="mt-1 text-base font-black text-foreground">
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
                      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
                      : "border-border bg-muted text-muted-foreground/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="text-[9px] font-black text-foreground">
                  {step.label}
                </p>

                <p className="mt-1 text-[8px] text-muted-foreground">
                  {formatValue(step.value)}
                </p>
              </div>

              {index < steps.length - 1 && (
                <span className="absolute bottom-0 left-[17px] top-9 w-px bg-border" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatValue(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}