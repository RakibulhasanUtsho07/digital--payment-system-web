"use client";

import React, {
  useMemo,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  ScanLine,
} from "lucide-react";

const days = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const hours = [
  "00:00",
  "04:00",
  "08:00",
  "12:00",
  "16:00",
  "20:00",
];

type Cell = {
  day: string;
  hour: string;
  events: number;
  errors: number;
  severity:
    | "normal"
    | "active"
    | "warning"
    | "failure";
};

const buildCells =
  (): Cell[] => {
    return days.flatMap(
      (
        day,
        dayIndex
      ) =>
        hours.map(
          (
            hour,
            hourIndex
          ) => {
            const score =
              (
                dayIndex *
                  3 +
                hourIndex *
                  7
              ) %
              10;

            const events =
              (
                (
                  dayIndex +
                  1
                ) *
                (
                  hourIndex +
                  1
                ) *
                821
              ) %
                4000 +
              1000;

            const severity =
              score > 7
                ? "failure"
                : score > 5
                  ? "warning"
                  : score > 2
                    ? "active"
                    : "normal";

            const errors =
              severity ===
              "failure"
                ? Math.floor(
                    events *
                      0.08
                  )
                : severity ===
                    "warning"
                  ? Math.floor(
                      events *
                        0.025
                    )
                  : 2;

            return {
              day,
              hour,
              events,
              errors,
              severity,
            };
          }
        )
    );
  };

const cells =
  buildCells();

const tones = {
  normal:
    "from-slate-100 to-slate-200 border-slate-200",

  active:
    "from-blue-100 to-cyan-100 border-blue-200",

  warning:
    "from-amber-100 to-orange-100 border-amber-200",

  failure:
    "from-rose-100 to-red-100 border-rose-200",
};

export function OperationalHeatmap() {
  const [
    activeCell,
    setActiveCell,
  ] =
    useState<Cell | null>(
      null
    );

  const [
    mode,
    setMode,
  ] =
    useState<
      "events"
      | "errors"
    >("events");

  const summary =
    useMemo(
      () => {
        const totalEvents =
          cells.reduce(
            (
              total,
              cell
            ) =>
              total +
              cell.events,
            0
          );

        const totalErrors =
          cells.reduce(
            (
              total,
              cell
            ) =>
              total +
              cell.errors,
            0
          );

        const failures =
          cells.filter(
            (cell) =>
              cell.severity ===
              "failure"
          ).length;

        return {
          totalEvents,
          totalErrors,
          failures,
        };
      },
      []
    );

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,39,69,0.05)] sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-50" />

      <div className="relative z-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
              Temporal signal map
            </p>

            <h3 className="mt-1 flex items-center gap-2 text-xl font-black text-[#0F2745]">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Operational Heatmap
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Explore event concentration and failure pressure across the weekly timeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SummaryPill
              label="Events"
              value={summary.totalEvents.toLocaleString()}
            />

            <SummaryPill
              label="Errors"
              value={summary.totalErrors.toLocaleString()}
            />

            <SummaryPill
              label="Failure cells"
              value={summary.failures.toString()}
            />

            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                "events",
                "errors",
              ].map(
                (
                  value
                ) => (
                  <button
                    key={
                      value
                    }
                    type="button"
                    onClick={() =>
                      setMode(
                        value as typeof mode
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-[9px] font-black uppercase transition ${
                      mode ===
                      value
                        ? "bg-[#0F2745] text-white"
                        : "text-slate-400"
                    }`}
                  >
                    {value}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[52px_repeat(6,minmax(90px,1fr))] gap-2">
                <div />

                {hours.map(
                  (
                    hour
                  ) => (
                    <div
                      key={
                        hour
                      }
                      className="text-center text-[9px] font-black uppercase tracking-wide text-slate-400"
                    >
                      {hour}
                    </div>
                  )
                )}

                {days.flatMap(
                  (
                    day
                  ) => {
                    const row =
                      cells.filter(
                        (cell) =>
                          cell.day ===
                          day
                      );

                    return [
                      <div
                        key={`${day}-label`}
                        className="flex items-center justify-end pr-2 text-[10px] font-black text-slate-500"
                      >
                        {day}
                      </div>,

                      ...row.map(
                        (
                          cell,
                          index
                        ) => {
                          const active =
                            activeCell?.day ===
                              cell.day &&
                            activeCell?.hour ===
                              cell.hour;

                          const intensity =
                            mode ===
                              "events"
                              ? Math.min(
                                  cell.events /
                                    5000,
                                  1
                                )
                              : Math.min(
                                  cell.errors /
                                    350,
                                  1
                                );

                          return (
                            <motion.button
                              key={`${cell.day}-${cell.hour}`}
                              type="button"
                              onMouseEnter={() =>
                                setActiveCell(
                                  cell
                                )
                              }
                              onFocus={() =>
                                setActiveCell(
                                  cell
                                )
                              }
                              whileHover={{
                                y: -3,
                                scale: 1.02,
                              }}
                              className={`relative h-12 overflow-hidden rounded-xl border bg-gradient-to-br ${tones[cell.severity]} ${
                                active
                                  ? "ring-2 ring-blue-500/20"
                                  : ""
                              }`}
                            >
                              <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-[#0F2745]/10"
                                animate={{
                                  height:
                                    `${Math.max(
                                      intensity *
                                        100,
                                      12
                                    )}%`,
                                }}
                                transition={{
                                  duration:
                                    0.35,

                                  delay:
                                    index *
                                    0.02,
                                }}
                              />

                              <span className="relative z-10 text-[9px] font-black text-[#0F2745]/70">
                                {mode ===
                                "events"
                                  ? `${Math.round(
                                      cell.events /
                                        100
                                    ) / 10}K`
                                  : cell.errors}
                              </span>
                            </motion.button>
                          );
                        }
                      ),
                    ];
                  }
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#163A5C]/10 bg-[#0B2038] p-4 text-white">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-cyan-300" />

              <p className="text-xs font-black">
                Cell Inspector
              </p>
            </div>

            {activeCell ? (
              <motion.div
                key={`${activeCell.day}-${activeCell.hour}`}
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-5 space-y-3"
              >
                <p className="text-xl font-black">
                  {activeCell.day} • {activeCell.hour}
                </p>

                <InspectorRow
                  label="Events"
                  value={activeCell.events.toLocaleString()}
                />

                <InspectorRow
                  label="Errors"
                  value={activeCell.errors.toLocaleString()}
                />

                <InspectorRow
                  label="State"
                  value={activeCell.severity}
                />

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[11px] leading-5 text-blue-100/60">
                  Hover or focus another cell to inspect its event density.
                </div>
              </motion.div>
            ) : (
              <p className="mt-5 text-xs leading-5 text-blue-100/55">
                Move over the matrix to inspect a time window.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryPill({
  label,
  value,
}: {
  label:
    string;
  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-black text-[#0F2745]">
        {value}
      </p>
    </div>
  );
}

function InspectorRow({
  label,
  value,
}: {
  label:
    string;
  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-[10px] text-blue-100/45">
        {label}
      </span>

      <span className="text-[10px] font-black capitalize text-cyan-100">
        {value}
      </span>
    </div>
  );
}
