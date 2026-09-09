"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type {
  SystemAnomaly,
  LogService,
} from "@/lib/api/systemlogApi";

/* =========================================================
   PROPS
========================================================= */

interface ErrorSpikeDetectorProps {
  anomalies?: SystemAnomaly[];
  loading?: boolean;
  onInvestigate?: (
    anomaly: SystemAnomaly
  ) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export function ErrorSpikeDetector({
  anomalies = [],
  loading = false,
  onInvestigate,
}: ErrorSpikeDetectorProps) {
  const [
    severity,
    setSeverity,
  ] = useState<"all" | "high" | "medium">("all");

  const [
    expanded,
    setExpanded,
  ] = useState<number | null>(null);

  /* =======================================================
     FILTER
  ====================================================== */

  const filteredAnomalies = useMemo(() => {
    if (severity === "all") {
      return anomalies;
    }

    return anomalies.filter(
      (item) =>
        item.severity === severity
    );
  }, [
    anomalies,
    severity,
  ]);

  /* =======================================================
     SUMMARY
  ====================================================== */

  const highCount = anomalies.filter(
    (item) =>
      item.severity === "high"
  ).length;

  const mediumCount = anomalies.filter(
    (item) =>
      item.severity === "medium"
  ).length;

  /* =======================================================
     EMPTY / LOADING
  ====================================================== */

  return (
    <section
      className="
        min-w-0
        overflow-hidden
        rounded-[28px]
        border
        border-indigo-500/15
        bg-gradient-to-br
        from-indigo-950
        via-violet-950
        to-[#17102D]
        p-5
        text-white
        shadow-[0_24px_70px_rgba(49,32,96,.16)]
        sm:p-6
      "
    >
      {/* ===================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-amber-300/15
                bg-amber-300/10
                px-3
                py-1.5
                text-[9px]
                font-black
                uppercase
                tracking-[0.16em]
                text-amber-200
              "
            >
              <Zap className="h-3.5 w-3.5" />
              Anomaly intelligence
            </span>

            <h3
              className="
                mt-3
                flex
                items-center
                gap-2
                text-xl
                font-black
                tracking-tight
                sm:text-2xl
              "
            >
              <TrendingUp className="h-5 w-5 text-indigo-300" />
              Error Spike Detector
            </h3>

            <p
              className="
                mt-1.5
                max-w-2xl
                text-xs
                leading-5
                text-indigo-100/50
              "
            >
              Detect real changes in backend error rates and
              latency by comparing the current window with its
              previous baseline.
            </p>
          </div>

          {/* Summary */}

          <div className="flex flex-wrap gap-2">
            <SummaryBadge
              label="High"
              value={highCount}
              tone="high"
            />

            <SummaryBadge
              label="Medium"
              value={mediumCount}
              tone="medium"
            />
          </div>
        </div>

        {/* =================================================
            FILTER
        ================================================== */}

        <div className="flex items-center justify-between gap-3">
          <p className="
            text-[9px]
            font-bold
            uppercase
            tracking-[0.12em]
            text-indigo-100/30
          ">
            {anomalies.length.toLocaleString()} signal
            {anomalies.length === 1 ? "" : "s"} detected
          </p>

          <div
            className="
              flex
              rounded-xl
              border
              border-white/10
              bg-white/[0.04]
              p-1
            "
          >
            {(
              ["all", "high", "medium"] as const
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setSeverity(item)
                }
                className={`
                  rounded-lg
                  px-3
                  py-1.5
                  text-[8px]
                  font-black
                  uppercase
                  tracking-wide
                  transition
                  ${
                    severity === item
                      ? "bg-white text-indigo-950 shadow-sm"
                      : "text-indigo-100/40 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================
          CONTENT
      ==================================================== */}

      <div className="mt-5">
        {loading ? (
          <LoadingAnomalies />
        ) : filteredAnomalies.length === 0 ? (
          <EmptyAnomalies
            hasData={
              anomalies.length > 0
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredAnomalies.map(
              (
                anomaly,
                index
              ) => {
                const open =
                  expanded === index;

                return (
                  <AnomalyItem
                    key={`${anomaly.service}-${anomaly.type}-${index}`}
                    anomaly={anomaly}
                    open={open}
                    index={index}
                    onToggle={() =>
                      setExpanded(
                        open
                          ? null
                          : index
                      )
                    }
                    onInvestigate={() =>
                      onInvestigate?.(
                        anomaly
                      )
                    }
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   ANOMALY ITEM
========================================================= */

function AnomalyItem({
  anomaly,
  open,
  index,
  onToggle,
  onInvestigate,
}: {
  anomaly: SystemAnomaly;
  open: boolean;
  index: number;
  onToggle: () => void;
  onInvestigate: () => void;
}) {
  const isErrorRate =
    anomaly.type ===
    "error_rate";

  const changeLabel =
    formatChange(
      anomaly.changePct
    );

  const currentLabel =
    isErrorRate
      ? `${anomaly.current.toFixed(2)}% error rate`
      : `${Math.round(anomaly.current)} ms latency`;

  const baselineLabel =
    isErrorRate
      ? `${anomaly.baseline.toFixed(2)}% baseline`
      : `${Math.round(anomaly.baseline)} ms baseline`;

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
        delay: Math.min(
          index * 0.04,
          0.25
        ),
      }}
      className="
        overflow-hidden
        rounded-[20px]
        border
        border-white/10
        bg-white/[0.035]
        transition
      "
    >
      <button
        type="button"
        onClick={onToggle}
        className="
          flex
          w-full
          items-start
          justify-between
          gap-4
          p-4
          text-left
          transition
          hover:bg-white/[0.035]
        "
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-400/10
                text-indigo-200
              "
            >
              {isErrorRate ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>

            <span
              className="
                text-xs
                font-black
                text-white
              "
            >
              {anomaly.service}
            </span>

            <SeverityBadge
              severity={
                anomaly.severity
              }
            />

            <TypeBadge
              type={
                anomaly.type
              }
            />
          </div>

          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              gap-x-3
              gap-y-1.5
            "
          >
            <span
              className="
                text-sm
                font-black
                text-indigo-100
              "
            >
              {changeLabel}
            </span>

            <span className="
              text-[10px]
              text-indigo-100/35
            ">
              current:
            </span>

            <span className="
              text-[10px]
              font-bold
              text-indigo-100/60
            ">
              {currentLabel}
            </span>

            <span className="
              text-indigo-100/20
            ">
              •
            </span>

            <span className="
              text-[10px]
              font-medium
              text-indigo-100/35
            ">
              {baselineLabel}
            </span>
          </div>

          <p
            className="
              mt-2
              text-[10px]
              leading-5
              text-indigo-100/40
            "
          >
            {anomaly.message}
          </p>
        </div>

        <ChevronDown
          className={`
            mt-1
            h-4
            w-4
            shrink-0
            text-indigo-100/35
            transition
            ${
              open
                ? "rotate-180 text-indigo-200"
                : ""
            }
          `}
        />
      </button>

      {/* =================================================
          EXPANDED DETAILS
      ================================================== */}

      <AnimatePresence initial={false}>
        {open && (
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
            transition={{
              duration: 0.2,
            }}
            className="
              border-t
              border-white/10
              bg-black/10
            "
          >
            <div className="p-4">
              <div
                className="
                  grid
                  gap-2
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >
                <Metric
                  label="Service"
                  value={anomaly.service}
                />

                <Metric
                  label="Signal"
                  value={
                    isErrorRate
                      ? "Error rate"
                      : "Latency"
                  }
                />

                <Metric
                  label="Change"
                  value={changeLabel}
                />

                <Metric
                  label="Current"
                  value={
                    isErrorRate
                      ? `${anomaly.current.toFixed(
                          2
                        )}%`
                      : `${Math.round(
                          anomaly.current
                        )} ms`
                  }
                />

                <Metric
                  label="Baseline"
                  value={
                    isErrorRate
                      ? `${anomaly.baseline.toFixed(
                          2
                        )}%`
                      : `${Math.round(
                          anomaly.baseline
                        )} ms`
                  }
                />

                <Metric
                  label="Severity"
                  value={
                    anomaly.severity
                  }
                />
              </div>

              <button
                type="button"
                onClick={onInvestigate}
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-xl
                  border
                  border-indigo-300/10
                  bg-indigo-400/10
                  px-3
                  py-2
                  text-[9px]
                  font-black
                  text-indigo-200
                  transition
                  hover:bg-indigo-400/15
                  hover:text-white
                "
              >
                Investigate signal
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================================================
   SUMMARY BADGE
========================================================= */

function SummaryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "high" | "medium";
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        px-3
        py-2
        ${
          tone === "high"
            ? "border-rose-300/10 bg-rose-400/10"
            : "border-amber-300/10 bg-amber-400/10"
        }
      `}
    >
      <p
        className={`
          text-[8px]
          font-black
          uppercase
          tracking-wide
          ${
            tone === "high"
              ? "text-rose-200/50"
              : "text-amber-200/50"
          }
        `}
      >
        {label}
      </p>

      <p
        className={`
          mt-0.5
          text-lg
          font-black
          ${
            tone === "high"
              ? "text-rose-200"
              : "text-amber-200"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SEVERITY
========================================================= */

function SeverityBadge({
  severity,
}: {
  severity: SystemAnomaly["severity"];
}) {
  return (
    <span
      className={`
        rounded-full
        border
        px-2
        py-1
        text-[8px]
        font-black
        uppercase
        tracking-wide
        ${
          severity === "high"
            ? "border-rose-300/15 bg-rose-400/10 text-rose-200"
            : "border-amber-300/15 bg-amber-400/10 text-amber-200"
        }
      `}
    >
      {severity}
    </span>
  );
}

/* =========================================================
   TYPE BADGE
========================================================= */

function TypeBadge({
  type,
}: {
  type: SystemAnomaly["type"];
}) {
  return (
    <span
      className="
        rounded-full
        border
        border-indigo-300/10
        bg-indigo-400/10
        px-2
        py-1
        text-[8px]
        font-black
        uppercase
        tracking-wide
        text-indigo-200
      "
    >
      {type ===
      "error_rate"
        ? "Error rate"
        : "Latency"}
    </span>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
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
        border-white/10
        bg-white/[0.025]
        p-3
      "
    >
      <p
        className="
          text-[8px]
          font-black
          uppercase
          tracking-[0.1em]
          text-indigo-100/30
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-[10px]
          font-black
          text-indigo-50/75
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyAnomalies({
  hasData,
}: {
  hasData: boolean;
}) {
  return (
    <div
      className="
        flex
        min-h-[240px]
        flex-col
        items-center
        justify-center
        rounded-[20px]
        border
        border-dashed
        border-white/10
        bg-white/[0.02]
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
          bg-emerald-400/10
          text-emerald-300
        "
      >
        <TrendingUp className="h-5 w-5" />
      </span>

      <p className="
        mt-4
        text-sm
        font-black
        text-white
      ">
        {hasData
          ? "No anomalies match this filter"
          : "No anomalies detected"}
      </p>

      <p className="
        mt-1
        max-w-md
        text-xs
        leading-5
        text-indigo-100/40
      ">
        {hasData
          ? "Try another severity filter to see available signals."
          : "The current backend comparison window has not detected a significant error-rate or latency increase."}
      </p>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingAnomalies() {
  return (
    <div className="space-y-3">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="
            h-28
            animate-pulse
            rounded-[20px]
            border
            border-white/5
            bg-white/[0.035]
          "
        />
      ))}
    </div>
  );
}

/* =========================================================
   FORMAT
========================================================= */

function formatChange(
  value: number
): string {
  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}${value.toFixed(
    2
  )}%`;
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default ErrorSpikeDetector;