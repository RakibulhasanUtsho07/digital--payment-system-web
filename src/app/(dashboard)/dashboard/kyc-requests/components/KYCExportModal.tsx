"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Check,
  Download,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

export interface KYCExportOptions {
  scope: "filtered" | "selected";
  fields: string[];
}

const fields = [
  "Case ID",
  "Applicant",
  "Email",
  "Phone",
  "Document Type",
  "Status",
  "Verification",
  "Risk",
  "Risk Score",
  "Submitted At",
] as const;

export default function KYCExportModal({
  open,
  selectedCount,
  filteredCount,
  onClose,
  onExport,
}: {
  open: boolean;
  selectedCount: number;
  filteredCount: number;
  onClose: () => void;
  onExport: (options: KYCExportOptions) => void;
}) {
  const [
    scope,
    setScope,
  ] =
    useState<"filtered" | "selected">(
      selectedCount > 0
        ? "selected"
        : "filtered"
    );

  const [
    selectedFields,
    setSelectedFields,
  ] =
    useState<string[]>([
      ...fields,
    ]);

  useEffect(() => {
    if (open) {
      setScope(
        selectedCount > 0
          ? "selected"
          : "filtered"
      );
    }
  }, [open, selectedCount]);

  const toggleField =
    (
      field: string
    ) => {
      setSelectedFields((current) =>
        current.includes(field)
          ? current.filter((item) => item !== field)
          : [...current, field]
      );
    };

  const count =
    scope === "selected"
      ? selectedCount
      : filteredCount;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] flex items-center justify-center bg-[#071B30]/55 p-4 backdrop-blur-[4px]"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={onClose}
            aria-label="Close export modal"
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="relative z-10 w-full max-w-xl rounded-[28px] border border-[#DCE7F0] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
                  Export Review Data
                </p>

                <h2 className="mt-1 text-lg font-black text-[#0F2745]">
                  Choose export scope
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <ScopeButton
                active={scope === "filtered"}
                title="Filtered queue"
                helper={`${filteredCount} records`}
                onClick={() => setScope("filtered")}
              />

              <ScopeButton
                active={scope === "selected"}
                disabled={selectedCount === 0}
                title="Selected rows"
                helper={`${selectedCount} selected`}
                onClick={() => setScope("selected")}
              />
            </div>

            <div className="mt-5">
              <p className="text-[9px] font-black text-slate-700">
                CSV fields
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {fields.map((field) => {
                  const active =
                    selectedFields.includes(field);

                  return (
                    <button
                      type="button"
                      key={field}
                      onClick={() => toggleField(field)}
                      className={`flex items-center justify-between rounded-[13px] border px-3 py-2.5 text-left text-[9px] font-bold transition ${
                        active
                          ? "border-blue-100 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {field}

                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          active
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 text-transparent"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={count === 0 || selectedFields.length === 0}
              onClick={() =>
                onExport({
                  scope,
                  fields: selectedFields,
                })
              }
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1F5EA8] text-[9px] font-black text-white transition hover:bg-[#174A7A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export {count} record{count === 1 ? "" : "s"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScopeButton({
  active,
  disabled = false,
  title,
  helper,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-[16px] border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      <p className="text-[9px] font-black">
        {title}
      </p>

      <p className="mt-1 text-[8px] opacity-60">
        {helper}
      </p>
    </button>
  );
}
