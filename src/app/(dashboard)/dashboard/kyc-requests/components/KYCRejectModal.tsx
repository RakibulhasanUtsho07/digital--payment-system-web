"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

const reasons = [
  "Invalid document",
  "Document mismatch",
  "Failed selfie / identity comparison",
  "Expired document",
  "Unsupported document",
  "Information inconsistent",
  "Unable to verify identity",
  "Other",
] as const;

export default function KYCRejectModal({
  open,
  applicantName,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  applicantName: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [
    reason,
    setReason,
  ] =
    useState(
      ""
    );

  const [
    customReason,
    setCustomReason,
  ] =
    useState(
      ""
    );

  useEffect(() => {
    if (!open) {
      setReason("");
      setCustomReason("");
    }
  }, [open]);

  const valid =
    Boolean(reason) &&
    (
      reason !== "Other" ||
      Boolean(customReason.trim())
    );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] flex items-center justify-center bg-[#071B30]/55 p-4 backdrop-blur-[4px]"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={onClose}
            aria-label="Close rejection modal"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[28px] border border-rose-100 bg-white shadow-2xl"
          >
            <div className="border-b border-rose-100 bg-rose-50/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600">
                    <ShieldAlert className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-rose-400">
                      Manual Decision
                    </p>

                    <h2 className="mt-1 text-lg font-black text-[#0F2745]">
                      Reject KYC
                    </h2>

                    <p className="mt-1 text-[9px] leading-5 text-slate-500">
                      Select a clear rejection reason for {applicantName}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {reasons.map((item) => {
                  const active =
                    reason === item;

                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setReason(item)}
                      className={`rounded-[14px] border px-3 py-3 text-left text-[9px] font-bold transition ${
                        active
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-rose-100 hover:bg-rose-50/40"
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
                  onChange={(event) => setCustomReason(event.target.value)}
                  rows={4}
                  placeholder="Describe the rejection reason clearly..."
                  className="mt-3 w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/60"
                />
              )}

              <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-amber-100 bg-amber-50/65 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                <p className="text-[9px] leading-5 text-amber-800/75">
                  The reason should be supported by the reviewed evidence and recorded in the server-side audit trail.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-[#F8FBFD] p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-black text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!valid || submitting}
                onClick={() =>
                  onConfirm(
                    reason === "Other"
                      ? customReason.trim()
                      : reason
                  )
                }
                className="h-10 rounded-xl bg-rose-600 px-4 text-[9px] font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
