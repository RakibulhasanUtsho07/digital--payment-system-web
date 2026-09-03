"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UserManagementPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function UserManagementPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: UserManagementPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Generate a dynamic window of up to 5 visible page numbers around active page
  const pages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.max(1, Math.min(totalPages - 4, page - 2)) + index
  ).filter((value) => value <= totalPages);

  return (
    <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      {/* Page Items Range Summary */}
      <p className="text-xs text-slate-400">
        Showing{" "}
        <strong className="text-slate-700">
          {start}–{end}
        </strong>{" "}
        of <strong className="text-slate-700">{total}</strong>
      </p>

      {/* Controls & Navigation */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Page Size Dropdown Selector */}
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
          Rows
          <select
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value))
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>

        {/* Previous Page Button */}
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Numbered Page Navigation */}
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold transition-colors ${
              item === page
                ? "bg-[#1F5EA8] text-white shadow-md"
                : "border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}

        {/* Next Page Button */}
        <button
          type="button"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
}