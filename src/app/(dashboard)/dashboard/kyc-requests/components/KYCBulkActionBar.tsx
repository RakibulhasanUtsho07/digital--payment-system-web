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
          className="flex flex-col gap-3 rounded-[20px] border border-blue-100 bg-[linear-gradient(135deg,#EFF7FF,#FFFFFF)] p-4 shadow-[0_10px_30px_rgba(31,94,168,0.08)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-[9px] font-black text-[#174A7A]">
              {selectedCount} review request{selectedCount === 1 ? "" : "s"} selected
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              Bulk actions intentionally exclude approve/reject. Final KYC decisions should be reviewed per applicant.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {onOpenFirst && (
              <button
                type="button"
                onClick={onOpenFirst}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-[9px] font-black text-blue-700"
              >
                <Eye className="h-3.5 w-3.5" />
                Review Selected
              </button>
            )}

            <button
              type="button"
              onClick={onExport}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1F5EA8] px-3 text-[9px] font-black text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black text-slate-500"
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
