"use client";

import {
  FileSearch,
  RefreshCw,
} from "lucide-react";

export default function KYCEmptyState({
  title = "No KYC requests found",
  description = "There are no review requests matching the current filters.",
  onReset,
  onRefresh,
}: {
  title?: string;
  description?: string;
  onReset?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-[#C9D9E6] bg-white p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1F5EA8]">
          <FileSearch className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-base font-black text-[#0F2745]">
          {title}
        </h3>

        <p className="mt-2 text-[10px] leading-5 text-slate-500">
          {description}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[9px] font-black text-slate-600"
            >
              Clear Filters
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-[9px] font-black text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
