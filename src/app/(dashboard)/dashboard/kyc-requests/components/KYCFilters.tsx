"use client";

import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";

import type {
  DocumentType,
  KYCStatus,
  RiskLevel,
} from "./KYCManagementTypes";

export interface KYCFiltersState {
  status: "All" | KYCStatus;
  documentType: "All" | DocumentType;
  risk: "All" | RiskLevel;
  verification:
    | "All"
    | "Passed"
    | "Failed"
    | "Needs Review";
  reviewer: "All" | "Unassigned" | "Me";
  sla: "All" | "Normal" | "Due Soon" | "Overdue";
}

const defaults: KYCFiltersState = {
  status: "All",
  documentType: "All",
  risk: "All",
  verification: "All",
  reviewer: "All",
  sla: "All",
};

export default function KYCFilters({
  search,
  setSearch,
  filters,
  setFilters,
  total,
}: {
  search: string;
  setSearch: (value: string) => void;
  filters: KYCFiltersState;
  setFilters: (
    value: KYCFiltersState
  ) => void;
  total: number;
}) {
  const [open, setOpen] = useState(false);

  const activeCount = Object.values(
    filters
  ).filter(
    (value) => value !== "All"
  ).length;

  const clear = () => {
    setFilters(defaults);
    setSearch("");
  };

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search applicant, case ID, email, phone or document number..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold ${
            open
              ? "border-blue-200 bg-blue-50 text-[#1F5EA8]"
              : "border-slate-200 text-slate-700"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters

          {activeCount > 0 && (
            <span className="rounded-full bg-[#1F5EA8] px-1.5 py-0.5 text-[9px] text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Select
            label="Status"
            value={filters.status}
            options={[
              "All",
              "Pending",
              "Under Review",
              "Verified",
              "Rejected",
              "Needs Information",
            ]}
            onChange={(value) =>
              setFilters({
                ...filters,
                status: value as KYCFiltersState["status"],
              })
            }
          />

          <Select
            label="Document"
            value={filters.documentType}
            options={[
              "All",
              "NID",
              "Passport",
              "Driving License",
            ]}
            onChange={(value) =>
              setFilters({
                ...filters,
                documentType:
                  value as KYCFiltersState["documentType"],
              })
            }
          />

          <Select
            label="Risk"
            value={filters.risk}
            options={[
              "All",
              "Low",
              "Medium",
              "High",
              "Critical",
            ]}
            onChange={(value) =>
              setFilters({
                ...filters,
                risk:
                  value as KYCFiltersState["risk"],
              })
            }
          />

          <Select
            label="Verification"
            value={filters.verification}
            options={[
              "All",
              "Passed",
              "Failed",
              "Needs Review",
            ]}
            onChange={(value) =>
              setFilters({
                ...filters,
                verification:
                  value as KYCFiltersState["verification"],
              })
            }
          />

          <Select
            label="Reviewer"
            value={filters.reviewer}
            options={[
              "All",
              "Unassigned",
              "Me",
            ]}
            onChange={(value) =>
              setFilters({
                ...filters,
                reviewer:
                  value as KYCFiltersState["reviewer"],
              })
            }
          />

          <Select
            label="SLA"
            value={filters.sla}
            options={[
              "All",
              "Normal",
              "Due Soon",
              "Overdue",
            ]}
            onChange={(value) =>
              setFilters({
                ...filters,
                sla:
                  value as KYCFiltersState["sla"],
              })
            }
          />

          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600"
          >
            <X className="mr-1 inline h-3.5 w-3.5" />
            Clear All
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-[10px] font-semibold text-slate-400">
          {total} matching review request
          {total === 1 ? "" : "s"}
        </p>

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-[10px] font-bold text-[#1F5EA8]"
          >
            Clear search
          </button>
        )}
      </div>
    </section>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export { defaults as DEFAULT_KYC_FILTERS };