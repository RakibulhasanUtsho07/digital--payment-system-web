"use client";

import { AnimatePresence, motion } from "framer-motion";

import {
  Download,
  Eye,
  X,
} from "lucide-react";

export default function KYCBulkActionBar({
  selectedCount,
  onExport,
  onOpenFirst,
  onClear,
}: {
  selectedCount: number;
  onExport: () => void;
  onOpenFirst?: () => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="flex flex-col gap-3 rounded-[20px] border border-indigo-500/20 bg-indigo-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-[9px] font-black text-foreground">
              {selectedCount} review request
              {selectedCount === 1 ? "" : "s"} selected
            </p>

            <p className="mt-1 text-[8px] text-muted-foreground">
              Bulk actions intentionally exclude approve/reject. Final KYC
              decisions should be reviewed per applicant.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {onOpenFirst && (
              <button
                type="button"
                onClick={onOpenFirst}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-[9px] font-black text-indigo-500 transition hover:border-indigo-500/30 hover:bg-indigo-500/5"
              >
                <Eye className="h-3.5 w-3.5" />
                Review Selected
              </button>
            )}

            <button
              type="button"
              onClick={onExport}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-[9px] font-black text-white transition hover:bg-violet-600"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-[9px] font-black text-muted-foreground transition hover:border-rose-500/20 hover:bg-rose-500/5 hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}