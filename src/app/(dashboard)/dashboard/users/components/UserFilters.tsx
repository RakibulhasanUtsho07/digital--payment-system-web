"use client";

import {
  Columns3,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";

import type {
  ColumnVisibility,
  KYCStatus,
  RiskLevel,
  UserFilters as FilterState,
  UserRole,
  UserStatus,
  WalletStatus,
} from "./UserManagementTypes";

interface Props {
  search: string;
  onSearchChange: (
    value: string
  ) => void;
  filters: FilterState;
  setFilter: <
    K extends keyof FilterState
  >(
    key: K,
    value: FilterState[K]
  ) => void;
  clearFilters: () => void;
  columns: ColumnVisibility;
  toggleColumn: (
    key: keyof ColumnVisibility
  ) => void;
  filteredCount: number;
}

export default function UserFilters({
  search,
  onSearchChange,
  filters,
  setFilter,
  clearFilters,
  columns,
  toggleColumn,
  filteredCount,
}: Props) {
  const [
    showAdvanced,
    setShowAdvanced,
  ] = useState(false);

  const [
    showColumns,
    setShowColumns,
  ] = useState(false);

  const activeFilterCount =
    Object.values(
      filters
    ).filter(
      (value) =>
        value !==
        "all"
    ).length;

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={
              search
            }
            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
            placeholder="Search name, email, phone, user ID or wallet ID..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setShowAdvanced(
                (
                  value
                ) => !value
              )
            }
            className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
              showAdvanced
                ? "border-blue-200 bg-blue-50 text-[#1F5EA8]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount >
              0 && (
              <span className="rounded-full bg-[#1F5EA8] px-1.5 py-0.5 text-[9px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setShowColumns(
                (
                  value
                ) => !value
              )
            }
            className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${
              showColumns
                ? "border-blue-200 bg-blue-50 text-[#1F5EA8]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Columns3 className="h-4 w-4" />
            Columns
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SelectFilter
            label="Status"
            value={
              filters.status
            }
            options={[
              ["all", "All"],
              ["active", "Active"],
              [
                "suspended",
                "Suspended",
              ],
              [
                "restricted",
                "Restricted",
              ],
              [
                "pending",
                "Pending",
              ],
            ]}
            onChange={(value) =>
              setFilter(
                "status",
                value as
                  | "all"
                  | UserStatus
              )
            }
          />

          <SelectFilter
            label="KYC"
            value={
              filters.kycStatus
            }
            options={[
              ["all", "All"],
              [
                "verified",
                "Verified",
              ],
              [
                "pending",
                "Pending",
              ],
              [
                "under_review",
                "Under Review",
              ],
              [
                "rejected",
                "Rejected",
              ],
              [
                "not_started",
                "Not Started",
              ],
            ]}
            onChange={(value) =>
              setFilter(
                "kycStatus",
                value as
                  | "all"
                  | KYCStatus
              )
            }
          />

          <SelectFilter
            label="Role"
            value={
              filters.role
            }
            options={[
              ["all", "All"],
              [
                "user",
                "User",
              ],
              [
                "admin",
                "Admin",
              ],
              [
                "support",
                "Support",
              ],
              [
                "analyst",
                "Analyst",
              ],
            ]}
            onChange={(value) =>
              setFilter(
                "role",
                value as
                  | "all"
                  | UserRole
              )
            }
          />

          <SelectFilter
            label="Risk"
            value={
              filters.riskLevel
            }
            options={[
              ["all", "All"],
              ["low", "Low"],
              [
                "medium",
                "Medium",
              ],
              ["high", "High"],
            ]}
            onChange={(value) =>
              setFilter(
                "riskLevel",
                value as
                  | "all"
                  | RiskLevel
              )
            }
          />

          <SelectFilter
            label="Wallet"
            value={
              filters.walletStatus
            }
            options={[
              ["all", "All"],
              [
                "active",
                "Active",
              ],
              [
                "frozen",
                "Frozen",
              ],
              [
                "restricted",
                "Restricted",
              ],
            ]}
            onChange={(value) =>
              setFilter(
                "walletStatus",
                value as
                  | "all"
                  | WalletStatus
              )
            }
          />

          <SelectFilter
            label="Activity"
            value={
              filters.activity
            }
            options={[
              ["all", "All"],
              [
                "today",
                "Today",
              ],
              [
                "week",
                "This Week",
              ],
              [
                "inactive",
                "Inactive",
              ],
            ]}
            onChange={(value) =>
              setFilter(
                "activity",
                value as FilterState["activity"]
              )
            }
          />

          <button
            type="button"
            onClick={
              clearFilters
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <X className="mr-2 inline h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      )}

      {showColumns && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-[#1F5EA8]" />
            <p className="text-xs font-bold text-slate-800">
              Table Columns
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(
              Object.keys(
                columns
              ) as Array<
                keyof ColumnVisibility
              >
            ).map(
              (key) => (
                <button
                  key={
                    key
                  }
                  type="button"
                  onClick={() =>
                    toggleColumn(
                      key
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold capitalize transition ${
                    columns[key]
                      ? "bg-[#1F5EA8] text-white"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {key ===
                  "lastActive"
                    ? "Last Active"
                    : key}
                </button>
              )
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />

          <p className="text-[10px] font-semibold text-slate-500">
            {filteredCount.toLocaleString()} users match the current view
          </p>
        </div>

        {search && (
          <button
            type="button"
            onClick={() =>
              onSearchChange(
                ""
              )
            }
            className="text-[10px] font-bold text-[#1F5EA8]"
          >
            Clear search
          </button>
        )}
      </div>
    </section>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<
    [string, string]
  >;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <select
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {optionLabel}
            </option>
          )
        )}
      </select>
    </label>
  );
}