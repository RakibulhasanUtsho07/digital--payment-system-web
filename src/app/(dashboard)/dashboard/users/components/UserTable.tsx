"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  WalletCards,
  ShieldCheck,
  UserRound,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

import type {
  ColumnVisibility,
  SortField,
  SortState,
  UserRecord,
} from "./UserManagementTypes";

function statusClass(
  status: string
) {
  switch (
    status
  ) {
    case "active":
    case "verified":
      return "bg-emerald-50 text-emerald-700";

    case "pending":
    case "under_review":
      return "bg-amber-50 text-amber-700";

    case "restricted":
    case "medium":
      return "bg-orange-50 text-orange-700";

    case "suspended":
    case "rejected":
    case "high":
    case "frozen":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function UserTable({
  users,
  columns,
  selectedIds,
  sort,
  page,
  pageSize,
  totalFiltered,
  totalPages,
  onToggle,
  onToggleAll,
  onOpenUser,
  onSort,
  onPageChange,
  onPageSizeChange,
}: {
  users: UserRecord[];
  columns: ColumnVisibility;
  selectedIds: Set<string>;
  sort: SortState;
  page: number;
  pageSize: number;
  totalFiltered: number;
  totalPages: number;
  onToggle: (
    id: string
  ) => void;
  onToggleAll: (
    checked: boolean
  ) => void;
  onOpenUser: (
    user: UserRecord
  ) => void;
  onSort: (
    field: SortField
  ) => void;
  onPageChange: (
    page: number
  ) => void;
  onPageSizeChange: (
    size: number
  ) => void;
}) {
  const allSelected =
    users.length > 0 &&
    users.every(
      (user) =>
        selectedIds.has(
          user.id
        )
    );

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Directory
          </p>

          <h2 className="mt-1 text-lg font-black text-[#0F2745]">
            All Users
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
            {totalFiltered.toLocaleString()} results
          </span>

          <select
            value={
              pageSize
            }
            onChange={(event) =>
              onPageSizeChange(
                Number(
                  event.target.value
                )
              )
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none"
          >
            <option value="25">
              25 / page
            </option>
            <option value="50">
              50 / page
            </option>
            <option value="100">
              100 / page
            </option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="w-12 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={
                    allSelected
                  }
                  onChange={(event) =>
                    onToggleAll(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4 accent-[#1F5EA8]"
                  aria-label="Select all users on current page"
                />
              </th>

              <SortableHeader
                label="User"
                field="name"
                sort={
                  sort
                }
                onSort={
                  onSort
                }
              />

              {columns.phone && (
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Phone
                </th>
              )}

              {columns.role && (
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Role
                </th>
              )}

              {columns.kyc && (
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  KYC
                </th>
              )}

              {columns.wallet && (
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Wallet
                </th>
              )}

              {columns.risk && (
                <SortableHeader
                  label="Risk"
                  field="riskScore"
                  sort={
                    sort
                  }
                  onSort={
                    onSort
                  }
                />
              )}

              {columns.lastActive && (
                <SortableHeader
                  label="Last Active"
                  field="lastActive"
                  sort={
                    sort
                  }
                  onSort={
                    onSort
                  }
                />
              )}

              {columns.joined && (
                <SortableHeader
                  label="Joined"
                  field="joinedAt"
                  sort={
                    sort
                  }
                  onSort={
                    onSort
                  }
                />
              )}

              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map(
              (
                user,
                index
              ) => {
                const selected =
                  selectedIds.has(
                    user.id
                  );

                return (
                  <motion.tr
                    key={
                      user.id
                    }
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay:
                        index *
                        0.01,
                    }}
                    className={`group transition ${
                      selected
                        ? "bg-blue-50/60"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selected
                        }
                        onChange={() =>
                          onToggle(
                            user.id
                          )
                        }
                        className="h-4 w-4 accent-[#1F5EA8]"
                        aria-label={`Select ${user.name}`}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenUser(
                            user
                          )
                        }
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1F5EA8] to-cyan-400 text-xs font-black text-white shadow-sm">
                          {getInitials(
                            user.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate text-xs font-extrabold text-slate-900">
                            {user.name}
                          </p>

                          <p className="max-w-[210px] truncate text-[10px] text-slate-400">
                            {user.email}
                          </p>

                          <p className="mt-0.5 text-[9px] font-semibold text-slate-300">
                            ID:{" "}
                            {user.id}
                          </p>
                        </div>
                      </button>
                    </td>

                    {columns.phone && (
                      <td className="px-4 py-4 text-[10px] font-semibold text-slate-500">
                        {user.phone}
                      </td>
                    )}

                    {columns.role && (
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold capitalize text-blue-700">
                          {user.role}
                        </span>
                      </td>
                    )}

                    {columns.kyc && (
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${statusClass(
                            user.kycStatus
                          )}`}
                        >
                          {formatStatus(
                            user.kycStatus
                          )}
                        </span>
                      </td>
                    )}

                    {columns.wallet && (
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${statusClass(
                            user.walletStatus
                          )}`}
                        >
                          <WalletCards className="h-3 w-3" />
                          {user.walletStatus}
                        </span>
                      </td>
                    )}

                    {columns.risk && (
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${statusClass(
                            user.riskLevel
                          )}`}
                        >
                          {user.riskLevel}
                        </span>
                      </td>
                    )}

                    {columns.lastActive && (
                      <td className="px-4 py-4 text-[10px] font-semibold text-slate-500">
                        {user.lastActive}
                      </td>
                    )}

                    {columns.joined && (
                      <td className="px-4 py-4 text-[10px] font-semibold text-slate-500">
                        {formatDate(
                          user.joinedAt
                        )}
                      </td>
                    )}

                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenUser(
                            user
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white hover:text-[#1F5EA8] hover:shadow-sm"
                        aria-label={`Open ${user.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              }
            )}

            {users.length ===
              0 && (
              <tr>
                <td
                  colSpan={20}
                  className="px-6 py-16 text-center"
                >
                  <div className="mx-auto max-w-sm">
                    <UserRound className="mx-auto h-8 w-8 text-slate-300" />

                    <p className="mt-3 text-sm font-bold text-slate-800">
                      No users found
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Adjust your search or filters to see more users.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] font-semibold text-slate-400">
          Showing{" "}
          {users.length ===
          0
            ? 0
            : (page -
                1) *
                pageSize +
              1}
          –
          {(page -
            1) *
              pageSize +
            users.length}{" "}
          of{" "}
          {totalFiltered.toLocaleString()}
        </p>

        <div className="flex items-center gap-1">
          <PageButton
            label="First"
            disabled={
              page ===
              1
            }
            onClick={() =>
              onPageChange(
                1
              )
            }
          />

          <PageButton
            icon={
              ChevronLeft
            }
            disabled={
              page ===
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
          />

          {getPageNumbers(
            page,
            totalPages
          ).map(
            (
              pageNumber
            ) => (
              <button
                key={
                  pageNumber
                }
                type="button"
                onClick={() =>
                  onPageChange(
                    pageNumber
                  )
                }
                className={`h-9 min-w-9 rounded-lg px-2 text-[10px] font-bold ${
                  pageNumber ===
                  page
                    ? "bg-[#1F5EA8] text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {pageNumber}
              </button>
            )
          )}

          <PageButton
            icon={
              ChevronRight
            }
            disabled={
              page ===
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
          />

          <PageButton
            label="Last"
            disabled={
              page ===
              totalPages
            }
            onClick={() =>
              onPageChange(
                totalPages
              )
            }
          />
        </div>
      </div>
    </section>
  );
}

function SortableHeader({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortState;
  onSort: (
    field: SortField
  ) => void;
}) {
  const active =
    sort.field ===
    field;

  return (
    <th className="px-4 py-3 text-left">
      <button
        type="button"
        onClick={() =>
          onSort(
            field
          )
        }
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-slate-700"
      >
        {label}

        {active ? (
          sort.direction ===
          "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label?: string;
  icon?: React.ElementType;
  disabled: boolean;
  onClick: () => void;
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
      className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-500 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {Icon && (
        <Icon className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}

function getPageNumbers(
  current: number,
  total: number
) {
  if (total <= 5) {
    return Array.from(
      {
        length: total,
      },
      (_, index) =>
        index + 1
    );
  }

  if (current <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (current >= total - 2) {
    return [
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ];
  }

  return [
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2,
  ];
}

function getInitials(
  name: string
) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0)
    )
    .join("")
    .toUpperCase();
}

function formatStatus(
  value: string
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
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
      year: "numeric",
    }
  );
}