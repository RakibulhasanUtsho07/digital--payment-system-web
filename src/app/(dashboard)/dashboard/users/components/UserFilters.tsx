"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Columns3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type {
  ColumnKey,
  ColumnVisibility,
  UserFilterKey,
  UserFilters as FilterState,
} from "./UserManagementTypes";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  setFilter: <K extends UserFilterKey>(
    key: K,
    value: FilterState[K]
  ) => void;
  clearFilters: () => void;
  columns: ColumnVisibility;
  toggleColumn: (key: ColumnKey) => void;
  filteredCount: number;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
}

const FILTER_DEFINITIONS = [
  {
    key: "status",
    label: "Status",
    options: [
      ["all", "All"],
      ["active", "Active"],
      ["suspended", "Suspended"],
      ["restricted", "Restricted"],
      ["pending", "Pending"],
    ],
  },
  {
    key: "kycStatus",
    label: "KYC",
    options: [
      ["all", "All"],
      ["verified", "Verified"],
      ["pending", "Pending"],
      ["under_review", "Under review"],
      ["rejected", "Rejected"],
      ["not_started", "Not started"],
    ],
  },
  {
    key: "role",
    label: "Role",
    options: [
      ["all", "All"],
      ["user", "User"],
      ["admin", "Admin"],
      ["support", "Support"],
      ["analyst", "Analyst"],
    ],
  },
  {
    key: "riskLevel",
    label: "Risk",
    options: [
      ["all", "All"],
      ["low", "Low"],
      ["medium", "Medium"],
      ["high", "High"],
    ],
  },
  {
    key: "walletStatus",
    label: "Wallet",
    options: [
      ["all", "All"],
      ["active", "Active"],
      ["frozen", "Frozen"],
      ["restricted", "Restricted"],
      ["closed", "Closed"],
    ],
  },
  {
    key: "activity",
    label: "Activity",
    options: [
      ["all", "All"],
      ["today", "Today"],
      ["week", "This week"],
      ["inactive", "Inactive 30+ days"],
    ],
  },
] as const;

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { key: "phone", label: "Phone" },
  { key: "role", label: "Role" },
  { key: "kyc", label: "KYC" },
  { key: "wallet", label: "Wallet" },
  { key: "risk", label: "Risk" },
  { key: "lastActive", label: "Last active" },
  { key: "joined", label: "Joined" },
];

export default function UserFilters({
  search,
  onSearchChange,
  filters,
  setFilter,
  clearFilters,
  columns,
  toggleColumn,
  filteredCount,
}: UserFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showColumns, setShowColumns] = useState(false);

  const activeCount =
    Object.values(filters).filter((value) => value !== "all").length +
    (search ? 1 : 0);

  return (
    <section className="relative rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {/* Top Search & Actions Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search Input */}
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, email, phone or user ID..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-xs font-extrabold transition ${
              showAdvanced
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] text-white">
                {activeCount}
              </span>
            )}
          </button>

          {/* Column Visibility Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumns((value) => !value)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50"
            >
              <Columns3 className="h-4 w-4" />
              Columns
            </button>

            <AnimatePresence>
              {showColumns && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-14 z-30 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                >
                  {COLUMN_DEFINITIONS.map((column) => (
                    <button
                      key={column.key}
                      type="button"
                      onClick={() => toggleColumn(column.key)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <span>{column.label}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          columns[column.key]
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200"
                        }`}
                      >
                        {columns[column.key] && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reset Filters */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Grid Section */}
      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-visible"
          >
            <div className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {FILTER_DEFINITIONS.map((filter) => (
                <FilterDropdown
                  key={filter.key}
                  label={filter.label}
                  value={filters[filter.key]}
                  options={filter.options}
                  onChange={(value) =>
                    setFilter(filter.key, value as never)
                  }
                />
              ))}
            </div>

            {/* Match Counter Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] text-slate-400">
              <span>
                {filteredCount} matching user
                {filteredCount === 1 ? "" : "s"}
              </span>
              <span>Filters update the table instantly</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Custom Select / Dropdown Component
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected =
    options.find(([optionValue]) => optionValue === value)?.[1] ?? "All";

  return (
    <div className="relative min-w-0">
      <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-xs font-semibold transition ${
          open
            ? "border-blue-400 ring-4 ring-blue-50"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className="truncate text-slate-700">{selected}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="absolute left-0 right-0 top-[68px] z-40 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,.15)]"
          >
            {options.map(([optionValue, optionLabel]) => (
              <button
                key={optionValue}
                type="button"
                onClick={() => {
                  onChange(optionValue);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  optionValue === value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{optionLabel}</span>
                {optionValue === value && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}