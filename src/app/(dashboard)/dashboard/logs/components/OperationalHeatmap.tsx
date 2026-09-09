"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Flame,
  Info,
  RefreshCw,
  ServerCrash,
  XCircle,
} from "lucide-react";

import type { HeatmapCell } from "@/lib/api/systemlogApi";

/* =========================================================
   TYPES
========================================================= */

interface OperationalHeatmapProps {
  cells: HeatmapCell[];
  loading?: boolean;
  range?: string;
  onRefresh?: () => void;
}

/* =========================================================
   CONSTANTS
========================================================= */

const HOURS = [
  "00:00",
  "04:00",
  "08:00",
  "12:00",
  "16:00",
  "20:00",
] as const;

const DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

/* =========================================================
   COMPONENT
========================================================= */

export function OperationalHeatmap({
  cells,
  loading = false,
  range,
  onRefresh,
}: OperationalHeatmapProps) {
  const [selectedKey, setSelectedKey] =
    useState<string | null>(null);

  /* =======================================================
     NORMALIZE LIVE CELLS
  ====================================================== */

  const normalizedCells = useMemo(() => {
    return cells.map((cell) => ({
      ...cell,
      events: Number.isFinite(
        Number(cell.events)
      )
        ? Number(cell.events)
        : 0,
      errors: Number.isFinite(
        Number(cell.errors)
      )
        ? Number(cell.errors)
        : 0,
    }));
  }, [cells]);

  /* =======================================================
     INDEX CELLS
  ====================================================== */

  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();

    for (const cell of normalizedCells) {
      map.set(
        `${cell.day}-${normalizeHour(cell.hour)}`,
        cell
      );
    }

    return map;
  }, [normalizedCells]);

  /* =======================================================
     OVERALL METRICS
  ====================================================== */

  const summary = useMemo(() => {
    let totalEvents = 0;
    let totalErrors = 0;

    let activeCells = 0;
    let warningCells = 0;
    let failureCells = 0;

    for (const cell of normalizedCells) {
      totalEvents += cell.events;
      totalErrors += cell.errors;

      if (cell.severity === "active") {
        activeCells += 1;
      }

      if (cell.severity === "warning") {
        warningCells += 1;
      }

      if (cell.severity === "failure") {
        failureCells += 1;
      }
    }

    const errorRate =
      totalEvents > 0
        ? (totalErrors / totalEvents) * 100
        : 0;

    return {
      totalEvents,
      totalErrors,
      errorRate,
      activeCells,
      warningCells,
      failureCells,
    };
  }, [normalizedCells]);

  /* =======================================================
     SELECTED CELL
  ====================================================== */

  const selectedCell = useMemo(() => {
    if (!selectedKey) {
      return null;
    }

    return (
      normalizedCells.find(
        (cell) =>
          `${cell.day}-${normalizeHour(cell.hour)}` ===
          selectedKey
      ) ?? null
    );
  }, [
    normalizedCells,
    selectedKey,
  ]);

  return (
    <section
      className="
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
          flex
          flex-col
          gap-4
          border-b
          border-border
          p-5
          sm:p-6
        "
      >
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
                  tracking-[0.14em]
                  text-indigo-500
                "
              >
                <Flame className="h-3.5 w-3.5" />
                Live operations
              </span>

              {range && (
                <span
                  className="
                    rounded-full
                    border
                    border-border
                    bg-muted/40
                    px-3
                    py-1.5
                    text-[9px]
                    font-bold
                    text-muted-foreground
                  "
                >
                  {range}
                </span>
              )}
            </div>

            <h3
              className="
                mt-3
                flex
                items-center
                gap-2
                text-xl
                font-black
                tracking-tight
                text-card-foreground
              "
            >
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Operational Heatmap
            </h3>

            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-muted-foreground
              "
            >
              Live distribution of system events and error
              activity across the selected time range.
            </p>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="
                inline-flex
                h-10
                shrink-0
                items-center
                gap-2
                rounded-xl
                border
                border-border
                bg-card
                px-3
                text-[10px]
                font-black
                text-muted-foreground
                transition
                hover:bg-muted
                hover:text-foreground
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>
          )}
        </div>

        {/* =================================================
            SUMMARY METRICS
        ================================================== */}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCard
            icon={Activity}
            label="Events"
            value={summary.totalEvents.toLocaleString()}
            tone="indigo"
          />

          <SummaryCard
            icon={ServerCrash}
            label="Errors"
            value={summary.totalErrors.toLocaleString()}
            tone="rose"
          />

          <SummaryCard
            icon={AlertTriangle}
            label="Error rate"
            value={`${summary.errorRate.toFixed(2)}%`}
            tone="amber"
          />

          <SummaryCard
            icon={Clock3}
            label="Active cells"
            value={String(
              summary.activeCells
            )}
            tone="cyan"
          />
        </div>
      </header>

      {/* ===================================================
          BODY
      ==================================================== */}

      <div className="p-5 sm:p-6">
        {loading && normalizedCells.length === 0 ? (
          <HeatmapSkeleton />
        ) : normalizedCells.length === 0 ? (
          <EmptyHeatmap />
        ) : (
          <>
            {/* Legend */}

            <div
              className="
                mb-5
                flex
                flex-wrap
                items-center
                justify-between
                gap-3
              "
            >
              <div className="flex flex-wrap items-center gap-2">
                <Legend
                  label="Normal"
                  className="bg-slate-400"
                />

                <Legend
                  label="Active"
                  className="bg-cyan-500"
                />

                <Legend
                  label="Warning"
                  className="bg-amber-500"
                />

                <Legend
                  label="Failure"
                  className="bg-rose-500"
                />
              </div>

              <p
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  text-[9px]
                  font-medium
                  text-muted-foreground
                "
              >
                <Info className="h-3.5 w-3.5" />
                Select a cell to inspect live activity.
              </p>
            </div>

            {/* =================================================
                HEATMAP GRID
            ================================================== */}

            <div
              className="
                min-w-0
                overflow-x-auto
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              <div className="min-w-[720px]">
                {/* Hour headings */}

                <div className="grid grid-cols-[64px_repeat(6,minmax(0,1fr))] gap-2">
                  <div />

                  {HOURS.map(
                    (hour) => (
                      <div
                        key={hour}
                        className="
                          px-1
                          text-center
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                          text-muted-foreground
                        "
                      >
                        {hour}
                      </div>
                    )
                  )}
                </div>

                {/* Day rows */}

                <div className="mt-2 space-y-2">
                  {DAYS.map(
                    (day) => (
                      <div
                        key={day}
                        className="
                          grid
                          grid-cols-[64px_repeat(6,minmax(0,1fr))]
                          gap-2
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            text-[10px]
                            font-black
                            text-muted-foreground
                          "
                        >
                          {day}
                        </div>

                        {HOURS.map(
                          (hour) => {
                            const cell =
                              cellMap.get(
                                `${day}-${hour}`
                              );

                            return (
                              <HeatmapCellButton
                                key={`${day}-${hour}`}
                                cell={cell}
                                selected={
                                  selectedKey ===
                                  `${day}-${hour}`
                                }
                                onClick={() =>
                                  setSelectedKey(
                                    `${day}-${hour}`
                                  )
                                }
                              />
                            );
                          }
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* =================================================
                SELECTED CELL DETAIL
            ================================================== */}

            <AnimateCellDetail
              cell={
                selectedCell
              }
            />

            {/* =================================================
                INSIGHTS
            ================================================== */}

            <div
              className="
                mt-5
                grid
                gap-3
                sm:grid-cols-2
              "
            >
              <InsightCard
                icon={
                  summary.failureCells > 0
                    ? XCircle
                    : CheckCircle2
                }
                title={
                  summary.failureCells > 0
                    ? "Failure activity detected"
                    : "No failure hotspots"
                }
                description={
                  summary.failureCells > 0
                    ? `${summary.failureCells} heatmap cell${
                        summary.failureCells > 1
                          ? "s"
                          : ""
                      } recorded failure-level activity.`
                    : "No failure-level cells were returned by the backend."
                }
                danger={
                  summary.failureCells >
                  0
                }
              />

              <InsightCard
                icon={Activity}
                title="Operational activity"
                description={`${summary.activeCells} active cell${
                  summary.activeCells !==
                  1
                    ? "s"
                    : ""
                } and ${
                  summary.warningCells
                } warning cell${
                  summary.warningCells !==
                  1
                    ? "s"
                    : ""
                } in the selected range.`}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   HEATMAP CELL
========================================================= */

function HeatmapCellButton({
  cell,
  selected,
  onClick,
}: {
  cell?: HeatmapCell;
  selected: boolean;
  onClick: () => void;
}) {
  if (!cell) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="
          relative
          h-14
          rounded-xl
          border
          border-border
          bg-muted/30
          transition
          hover:bg-muted
        "
        aria-label="No telemetry recorded"
      >
        <span className="text-[9px] text-muted-foreground/40">
          —
        </span>
      </button>
    );
  }

  const severity = cell.severity;

  const percentage =
    cell.events > 0
      ? Math.min(
          100,
          (cell.errors /
            cell.events) *
            100
        )
      : 0;

  const styles =
    getCellStyles(
      severity
    );

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -2,
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className={`
        relative
        h-14
        overflow-hidden
        rounded-xl
        border
        text-left
        transition
        ${styles.container}
        ${
          selected
            ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--card)]"
            : ""
        }
      `}
      aria-label={`${cell.day} ${cell.hour}: ${cell.events} events, ${cell.errors} errors`}
    >
      <div className="relative z-10 flex h-full flex-col justify-between p-2.5">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`
              text-[9px]
              font-black
              ${styles.text}
            `}
          >
            {cell.events}
          </span>

          {cell.errors > 0 && (
            <span
              className={`
                rounded-full
                px-1.5
                py-0.5
                text-[8px]
                font-black
                ${styles.badge}
              `}
            >
              {cell.errors}
            </span>
          )}
        </div>

        <div>
          <div
            className="
              h-1.5
              overflow-hidden
              rounded-full
              bg-black/5
            "
          >
            <motion.span
              initial={{
                width: 0,
              }}
              animate={{
                width: `${percentage}%`,
              }}
              transition={{
                duration: 0.55,
              }}
              className={`
                block
                h-full
                rounded-full
                ${styles.bar}
              `}
            />
          </div>

          <p
            className={`
              mt-1
              text-[8px]
              font-bold
              ${styles.muted}
            `}
          >
            {cell.hour}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

/* =========================================================
   SELECTED DETAIL
========================================================= */

function AnimateCellDetail({
  cell,
}: {
  cell: HeatmapCell | null;
}) {
  if (!cell) {
    return (
      <div
        className="
          mt-5
          flex
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          border-border
          bg-muted/20
          px-5
          py-6
          text-center
        "
      >
        <div>
          <Info className="mx-auto h-5 w-5 text-muted-foreground/50" />

          <p
            className="
              mt-2
              text-[10px]
              font-semibold
              text-muted-foreground
            "
          >
            Select a heatmap cell to inspect its
            event and error counts.
          </p>
        </div>
      </div>
    );
  }

  const errorRate =
    cell.events > 0
      ? (cell.errors /
          cell.events) *
        100
      : 0;

  return (
    <motion.div
      key={`${cell.day}-${cell.hour}`}
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        mt-5
        overflow-hidden
        rounded-[22px]
        border
        border-indigo-500/15
        bg-indigo-500/5
      "
    >
      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          border-b
          border-indigo-500/10
          px-4
          py-3.5
        "
      >
        <div className="flex items-center gap-3">
          <span
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-indigo-500/10
              text-indigo-500
            "
          >
            <Clock3 className="h-4 w-4" />
          </span>

          <div>
            <p
              className="
                text-xs
                font-black
                text-card-foreground
              "
            >
              {cell.day} · {cell.hour}
            </p>

            <p
              className="
                mt-0.5
                text-[9px]
                text-muted-foreground
              "
            >
              Backend telemetry cell
            </p>
          </div>
        </div>

        <SeverityBadge
          severity={
            cell.severity
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
        <DetailMetric
          label="Events"
          value={
            cell.events.toLocaleString()
          }
        />

        <DetailMetric
          label="Errors"
          value={
            cell.errors.toLocaleString()
          }
        />

        <DetailMetric
          label="Error rate"
          value={`${errorRate.toFixed(2)}%`}
        />

        <DetailMetric
          label="Severity"
          value={capitalize(
            cell.severity
          )}
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  tone:
    | "indigo"
    | "rose"
    | "amber"
    | "cyan";
}) {
  const styles = {
    indigo:
      "bg-indigo-500/10 text-indigo-500",
    rose:
      "bg-rose-500/10 text-rose-500",
    amber:
      "bg-amber-500/10 text-amber-600",
    cyan:
      "bg-cyan-500/10 text-cyan-500",
  };

  return (
    <div
      className="
        rounded-2xl
        border
        border-border
        bg-muted/25
        p-3
      "
    >
      <span
        className={`
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          ${styles[tone]}
        `}
      >
        <Icon className="h-4 w-4" />
      </span>

      <p
        className="
          mt-2
          text-[8px]
          font-black
          uppercase
          tracking-[0.1em]
          text-muted-foreground
        "
      >
        {label}
      </p>

      <p
        className="
          mt-0.5
          text-lg
          font-black
          text-card-foreground
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   LEGEND
========================================================= */

function Legend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground">
      <span
        className={`h-2 w-2 rounded-full ${className}`}
      />
      {label}
    </span>
  );
}

/* =========================================================
   SEVERITY BADGE
========================================================= */

function SeverityBadge({
  severity,
}: {
  severity: HeatmapCell["severity"];
}) {
  const config = {
    normal: {
      className:
        "bg-slate-500/10 text-slate-500",
    },

    active: {
      className:
        "bg-cyan-500/10 text-cyan-500",
    },

    warning: {
      className:
        "bg-amber-500/10 text-amber-600",
    },

    failure: {
      className:
        "bg-rose-500/10 text-rose-500",
    },
  };

  return (
    <span
      className={`
        rounded-full
        px-2.5
        py-1
        text-[9px]
        font-black
        ${config[severity].className}
      `}
    >
      {capitalize(
        severity
      )}
    </span>
  );
}

/* =========================================================
   DETAIL METRIC
========================================================= */

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-indigo-500/10
        bg-card
        p-3
      "
    >
      <p
        className="
          text-[8px]
          font-black
          uppercase
          tracking-[0.1em]
          text-muted-foreground
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-xs
          font-black
          text-card-foreground
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  icon: Icon,
  title,
  description,
  danger = false,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-4
        ${
          danger
            ? "border-rose-500/15 bg-rose-500/5"
            : "border-border bg-muted/25"
        }
      `}
    >
      <div className="flex items-start gap-3">
        <span
          className={`
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${
              danger
                ? "bg-rose-500/10 text-rose-500"
                : "bg-indigo-500/10 text-indigo-500"
            }
          `}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <p
            className="
              text-xs
              font-black
              text-card-foreground
            "
          >
            {title}
          </p>

          <p
            className="
              mt-1
              text-[10px]
              leading-5
              text-muted-foreground
            "
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CELL STYLES
========================================================= */

function getCellStyles(
  severity: HeatmapCell["severity"]
) {
  switch (severity) {
    case "failure":
      return {
        container:
          "border-rose-500/20 bg-rose-500/10",
        text:
          "text-rose-600",
        badge:
          "bg-rose-500/15 text-rose-600",
        bar:
          "bg-rose-500",
        muted:
          "text-rose-500/70",
      };

    case "warning":
      return {
        container:
          "border-amber-500/20 bg-amber-500/10",
        text:
          "text-amber-700",
        badge:
          "bg-amber-500/15 text-amber-700",
        bar:
          "bg-amber-500",
        muted:
          "text-amber-600/70",
      };

    case "active":
      return {
        container:
          "border-cyan-500/20 bg-cyan-500/10",
        text:
          "text-cyan-600",
        badge:
          "bg-cyan-500/15 text-cyan-600",
        bar:
          "bg-cyan-500",
        muted:
          "text-cyan-600/70",
      };

    case "normal":
    default:
      return {
        container:
          "border-slate-400/15 bg-slate-500/5",
        text:
          "text-slate-600",
        badge:
          "bg-slate-500/10 text-slate-600",
        bar:
          "bg-slate-400",
        muted:
          "text-slate-500/70",
      };
  }
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyHeatmap() {
  return (
    <div
      className="
        flex
        min-h-[340px]
        flex-col
        items-center
        justify-center
        rounded-[24px]
        border
        border-dashed
        border-border
        bg-muted/20
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
        <BarChart3 className="h-7 w-7" />
      </span>

      <h4
        className="
          mt-4
          text-base
          font-black
          text-card-foreground
        "
      >
        No telemetry for this range
      </h4>

      <p
        className="
          mt-1
          max-w-md
          text-xs
          leading-5
          text-muted-foreground
        "
      >
        The backend did not return any operational
        heatmap events for the selected period yet.
      </p>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function HeatmapSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({
          length: 4,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={
                index
              }
              className="
                h-20
                animate-pulse
                rounded-2xl
                bg-muted
              "
            />
          )
        )}
      </div>

      <div className="space-y-2 pt-2">
        {Array.from({
          length: 7,
        }).map(
          (
            _,
            row
          ) => (
            <div
              key={
                row
              }
              className="grid grid-cols-6 gap-2"
            >
              {Array.from({
                length: 6,
              }).map(
                (
                  __,
                  cell
                ) => (
                  <div
                    key={
                      cell
                    }
                    className="
                      h-14
                      animate-pulse
                      rounded-xl
                      bg-muted
                    "
                  />
                )
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeHour(
  value: string
): string {
  const raw =
    String(
      value ?? ""
    ).trim();

  const match =
    raw.match(
      /^(\d{1,2}):/
    );

  if (!match) {
    return raw;
  }

  return `${String(
    Number(
      match[1]
    )
  ).padStart(
    2,
    "0"
  )}:00`;
}

function capitalize(
  value: string
): string {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}