"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Check,
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  DocumentType,
  KYCStatus,
  RiskLevel,
} from "./KYCManagementTypes";

export interface KYCFiltersState {
  status:
    | "All"
    | KYCStatus;

  documentType:
    | "All"
    | DocumentType;

  risk:
    | "All"
    | RiskLevel;

  verification:
    | "All"
    | "Passed"
    | "Failed"
    | "Needs Review";

  reviewer:
    | "All"
    | "Unassigned"
    | "Me";

  sla:
    | "All"
    | "Normal"
    | "Due Soon"
    | "Overdue";
}

const defaults:
  KYCFiltersState = {
  status:
    "All",
  documentType:
    "All",
  risk:
    "All",
  verification:
    "All",
  reviewer:
    "All",
  sla:
    "All",
};

export default function KYCFilters({
  search,
  setSearch,
  filters,
  setFilters,
  total,
}: {
  search:
    string;

  setSearch:
    (
      value:
        string
    ) => void;

  filters:
    KYCFiltersState;

  setFilters:
    (
      value:
        KYCFiltersState
    ) => void;

  total:
    number;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const activeCount =
    Object.values(
      filters
    ).filter(
      (
        value
      ) =>
        value !==
        "All"
    ).length;

  const clear =
    () => {
      setFilters(
        defaults
      );

      setSearch(
        ""
      );
    };

  return (
    <motion.section
      initial={{
        opacity:
          0,
        y:
          10,
      }}
      animate={{
        opacity:
          1,
        y:
          0,
      }}
      className="relative z-30 overflow-visible rounded-[26px] border border-[#DCE7F0] bg-white p-4 shadow-[0_10px_32px_rgba(15,39,69,0.045)] sm:p-5"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search applicant, case ID, email, phone or document number..."
            className="h-12 w-full rounded-2xl border border-[#DCE7F0] bg-[#F8FBFD] pl-11 pr-4 text-xs font-semibold text-[#0F2745] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100/60"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            setOpen(
              (
                value
              ) =>
                !value
            )
          }
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-[10px] font-black transition ${
            open ||
            activeCount >
              0
              ? "border-blue-200 bg-blue-50 text-[#1F5EA8]"
              : "border-[#DCE7F0] bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50/50"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters

          {activeCount >
            0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1F5EA8] px-1.5 text-[8px] text-white">
              {
                activeCount
              }
            </span>
          )}
        </button>
      </div>

      <AnimatePresence
        initial={
          false
        }
      >
        {open && (
          <motion.div
            initial={{
              opacity:
                0,
              height:
                0,
            }}
            animate={{
              opacity:
                1,
              height:
                "auto",
            }}
            exit={{
              opacity:
                0,
              height:
                0,
            }}
            transition={{
              duration:
                0.22,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="overflow-visible"
          >
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <PremiumDropdown
                label="Status"
                value={
                  filters.status
                }
                options={[
                  "All",
                  "Pending",
                  "Under Review",
                ]}
                onChange={(
                  value
                ) =>
                  setFilters({
                    ...filters,
                    status:
                      value as
                        KYCFiltersState["status"],
                  })
                }
              />

              <PremiumDropdown
                label="Document"
                value={
                  filters.documentType
                }
                options={[
                  "All",
                  "NID",
                  "Passport",
                  "Driving License",
                ]}
                onChange={(
                  value
                ) =>
                  setFilters({
                    ...filters,
                    documentType:
                      value as
                        KYCFiltersState["documentType"],
                  })
                }
              />

              <PremiumDropdown
                label="Risk"
                value={
                  filters.risk
                }
                options={[
                  "All",
                  "Unknown",
                  "Low",
                  "Medium",
                  "High",
                  "Critical",
                ]}
                onChange={(
                  value
                ) =>
                  setFilters({
                    ...filters,
                    risk:
                      value as
                        KYCFiltersState["risk"],
                  })
                }
              />

              <PremiumDropdown
                label="Verification"
                value={
                  filters.verification
                }
                options={[
                  "All",
                  "Passed",
                  "Failed",
                  "Needs Review",
                ]}
                onChange={(
                  value
                ) =>
                  setFilters({
                    ...filters,
                    verification:
                      value as
                        KYCFiltersState["verification"],
                  })
                }
              />

              <PremiumDropdown
                label="Reviewer"
                value={
                  filters.reviewer
                }
                options={[
                  "All",
                  "Unassigned",
                  "Me",
                ]}
                onChange={(
                  value
                ) =>
                  setFilters({
                    ...filters,
                    reviewer:
                      value as
                        KYCFiltersState["reviewer"],
                  })
                }
              />

              <PremiumDropdown
                label="SLA"
                value={
                  filters.sla
                }
                options={[
                  "All",
                  "Normal",
                  "Due Soon",
                  "Overdue",
                ]}
                onChange={(
                  value
                ) =>
                  setFilters({
                    ...filters,
                    sla:
                      value as
                        KYCFiltersState["sla"],
                  })
                }
              />
            </div>

            {activeCount >
              0 && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={
                    clear
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[9px] font-black text-slate-500 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-[9px] font-semibold text-slate-400">
          {
            total
          } matching review request
          {
            total ===
            1
              ? ""
              : "s"
          }
        </p>

        {search && (
          <button
            type="button"
            onClick={() =>
              setSearch(
                ""
              )
            }
            className="text-[9px] font-black text-[#1F5EA8]"
          >
            Clear search
          </button>
        )}
      </div>
    </motion.section>
  );
}

function PremiumDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label:
    string;
  value:
    string;
  options:
    string[];
  onChange:
    (
      value:
        string
    ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  return (
    <div
      className={`relative ${
        open
          ? "z-[80]"
          : "z-10"
      }`}
    >
      <p className="mb-1.5 text-[8px] font-black uppercase tracking-[0.11em] text-slate-400">
        {
          label
        }
      </p>

      <button
        type="button"
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left transition ${
          open
            ? "border-blue-300 ring-4 ring-blue-100/50"
            : "border-[#DCE7F0] hover:border-blue-200"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            value ===
            "All"
              ? "bg-blue-500"
              : "bg-slate-400"
          }`}
        />

        <span className="min-w-0 flex-1 truncate text-[10px] font-black text-[#174A7A]">
          {
            value
          }
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
            open
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[70] cursor-default"
              onClick={() =>
                setOpen(
                  false
                )
              }
              aria-label={`Close ${label} options`}
            />

            <motion.div
              initial={{
                opacity:
                  0,
                y:
                  -6,
                scale:
                  0.985,
              }}
              animate={{
                opacity:
                  1,
                y:
                  0,
                scale:
                  1,
              }}
              exit={{
                opacity:
                  0,
                y:
                  -4,
                scale:
                  0.99,
              }}
              transition={{
                duration:
                  0.15,
              }}
              className="absolute left-0 top-[calc(100%+6px)] z-[90] w-full min-w-[170px] overflow-hidden rounded-[15px] border border-[#D8E4EE] bg-white p-1.5 shadow-[0_20px_50px_rgba(15,39,69,0.15)]"
            >
              {options.map(
                (
                  option
                ) => {
                  const active =
                    option ===
                    value;

                  return (
                    <button
                      type="button"
                      key={
                        option
                      }
                      onClick={() => {
                        onChange(
                          option
                        );

                        setOpen(
                          false
                        );
                      }}
                      className={`flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[9px] font-black transition ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {
                          option
                        }
                      </span>

                      {active && (
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </button>
                  );
                }
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export {
  defaults as
    DEFAULT_KYC_FILTERS,
};
