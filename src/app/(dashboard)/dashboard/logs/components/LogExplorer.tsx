"use client";

import React, {
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Filter,
  Info,
  Play,
  Search,
  X,
} from "lucide-react";
import type {
  LogLevel,
  SystemLog,
} from "./SystemLogTypes";
import {
  SystemStoryViewer,
} from "./SystemStoryViewer";

interface LogExplorerProps {
  onSelectLog:
    (
      log:
        SystemLog
    ) => void;

  logs?:
    SystemLog[];
}

export const DEMO_LOGS:
  SystemLog[] = [
  {
    id: "log_1",
    timestamp:
      "07:42:21.384",
    level:
      "ERROR",
    service:
      "Transfers",
    category:
      "Transaction",
    event:
      "TransactionProcessingFailed",
    message:
      "Transaction processing failed because the wallet service returned an unavailable state.",
    requestId:
      "req_73a1f9",
    durationMs:
      428,
    statusCode:
      500,
    environment:
      "Production",
    result:
      "Failed",
    source:
      "API",
  },
  {
    id: "log_2",
    timestamp:
      "07:42:21.102",
    level:
      "WARN",
    service:
      "Wallet",
    category:
      "State",
    event:
      "StateLockTimeout",
    message:
      "Failed to acquire lock for wallet balance check.",
    requestId:
      "req_73a1f9",
    durationMs:
      150,
    statusCode:
      409,
    environment:
      "Production",
    result:
      "Timeout",
    source:
      "System",
  },
  {
    id: "log_3",
    timestamp:
      "07:42:19.045",
    level:
      "INFO",
    service:
      "API",
    category:
      "Request",
    event:
      "TransferInitiated",
    message:
      "Received internal transfer request.",
    requestId:
      "req_73a1f9",
    durationMs:
      12,
    statusCode:
      200,
    environment:
      "Production",
    result:
      "Success",
    source:
      "User",
  },
  {
    id: "log_4",
    timestamp:
      "07:40:18.402",
    level:
      "INFO",
    service:
      "Authentication",
    category:
      "Session",
    event:
      "SessionValidated",
    message:
      "Protected dashboard session validation completed.",
    requestId:
      "req_21b9f2",
    durationMs:
      23,
    statusCode:
      200,
    environment:
      "Production",
    result:
      "Success",
    source:
      "System",
  },
];

const levels:
  LogLevel[] = [
  "INFO",
  "WARN",
  "ERROR",
  "CRITICAL",
];

const LevelBadge = ({
  level,
}: {
  level:
    LogLevel;
}) => {
  const styles:
    Record<
      string,
      string
    > = {
    ERROR:
      "bg-rose-50 text-rose-600 border-rose-100",

    CRITICAL:
      "bg-red-50 text-red-700 border-red-100",

    WARN:
      "bg-amber-50 text-amber-600 border-amber-100",

    INFO:
      "bg-blue-50 text-blue-600 border-blue-100",
  };

  const Icon =
    level ===
      "ERROR" ||
    level ===
      "CRITICAL"
      ? AlertCircle
      : level ===
          "WARN"
        ? AlertTriangle
        : Info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-black ${
        styles[level] ||
        "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      <Icon className="h-3 w-3" />
      {level}
    </span>
  );
};

export function LogExplorer({
  onSelectLog,
  logs =
    DEMO_LOGS,
}: LogExplorerProps) {
  const [
    showStory,
    setShowStory,
  ] =
    useState(
      false
    );

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    activeLevels,
    setActiveLevels,
  ] =
    useState<
      LogLevel[]
    >([]);

  const [
    showFilters,
    setShowFilters,
  ] =
    useState(
      false
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const pageSize =
    6;

  const filtered =
    useMemo(
      () => {
        const normalized =
          query
            .trim()
            .toLowerCase();

        return logs.filter(
          (
            log
          ) => {
            const searchTarget =
              [
                log.event,
                log.service,
                log.requestId,
                log.message,
                log.category,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase();

            const matchesSearch =
              !normalized ||
              searchTarget.includes(
                normalized
              );

            const matchesLevel =
              activeLevels.length ===
                0 ||
              activeLevels.includes(
                log.level
              );

            return (
              matchesSearch &&
              matchesLevel
            );
          }
        );
      },
      [
        activeLevels,
        logs,
        query,
      ]
    );

  const pages =
    Math.max(
      Math.ceil(
        filtered.length /
          pageSize
      ),
      1
    );

  const safePage =
    Math.min(
      page,
      pages
    );

  const visible =
    filtered.slice(
      (
        safePage -
        1
      ) *
        pageSize,
      safePage *
        pageSize
    );

  const toggleLevel =
    (
      level:
        LogLevel
    ) => {
      setPage(
        1
      );

      setActiveLevels(
        (
          current
        ) =>
          current.includes(
            level
          )
            ? current.filter(
                (
                  item
                ) =>
                  item !==
                  level
              )
            : [
                ...current,
                level,
              ]
      );
    };

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,39,69,0.05)]">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
              Event stream
            </p>

            <h3 className="mt-1 text-xl font-black text-[#0F2745]">
              Log Explorer
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Search and filter operational events without exposing a visible scrollbar.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(
                    event.target.value
                  );

                  setPage(
                    1
                  );
                }}
                placeholder="Search request, event or service..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${
                  showFilters
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                setShowStory(
                  true
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0F2745] px-4 text-xs font-black text-white transition hover:bg-[#173F6D]"
            >
              <Play className="h-4 w-4 text-cyan-300" />
              Play Story
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
            {levels.map(
              (
                level
              ) => (
                <button
                  key={
                    level
                  }
                  type="button"
                  onClick={() =>
                    toggleLevel(
                      level
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-[9px] font-black transition ${
                    activeLevels.includes(
                      level
                    )
                      ? "border-[#0F2745] bg-[#0F2745] text-white"
                      : "border-blue-100 bg-white text-slate-500"
                  }`}
                >
                  {level}
                </button>
              )
            )}

            {activeLevels.length >
              0 && (
              <button
                type="button"
                onClick={() =>
                  setActiveLevels(
                    []
                  )
                }
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[9px] font-black text-rose-500"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-h-[500px] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-[880px] w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#F7F9FC]/95 backdrop-blur">
            <tr>
              {[
                "Timestamp",
                "Level",
                "Service",
                "Event",
                "Request ID",
                "Duration",
              ].map(
                (
                  label
                ) => (
                  <th
                    key={
                      label
                    }
                    className={`border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-wide text-slate-400 ${
                      label ===
                      "Duration"
                        ? "text-right"
                        : ""
                    }`}
                  >
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {visible.map(
              (
                log
              ) => (
                <tr
                  key={
                    log.id
                  }
                  onClick={() =>
                    onSelectLog(
                      log
                    )
                  }
                  className="cursor-pointer transition hover:bg-blue-50/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-slate-400">
                    {log.timestamp}
                  </td>

                  <td className="px-4 py-3">
                    <LevelBadge
                      level={
                        log.level
                      }
                    />
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-700">
                    {log.service}
                  </td>

                  <td className="max-w-md px-4 py-3">
                    <p className="font-black text-slate-800">
                      {log.event}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-slate-400">
                      {log.message}
                    </p>
                  </td>

                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                    {log.requestId ??
                      "—"}
                  </td>

                  <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-500">
                    {log.durationMs ??
                      0}
                    ms
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {visible.length ===
          0 && (
          <div className="px-4 py-16 text-center text-xs text-slate-400">
            No events match your filters.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-[#F9FBFD] px-4 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing{" "}
          {filtered.length ===
          0
            ? 0
            : (
                safePage -
                1
              ) *
                pageSize +
              1}
          –
          {Math.min(
            safePage *
              pageSize,
            filtered.length
          )}{" "}
          of{" "}
          {filtered.length} visible events
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            disabled={
              safePage <=
              1
            }
            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.max(
                    1,
                    current -
                      1
                  )
              )
            }
            className="rounded-lg px-3 py-2 font-bold transition hover:bg-white disabled:opacity-40"
          >
            Previous
          </button>

          <span className="rounded-lg bg-[#0F2745] px-3 py-2 font-black text-white">
            {safePage}
          </span>

          <button
            type="button"
            disabled={
              safePage >=
              pages
            }
            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.min(
                    pages,
                    current +
                      1
                  )
              )
            }
            className="rounded-lg px-3 py-2 font-bold transition hover:bg-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {showStory && (
        <SystemStoryViewer
          onClose={() =>
            setShowStory(
              false
            )
          }
        />
      )}
    </section>
  );
}
