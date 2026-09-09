"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Pause,
  Play,
  Server,
  Timer,
  X,
  XCircle,
} from "lucide-react";

import type {
  SystemTraceData,
  SystemTraceSpan,
} from "@/lib/api/systemlogApi";

/* =========================================================
   TYPES
========================================================= */

interface SystemStoryViewerProps {
  trace: SystemTraceData | null;
  onClose: () => void;
  loading?: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

export function SystemStoryViewer({
  trace,
  onClose,
  loading = false,
}: SystemStoryViewerProps) {
  const [currentStep, setCurrentStep] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(true);

  /* =======================================================
     NORMALIZED SPANS
  ====================================================== */

  const spans =
    useMemo<SystemTraceSpan[]>(
      () =>
        Array.isArray(
          trace?.spans
        )
          ? trace.spans
          : [],
      [trace]
    );

  /* =======================================================
     RESET WHEN TRACE CHANGES
  ====================================================== */

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(
      spans.length > 1
    );
  }, [trace?.traceId, spans.length]);

  /* =======================================================
     AUTO PLAY
  ====================================================== */

  useEffect(() => {
    if (
      !isPlaying ||
      spans.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setCurrentStep((previous) => {
          if (
            previous >=
            spans.length - 1
          ) {
            setIsPlaying(false);
            return previous;
          }

          return previous + 1;
        });
      }, 1400);

    return () =>
      window.clearInterval(
        timer
      );
  }, [isPlaying, spans.length]);

  /* =======================================================
     SAFE CURRENT SPAN
  ====================================================== */

  const currentSpan =
    spans[
      Math.min(
        currentStep,
        Math.max(
          0,
          spans.length - 1
        )
      )
    ] ?? null;

  /* =======================================================
     PROGRESS
  ====================================================== */

  const progress =
    spans.length > 0
      ? ((currentStep + 1) /
          spans.length) *
        100
      : 0;

  /* =======================================================
     KEYBOARD ESC
  ====================================================== */

  useEffect(() => {
    const onKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key === "Escape"
        ) {
          onClose();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          setCurrentStep(
            (previous) =>
              Math.max(
                0,
                previous - 1
              )
          );
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          setCurrentStep(
            (previous) =>
              Math.min(
                spans.length - 1,
                previous + 1
              )
          );
        }

        if (
          event.key === " "
        ) {
          event.preventDefault();

          setIsPlaying(
            (previous) =>
              !previous
          );
        }
      };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [onClose, spans.length]);

  /* =======================================================
     RENDER
  ====================================================== */

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
        className="
          fixed
          inset-0
          z-[140]
          flex
          flex-col
          overflow-hidden
          bg-[#060B18]/95
          text-white
          backdrop-blur-xl
        "
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <header
          className="
            shrink-0
            border-b
            border-white/10
            bg-[#091028]
          "
        >
          <div
            className="
              mx-auto
              flex
              w-full
              max-w-[1450px]
              items-center
              justify-between
              gap-4
              px-4
              py-4
              sm:px-6
              sm:py-5
              lg:px-8
            "
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-indigo-300/15
                    bg-indigo-300/10
                    px-3
                    py-1.5
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-indigo-200
                  "
                >
                  <Activity className="h-3.5 w-3.5" />
                  Interactive Trace
                </span>

                {trace && (
                  <span
                    className="
                      rounded-full
                      border
                      border-white/10
                      bg-white/[0.04]
                      px-3
                      py-1.5
                      text-[9px]
                      font-bold
                      text-blue-100/55
                    "
                  >
                    {spans.length} span
                    {spans.length === 1
                      ? ""
                      : "s"}
                  </span>
                )}
              </div>

              <h2 className="
                mt-2
                text-lg
                font-black
                tracking-tight
                sm:text-xl
              ">
                System Story Mode
              </h2>

              <p className="
                mt-1
                truncate
                text-[10px]
                text-blue-100/45
                sm:text-xs
              ">
                Trace ID:{" "}
                {trace?.traceId ??
                  "Loading trace..."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
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
                bg-white/[0.04]
                text-blue-100/65
                transition
                hover:bg-white/10
                hover:text-white
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-300/20
              "
              aria-label="Close system story viewer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* =================================================
            BODY
        ================================================== */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-[1100px]
              px-4
              py-5
              sm:px-6
              sm:py-8
              lg:px-8
            "
          >
            {/* =================================================
                PROGRESS
            ================================================== */}

            <div
              className="
                overflow-hidden
                rounded-full
                bg-white/10
              "
            >
              <motion.div
                className="
                  h-1
                  rounded-full
                  bg-gradient-to-r
                  from-indigo-500
                  via-violet-400
                  to-cyan-300
                "
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                }}
              />
            </div>

            {/* =================================================
                TRACE SUMMARY
            ================================================== */}

            {trace && (
              <div
                className="
                  mt-5
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >
                <SummaryCard
                  icon={Server}
                  label="Trace spans"
                  value={String(
                    spans.length
                  )}
                />

                <SummaryCard
                  icon={Timer}
                  label="Total duration"
                  value={`${safeNumber(
                    trace.totalDurationMs
                  )} ms`}
                />

                <SummaryCard
                  icon={Activity}
                  label="Current step"
                  value={
                    spans.length
                      ? `${currentStep + 1}/${spans.length}`
                      : "0/0"
                  }
                />
              </div>
            )}

            {/* =================================================
                LOADING
            ================================================== */}

            {loading && (
              <div
                className="
                  mt-6
                  rounded-[24px]
                  border
                  border-white/10
                  bg-white/[0.04]
                  p-6
                "
              >
                <div className="
                  flex
                  min-h-[280px]
                  flex-col
                  items-center
                  justify-center
                ">
                  <div className="
                    h-10
                    w-10
                    animate-spin
                    rounded-full
                    border-2
                    border-indigo-300/15
                    border-t-indigo-300
                  " />

                  <p className="
                    mt-4
                    text-xs
                    font-semibold
                    text-blue-100/50
                  ">
                    Loading live trace...
                  </p>
                </div>
              </div>
            )}

            {/* =================================================
                EMPTY
            ================================================== */}

            {!loading &&
              spans.length === 0 && (
                <div
                  className="
                    mt-6
                    flex
                    min-h-[320px]
                    flex-col
                    items-center
                    justify-center
                    rounded-[24px]
                    border
                    border-dashed
                    border-white/10
                    bg-white/[0.03]
                    p-8
                    text-center
                  "
                >
                  <span
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-indigo-500/10
                      text-indigo-300
                    "
                  >
                    <CircleAlert className="h-6 w-6" />
                  </span>

                  <h3 className="
                    mt-4
                    text-sm
                    font-black
                    text-white
                  ">
                    No trace events
                  </h3>

                  <p className="
                    mt-2
                    max-w-md
                    text-xs
                    leading-5
                    text-blue-100/45
                  ">
                    The backend did not return any
                    events for this trace.
                  </p>
                </div>
              )}

            {/* =================================================
                STORY
            ================================================== */}

            {!loading &&
              spans.length > 0 && (
                <div className="mt-6 space-y-3">
                  {spans.map(
                    (
                      span,
                      index
                    ) => {
                      const active =
                        index ===
                        currentStep;

                      const past =
                        index <
                        currentStep;

                      const failed =
                        span.status ===
                        "error";

                      return (
                        <motion.button
                          key={
                            span.id ??
                            `${span.service}-${index}`
                          }
                          type="button"
                          onClick={() =>
                            setCurrentStep(
                              index
                            )
                          }
                          initial={{
                            opacity: 0,
                            y: 12,
                          }}
                          animate={{
                            opacity:
                              index <=
                              currentStep
                                ? 1
                                : 0.42,
                            y: 0,
                          }}
                          transition={{
                            duration:
                              0.22,
                            delay:
                              Math.min(
                                index *
                                  0.035,
                                0.2
                              ),
                          }}
                          className={`
                            group
                            flex
                            w-full
                            items-center
                            gap-3
                            rounded-[22px]
                            border
                            p-3
                            text-left
                            transition-all
                            sm:gap-4
                            sm:p-4
                            ${
                              active
                                ? failed
                                  ? "border-rose-400/25 bg-rose-400/[0.07] shadow-[0_0_40px_rgba(244,63,94,.08)]"
                                  : "border-indigo-300/25 bg-indigo-400/[0.08] shadow-[0_0_40px_rgba(99,102,241,.10)]"
                                : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                            }
                          `}
                        >
                          {/* Step state */}

                          <div className="
                            flex
                            w-9
                            shrink-0
                            justify-center
                            sm:w-11
                          ">
                            {failed ? (
                              <XCircle
                                className={`
                                  h-6
                                  w-6
                                  ${
                                    active
                                      ? "text-rose-300"
                                      : "text-rose-400/65"
                                  }
                                `}
                              />
                            ) : active ? (
                              <motion.div
                                animate={{
                                  scale: [
                                    1,
                                    1.1,
                                    1,
                                  ],
                                }}
                                transition={{
                                  duration:
                                    1.25,
                                  repeat:
                                    Infinity,
                                }}
                                className="
                                  flex
                                  h-6
                                  w-6
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-indigo-400/15
                                  text-indigo-300
                                "
                              >
                                <span className="
                                  h-2.5
                                  w-2.5
                                  rounded-full
                                  bg-indigo-300
                                " />
                              </motion.div>
                            ) : (
                              <CheckCircle2
                                className={`
                                  h-6
                                  w-6
                                  ${
                                    past
                                      ? "text-emerald-400"
                                      : "text-blue-100/20"
                                  }
                                `}
                              />
                            )}
                          </div>

                          {/* Content */}

                          <div className="min-w-0 flex-1">
                            <div className="
                              flex
                              flex-wrap
                              items-center
                              gap-2
                            ">
                              <span className="
                                max-w-[180px]
                                truncate
                                text-[9px]
                                font-black
                                uppercase
                                tracking-[0.13em]
                                text-blue-100/45
                              ">
                                {span.service}
                              </span>

                              {failed && (
                                <span className="
                                  rounded-full
                                  border
                                  border-rose-300/15
                                  bg-rose-300/10
                                  px-2
                                  py-1
                                  text-[8px]
                                  font-black
                                  uppercase
                                  tracking-wider
                                  text-rose-300
                                ">
                                  Error
                                </span>
                              )}
                            </div>

                            <p
                              className={`
                                mt-1
                                truncate
                                text-sm
                                font-black
                                ${
                                  active
                                    ? "text-white"
                                    : "text-blue-100/70"
                                }
                              `}
                            >
                              {span.event}
                            </p>

                            <div className="
                              mt-1
                              flex
                              flex-wrap
                              items-center
                              gap-3
                              text-[9px]
                              text-blue-100/40
                            ">
                              <span>
                                Start +{safeNumber(
                                  span.startOffset
                                )}
                                ms
                              </span>

                              <span>
                                Timestamp{" "}
                                {formatTime(
                                  span.timestamp
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Duration */}

                          <div className="
                            shrink-0
                            text-right
                          ">
                            <p
                              className={`
                                text-[10px]
                                font-black
                                ${
                                  failed
                                    ? "text-rose-300"
                                    : active
                                      ? "text-indigo-200"
                                      : "text-blue-100/50"
                                }
                              `}
                            >
                              {safeNumber(
                                span.duration
                              )}
                              ms
                            </p>

                            <p className="
                              mt-1
                              text-[8px]
                              uppercase
                              tracking-wider
                              text-blue-100/30
                            ">
                              Duration
                            </p>
                          </div>
                        </motion.button>
                      );
                    }
                  )}
                </div>
              )}

            {/* =================================================
                CURRENT STEP DETAIL
            ================================================== */}

            {!loading &&
              currentSpan && (
                <motion.div
                  key={
                    currentSpan.id
                  }
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
                    rounded-[24px]
                    border
                    border-indigo-300/10
                    bg-gradient-to-br
                    from-indigo-500/[0.08]
                    via-violet-500/[0.05]
                    to-transparent
                    p-4
                    sm:p-5
                  "
                >
                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-4
                  ">
                    <div className="min-w-0">
                      <p className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.15em]
                        text-indigo-300/60
                      ">
                        Current trace event
                      </p>

                      <h3 className="
                        mt-1
                        truncate
                        text-base
                        font-black
                        text-white
                      ">
                        {currentSpan.event}
                      </h3>

                      <p className="
                        mt-1
                        truncate
                        text-[10px]
                        text-blue-100/45
                      ">
                        {currentSpan.service}
                      </p>
                    </div>

                    <span
                      className={`
                        shrink-0
                        rounded-full
                        px-2.5
                        py-1
                        text-[8px]
                        font-black
                        uppercase
                        ${
                          currentSpan.status ===
                          "error"
                            ? "bg-rose-400/10 text-rose-300"
                            : "bg-emerald-400/10 text-emerald-300"
                        }
                      `}
                    >
                      {currentSpan.status ===
                      "error"
                        ? "Failed"
                        : "Success"}
                    </span>
                  </div>

                  <div className="
                    mt-4
                    grid
                    gap-2
                    sm:grid-cols-3
                  ">
                    <DetailMetric
                      label="Service"
                      value={
                        currentSpan.service
                      }
                    />

                    <DetailMetric
                      label="Duration"
                      value={`${safeNumber(
                        currentSpan.duration
                      )} ms`}
                    />

                    <DetailMetric
                      label="Start offset"
                      value={`+${safeNumber(
                        currentSpan.startOffset
                      )} ms`}
                    />
                  </div>
                </motion.div>
              )}
          </div>
        </div>

        {/* =================================================
            CONTROLS
        ================================================== */}

        <footer
          className="
            shrink-0
            border-t
            border-white/10
            bg-[#071022]
          "
        >
          <div
            className="
              mx-auto
              flex
              w-full
              max-w-[900px]
              items-center
              justify-center
              gap-4
              px-4
              py-4
            "
          >
            <ControlButton
              label="Previous event"
              onClick={() =>
                setCurrentStep(
                  (previous) =>
                    Math.max(
                      0,
                      previous - 1
                    )
                )
              }
              disabled={
                currentStep ===
                  0 ||
                spans.length === 0
              }
            >
              <ChevronLeft className="h-5 w-5" />
            </ControlButton>

            <motion.button
              type="button"
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.96,
              }}
              onClick={() =>
                setIsPlaying(
                  (previous) =>
                    !previous
                )
              }
              disabled={
                spans.length <= 1
              }
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-indigo-400
                to-violet-500
                text-[#0b0d1c]
                shadow-[0_12px_35px_rgba(99,102,241,.25)]
                transition
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
              aria-label={
                isPlaying
                  ? "Pause trace playback"
                  : "Play trace playback"
              }
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" />
              )}
            </motion.button>

            <ControlButton
              label="Next event"
              onClick={() =>
                setCurrentStep(
                  (previous) =>
                    Math.min(
                      spans.length -
                        1,
                      previous + 1
                    )
                )
              }
              disabled={
                spans.length === 0 ||
                currentStep >=
                  spans.length - 1
              }
            >
              <ChevronRight className="h-5 w-5" />
            </ControlButton>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.035]
        p-3
      "
    >
      <div className="flex items-center gap-2">
        <span
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-xl
            bg-indigo-400/10
            text-indigo-300
          "
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <p className="
            text-[8px]
            font-black
            uppercase
            tracking-[0.1em]
            text-blue-100/35
          ">
            {label}
          </p>

          <p className="
            mt-0.5
            truncate
            text-sm
            font-black
            text-white
          ">
            {value}
          </p>
        </div>
      </div>
    </div>
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
        border-white/10
        bg-black/10
        p-3
      "
    >
      <p className="
        text-[8px]
        font-black
        uppercase
        tracking-[0.1em]
        text-blue-100/35
      ">
        {label}
      </p>

      <p className="
        mt-1
        truncate
        text-[10px]
        font-black
        text-indigo-100
      ">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   CONTROL BUTTON
========================================================= */

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -1,
      }}
      whileTap={{
        scale: 0.97,
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        border
        border-white/10
        bg-white/[0.04]
        text-blue-100/65
        transition
        hover:bg-white/10
        hover:text-white
        disabled:cursor-not-allowed
        disabled:opacity-25
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-300/20
      "
    >
      {children}
    </motion.button>
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

function formatTime(
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

export default SystemStoryViewer;