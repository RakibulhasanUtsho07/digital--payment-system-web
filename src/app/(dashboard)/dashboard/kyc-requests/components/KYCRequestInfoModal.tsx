"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

type DecisionAction =
  | "approve"
  | "reject"
  | "information"
  | "escalate";

interface KYCDecisionModalProps {
  open: boolean;
  action: DecisionAction | null;
  applicantName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const rejectReasons = [
  "Invalid document",
  "Document mismatch",
  "Failed selfie",
  "Suspicious document",
  "Expired document",
  "Unsupported document",
  "Information inconsistent",
  "Other",
] as const;

const informationReasons = [
  "Unclear NID front",
  "Missing NID back",
  "Selfie mismatch",
  "Expired document",
  "Unsupported document",
  "Name mismatch",
  "Additional proof required",
  "Other",
] as const;

const escalationReasons = [
  "Manual compliance review",
  "Additional risk assessment",
  "Reviewer uncertainty",
  "Identity mismatch requires escalation",
  "Other",
] as const;

export default function KYCDecisionModal({
  open,
  action,
  applicantName,
  onClose,
  onConfirm,
}: KYCDecisionModalProps) {
  const [reason, setReason] =
    useState("");

  const [customNote, setCustomNote] =
    useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setCustomNote("");
    }
  }, [open]);

  const isReasonRequired =
    action === "reject" ||
    action === "information" ||
    action === "escalate";

  const requiresCustomNote =
    reason === "Other";

  const isValid =
    action === "approve"
      ? true
      : Boolean(reason.trim()) &&
        (!requiresCustomNote ||
          Boolean(customNote.trim()));

  const handleConfirm = () => {
    if (!action || !isValid) {
      return;
    }

    const finalReason =
      reason === "Other"
        ? customNote.trim()
        : reason;

    onConfirm(
      action === "approve"
        ? "Approved after manual review"
        : finalReason
    );
  };

  return (
    <AnimatePresence>
      {open && action && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kyc-decision-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={onClose}
            aria-label="Close KYC decision dialog"
          />

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.97,
            }}
            transition={{
              duration: 0.2,
            }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* HEADER */}
            <div
              className={`border-b p-5 ${
                action === "approve"
                  ? "border-emerald-100 bg-emerald-50/70"
                  : action === "reject"
                    ? "border-rose-100 bg-rose-50/70"
                    : action ===
                        "information"
                      ? "border-amber-100 bg-amber-50/70"
                      : "border-blue-100 bg-blue-50/70"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      action === "approve"
                        ? "bg-emerald-100 text-emerald-700"
                        : action === "reject"
                          ? "bg-rose-100 text-rose-700"
                          : action ===
                              "information"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {action === "approve" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : action === "reject" ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : action === "information" ? (
                      <Info className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h2
                      id="kyc-decision-title"
                      className="text-lg font-black text-slate-900"
                    >
                      {getTitle(action)}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {getDescription(
                        action,
                        applicantName
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-slate-500 transition hover:bg-white hover:text-slate-900"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="p-5">
              {/* APPROVAL INFO */}
              {action === "approve" && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-black text-emerald-900">
                    Approval checklist
                  </p>

                  <div className="mt-3 space-y-2">
                    {[
                      "Identity information reviewed",
                      "Front document reviewed",
                      "Back document reviewed",
                      "Selfie reviewed",
                      "Verification checks reviewed",
                      "Risk reviewed",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-[10px] font-semibold text-emerald-800"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-200 bg-white/70 p-3 text-[10px] leading-5 text-emerald-800">
                    This demo action changes the local KYC state only. A real
                    backend approval endpoint must enforce the final decision
                    in production.
                  </div>
                </div>
              )}

              {/* REJECT */}
              {action === "reject" && (
                <ReasonSelector
                  label="Why are you rejecting this KYC?"
                  value={reason}
                  onChange={setReason}
                  options={rejectReasons}
                />
              )}

              {/* REQUEST INFO */}
              {action === "information" && (
                <ReasonSelector
                  label="What additional information is required?"
                  value={reason}
                  onChange={setReason}
                  options={informationReasons}
                />
              )}

              {/* ESCALATE */}
              {action === "escalate" && (
                <ReasonSelector
                  label="Why does this case need escalation?"
                  value={reason}
                  onChange={setReason}
                  options={escalationReasons}
                />
              )}

              {/* CUSTOM NOTE */}
              {isReasonRequired && (
                <div className="mt-5">
                  <label
                    htmlFor="kyc-decision-note"
                    className="mb-2 block text-xs font-bold text-slate-700"
                  >
                    {reason === "Other"
                      ? "Describe the reason"
                      : action === "information"
                        ? "Reviewer message"
                        : "Internal note"}
                  </label>

                  <textarea
                    id="kyc-decision-note"
                    value={customNote}
                    onChange={(event) =>
                      setCustomNote(
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder={
                      reason === "Other"
                        ? "Enter a clear reason..."
                        : action === "information"
                          ? "Tell the applicant what additional information is needed..."
                          : "Add an internal compliance note..."
                    }
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              )}

              {/* WARNING */}
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

                <p className="text-[10px] leading-5 text-slate-500">
                  Administrative KYC decisions should always be supported by
                  the review evidence and recorded in a server-side audit log
                  in production.
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isValid}
                onClick={handleConfirm}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : action === "reject"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : action === "information"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {getButtonText(action)}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReasonSelector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label
        htmlFor="kyc-decision-reason"
        className="mb-2 block text-xs font-bold text-slate-700"
      >
        {label}
      </label>

      <select
        id="kyc-decision-reason"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      >
        <option value="">
          Select a reason
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function getTitle(
  action: DecisionAction
) {
  switch (action) {
    case "approve":
      return "Approve KYC";

    case "reject":
      return "Reject KYC";

    case "information":
      return "Request More Information";

    case "escalate":
      return "Escalate KYC Review";
  }
}

function getDescription(
  action: DecisionAction,
  applicantName: string
) {
  switch (action) {
    case "approve":
      return `Approve identity verification for ${applicantName}? This changes the applicant's KYC state.`;

    case "reject":
      return `Reject ${applicantName}'s KYC application? A clear reason is required.`;

    case "information":
      return `Request additional evidence from ${applicantName} before making a final decision.`;

    case "escalate":
      return `Send ${applicantName}'s case to an additional compliance review workflow.`;
  }
}

function getButtonText(
  action: DecisionAction
) {
  switch (action) {
    case "approve":
      return "Approve KYC";

    case "reject":
      return "Reject KYC";

    case "information":
      return "Request Information";

    case "escalate":
      return "Escalate Case";
  }
}