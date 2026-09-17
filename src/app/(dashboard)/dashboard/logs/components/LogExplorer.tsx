"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Database,
  FileText,
  Filter,
  Info,
  Search,
  Server,
  ShieldAlert,
  Terminal,
  X,
  Zap,
} from "lucide-react";

import type {
  HeatmapCell,
  LogEnvironment,
  LogLevel,
  LogService,
  SystemLog,
} from "@/lib/api/systemlogApi";

/* =========================================================
   TYPES
========================================================= */

interface LogExplorerProps {
  logs: SystemLog[];

  loading?: boolean;

  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;

  search?: string;
  level?: LogLevel | "";
  service?: LogService | "";
  environment?: LogEnvironment | "";

  onSearchChange?: (
    value: string
  ) => void;

  onLevelChange?: (
    value: LogLevel | ""
  ) => void;

  onServiceChange?: (
    value: LogService | ""
  ) => void;

  onEnvironmentChange?: (
    value: LogEnvironment | ""
  ) => void;

  onPageChange?: (
    page: number
  ) => void;

  onLimitChange?: (
    limit: number
  ) => void;

  onOpenLog?: (
    log: SystemLog
  ) => void;

  selectedLog?: SystemLog | null;

  onCloseInspector?: () => void;
}

/* =========================================================
   OPTIONS
========================================================= */

const LEVELS: readonly LogLevel[] =
  [
    "TRACE",
    "DEBUG",
    "INFO",
    "NOTICE",
    "WARN",
    "ERROR",
    "CRITICAL",
  ];

const SERVICES: readonly LogService[] =
  [
    "API",
    "Authentication",
    "Database",
    "Wallet",
    "Transactions",
    "Transfers",
    "KYC",
    "Notifications",
    "Cloudinary",
    "AI",
    "Background Jobs",
    "System",
    "Security",
    "Support",
    "Revenue",
  ];

const ENVIRONMENTS: readonly LogEnvironment[] =
  [
    "Development",
    "Staging",
    "Production",
  ];

/* =========================================================
   COMPONENT
========================================================= */

export function LogExplorer({
  logs,
  loading = false,

  page = 1,
  totalPages = 1,
  total = 0,
  limit = 25,

  search = "",
  level = "",
  service = "",
  environment = "",

  onSearchChange,
  onLevelChange,
  onServiceChange,
  onEnvironmentChange,

  onPageChange,
  onLimitChange,

  onOpenLog,

  selectedLog = null,
  onCloseInspector,
}: LogExplorerProps) {
  const [
    localSearch,
    setLocalSearch,
  ] =
    useState(search);

  const [
    copiedField,
    setCopiedField,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     SYNC SEARCH
  ====================================================== */

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  /* =======================================================
     SEARCH DEBOUNCE
  ====================================================== */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        if (
          localSearch !== search &&
          onSearchChange
        ) {
          onSearchChange(
            localSearch
          );
        }
      }, 350);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    localSearch,
    search,
    onSearchChange,
  ]);

  /* =======================================================
     ACTIVE FILTER COUNT
  ====================================================== */

  const activeFilterCount =
    Number(Boolean(level)) +
    Number(Boolean(service)) +
    Number(Boolean(environment)) +
    Number(Boolean(search));

  /* =======================================================
     SUMMARY
  ====================================================== */

  const visibleStart =
    total === 0
      ? 0
      : (page - 1) * limit + 1;

  const visibleEnd =
    Math.min(
      page * limit,
      total
    );

  /* =======================================================
     PAGINATION
  ====================================================== */

  const pageNumbers =
    useMemo(() => {
      const maximum =
        Math.min(
          5,
          totalPages
        );

      const start = Math.max(
        1,
        Math.min(
          page - 2,
          totalPages -
            maximum +
            1
        )
      );

      return Array.from(
        {
          length: maximum,
        },
        (_, index) =>
          start + index
      );
    }, [
      page,
      totalPages,
    ]);

  /* =======================================================
     COPY
  ====================================================== */

  const copyValue = async (
    field: string,
    value: unknown
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        String(value)
      );

      setCopiedField(
        field
      );

      window.setTimeout(() => {
        setCopiedField(
          null
        );
      }, 1200);
    } catch {
      // Clipboard access can be denied by browser policy.
    }
  };

  return (
    <section
      className="
        relative
        min-w-0
        overflow-hidden
        rounded-[28px]
        border
        border-border
        bg-card
        shadow-[var(--dashboard-shadow)]
      "
    >
      {/* ===================================================
          HEADER
      ==================================================== */}

      <header
        className="
          border-b
          border-border
          p-5
          sm:p-6
        "
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-indigo-500/20
                    bg-indigo-500/10
                    px-3
                    py-1.5
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-indigo-500
                  "
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Live telemetry
                </span>

                {loading && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-border
                      bg-muted/50
                      px-3
                      py-1.5
                      text-[9px]
                      font-bold
                      text-muted-foreground
                    "
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                    Updating
                  </span>
                )}
              </div>

              <h2
                className="
                  mt-3
                  text-xl
                  font-black
                  tracking-tight
                  text-card-foreground
                  sm:text-2xl
                "
              >
                Log Explorer
              </h2>

              <p
                className="
                  mt-1
                  max-w-2xl
                  text-xs
                  leading-5
                  text-muted-foreground
                "
              >
                Inspect real system telemetry recorded by
                the backend. Search events, correlate requests,
                and inspect individual log cells without demo data.
              </p>
            </div>

            <div
              className="
                shrink-0
                rounded-2xl
                border
                border-border
                bg-muted/40
                px-4
                py-3
              "
            >
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-muted-foreground
                "
              >
                Events
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-black
                  text-card-foreground
                "
              >
                {total.toLocaleString()}
              </p>
            </div>
          </div>

          {/* =================================================
              SEARCH + FILTERS
          ================================================== */}

          <div
            className="
              flex
              flex-col
              gap-3
              xl:flex-row
            "
          >
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
                value={localSearch}
                onChange={(event) =>
                  setLocalSearch(
                    event.target.value
                  )
                }
                placeholder="Search event, message, request ID, trace ID or transaction ID..."
                className="
                  h-12
                  w-full
                  rounded-2xl
                  border
                  border-border
                  bg-muted/40
                  pl-11
                  pr-4
                  text-sm
                  text-foreground
                  outline-none
                  transition
                  placeholder:text-muted-foreground
                  focus:border-indigo-500/50
                  focus:bg-card
                  focus:ring-4
                  focus:ring-indigo-500/10
                "
              />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-[540px]">
              <FilterSelect
                icon={Filter}
                value={level}
                placeholder="All levels"
                options={LEVELS}
                getLabel={(value) =>
                  value
                }
                onChange={(value) =>
                  onLevelChange?.(
                    value as LogLevel | ""
                  )
                }
              />

              <FilterSelect
                icon={Server}
                value={service}
                placeholder="All services"
                options={SERVICES}
                getLabel={(value) =>
                  value
                }
                onChange={(value) =>
                  onServiceChange?.(
                    value as LogService | ""
                  )
                }
              />

              <FilterSelect
                icon={Database}
                value={environment}
                placeholder="All environments"
                options={ENVIRONMENTS}
                getLabel={(value) =>
                  value
                }
                onChange={(value) =>
                  onEnvironmentChange?.(
                    value as LogEnvironment | ""
                  )
                }
              />
            </div>
          </div>

          {/* =================================================
              FILTER STATUS
          ================================================== */}

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
            "
          >
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterCount > 0 ? (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-indigo-500/20
                    bg-indigo-500/10
                    px-3
                    py-1.5
                    text-[9px]
                    font-bold
                    text-indigo-500
                  "
                >
                  <Filter className="h-3 w-3" />

                  {activeFilterCount} active filter
                  {activeFilterCount > 1
                    ? "s"
                    : ""}
                </span>
              ) : (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-[10px]
                    font-medium
                    text-muted-foreground
                  "
                >
                  <Info className="h-3.5 w-3.5" />
                  Showing backend events
                </span>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");

                  onSearchChange?.(
                    ""
                  );

                  onLevelChange?.(
                    ""
                  );

                  onServiceChange?.(
                    ""
                  );

                  onEnvironmentChange?.(
                    ""
                  );
                }}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-xl
                  px-3
                  py-2
                  text-[10px]
                  font-black
                  text-muted-foreground
                  transition
                  hover:bg-muted
                  hover:text-foreground
                "
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================
          TABLE
      ==================================================== */}

      <div className="min-w-0">
        {loading && logs.length === 0 ? (
          <LogsSkeleton />
        ) : logs.length === 0 ? (
          <EmptyLogsState
            hasFilters={
              activeFilterCount > 0
            }
          />
        ) : (
          <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table
              className="
                w-full
                min-w-[1080px]
                border-collapse
                text-left
              "
            >
              <thead
                className="
                  border-b
                  border-border
                  bg-muted/40
                "
              >
                <tr>
                  <th
                    className="
                      px-4
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-muted-foreground
                    "
                  >
                    Time
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-muted-foreground
                    "
                  >
                    Level
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-muted-foreground
                    "
                  >
                    Service
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-muted-foreground
                    "
                  >
                    Event
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-muted-foreground
                    "
                  >
                    Message
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-muted-foreground
                    "
                  >
                    Result
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-muted-foreground
                    "
                  >
                    Duration
                  </th>

                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>

              <tbody>
                <AnimatePresence initial={false}>
                  {logs.map(
                    (
                      log,
                      index
                    ) => (
                      <LogRow
                        key={
                          log.id
                        }
                        log={log}
                        index={
                          index
                        }
                        selected={
                          selectedLog?.id ===
                          log.id
                        }
                        onOpen={() =>
                          onOpenLog?.(
                            log
                          )
                        }
                      />
                    )
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================
          FOOTER / PAGINATION
      ==================================================== */}

      <footer
        className="
          flex
          flex-col
          gap-3
          border-t
          border-border
          bg-muted/20
          px-4
          py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-5
        "
      >
        <div className="flex items-center gap-3">
          <p
            className="
              text-[10px]
              font-medium
              text-muted-foreground
            "
          >
            Showing{" "}
            <strong className="text-card-foreground">
              {visibleStart}
              {total > 0 &&
                `–${visibleEnd}`}
            </strong>{" "}
            of{" "}
            <strong className="text-card-foreground">
              {total.toLocaleString()}
            </strong>
          </p>

          <select
            value={limit}
            onChange={(event) =>
              onLimitChange?.(
                Number(
                  event.target.value
                )
              )
            }
            className="
              h-9
              rounded-xl
              border
              border-border
              bg-card
              px-2.5
              text-[10px]
              font-bold
              text-foreground
              outline-none
            "
          >
            <option value={10}>
              10 rows
            </option>

            <option value={25}>
              25 rows
            </option>

            <option value={50}>
              50 rows
            </option>

            <option value={100}>
              100 rows
            </option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() =>
              onPageChange?.(
                page - 1
              )
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border
              border-border
              bg-card
              text-muted-foreground
              transition
              hover:bg-muted
              disabled:cursor-not-allowed
              disabled:opacity-35
            "
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers.map(
            (pageNumber) => (
              <button
                key={
                  pageNumber
                }
                type="button"
                onClick={() =>
                  onPageChange?.(
                    pageNumber
                  )
                }
                className={`
                  h-9
                  min-w-9
                  rounded-xl
                  px-2
                  text-[10px]
                  font-black
                  transition
                  ${
                    pageNumber ===
                    page
                      ? "bg-indigo-600 text-white shadow-[0_7px_18px_rgba(79,70,229,.22)]"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                {
                  pageNumber
                }
              </button>
            )
          )}

          <button
            type="button"
            disabled={
              page >=
                totalPages ||
              loading
            }
            onClick={() =>
              onPageChange?.(
                page + 1
              )
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border
              border-border
              bg-card
              text-muted-foreground
              transition
              hover:bg-muted
              disabled:cursor-not-allowed
              disabled:opacity-35
            "
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>

      {/* ===================================================
          CELL INSPECTOR
      ==================================================== */}

      <AnimatePresence>
        {selectedLog && (
          <CellInspector
            log={
              selectedLog
            }
            onClose={
              onCloseInspector
            }
            onCopy={
              copyValue
            }
            copiedField={
              copiedField
            }
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  icon: Icon,
  value,
  placeholder,
  options,
  getLabel,
  onChange,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  value: string;

  placeholder: string;

  options: readonly string[];

  getLabel: (
    value: string
  ) => string;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label
      className="
        relative
        flex
        h-12
        min-w-0
        items-center
      "
    >
      <Icon
        className="
          pointer-events-none
          absolute
          left-3.5
          h-4
          w-4
          text-muted-foreground
        "
      />

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          h-full
          w-full
          appearance-none
          rounded-2xl
          border
          border-border
          bg-muted/40
          pl-10
          pr-8
          text-xs
          font-semibold
          text-foreground
          outline-none
          transition
          focus:border-indigo-500/50
          focus:bg-card
          focus:ring-4
          focus:ring-indigo-500/10
        "
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={option}
              value={
                option
              }
            >
              {getLabel(
                option
              )}
            </option>
          )
        )}
      </select>
    </label>
  );
}

/* =========================================================
   LOG ROW
========================================================= */

function LogRow({
  log,
  index,
  selected,
  onOpen,
}: {
  log: SystemLog;
  index: number;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.tr
      layout
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay:
          Math.min(
            index * 0.018,
            0.18
          ),
      }}
      className={`
        group
        border-b
        border-border/70
        transition-colors
        ${
          selected
            ? "bg-indigo-500/5"
            : "hover:bg-muted/35"
        }
      `}
    >
      {/* Time */}

      <td className="whitespace-nowrap px-4 py-4 align-top">
        <div className="flex items-center gap-2">
          <Clock3
            className="
              h-3.5
              w-3.5
              shrink-0
              text-muted-foreground
            "
          />

          <span
            className="
              text-[10px]
              font-semibold
              text-card-foreground
            "
          >
            {formatDate(
              log.timestamp
            )}
          </span>
        </div>
      </td>

      {/* Level */}

      <td className="px-4 py-4 align-top">
        <LevelBadge
          level={
            log.level
          }
        />
      </td>

      {/* Service */}

      <td className="px-4 py-4 align-top">
        <div className="flex items-center gap-2">
          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-indigo-500/10
              text-indigo-500
            "
          >
            <ServiceIcon
              service={
                log.service
              }
            />
          </span>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-xs
                font-black
                text-card-foreground
              "
            >
              {
                log.service
              }
            </p>

            <p
              className="
                mt-0.5
                truncate
                text-[9px]
                text-muted-foreground
              "
            >
              {
                log.category
              }
            </p>
          </div>
        </div>
      </td>

      {/* Event */}

      <td className="max-w-[220px] px-4 py-4 align-top">
        <p
          className="
            truncate
            text-xs
            font-black
            text-card-foreground
          "
          title={
            log.event
          }
        >
          {
            log.event
          }
        </p>

        {log.requestId && (
          <p
            className="
              mt-1
              truncate
              font-mono
              text-[9px]
              text-muted-foreground
            "
          >
            {
              log.requestId
            }
          </p>
        )}
      </td>

      {/* Message */}

      <td className="max-w-[340px] px-4 py-4 align-top">
        <p
          className="
            line-clamp-2
            text-[10px]
            leading-5
            text-muted-foreground
          "
          title={
            log.message
          }
        >
          {
            log.message
          }
        </p>
      </td>

      {/* Result */}

      <td className="px-4 py-4 align-top">
        <ResultBadge
          result={
            log.result
          }
        />
      </td>

      {/* Duration */}

      <td className="px-4 py-4 align-top">
        <span
          className="
            whitespace-nowrap
            text-[10px]
            font-bold
            text-muted-foreground
          "
        >
          {log.durationMs !==
          undefined
            ? `${log.durationMs} ms`
            : "—"}
        </span>
      </td>

      {/* Open */}

      <td className="px-3 py-4 text-right align-top">
        <button
          type="button"
          onClick={
            onOpen
          }
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            text-muted-foreground
            opacity-60
            transition
            hover:bg-indigo-500/10
            hover:text-indigo-500
            group-hover:opacity-100
          "
          aria-label="Inspect log"
        >
          <Zap className="h-3.5 w-3.5" />
        </button>
      </td>
    </motion.tr>
  );
}

/* =========================================================
   CELL INSPECTOR
========================================================= */

function CellInspector({
  log,
  onClose,
  onCopy,
  copiedField,
}: {
  log: SystemLog;

  onClose?: () => void;

  onCopy: (
    field: string,
    value: unknown
  ) => void;

  copiedField:
    | string
    | null;
}) {
  const fields: Array<{
    key: string;
    label: string;
    value: unknown;
    mono?: boolean;
  }> = [
    {
      key: "id",
      label: "Log ID",
      value: log.id,
      mono: true,
    },
    {
      key: "timestamp",
      label: "Timestamp",
      value: log.timestamp,
      mono: true,
    },
    {
      key: "level",
      label: "Level",
      value: log.level,
    },
    {
      key: "service",
      label: "Service",
      value: log.service,
    },
    {
      key: "category",
      label: "Category",
      value: log.category,
    },
    {
      key: "event",
      label: "Event",
      value: log.event,
    },
    {
      key: "message",
      label: "Message",
      value: log.message,
    },
    {
      key: "requestId",
      label: "Request ID",
      value: log.requestId,
      mono: true,
    },
    {
      key: "traceId",
      label: "Trace ID",
      value: log.traceId,
      mono: true,
    },
    {
      key: "transactionId",
      label: "Transaction ID",
      value: log.transactionId,
      mono: true,
    },
    {
      key: "source",
      label: "Source",
      value: log.source,
    },
    {
      key: "endpoint",
      label: "Endpoint",
      value: log.endpoint,
      mono: true,
    },
    {
      key: "method",
      label: "Method",
      value: log.method,
    },
    {
      key: "statusCode",
      label: "Status Code",
      value: log.statusCode,
    },
    {
      key: "durationMs",
      label: "Duration",
      value:
        log.durationMs !==
        undefined
          ? `${log.durationMs} ms`
          : undefined,
    },
    {
      key: "environment",
      label: "Environment",
      value: log.environment,
    },
    {
      key: "result",
      label: "Result",
      value: log.result,
    },
  ];

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="
        fixed
        inset-0
        z-[140]
        flex
        justify-end
        bg-slate-950/35
        backdrop-blur-[2px]
      "
    >
      <button
        type="button"
        onClick={() =>
          onClose?.()
        }
        className="
          absolute
          inset-0
          cursor-default
        "
        aria-label="Close cell inspector"
      />

      <motion.aside
        initial={{
          x: "100%",
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x: "100%",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="
          relative
          z-10
          flex
          h-full
          w-full
          max-w-[500px]
          flex-col
          overflow-hidden
          border-l
          border-indigo-500/15
          bg-card
          shadow-2xl
        "
      >
        {/* ===============================================
            INDIGO HEADER
        ================================================ */}

        <header
          className="
            relative
            overflow-hidden
            bg-gradient-to-br
            from-[#170B38]
            via-[#28105E]
            to-[#4C1D95]
            p-5
            text-white
            sm:p-6
          "
        >
          <motion.div
            animate={{
              scale: [
                1,
                1.15,
                1,
              ],
              opacity: [
                0.12,
                0.3,
                0.12,
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-56
              w-56
              rounded-full
              bg-violet-300
              blur-3xl
            "
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/10
                  px-3
                  py-1.5
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-violet-100
                "
              >
                <FileText className="h-3.5 w-3.5" />
                Cell Inspector
              </span>

              <h3
                className="
                  mt-3
                  truncate
                  text-xl
                  font-black
                "
              >
                {log.event}
              </h3>

              <p
                className="
                  mt-1
                  text-[10px]
                  font-medium
                  text-violet-100/65
                "
              >
                {log.service} ·{" "}
                {log.environment}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onClose?.()
              }
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/10
                text-violet-100/70
                transition
                hover:bg-white/15
                hover:text-white
              "
              aria-label="Close cell inspector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ===============================================
            CONTENT
        ================================================ */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            p-5
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
            sm:p-6
          "
        >
          {/* Message highlight */}

          <div
            className="
              rounded-2xl
              border
              border-indigo-500/15
              bg-indigo-500/5
              p-4
            "
          >
            <div className="flex items-start gap-3">
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-indigo-500/10
                  text-indigo-500
                "
              >
                <Terminal className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-indigo-500
                  "
                >
                  Message
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    leading-6
                    text-card-foreground
                  "
                >
                  {
                    log.message
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}

          <div className="mt-5 space-y-2">
            {fields.map(
              (field) => {
                if (
                  field.value ===
                    undefined ||
                  field.value ===
                    null ||
                  field.value ===
                    ""
                ) {
                  return null;
                }

                return (
                  <InspectorField
                    key={
                      field.key
                    }
                    label={
                      field.label
                    }
                    value={
                      field.value
                    }
                    mono={
                      field.mono
                    }
                    copied={
                      copiedField ===
                      field.key
                    }
                    onCopy={() =>
                      onCopy(
                        field.key,
                        field.value
                      )
                    }
                  />
                );
              }
            )}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}

/* =========================================================
   INSPECTOR FIELD
========================================================= */

function InspectorField({
  label,
  value,
  mono = false,
  copied,
  onCopy,
}: {
  label: string;
  value: unknown;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-border
        bg-muted/30
        p-3
      "
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.1em]
            text-muted-foreground
          "
        >
          {label}
        </span>

        <button
          type="button"
          onClick={
            onCopy
          }
          className="
            inline-flex
            items-center
            gap-1
            rounded-lg
            px-2
            py-1
            text-[9px]
            font-bold
            text-muted-foreground
            transition
            hover:bg-card
            hover:text-indigo-500
          "
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      <p
        className={`
          mt-2
          break-all
          text-[11px]
          leading-5
          text-card-foreground
          ${
            mono
              ? "font-mono"
              : "font-medium"
          }
        `}
      >
        {String(
          value
        )}
      </p>
    </div>
  );
}

/* =========================================================
   LEVEL BADGE
========================================================= */

function LevelBadge({
  level,
}: {
  level: LogLevel;
}) {
  const config: Record<
    LogLevel,
    {
      icon: React.ComponentType<{
        className?: string;
      }>;
      className: string;
    }
  > = {
    TRACE: {
      icon: Terminal,
      className:
        "bg-slate-500/10 text-slate-500",
    },

    DEBUG: {
      icon: Terminal,
      className:
        "bg-cyan-500/10 text-cyan-500",
    },

    INFO: {
      icon: Info,
      className:
        "bg-blue-500/10 text-blue-500",
    },

    NOTICE: {
      icon: Info,
      className:
        "bg-indigo-500/10 text-indigo-500",
    },

    WARN: {
      icon: AlertCircle,
      className:
        "bg-amber-500/10 text-amber-600",
    },

    ERROR: {
      icon: AlertCircle,
      className:
        "bg-rose-500/10 text-rose-500",
    },

    CRITICAL: {
      icon: ShieldAlert,
      className:
        "bg-red-600/10 text-red-600",
    },
  };

  const current =
    config[level];

  const Icon =
    current.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        text-[9px]
        font-black
        ${current.className}
      `}
    >
      <Icon className="h-3 w-3" />
      {level}
    </span>
  );
}

/* =========================================================
   RESULT BADGE
========================================================= */

function ResultBadge({
  result,
}: {
  result: SystemLog["result"];
}) {
  const config: Record<
    SystemLog["result"],
    string
  > = {
    Success:
      "bg-emerald-500/10 text-emerald-600",

    Failed:
      "bg-rose-500/10 text-rose-600",

    Timeout:
      "bg-amber-500/10 text-amber-600",

    Retried:
      "bg-indigo-500/10 text-indigo-500",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-[9px]
        font-black
        ${config[result]}
      `}
    >
      {result}
    </span>
  );
}

/* =========================================================
   SERVICE ICON
========================================================= */

function ServiceIcon({
  service,
}: {
  service: LogService;
}) {
  if (
    service ===
      "Database" ||
    service ===
      "Wallet"
  ) {
    return (
      <Database className="h-4 w-4" />
    );
  }

  if (
    service ===
      "Authentication" ||
    service ===
      "Security"
  ) {
    return (
      <ShieldAlert className="h-4 w-4" />
    );
  }

  if (
    service ===
      "API" ||
    service ===
      "System"
  ) {
    return (
      <Server className="h-4 w-4" />
    );
  }

  return (
    <Zap className="h-4 w-4" />
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyLogsState({
  hasFilters,
}: {
  hasFilters: boolean;
}) {
  return (
    <div
      className="
        flex
        min-h-[360px]
        flex-col
        items-center
        justify-center
        p-8
        text-center
      "
    >
      <span
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-[20px]
          bg-indigo-500/10
          text-indigo-500
        "
      >
        {hasFilters ? (
          <Search className="h-7 w-7" />
        ) : (
          <FileText className="h-7 w-7" />
        )}
      </span>

      <h3
        className="
          mt-4
          text-base
          font-black
          text-card-foreground
        "
      >
        {hasFilters
          ? "No matching log events"
          : "No system logs recorded"}
      </h3>

      <p
        className="
          mt-1
          max-w-md
          text-xs
          leading-5
          text-muted-foreground
        "
      >
        {hasFilters
          ? "Try changing the search term or one of the active filters."
          : "The backend has not recorded any system events for the selected range yet."}
      </p>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function LogsSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({
        length: 8,
      }).map(
        (
          _,
          index
        ) => (
          <motion.div
            key={
              index
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
                0.04,
            }}
            className="
              h-16
              animate-pulse
              rounded-2xl
              bg-muted
            "
          />
        )
      )}
    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Invalid time";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle:
        "medium",
      timeStyle:
        "medium",
    }
  ).format(date);
}