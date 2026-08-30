"use client";

import React, {
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  TimerReset,
} from "lucide-react";

interface TraceSpan {
  service: string;
  duration: number;
  startOffset: number;
  status:
    | "ok"
    | "error";
}

const demoSpans:
  TraceSpan[] = [
  {
    service:
      "API Gateway",
    duration:
      42,
    startOffset:
      0,
    status:
      "ok",
  },
  {
    service:
      "Auth Service",
    duration:
      18,
    startOffset:
      42,
    status:
      "ok",
  },
  {
    service:
      "Wallet Validation",
    duration:
      64,
    startOffset:
      60,
    status:
      "ok",
  },
  {
    service:
      "Transfer Service",
    duration:
      188,
    startOffset:
      124,
    status:
      "error",
  },
  {
    service:
      "Database",
    duration:
      112,
    startOffset:
      140,
    status:
      "ok",
  },
];

export function TraceWaterfall() {
  const maxDuration =
    312;

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState<number | null>(
      null
    );

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,39,69,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500">
            Distributed trace
          </p>

          <h3 className="mt-1 flex items-center gap-2 text-lg font-black text-[#0F2745]">
            <TimerReset className="h-4 w-4 text-indigo-500" />
            Request Waterfall
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Hover a span to inspect its exact timing and execution state.
          </p>
        </div>

        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[10px] font-black text-indigo-600">
          {maxDuration}ms total
        </span>
      </div>

      <div className="mt-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="min-w-[700px] space-y-3">
          {demoSpans.map(
            (
              span,
              index
            ) => {
            const widthPct =
              (
                span.duration /
                maxDuration
              ) *
              100;

            const leftPct =
              (
                span.startOffset /
                maxDuration
              ) *
              100;

            const isError =
              span.status ===
              "error";

            const active =
              activeIndex ===
              index;

            return (
              <button
                type="button"
                key={
                  span.service
                }
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
                className="flex h-11 w-full items-center text-left"
              >
                <div className="w-36 shrink-0 pr-4">
                  <p className="truncate text-xs font-bold text-slate-700">
                    {span.service}
                  </p>

                  <p className="mt-0.5 text-[9px] text-slate-400">
                    +{span.startOffset}ms
                  </p>
                </div>

                <div className="relative h-9 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <motion.div
                    initial={{
                      width: 0,
                      opacity: 0,
                    }}
                    animate={{
                      width:
                        `${widthPct}%`,

                      opacity:
                        1,
                    }}
                    transition={{
                      delay:
                        index *
                        0.08,

                      duration:
                        0.45,
                    }}
                    style={{
                      marginLeft:
                        `${leftPct}%`,
                    }}
                    className={`absolute top-1.5 flex h-6 min-w-[30px] items-center justify-center rounded-lg px-2 text-[9px] font-black text-white transition ${
                      isError
                        ? "bg-gradient-to-r from-rose-500 to-orange-400"
                        : "bg-gradient-to-r from-blue-600 to-cyan-400"
                    } ${
                      active
                        ? "shadow-lg"
                        : ""
                    }`}
                  >
                    {active
                      ? `${span.duration}ms`
                      : ""}
                  </motion.div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
