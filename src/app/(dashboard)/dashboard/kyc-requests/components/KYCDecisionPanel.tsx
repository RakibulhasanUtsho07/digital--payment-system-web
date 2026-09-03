"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import type {
  KYCAIReview,
  KYCRequest,
} from "./KYCManagementTypes";

export default function KYCDecisionPanel({
  request,
  aiReview,
  onApprove,
  onReject,
}: {
  request: KYCRequest;
  aiReview: KYCAIReview | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
          Final Manual Decision
        </p>

        <h3 className="mt-1 text-lg font-black text-[#0F2745]">
          Approve or reject this KYC
        </h3>

        <p className="mt-2 text-[9px] leading-5 text-slate-500">
          Review the applicant details, document evidence, verification checks and risk signals before making a final decision.
        </p>

        {aiReview && (
          <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50/55 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.11em] text-blue-500">
              Automated recommendation
            </p>

            <p className="mt-1 text-[11px] font-black text-[#174A7A]">
              {formatRecommendation(aiReview.recommendation)} • {aiReview.confidence}%
            </p>

            <p className="mt-1 text-[8px] leading-4 text-slate-500">
              {aiReview.summary}
            </p>
          </div>
        )}

        <div className="mt-4 rounded-[16px] border border-slate-100 bg-slate-50 p-3">
          <p className="text-[8px] font-black text-slate-500">
            Current status
          </p>

          <p className="mt-1 text-[10px] font-black text-[#0F2745]">
            {request.status}
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={onApprove}
          className="rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-5 text-left transition hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <p className="mt-4 text-[11px] font-black text-emerald-800">
            Approve KYC
          </p>

          <p className="mt-1 text-[8px] leading-4 text-emerald-700/65">
            Mark the applicant as verified after manual evidence review.
          </p>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          onClick={onReject}
          className="rounded-[22px] border border-rose-100 bg-rose-50/70 p-5 text-left transition hover:border-rose-200 hover:shadow-[0_12px_30px_rgba(244,63,94,0.1)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
            <XCircle className="h-4 w-4" />
          </div>

          <p className="mt-4 text-[11px] font-black text-rose-800">
            Reject KYC
          </p>

          <p className="mt-1 text-[8px] leading-4 text-rose-700/65">
            Reject with a clear reason that can be saved to the server audit trail.
          </p>
        </motion.button>
      </div>

      <div className="rounded-[18px] border border-amber-100 bg-amber-50/60 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

          <p className="text-[9px] leading-5 text-amber-800/75">
            Automated screening is advisory only. The administrator remains responsible for the final KYC decision.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatRecommendation(
  value: KYCAIReview["recommendation"]
) {
  if (value === "likely_clear") {
    return "Likely Clear";
  }

  if (value === "likely_reject") {
    return "Likely Reject";
  }

  return "Manual Review Required";
}
