"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";

import type {
  KYCRequest,
} from "./KYCManagementTypes";

function badge(value: string) {
  switch (value) {
    case "Verified":
    case "Passed":
    case "Low":
      return "bg-emerald-50 text-emerald-700";

    case "Pending":
    case "Under Review":
    case "Needs Review":
    case "Medium":
      return "bg-amber-50 text-amber-700";

    case "High":
      return "bg-orange-50 text-orange-700";

    case "Critical":
    case "Rejected":
    case "Failed":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function KYCQueue({
  requests,
  selectedIds,
  page,
  pageSize,
  total,
  totalPages,
  onToggle,
  onToggleAll,
  onOpen,
  sortField,
  sortDirection,
  onSort,
  onPageChange,
  onPageSizeChange,
}: {
  requests: KYCRequest[];
  selectedIds: Set<string>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onToggle: (id: string) => void;
  onToggleAll: (value: boolean) => void;
  onOpen: (request: KYCRequest) => void;
  sortField:
    | "submittedAt"
    | "riskScore"
    | "applicantName";
  sortDirection: "asc" | "desc";
  onSort: (
    field:
      | "submittedAt"
      | "riskScore"
      | "applicantName"
  ) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const allSelected =
    requests.length > 0 &&
    requests.every((request) =>
      selectedIds.has(request.id)
    );

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Compliance Queue
          </p>

          <h2 className="mt-1 text-lg font-black text-[#0F2745]">
            Review Queue
          </h2>
        </div>

        <select
          value={pageSize}
          onChange={(event) =>
            onPageSizeChange(
              Number(event.target.value)
            )
          }
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600"
        >
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full border-collapse">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="w-12 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) =>
                    onToggleAll(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 accent-[#1F5EA8]"
                  aria-label="Select current page"
                />
              </th>

              <SortHeader
                label="Applicant"
                active={
                  sortField ===
                  "applicantName"
                }
                direction={sortDirection}
                onClick={() =>
                  onSort("applicantName")
                }
              />

              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Case
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Document
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Status
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Verification
              </th>

              <SortHeader
                label="Risk"
                active={
                  sortField ===
                  "riskScore"
                }
                direction={sortDirection}
                onClick={() =>
                  onSort("riskScore")
                }
              />

              <SortHeader
                label="Submitted"
                active={
                  sortField ===
                  "submittedAt"
                }
                direction={sortDirection}
                onClick={() =>
                  onSort("submittedAt")
                }
              />

              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Reviewer
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                SLA
              </th>

              <th className="w-14 px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {requests.map((request, index) => {
              const selected =
                selectedIds.has(
                  request.id
                );

              return (
                <motion.tr
                  key={request.id}
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    delay:
                      index * 0.01,
                  }}
                  className={`transition ${
                    selected
                      ? "bg-blue-50/60"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        onToggle(
                          request.id
                        )
                      }
                      className="h-4 w-4 accent-[#1F5EA8]"
                      aria-label={`Select ${request.caseId}`}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen(
                          request
                        )
                      }
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1F5EA8] to-cyan-400 text-xs font-black text-white">
                        {getInitials(
                          request.applicantName
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[180px] truncate text-xs font-extrabold text-slate-900">
                          {request.applicantName}
                        </p>

                        <p className="max-w-[200px] truncate text-[10px] text-slate-400">
                          {request.email}
                        </p>
                      </div>
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-[10px] font-black text-slate-800">
                      {request.caseId}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-400">
                      {request.applicantId}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-xs font-bold text-slate-800">
                      {request.documentType}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-400">
                      {request.documentNumber}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${badge(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${badge(
                        request.verificationResult
                      )}`}
                    >
                      {request.verificationResult}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${badge(
                        request.riskLevel
                      )}`}
                    >
                      {request.riskLevel}{" "}
                      {request.riskScore}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-[10px] font-semibold text-slate-500">
                    {formatDate(
                      request.submittedAt
                    )}
                  </td>

                  <td className="px-4 py-4 text-[10px] font-semibold text-slate-500">
                    {request.reviewer}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                        request.slaMinutes <= 0
                          ? "bg-rose-50 text-rose-700"
                          : request.slaMinutes <=
                              15
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {formatSLA(
                        request.slaMinutes
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onOpen(
                          request
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-[#1F5EA8]"
                      aria-label={`Open ${request.caseId}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}

            {requests.length ===
              0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-16 text-center"
                >
                  <p className="text-sm font-bold text-slate-800">
                    Queue is clear
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    No KYC requests match the current filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-semibold text-slate-400">
          Showing{" "}
          {total === 0
            ? 0
            : (page - 1) *
                pageSize +
              1}
          –
          {Math.min(
            page *
              pageSize,
            total
          )}{" "}
          of {total}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              onPageChange(1)
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 disabled:opacity-30"
          >
            First
          </button>

          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              onPageChange(
                Math.max(
                  1,
                  page - 1
                )
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="rounded-lg bg-[#1F5EA8] px-3 py-2 text-[10px] font-bold text-white">
            {page}
          </span>

          <button
            type="button"
            disabled={
              page >=
              totalPages
            }
            onClick={() =>
              onPageChange(
                Math.min(
                  totalPages,
                  page + 1
                )
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={
              page >=
              totalPages
            }
            onClick={() =>
              onPageChange(
                totalPages
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 disabled:opacity-30"
          >
            Last
          </button>
        </div>
      </div>
    </section>
  );
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-700"
      >
        {label}

        {active &&
          (direction ===
          "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    </th>
  );
}

function getInitials(
  value: string
) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .toUpperCase();
}

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    "en-BD",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

function formatSLA(
  minutes: number
) {
  if (minutes <= 0) {
    return "Overdue";
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;

  return hours > 0
    ? `${hours}h ${remaining}m`
    : `${remaining}m`;
}