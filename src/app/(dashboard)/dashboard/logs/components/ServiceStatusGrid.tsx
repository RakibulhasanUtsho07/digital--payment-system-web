"use client";

import React, {
  useMemo,
  useState,
} from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Search,
  Server,
  X,
} from "lucide-react";

export interface ServiceHealth {
  id: string;
  name: string;
  category: string;
  status:
    | "Operational"
    | "Degraded"
    | "Warning"
    | "Down"
    | "Maintenance";
  uptime: string;
  responseTimeMs: number;
  errorRate: string;
  requestCount: string;
  lastError: string;
}

export const DEMO_SERVICES:
  ServiceHealth[] = [
  {
    id: "api",
    name: "API Gateway",
    category: "Core",
    status: "Operational",
    uptime: "99.99%",
    responseTimeMs: 42,
    errorRate: "0.02%",
    requestCount: "182K",
    lastError: "None in last 24h",
  },
  {
    id: "auth",
    name: "Authentication Service",
    category: "Core",
    status: "Operational",
    uptime: "99.98%",
    responseTimeMs: 28,
    errorRate: "0.11%",
    requestCount: "42K",
    lastError: "AuthTokenExpired",
  },
  {
    id: "transfer",
    name: "Transfer Service",
    category: "Finance",
    status: "Degraded",
    uptime: "98.84%",
    responseTimeMs: 380,
    errorRate: "4.80%",
    requestCount: "29K",
    lastError: "WalletLockTimeout",
  },
  {
    id: "wallet",
    name: "Wallet Core",
    category: "Finance",
    status: "Operational",
    uptime: "99.95%",
    responseTimeMs: 64,
    errorRate: "0.20%",
    requestCount: "94K",
    lastError: "BalanceCheckFailed",
  },
  {
    id: "db",
    name: "Primary Database",
    category: "Data",
    status: "Warning",
    uptime: "99.90%",
    responseTimeMs: 142,
    errorRate: "1.10%",
    requestCount: "310K",
    lastError: "ConnectionPoolExhausted",
  },
  {
    id: "kyc",
    name: "KYC Verification Engine",
    category: "Compliance",
    status: "Operational",
    uptime: "99.70%",
    responseTimeMs: 420,
    errorRate: "0.85%",
    requestCount: "1.8K",
    lastError: "OCRTimeout",
  },
  {
    id: "cloudinary",
    name: "Media & Cloudinary",
    category: "Storage",
    status: "Operational",
    uptime: "100%",
    responseTimeMs: 88,
    errorRate: "0.00%",
    requestCount: "12K",
    lastError: "None",
  },
  {
    id: "ai",
    name: "Fraud Detection AI",
    category: "Security",
    status: "Operational",
    uptime: "99.91%",
    responseTimeMs: 110,
    errorRate: "0.05%",
    requestCount: "18K",
    lastError: "InferenceTimeout",
  },
];

const statusTone = (
  status: ServiceHealth["status"]
) => {
  switch (
    status
  ) {
    case "Operational":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "Degraded":
      return "border-amber-100 bg-amber-50 text-amber-700";

    case "Warning":
      return "border-orange-100 bg-orange-50 text-orange-700";

    case "Down":
      return "border-rose-100 bg-rose-50 text-rose-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
};

export function ServiceStatusGrid({
  services =
    DEMO_SERVICES,
}: {
  services?:
    ServiceHealth[];
}) {
  const [
    selectedService,
    setSelectedService,
  ] =
    useState<ServiceHealth | null>(
      null
    );

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<
      "all"
      | "attention"
      | "healthy"
    >("all");

  const filtered =
    useMemo(
      () =>
        services.filter(
          (
            service
          ) => {
            const matchesSearch =
              `${service.name} ${service.category}`
                .toLowerCase()
                .includes(
                  query
                    .trim()
                    .toLowerCase()
                );

            const matchesFilter =
              filter ===
                "all" ||
              (
                filter ===
                  "healthy" &&
                service.status ===
                  "Operational"
              ) ||
              (
                filter ===
                  "attention" &&
                service.status !==
                  "Operational"
              );

            return (
              matchesSearch &&
              matchesFilter
            );
          }
        ),
      [
        filter,
        query,
        services,
      ]
    );

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_45px_rgba(15,39,69,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
            Infrastructure
          </p>

          <h3 className="mt-1 flex items-center gap-2 text-xl font-black text-[#0F2745]">
            <Server className="h-5 w-5 text-blue-500" />
            Service Status
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Search, filter and inspect operational service telemetry.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Find service..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white sm:w-56"
            />
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {[
              [
                "all",
                "All",
              ],
              [
                "healthy",
                "Healthy",
              ],
              [
                "attention",
                "Attention",
              ],
            ].map(
              (
                [
                  value,
                  label,
                ]
              ) => (
                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      value as typeof filter
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-[10px] font-bold transition ${
                    filter ===
                    value
                      ? "bg-[#0F2745] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map(
          (
            service,
            index
          ) => (
            <motion.button
              key={
                service.id
              }
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
                delay:
                  index *
                  0.03,
              }}
              whileHover={{
                y: -4,
              }}
              onClick={() =>
                setSelectedService(
                  service
                )
              }
              className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 text-left transition hover:border-blue-200 hover:shadow-[0_12px_32px_rgba(30,94,168,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {service.category}
                  </p>

                  <h4 className="mt-1 truncate text-sm font-black text-slate-800">
                    {service.name}
                  </h4>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${statusTone(
                    service.status
                  )}`}
                >
                  {service.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniMetric
                  label="Response"
                  value={`${service.responseTimeMs}ms`}
                />

                <MiniMetric
                  label="Error"
                  value={
                    service.errorRate
                  }
                />
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    service.status ===
                    "Operational"
                      ? "bg-emerald-400"
                      : service.status ===
                          "Down"
                        ? "bg-rose-400"
                        : "bg-amber-400"
                  }`}
                  style={{
                    width:
                      service.status ===
                      "Operational"
                        ? "92%"
                        : service.status ===
                            "Down"
                          ? "22%"
                          : "58%",
                  }}
                />
              </div>
            </motion.button>
          )
        )}
      </div>

      {filtered.length ===
        0 && (
        <div className="mt-5 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-xs text-slate-400">
          No services match the current search and filter.
        </div>
      )}

      {/* =====================================================
          DRAWER — entrance animation intentionally unchanged
      ====================================================== */}

      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 overflow-hidden">
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
              onClick={() =>
                setSelectedService(
                  null
                )
              }
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />

            <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{
                  x: "100%",
                }}
                animate={{
                  x: 0,
                }}
                exit={{
                  x: "100%",
                }}
                className="flex w-screen max-w-md flex-col justify-between border-l border-white/10 bg-[#0B1F36] p-6 text-slate-200 shadow-2xl"
              >
                <div className="space-y-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-xs font-mono text-blue-100/50">
                        {selectedService.category}
                      </span>

                      <h2 className="text-xl font-black text-white">
                        {selectedService.name}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedService(
                          null
                        )
                      }
                      className="rounded-xl border border-white/10 bg-white/5 p-2 text-blue-100/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-blue-100/55">
                        Current Status
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-black ${statusTone(
                          selectedService.status
                        )}`}
                      >
                        {selectedService.status}
                      </span>
                    </div>

                    <DrawerMetric
                      label="30-Day Uptime"
                      value={selectedService.uptime}
                    />

                    <DrawerMetric
                      label="Requests (24h)"
                      value={selectedService.requestCount}
                    />

                    <DrawerMetric
                      label="Response Time"
                      value={`${selectedService.responseTimeMs}ms`}
                    />

                    <DrawerMetric
                      label="Error Rate"
                      value={selectedService.errorRate}
                    />
                  </div>

                  <div>
                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/45">
                      Latest Registered Error
                    </h4>

                    <div className="rounded-2xl border border-rose-300/10 bg-rose-400/5 p-4 text-xs font-mono text-rose-200">
                      {selectedService.lastError}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4 text-xs leading-5 text-blue-100/65">
                    Backend-ready: this drawer can later fetch a dedicated
                    service-details endpoint using the selected service id.
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 text-center text-[10px] text-blue-100/40">
                  Frontend telemetry preview
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-2.5 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-black text-[#0F2745]">
        {value}
      </p>
    </div>
  );
}

function DrawerMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
      <span className="text-blue-100/50">
        {label}
      </span>

      <span className="font-mono font-bold text-cyan-100">
        {value}
      </span>
    </div>
  );
}
