"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  TimerReset,
} from "lucide-react";

import type {
  SystemTraceData,
  SystemTraceSpan,
} from "@/lib/api/systemlogApi";

/* =========================================================
   PROPS
========================================================= */

interface TraceWaterfallProps {
  trace: SystemTraceData | null;
  loading?: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

export function TraceWaterfall({
  trace,
  loading = false,
}: TraceWaterfallProps) {
  const [activeIndex, setActiveIndex] =
    useState<number | null>(null);

  const spans = useMemo<SystemTraceSpan[]>(
    () =>
      Array.isArray(trace?.spans)
        ? trace.spans
        : [],
    [trace]
  );

  const maxDuration = useMemo(() => {
    if (!spans.length) {
      return 1;
    }

    const calculated = spans.reduce(
      (max, span) => {
        const end =
          safeNumber(span.startOffset) +
          safeNumber(span.duration);

        return Math.max(
          max,
          end
        );
      },
      0
    );

    return Math.max(
      calculated,
      safeNumber(
        trace?.totalDurationMs
      ),
      1
    );
  }, [spans, trace?.totalDurationMs]);

  const totalDuration = safeNumber(
    trace?.totalDurationMs
  );

  /* =======================================================
     LOADING
  ====================================================== */

  if (loading) {
    return (
      <section
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-border
          bg-card
          p-5
          shadow-[var(--dashboard-shadow)]
          sm:p-6
        "
      >
        <TraceHeader
          traceId={null}
          totalDuration={0}
          loading
        />

        <div
          className="
            mt-5
            space-y-3
          "
        >
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="
                grid
                min-w-[680px]
                grid-cols-[150px_minmax(0,1fr)]
                items-center
                gap-4
              "
            >
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
              </div>

              <div className="h-9 animate-pulse rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* =======================================================
     EMPTY STATE
  ====================================================== */

  if (!trace || spans.length === 0) {
    return (
      <section
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-border
          bg-card
          p-5
          shadow-[var(--dashboard-shadow)]
          sm:p-6
        "
      >
        <TraceHeader
          traceId={trace?.traceId ?? null}
          totalDuration={totalDuration}
        />

        <div
          className="
            mt-5
            flex
            min-h-[280px]
            flex-col
            items-center
            justify-center
            rounded-[22px]
            border
            border-dashed
            border-border
            bg-muted/30
            p-6
            text-center
          "
        >
          <span
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-[var(--dashboard-primary-soft)]
              text-[var(--dashboard-primary)]
            "
          >
            <Clock3 className="h-5 w-5" />
          </span>

          <p className="mt-4 text-sm font-black text-card-foreground">
            No trace data available
          </p>

          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            Select a real trace from the live logs to inspect
            request timing and service execution.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="
        min-w-0
        overflow-hidden
        rounded-[28px]
        border
        border-border
        bg-card
        p-5
        shadow-[var(--dashboard-shadow)]
        transition-colors
        duration-300
        sm:p-6
      "
    >
      <TraceHeader
        traceId={trace.traceId}
        totalDuration={totalDuration}
      />

      {/* ===================================================
          WATERFALL
      ==================================================== */}

      <div
        className="
          hide-trace-scrollbar
          mt-5
          overflow-x-auto
          overflow-y-hidden
        "
      >
        <div className="min-w-[760px]">
          {/* Timeline header */}

          <div
            className="
              mb-3
              grid
              grid-cols-[150px_minmax(0,1fr)]
              gap-4
            "
          >
            <div />

            <div className="relative h-6">
              <TimelineMarker
                label="0ms"
                left="0%"
              />

              <TimelineMarker
                label={`${Math.round(
                  maxDuration / 4
                )}ms`}
                left="25%"
              />

              <TimelineMarker
                label={`${Math.round(
                  maxDuration / 2
                )}ms`}
                left="50%"
              />

              <TimelineMarker
                label={`${Math.round(
                  (maxDuration * 3) /
                    4
                )}ms`}
                left="75%"
              />

              <TimelineMarker
                label={`${Math.round(
                  maxDuration
                )}ms`}
                left="100%"
              />
            </div>
          </div>

          <div className="space-y-3">
            {spans.map(
              (
                span,
                index
              ) => {
                const duration =
                  safeNumber(
                    span.duration
                  );

                const startOffset =
                  Math.max(
                    0,
                    safeNumber(
                      span.startOffset
                    )
                  );

                const widthPct =
                  Math.max(
                    0.8,
                    (duration /
                      maxDuration) *
                      100
                  );

                const leftPct =
                  Math.min(
                    99.2,
                    (startOffset /
                      maxDuration) *
                      100
                  );

                const isError =
                  span.status ===
                  "error";

                const active =
                  activeIndex ===
                  index;

                return (
                  <motion.div
                    key={
                      span.id ??
                      `${span.service}-${index}`
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
                      duration:
                        0.25,
                      delay:
                        Math.min(
                          index *
                            0.04,
                          0.25
                        ),
                    }}
                    className="
                      grid
                      grid-cols-[150px_minmax(0,1fr)]
                      items-center
                      gap-4
                    "
                  >
                    {/* -------------------------------------
                        SERVICE
                    -------------------------------------- */}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            h-2
                            w-2
                            shrink-0
                            rounded-full
                            ${
                              isError
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                            }
                          `}
                        />

                        <p className="
                          truncate
                          text-xs
                          font-black
                          text-card-foreground
                        ">
                          {span.service}
                        </p>
                      </div>

                      <div className="
                        mt-1
                        flex
                        items-center
                        gap-2
                        text-[9px]
                        text-muted-foreground
                      ">
                        <span>
                          +{startOffset}ms
                        </span>

                        <span>•</span>

                        <span>
                          {isError
                            ? "Failed"
                            : "Success"}
                        </span>
                      </div>
                    </div>

                    {/* -------------------------------------
                        TIMELINE
                    -------------------------------------- */}

                    <button
                      type="button"
                      onMouseEnter={() =>
                        setActiveIndex(
                          index
                        )
                      }
                      onMouseLeave={() =>
                        setActiveIndex(
                          null
                        )
                      }
                      onFocus={() =>
                        setActiveIndex(
                          index
                        )
                      }
                      onBlur={() =>
                        setActiveIndex(
                          null
                        )
                      }
                      onClick={() =>
                        setActiveIndex(
                          active
                            ? null
                            : index
                        )
                      }
                      className="
                        relative
                        h-11
                        w-full
                        rounded-xl
                        border
                        border-border
                        bg-muted/35
                        text-left
                        outline-none
                        transition
                        hover:bg-muted/50
                        focus:ring-2
                        focus:ring-[var(--dashboard-primary)]/20
                      "
                      aria-label={`Inspect ${span.service} ${span.event}`}
                    >
                      {/* Grid lines */}

                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-1/4
                          w-px
                          bg-border/60
                        "
                      />

                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-1/2
                          w-px
                          bg-border/60
                        "
                      />

                      <span
                        className="
                          pointer-events-none
                          absolute
                          inset-y-0
                          left-3/4
                          w-px
                          bg-border/60
                        "
                      />

                      {/* Span */}

                      <motion.div
                        initial={{
                          width: 0,
                          opacity: 0,
                        }}
                        animate={{
                          width: `${widthPct}%`,
                          opacity: 1,
                        }}
                        transition={{
                          duration:
                            0.5,
                          delay:
                            Math.min(
                              index *
                                0.06,
                              0.35
                            ),
                          ease:
                            "easeOut",
                        }}
                        className={`
                          absolute
                          top-2
                          flex
                          h-7
                          min-w-[28px]
                          items-center
                          rounded-lg
                          px-2
                          shadow-sm
                          transition-all
                          ${
                            isError
                              ? "bg-gradient-to-r from-rose-500 to-orange-400"
                              : "bg-gradient-to-r from-indigo-500 to-violet-500"
                          }
                          ${
                            active
                              ? "shadow-[0_8px_25px_rgba(99,102,241,.25)] ring-2 ring-indigo-300/20"
                              : ""
                          }
                        `}
                        style={{
                          marginLeft: `${leftPct}%`,
                        }}
                      >
                        {active && (
                          <span
                            className="
                              truncate
                              text-[9px]
                              font-black
                              text-white
                            "
                          >
                            {duration}ms
                          </span>
                        )}
                      </motion.div>
                    </button>
                  </motion.div>
                );
              }
            )}
          </div>

          {/* Total duration line */}

          <div
            className="
              mt-5
              flex
              items-center
              justify-end
              border-t
              border-border
              pt-3
            "
          >
            <span
              className="
                rounded-full
                border
                border-[var(--dashboard-primary)]/15
                bg-[var(--dashboard-primary-soft)]
                px-3
                py-1.5
                text-[10px]
                font-black
                text-[var(--dashboard-primary)]
              "
            >
              {totalDuration}ms total
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================
          SELECTED SPAN
      ==================================================== */}

      {activeIndex !== null &&
        spans[activeIndex] && (
          <SelectedSpan
            span={
              spans[
                activeIndex
              ]!
            }
          />
        )}
    </section>
  );
}

/* =========================================================
   TRACE HEADER
========================================================= */

function TraceHeader({
  traceId,
  totalDuration,
  loading = false,
}: {
  traceId: string | null;
  totalDuration: number;
  loading?: boolean;
}) {
  return (
    <header
      className="
        flex
        flex-wrap
        items-start
        justify-between
        gap-4
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.16em]
            text-[var(--dashboard-primary)]
          "
        >
          Distributed trace
        </p>

        <h3 className="
          mt-1
          flex
          items-center
          gap-2
          text-lg
          font-black
          tracking-tight
          text-card-foreground
        ">
          <TimerReset
            className="
              h-4
              w-4
              text-[var(--dashboard-primary)]
            "
          />

          Request Waterfall
        </h3>

        <p className="
          mt-1
          max-w-2xl
          text-xs
          leading-5
          text-muted-foreground
        ">
          Inspect real backend trace spans,
          service timing and execution state.
        </p>

        {traceId && (
          <p className="
            mt-2
            max-w-full
            truncate
            font-mono
            text-[9px]
            text-muted-foreground/70
          ">
            Trace: {traceId}
          </p>
        )}
      </div>

      <span
        className="
          inline-flex
          shrink-0
          items-center
          gap-2
          rounded-full
          border
          border-[var(--dashboard-primary)]/15
          bg-[var(--dashboard-primary-soft)]
          px-3
          py-1.5
          text-[10px]
          font-black
          text-[var(--dashboard-primary)]
        "
      >
        <span
          className="
            h-1.5
            w-1.5
            rounded-full
            bg-[var(--dashboard-primary)]
          "
        />

        {loading
          ? "Loading..."
          : `${totalDuration}ms total`}
      </span>
    </header>
  );
}

/* =========================================================
   TIMELINE MARKER
========================================================= */

function TimelineMarker({
  label,
  left,
}: {
  label: string;
  left: string;
}) {
  return (
    <span
      className="
        absolute
        top-0
        -translate-x-1/2
        text-[8px]
        font-bold
        text-muted-foreground/60
      "
      style={{
        left,
      }}
    >
      {label}
    </span>
  );
}

/* =========================================================
   SELECTED SPAN
========================================================= */

function SelectedSpan({
  span,
}: {
  span: SystemTraceSpan;
}) {
  const isError =
    span.status === "error";

  return (
    <motion.div
      initial={{
        opacity: 0,
        height: 0,
      }}
      animate={{
        opacity: 1,
        height: "auto",
      }}
      className="
        mt-4
        overflow-hidden
        rounded-[20px]
        border
        border-border
        bg-muted/30
        p-4
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isError ? (
              <AlertCircle
                className="
                  h-4
                  w-4
                  text-[var(--dashboard-danger)]
                "
              />
            ) : (
              <CheckCircle2
                className="
                  h-4
                  w-4
                  text-[var(--dashboard-success)]
                "
              />
            )}

            <p className="
              text-xs
              font-black
              text-card-foreground
            ">
              {span.event}
            </p>
          </div>

          <p className="
            mt-1
            text-[10px]
            text-muted-foreground
          ">
            {span.service}
          </p>
        </div>

        <span
          className={`
            shrink-0
            rounded-full
            px-2.5
            py-1
            text-[9px]
            font-black
            ${
              isError
                ? "bg-[var(--dashboard-danger-soft)] text-[var(--dashboard-danger)]"
                : "bg-[var(--dashboard-success-soft)] text-[var(--dashboard-success)]"
            }
          `}
        >
          {isError
            ? "Failed"
            : "Success"}
        </span>
      </div>

      <div
        className="
          mt-4
          grid
          gap-2
          sm:grid-cols-3
        "
      >
        <InfoMetric
          label="Duration"
          value={`${safeNumber(
            span.duration
          )} ms`}
        />

        <InfoMetric
          label="Start offset"
          value={`+${safeNumber(
            span.startOffset
          )} ms`}
        />

        <InfoMetric
          label="Timestamp"
          value={formatTimestamp(
            span.timestamp
          )}
        />
      </div>
    </motion.div>
  );
}

/* =========================================================
   INFO METRIC
========================================================= */

function InfoMetric({
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
        border-border
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

      <p className="
        mt-1
        truncate
        text-[10px]
        font-black
        text-card-foreground
      ">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function safeNumber(
  value: unknown
): number {
  const parsed =
    Number(
      value ?? 0
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function formatTimestamp(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ).format(date);
}

export default TraceWaterfall;