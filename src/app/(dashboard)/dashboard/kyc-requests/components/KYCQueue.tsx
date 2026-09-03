"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldAlert,
} from "lucide-react";

import {
  useState,
  type ReactNode,
} from "react";

import type {
  KYCRequest,
} from "./KYCManagementTypes";

function badge(
  value:
    string
) {
  switch (
    value
  ) {
    case "Verified":
    case "Passed":
    case "Low":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "Pending":
    case "Under Review":
    case "Needs Review":
    case "Medium":
      return "border-amber-100 bg-amber-50 text-amber-700";

    case "High":
      return "border-orange-100 bg-orange-50 text-orange-700";

    case "Critical":
    case "Rejected":
    case "Failed":
      return "border-rose-100 bg-rose-50 text-rose-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
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
  requests:
    KYCRequest[];

  selectedIds:
    Set<string>;

  page:
    number;

  pageSize:
    number;

  total:
    number;

  totalPages:
    number;

  onToggle:
    (
      id:
        string
    ) => void;

  onToggleAll:
    (
      value:
        boolean
    ) => void;

  onOpen:
    (
      request:
        KYCRequest
    ) => void;

  sortField:
    | "submittedAt"
    | "riskScore"
    | "applicantName";

  sortDirection:
    | "asc"
    | "desc";

  onSort:
    (
      field:
        | "submittedAt"
        | "riskScore"
        | "applicantName"
    ) => void;

  onPageChange:
    (
      page:
        number
    ) => void;

  onPageSizeChange:
    (
      size:
        number
    ) => void;
}) {
  const allSelected =
    requests.length >
      0 &&
    requests.every(
      (
        request
      ) =>
        selectedIds.has(
          request.id
        )
    );

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
      className="overflow-hidden rounded-[26px] border border-[#DCE7F0] bg-white shadow-[0_12px_38px_rgba(15,39,69,0.05)]"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#5B8BB7]">
            Compliance Queue
          </p>

          <h2 className="mt-1 text-lg font-black text-[#0F2745]">
            Review Queue
          </h2>

          <p className="mt-1 text-[9px] text-slate-400">
            Click any row to open the complete manual review workspace.
          </p>
        </div>

        <PageSizeDropdown
          value={
            pageSize
          }
          onChange={
            onPageSizeChange
          }
        />
      </div>

      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[1040px] border-collapse">
          <thead className="bg-[#F8FBFD]">
            <tr>
              <th className="w-12 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={
                    allSelected
                  }
                  onChange={(
                    event
                  ) =>
                    onToggleAll(
                      event.target
                        .checked
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
                direction={
                  sortDirection
                }
                onClick={() =>
                  onSort(
                    "applicantName"
                  )
                }
              />

              <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
                Case
              </th>

              <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
                Document
              </th>

              <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
                Status
              </th>

              <SortHeader
                label="Risk"
                active={
                  sortField ===
                  "riskScore"
                }
                direction={
                  sortDirection
                }
                onClick={() =>
                  onSort(
                    "riskScore"
                  )
                }
              />

              <SortHeader
                label="Submitted"
                active={
                  sortField ===
                  "submittedAt"
                }
                direction={
                  sortDirection
                }
                onClick={() =>
                  onSort(
                    "submittedAt"
                  )
                }
              />

              <th className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
                SLA
              </th>

              <th className="w-14 px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {requests.map(
              (
                request,
                index
              ) => {
                const selected =
                  selectedIds.has(
                    request.id
                  );

                return (
                  <motion.tr
                    key={
                      request.id
                    }
                    initial={{
                      opacity:
                        0,
                      y:
                        4,
                    }}
                    animate={{
                      opacity:
                        1,
                      y:
                        0,
                    }}
                    transition={{
                      duration:
                        0.28,
                      delay:
                        index *
                        0.02,
                    }}
                    tabIndex={
                      0
                    }
                    role="button"
                    onClick={() =>
                      onOpen(
                        request
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        event.preventDefault();

                        onOpen(
                          request
                        );
                      }
                    }}
                    className={`group cursor-pointer outline-none transition ${
                      selected
                        ? "bg-blue-50/60"
                        : "hover:bg-blue-50/30 focus-visible:bg-blue-50/50"
                    }`}
                  >
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(
                        event
                      ) =>
                        event.stopPropagation()
                      }
                    >
                      <input
                        type="checkbox"
                        checked={
                          selected
                        }
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
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#1F5EA8,#22B8D5)] text-[10px] font-black text-white shadow-sm">
                          {
                            getInitials(
                              request.applicantName
                            )
                          }
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate text-[10px] font-black text-[#0F2745]">
                            {
                              request.applicantName
                            }
                          </p>

                          <p className="mt-0.5 max-w-[190px] truncate text-[8px] text-slate-400">
                            {
                              request.email
                            }
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-[9px] font-black text-slate-700">
                        {
                          request.caseId
                        }
                      </p>

                      <p className="mt-1 max-w-[130px] truncate text-[8px] text-slate-400">
                        {
                          request.applicantId
                        }
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FileText className="h-3.5 w-3.5" />
                        </span>

                        <div>
                          <p className="text-[9px] font-black text-slate-700">
                            {
                              request.documentType
                            }
                          </p>

                          <p className="mt-0.5 text-[8px] text-slate-400">
                            {
                              request.documentNumber
                            }
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1.5 text-[8px] font-black ${badge(
                          request.status
                        )}`}
                      >
                        {
                          request.status
                        }
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[8px] font-black ${badge(
                          request.riskLevel
                        )}`}
                      >
                        <ShieldAlert className="h-3 w-3" />

                        {
                          request.riskLevel
                        }

                        {request.riskScore >
                          0 && (
                          <>
                            {" "}
                            {
                              request.riskScore
                            }
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-[9px] font-semibold text-slate-500">
                      {
                        formatDate(
                          request.submittedAt
                        )
                      }
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1.5 text-[8px] font-black ${
                          request.slaMinutes <=
                          0
                            ? "border-rose-100 bg-rose-50 text-rose-700"
                            : request.slaMinutes <=
                                15
                              ? "border-amber-100 bg-amber-50 text-amber-700"
                              : "border-emerald-100 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {
                          formatSLA(
                            request.slaMinutes
                          )
                        }
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-[#1F5EA8]">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </motion.tr>
                );
              }
            )}

            {requests.length ===
              0 && (
              <tr>
                <td
                  colSpan={
                    9
                  }
                  className="px-6 py-16 text-center"
                >
                  <p className="text-sm font-black text-slate-800">
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
        <p className="text-[9px] font-semibold text-slate-400">
          Showing{" "}
          {total ===
          0
            ? 0
            : (
                page -
                1
              ) *
                pageSize +
              1}
          {" – "}
          {Math.min(
            page *
              pageSize,
            total
          )}{" "}
          of{" "}
          {
            total
          }
        </p>

        <div className="flex items-center gap-1.5">
          <PaginationButton
            disabled={
              page <=
              1
            }
            onClick={() =>
              onPageChange(
                1
              )
            }
          >
            First
          </PaginationButton>

          <PaginationSquare
            disabled={
              page <=
              1
            }
            onClick={() =>
              onPageChange(
                Math.max(
                  1,
                  page -
                    1
                )
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationSquare>

          <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#1F5EA8] px-3 text-[9px] font-black text-white shadow-sm">
            {
              page
            }
          </span>

          <PaginationSquare
            disabled={
              page >=
              totalPages
            }
            onClick={() =>
              onPageChange(
                Math.min(
                  totalPages,
                  page +
                    1
                )
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationSquare>

          <PaginationButton
            disabled={
              page >=
              totalPages
            }
            onClick={() =>
              onPageChange(
                totalPages
              )
            }
          >
            Last
          </PaginationButton>
        </div>
      </div>
    </motion.section>
  );
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label:
    string;

  active:
    boolean;

  direction:
    | "asc"
    | "desc";

  onClick:
    () => void;
}) {
  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={(
          event
        ) => {
          event.stopPropagation();

          onClick();
        }}
        className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.1em] text-slate-400 transition hover:text-slate-700"
      >
        {
          label
        }

        {active &&
          (
            direction ===
            "asc"
              ? (
                <ArrowUp className="h-3 w-3" />
              )
              : (
                <ArrowDown className="h-3 w-3" />
              )
          )}
      </button>
    </th>
  );
}

function PageSizeDropdown({
  value,
  onChange,
}: {
  value:
    number;

  onChange:
    (
      value:
        number
    ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const options =
    [
      25,
      50,
      100,
    ];

  return (
    <div className="relative z-40">
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
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DCE7F0] bg-white px-3 text-[9px] font-black text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/40"
      >
        {
          value
        } / page

        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
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
              className="fixed inset-0 z-40 cursor-default"
              onClick={() =>
                setOpen(
                  false
                )
              }
              aria-label="Close page size menu"
            />

            <motion.div
              initial={{
                opacity:
                  0,
                y:
                  -5,
              }}
              animate={{
                opacity:
                  1,
                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
                y:
                  -4,
              }}
              className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[135px] rounded-[14px] border border-[#DCE7F0] bg-white p-1.5 shadow-[0_18px_45px_rgba(15,39,69,0.14)]"
            >
              {options.map(
                (
                  option
                ) => (
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
                    className={`flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-[9px] font-black transition ${
                      option ===
                      value
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {
                      option
                    } / page

                    {option ===
                      value && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                )
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaginationButton({
  disabled,
  onClick,
  children,
}: {
  disabled:
    boolean;

  onClick:
    () => void;

  children:
    ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {
        children
      }
    </button>
  );
}

function PaginationSquare({
  disabled,
  onClick,
  children,
}: {
  disabled:
    boolean;

  onClick:
    () => void;

  children:
    ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {
        children
      }
    </button>
  );
}

function getInitials(
  value:
    string
) {
  const parts =
    value
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );

  return parts
    .slice(
      0,
      2
    )
    .map(
      (
        part
      ) =>
        part[
          0
        ]?.toUpperCase() ??
        ""
    )
    .join(
      ""
    ) ||
    "KY";
}

function formatDate(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}

function formatSLA(
  minutes:
    number
) {
  if (
    minutes <=
    0
  ) {
    return "Overdue";
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  const remaining =
    minutes %
    60;

  return hours >
    0
    ? `${hours}h ${remaining}m`
    : `${remaining}m`;
}
