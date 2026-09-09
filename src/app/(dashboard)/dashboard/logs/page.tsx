"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { motion } from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  Gauge,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";

import {
  downloadSystemLogsExport,
  systemLogsApi,
  type HeatmapCell,
  type ServiceHealth,
  type SystemAnomaly,
  type SystemLog,
  type SystemLogsRange,
  type SystemLogsSummary,
  type SystemTraceData,
} from "@/lib/api/systemlogApi";

import {
  SystemPulse,
  type PulseNode,
} from "./components/SystemPulse";

/* =========================================================
   TYPES
========================================================= */

type RootCauseData =
  Awaited<
    ReturnType<
      typeof systemLogsApi.getRootCause
    >
  >;

/* =========================================================
   RANGE OPTIONS
========================================================= */

const RANGE_OPTIONS: Array<{
  value: SystemLogsRange;
  label: string;
}> = [
  {
    value: "1h",
    label: "1 hour",
  },
  {
    value: "6h",
    label: "6 hours",
  },
  {
    value: "24h",
    label: "24 hours",
  },
  {
    value: "7d",
    label: "7 days",
  },
  {
    value: "30d",
    label: "30 days",
  },
];

/* =========================================================
   NODE POSITIONS
========================================================= */

const NODE_POSITIONS = [
  { x: 12, y: 20 },
  { x: 82, y: 20 },
  { x: 86, y: 76 },
  { x: 15, y: 78 },
  { x: 50, y: 10 },
  { x: 50, y: 88 },
] as const;

/* =========================================================
   PAGE
========================================================= */

export default function SystemLogsPage() {
  const [range, setRange] =
    useState<SystemLogsRange>("24h");

  const [summary, setSummary] =
    useState<SystemLogsSummary | null>(null);

  const [services, setServices] =
    useState<ServiceHealth[]>([]);

  const [heatmap, setHeatmap] =
    useState<HeatmapCell[]>([]);

  const [anomalies, setAnomalies] =
    useState<SystemAnomaly[]>([]);

  const [logs, setLogs] =
    useState<SystemLog[]>([]);

  const [trace, setTrace] =
    useState<SystemTraceData | null>(null);

  const [rootCause, setRootCause] =
    useState<RootCauseData | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [refreshing, setRefreshing] =
    useState<boolean>(false);

  const [exporting, setExporting] =
    useState<boolean>(false);

  const [traceLoading, setTraceLoading] =
    useState<boolean>(false);

  const [rootCauseLoading, setRootCauseLoading] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadDashboard = useCallback(
    async (
      manualRefresh = false
    ): Promise<void> => {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const anomalyWindowMinutes =
          range === "1h"
            ? 30
            : range === "6h"
              ? 60
              : 60;

        const [
          summaryResponse,
          servicesResponse,
          heatmapResponse,
          anomaliesResponse,
          logsResponse,
        ] = await Promise.all([
          systemLogsApi.getSummary(
            range
          ),

          systemLogsApi.getServices(
            range
          ),

          systemLogsApi.getHeatmap(
            range
          ),

          systemLogsApi.getAnomalies(
            anomalyWindowMinutes
          ),

          systemLogsApi.getLogs({
            range,
            page: 1,
            limit: 25,
          }),
        ]);

        if (
          !summaryResponse.success ||
          !servicesResponse.success ||
          !heatmapResponse.success ||
          !anomaliesResponse.success ||
          !logsResponse.success
        ) {
          throw new Error(
            "Failed to load one or more system telemetry resources."
          );
        }

        setSummary(
          summaryResponse.summary
        );

        setServices(
          Array.isArray(
            servicesResponse.services
          )
            ? servicesResponse.services
            : []
        );

        setHeatmap(
          Array.isArray(
            heatmapResponse.cells
          )
            ? heatmapResponse.cells
            : []
        );

        setAnomalies(
          Array.isArray(
            anomaliesResponse.anomalies
          )
            ? anomaliesResponse.anomalies
            : []
        );

        setLogs(
          Array.isArray(
            logsResponse.logs
          )
            ? logsResponse.logs
            : []
        );

        setLastUpdated(
          new Date()
        );
      } catch (
        cause: unknown
      ) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load system telemetry."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  /* =========================================================
     INITIAL LOAD + RANGE CHANGE
  ========================================================= */

  useEffect(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  /* =========================================================
     LIVE POLLING
  ========================================================= */

  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        void loadDashboard(true);
      }, 60_000);

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [loadDashboard]);

  /* =========================================================
     LATEST TRACE ID
  ========================================================= */

  const latestTraceId =
    useMemo(() => {
      const item =
        logs.find(
          (log) =>
            Boolean(
              log.traceId
            )
        );

      return (
        item?.traceId ??
        null
      );
    }, [logs]);

  /* =========================================================
     LATEST REQUEST ID
  ========================================================= */

  const latestRequestId =
    useMemo(() => {
      const item =
        logs.find(
          (log) =>
            Boolean(
              log.requestId
            )
        );

      return (
        item?.requestId ??
        null
      );
    }, [logs]);

  /* =========================================================
     TRACE LOAD
  ========================================================= */

  useEffect(() => {
    if (!latestTraceId) {
      setTrace(null);
      setTraceLoading(false);
      return;
    }

    let cancelled = false;

    setTraceLoading(true);

    void systemLogsApi
      .getTrace(
        latestTraceId
      )
      .then((data) => {
        if (cancelled) return;

        setTrace(data);
      })
      .catch(() => {
        if (cancelled) return;

        setTrace(null);
      })
      .finally(() => {
        if (cancelled) return;

        setTraceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [latestTraceId]);

  /* =========================================================
     ROOT CAUSE LOAD
  ========================================================= */

  useEffect(() => {
    if (!latestRequestId) {
      setRootCause(null);
      setRootCauseLoading(false);
      return;
    }

    let cancelled = false;

    setRootCauseLoading(true);

    void systemLogsApi
      .getRootCause(
        latestRequestId
      )
      .then((data) => {
        if (cancelled) return;

        setRootCause(data);
      })
      .catch(() => {
        if (cancelled) return;

        setRootCause(null);
      })
      .finally(() => {
        if (cancelled) return;

        setRootCauseLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [latestRequestId]);

  /* =========================================================
     PULSE NODES
  ========================================================= */

  const pulseNodes =
    useMemo<PulseNode[]>(() => {
      return services
        .slice(0, 6)
        .map(
          (
            service,
            index
          ) => ({
            id:
              service.id,

            label:
              service.name,

            status:
              service.status ===
              "Down"
                ? "error"
                : service.status ===
                    "Operational"
                  ? "ok"
                  : "warn",

            x:
              NODE_POSITIONS[
                index
              ]?.x ?? 50,

            y:
              NODE_POSITIONS[
                index
              ]?.y ?? 50,

            responseTimeMs:
              Number(
                service.responseTimeMs ??
                  0
              ),

            errorRate:
              parsePercentage(
                service.errorRate
              ),

            requestCount:
              service.requestCount,

            lastSeenAt:
              service.lastSeenAt,
          })
        );
    }, [services]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const healthScore =
    summary?.healthScore ??
    0;

  const totalEvents =
    summary?.totalEvents ??
    0;

  const errorEvents =
    summary?.errorEvents ??
    0;

  const warningEvents =
    summary?.warningEvents ??
    0;

  const criticalEvents =
    summary?.criticalEvents ??
    0;

  const attentionCount =
    summary?.servicesNeedingAttention ??
    0;

  /* =========================================================
     HEALTH LABEL
  ========================================================= */

  const healthLabel =
    healthScore >= 95
      ? "Excellent"
      : healthScore >= 85
        ? "Healthy"
        : healthScore >= 70
          ? "Watch"
          : "Critical";

  const healthTone =
    healthScore >= 85
      ? "success"
      : healthScore >= 70
        ? "warning"
        : "danger";

  /* =========================================================
     PROBLEM SERVICES
  ========================================================= */

  const problematicServices =
    useMemo(() => {
      return services.filter(
        (service) =>
          service.status !==
          "Operational"
      );
    }, [services]);

  /* =========================================================
     EXPORT
  ========================================================= */

  const handleExport =
    async (): Promise<void> => {
      if (exporting) {
        return;
      }

      setExporting(true);
      setError(null);

      try {
        await downloadSystemLogsExport(
          range
        );
      } catch (
        cause: unknown
      ) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to export system logs."
        );
      } finally {
        setExporting(false);
      }
    };

  /* =========================================================
     INVESTIGATE ANOMALY
  ========================================================= */

  const handleInvestigate =
    async (
      anomaly: SystemAnomaly
    ): Promise<void> => {
      const matchingLog =
        logs.find(
          (log) =>
            log.service ===
              anomaly.service &&
            (
              log.level ===
                "ERROR" ||
              log.level ===
                "CRITICAL"
            )
        );

      if (
        matchingLog?.traceId
      ) {
        setTraceLoading(true);

        try {
          const traceData =
            await systemLogsApi.getTrace(
              matchingLog.traceId
            );

          setTrace(
            traceData
          );
        } catch {
          // Keep current trace state.
        } finally {
          setTraceLoading(false);
        }
      }

      if (
        matchingLog?.requestId
      ) {
        setRootCauseLoading(true);

        try {
          const rootData =
            await systemLogsApi.getRootCause(
              matchingLog.requestId
            );

          setRootCause(
            rootData
          );
        } catch {
          // Keep current root cause state.
        } finally {
          setRootCauseLoading(false);
        }
      }
    };

  return (
    <main className="
      min-w-0
      bg-background
      px-3
      py-4
      text-foreground
      sm:px-5
      lg:px-7
    ">
      <div className="
        mx-auto
        w-full
        max-w-[1600px]
        space-y-5
        pb-12
      ">

        {/* =====================================================
            TOP INDIGO HEADER
        ====================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: -18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            relative
            isolate
            overflow-hidden
            rounded-[30px]
            border
            border-indigo-300/10
            bg-gradient-to-br
            from-[#100B24]
            via-[#211146]
            to-[#4C2A85]
            p-5
            text-white
            shadow-[0_28px_90px_rgba(45,27,91,.25)]
            sm:p-7
            lg:p-8
          "
        >
          <motion.div
            animate={{
              scale: [
                0.9,
                1.12,
                0.9,
              ],
              opacity: [
                0.12,
                0.34,
                0.12,
              ],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              pointer-events-none
              absolute
              -right-24
              -top-28
              h-[380px]
              w-[380px]
              rounded-full
              bg-indigo-400/20
              blur-[100px]
            "
          />

          <motion.div
            animate={{
              x: [
                -18,
                18,
                -18,
              ],
              opacity: [
                0.08,
                0.24,
                0.08,
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              pointer-events-none
              absolute
              -bottom-36
              left-[30%]
              h-[300px]
              w-[300px]
              rounded-full
              bg-violet-400/15
              blur-[100px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.07]
            "
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)",
              backgroundSize:
                "34px 34px",
            }}
          />

          <div className="
            relative
            z-10
            grid
            gap-7
            xl:grid-cols-[minmax(0,1fr)_auto]
            xl:items-center
          ">
            <div className="min-w-0">
              <div className="
                flex
                flex-wrap
                items-center
                gap-2
              ">
                <span className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-indigo-200/15
                  bg-white/[0.08]
                  px-3
                  py-1.5
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-indigo-100
                ">
                  <Activity className="h-3.5 w-3.5" />
                  Observability Console
                </span>

                <span className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-emerald-300/15
                  bg-emerald-300/10
                  px-3
                  py-1.5
                  text-[9px]
                  font-bold
                  text-emerald-100
                ">
                  <span className="
                    h-1.5
                    w-1.5
                    animate-pulse
                    rounded-full
                    bg-emerald-300
                    shadow-[0_0_14px_rgba(110,231,183,.8)]
                  " />
                  Live monitoring
                </span>
              </div>

              <h1 className="
                mt-5
                text-3xl
                font-black
                tracking-[-0.04em]
                sm:text-4xl
                lg:text-[46px]
              ">
                System Logs
              </h1>

              <p className="
                mt-3
                max-w-3xl
                text-sm
                leading-6
                text-indigo-100/65
                sm:text-[15px]
              ">
                Monitor backend events, service health,
                anomalies, traces and correlated failures
                from one live control center.
              </p>

              <div className="
                mt-5
                flex
                flex-wrap
                items-center
                gap-2
              ">
                <span className="
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.05]
                  px-3
                  py-1.5
                  text-[9px]
                  font-bold
                  text-indigo-100/55
                ">
                  Administrator
                </span>

                <span className="
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.05]
                  px-3
                  py-1.5
                  text-[9px]
                  font-bold
                  text-indigo-100/55
                ">
                  System Operations
                </span>

                <span className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.05]
                  px-3
                  py-1.5
                  text-[9px]
                  font-bold
                  text-indigo-100/55
                ">
                  <Wifi className="
                    h-3.5
                    w-3.5
                    text-indigo-200
                  " />

                  {lastUpdated
                    ? `Updated ${formatTime(
                        lastUpdated
                      )}`
                    : "Syncing telemetry..."}
                </span>
              </div>
            </div>

            <div className="
              flex
              w-full
              flex-col
              gap-2
              sm:flex-row
              xl:w-auto
            ">
              <Link
                href="/dashboard/security"
                className="
                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.07]
                  px-4
                  text-xs
                  font-black
                  text-white
                  transition
                  hover:bg-white/[0.12]
                "
              >
                <Shield className="
                  h-4
                  w-4
                  text-indigo-200
                " />

                Security Center
              </Link>

              <button
                type="button"
                onClick={() =>
                  void handleExport()
                }
                disabled={
                  exporting
                }
                className="
                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.07]
                  px-4
                  text-xs
                  font-black
                  text-white
                  transition
                  hover:bg-white/[0.12]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Download className="
                  h-4
                  w-4
                " />

                {exporting
                  ? "Exporting..."
                  : "Export Logs"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void loadDashboard(
                    true
                  )
                }
                disabled={
                  refreshing ||
                  loading
                }
                className="
                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-4
                  text-xs
                  font-black
                  text-indigo-950
                  shadow-lg
                  transition
                  hover:-translate-y-0.5
                  hover:bg-indigo-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>
        </motion.header>

        {/* =====================================================
            RANGE
        ====================================================== */}

        <section className="
          flex
          flex-col
          gap-3
          rounded-[22px]
          border
          border-border
          bg-card
          p-3
          shadow-[var(--dashboard-shadow)]
          sm:flex-row
          sm:items-center
          sm:justify-between
        ">
          <div className="
            flex
            items-center
            gap-2
          ">
            <Gauge className="
              h-4
              w-4
              text-[var(--dashboard-primary)]
            " />

            <span className="
              text-xs
              font-black
              text-card-foreground
            ">
              Monitoring window
            </span>
          </div>

          <div className="
            grid
            grid-cols-5
            gap-1
            rounded-xl
            bg-muted/45
            p-1
          ">
            {RANGE_OPTIONS.map(
              (
                option
              ) => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  onClick={() =>
                    setRange(
                      option.value
                    )
                  }
                  className={`
                    rounded-lg
                    px-2.5
                    py-2
                    text-[9px]
                    font-black
                    transition
                    sm:px-3
                    ${
                      range ===
                      option.value
                        ? "bg-[var(--dashboard-primary)] text-white shadow-sm"
                        : "text-muted-foreground hover:bg-card hover:text-card-foreground"
                    }
                  `}
                >
                  {
                    option.label
                  }
                </button>
              )
            )}
          </div>
        </section>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              flex
              items-center
              justify-between
              gap-3
              rounded-2xl
              border
              border-rose-300/20
              bg-rose-500/10
              px-4
              py-3
            "
          >
            <div className="
              flex
              min-w-0
              items-center
              gap-2
              text-xs
              font-semibold
              text-rose-700
              dark:text-rose-200
            ">
              <AlertTriangle className="
                h-4
                w-4
                shrink-0
              " />

              <span className="truncate">
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="
                shrink-0
                text-xs
                font-black
                text-rose-600
                hover:underline
              "
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* =====================================================
            TELEMETRY
        ====================================================== */}

        <section className="
          grid
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        ">
          <TelemetryCard
            icon={Gauge}
            label="Health score"
            value={`${healthScore.toFixed(
              1
            )}%`}
            note={`${healthLabel} platform health`}
            tone="success"
          />

          <TelemetryCard
            icon={Activity}
            label="Total events"
            value={totalEvents.toLocaleString()}
            note={`Observed in ${range}`}
            tone="primary"
          />

          <TelemetryCard
            icon={Server}
            label="Needs attention"
            value={attentionCount.toLocaleString()}
            note="Services outside operational state"
            tone="warning"
          />

          <TelemetryCard
            icon={Zap}
            label="Critical signals"
            value={criticalEvents.toLocaleString()}
            note={`${errorEvents.toLocaleString()} errors · ${warningEvents.toLocaleString()} warnings`}
            tone="danger"
          />
        </section>

        {/* =====================================================
            SYSTEM PULSE + RIGHT SIDEBAR
        ====================================================== */}

        <section className="
          grid
          min-w-0
          gap-5
          xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]
        ">
          <section className="
            min-w-0
            overflow-hidden
            rounded-[28px]
            border
            border-indigo-300/10
            bg-[#0A1120]
            p-4
            text-white
            shadow-[0_22px_65px_rgba(15,23,42,.16)]
            sm:p-6
          ">
            <div className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
            ">
              <div>
                <p className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.17em]
                  text-indigo-200/45
                ">
                  Live topology
                </p>

                <h2 className="
                  mt-1
                  flex
                  items-center
                  gap-2
                  text-lg
                  font-black
                ">
                  <Sparkles className="
                    h-4
                    w-4
                    text-indigo-300
                  " />

                  System Pulse
                </h2>
              </div>

              <span className="
                rounded-full
                border
                border-white/10
                bg-white/[0.04]
                px-3
                py-1.5
                text-[9px]
                font-bold
                text-indigo-100/45
              ">
                {pulseNodes.length} live nodes
              </span>
            </div>

            <SystemPulse
              nodes={
                pulseNodes
              }
            />
          </section>

          <div className="
            grid
            gap-4
          ">
            <HealthCard
              score={
                healthScore
              }
              label={
                healthLabel
              }
              tone={
                healthTone
              }
            />

            <OperationalSignalsCard
              services={
                problematicServices
              }
              loading={
                loading
              }
            />
          </div>
        </section>

        {/* =====================================================
            SERVICE HEALTH
        ====================================================== */}

        <ServiceHealthSection
          services={
            services
          }
          loading={
            loading
          }
        />

        {/* =====================================================
            ANOMALIES + ROOT CAUSE
        ====================================================== */}

        <section className="
          grid
          min-w-0
          items-stretch
          gap-5
          xl:grid-cols-2
        ">
          <AnomalySection
            anomalies={
              anomalies
            }
            loading={
              loading
            }
            onInvestigate={
              handleInvestigate
            }
          />

          <RootCauseSection
            data={
              rootCause
            }
            loading={
              rootCauseLoading
            }
          />
        </section>

        {/* =====================================================
            TRACE
        ====================================================== */}

        <TraceSection
          trace={
            trace
          }
          loading={
            traceLoading
          }
        />

        {/* =====================================================
            LIVE LOGS
        ====================================================== */}

        <LogsSection
          logs={
            logs
          }
          loading={
            loading
          }
        />

        {/* =====================================================
            HEATMAP
        ====================================================== */}

        <HeatmapSection
          cells={
            heatmap
          }
          loading={
            loading
          }
        />
      </div>
    </main>
  );
}

/* =========================================================
   TELEMETRY CARD
========================================================= */

function TelemetryCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  note: string;
  tone:
    | "success"
    | "primary"
    | "warning"
    | "danger";
}) {
  const toneClasses = {
    success:
      "border-emerald-200/70 bg-emerald-50/70 text-emerald-700",

    primary:
      "border-indigo-200/70 bg-indigo-50/70 text-indigo-700",

    warning:
      "border-amber-200/70 bg-amber-50/70 text-amber-700",

    danger:
      "border-rose-200/70 bg-rose-50/70 text-rose-700",
  };

  return (
    <motion.article
      whileHover={{
        y: -3,
      }}
      className={`
        rounded-[22px]
        border
        p-4
        shadow-[0_10px_30px_rgba(15,23,42,.04)]
        ${toneClasses[tone]}
      `}
    >
      <div className="
        flex
        items-center
        justify-between
        gap-3
      ">
        <span className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-white/70
          dark:bg-white/5
        ">
          <Icon className="h-4 w-4" />
        </span>

        <span className="
          rounded-full
          bg-white/60
          px-2
          py-1
          text-[8px]
          font-black
          uppercase
          tracking-wide
          dark:bg-white/5
        ">
          Live
        </span>
      </div>

      <p className="
        mt-4
        text-[9px]
        font-black
        uppercase
        tracking-[0.13em]
        opacity-65
      ">
        {label}
      </p>

      <p className="
        mt-1
        text-2xl
        font-black
        tracking-tight
      ">
        {value}
      </p>

      <p className="
        mt-1
        truncate
        text-[10px]
        opacity-65
      ">
        {note}
      </p>
    </motion.article>
  );
}

/* =========================================================
   HEALTH CARD
========================================================= */

function HealthCard({
  score,
  label,
  tone,
}: {
  score: number;
  label: string;
  tone:
    | "success"
    | "warning"
    | "danger";
}) {
  const gradient =
    tone === "success"
      ? "from-emerald-400 to-cyan-400"
      : tone === "warning"
        ? "from-amber-400 to-orange-400"
        : "from-rose-400 to-orange-400";

  return (
    <article className="
      rounded-[26px]
      border
      border-border
      bg-card
      p-5
      shadow-[var(--dashboard-shadow)]
    ">
      <div className="
        flex
        items-center
        justify-between
        gap-3
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.14em]
            text-muted-foreground
          ">
            System health
          </p>

          <h3 className="
            mt-1
            text-lg
            font-black
            text-card-foreground
          ">
            Platform health
          </h3>
        </div>

        <span className={`
          rounded-full
          px-2.5
          py-1
          text-[9px]
          font-black
          ${
            tone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : tone === "warning"
                ? "bg-amber-50 text-amber-700"
                : "bg-rose-50 text-rose-700"
          }
        `}>
          {label}
        </span>
      </div>

      <div className="
        mt-5
        flex
        items-end
        justify-between
        gap-3
      ">
        <p className="
          text-4xl
          font-black
          tracking-tight
          text-card-foreground
        ">
          {score.toFixed(
            1
          )}

          <span className="
            ml-1
            text-base
            font-bold
            text-muted-foreground
          ">
            /100
          </span>
        </p>

        {score >= 85 ? (
          <TrendingUp className="
            h-5
            w-5
            text-emerald-500
          " />
        ) : (
          <TrendingDown className="
            h-5
            w-5
            text-amber-500
          " />
        )}
      </div>

      <div className="
        mt-5
        h-2
        overflow-hidden
        rounded-full
        bg-muted
      ">
        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width: `${Math.max(
              0,
              Math.min(
                100,
                score
              )
            )}%`,
          }}
          transition={{
            duration: 0.9,
            ease: "easeOut",
          }}
          className={`
            h-full
            rounded-full
            bg-gradient-to-r
            ${gradient}
          `}
        />
      </div>
    </article>
  );
}

/* =========================================================
   OPERATIONAL SIGNALS
========================================================= */

function OperationalSignalsCard({
  services,
  loading,
}: {
  services: ServiceHealth[];
  loading: boolean;
}) {
  return (
    <article className="
      rounded-[26px]
      border
      border-border
      bg-card
      p-5
      shadow-[var(--dashboard-shadow)]
    ">
      <div className="
        flex
        items-center
        justify-between
        gap-3
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.14em]
            text-muted-foreground
          ">
            Operational signals
          </p>

          <h3 className="
            mt-1
            text-lg
            font-black
            text-card-foreground
          ">
            Needs attention
          </h3>
        </div>

        <AlertTriangle className="
          h-5
          w-5
          text-amber-500
        " />
      </div>

      <div className="
        mt-4
        space-y-2.5
      ">
        {loading ? (
          Array.from({
            length: 3,
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
                  h-14
                  animate-pulse
                  rounded-xl
                  bg-muted
                "
              />
            )
          )
        ) : services.length >
          0 ? (
          services
            .slice(
              0,
              4
            )
            .map(
              (
                service
              ) => (
                <div
                  key={
                    service.id
                  }
                  className="
                    rounded-2xl
                    border
                    border-border
                    bg-muted/35
                    p-3
                  "
                >
                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  ">
                    <div className="min-w-0">
                      <p className="
                        truncate
                        text-xs
                        font-black
                        text-card-foreground
                      ">
                        {
                          service.name
                        }
                      </p>

                      <p className="
                        mt-1
                        text-[9px]
                        text-muted-foreground
                      ">
                        {
                          service.status
                        }{" "}
                        ·{" "}
                        {
                          service.responseTimeMs
                        }ms ·{" "}
                        {
                          service.errorRate
                        }{" "}
                        errors
                      </p>
                    </div>

                    <span className={`
                      h-2
                      w-2
                      shrink-0
                      rounded-full
                      ${
                        service.status ===
                        "Down"
                          ? "bg-rose-500"
                          : "bg-amber-400"
                      }
                    `} />
                  </div>
                </div>
              )
            )
        ) : (
          <div className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-emerald-200
            bg-emerald-50
            p-4
          ">
            <CheckCircle2 className="
              h-5
              w-5
              shrink-0
              text-emerald-600
            " />

            <p className="
              text-xs
              font-bold
              text-emerald-800
            ">
              No active operational warnings.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   SERVICE HEALTH
========================================================= */

function ServiceHealthSection({
  services,
  loading,
}: {
  services: ServiceHealth[];
  loading: boolean;
}) {
  return (
    <section className="
      rounded-[28px]
      border
      border-border
      bg-card
      p-5
      shadow-[var(--dashboard-shadow)]
      sm:p-6
    ">
      <div className="
        flex
        flex-wrap
        items-end
        justify-between
        gap-3
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-[var(--dashboard-primary)]
          ">
            Live backend telemetry
          </p>

          <h2 className="
            mt-1
            text-xl
            font-black
            tracking-tight
            text-card-foreground
          ">
            Service Health
          </h2>

          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">
            Observed request health from real backend logs.
          </p>
        </div>

        <span className="
          rounded-full
          bg-[var(--dashboard-primary-soft)]
          px-3
          py-1.5
          text-[9px]
          font-black
          text-[var(--dashboard-primary)]
        ">
          {services.length} services
        </span>
      </div>

      {loading ? (
        <div className="
          mt-5
          grid
          gap-3
          md:grid-cols-2
          xl:grid-cols-3
        ">
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
                  h-28
                  animate-pulse
                  rounded-2xl
                  bg-muted
                "
              />
            )
          )}
        </div>
      ) : services.length ===
        0 ? (
        <div className="mt-5">
          <EmptyState message="No service telemetry is available for this range." />
        </div>
      ) : (
        <div className="
          mt-5
          grid
          gap-3
          md:grid-cols-2
          xl:grid-cols-3
        ">
          {services.map(
            (
              service
            ) => (
              <ServiceHealthCard
                key={
                  service.id
                }
                service={
                  service
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   SERVICE CARD
========================================================= */

function ServiceHealthCard({
  service,
}: {
  service: ServiceHealth;
}) {
  const isDown =
    service.status ===
    "Down";

  const isOperational =
    service.status ===
    "Operational";

  const StatusIcon =
    isDown
      ? XCircle
      : isOperational
        ? CheckCircle2
        : AlertTriangle;

  const statusClass =
    isDown
      ? "bg-rose-50 text-rose-600"
      : isOperational
        ? "bg-emerald-50 text-emerald-600"
        : service.status ===
            "Warning"
          ? "bg-orange-50 text-orange-600"
          : "bg-amber-50 text-amber-600";

  return (
    <motion.article
      whileHover={{
        y: -2,
      }}
      className="
        rounded-2xl
        border
        border-border
        bg-muted/25
        p-4
      "
    >
      <div className="
        flex
        items-start
        justify-between
        gap-3
      ">
        <div className="
          flex
          min-w-0
          items-center
          gap-3
        ">
          <span className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${statusClass}
          `}>
            <StatusIcon className="
              h-4
              w-4
            " />
          </span>

          <div className="min-w-0">
            <p className="
              truncate
              text-xs
              font-black
              text-card-foreground
            ">
              {service.name}
            </p>

            <p className="
              mt-0.5
              truncate
              text-[9px]
              text-muted-foreground
            ">
              {service.category}
            </p>
          </div>
        </div>

        <span className={`
          rounded-full
          px-2
          py-1
          text-[8px]
          font-black
          ${statusClass}
        `}>
          {service.status}
        </span>
      </div>

      <div className="
        mt-4
        grid
        grid-cols-2
        gap-2
      ">
        <MiniMetric
          label="Response"
          value={`${service.responseTimeMs} ms`}
        />

        <MiniMetric
          label="Errors"
          value={
            service.errorRate
          }
        />

        <MiniMetric
          label="Requests"
          value={
            service.requestCount
          }
        />

        <MiniMetric
          label="Success"
          value={`${service.observedSuccessRate.toFixed(
            2
          )}%`}
        />
      </div>

      <p className="
        mt-3
        truncate
        text-[9px]
        text-muted-foreground
      ">
        Last error:{" "}
        {service.lastError}
      </p>
    </motion.article>
  );
}

/* =========================================================
   ANOMALIES
========================================================= */

function AnomalySection({
  anomalies,
  loading,
  onInvestigate,
}: {
  anomalies: SystemAnomaly[];
  loading: boolean;
  onInvestigate: (
    anomaly: SystemAnomaly
  ) => void;
}) {
  const [
    expanded,
    setExpanded,
  ] =
    useState<number | null>(
      null
    );

  return (
    <section className="
      min-w-0
      rounded-[28px]
      border
      border-border
      bg-card
      p-5
      shadow-[var(--dashboard-shadow)]
      sm:p-6
    ">
      <div className="
        flex
        flex-wrap
        items-start
        justify-between
        gap-3
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-amber-500
          ">
            Anomaly intelligence
          </p>

          <h2 className="
            mt-1
            flex
            items-center
            gap-2
            text-xl
            font-black
            text-card-foreground
          ">
            <Zap className="
              h-5
              w-5
              text-amber-500
            " />

            Error Spike Detector
          </h2>

          <p className="
            mt-1
            text-xs
            leading-5
            text-muted-foreground
          ">
            Backend-calculated error and latency anomalies.
          </p>
        </div>

        <span className="
          rounded-full
          bg-amber-50
          px-3
          py-1.5
          text-[9px]
          font-black
          text-amber-700
        ">
          {anomalies.length} detected
        </span>
      </div>

      <div className="
        mt-5
        space-y-3
      ">
        {loading ? (
          Array.from({
            length: 3,
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
                  h-24
                  animate-pulse
                  rounded-2xl
                  bg-muted
                "
              />
            )
          )
        ) : anomalies.length ===
          0 ? (
          <EmptyState message="No anomaly was detected against the previous comparison window." />
        ) : (
          anomalies.map(
            (
              anomaly,
              index
            ) => {
              const open =
                expanded ===
                index;

              return (
                <motion.div
                  layout
                  key={`${anomaly.service}-${anomaly.type}-${index}`}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-border
                    bg-muted/30
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(
                        open
                          ? null
                          : index
                      )
                    }
                    className="
                      flex
                      w-full
                      items-start
                      justify-between
                      gap-3
                      p-4
                      text-left
                    "
                  >
                    <div className="min-w-0">
                      <div className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                      ">
                        <span className="
                          text-xs
                          font-black
                          text-card-foreground
                        ">
                          {
                            anomaly.service
                          }
                        </span>

                        <span className={`
                          rounded-full
                          px-2
                          py-1
                          text-[8px]
                          font-black
                          ${
                            anomaly.severity ===
                            "high"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }
                        `}>
                          {
                            anomaly.severity
                          }
                        </span>

                        <span className="
                          rounded-full
                          bg-indigo-50
                          px-2
                          py-1
                          text-[8px]
                          font-black
                          text-indigo-700
                        ">
                          {anomaly.type ===
                          "error_rate"
                            ? "Error rate"
                            : "Latency"}
                        </span>
                      </div>

                      <p className="
                        mt-2
                        text-[10px]
                        leading-5
                        text-muted-foreground
                      ">
                        {anomaly.message}
                      </p>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition ${
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
                      className="
                        border-t
                        border-border
                        bg-card
                        p-4
                      "
                    >
                      <div className="
                        grid
                        grid-cols-2
                        gap-2
                        sm:grid-cols-3
                      ">
                        <MiniMetric
                          label="Current"
                          value={
                            anomaly.type ===
                            "error_rate"
                              ? `${anomaly.current}%`
                              : `${anomaly.current}ms`
                          }
                        />

                        <MiniMetric
                          label="Baseline"
                          value={
                            anomaly.type ===
                            "error_rate"
                              ? `${anomaly.baseline}%`
                              : `${anomaly.baseline}ms`
                          }
                        />

                        <MiniMetric
                          label="Change"
                          value={`${anomaly.changePct}%`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onInvestigate(
                            anomaly
                          )
                        }
                        className="
                          mt-3
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          bg-[var(--dashboard-primary)]
                          px-3
                          py-2
                          text-[9px]
                          font-black
                          text-white
                          transition
                          hover:-translate-y-0.5
                        "
                      >
                        Investigate
                        <ArrowUpRight className="
                          h-3.5
                          w-3.5
                        " />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            }
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   ROOT CAUSE
========================================================= */

function RootCauseSection({
  data,
  loading,
}: {
  data:
    | RootCauseData
    | null;

  loading: boolean;
}) {
  return (
    <section className="
      min-w-0
      rounded-[28px]
      border
      border-border
      bg-card
      p-5
      shadow-[var(--dashboard-shadow)]
      sm:p-6
    ">
      <div className="
        flex
        flex-wrap
        items-start
        justify-between
        gap-3
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-violet-500
          ">
            Correlation path
          </p>

          <h2 className="
            mt-1
            flex
            items-center
            gap-2
            text-xl
            font-black
            text-card-foreground
          ">
            <Database className="
              h-5
              w-5
              text-violet-500
            " />

            Root Cause Explorer
          </h2>

          <p className="
            mt-1
            text-xs
            leading-5
            text-muted-foreground
          ">
            Real correlated request events from the backend.
          </p>
        </div>

        {data?.requestId && (
          <span className="
            max-w-[220px]
            truncate
            rounded-full
            bg-violet-50
            px-3
            py-1.5
            font-mono
            text-[8px]
            font-bold
            text-violet-700
          ">
            {data.requestId}
          </span>
        )}
      </div>

      <div className="
        mt-5
        space-y-3
      ">
        {loading ? (
          Array.from({
            length: 3,
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
                  h-20
                  animate-pulse
                  rounded-2xl
                  bg-muted
                "
              />
            )
          )
        ) : !data ||
          data.nodes.length ===
            0 ? (
          <EmptyState message="No correlated request chain is available yet." />
        ) : (
          data.nodes.map(
            (
              node
            ) => (
              <motion.div
                key={
                  node.id
                }
                initial={{
                  opacity: 0,
                  x: -5,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                className="
                  rounded-2xl
                  border
                  border-border
                  bg-muted/30
                  p-3.5
                "
              >
                <div className="
                  flex
                  items-start
                  gap-3
                ">
                  <span className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    ${getRootCauseTone(
                      node.type
                    )}
                  `}>
                    {node.type ===
                      "critical" ||
                    node.type ===
                      "error" ? (
                      <XCircle className="
                        h-4
                        w-4
                      " />
                    ) : node.type ===
                      "warn" ? (
                      <AlertTriangle className="
                        h-4
                        w-4
                      " />
                    ) : (
                      <CheckCircle2 className="
                        h-4
                        w-4
                      " />
                    )}
                  </span>

                  <div className="
                    min-w-0
                    flex-1
                  ">
                    <div className="
                      flex
                      flex-wrap
                      items-center
                      gap-2
                    ">
                      <span className="
                        text-[9px]
                        font-black
                        text-muted-foreground
                      ">
                        #{node.order}
                      </span>

                      <span className="
                        text-xs
                        font-black
                        text-card-foreground
                      ">
                        {
                          node.service
                        }
                      </span>

                      <span className="
                        text-[9px]
                        text-muted-foreground
                      ">
                        {node.event}
                      </span>
                    </div>

                    <p className="
                      mt-1.5
                      text-[10px]
                      leading-5
                      text-muted-foreground
                    ">
                      {node.detail}
                    </p>
                  </div>

                  {node.durationMs !==
                    undefined && (
                    <span className="
                      shrink-0
                      text-[8px]
                      font-black
                      text-muted-foreground
                    ">
                      {
                        node.durationMs
                      }ms
                    </span>
                  )}
                </div>
              </motion.div>
            )
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   TRACE SECTION
========================================================= */

function TraceSection({
  trace,
  loading,
}: {
  trace:
    | SystemTraceData
    | null;

  loading: boolean;
}) {
  return (
    <section className="
      rounded-[28px]
      border
      border-border
      bg-card
      p-5
      shadow-[var(--dashboard-shadow)]
      sm:p-6
    ">
      <div className="
        flex
        flex-wrap
        items-end
        justify-between
        gap-3
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-indigo-500
          ">
            Distributed trace
          </p>

          <h2 className="
            mt-1
            flex
            items-center
            gap-2
            text-xl
            font-black
            text-card-foreground
          ">
            <TimerReset className="
              h-5
              w-5
              text-indigo-500
            " />

            Request Waterfall
          </h2>

          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">
            Latest correlated request execution path.
          </p>
        </div>

        {trace && (
          <div className="
            flex
            flex-wrap
            items-center
            gap-2
          ">
            <span className="
              max-w-[240px]
              truncate
              rounded-full
              bg-indigo-50
              px-3
              py-1.5
              font-mono
              text-[8px]
              font-black
              text-indigo-700
            ">
              {trace.traceId}
            </span>

            <span className="
              rounded-full
              bg-emerald-50
              px-3
              py-1.5
              text-[8px]
              font-black
              text-emerald-700
            ">
              {trace.totalDurationMs}ms total
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="
          mt-5
          space-y-3
        ">
          {Array.from({
            length: 5,
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
                  h-12
                  animate-pulse
                  rounded-xl
                  bg-muted
                "
              />
            )
          )}
        </div>
      ) : !trace ||
        trace.spans.length ===
          0 ? (
        <div className="mt-5">
          <EmptyState message="No trace spans are available for the latest request." />
        </div>
      ) : (
        <div className="
          mt-5
          overflow-x-auto
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        ">
          <div className="
            min-w-[760px]
            space-y-3
          ">
            {trace.spans.map(
              (
                span,
                index
              ) => {
                const total =
                  Math.max(
                    1,
                    trace.totalDurationMs
                  );

                const left =
                  Math.min(
                    92,
                    Math.max(
                      0,
                      (
                        span.startOffset /
                        total
                      ) *
                        100
                    )
                  );

                const width =
                  Math.max(
                    5,
                    Math.min(
                      100 -
                        left,
                      (
                        span.duration /
                        total
                      ) *
                        100
                    )
                  );

                return (
                  <div
                    key={
                      span.id
                    }
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >
                    <div className="
                      w-36
                      shrink-0
                    ">
                      <p className="
                        truncate
                        text-xs
                        font-black
                        text-card-foreground
                      ">
                        {
                          span.service
                        }
                      </p>

                      <p className="
                        mt-0.5
                        truncate
                        text-[8px]
                        text-muted-foreground
                      ">
                        {
                          span.event
                        }
                      </p>
                    </div>

                    <div className="
                      relative
                      h-9
                      flex-1
                      overflow-hidden
                      rounded-xl
                      border
                      border-border
                      bg-muted/35
                    ">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${width}%`,
                        }}
                        transition={{
                          duration:
                            0.45,
                          delay:
                            index *
                            0.05,
                        }}
                        style={{
                          marginLeft:
                            `${left}%`,
                        }}
                        className={`
                          absolute
                          top-1.5
                          flex
                          h-6
                          min-w-[28px]
                          items-center
                          justify-center
                          rounded-lg
                          px-2
                          text-[8px]
                          font-black
                          text-white
                          ${
                            span.status ===
                            "error"
                              ? "bg-gradient-to-r from-rose-500 to-orange-400"
                              : "bg-gradient-to-r from-indigo-600 to-violet-400"
                          }
                        `}
                      >
                        {
                          span.duration
                        }ms
                      </motion.div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   LOG TABLE
========================================================= */

function LogsSection({
  logs,
  loading,
}: {
  logs: SystemLog[];
  loading: boolean;
}) {
  return (
    <section className="
      min-w-0
      overflow-hidden
      rounded-[28px]
      border
      border-border
      bg-card
      shadow-[var(--dashboard-shadow)]
    ">
      <header className="
        flex
        flex-col
        gap-2
        border-b
        border-border
        p-5
        sm:flex-row
        sm:items-end
        sm:justify-between
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-[var(--dashboard-primary)]
          ">
            Live event stream
          </p>

          <h2 className="
            mt-1
            text-xl
            font-black
            text-card-foreground
          ">
            System Logs
          </h2>

          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">
            Latest records returned from the backend.
          </p>
        </div>

        <span className="
          rounded-full
          bg-[var(--dashboard-primary-soft)]
          px-3
          py-1.5
          text-[9px]
          font-black
          text-[var(--dashboard-primary)]
        ">
          {logs.length} loaded
        </span>
      </header>

      {loading ? (
        <div className="
          space-y-2
          p-4
        ">
          {Array.from({
            length: 7,
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
                  h-14
                  animate-pulse
                  rounded-xl
                  bg-muted
                "
              />
            )
          )}
        </div>
      ) : logs.length ===
        0 ? (
        <EmptyState message="No system log events were returned for this monitoring window." />
      ) : (
        <div className="
          overflow-x-auto
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        ">
          <table className="
            w-full
            min-w-[1000px]
            text-left
          ">
            <thead>
              <tr className="
                border-b
                border-border
                bg-muted/35
              ">
                <th className={TABLE_HEAD}>
                  Timestamp
                </th>

                <th className={TABLE_HEAD}>
                  Level
                </th>

                <th className={TABLE_HEAD}>
                  Service
                </th>

                <th className={TABLE_HEAD}>
                  Event
                </th>

                <th className={TABLE_HEAD}>
                  Result
                </th>

                <th className={TABLE_HEAD}>
                  Request
                </th>

                <th className={`${TABLE_HEAD} text-right`}>
                  Duration
                </th>
              </tr>
            </thead>

            <tbody>
              {logs.map(
                (
                  log
                ) => (
                  <tr
                    key={
                      log.id
                    }
                    className="
                      border-b
                      border-border/70
                      last:border-0
                      hover:bg-muted/25
                    "
                  >
                    <td className="
                      whitespace-nowrap
                      px-4
                      py-3.5
                      text-[9px]
                      text-muted-foreground
                    ">
                      {
                        formatLogDate(
                          log.timestamp
                        )
                      }
                    </td>

                    <td className="
                      px-4
                      py-3.5
                    ">
                      <span className={`
                        inline-flex
                        rounded-full
                        px-2.5
                        py-1
                        text-[8px]
                        font-black
                        ${getLogLevelTone(
                          log.level
                        )}
                      `}>
                        {
                          log.level
                        }
                      </span>
                    </td>

                    <td className="
                      px-4
                      py-3.5
                    ">
                      <p className="
                        max-w-[150px]
                        truncate
                        text-[10px]
                        font-black
                        text-card-foreground
                      ">
                        {
                          log.service
                        }
                      </p>

                      <p className="
                        mt-0.5
                        text-[8px]
                        text-muted-foreground
                      ">
                        {
                          log.category
                        }
                      </p>
                    </td>

                    <td className="
                      px-4
                      py-3.5
                    ">
                      <p className="
                        max-w-[260px]
                        truncate
                        text-[10px]
                        font-black
                        text-card-foreground
                      ">
                        {
                          log.event
                        }
                      </p>

                      <p className="
                        mt-0.5
                        max-w-[320px]
                        truncate
                        text-[9px]
                        text-muted-foreground
                      ">
                        {
                          log.message
                        }
                      </p>
                    </td>

                    <td className="
                      px-4
                      py-3.5
                    ">
                      <span className={`
                        inline-flex
                        rounded-full
                        px-2.5
                        py-1
                        text-[8px]
                        font-black
                        ${getResultTone(
                          log.result
                        )}
                      `}>
                        {
                          log.result
                        }
                      </span>
                    </td>

                    <td className="
                      px-4
                      py-3.5
                    ">
                      <p className="
                        max-w-[210px]
                        truncate
                        font-mono
                        text-[8px]
                        text-muted-foreground
                      ">
                        {
                          log.requestId ??
                          log.traceId ??
                          "—"
                        }
                      </p>
                    </td>

                    <td className="
                      px-4
                      py-3.5
                      text-right
                      text-[9px]
                      font-black
                      text-card-foreground
                    ">
                      {log.durationMs !==
                      undefined
                        ? `${log.durationMs}ms`
                        : "—"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   HEATMAP
========================================================= */

function HeatmapSection({
  cells,
  loading,
}: {
  cells: HeatmapCell[];
  loading: boolean;
}) {
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

  const map =
    useMemo(
      () =>
        new Map(
          cells.map(
            (
              cell
            ) => [
              `${cell.day}-${cell.hour}`,
              cell,
            ]
          )
        ),
      [cells]
    );

  return (
    <section className="
      rounded-[28px]
      border
      border-border
      bg-card
      p-5
      shadow-[var(--dashboard-shadow)]
      sm:p-6
    ">
      <div className="
        flex
        flex-wrap
        items-end
        justify-between
        gap-3
      ">
        <div>
          <p className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-indigo-500
          ">
            Operational cadence
          </p>

          <h2 className="
            mt-1
            text-xl
            font-black
            text-card-foreground
          ">
            Live Operational Heatmap
          </h2>

          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">
            Real event density and error concentration.
          </p>
        </div>

        <div className="
          flex
          flex-wrap
          items-center
          gap-2
          text-[8px]
          font-bold
          text-muted-foreground
        ">
          <Legend
            dot="bg-emerald-400"
            label="Normal"
          />

          <Legend
            dot="bg-indigo-500"
            label="Active"
          />

          <Legend
            dot="bg-amber-400"
            label="Warning"
          />

          <Legend
            dot="bg-rose-500"
            label="Failure"
          />
        </div>
      </div>

      {loading ? (
        <div className="
          mt-5
          h-72
          animate-pulse
          rounded-2xl
          bg-muted
        " />
      ) : cells.length ===
        0 ? (
        <div className="mt-5">
          <EmptyState message="No heatmap telemetry was returned for this range." />
        </div>
      ) : (
        <div className="
          mt-5
          overflow-x-auto
          pb-1
        ">
          <div className="
            min-w-[760px]
            rounded-2xl
            border
            border-border
            bg-muted/20
            p-4
          ">
            <div className="
              grid
              grid-cols-[70px_repeat(6,minmax(80px,1fr))]
              gap-2
            ">
              <div />

              {hours.map(
                (
                  hour
                ) => (
                  <div
                    key={
                      hour
                    }
                    className="
                      text-center
                      text-[8px]
                      font-black
                      text-muted-foreground
                    "
                  >
                    {hour}
                  </div>
                )
              )}

              {days.map(
                (
                  day
                ) => (
                  <React.Fragment
                    key={
                      day
                    }
                  >
                    <div className="
                      flex
                      items-center
                      text-[9px]
                      font-black
                      text-muted-foreground
                    ">
                      {day}
                    </div>

                    {hours.map(
                      (
                        hour
                      ) => (
                        <HeatmapCellView
                          key={`${day}-${hour}`}
                          cell={
                            map.get(
                              `${day}-${hour}`
                            )
                          }
                        />
                      )
                    )}
                  </React.Fragment>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   HEATMAP CELL
========================================================= */

function HeatmapCellView({
  cell,
}: {
  cell:
    | HeatmapCell
    | undefined;
}) {
  if (!cell) {
    return (
      <div className="
        h-12
        rounded-xl
        border
        border-border
        bg-muted/25
      " />
    );
  }

  return (
    <motion.div
      whileHover={{
        scale: 1.03,
      }}
      title={`${cell.day} ${cell.hour} · ${cell.events} events · ${cell.errors} errors`}
      className={`
        flex
        h-12
        flex-col
        items-center
        justify-center
        rounded-xl
        border
        ${getHeatTone(
          cell.severity
        )}
      `}
    >
      <span className="
        text-[10px]
        font-black
      ">
        {
          cell.events
        }
      </span>

      <span className="
        mt-0.5
        text-[7px]
        font-bold
        opacity-70
      ">
        {
          cell.errors
        } errors
      </span>
    </motion.div>
  );
}

/* =========================================================
   LEGEND
========================================================= */

function Legend({
  dot,
  label,
}: {
  dot: string;
  label: string;
}) {
  return (
    <span className="
      inline-flex
      items-center
      gap-1
    ">
      <span className={`
        h-2
        w-2
        rounded-sm
        ${dot}
      `} />

      {label}
    </span>
  );
}

/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="
      rounded-xl
      border
      border-border
      bg-card
      p-2.5
    ">
      <p className="
        text-[7px]
        font-black
        uppercase
        tracking-[0.1em]
        text-muted-foreground
      ">
        {label}
      </p>

      <p className="
        mt-1
        truncate
        text-[9px]
        font-black
        text-card-foreground
      ">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="
      flex
      min-h-44
      flex-col
      items-center
      justify-center
      rounded-2xl
      border
      border-dashed
      border-border
      bg-muted/25
      p-6
      text-center
    ">
      <span className="
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-xl
        bg-[var(--dashboard-primary-soft)]
        text-[var(--dashboard-primary)]
      ">
        <Activity className="
          h-5
          w-5
        " />
      </span>

      <p className="
        mt-3
        text-xs
        font-bold
        text-card-foreground
      ">
        No live data
      </p>

      <p className="
        mt-1
        max-w-sm
        text-[10px]
        leading-5
        text-muted-foreground
      ">
        {message}
      </p>
    </div>
  );
}

/* =========================================================
   ROOT CAUSE TONE
========================================================= */

function getRootCauseTone(
  type:
    | "critical"
    | "error"
    | "warn"
    | "ok"
) {
  switch (type) {
    case "critical":
      return "bg-rose-50 text-rose-600";

    case "error":
      return "bg-red-50 text-red-600";

    case "warn":
      return "bg-amber-50 text-amber-600";

    default:
      return "bg-emerald-50 text-emerald-600";
  }
}

/* =========================================================
   LOG LEVEL TONE
========================================================= */

function getLogLevelTone(
  level: SystemLog["level"]
) {
  switch (level) {
    case "CRITICAL":
      return "bg-rose-50 text-rose-700";

    case "ERROR":
      return "bg-red-50 text-red-700";

    case "WARN":
      return "bg-amber-50 text-amber-700";

    case "NOTICE":
      return "bg-indigo-50 text-indigo-700";

    case "INFO":
      return "bg-cyan-50 text-cyan-700";

    case "DEBUG":
      return "bg-slate-100 text-slate-600";

    case "TRACE":
    default:
      return "bg-violet-50 text-violet-700";
  }
}

/* =========================================================
   RESULT TONE
========================================================= */

function getResultTone(
  result: SystemLog["result"]
) {
  switch (result) {
    case "Success":
      return "bg-emerald-50 text-emerald-700";

    case "Failed":
      return "bg-rose-50 text-rose-700";

    case "Timeout":
      return "bg-amber-50 text-amber-700";

    case "Retried":
      return "bg-indigo-50 text-indigo-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* =========================================================
   HEAT TONE
========================================================= */

function getHeatTone(
  severity: HeatmapCell["severity"]
) {
  switch (severity) {
    case "failure":
      return "border-rose-200 bg-rose-500 text-white";

    case "warning":
      return "border-amber-200 bg-amber-400 text-amber-950";

    case "active":
      return "border-indigo-200 bg-indigo-500 text-white";

    case "normal":
    default:
      return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }
}

/* =========================================================
   PARSE PERCENTAGE
========================================================= */

function parsePercentage(
  value: string
): number {
  const result =
    Number(
      String(
        value ?? ""
      ).replace(
        "%",
        ""
      )
    );

  return Number.isFinite(
    result
  )
    ? result
    : 0;
}

/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
  value: Date
): string {
  return new Intl.DateTimeFormat(
    "en-BD",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ).format(value);
}

/* =========================================================
   FORMAT LOG DATE
========================================================= */

function formatLogDate(
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ).format(date);
}

/* =========================================================
   TABLE HEAD
========================================================= */

const TABLE_HEAD =
  "px-4 py-3 text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground";