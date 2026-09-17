"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Database,
  Gauge,
  Globe2,
  Lock,
  Server,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

/* =========================================================
   TYPES
========================================================= */

export interface PulseNode {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  x: number;
  y: number;
  responseTimeMs: number;
  errorRate: number;
  requestCount?: string;
  lastSeenAt?: string | null;
}

/* =========================================================
   PROPS
========================================================= */

interface SystemPulseProps {
  nodes: PulseNode[];
  loading?: boolean;
}

/* =========================================================
   ICON MAPPER
========================================================= */

function iconForNode(
  id: string,
  label: string
) {
  const key =
    `${id} ${label}`.toLowerCase();

  if (
    key.includes("auth") ||
    key.includes("security")
  ) {
    return Lock;
  }

  if (
    key.includes("database") ||
    key.includes("db") ||
    key.includes("mongo") ||
    key.includes("sql")
  ) {
    return Database;
  }

  if (
    key.includes("kyc")
  ) {
    return ShieldAlert;
  }

  if (
    key.includes("notif")
  ) {
    return Bell;
  }

  if (
    key.includes("wallet") ||
    key.includes("payment") ||
    key.includes("transfer")
  ) {
    return Zap;
  }

  if (
    key.includes("api") ||
    key.includes("gateway")
  ) {
    return Globe2;
  }

  return Activity;
}

/* =========================================================
   COMPONENT
========================================================= */

export function SystemPulse({
  nodes,
  loading = false,
}: SystemPulseProps) {
  const [selectedId, setSelectedId] =
    useState<string>("");

  /* =======================================================
     SELECT DEFAULT NODE
  ====================================================== */

  useEffect(() => {
    if (!nodes.length) {
      setSelectedId("");
      return;
    }

    setSelectedId((current) => {
      if (
        current &&
        nodes.some(
          (node) =>
            node.id === current
        )
      ) {
        return current;
      }

      return nodes[0]?.id ?? "";
    });
  }, [nodes]);

  /* =======================================================
     SELECTED NODE
  ====================================================== */

  const selected =
    useMemo(
      () =>
        nodes.find(
          (node) =>
            node.id === selectedId
        ) ??
        nodes[0] ??
        null,
      [nodes, selectedId]
    );

  /* =======================================================
     OVERALL STATE
  ====================================================== */

  const statusText =
    selected?.status === "error"
      ? "Critical"
      : selected?.status === "warn"
        ? "Watch"
        : "Healthy";

  const statusDescription =
    selected?.status === "error"
      ? "This node is reporting critical telemetry."
      : selected?.status === "warn"
        ? "This node requires operational attention."
        : "This node is operating within the observed limits.";

  /* =======================================================
     EMPTY / LOADING
  ====================================================== */

  if (
    loading &&
    nodes.length === 0
  ) {
    return (
      <div
        className="
          mt-4
          min-h-[340px]
          rounded-[24px]
          border
          border-white/10
          bg-[#08182B]
          p-5
        "
      >
        <div className="grid h-full min-h-[300px] place-items-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />

            <p className="mt-4 text-xs font-semibold text-blue-100/50">
              Loading live service telemetry...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div
        className="
          mt-4
          flex
          min-h-[340px]
          items-center
          justify-center
          rounded-[24px]
          border
          border-white/10
          bg-[#08182B]
          px-6
          text-center
        "
      >
        <div className="max-w-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <Server className="h-6 w-6 text-cyan-300/60" />
          </div>

          <p className="mt-4 text-sm font-black text-white">
            No service telemetry
          </p>

          <p className="mt-2 text-xs leading-5 text-blue-100/45">
            No live service observations were returned
            by the backend for the selected time range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        mt-4
        grid
        min-h-[340px]
        gap-5
        lg:grid-cols-[minmax(0,1fr)_250px]
      "
    >
      {/* =================================================
          NETWORK CANVAS
      ================================================== */}

      <div
        className="
          relative
          min-h-[320px]
          overflow-hidden
          rounded-[24px]
          border
          border-white/10
          bg-[#08182B]
        "
      >
        {/* Ambient background */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.07),transparent_25%)]
          "
        />

        <motion.div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-64
            w-64
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            border
            border-indigo-400/10
          "
          animate={{
            scale: [
              0.85,
              1.08,
              0.85,
            ],
            opacity: [
              0.2,
              0.55,
              0.2,
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* =================================================
            CONNECTOR LINES
        ================================================== */}

        <svg
          className="
            pointer-events-none
            absolute
            inset-0
            h-full
            w-full
            opacity-45
          "
          aria-hidden="true"
        >
          {nodes.map(
            (
              node,
              index
            ) => {
              const lineColor =
                node.status ===
                "error"
                  ? "#fb7185"
                  : node.status ===
                      "warn"
                    ? "#fbbf24"
                    : "#818cf8";

              return (
                <motion.line
                  key={
                    `pulse-line-${node.id}`
                  }
                  x1="50%"
                  y1="50%"
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={
                    lineColor
                  }
                  strokeWidth="1.4"
                  strokeDasharray="5 8"
                  initial={{
                    pathLength: 0,
                    opacity: 0,
                  }}
                  animate={{
                    pathLength: 1,
                    opacity: 0.72,
                  }}
                  transition={{
                    duration: 1,
                    delay:
                      index *
                      0.08,
                  }}
                />
              );
            }
          )}
        </svg>

        {/* =================================================
            CORE
        ================================================== */}

        <motion.div
          className="
            absolute
            left-1/2
            top-1/2
            z-20
            flex
            h-24
            w-24
            -translate-x-1/2
            -translate-y-1/2
            flex-col
            items-center
            justify-center
            rounded-full
            border
            border-indigo-300/30
            bg-[#101333]
            shadow-[0_0_55px_rgba(99,102,241,0.16)]
          "
          animate={{
            boxShadow: [
              "0 0 24px rgba(99,102,241,.08)",
              "0 0 65px rgba(99,102,241,.24)",
              "0 0 24px rgba(99,102,241,.08)",
            ],
          }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            className="
              absolute
              inset-[-17px]
              rounded-full
              border
              border-indigo-300/10
            "
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 17,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <motion.div
            className="
              absolute
              inset-[-7px]
              rounded-full
              border
              border-violet-300/10
            "
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <Server className="h-6 w-6 text-indigo-300" />

          <span
            className="
              mt-1
              text-[9px]
              font-black
              uppercase
              tracking-[0.16em]
              text-white
            "
          >
            Core
          </span>

          <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-indigo-200/45">
            Live
          </span>
        </motion.div>

        {/* =================================================
            NODES
        ================================================== */}

        {nodes.map(
          (
            node,
            index
          ) => {
            const Icon =
              iconForNode(
                node.id,
                node.label
              );

            const active =
              node.id ===
              selectedId;

            const tone =
              node.status ===
              "error"
                ? {
                    border:
                      "border-rose-400/45",
                    text:
                      "text-rose-300",
                    glow:
                      "shadow-[0_0_28px_rgba(251,113,133,.14)]",
                    active:
                      "ring-2 ring-rose-300/20",
                  }
                : node.status ===
                    "warn"
                  ? {
                      border:
                        "border-amber-300/45",
                      text:
                        "text-amber-300",
                      glow:
                        "shadow-[0_0_28px_rgba(251,191,36,.12)]",
                      active:
                        "ring-2 ring-amber-300/20",
                    }
                  : {
                      border:
                        "border-indigo-300/30",
                      text:
                        "text-indigo-200",
                      glow:
                        "shadow-[0_0_24px_rgba(99,102,241,.10)]",
                      active:
                        "ring-2 ring-indigo-300/25",
                    };

            return (
              <motion.button
                key={
                  node.id
                }
                type="button"
                onClick={() =>
                  setSelectedId(
                    node.id
                  )
                }
                initial={{
                  scale: 0.6,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                whileHover={{
                  scale: 1.06,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                transition={{
                  delay:
                    0.15 +
                    index *
                      0.08,
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                }}
                className="
                  absolute
                  z-30
                  flex
                  -translate-x-1/2
                  -translate-y-1/2
                  flex-col
                  items-center
                  gap-2
                  focus:outline-none
                "
                style={{
                  left: `${clampPosition(
                    node.x
                  )}%`,
                  top: `${clampPosition(
                    node.y
                  )}%`,
                }}
                aria-pressed={
                  active
                }
                aria-label={`Open telemetry for ${node.label}`}
              >
                <span
                  className={`
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    bg-[#0B1F36]
                    transition
                    ${tone.border}
                    ${tone.text}
                    ${tone.glow}
                    ${
                      active
                        ? tone.active
                        : ""
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span
                  className={`
                    max-w-[120px]
                    truncate
                    rounded-full
                    border
                    px-2.5
                    py-1
                    text-[9px]
                    font-bold
                    backdrop-blur
                    ${
                      active
                        ? "border-indigo-300/20 bg-indigo-300/10 text-indigo-100"
                        : "border-white/5 bg-[#061323]/80 text-blue-100/60"
                    }
                  `}
                >
                  {node.label}
                </span>

                <span
                  className={`
                    h-1.5
                    w-1.5
                    rounded-full
                    ${
                      node.status ===
                      "error"
                        ? "bg-rose-400"
                        : node.status ===
                            "warn"
                          ? "bg-amber-300"
                          : "bg-emerald-300"
                    }
                  `}
                />
              </motion.button>
            );
          }
        )}
      </div>

      {/* =================================================
          TELEMETRY PANEL
      ================================================== */}

      <div
        className="
          rounded-[24px]
          border
          border-white/10
          bg-white/[0.04]
          p-4
        "
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-indigo-300" />

            <p className="text-xs font-black text-white">
              Node Telemetry
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            Live
          </span>
        </div>

        {selected && (
          <motion.div
            key={
              selected.id
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
              duration: 0.2,
            }}
            className="mt-5 space-y-3"
          >
            {/* Service */}

            <div>
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-blue-100/40
                "
              >
                Service
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-lg
                  font-black
                  text-white
                "
              >
                {selected.label}
              </p>

              <p className="mt-1 text-[9px] leading-4 text-blue-100/45">
                {statusDescription}
              </p>
            </div>

            {/* Status */}

            <TelemetryMetric
              label="State"
              value={statusText}
              valueTone={
                selected.status
              }
            />

            {/* Response */}

            <TelemetryMetric
              label="Response"
              value={`${safeNumber(
                selected.responseTimeMs
              )} ms`}
            />

            {/* Error */}

            <TelemetryMetric
              label="Error rate"
              value={`${safeNumber(
                selected.errorRate
              ).toFixed(2)}%`}
              valueTone={
                selected.errorRate >=
                5
                  ? "error"
                  : selected.errorRate >
                    0
                    ? "warn"
                    : "ok"
              }
            />

            {/* Requests */}

            <TelemetryMetric
              label="Requests"
              value={
                selected.requestCount ??
                "—"
              }
            />

            {/* Last seen */}

            <div
              className="
                rounded-2xl
                border
                border-indigo-300/10
                bg-indigo-300/[0.04]
                p-3
              "
            >
              <div className="flex items-start gap-2">
                <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300/70" />

                <p
                  className="
                    text-[9px]
                    leading-5
                    text-blue-100/55
                  "
                >
                  {selected.lastSeenAt
                    ? `Last observed ${formatDateTime(
                        selected.lastSeenAt
                      )}.`
                    : "No recent observation timestamp is available."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TELEMETRY METRIC
========================================================= */

function TelemetryMetric({
  label,
  value,
  valueTone = "default",
}: {
  label: string;
  value: string;
  valueTone?:
    | "ok"
    | "warn"
    | "error"
    | "default";
}) {
  const tone =
    valueTone === "error"
      ? "text-rose-300"
      : valueTone === "warn"
        ? "text-amber-300"
        : valueTone === "ok"
          ? "text-emerald-300"
          : "text-indigo-100";

  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
        rounded-2xl
        border
        border-white/10
        bg-[#07172A]/65
        px-3
        py-2.5
      "
    >
      <span
        className="
          text-[9px]
          font-semibold
          text-blue-100/45
        "
      >
        {label}
      </span>

      <span
        className={`
          truncate
          text-[10px]
          font-black
          ${tone}
        `}
      >
        {value}
      </span>
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

function clampPosition(
  value: unknown
): number {
  const number =
    safeNumber(
      value
    );

  return Math.max(
    8,
    Math.min(
      92,
      number
    )
  );
}

function formatDateTime(
  value: string
): string {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "unknown time";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  ).format(date);
}

export default SystemPulse;