"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Download,
  FileDown,
  RefreshCcw,
  ShieldCheck,
  Clock3,
  DatabaseZap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useRouter,
} from "next/navigation";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  downloadAnalystReportCsv,
  getAnalystReports,
  type AnalystReportSummary,
} from "@/lib/api/analystApi";

const reveal = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(7px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unavailable";
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

function statusClasses(
  status: string
) {
  const normalized =
    status.toLowerCase();

  if (
    normalized ===
    "ready"
  ) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    normalized ===
      "failed" ||
    normalized ===
      "expired"
  ) {
    return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

export default function AnalystExportsPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isAnalystRole =
    user.role ===
    "analyst";

  const [
    reports,
    setReports,
  ] =
    useState<
      AnalystReportSummary[]
    >([]);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    downloadingId,
    setDownloadingId,
  ] =
    useState<
      string | null
    >(null);

  /* =====================================================
     ANALYST-ONLY PAGE GUARD
  ===================================================== */

  useEffect(() => {
    if (isAnalystRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isAnalystRole,
    router,
    user.role,
  ]);

  /* =====================================================
     LOAD REPORT HISTORY
  ===================================================== */

  const load =
    useCallback(
      async (
        silent = false
      ) => {
        if (
          !isAnalystRole
        ) {
          setLoading(
            false
          );

          setRefreshing(
            false
          );

          return;
        }

        try {
          if (silent) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const result =
            await getAnalystReports();

          setReports(
            Array.isArray(
              result
            )
              ? result
              : []
          );
        } catch (
          cause
        ) {
          setError(
            cause instanceof
              Error
              ? cause.message
              : "Unable to load export history."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        isAnalystRole,
      ]
    );

  useEffect(() => {
    if (
      !isAnalystRole
    ) {
      setLoading(false);
      return;
    }

    const timerId =
      window.setTimeout(
        () => {
          void load();
        },
        0
      );

    return () =>
      window.clearTimeout(
        timerId
      );
  }, [
    isAnalystRole,
    load,
  ]);

  /* =====================================================
     DOWNLOAD
  ===================================================== */

  const handleDownload =
    async (
      report:
        AnalystReportSummary
    ) => {
      if (
        !isAnalystRole ||
        report.status !==
          "ready"
      ) {
        return;
      }

      try {
        setDownloadingId(
          report.id
        );

        setError("");

        await downloadAnalystReportCsv(
          report.id
        );
      } catch (
        cause
      ) {
        setError(
          cause instanceof
            Error
            ? cause.message
            : "Unable to download this report."
        );
      } finally {
        setDownloadingId(
          null
        );
      }
    };

  /* =====================================================
     ROLE REDIRECTING
  ===================================================== */

  if (
    !isAnalystRole
  ) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-300">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening analyst workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Export History is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main className="grid min-h-[65vh] place-items-center">
        <div className="text-center">
          <div className="relative mx-auto h-20 w-20">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 7,
                repeat:
                  Infinity,
                ease:
                  "linear",
              }}
              className="absolute inset-0 rounded-full border border-dashed border-teal-500/35"
            />

            <motion.div
              animate={{
                rotate:
                  -360,
              }}
              transition={{
                duration: 4,
                repeat:
                  Infinity,
                ease:
                  "linear",
              }}
              className="absolute inset-2 rounded-full border border-cyan-500/30"
            />

            <motion.div
              animate={{
                scale: [
                  1,
                  1.08,
                  1,
                ],
              }}
              transition={{
                duration:
                  1.8,
                repeat:
                  Infinity,
              }}
              className="absolute inset-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 text-white shadow-lg shadow-teal-500/20"
            >
              <FileDown className="h-6 w-6" />
            </motion.div>
          </div>

          <p className="mt-5 text-sm font-black text-slate-900 dark:text-white">
            Loading export history
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Reading analyst-owned report files...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* ===================================================
          HERO
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] p-6 text-white shadow-[0_30px_90px_-45px_rgba(13,148,136,0.65)] md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [
              0,
              34,
              -12,
              0,
            ],
            y: [
              0,
              -16,
              12,
              0,
            ],
            scale: [
              1,
              1.12,
              0.96,
              1,
            ],
          }}
          transition={{
            duration: 12,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-[90px]"
        />

        <motion.div
          animate={{
            x: [
              0,
              -24,
              18,
              0,
            ],
            y: [
              0,
              18,
              -10,
              0,
            ],
          }}
          transition={{
            duration: 14,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-teal-300/15 blur-[100px]"
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

        <motion.div
          animate={{
            x: [
              "-30%",
              "130%",
            ],
          }}
          transition={{
            duration: 5.5,
            repeat:
              Infinity,
            repeatDelay:
              2.5,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_18px_rgba(34,211,238,0.9)]"
        />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-cyan-100 backdrop-blur-md">
                <FileDown className="h-3.5 w-3.5" />
                Export Intelligence
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Analyst only
              </div>
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px]">
              Export History
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80">
              Review and download analyst-owned report CSV files while they remain available.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-200/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur">
                <DatabaseZap className="h-3.5 w-3.5 text-cyan-300" />
                {reports.length} report{reports.length === 1 ? "" : "s"}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/15 bg-emerald-300/[0.08] px-3 py-1.5 text-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Secure CSV downloads
              </span>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center">
            <div className="pointer-events-none absolute -inset-6 rounded-full bg-cyan-300/10 blur-3xl" />

            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 18,
                repeat:
                  Infinity,
                ease:
                  "linear",
              }}
              className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-cyan-200/20 lg:block"
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
            </motion.div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => {
                if (
                  !isAnalystRole
                ) {
                  return;
                }

                void load(
                  true
                );
              }}
              className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs font-black text-white shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12] disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {refreshing
                ? "Refreshing"
                : "Refresh"}
            </button>
          </div>
        </div>

        {refreshing && (
          <motion.div
            initial={{
              scaleX: 0,
            }}
            animate={{
              scaleX: 1,
            }}
            transition={{
              duration: 1.15,
              repeat:
                Infinity,
            }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
          />
        )}
      </motion.section>

      {/* ===================================================
          ERROR
      ==================================================== */}

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
          className="flex items-start gap-3 rounded-[22px] border border-red-500/20 bg-red-500/[0.06] p-4 text-red-600 shadow-sm dark:text-red-400"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-black">
              Export history request failed
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {error}
            </p>
          </div>
        </motion.div>
      )}

      {/* ===================================================
          REPORTS
      ==================================================== */}

      <motion.section
        variants={reveal}
        initial="hidden"
        animate="show"
        transition={{
          duration: 0.45,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_-35px_rgba(15,118,110,0.40)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/70 to-transparent" />

        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-teal-500/15 bg-gradient-to-br from-teal-500/12 to-cyan-500/10 text-teal-700 dark:text-teal-300">
              <FileDown className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                Generated Reports
              </h2>

              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                Download only reports that are ready and have not expired.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-500/15 bg-teal-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            <Clock3 className="h-3.5 w-3.5" />
            Export archive
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="grid min-h-60 place-items-center p-6 text-center">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                <DatabaseZap className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">
                No analyst reports yet
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                Generated report exports will appear here when they are available.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                  <th className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    Report
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    Status
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    Created
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    Expires
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-white/10">
                    Download
                  </th>
                </tr>
              </thead>

              <tbody>
                {reports.map(
                  (
                    report
                  ) => {
                    const isReady =
                      report.status ===
                      "ready";

                    const isDownloading =
                      downloadingId ===
                      report.id;

                    return (
                      <motion.tr
                        key={
                          report.id
                        }
                        initial={{
                          opacity: 0,
                          y: 6,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="transition hover:bg-teal-500/[0.04]"
                      >
                        <td className="border-b border-slate-200/70 px-4 py-4 font-black text-slate-900 dark:border-white/10 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                              <FileDown className="h-4 w-4" />
                            </div>

                            <div>
                              <p>
                                {report.format}
                                {" · "}
                                {report.range}
                                {" · "}
                                {report.currency}
                              </p>

                              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Analyst export
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="border-b border-slate-200/70 px-4 py-4 dark:border-white/10">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${statusClasses(
                              report.status
                            )}`}
                          >
                            {report.status}
                          </span>
                        </td>

                        <td className="border-b border-slate-200/70 px-4 py-4 text-slate-600 dark:border-white/10 dark:text-slate-300">
                          {formatDate(
                            report.createdAt
                          )}
                        </td>

                        <td className="border-b border-slate-200/70 px-4 py-4 text-slate-600 dark:border-white/10 dark:text-slate-300">
                          {formatDate(
                            report.expiresAt
                          )}
                        </td>

                        <td className="border-b border-slate-200/70 px-4 py-4 text-right dark:border-white/10">
                          <button
                            type="button"
                            disabled={
                              !isReady ||
                              isDownloading
                            }
                            onClick={() =>
                              void handleDownload(
                                report
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/[0.07] px-3 py-2 font-black text-teal-700 transition hover:-translate-y-0.5 hover:bg-teal-500/[0.12] disabled:cursor-not-allowed disabled:opacity-40 dark:text-teal-300"
                          >
                            {isDownloading ? (
                              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}

                            {isDownloading
                              ? "Downloading"
                              : "CSV"}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </main>
  );
}
