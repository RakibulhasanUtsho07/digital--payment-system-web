"use client";

import React, {
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  Database,
  Globe,
  Server,
} from "lucide-react";

const causeNodes = [
  {
    id: 1,
    service:
      "Transfer Service",
    event:
      "Transaction Failed",
    type:
      "error",
    icon:
      Server,
    detail:
      "A transfer request crossed the error threshold after repeated state checks.",
  },
  {
    id: 2,
    service:
      "Wallet Service",
    event:
      "State Unavailable",
    type:
      "warn",
    icon:
      Globe,
    detail:
      "Wallet state could not be confirmed inside the expected latency budget.",
  },
  {
    id: 3,
    service:
      "Database",
    event:
      "Connection Timeout",
    type:
      "critical",
    icon:
      Database,
    detail:
      "The correlated request ended after database connection acquisition exceeded its timeout.",
  },
];

export function RootCauseExplorer() {
  const [
    activeId,
    setActiveId,
  ] =
    useState(
      causeNodes[
        causeNodes.length -
          1
      ]?.id ??
        1
    );

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_45px_rgba(15,39,69,0.05)]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500">
          Correlation path
        </p>

        <h3 className="mt-1 text-lg font-black text-[#0F2745]">
          Root Cause Explorer
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Follow a correlated failure chain and inspect each contributing event.
        </p>
      </div>

      <div className="relative mt-5 pl-5">
        {causeNodes.map(
          (
            node,
            index
          ) => {
            const Icon =
              node.icon;

            const isLast =
              index ===
              causeNodes.length -
                1;

            const active =
              node.id ===
              activeId;

            return (
              <div
                key={
                  node.id
                }
                className="relative pb-5 last:pb-0"
              >
                {!isLast && (
                  <motion.div
                    initial={{
                      height: 0,
                    }}
                    animate={{
                      height:
                        "100%",
                    }}
                    transition={{
                      duration:
                        0.5,

                      delay:
                        index *
                        0.15,
                    }}
                    className="absolute left-[13px] top-8 w-px bg-gradient-to-b from-blue-300 to-slate-200"
                  />
                )}

                <motion.button
                  type="button"
                  onClick={() =>
                    setActiveId(
                      node.id
                    )
                  }
                  initial={{
                    opacity: 0,
                    x: -8,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.1,
                  }}
                  className={`relative z-10 flex w-full items-start gap-3 rounded-[20px] border p-3 text-left transition ${
                    active
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 bg-slate-50/70 hover:bg-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                      node.type ===
                      "critical"
                        ? "border-rose-200 bg-rose-50 text-rose-500"
                        : node.type ===
                            "warn"
                          ? "border-amber-200 bg-amber-50 text-amber-500"
                          : "border-blue-200 bg-blue-50 text-blue-500"
                    }`}
                  >
                    {node.type ===
                    "critical" ? (
                      <AlertCircle className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />

                      <span className="text-xs font-black text-slate-800">
                        {node.service}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {node.event}
                    </p>

                    {active && (
                      <motion.p
                        initial={{
                          opacity: 0,
                          y: 4,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="mt-2 text-[11px] leading-5 text-blue-800"
                      >
                        {node.detail}
                      </motion.p>
                    )}
                  </div>
                </motion.button>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}
