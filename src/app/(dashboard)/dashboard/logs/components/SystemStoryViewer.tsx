"use client";

import React, {
  useEffect,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
  XCircle,
} from "lucide-react";

interface SystemStoryViewerProps {
  onClose:
    () => void;
}

const storySteps = [
  {
    id: 1,
    title:
      "Request Arrives",
    service:
      "API Gateway",
    status:
      "success",
    duration:
      "12ms",
  },
  {
    id: 2,
    title:
      "Authentication",
    service:
      "Auth Service",
    status:
      "success",
    duration:
      "18ms",
  },
  {
    id: 3,
    title:
      "Wallet Validation",
    service:
      "Wallet Service",
    status:
      "success",
    duration:
      "45ms",
  },
  {
    id: 4,
    title:
      "Transaction Processing",
    service:
      "Transfer Service",
    status:
      "processing",
    duration:
      "---",
  },
  {
    id: 5,
    title:
      "Database Write",
    service:
      "Database",
    status:
      "failed",
    duration:
      "5000ms timeout",
  },
  {
    id: 6,
    title:
      "Failure Notification",
    service:
      "Notification",
    status:
      "success",
    duration:
      "32ms",
  },
];

export function SystemStoryViewer({
  onClose,
}: SystemStoryViewerProps) {
  const [
    currentStep,
    setCurrentStep,
  ] =
    useState(
      0
    );

  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(
      true
    );

  useEffect(
    () => {
      if (
        !isPlaying
      ) {
        return;
      }

      const timer =
        setInterval(
          () => {
            setCurrentStep(
              (
                previous
              ) => {
                if (
                  previous >=
                  storySteps.length -
                    1
                ) {
                  setIsPlaying(
                    false
                  );

                  return previous;
                }

                return (
                  previous +
                  1
                );
              }
            );
          },
          1500
        );

      return () =>
        clearInterval(
          timer
        );
    },
    [isPlaying]
  );

  return (
    <AnimatePresence>
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
        className="fixed inset-0 z-[70] flex flex-col bg-[#06101F]/95 backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-[#07172B] p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-white">
                System Story Mode
              </h2>

              <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-1 text-[9px] font-black text-cyan-200">
                Interactive Trace
              </span>
            </div>

            <p className="mt-1 text-xs text-blue-100/50">
              Trace ID: trace_73a8f9b2
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-blue-100/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-300"
                animate={{
                  width:
                    `${(
                      (
                        currentStep +
                        1
                      ) /
                      storySteps.length
                    ) *
                    100}%`,
                }}
              />
            </div>

            <div className="mt-8 space-y-4">
              {storySteps.map(
                (
                  step,
                  index
                ) => {
                  const active =
                    index ===
                    currentStep;

                  const past =
                    index <
                    currentStep;

                  if (
                    index >
                    currentStep
                  ) {
                    return null;
                  }

                  return (
                    <motion.div
                      key={
                        step.id
                      }
                      initial={{
                        opacity: 0,
                        y: 16,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className={`flex items-center gap-4 rounded-[22px] border p-4 ${
                        active
                          ? "border-cyan-300/25 bg-[#0B2038] shadow-[0_0_40px_rgba(34,211,238,0.08)]"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex w-10 justify-center">
                        {step.status ===
                        "failed" ? (
                          <XCircle className="h-7 w-7 text-rose-400" />
                        ) : step.status ===
                            "processing" &&
                          active ? (
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                        ) : (
                          <CheckCircle2
                            className={`h-7 w-7 ${
                              past
                                ? "text-emerald-400"
                                : "text-blue-100/30"
                            }`}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-100/45">
                          {step.service}
                        </p>

                        <p
                          className={`mt-1 text-sm font-black ${
                            active
                              ? "text-white"
                              : "text-blue-100/70"
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>

                      <div className="text-right text-[10px] font-mono text-blue-100/50">
                        {step.duration}
                      </div>
                    </motion.div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-5 border-t border-white/10 bg-[#07172B] p-5">
          <button
            type="button"
            onClick={() =>
              setCurrentStep(
                Math.max(
                  0,
                  currentStep -
                    1
                )
              )
            }
            disabled={
              currentStep ===
              0
            }
            className="rounded-full border border-white/10 bg-white/5 p-3 text-blue-100/70 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setIsPlaying(
                (
                  current
                ) =>
                  !current
              )
            }
            className="rounded-full bg-cyan-300 p-4 text-[#082238]"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setCurrentStep(
                Math.min(
                  storySteps.length -
                    1,
                  currentStep +
                    1
                )
              )
            }
            disabled={
              currentStep ===
              storySteps.length -
                1
            }
            className="rounded-full border border-white/10 bg-white/5 p-3 text-blue-100/70 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
