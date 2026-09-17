"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Headphones,
  LayoutDashboard,
  Minus,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAdminOverview } from "@/hooks/useAdminOverview";

import type {
  AdminOverviewResponse,
  AttentionQueueItem,
  OverviewMetric,
  OverviewRange,
  OverviewTransaction,
  ServiceHealthItem,
  TransactionStatusBreakdown,
} from "@/types/adminOverview";

/* =========================================================
   RANGE OPTIONS
========================================================= */

const ranges: Array<{
  value: OverviewRange;
  label: string;
}> = [
  {
    value: "7d",
    label: "7 days",
  },
  {
    value: "30d",
    label: "30 days",
  },
  {
    value: "90d",
    label: "90 days",
  },
  {
    value: "1y",
    label: "1 year",
  },
];

/* =========================================================
   STATUS COLORS
========================================================= */

const statusColors: Record<
  TransactionStatusBreakdown["status"],
  string
> = {
  completed: "#10b981",
  pending: "#f59e0b",
  failed: "#f43f5e",
  reversed: "#64748b",
};

/* =========================================================
   ADMIN BRAND
========================================================= */

const ADMIN_BRAND = {
  midnight: "#0f0c1b",
  indigo: "#18102f",
  violet: "#30205a",
  purple: "#4a2678",
  highlight: "#8b5cf6",
} as const;

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboardOverview() {
  const {
    data,
    range,
    loading,
    refreshing,
    exporting,
    error,
    setRange,
    refresh,
    exportReport,
  } = useAdminOverview();

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading && !data) {
    return <OverviewSkeleton />;
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (!data) {
    return (
      <OverviewError
        message={
          error ??
          "Overview data is unavailable."
        }
        onRetry={refresh}
      />
    );
  }

  /* =======================================================
     SAFE DATA
  ======================================================= */

  const safeData: AdminOverviewResponse = {
    ...data,

    generatedAt:
      typeof data.generatedAt ===
        "string" &&
      data.generatedAt
        ? data.generatedAt
        : new Date().toISOString(),

    currency:
      typeof data.currency ===
        "string" &&
      data.currency
        ? data.currency
        : "BDT",

    kpis: {
      totalUsers: safeMetric(
        data.kpis?.totalUsers
      ),

      activeWallets: safeMetric(
        data.kpis?.activeWallets
      ),

      transactionVolume: safeMetric(
        data.kpis?.transactionVolume
      ),

      platformRevenue: safeMetric(
        data.kpis?.platformRevenue
      ),

      pendingKyc: safeMetric(
        data.kpis?.pendingKyc
      ),

      riskAlerts: safeMetric(
        data.kpis?.riskAlerts
      ),
    },

    series: Array.isArray(
      data.series
    )
      ? data.series
      : [],

    transactionStatuses:
      Array.isArray(
        data.transactionStatuses
      )
        ? data.transactionStatuses
        : [],

    recentTransactions:
      Array.isArray(
        data.recentTransactions
      )
        ? data.recentTransactions
        : [],

    attentionQueue:
      Array.isArray(
        data.attentionQueue
      )
        ? data.attentionQueue
        : [],

    serviceHealth:
      Array.isArray(
        data.serviceHealth
      )
        ? data.serviceHealth
        : [],
  };

  /* =======================================================
     HEALTH
  ======================================================= */

  const unhealthyServices =
    safeData.serviceHealth.filter(
      (service) =>
        service.status !==
        "operational"
    ).length;

  const overallStatus =
    unhealthyServices === 0
      ? "Operational"
      : `${unhealthyServices} service issue${
          unhealthyServices > 1
            ? "s"
            : ""
        }`;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="
        min-w-0
        space-y-6
        overflow-x-hidden
        pb-12
        text-foreground
      "
    >
      {/* ===================================================
          HERO
      ==================================================== */}

      <OverviewHeader
        generatedAt={
          safeData.generatedAt
        }
        range={range}
        refreshing={
          refreshing
        }
        exporting={
          exporting
        }
        operational={
          unhealthyServices ===
          0
        }
        overallStatus={
          overallStatus
        }
        onRangeChange={
          setRange
        }
        onRefresh={
          refresh
        }
        onExport={
          exportReport
        }
      />

      {/* ===================================================
          ERROR
      ==================================================== */}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className="
              flex
              flex-col
              items-start
              justify-between
              gap-3
              rounded-2xl
              border
              px-4
              py-3
              text-sm
              sm:flex-row
              sm:items-center
            "
            style={{
              borderColor:
                "color-mix(in srgb, var(--dashboard-warning) 28%, var(--border))",

              background:
                "color-mix(in srgb, var(--dashboard-warning) 10%, var(--card))",
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <CircleAlert
                className="h-4 w-4 shrink-0"
                style={{
                  color:
                    "var(--dashboard-warning)",
                }}
              />

              <span className="truncate font-medium">
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={refresh}
              className="
                shrink-0
                font-black
                transition
                hover:underline
              "
              style={{
                color:
                  ADMIN_BRAND.highlight,
              }}
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          KPI
      ==================================================== */}

      <KpiGrid
        data={
          safeData
        }
      />

      {/* ===================================================
          CHART ROW
      ==================================================== */}

      <section
        className="
          grid
          min-w-0
          gap-5
          xl:grid-cols-[minmax(0,1.75fr)_minmax(310px,.65fr)]
        "
      >
        <VolumeChart
          data={
            safeData
          }
        />

        <StatusBreakdown
          data={
            safeData
          }
        />
      </section>

      {/* ===================================================
          TRANSACTIONS / ATTENTION
      ==================================================== */}

      <section
        className="
          grid
          min-w-0
          gap-5
          xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]
        "
      >
        <RecentTransactions
          transactions={
            safeData.recentTransactions
          }
        />

        <AttentionQueue
          items={
            safeData.attentionQueue
          }
        />
      </section>

      {/* ===================================================
          SERVICE HEALTH / QUICK ACTIONS
      ==================================================== */}

      <section
        className="
          grid
          min-w-0
          gap-5
          xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]
        "
      >
        <ServiceHealth
          services={
            safeData.serviceHealth
          }
        />

        <QuickActions />
      </section>
    </main>
  );
}

/* =========================================================
   HERO
========================================================= */

function OverviewHeader({
  generatedAt,
  range,
  refreshing,
  exporting,
  operational,
  overallStatus,
  onRangeChange,
  onRefresh,
  onExport,
}: {
  generatedAt: string;
  range: OverviewRange;
  refreshing: boolean;
  exporting: boolean;
  operational: boolean;
  overallStatus: string;
  onRangeChange: (
    range: OverviewRange
  ) => void;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <motion.header
      initial={{
        opacity: 0,
        y: 18,
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
      className="
        relative
        isolate
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        p-5
        text-white
        shadow-[0_30px_90px_rgba(28,16,61,.26)]
        sm:p-7
        lg:p-8
      "
      style={{
        background:
          `linear-gradient(135deg, ${ADMIN_BRAND.midnight} 0%, ${ADMIN_BRAND.indigo} 34%, ${ADMIN_BRAND.violet} 66%, ${ADMIN_BRAND.purple} 100%)`,
      }}
    >
      {/* =================================================
          AMBIENT ORBS
      ================================================= */}

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-28
          -top-28
          h-[390px]
          w-[390px]
          rounded-full
          bg-violet-400/20
          blur-[105px]
        "
        animate={{
          scale: [
            0.88,
            1.13,
            0.88,
          ],
          opacity: [
            0.22,
            0.58,
            0.22,
          ],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-32
          left-[26%]
          h-[300px]
          w-[300px]
          rounded-full
          bg-indigo-400/15
          blur-[105px]
        "
        animate={{
          x: [
            -20,
            24,
            -20,
          ],
          y: [
            0,
            -15,
            0,
          ],
          opacity: [
            0.18,
            0.42,
            0.18,
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* =================================================
          GRID
      ================================================= */}

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-0
        "
        animate={{
          opacity: [
            0.035,
            0.085,
            0.035,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",

          backgroundSize:
            "36px 36px",
        }}
      />

      {/* =================================================
          CONTENT
      ================================================= */}

      <div
        className="
          relative
          z-10
          flex
          min-w-0
          flex-col
          gap-8
          xl:flex-row
          xl:items-center
          xl:justify-between
        "
      >
        {/* =================================================
            LEFT
        ================================================= */}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <motion.span
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
                  0.12,
              }}
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-violet-300/20
                bg-white/[0.08]
                px-3
                py-1.5
                text-[9px]
                font-black
                uppercase
                tracking-[0.16em]
                text-violet-100
                backdrop-blur-md
              "
            >
              <LayoutDashboard className="h-3.5 w-3.5" />

              Admin Command Center
            </motion.span>

            <motion.span
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
                  0.18,
              }}
              className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                px-3
                py-1.5
                text-[9px]
                font-black
                uppercase
                tracking-[0.12em]
                ${
                  operational
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : "border-amber-300/20 bg-amber-300/10 text-amber-100"
                }
              `}
            >
              <motion.span
                animate={{
                  scale: [
                    0.8,
                    1.2,
                    0.8,
                  ],
                  opacity: [
                    0.65,
                    1,
                    0.65,
                  ],
                }}
                transition={{
                  duration: 1.8,
                  repeat:
                    Infinity,
                }}
                className={`
                  h-1.5
                  w-1.5
                  rounded-full
                  ${
                    operational
                      ? "bg-emerald-300"
                      : "bg-amber-300"
                  }
                `}
              />

              {overallStatus}
            </motion.span>
          </div>

          <motion.h1
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
                0.14,
              duration:
                0.45,
            }}
            className="
              mt-5
              text-3xl
              font-black
              tracking-[-0.045em]
              text-white
              sm:text-4xl
              lg:text-[48px]
            "
          >
            Platform Overview
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay:
                0.2,
              duration:
                0.45,
            }}
            className="
              mt-3
              max-w-2xl
              text-sm
              leading-6
              text-violet-100/70
              sm:text-[15px]
            "
          >
            Monitor money movement, customer activity,
            verification queues and operational health from
            one focused administrative workspace.
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay:
                0.27,
            }}
            className="mt-4 flex flex-wrap items-center gap-3"
          >
            <span
              className="
                inline-flex
                items-center
                gap-2
                text-[10px]
                font-bold
                text-violet-100/60
              "
            >
              <CalendarDays className="h-3.5 w-3.5" />

              Updated{" "}
              {formatDateTime(
                generatedAt
              )}
            </span>

            <span className="h-1 w-1 rounded-full bg-violet-300/40" />

            <span className="text-[10px] font-bold text-violet-100/55">
              Live platform metrics
            </span>
          </motion.div>
        </div>

        {/* =================================================
            RIGHT CONTROLS
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay:
              0.18,
            duration:
              0.45,
          }}
          className="
            flex
            w-full
            max-w-[430px]
            flex-col
            gap-3
            xl:min-w-[390px]
            xl:items-end
          "
        >
          {/* RANGE CARD */}

          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-[20px]
              border
              border-white/10
              bg-white/[0.045]
              p-1
              shadow-[0_12px_35px_rgba(0,0,0,.10)]
              backdrop-blur-xl
            "
          >
            <motion.div
              animate={{
                x: [
                  "-20%",
                  "115%",
                ],
              }}
              transition={{
                duration:
                  5,
                repeat:
                  Infinity,
                repeatDelay:
                  4,
                ease: "easeInOut",
              }}
              className="
                pointer-events-none
                absolute
                top-0
                h-full
                w-[20%]
                rotate-[12deg]
                bg-white/10
                blur-xl
              "
            />

            <div
              className="
                relative
                grid
                grid-cols-4
                gap-1
              "
            >
              {ranges.map(
                (
                  item
                ) => {
                  const active =
                    range ===
                    item.value;

                  return (
                    <motion.button
                      key={
                        item.value
                      }
                      type="button"
                      aria-pressed={
                        active
                      }
                      onClick={() =>
                        onRangeChange(
                          item.value
                        )
                      }
                      whileHover={{
                        y: -1,
                      }}
                      whileTap={{
                        scale:
                          0.97,
                      }}
                      className={`
                        relative
                        rounded-[14px]
                        px-2
                        py-2.5
                        text-[10px]
                        font-black
                        transition-all
                        sm:px-3
                        ${
                          active
                            ? "bg-white text-[#3b2368] shadow-[0_8px_22px_rgba(0,0,0,.18)]"
                            : "text-violet-100/70 hover:bg-white/10 hover:text-white"
                        }
                      `}
                    >
                      {active && (
                        <motion.span
                          layoutId="overview-range-active"
                          className="
                            absolute
                            inset-0
                            rounded-[14px]
                            ring-1
                            ring-white/40
                          "
                        />
                      )}

                      <span className="relative z-10">
                        {
                          item.label
                        }
                      </span>
                    </motion.button>
                  );
                }
              )}
            </div>
          </div>

          {/* BUTTONS */}

          <div
            className="
              grid
              w-full
              grid-cols-2
              gap-2
              sm:flex
              sm:w-auto
            "
          >
            <HeaderButton
              icon={
                Download
              }
              label="Export report"
              busy={
                exporting
              }
              onClick={
                onExport
              }
            />

            <HeaderButton
              icon={
                RefreshCw
              }
              label="Refresh data"
              busy={
                refreshing
              }
              onClick={
                onRefresh
              }
              primary
            />
          </div>
        </motion.div>
      </div>

      {/* =================================================
          DECORATIVE BOTTOM LINE
      ================================================= */}

      <motion.div
        animate={{
          opacity: [
            0.3,
            0.9,
            0.3,
          ],
          scaleX: [
            0.75,
            1,
            0.75,
          ],
        }}
        transition={{
          duration: 3.8,
          repeat:
            Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          bottom-0
          left-[8%]
          right-[8%]
          h-px
          origin-center
          bg-gradient-to-r
          from-transparent
          via-violet-300/60
          to-transparent
        "
      />
    </motion.header>
  );
}

/* =========================================================
   HEADER BUTTON
========================================================= */

function HeaderButton({
  icon: Icon,
  label,
  busy,
  primary = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  busy: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -3,
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.97,
      }}
      disabled={busy}
      onClick={
        onClick
      }
      className={`
        inline-flex
        h-11
        items-center
        justify-center
        gap-2
        rounded-xl
        border
        px-4
        text-[10px]
        font-black
        transition-all
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${
          primary
            ? "border-white bg-white text-[#3b2368] shadow-[0_10px_25px_rgba(0,0,0,.14)] hover:bg-violet-50"
            : "border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.14]"
        }
      `}
    >
      <Icon
        className={`
          h-4
          w-4
          ${
            busy
              ? "animate-spin"
              : ""
          }
        `}
      />

      {busy
        ? "Working..."
        : label}
    </motion.button>
  );
}

/* =========================================================
   KPI GRID
========================================================= */

function KpiGrid({
  data,
}: {
  data: AdminOverviewResponse;
}) {
  const cards: Array<{
    label: string;
    metric: OverviewMetric;
    icon: LucideIcon;
    iconBackground: string;
    iconColor: string;
    formatter: (
      value: number
    ) => string;
  }> = [
    {
      label:
        "Total users",

      metric:
        data.kpis.totalUsers,

      icon:
        Users,

      iconBackground:
        "color-mix(in srgb, var(--dashboard-primary) 12%, transparent)",

      iconColor:
        "var(--dashboard-primary)",

      formatter:
        formatCompact,
    },

    {
      label:
        "Active wallets",

      metric:
        data.kpis.activeWallets,

      icon:
        WalletCards,

      iconBackground:
        "color-mix(in srgb, var(--dashboard-success) 12%, transparent)",

      iconColor:
        "var(--dashboard-success)",

      formatter:
        formatCompact,
    },

    {
      label:
        "Transaction volume",

      metric:
        data.kpis.transactionVolume,

      icon:
        ArrowLeftRight,

      iconBackground:
        "color-mix(in srgb, var(--dashboard-primary) 12%, transparent)",

      iconColor:
        "var(--dashboard-primary)",

      formatter: (
        value
      ) =>
        formatCompactCurrency(
          value,
          data.currency
        ),
    },

    {
      label:
        "Platform revenue",

      metric:
        data.kpis.platformRevenue,

      icon:
        BadgeDollarSign,

      iconBackground:
        "color-mix(in srgb, var(--dashboard-primary) 16%, transparent)",

      iconColor:
        ADMIN_BRAND.highlight,

      formatter: (
        value
      ) =>
        formatCompactCurrency(
          value,
          data.currency
        ),
    },

    {
      label:
        "Pending KYC",

      metric:
        data.kpis.pendingKyc,

      icon:
        ShieldCheck,

      iconBackground:
        "color-mix(in srgb, var(--dashboard-warning) 13%, transparent)",

      iconColor:
        "var(--dashboard-warning)",

      formatter:
        formatCompact,
    },

    {
      label:
        "Risk alerts",

      metric:
        data.kpis.riskAlerts,

      icon:
        ShieldAlert,

      iconBackground:
        "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)",

      iconColor:
        "var(--dashboard-danger)",

      formatter:
        formatCompact,
    },
  ];

  return (
    <section
      className="
        grid
        min-w-0
        grid-cols-1
        gap-3
        sm:grid-cols-2
        xl:grid-cols-3
        2xl:grid-cols-6
      "
    >
      {cards.map(
        (
          card,
          index
        ) => (
          <motion.article
            key={
              card.label
            }
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay:
                0.05 +
                index *
                  0.055,
            }}
            whileHover={{
              y: -5,
              scale: 1.01,
            }}
            className="
              min-w-0
              rounded-[22px]
              border
              border-border
              bg-card
              p-4
              shadow-[var(--dashboard-shadow)]
              transition-colors
              duration-300
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-muted-foreground
                  "
                >
                  {
                    card.label
                  }
                </p>

                <p
                  className="
                    mt-2
                    truncate
                    text-2xl
                    font-black
                    tracking-[-0.03em]
                    text-card-foreground
                  "
                >
                  {card.formatter(
                    card.metric.value
                  )}
                </p>
              </div>

              <motion.span
                whileHover={{
                  rotate: -4,
                  scale: 1.07,
                }}
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                "
                style={{
                  background:
                    card.iconBackground,

                  color:
                    card.iconColor,
                }}
              >
                <card.icon className="h-5 w-5" />
              </motion.span>
            </div>

            <MetricChange
              value={
                card.metric
                  .changePercent
              }
            />
          </motion.article>
        )
      )}
    </section>
  );
}

/* =========================================================
   METRIC CHANGE
========================================================= */

function MetricChange({
  value,
}: {
  value: number;
}) {
  const positive =
    value > 0;

  const negative =
    value < 0;

  const Icon =
    positive
      ? ArrowUpRight
      : negative
        ? ArrowDownRight
        : Minus;

  return (
    <p
      className="
        mt-3
        inline-flex
        items-center
        gap-1
        text-[10px]
        font-bold
      "
      style={{
        color:
          positive
            ? "var(--dashboard-success)"
            : negative
              ? "var(--dashboard-danger)"
              : "var(--muted-foreground)",
      }}
    >
      <Icon className="h-3.5 w-3.5" />

      {Math.abs(
        value
      ).toFixed(1)}
      %

      <span className="font-medium text-muted-foreground">
        vs previous period
      </span>
    </p>
  );
}

/* =========================================================
   VOLUME CHART
========================================================= */

function VolumeChart({
  data,
}: {
  data: AdminOverviewResponse;
}) {
  return (
    <DashboardCard
      title="Money movement"
      subtitle="Processed volume and platform revenue"
      icon={
        Activity
      }
      accent
    >
      {data.series.length >
      0 ? (
        <div
          className="
            mt-3
            h-[310px]
            w-full
            min-w-0
          "
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={
                data.series
              }
              margin={{
                top: 14,
                right: 8,
                left: -12,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="adminVolumeFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      ADMIN_BRAND.highlight
                    }
                    stopOpacity={
                      0.36
                    }
                  />

                  <stop
                    offset="100%"
                    stopColor={
                      ADMIN_BRAND.highlight
                    }
                    stopOpacity={
                      0
                    }
                  />
                </linearGradient>

                <linearGradient
                  id="adminRevenueFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#06b6d4"
                    stopOpacity={
                      0.24
                    }
                  />

                  <stop
                    offset="100%"
                    stopColor="#06b6d4"
                    stopOpacity={
                      0
                    }
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="4 7"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 10,
                }}
                tickFormatter={
                  formatChartDate
                }
                minTickGap={
                  28
                }
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 10,
                }}
                tickFormatter={
                  formatCompact
                }
                width={62}
              />

              <Tooltip
                contentStyle={{
                  background:
                    "var(--card)",
                  border:
                    "1px solid var(--border)",
                  borderRadius:
                    14,
                  boxShadow:
                    "var(--dashboard-shadow)",
                  color:
                    "var(--card-foreground)",
                  fontSize:
                    12,
                }}
                labelStyle={{
                  color:
                    "var(--card-foreground)",
                }}
                itemStyle={{
                  color:
                    "var(--card-foreground)",
                }}
                labelFormatter={(
                  label
                ) =>
                  formatDateTime(
                    String(
                      label
                    )
                  )
                }
                formatter={(
                  value,
                  name
                ) => [
                  formatCompactCurrency(
                    finiteAmount(
                      value
                    ),
                    data.currency
                  ),
                  name ===
                  "volume"
                    ? "Volume"
                    : "Revenue",
                ]}
              />

              <Area
                type="monotone"
                dataKey="volume"
                stroke={
                  ADMIN_BRAND.highlight
                }
                strokeWidth={
                  3
                }
                fill="url(#adminVolumeFill)"
                animationDuration={
                  950
                }
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#06b6d4"
                strokeWidth={
                  2
                }
                fill="url(#adminRevenueFill)"
                animationDuration={
                  1150
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
    </DashboardCard>
  );
}

/* =========================================================
   STATUS BREAKDOWN
========================================================= */

function StatusBreakdown({
  data,
}: {
  data: AdminOverviewResponse;
}) {
  const total =
    data.transactionStatuses.reduce(
      (
        sum,
        item
      ) =>
        sum +
        finiteAmount(
          item.count
        ),
      0
    );

  return (
    <DashboardCard
      title="Transaction health"
      subtitle="Status distribution"
      icon={
        ShieldCheck
      }
    >
      {data.transactionStatuses
        .length > 0 ? (
        <div
          className="
            grid
            min-h-[310px]
            items-center
            gap-5
            sm:grid-cols-2
            xl:grid-cols-1
            2xl:grid-cols-2
          "
        >
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={
                    data.transactionStatuses
                  }
                  dataKey="count"
                  nameKey="status"
                  innerRadius={
                    55
                  }
                  outerRadius={
                    78
                  }
                  paddingAngle={
                    3
                  }
                  animationDuration={
                    900
                  }
                >
                  {data.transactionStatuses.map(
                    (
                      entry
                    ) => (
                      <Cell
                        key={
                          entry.status
                        }
                        fill={
                          statusColors[
                            entry.status
                          ]
                        }
                        stroke="transparent"
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background:
                      "var(--card)",
                    border:
                      "1px solid var(--border)",
                    borderRadius:
                      12,
                    boxShadow:
                      "var(--dashboard-shadow)",
                    color:
                      "var(--card-foreground)",
                    fontSize:
                      12,
                  }}
                  formatter={(
                    value
                  ) =>
                    formatCompact(
                      finiteAmount(
                        value
                      )
                    )
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                flex
                flex-col
                items-center
                justify-center
              "
            >
              <strong
                className="
                  text-2xl
                  font-black
                  text-card-foreground
                "
              >
                {formatCompact(
                  total
                )}
              </strong>

              <span
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-wider
                  text-muted-foreground
                "
              >
                Transactions
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {data.transactionStatuses.map(
              (
                item
              ) => (
                <motion.div
                  key={
                    item.status
                  }
                  whileHover={{
                    x: 2,
                  }}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    border-border
                    bg-muted/45
                    px-3
                    py-2.5
                    transition
                  "
                >
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      capitalize
                      text-card-foreground
                    "
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          statusColors[
                            item.status
                          ],
                      }}
                    />

                    {
                      item.status
                    }
                  </span>

                  <span
                    className="
                      text-xs
                      font-black
                    "
                    style={{
                      color:
                        ADMIN_BRAND.highlight,
                    }}
                  >
                    {finiteAmount(
                      item.percentage
                    ).toFixed(1)}
                    %
                  </span>
                </motion.div>
              )
            )}
          </div>
        </div>
      ) : (
        <EmptyChart />
      )}
    </DashboardCard>
  );
}

/* =========================================================
   RECENT TRANSACTIONS
========================================================= */

function RecentTransactions({
  transactions,
}: {
  transactions: OverviewTransaction[];
}) {
  return (
    <DashboardCard
      title="Recent transactions"
      subtitle="Latest platform activity"
      icon={
        ArrowLeftRight
      }
      actionHref="/dashboard/all-transactions"
      actionLabel="View all"
      accent
    >
      {transactions.length >
      0 ? (
        <div
          className="
            mt-3
            overflow-x-auto
            [scrollbar-width:none]
            [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr
                className="
                  border-b
                  border-border
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-muted-foreground
                "
              >
                <th className="py-3 pr-4">
                  Reference
                </th>

                <th className="py-3 pr-4">
                  Parties
                </th>

                <th className="py-3 pr-4">
                  Amount
                </th>

                <th className="py-3 pr-4">
                  Status
                </th>

                <th className="py-3">
                  Time
                </th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(
                (
                  transaction,
                  index
                ) => {
                  const amount =
                    finiteAmount(
                      transaction.amount
                    );

                  return (
                    <motion.tr
                      key={
                        transaction.id
                      }
                      initial={{
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay:
                          index *
                          0.025,
                      }}
                      className="
                        border-b
                        border-border/70
                        text-xs
                        last:border-0
                        transition
                        hover:bg-muted/40
                      "
                    >
                      <td
                        className="
                          py-3.5
                          pr-4
                          font-bold
                          text-card-foreground
                        "
                      >
                        {
                          transaction.reference
                        }
                      </td>

                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-card-foreground">
                          {
                            transaction.senderName
                          }
                        </p>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          to{" "}
                          {
                            transaction.receiverName
                          }
                        </p>
                      </td>

                      <td
                        className="
                          py-3.5
                          pr-4
                          font-black
                        "
                        style={{
                          color:
                            amount ===
                            0
                              ? "var(--muted-foreground)"
                              : ADMIN_BRAND.highlight,
                        }}
                      >
                        {formatCurrency(
                          amount,
                          transaction.currency
                        )}
                      </td>

                      <td className="py-3.5 pr-4">
                        <StatusBadge
                          status={
                            transaction.status
                          }
                        />
                      </td>

                      <td className="py-3.5 text-muted-foreground">
                        {formatRelativeTime(
                          transaction.createdAt
                        )}
                      </td>
                    </motion.tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No recent transactions for this period." />
      )}
    </DashboardCard>
  );
}

/* =========================================================
   ATTENTION QUEUE
========================================================= */

function AttentionQueue({
  items,
}: {
  items: AttentionQueueItem[];
}) {
  return (
    <DashboardCard
      title="Needs attention"
      subtitle="Priority operational queues"
      icon={
        AlertTriangle
      }
    >
      {items.length >
      0 ? (
        <div className="mt-3 space-y-2.5">
          {items.map(
            (
              item,
              index
            ) => (
              <motion.div
                key={
                  item.id
                }
                initial={{
                  opacity: 0,
                  x: 8,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.04,
                }}
              >
                <Link
                  href={
                    item.href
                  }
                  className="
                    group
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-border
                    bg-muted/35
                    p-3
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-sm
                  "
                >
                  <span
                    className={`
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      ${queueTone(
                        item.severity
                      )}
                    `}
                  >
                    <QueueIcon
                      type={
                        item.type
                      }
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-black text-card-foreground">
                      {
                        item.title
                      }
                    </span>

                    <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                      {
                        item.description
                      }
                    </span>
                  </span>

                  <span
                    className="
                      rounded-lg
                      border
                      border-border
                      bg-card
                      px-2
                      py-1
                      text-xs
                      font-black
                      text-card-foreground
                      shadow-sm
                    "
                  >
                    {
                      item.count
                    }
                  </span>

                  <ChevronRight
                    className="
                      h-4
                      w-4
                      shrink-0
                      text-muted-foreground/40
                      transition
                      group-hover:translate-x-0.5
                    "
                    style={{
                      color:
                        ADMIN_BRAND.highlight,
                    }}
                  />
                </Link>
              </motion.div>
            )
          )}
        </div>
      ) : (
        <EmptyState
          message="No priority items need attention."
          success
        />
      )}
    </DashboardCard>
  );
}

/* =========================================================
   SERVICE HEALTH
========================================================= */

function ServiceHealth({
  services,
}: {
  services: ServiceHealthItem[];
}) {
  return (
    <DashboardCard
      title="Service health"
      subtitle="Live operational telemetry"
      icon={
        Server
      }
      actionHref="/dashboard/logs"
      actionLabel="Open logs"
    >
      {services.length >
      0 ? (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {services.map(
            (
              service,
              index
            ) => {
              const Icon =
                service.status ===
                "operational"
                  ? CheckCircle2
                  : service.status ===
                      "degraded"
                    ? AlertTriangle
                    : XCircle;

              const iconColor =
                service.status ===
                "operational"
                  ? "var(--dashboard-success)"
                  : service.status ===
                      "degraded"
                    ? "var(--dashboard-warning)"
                    : "var(--dashboard-danger)";

              return (
                <motion.div
                  key={
                    service.id
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
                    delay:
                      index *
                      0.04,
                  }}
                  whileHover={{
                    y: -2,
                  }}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-border
                    bg-muted/35
                    p-3.5
                    transition-all
                  "
                >
                  <motion.div
                    animate={
                      service.status ===
                      "operational"
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
                      duration: 2.4,
                      repeat:
                        Infinity,
                    }}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{
                        color:
                          iconColor,
                      }}
                    />
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-card-foreground">
                      {
                        service.name
                      }
                    </p>

                    <p className="mt-1 text-[10px] capitalize text-muted-foreground">
                      {
                        service.status
                      }{" "}
                      ·{" "}
                      {
                        service.latencyMs
                      }
                      ms
                    </p>
                  </div>

                  <span
                    className="
                      text-[11px]
                      font-black
                    "
                    style={{
                      color:
                        ADMIN_BRAND.highlight,
                    }}
                  >
                    {finiteAmount(
                      service.uptimePercent
                    ).toFixed(2)}
                    %
                  </span>
                </motion.div>
              );
            }
          )}
        </div>
      ) : (
        <EmptyState message="Health telemetry is unavailable." />
      )}
    </DashboardCard>
  );
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

function QuickActions() {
  const actions = [
    {
      label:
        "Review KYC requests",

      href:
        "/dashboard/kyc-requests",

      icon:
        ShieldCheck,

      background:
        "color-mix(in srgb, var(--dashboard-success) 12%, transparent)",

      color:
        "var(--dashboard-success)",
    },

    {
      label:
        "Manage system users",

      href:
        "/dashboard/users",

      icon:
        UserCheck,

      background:
        "color-mix(in srgb, var(--dashboard-primary) 12%, transparent)",

      color:
        "var(--dashboard-primary)",
    },

    {
      label:
        "Investigate risk alerts",

      href:
        "/dashboard/security",

      icon:
        ShieldAlert,

      background:
        "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)",

      color:
        "var(--dashboard-danger)",
    },

    {
      label:
        "Open support queue",

      href:
        "/dashboard/support",

      icon:
        Headphones,

      background:
        "color-mix(in srgb, var(--dashboard-primary) 16%, transparent)",

      color:
        ADMIN_BRAND.highlight,
    },
  ];

  return (
    <DashboardCard
      title="Quick actions"
      subtitle="Jump to common admin tasks"
      icon={
        LayoutDashboard
      }
    >
      <div
        className="
          mt-3
          grid
          gap-2.5
          sm:grid-cols-2
          xl:grid-cols-1
          2xl:grid-cols-2
        "
      >
        {actions.map(
          (
            action,
            index
          ) => {
            const Icon =
              action.icon;

            return (
              <motion.div
                key={
                  action.href
                }
                initial={{
                  opacity: 0,
                  x: 8,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.04,
                }}
              >
                <Link
                  href={
                    action.href
                  }
                  className="
                    group
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-border
                    bg-muted/30
                    p-3
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-sm
                  "
                >
                  <motion.span
                    whileHover={{
                      scale: 1.06,
                      rotate: -3,
                    }}
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                    "
                    style={{
                      background:
                        action.background,

                      color:
                        action.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.span>

                  <span className="flex-1 text-xs font-bold text-card-foreground">
                    {
                      action.label
                    }
                  </span>

                  <ChevronRight
                    className="
                      h-4
                      w-4
                      text-muted-foreground/40
                      transition
                      group-hover:translate-x-0.5
                    "
                    style={{
                      color:
                        ADMIN_BRAND.highlight,
                    }}
                  />
                </Link>
              </motion.div>
            );
          }
        )}
      </div>
    </DashboardCard>
  );
}

/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  children,
  actionHref,
  actionLabel,
  accent = false,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  accent?: boolean;
}) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -2,
      }}
      className="
        min-w-0
        overflow-hidden
        rounded-[26px]
        border
        border-border
        bg-card
        p-4
        shadow-[var(--dashboard-shadow)]
        transition-colors
        duration-300
        sm:p-5
      "
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <motion.span
            whileHover={{
              scale: 1.06,
              rotate: -4,
            }}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
            "
            style={{
              background:
                accent
                  ? "color-mix(in srgb, var(--dashboard-primary) 14%, transparent)"
                  : "var(--dashboard-primary-soft)",

              color:
                accent
                  ? ADMIN_BRAND.highlight
                  : "var(--dashboard-primary)",
            }}
          >
            <Icon className="h-5 w-5" />
          </motion.span>

          <div className="min-w-0">
            <h2
              className="
                truncate
                text-sm
                font-black
                tracking-[-0.01em]
                text-card-foreground
              "
            >
              {
                title
              }
            </h2>

            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {
                subtitle
              }
            </p>
          </div>
        </div>

        {actionHref &&
          actionLabel && (
            <Link
              href={
                actionHref
              }
              className="
                inline-flex
                shrink-0
                items-center
                gap-1
                text-[10px]
                font-black
                transition
                hover:underline
              "
              style={{
                color:
                  ADMIN_BRAND.highlight,
              }}
            >
              {
                actionLabel
              }

              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
      </header>

      {children}
    </motion.article>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: OverviewTransaction["status"];
}) {
  const styles: Record<
    OverviewTransaction["status"],
    {
      background: string;
      color: string;
    }
  > = {
    completed: {
      background:
        "color-mix(in srgb, var(--dashboard-success) 12%, transparent)",

      color:
        "var(--dashboard-success)",
    },

    pending: {
      background:
        "color-mix(in srgb, var(--dashboard-warning) 13%, transparent)",

      color:
        "var(--dashboard-warning)",
    },

    failed: {
      background:
        "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)",

      color:
        "var(--dashboard-danger)",
    },

    reversed: {
      background:
        "var(--muted)",

      color:
        "var(--muted-foreground)",
    },
  };

  return (
    <span
      className="
        inline-flex
        rounded-full
        px-2.5
        py-1
        text-[9px]
        font-black
        capitalize
      "
      style={{
        background:
          styles[
            status
          ].background,

        color:
          styles[
            status
          ].color,
      }}
    >
      {
        status
      }
    </span>
  );
}

/* =========================================================
   QUEUE ICON
========================================================= */

function QueueIcon({
  type,
}: {
  type: AttentionQueueItem["type"];
}) {
  const icons: Record<
    AttentionQueueItem["type"],
    LucideIcon
  > = {
    kyc:
      ShieldCheck,

    risk:
      ShieldAlert,

    support:
      Headphones,

    transaction:
      ArrowLeftRight,
  };

  const Icon =
    icons[type];

  return (
    <Icon className="h-5 w-5" />
  );
}

/* =========================================================
   QUEUE TONE
========================================================= */

function queueTone(
  severity: AttentionQueueItem["severity"]
) {
  if (
    severity ===
    "high"
  ) {
    return `
      bg-[color-mix(in_srgb,var(--dashboard-danger)_11%,transparent)]
      text-[var(--dashboard-danger)]
    `;
  }

  if (
    severity ===
    "medium"
  ) {
    return `
      bg-[color-mix(in_srgb,var(--dashboard-warning)_12%,transparent)]
      text-[var(--dashboard-warning)]
    `;
  }

  return `
    bg-[var(--dashboard-primary-soft)]
    text-[var(--dashboard-primary)]
  `;
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
  return (
    <div
      className="
        flex
        h-[300px]
        items-center
        justify-center
        text-sm
        font-medium
        text-muted-foreground
      "
    >
      No analytics data for this period.
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  message,
  success = false,
}: {
  message: string;
  success?: boolean;
}) {
  const Icon =
    success
      ? CheckCircle2
      : Clock3;

  return (
    <div
      className="
        mt-4
        flex
        min-h-28
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-border
        bg-muted/35
        p-5
        text-center
      "
    >
      <Icon
        className="h-6 w-6"
        style={{
          color:
            success
              ? "var(--dashboard-success)"
              : "var(--muted-foreground)",
        }}
      />

      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {
          message
        }
      </p>
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function OverviewSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <motion.div
        animate={{
          opacity: [
            0.65,
            1,
            0.65,
          ],
        }}
        transition={{
          duration: 1.7,
          repeat:
            Infinity,
        }}
        className="
          h-64
          rounded-[30px]
          bg-muted
        "
      />

      <div
        className="
          grid
          grid-cols-2
          gap-3
          xl:grid-cols-3
          2xl:grid-cols-6
        "
      >
        {Array.from({
          length: 6,
        }).map(
          (
            _,
            index
          ) => (
            <motion.div
              key={
                index
              }
              animate={{
                opacity: [
                  0.55,
                  1,
                  0.55,
                ],
              }}
              transition={{
                duration: 1.5,
                repeat:
                  Infinity,
                delay:
                  index *
                  0.08,
              }}
              className="
                h-32
                rounded-[22px]
                bg-muted
              "
            />
          )
        )}
      </div>

      <div
        className="
          grid
          gap-5
          xl:grid-cols-[1.75fr_.65fr]
        "
      >
        <div className="h-[390px] rounded-[26px] bg-muted" />

        <div className="h-[390px] rounded-[26px] bg-muted" />
      </div>
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function OverviewError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="
        flex
        min-h-[420px]
        flex-col
        items-center
        justify-center
        rounded-[30px]
        border
        border-border
        bg-card
        p-8
        text-center
        shadow-[var(--dashboard-shadow)]
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
        "
        style={{
          background:
            "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)",

          color:
            "var(--dashboard-danger)",
        }}
      >
        <CircleAlert className="h-7 w-7" />
      </span>

      <h1
        className="
          mt-4
          text-xl
          font-black
          text-card-foreground
        "
      >
        Could not load overview
      </h1>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {
          message
        }
      </p>

      <button
        type="button"
        onClick={
          onRetry
        }
        className="
          mt-5
          inline-flex
          h-11
          items-center
          gap-2
          rounded-xl
          px-5
          text-xs
          font-black
          text-white
          shadow-sm
          transition
          hover:-translate-y-0.5
        "
        style={{
          background:
            `linear-gradient(135deg, ${ADMIN_BRAND.indigo}, ${ADMIN_BRAND.purple})`,
        }}
      >
        <RefreshCw className="h-4 w-4" />

        Try again
      </button>
    </div>
  );
}

/* =========================================================
   SAFE METRIC
========================================================= */

function safeMetric(
  metric:
    | OverviewMetric
    | null
    | undefined
): OverviewMetric {
  return {
    value:
      finiteAmount(
        metric?.value
      ),

    previousValue:
      finiteAmount(
        metric?.previousValue
      ),

    changePercent:
      finiteAmount(
        metric?.changePercent
      ),
  };
}

/* =========================================================
   ROBUST NUMBER PARSER
========================================================= */

function finiteAmount(
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

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .trim()
        .replace(
          /,/g,
          ""
        );

    if (
      !normalized
    ) {
      return 0;
    }

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

  if (
    typeof value ===
      "object" &&
    value !== null
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    if (
      typeof record.$numberDecimal ===
      "string"
    ) {
      const parsed =
        Number(
          record.$numberDecimal
        );

      return Number.isFinite(
        parsed
      )
        ? parsed
        : 0;
    }

    if (
      typeof record.value ===
      "number"
    ) {
      return Number.isFinite(
        record.value
      )
        ? record.value
        : 0;
    }

    if (
      typeof record.value ===
      "string"
    ) {
      const parsed =
        Number(
          record.value
        );

      return Number.isFinite(
        parsed
      )
        ? parsed
        : 0;
    }

    if (
      typeof record.amount ===
      "number"
    ) {
      return Number.isFinite(
        record.amount
      )
        ? record.amount
        : 0;
    }

    if (
      typeof record.amount ===
      "string"
    ) {
      const parsed =
        Number(
          record.amount
        );

      return Number.isFinite(
        parsed
      )
        ? parsed
        : 0;
    }
  }

  return 0;
}

/* =========================================================
   COMPACT NUMBER
========================================================= */

function formatCompact(
  value: number
): string {
  return new Intl.NumberFormat(
    "en",
    {
      notation:
        "compact",

      maximumFractionDigits:
        1,
    }
  ).format(
    finiteAmount(
      value
    )
  );
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  value: number,
  currency: string
): string {
  const amount =
    finiteAmount(
      value
    );

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        currencyDisplay:
          "narrowSymbol",

        maximumFractionDigits:
          0,
      }
    ).format(
      amount
    );
  } catch {
    return `${currency} ${amount.toLocaleString(
      "en-BD"
    )}`;
  }
}

/* =========================================================
   COMPACT CURRENCY
========================================================= */

function formatCompactCurrency(
  value: number,
  currency: string
): string {
  const amount =
    finiteAmount(
      value
    );

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency,

        currencyDisplay:
          "narrowSymbol",

        notation:
          "compact",

        maximumFractionDigits:
          1,
      }
    ).format(
      amount
    );
  } catch {
    return `${currency} ${formatCompact(
      amount
    )}`;
  }
}

/* =========================================================
   CHART DATE
========================================================= */

function formatChartDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month:
        "short",

      day:
        "numeric",
    }
  ).format(date);
}

/* =========================================================
   DATE TIME
========================================================= */

function formatDateTime(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "just now";
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

/* =========================================================
   RELATIVE TIME
========================================================= */

function formatRelativeTime(
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

  const milliseconds =
    Date.now() -
    date.getTime();

  if (
    !Number.isFinite(
      milliseconds
    )
  ) {
    return "—";
  }

  if (
    milliseconds < 0
  ) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      milliseconds /
        60_000
    );

  if (
    minutes < 1
  ) {
    return "Just now";
  }

  if (
    minutes < 60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (
    hours < 24
  ) {
    return `${hours}h ago`;
  }

  return `${Math.floor(
    hours / 24
  )}d ago`;
}