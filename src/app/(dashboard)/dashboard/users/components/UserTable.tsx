"use client";

import React from "react";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import type {
  ColumnVisibility,
  SortField,
  SortState,
  UserRecord,
} from "./UserManagementTypes";

import UserEmptyState from "./UserEmptyState";
import UserManagementPagination from "./UserManagementPagination";
import UserTableRow, {
  Badge,
} from "./UserTableRow";

/* =========================================================
   TYPES
========================================================= */

interface UserTableProps {
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

  onEditUser: (
    user: UserRecord
  ) => void;

  onSuspendUser: (
    user: UserRecord
  ) => void;

  onDeleteUser: (
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

  onClearFilters?: () => void;
}

/* =========================================================
   COMPONENT
========================================================= */

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
  onEditUser,
  onSuspendUser,
  onDeleteUser,
  onSort,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}: UserTableProps) {
  const allSelected =
    users.length >
      0 &&
    users.every(
      (
        user
      ) =>
        selectedIds.has(
          user.id
        )
    );

  const selectedCount =
    users.filter(
      (
        user
      ) =>
        selectedIds.has(
          user.id
        )
    ).length;

  return (
    <section
      className="
        relative
        overflow-visible
        rounded-[26px]
        border
        border-border
        bg-card
        shadow-sm
        transition-colors
        duration-300
      "
    >
      {/* ===================================================
          TABLE HEADER
      ==================================================== */}

      <header
        className="
          flex
          flex-col
          gap-4
          border-b
          border-border
          px-4
          py-4
          sm:px-5
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <motion.span
                whileHover={{
                  scale: 1.05,
                }}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                "
                style={{
                  background:
                    "var(--dashboard-primary-soft)",
                  color:
                    "var(--dashboard-primary)",
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </motion.span>

              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-card-foreground">
                  All users
                </h2>

                <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
                  Inspect profiles, wallet state,
                  KYC and account activity.
                </p>
              </div>
            </div>
          </div>

          <span
            className="
              shrink-0
              rounded-full
              border
              border-border
              bg-muted/50
              px-3
              py-1.5
              text-[9px]
              font-black
              text-muted-foreground
            "
          >
            {totalFiltered} result
            {totalFiltered ===
            1
              ? ""
              : "s"}
          </span>
        </div>

        {/* Selection summary */}

        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              className="
                overflow-hidden
                rounded-xl
                border
                border-indigo-400/15
                bg-gradient-to-r
                from-indigo-950/5
                to-violet-950/5
                px-3
                py-2.5
              "
            >
              <p className="text-[9px] font-black text-card-foreground">
                {selectedCount} visible user
                {selectedCount ===
                1
                  ? ""
                  : "s"}{" "}
                selected
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===================================================
          EMPTY
      ==================================================== */}

      {users.length ===
      0 ? (
        <UserEmptyState
          filtered
          onClear={
            onClearFilters
          }
        />
      ) : (
        <>
          {/* =================================================
              DESKTOP TABLE
          ================================================== */}

          <div
            className="
              hidden
              overflow-x-auto
              [scrollbar-width:none]
              md:block
              [&::-webkit-scrollbar]:hidden
            "
          >
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr
                  className="
                    border-b
                    border-border
                    bg-muted/35
                  "
                >
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        allSelected
                      }
                      onChange={(
                        event
                      ) =>
                        onToggleAll(
                          event
                            .target
                            .checked
                        )
                      }
                      aria-label="Select visible users"
                      className="
                        h-4
                        w-4
                        rounded
                        border-border
                        accent-[var(--dashboard-primary)]
                      "
                    />
                  </th>

                  <SortHeader
                    label="User"
                    field="name"
                    sort={
                      sort
                    }
                    onSort={
                      onSort
                    }
                    className="w-[28%]"
                  />

                  {columns.phone && (
                    <th
                      className="
                        hidden
                        w-[15%]
                        px-2
                        py-3
                        text-left
                        text-[8px]
                        font-black
                        uppercase
                        tracking-wider
                        text-muted-foreground
                        lg:table-cell
                      "
                    >
                      Phone
                    </th>
                  )}

                  {columns.role && (
                    <SortHeader
                      label="Role"
                      field="role"
                      sort={
                        sort
                      }
                      onSort={
                        onSort
                      }
                      className="w-[10%]"
                    />
                  )}

                  {columns.kyc && (
                    <SortHeader
                      label="KYC"
                      field="kycStatus"
                      sort={
                        sort
                      }
                      onSort={
                        onSort
                      }
                      className="
                        hidden
                        w-[11%]
                        xl:table-cell
                      "
                    />
                  )}

                  {columns.wallet && (
                    <SortHeader
                      label="Wallet"
                      field="walletStatus"
                      sort={
                        sort
                      }
                      onSort={
                        onSort
                      }
                      className="
                        hidden
                        w-[13%]
                        xl:table-cell
                      "
                    />
                  )}

                  {columns.risk && (
                    <SortHeader
                      label="Risk"
                      field="riskScore"
                      sort={
                        sort
                      }
                      onSort={
                        onSort
                      }
                      className="w-[9%]"
                    />
                  )}

                  {columns.lastActive && (
                    <SortHeader
                      label="Last active"
                      field="lastActive"
                      sort={
                        sort
                      }
                      onSort={
                        onSort
                      }
                      className="
                        hidden
                        w-[14%]
                        2xl:table-cell
                      "
                    />
                  )}

                  {columns.joined && (
                    <SortHeader
                      label="Joined"
                      field="joinedAt"
                      sort={
                        sort
                      }
                      onSort={
                        onSort
                      }
                      className="
                        hidden
                        w-[14%]
                        2xl:table-cell
                      "
                    />
                  )}

                  <th className="w-14 px-3 py-3 text-right">
                    <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground/40" />
                  </th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence initial={false}>
                  {users.map(
                    (
                      user
                    ) => (
                      <UserTableRow
                        key={
                          user.id
                        }
                        user={
                          user
                        }
                        columns={
                          columns
                        }
                        selected={selectedIds.has(
                          user.id
                        )}
                        onToggle={
                          onToggle
                        }
                        onOpen={
                          onOpenUser
                        }
                        onEdit={
                          onEditUser
                        }
                        onSuspend={
                          onSuspendUser
                        }
                        onDelete={
                          onDeleteUser
                        }
                      />
                    )
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE CARDS
          ================================================== */}

          <div className="grid gap-3 p-3 md:hidden">
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
                  <motion.article
                    key={
                      user.id
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index *
                        0.025,
                    }}
                    whileTap={{
                      scale:
                        0.995,
                    }}
                    className="
                      rounded-2xl
                      border
                      p-4
                      transition-colors
                    "
                    style={{
                      background:
                        selected
                          ? "var(--dashboard-primary-soft)"
                          : "var(--card)",
                      borderColor:
                        selected
                          ? "color-mix(in srgb, var(--dashboard-primary) 28%, var(--border))"
                          : "var(--border)",
                    }}
                  >
                    {/* Top */}

                    <div className="flex items-start gap-3">
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
                        aria-label={`Select ${user.name}`}
                        className="
                          mt-1
                          h-4
                          w-4
                          rounded
                          border-border
                          accent-[var(--dashboard-primary)]
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          onOpenUser(
                            user
                          )
                        }
                        className="
                          flex
                          min-w-0
                          flex-1
                          items-center
                          gap-3
                          text-left
                          outline-none
                        "
                      >
                        <div
                          className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-2xl
                            bg-gradient-to-br
                            from-indigo-600
                            to-violet-500
                            text-xs
                            font-black
                            text-white
                            shadow-sm
                          "
                        >
                          {getInitials(
                            user.name
                          )}
                        </div>

                        <div className="min-w-0">
                          <strong className="block truncate text-sm font-black text-card-foreground">
                            {
                              user.name
                            }
                          </strong>

                          <span className="block truncate text-[10px] text-muted-foreground">
                            {
                              user.email
                            }
                          </span>

                          <span className="mt-0.5 block truncate text-[8px] text-muted-foreground/50">
                            ID:{" "}
                            {
                              user.id
                            }
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenUser(
                            user
                          )
                        }
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-muted
                          text-muted-foreground
                          transition
                          hover:text-foreground
                        "
                        aria-label={`Open details for ${user.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Badges */}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        value={
                          user.role
                        }
                      />

                      <Badge
                        value={
                          user.kycStatus
                        }
                      />

                      <Badge
                        value={
                          user.walletStatus
                        }
                      />

                      <Badge
                        value={
                          user.riskLevel
                        }
                      />
                    </div>

                    {/* Quick metrics */}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <MobileMetric
                        label="Balance"
                        value={formatMoney(
                          user.balance
                        )}
                      />

                      <MobileMetric
                        label="Transactions"
                        value={String(
                          user.transactionCount
                        )}
                      />

                      <MobileMetric
                        label="Risk"
                        value={`${Math.round(
                          user.riskScore
                        )}/100`}
                      />

                      <MobileMetric
                        label="Sessions"
                        value={String(
                          user.activeSessions
                        )}
                      />
                    </div>

                    {/* Actions */}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEditUser(
                            user
                          )
                        }
                        className="
                          inline-flex
                          h-9
                          items-center
                          justify-center
                          gap-1.5
                          rounded-xl
                          border
                          border-border
                          bg-muted/30
                          text-[9px]
                          font-black
                          text-muted-foreground
                          transition
                          hover:bg-muted
                          hover:text-foreground
                        "
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onSuspendUser(
                            user
                          )
                        }
                        className="
                          inline-flex
                          h-9
                          items-center
                          justify-center
                          gap-1.5
                          rounded-xl
                          border
                          px-3
                          text-[9px]
                          font-black
                        "
                        style={{
                          background:
                            "color-mix(in srgb, var(--dashboard-warning) 9%, var(--card))",
                          borderColor:
                            "color-mix(in srgb, var(--dashboard-warning) 18%, var(--border))",
                          color:
                            "var(--dashboard-warning)",
                        }}
                      >
                        Suspend
                      </button>
                    </div>
                  </motion.article>
                );
              }
            )}
          </div>
        </>
      )}

      {/* ===================================================
          PAGINATION
      ==================================================== */}

      <UserManagementPagination
        page={
          page
        }
        pageSize={
          pageSize
        }
        total={
          totalFiltered
        }
        totalPages={
          totalPages
        }
        onPageChange={
          onPageChange
        }
        onPageSizeChange={
          onPageSizeChange
        }
      />
    </section>
  );
}

/* =========================================================
   SORT HEADER
========================================================= */

interface SortHeaderProps {
  label: string;
  field: SortField;
  sort: SortState;
  onSort: (
    field: SortField
  ) => void;
  className?: string;
}

function SortHeader({
  label,
  field,
  sort,
  onSort,
  className = "",
}: SortHeaderProps) {
  const active =
    sort.field ===
    field;

  const Icon =
    sort.direction ===
    "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <th
      className={`px-2 py-3 text-left ${className}`}
    >
      <button
        type="button"
        onClick={() =>
          onSort(
            field
          )
        }
        className="
          inline-flex
          items-center
          gap-1
          text-[8px]
          font-black
          uppercase
          tracking-[0.1em]
          outline-none
          transition-colors
        "
        style={{
          color:
            active
              ? "var(--dashboard-primary)"
              : "var(--muted-foreground)",
        }}
      >
        {
          label
        }

        {active && (
          <Icon className="h-3 w-3" />
        )}
      </button>
    </th>
  );
}

/* =========================================================
   MOBILE METRIC
========================================================= */

function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-xl
        border
        border-border
        bg-muted/25
        p-3
      "
    >
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground">
        {
          label
        }
      </p>

      <p className="mt-1 truncate text-[10px] font-black text-card-foreground">
        {
          value
        }
      </p>
    </div>
  );
}

/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  name: string
): string {
  if (
    !name
  ) {
    return "U";
  }

  return (
    name
      .trim()
      .split(
        /\s+/
      )
      .slice(
        0,
        2
      )
      .map(
        (
          part
        ) =>
          part.charAt(
            0
          )
      )
      .join("")
      .toUpperCase() ||
    "U"
  );
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number
): string {
  const safe =
    Number.isFinite(
      Number(
        value
      )
    )
      ? Number(
          value
        )
      : 0;

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",
        currency:
          "BDT",
        maximumFractionDigits: 0,
      }
    ).format(
      safe
    );
  } catch {
    return `৳${safe.toLocaleString(
      "en-BD"
    )}`;
  }
}