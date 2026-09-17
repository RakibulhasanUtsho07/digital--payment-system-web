"use client";

import React, {
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

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

/* =========================================================
   TYPES
========================================================= */

interface UserFiltersProps {
  search: string;

  onSearchChange: (
    value: string
  ) => void;

  filters: FilterState;

  setFilter: <
    K extends UserFilterKey
  >(
    key: K,
    value: FilterState[K]
  ) => void;

  clearFilters: () => void;

  columns: ColumnVisibility;

  toggleColumn: (
    key: ColumnKey
  ) => void;

  filteredCount: number;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: readonly (
    readonly [
      string,
      string
    ]
  )[];
  onChange: (
    value: string
  ) => void;
}

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
}

/* =========================================================
   FILTER DEFINITIONS
========================================================= */

const FILTER_DEFINITIONS = [
  {
    key: "status",
    label: "Status",
    options: [
      [
        "all",
        "All",
      ],
      [
        "active",
        "Active",
      ],
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
    ],
  },

  {
    key: "kycStatus",
    label: "KYC",
    options: [
      [
        "all",
        "All",
      ],
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
        "Under review",
      ],
      [
        "rejected",
        "Rejected",
      ],
      [
        "not_started",
        "Not started",
      ],
    ],
  },

  {
    key: "role",
    label: "Role",
    options: [
      [
        "all",
        "All",
      ],
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
    ],
  },

  {
    key: "riskLevel",
    label: "Risk",
    options: [
      [
        "all",
        "All",
      ],
      [
        "low",
        "Low",
      ],
      [
        "medium",
        "Medium",
      ],
      [
        "high",
        "High",
      ],
    ],
  },

  {
    key: "walletStatus",
    label: "Wallet",
    options: [
      [
        "all",
        "All",
      ],
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
      [
        "closed",
        "Closed",
      ],
    ],
  },

  {
    key: "activity",
    label: "Activity",
    options: [
      [
        "all",
        "All",
      ],
      [
        "today",
        "Today",
      ],
      [
        "week",
        "This week",
      ],
      [
        "inactive",
        "Inactive 30+ days",
      ],
    ],
  },
] as const;

/* =========================================================
   COLUMN DEFINITIONS
========================================================= */

const COLUMN_DEFINITIONS: ColumnDefinition[] =
  [
    {
      key: "phone",
      label: "Phone",
    },
    {
      key: "role",
      label: "Role",
    },
    {
      key: "kyc",
      label: "KYC",
    },
    {
      key: "wallet",
      label: "Wallet",
    },
    {
      key: "risk",
      label: "Risk",
    },
    {
      key: "lastActive",
      label: "Last active",
    },
    {
      key: "joined",
      label: "Joined",
    },
  ];

/* =========================================================
   COMPONENT
========================================================= */

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
  const [
    showAdvanced,
    setShowAdvanced,
  ] = useState(true);

  const [
    showColumns,
    setShowColumns,
  ] = useState(false);

  const activeCount =
    Object.values(
      filters
    ).filter(
      (value) =>
        value !==
        "all"
    ).length +
    (search.trim()
      ? 1
      : 0);

  return (
    <section
      className="
        relative
        z-20
        rounded-[28px]
        border
        border-border
        bg-card
        p-4
        shadow-[var(--dashboard-shadow)]
        transition-colors
        duration-300
        sm:p-5
      "
    >
      {/* ===================================================
          TOP BAR
      ==================================================== */}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {/* Search */}

        <label className="relative min-w-0 flex-1">
          <Search
            className="
              pointer-events-none
              absolute
              left-4
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-muted-foreground
            "
          />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              onSearchChange(
                event.target
                  .value
              )
            }
            placeholder="Search by name, email, phone or user ID..."
            className="
              h-12
              w-full
              rounded-2xl
              border
              border-border
              bg-muted/35
              pl-11
              pr-11
              text-sm
              font-medium
              text-foreground
              outline-none
              transition-all
              placeholder:text-muted-foreground/70
              focus:border-[var(--dashboard-primary)]
              focus:bg-card
              focus:ring-4
              focus:ring-[var(--dashboard-primary)]/10
            "
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                onSearchChange(
                  ""
                )
              }
              aria-label="Clear search"
              className="
                absolute
                right-3
                top-1/2
                flex
                h-7
                w-7
                -translate-y-1/2
                items-center
                justify-center
                rounded-lg
                text-muted-foreground
                transition
                hover:bg-muted
                hover:text-foreground
              "
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        {/* Actions */}

        <div className="flex flex-wrap gap-2">
          {/* Advanced */}

          <motion.button
            whileTap={{
              scale:
                0.985,
            }}
            type="button"
            onClick={() =>
              setShowAdvanced(
                (
                  current
                ) =>
                  !current
              )
            }
            className={`
              inline-flex
              h-12
              items-center
              gap-2
              rounded-xl
              border
              px-4
              text-xs
              font-black
              transition-all
              ${
                showAdvanced
                  ? "border-[var(--dashboard-primary)] bg-[var(--dashboard-primary-soft)] text-[var(--dashboard-primary)]"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }
            `}
          >
            <SlidersHorizontal className="h-4 w-4" />

            Filters

            {activeCount >
              0 && (
              <span
                className="
                  rounded-full
                  px-1.5
                  py-0.5
                  text-[9px]
                  text-white
                "
                style={{
                  background:
                    "var(--dashboard-primary)",
                }}
              >
                {
                  activeCount
                }
              </span>
            )}
          </motion.button>

          {/* Columns */}

          <div className="relative">
            <motion.button
              whileTap={{
                scale:
                  0.985,
              }}
              type="button"
              onClick={() =>
                setShowColumns(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="
                inline-flex
                h-12
                items-center
                gap-2
                rounded-xl
                border
                border-border
                bg-card
                px-4
                text-xs
                font-black
                text-muted-foreground
                transition
                hover:bg-muted/50
                hover:text-foreground
              "
            >
              <Columns3 className="h-4 w-4" />

              Columns
            </motion.button>

            <AnimatePresence>
              {showColumns && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                    scale:
                      0.98,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 8,
                    scale:
                      0.98,
                  }}
                  className="
                    absolute
                    right-0
                    top-14
                    z-[60]
                    w-56
                    overflow-hidden
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    p-2
                    shadow-2xl
                  "
                >
                  {COLUMN_DEFINITIONS.map(
                    (
                      column
                    ) => (
                      <button
                        key={
                          column.key
                        }
                        type="button"
                        onClick={() =>
                          toggleColumn(
                            column.key
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3
                          rounded-xl
                          px-3
                          py-2.5
                          text-left
                          text-xs
                          font-semibold
                          text-muted-foreground
                          transition
                          hover:bg-muted
                          hover:text-foreground
                        "
                      >
                        <span>
                          {
                            column.label
                          }
                        </span>

                        <span
                          className="
                            flex
                            h-5
                            w-5
                            items-center
                            justify-center
                            rounded-md
                            border
                          "
                          style={{
                            background:
                              columns[
                                column.key
                              ]
                                ? "var(--dashboard-primary)"
                                : "transparent",
                            borderColor:
                              columns[
                                column.key
                              ]
                                ? "var(--dashboard-primary)"
                                : "var(--border)",
                            color:
                              columns[
                                column.key
                              ]
                                ? "var(--primary-foreground)"
                                : "transparent",
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clear */}

          {activeCount >
            0 && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="
                inline-flex
                h-12
                items-center
                gap-2
                rounded-xl
                px-3
                text-xs
                font-black
                text-[var(--dashboard-danger)]
                transition
                hover:bg-[color-mix(in_srgb,var(--dashboard-danger)_8%,transparent)]
              "
            >
              <X className="h-4 w-4" />

              Clear
            </button>
          )}
        </div>
      </div>

      {/* ===================================================
          FILTER GRID
      ==================================================== */}

      <AnimatePresence
        initial={false}
      >
        {showAdvanced && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            className="overflow-visible"
          >
            <div className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {FILTER_DEFINITIONS.map(
                (
                  filter
                ) => (
                  <FilterDropdown
                    key={
                      filter.key
                    }
                    label={
                      filter.label
                    }
                    value={
                      filters[
                        filter.key
                      ]
                    }
                    options={
                      filter.options
                    }
                    onChange={(
                      value
                    ) =>
                      setFilter(
                        filter.key,
                        value as never
                      )
                    }
                  />
                )
              )}
            </div>

            {/* footer */}

            <div
              className="
                mt-4
                flex
                flex-col
                gap-2
                border-t
                border-border
                pt-4
                text-[10px]
                text-muted-foreground
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <span>
                {filteredCount.toLocaleString()} matching user
                {filteredCount ===
                1
                  ? ""
                  : "s"}
              </span>

              <span className="text-right">
                Filters update the table instantly.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* =========================================================
   FILTER DROPDOWN
========================================================= */

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const selected =
    options.find(
      ([
        optionValue,
      ]) =>
        optionValue ===
        value
    )?.[1] ??
    "All";

  return (
    <div className="relative min-w-0">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {
          label
        }
      </span>

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
        aria-expanded={
          open
        }
        className="
          flex
          h-11
          w-full
          items-center
          justify-between
          gap-2
          rounded-xl
          border
          bg-card
          px-3
          text-left
          text-xs
          font-semibold
          transition-all
        "
        style={{
          borderColor:
            open
              ? "var(--dashboard-primary)"
              : "var(--border)",
          boxShadow:
            open
              ? "0 0 0 4px color-mix(in srgb, var(--dashboard-primary) 10%, transparent)"
              : "none",
        }}
      >
        <span className="truncate text-card-foreground">
          {
            selected
          }
        </span>

        <ChevronDown
          className={`
            h-4
            w-4
            shrink-0
            text-muted-foreground
            transition-transform
            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: 6,
              scale:
                0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 6,
              scale:
                0.98,
            }}
            className="
              absolute
              left-0
              right-0
              top-[68px]
              z-50
              max-h-64
              overflow-y-auto
              rounded-2xl
              border
              border-border
              bg-card
              p-1.5
              shadow-2xl
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {options.map(
              ([
                optionValue,
                optionLabel,
              ]) => {
                const active =
                  optionValue ===
                  value;

                return (
                  <button
                    key={
                      optionValue
                    }
                    type="button"
                    onClick={() => {
                      onChange(
                        optionValue
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-xs
                      font-semibold
                      transition
                      ${
                        active
                          ? "bg-[var(--dashboard-primary-soft)] text-[var(--dashboard-primary)]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <span>
                      {
                        optionLabel
                      }
                    </span>

                    {active && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}