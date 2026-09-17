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
    <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-border bg-card p-6 text-center text-card-foreground">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/15 bg-indigo-500/10 text-indigo-500">
          <FileSearch className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-base font-black text-foreground">
          {title}
        </h3>

        <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
          {description}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-[9px] font-black text-muted-foreground transition hover:border-indigo-500/30 hover:text-indigo-500"
            >
              Clear Filters
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[9px] font-black text-white transition hover:bg-violet-600"
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