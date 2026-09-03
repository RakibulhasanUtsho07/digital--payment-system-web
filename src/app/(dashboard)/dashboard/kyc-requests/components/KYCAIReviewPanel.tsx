"use client";

import {
  motion,
} from "framer-motion";

import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import type {
  ElementType,
} from "react";

import type {
  KYCAIReview,
} from "./KYCManagementTypes";

export default function KYCAIReviewPanel({
  review,
  loading,
  running,
  error,
  onRun,
}: {
  review:
    KYCAIReview |
    null;

  loading:
    boolean;

  running:
    boolean;

  error:
    string;

  onRun:
    () => void;
}) {
  if (
    loading
  ) {
    return (
      <div className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>

          <div>
            <p className="text-[10px] font-black text-[#0F2745]">
              Loading automated review
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Reading the latest stored screening result...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (
    !review
  ) {
    return (
      <div className="rounded-[22px] border border-dashed border-[#C9D9E6] bg-[#F8FBFD] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BrainCircuit className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-[#0F2745]">
              No automated screening result yet
            </p>

            <p className="mt-1 text-[9px] leading-5 text-slate-500">
              Run the screening assistant to summarize available verification signals.
              The final KYC decision remains with the administrator.
            </p>

            {error && (
              <p className="mt-2 text-[9px] font-semibold text-rose-600">
                {
                  error
                }
              </p>
            )}

            <button
              type="button"
              onClick={
                onRun
              }
              disabled={
                running
              }
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 text-[9px] font-black text-white transition hover:bg-[#174A7A] disabled:opacity-50"
            >
              <BrainCircuit className="h-4 w-4" />
              {
                running
                  ? "Running Review..."
                  : "Run Automated Review"
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recommendation =
    getRecommendationConfig(
      review.recommendation
    );

  const RecommendationIcon =
    recommendation.icon;

  return (
    <div className="space-y-4">
      <motion.section
        initial={{
          opacity:
            0,
          y:
            8,
        }}
        animate={{
          opacity:
            1,
          y:
            0,
        }}
        className={`rounded-[22px] border p-5 ${recommendation.container}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${recommendation.iconClass}`}
            >
              <RecommendationIcon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-60">
                Automated Screening
              </p>

              <h3 className="mt-1 text-base font-black">
                {
                  recommendation.label
                }
              </h3>

              <p className="mt-1 max-w-xl text-[9px] leading-5 opacity-75">
                {
                  review.summary
                }
              </p>
            </div>
          </div>

          <div className="rounded-[16px] border border-current/10 bg-white/65 px-3 py-2 text-center">
            <p className="text-[7px] font-black uppercase tracking-[0.11em] opacity-55">
              Confidence
            </p>

            <p className="mt-1 text-lg font-black">
              {
                Math.max(
                  0,
                  Math.min(
                    100,
                    review.confidence
                  )
                )
              }%
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
          <motion.div
            initial={{
              width:
                0,
            }}
            animate={{
              width:
                `${Math.max(
                  0,
                  Math.min(
                    100,
                    review.confidence
                  )
                )}%`,
            }}
            transition={{
              duration:
                0.7,
            }}
            className={recommendation.bar}
          />
        </div>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewList
          title="Why this recommendation"
          items={
            review.reasons
          }
          icon={
            CheckCircle2
          }
          emptyText="No recommendation reasons were returned."
          tone="blue"
        />

        <ReviewList
          title="Signals still missing"
          items={
            review.missingSignals
          }
          icon={
            AlertCircle
          }
          emptyText="No missing signals were reported."
          tone="amber"
        />
      </div>

      <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
              <Clock3 className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[9px] font-black text-[#0F2745]">
                Review metadata
              </p>

              <p className="mt-1 text-[8px] leading-4 text-slate-400">
                {review.reviewedAt
                  ? `Reviewed ${formatDate(
                      review.reviewedAt
                    )}`
                  : "Review time unavailable"}
                {review.model
                  ? ` • ${review.model}`
                  : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onRun
            }
            disabled={
              running
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE7F0] bg-white px-3 text-[9px] font-black text-[#174A7A] transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            Re-run Screening
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[9px] font-semibold text-rose-600">
            {
              error
            }
          </p>
        )}
      </section>

      <div className="rounded-[20px] border border-amber-100 bg-amber-50/70 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

          <p className="text-[9px] leading-5 text-amber-800/80">
            Automated screening is decision support only. It must not independently
            approve or reject access to the wallet. An administrator should inspect
            the source evidence before the final KYC decision.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewList({
  title,
  items,
  icon:
    Icon,
  emptyText,
  tone,
}: {
  title:
    string;

  items:
    string[];

  icon:
    ElementType;

  emptyText:
    string;

  tone:
    "blue"
    | "amber";
}) {
  const style =
    tone ===
    "blue"
      ? "border-blue-100 bg-blue-50/50 text-blue-700"
      : "border-amber-100 bg-amber-50/50 text-amber-700";

  return (
    <section className={`rounded-[22px] border p-4 ${style}`}>
      <p className="text-[9px] font-black">
        {
          title
        }
      </p>

      <div className="mt-3 space-y-2">
        {items.length >
        0 ? (
          items.map(
            (
              item,
              index
            ) => (
              <div
                key={`${item}-${index}`}
                className="flex items-start gap-2"
              >
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-75" />

                <p className="text-[8px] leading-4 opacity-80">
                  {
                    item
                  }
                </p>
              </div>
            )
          )
        ) : (
          <p className="text-[8px] leading-4 opacity-60">
            {
              emptyText
            }
          </p>
        )}
      </div>
    </section>
  );
}

function getRecommendationConfig(
  value:
    KYCAIReview["recommendation"]
) {
  if (
    value ===
    "likely_clear"
  ) {
    return {
      label:
        "Likely Clear",
      icon:
        CheckCircle2,
      container:
        "border-emerald-100 bg-emerald-50/75 text-emerald-800",
      iconClass:
        "bg-white text-emerald-600",
      bar:
        "h-full rounded-full bg-emerald-500",
    };
  }

  if (
    value ===
    "likely_reject"
  ) {
    return {
      label:
        "Likely Reject",
      icon:
        ShieldAlert,
      container:
        "border-rose-100 bg-rose-50/75 text-rose-800",
      iconClass:
        "bg-white text-rose-600",
      bar:
        "h-full rounded-full bg-rose-500",
    };
  }

  return {
    label:
      "Manual Review Required",
    icon:
      AlertCircle,
    container:
      "border-amber-100 bg-amber-50/75 text-amber-800",
    iconClass:
      "bg-white text-amber-600",
    bar:
      "h-full rounded-full bg-amber-500",
  };
}

function formatDate(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}
