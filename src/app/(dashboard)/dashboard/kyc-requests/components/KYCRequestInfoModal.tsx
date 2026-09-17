"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

export type DecisionAction =
  | "approve"
  | "reject";

const rejectReasons = [
  "Invalid document",
  "Document mismatch",
  "Failed selfie / identity comparison",
  "Expired document",
  "Unsupported document",
  "Information inconsistent",
  "Unable to verify identity",
  "Other",
] as const;

export default function KYCDecisionModal({
  open,
  action,
  applicantName,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  action: DecisionAction | null;
  applicantName: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setCustomReason("");
    }
  }, [open]);

  const isApprove = action === "approve";

  const valid =
    isApprove ||
    (
      Boolean(reason) &&
      (
        reason !== "Other" ||
        Boolean(customReason.trim())
      )
    );

  const submit = () => {
    if (!action || !valid || submitting) {
      return;
    }

    onConfirm(
      isApprove
        ? "Approved after manual compliance review"
        : reason === "Other"
          ? customReason.trim()
          : reason
    );
  };

  return (
    <AnimatePresence>
      {open && action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[4px]"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
            aria-label="Close decision dialog"
          />

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 16,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 12,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 29,
            }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_30px_90px_rgba(0,0,0,0.3)]"
          >
            <div
              className={`border-b p-5 ${
                isApprove
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-rose-500/20 bg-rose-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background ${
                      isApprove
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    {isApprove ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <ShieldAlert className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                      Manual Decision
                    </p>

                    <h2 className="mt-1 text-lg font-black text-foreground">
                      {isApprove
                        ? "Approve KYC"
                        : "Reject KYC"}
                    </h2>

                    <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                      {isApprove
                        ? `Confirm that you manually reviewed the source evidence for ${applicantName}.`
                        : `Choose a clear rejection reason for ${applicantName}.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {isApprove ? (
                <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                    Final reviewer checklist
                  </p>

                  <div className="mt-3 space-y-2">
                    {[
                      "Applicant identity details reviewed",
                      "Submitted document images inspected",
                      "Automated screening result considered",
                      "Risk and verification flags reviewed",
                      "Decision is based on source evidence",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-[9px] font-semibold text-emerald-700/80 dark:text-emerald-300/80"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[9px] font-black text-foreground">
                    Rejection reason
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {rejectReasons.map((item) => {
                      const selected =
                        reason === item;

                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() =>
                            setReason(item)
                          }
                          className={`rounded-[14px] border px-3 py-3 text-left text-[9px] font-bold transition ${
                            selected
                              ? "border-rose-500/25 bg-rose-500/10 text-rose-500"
                              : "border-border bg-background text-muted-foreground hover:border-rose-500/20 hover:bg-rose-500/5"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {reason === "Other" && (
                    <textarea
                      value={customReason}
                      onChange={(event) =>
                        setCustomReason(
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder="Describe the rejection reason clearly..."
                      className="mt-3 w-full resize-none rounded-[16px] border border-border bg-background px-4 py-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground focus:border-rose-500/40 focus:ring-4 focus:ring-rose-500/10"
                    />
                  )}
                </div>
              )}

              <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

                <p className="text-[9px] leading-5 text-amber-700 dark:text-amber-300">
                  The automated review is advisory. This confirmation writes
                  the final KYC state through the protected backend review
                  endpoint.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/35 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-10 rounded-xl border border-border bg-background px-4 text-[9px] font-black text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={!valid || submitting}
                className={`h-10 rounded-xl px-4 text-[9px] font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isApprove
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting
                  ? "Saving Decision..."
                  : isApprove
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}