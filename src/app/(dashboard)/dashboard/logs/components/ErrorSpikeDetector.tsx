"use client";

import React, {
  useMemo,
  useState,
} from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

interface Spike {
  service: string;
  change: string;
  time: string;
  severity:
    | "high"
    | "medium";
  suggestedAction: string;
  metric: string;
}

const spikes:
  Spike[] = [
  {
    service:
      "Transfer Service",
    change:
      "+48% errors",
    time:
      "12m ago",
    severity:
      "high",
    suggestedAction:
      "Check wallet balance lock contention and database connection pool.",
    metric:
      "4.80% error rate",
  },
  {
    service:
      "KYC Service",
    change:
      "+31% latency",
    time:
      "25m ago",
    severity:
      "medium",
    suggestedAction:
      "Verify OCR provider health and recent request latency.",
    metric:
      "420ms latency",
  },
  {
    service:
      "Notification Queue",
    change:
      "+18% retries",
    time:
      "42m ago",
    severity:
      "medium",
    suggestedAction:
      "Inspect downstream gateway throttling and retry pressure.",
    metric:
      "18% retry increase",
  },
];

export function ErrorSpikeDetector() {
  const [
    severity,
    setSeverity,
  ] =
    useState<
      "all"
      | "high"
      | "medium"
    >("all");

  const [
    expanded,
    setExpanded,
  ] =
    useState<
      string | null
    >(null);

  const filtered =
    useMemo(
      () =>
        spikes.filter(
          (spike) =>
            severity ===
              "all" ||
            spike.severity ===
              severity
        ),
      [severity]
    );

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,39,69,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500">
            Anomaly intelligence
          </p>

          <h3 className="mt-1 flex items-center gap-2 text-lg font-black text-[#0F2745]">
            <Zap className="h-4 w-4 text-amber-500" />
            Error Spike Detector
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Explore unusual service movement and recommended investigation paths.
          </p>
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {[
            "all",
            "high",
            "medium",
          ].map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setSeverity(
                    value as typeof severity
                  )
                }
                className={`rounded-lg px-3 py-1.5 text-[9px] font-black uppercase transition ${
                  severity ===
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

      <div className="mt-5 space-y-3">
        {filtered.map(
          (
            spike,
            index
          ) => {
            const open =
              expanded ===
              spike.service;

            return (
              <motion.div
                key={
                  spike.service
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
                    0.04,
                }}
                className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50/70"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(
                      open
                        ? null
                        : spike.service
                    )
                  }
                  className="flex w-full items-start justify-between gap-4 p-4 text-left"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        {spike.service}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-black ${
                          spike.severity ===
                          "high"
                            ? "border-rose-100 bg-rose-50 text-rose-600"
                            : "border-amber-100 bg-amber-50 text-amber-600"
                        }`}
                      >
                        {spike.change}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {spike.time}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      {spike.metric}
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                      open
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

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
                    className="border-t border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-xs leading-5 text-slate-600">
                      {spike.suggestedAction}
                    </p>

                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-blue-600"
                    >
                      Investigate
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            );
          }
        )}
      </div>
    </section>
  );
}
