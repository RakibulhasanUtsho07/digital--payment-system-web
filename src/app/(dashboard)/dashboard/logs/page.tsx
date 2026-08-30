"use client";

import React, {
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Download,
  RefreshCw,
  Shield,
  Sparkles,
  Wifi,
} from "lucide-react";

import {
  SystemPulse,
  type PulseNode,
} from "./components/SystemPulse";
import {
  LogExplorer,
  DEMO_LOGS,
} from "./components/LogExplorer";
import {
  ServiceStatusGrid,
  DEMO_SERVICES,
} from "./components/ServiceStatusGrid";
import {
  ErrorSpikeDetector,
} from "./components/ErrorSpikeDetector";
import {
  OperationalHeatmap,
} from "./components/OperationalHeatmap";
import {
  RootCauseExplorer,
} from "./components/RootCauseExplorer";
import {
  TraceWaterfall,
} from "./components/TraceWaterfall";

const pulseNodes: PulseNode[] =
  DEMO_SERVICES.slice(0, 5).map(
    (service, index) => ({
      id: service.id,
      label:
        service.name
          .replace(" Service", "")
          .replace(" Gateway", ""),
      status:
        service.status === "Operational"
          ? "ok"
          : service.status === "Degraded"
            ? "warn"
            : service.status === "Warning"
              ? "warn"
              : "error",
      responseTimeMs:
        service.responseTimeMs,
      errorRate:
        parseFloat(service.errorRate),
      x:
        [12, 82, 86, 15, 50][index] ?? 50,
      y:
        [22, 18, 80, 82, 90][index] ?? 50,
    })
  );

export default function SystemLogsPage() {
  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(
    new Date()
  );

  const healthScore =
    useMemo(() => {
      const penalties =
        DEMO_SERVICES.reduce(
          (
            total,
            service
          ) => {
            const statusPenalty =
              service.status ===
              "Operational"
                ? 0
                : service.status ===
                    "Degraded"
                  ? 2.5
                  : service.status ===
                      "Warning"
                    ? 1.5
                    : service.status ===
                        "Maintenance"
                      ? 3
                      : 7;

            const errorPenalty =
              Math.min(
                parseFloat(
                  service.errorRate
                ),
                8
              ) * 0.35;

            return (
              total +
              statusPenalty +
              errorPenalty
            );
          },
          0
        );

      return Math.max(
        0,
        Math.min(
          100,
          100 - penalties
        )
      );
    }, []);

  const degradedServices =
    useMemo(
      () =>
        DEMO_SERVICES.filter(
          (service) =>
            service.status !==
            "Operational"
        ),
      []
    );

  const handleRefresh =
    async () => {
      setIsRefreshing(
        true
      );

      /*
       * Backend-ready:
       * replace the small delay with:
       * await logsApi.getDashboard(...)
       */
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            700
          )
      );

      setLastUpdated(
        new Date()
      );

      setIsRefreshing(
        false
      );
    };

  const handleExport =
    () => {
      const payload =
        JSON.stringify(
          {
            generatedAt:
              new Date()
                .toISOString(),

            source:
              "system-logs-demo",

            logs:
              DEMO_LOGS,

            services:
              DEMO_SERVICES,
          },
          null,
          2
        );

      const blob =
        new Blob(
          [payload],
          {
            type:
              "application/json",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        `system-logs-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      link.click();

      URL.revokeObjectURL(
        url
      );
    };

  return (
    <div className="min-w-0 bg-[#F4F7FB] px-3 py-4 text-[#0F2745] sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* =====================================================
            PREMIUM COMMAND HEADER
        ====================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: -12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-[#07172B] via-[#0B2947] to-[#0F4C78] p-5 text-white shadow-[0_24px_80px_rgba(11,41,71,0.18)] sm:p-7"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-cyan-200/10" />
          <div className="pointer-events-none absolute -right-6 -top-8 h-56 w-56 rounded-full border border-blue-200/10" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">
                  <Activity className="h-3.5 w-3.5" />
                  Observability Console
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                  Monitoring active
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                System Logs
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/75">
                Monitor operational events, service health, latency, failures,
                traces and system signals from one backend-ready control center.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-semibold text-blue-100/65">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Administrator
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  System Operations
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <Wifi className="h-3.5 w-3.5 text-cyan-200" />
                  Updated {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/security"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15"
              >
                <Shield className="h-4 w-4 text-cyan-200" />
                Security Center
              </Link>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/15"
              >
                <Download className="h-4 w-4" />
                Export Logs
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-xs font-black text-[#082238] shadow-[0_12px_35px_rgba(34,211,238,0.22)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {isRefreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>
        </motion.header>

        {/* =====================================================
            QUICK TELEMETRY STRIP
        ====================================================== */}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TelemetryCard
            label="Health score"
            value={`${healthScore.toFixed(1)}%`}
            note="Calculated from service state"
            tone="emerald"
          />

          <TelemetryCard
            label="Events loaded"
            value={DEMO_LOGS.length.toLocaleString()}
            note="Current frontend dataset"
            tone="blue"
          />

          <TelemetryCard
            label="Needs attention"
            value={degradedServices.length.toString()}
            note="Degraded or warning services"
            tone="amber"
          />

          <TelemetryCard
            label="Critical signals"
            value={DEMO_LOGS.filter((log) => log.level === "ERROR" || log.level === "CRITICAL").length.toString()}
            note="Visible error events"
            tone="rose"
          />
        </div>

        {/* =====================================================
            SYSTEM PULSE + HEALTH
        ====================================================== */}

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
          <div className="overflow-hidden rounded-[28px] border border-[#173B5D]/20 bg-[#0B2038] p-4 text-white shadow-[0_20px_60px_rgba(15,39,69,0.12)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/60">
                  Live topology
                </p>

                <h2 className="mt-1 flex items-center gap-2 text-lg font-black">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  System Pulse
                </h2>
              </div>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-blue-100/65">
                Select a node for telemetry
              </span>
            </div>

            <SystemPulse
              nodes={pulseNodes}
            />
          </div>

          <div className="grid gap-4">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,39,69,0.05)]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                System health
              </p>

              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="text-4xl font-black tracking-tight text-[#0F2745]">
                  {healthScore.toFixed(1)}

                  <span className="ml-1 text-base text-slate-400">
                    /100
                  </span>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
                  Strong
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${healthScore}%`,
                  }}
                  transition={{
                    duration: 0.9,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400"
                />
              </div>
            </div>

            <div className="rounded-[26px] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-[0_12px_40px_rgba(15,39,69,0.04)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />

                <h3 className="text-sm font-black text-[#0F2745]">
                  Operational Signals
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                {degradedServices.length > 0 ? (
                  degradedServices.slice(0, 3).map((service) => (
                    <div
                      key={service.id}
                      className="rounded-2xl border border-amber-100 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {service.name}
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-slate-500">
                            {service.status} • {service.responseTimeMs}ms • {service.errorRate} errors
                          </p>
                        </div>

                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No active operational warnings.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            SERVICE GRID
        ====================================================== */}

        <ServiceStatusGrid
          services={DEMO_SERVICES}
        />

        {/* =====================================================
            ANOMALY + ROOT CAUSE
        ====================================================== */}

        <section className="grid items-start gap-5 lg:grid-cols-2">
          <ErrorSpikeDetector />

          <RootCauseExplorer />
        </section>

        {/* =====================================================
            REQUEST TRACE
        ====================================================== */}

        <TraceWaterfall />

        {/* =====================================================
            LOG EXPLORER
        ====================================================== */}

        <LogExplorer
          logs={DEMO_LOGS}
          onSelectLog={() => {
            /*
             * Backend-ready hook:
             * pass selected log to a future details drawer
             * or fetch /logs/:id.
             */
          }}
        />

        {/* =====================================================
            OPERATIONAL HEATMAP
        ====================================================== */}

        <OperationalHeatmap />
      </div>
    </div>
  );
}

function TelemetryCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone:
    | "emerald"
    | "blue"
    | "amber"
    | "rose";
}) {
  const tones = {
    emerald:
      "from-emerald-50 to-white text-emerald-700 border-emerald-100",

    blue:
      "from-blue-50 to-white text-blue-700 border-blue-100",

    amber:
      "from-amber-50 to-white text-amber-700 border-amber-100",

    rose:
      "from-rose-50 to-white text-rose-700 border-rose-100",
  };

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className={`rounded-[22px] border bg-gradient-to-br p-4 shadow-[0_10px_32px_rgba(15,39,69,0.04)] ${tones[tone]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-65">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">
        {note}
      </p>
    </motion.div>
  );
}
