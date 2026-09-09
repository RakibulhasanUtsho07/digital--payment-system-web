"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Globe2,
  Headphones,
  Hexagon,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  XCircle,
  Zap,
} from "lucide-react";

import type {
  ServiceHealth,
} from "@/lib/api/systemlogApi";

/* =========================================================
   TYPES
========================================================= */

interface ServiceStatusGridProps {
  services: ServiceHealth[];
  loading?: boolean;
  range?: string;
  onRefresh?: () => void;
  onSelectService?: (
    service: ServiceHealth
  ) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export function ServiceStatusGrid({
  services,
  loading = false,
  range,
  onRefresh,
  onSelectService,
}: ServiceStatusGridProps) {
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  /* =======================================================
     DERIVED STATS
  ====================================================== */

  const stats = useMemo(() => {
    const operational = services.filter(
      (service) =>
        service.status === "Operational"
    ).length;

    const warning = services.filter(
      (service) =>
        service.status === "Warning"
    ).length;

    const degraded = services.filter(
      (service) =>
        service.status === "Degraded"
    ).length;

    const down = services.filter(
      (service) =>
        service.status === "Down"
    ).length;

    const totalRequests =
      services.reduce(
        (sum, service) =>
          sum +
          parseRequestCount(
            service.requestCount
          ),
        0
      );

    const averageLatency =
      services.length > 0
        ? services.reduce(
            (sum, service) =>
              sum +
              safeNumber(
                service.responseTimeMs
              ),
            0
          ) /
          services.length
        : 0;

    return {
      operational,
      warning,
      degraded,
      down,
      totalRequests,
      averageLatency,
    };
  }, [services]);

  /* =======================================================
     SORT LIVE SERVICES
  ====================================================== */

  const sortedServices =
    useMemo(() => {
      const statusPriority: Record<
        ServiceHealth["status"],
        number
      > = {
        Down: 0,
        Degraded: 1,
        Warning: 2,
        Maintenance: 3,
        Operational: 4,
      };

      return [...services].sort(
        (a, b) => {
          const statusDifference =
            statusPriority[
              a.status
            ] -
            statusPriority[
              b.status
            ];

          if (
            statusDifference !==
            0
          ) {
            return statusDifference;
          }

          return (
            safeNumber(
              b.responseTimeMs
            ) -
            safeNumber(
              a.responseTimeMs
            )
          );
        }
      );
    }, [services]);

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
          relative
          overflow-hidden
          border-b
          border-border
          p-5
          sm:p-6
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-16
            -top-24
            h-52
            w-52
            rounded-full
            bg-indigo-500/5
            blur-3xl
          "
        />

        <motion.div
          className="
            pointer-events-none
            absolute
            right-24
            top-12
            h-20
            w-20
            rounded-full
            bg-violet-500/5
            blur-2xl
          "
          animate={{
            scale: [
              1,
              1.2,
              1,
            ],
            opacity: [
              0.35,
              0.7,
              0.35,
            ],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div
          className="
            relative
            z-10
            flex
            flex-col
            gap-5
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
                    tracking-[0.15em]
                    text-indigo-500
                  "
                >
                  <Activity className="h-3.5 w-3.5" />
                  Live telemetry
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
                  sm:text-2xl
                "
              >
                <span
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-500/10
                    text-indigo-500
                  "
                >
                  <Server className="h-4 w-4" />
                </span>

                Service Status
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
                Monitor the real service telemetry recorded
                by your backend, including response time,
                error rate, request volume and latest activity.
              </p>
            </div>

            {onRefresh && (
              <motion.button
                type="button"
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.97,
                }}
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
                  className={
                    loading
                      ? "h-3.5 w-3.5 animate-spin"
                      : "h-3.5 w-3.5"
                  }
                />

                Refresh
              </motion.button>
            )}
          </div>

          {/* =================================================
              SUMMARY
          ================================================== */}

          <div
            className="
              grid
              grid-cols-2
              gap-2
              sm:grid-cols-3
              lg:grid-cols-5
            "
          >
            <SummaryMetric
              icon={CheckCircle2}
              label="Operational"
              value={String(
                stats.operational
              )}
              tone="success"
            />

            <SummaryMetric
              icon={TriangleAlert}
              label="Warning"
              value={String(
                stats.warning
              )}
              tone="warning"
            />

            <SummaryMetric
              icon={ShieldAlert}
              label="Degraded"
              value={String(
                stats.degraded
              )}
              tone="danger"
            />

            <SummaryMetric
              icon={XCircle}
              label="Down"
              value={String(
                stats.down
              )}
              tone="danger"
            />

            <SummaryMetric
              icon={Gauge}
              label="Avg latency"
              value={`${Math.round(
                stats.averageLatency
              )} ms`}
              tone="indigo"
            />
          </div>
        </div>
      </header>

      {/* ===================================================
          CONTENT
      ==================================================== */}

      <div className="p-5 sm:p-6">
        {loading &&
        services.length === 0 ? (
          <ServiceSkeleton />
        ) : services.length ===
          0 ? (
          <EmptyServices />
        ) : (
          <div
            className="
              grid
              gap-3
              md:grid-cols-2
              2xl:grid-cols-3
            "
          >
            {sortedServices.map(
              (
                service,
                index
              ) => {
                const selected =
                  selectedId ===
                  service.id;

                return (
                  <ServiceCard
                    key={
                      service.id
                    }
                    service={
                      service
                    }
                    index={
                      index
                    }
                    selected={
                      selected
                    }
                    onClick={() => {
                      setSelectedId(
                        selected
                          ? null
                          : service.id
                      );

                      onSelectService?.(
                        service
                      );
                    }}
                  />
                );
              }
            )}
          </div>
        )}

        {/* =================================================
            TOTAL REQUEST INFO
        ================================================== */}

        {services.length >
          0 && (
          <div
            className="
              mt-5
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
              rounded-2xl
              border
              border-indigo-500/10
              bg-indigo-500/5
              px-4
              py-3
            "
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-500" />

              <span
                className="
                  text-[10px]
                  font-semibold
                  text-muted-foreground
                "
              >
                Requests observed
              </span>
            </div>

            <strong
              className="
                text-sm
                font-black
                text-indigo-500
              "
            >
              {stats.totalRequests.toLocaleString(
                "en-US"
              )}
            </strong>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   SERVICE CARD
========================================================= */

function ServiceCard({
  service,
  index,
  selected,
  onClick,
}: {
  service: ServiceHealth;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const statusConfig =
    getStatusConfig(
      service.status
    );

  const Icon =
    getServiceIcon(
      service.name
    );

  const responseTime =
    safeNumber(
      service.responseTimeMs
    );

  const successRate =
    safeNumber(
      service.observedSuccessRate
    );

  const requestCount =
    parseRequestCount(
      service.requestCount
    );

  const errorRate =
    parsePercentage(
      service.errorRate
    );

  const uptime =
    parsePercentage(
      service.uptime
    );

  return (
    <motion.button
      type="button"
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: Math.min(
          index * 0.045,
          0.2
        ),
      }}
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale: 0.995,
      }}
      onClick={onClick}
      className={`
        group
        min-w-0
        rounded-[22px]
        border
        p-4
        text-left
        transition-all
        ${
          selected
            ? "border-indigo-500/25 bg-indigo-500/5 shadow-[0_12px_30px_rgba(79,70,229,.08)]"
            : "border-border bg-card hover:border-indigo-500/15 hover:bg-muted/20"
        }
      `}
    >
      {/* =================================================
          CARD HEADER
      ================================================== */}

      <div className="flex items-start gap-3">
        <motion.span
          animate={
            service.status ===
            "Down"
              ? {
                  scale: [
                    1,
                    1.06,
                    1,
                  ],
                }
              : undefined
          }
          transition={{
            duration: 1.7,
            repeat:
              service.status ===
              "Down"
                ? Infinity
                : 0,
          }}
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${statusConfig.iconBackground}
            ${statusConfig.iconColor}
          `}
        >
          <Icon className="h-5 w-5" />
        </motion.span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-sm
                  font-black
                  text-card-foreground
                "
              >
                {service.name}
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[9px]
                  font-semibold
                  text-muted-foreground
                "
              >
                {service.category}
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
                ${statusConfig.badge}
              `}
            >
              {service.status}
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          PERFORMANCE METRICS
      ================================================== */}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricTile
          icon={Clock3}
          label="Response"
          value={`${responseTime} ms`}
          accent={
            responseTime >=
            1000
              ? "danger"
              : responseTime >=
                400
                ? "warning"
                : "default"
          }
        />

        <MetricTile
          icon={Activity}
          label="Error rate"
          value={`${errorRate.toFixed(
            2
          )}%`}
          accent={
            errorRate >=
            20
              ? "danger"
              : errorRate >=
                5
                ? "warning"
                : "success"
          }
        />

        <MetricTile
          icon={Server}
          label="Requests"
          value={requestCount.toLocaleString(
            "en-US"
          )}
        />

        <MetricTile
          icon={ShieldCheck}
          label="Success"
          value={`${successRate.toFixed(
            2
          )}%`}
          accent={
            successRate < 80
              ? "danger"
              : successRate <
                95
                ? "warning"
                : "success"
          }
        />
      </div>

      {/* =================================================
          UPTIME BAR
      ================================================== */}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <span
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[0.1em]
              text-muted-foreground
            "
          >
            Observed availability
          </span>

          <span
            className="
              text-[10px]
              font-black
              text-card-foreground
            "
          >
            {uptime.toFixed(
              2
            )}
            %
          </span>
        </div>

        <div
          className="
            mt-2
            h-2
            overflow-hidden
            rounded-full
            bg-muted
          "
        >
          <motion.div
            initial={{
              width: 0,
            }}
            animate={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  uptime
                )
              )}%`,
            }}
            transition={{
              duration: 0.7,
              delay: Math.min(
                index * 0.045,
                0.2
              ),
            }}
            className={`
              h-full
              rounded-full
              ${statusConfig.bar}
            `}
          />
        </div>
      </div>

      {/* =================================================
          LAST ERROR
      ================================================== */}

      <div
        className="
          mt-4
          rounded-xl
          border
          border-border
          bg-muted/25
          p-3
        "
      >
        <div className="flex items-start gap-2">
          <AlertTriangle
            className={`
              mt-0.5
              h-3.5
              w-3.5
              shrink-0
              ${
                service.lastError &&
                service.lastError !==
                  "None in selected range"
                  ? "text-amber-500"
                  : "text-muted-foreground/40"
              }
            `}
          />

          <div className="min-w-0">
            <p
              className="
                text-[8px]
                font-black
                uppercase
                tracking-[0.1em]
                text-muted-foreground
              "
            >
              Latest error
            </p>

            <p
              className="
                mt-1
                line-clamp-2
                text-[10px]
                leading-5
                text-card-foreground
              "
            >
              {service.lastError ||
                "No error recorded in the selected range."}
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          LAST SEEN
      ================================================== */}

      <div
        className="
          mt-3
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <span
          className="
            inline-flex
            min-w-0
            items-center
            gap-1.5
            text-[9px]
            text-muted-foreground
          "
        >
          <Clock3 className="h-3 w-3 shrink-0" />

          <span className="truncate">
            {service.lastSeenAt
              ? formatLastSeen(
                  service.lastSeenAt
                )
              : "No recent observation"}
          </span>
        </span>

        <ArrowUpRight
          className="
            h-3.5
            w-3.5
            shrink-0
            text-muted-foreground/40
            transition
            group-hover:text-indigo-500
          "
        />
      </div>
    </motion.button>
  );
}

/* =========================================================
   METRIC TILE
========================================================= */

function MetricTile({
  icon: Icon,
  label,
  value,
  accent = "default",
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  accent?:
    | "default"
    | "success"
    | "warning"
    | "danger";
}) {
  const accentColors = {
    default:
      "text-card-foreground",

    success:
      "text-emerald-600",

    warning:
      "text-amber-600",

    danger:
      "text-rose-600",
  };

  return (
    <div
      className="
        rounded-xl
        border
        border-border
        bg-muted/20
        p-2.5
      "
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className="
            h-3
            w-3
            shrink-0
            text-muted-foreground
          "
        />

        <span
          className="
            truncate
            text-[8px]
            font-black
            uppercase
            tracking-[0.08em]
            text-muted-foreground
          "
        >
          {label}
        </span>
      </div>

      <p
        className={`
          mt-1
          truncate
          text-xs
          font-black
          ${accentColors[accent]}
        `}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SUMMARY METRIC
========================================================= */

function SummaryMetric({
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
    | "success"
    | "warning"
    | "danger"
    | "indigo";
}) {
  const styles = {
    success:
      "bg-emerald-500/10 text-emerald-600",

    warning:
      "bg-amber-500/10 text-amber-600",

    danger:
      "bg-rose-500/10 text-rose-600",

    indigo:
      "bg-indigo-500/10 text-indigo-500",
  };

  return (
    <div
      className="
        rounded-2xl
        border
        border-border
        bg-muted/20
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
          tracking-[0.08em]
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
   STATUS CONFIG
========================================================= */

function getStatusConfig(
  status: ServiceHealth["status"]
) {
  switch (status) {
    case "Operational":
      return {
        iconBackground:
          "bg-emerald-500/10",

        iconColor:
          "text-emerald-600",

        badge:
          "bg-emerald-500/10 text-emerald-600",

        bar:
          "bg-emerald-500",
      };

    case "Warning":
      return {
        iconBackground:
          "bg-amber-500/10",

        iconColor:
          "text-amber-600",

        badge:
          "bg-amber-500/10 text-amber-600",

        bar:
          "bg-amber-500",
      };

    case "Degraded":
      return {
        iconBackground:
          "bg-orange-500/10",

        iconColor:
          "text-orange-600",

        badge:
          "bg-orange-500/10 text-orange-600",

        bar:
          "bg-orange-500",
      };

    case "Down":
      return {
        iconBackground:
          "bg-rose-500/10",

        iconColor:
          "text-rose-600",

        badge:
          "bg-rose-500/10 text-rose-600",

        bar:
          "bg-rose-500",
      };

    case "Maintenance":
    default:
      return {
        iconBackground:
          "bg-indigo-500/10",

        iconColor:
          "text-indigo-500",

        badge:
          "bg-indigo-500/10 text-indigo-500",

        bar:
          "bg-indigo-500",
      };
  }
}

/* =========================================================
   SERVICE ICON
========================================================= */

function getServiceIcon(
  serviceName: string
) {
  const value =
    serviceName
      .toLowerCase();

  if (
    value.includes("database") ||
    value.includes("mongo") ||
    value.includes("postgres") ||
    value.includes("sql")
  ) {
    return Database;
  }

  if (
    value.includes("auth") ||
    value.includes("security")
  ) {
    return ShieldAlert;
  }

  if (
    value.includes("api") ||
    value.includes("gateway")
  ) {
    return Globe2;
  }

  if (
    value.includes("support")
  ) {
    return Headphones;
  }

  if (
    value.includes("wallet") ||
    value.includes("payment") ||
    value.includes("transfer")
  ) {
    return Zap;
  }

  if (
    value.includes("cloud") ||
    value.includes("storage")
  ) {
    return Hexagon;
  }

  return Server;
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyServices() {
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
        <Server className="h-7 w-7" />
      </span>

      <h4
        className="
          mt-4
          text-base
          font-black
          text-card-foreground
        "
      >
        No service telemetry
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
        The backend has not returned service health
        observations for the selected time range yet.
      </p>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function ServiceSkeleton() {
  return (
    <div
      className="
        grid
        gap-3
        md:grid-cols-2
        2xl:grid-cols-3
      "
    >
      {Array.from({
        length: 6,
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
              h-[310px]
              animate-pulse
              rounded-[22px]
              bg-muted
            "
          />
        )
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function safeNumber(
  value: unknown
): number {
  const result =
    Number(
      value ?? 0
    );

  return Number.isFinite(
    result
  )
    ? result
    : 0;
}

function parsePercentage(
  value: unknown
): number {
  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : 0;
  }

  const parsed =
    Number(
      String(
        value ?? "0"
      ).replace(
        "%",
        ""
      )
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function parseRequestCount(
  value: unknown
): number {
  if (
    typeof value ===
    "number"
  ) {
    return safeNumber(
      value
    );
  }

  const normalized =
    String(
      value ?? "0"
    )
      .replaceAll(
        ",",
        ""
      )
      .trim();

  const parsed =
    Number(
      normalized
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function formatLastSeen(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Invalid timestamp";
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