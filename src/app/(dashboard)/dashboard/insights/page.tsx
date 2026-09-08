"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import type {
  Variants,
} from "framer-motion";

import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  AlertCircle,
  Calendar,
  ChevronDown,
  Loader2,
  RefreshCw,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
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

import {
  getFinancialInsights,
  type CashflowData,
  type ExpenseCategoryData,
  type FinancialInsightsResponse,
  type InsightsTimeRange,
} from "@/lib/api/insightsApi";

/* =========================================================
   TYPES
========================================================= */

type TimeRange =
  InsightsTimeRange;

interface CategoryData
  extends ExpenseCategoryData {
  color: string;
}

/* =========================================================
   CATEGORY COLORS
========================================================= */

const CATEGORY_COLORS = [
  "#06B6D4",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
];

/* =========================================================
   UTILITIES
========================================================= */

function formatCurrency(
  amount: number
): string {
  return `৳ ${Number(
    amount || 0
  ).toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatTrend(
  value:
    | number
    | null
    | undefined
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "New";
  }

  const prefix =
    value > 0
      ? "+"
      : "";

  return `${prefix}${value}%`;
}

/* =========================================================
   MOTION VARIANTS
========================================================= */

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },

  show: {
    opacity: 1,

    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },

  show: {
    opacity: 1,
    y: 0,

    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

/* =========================================================
   PAGE
========================================================= */

export default function InsightsPage() {
  const [
    timeRange,
    setTimeRange,
  ] =
    useState<TimeRange>(
      "month"
    );

  const [
    data,
    setData,
  ] =
    useState<FinancialInsightsResponse | null>(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    isDropdownOpen,
    setIsDropdownOpen,
  ] =
    useState(false);

  /* =======================================================
     LOAD INSIGHTS
  ======================================================== */

  const loadInsights =
    async (
      range: TimeRange
    ) => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response =
          await getFinancialInsights(
            range
          );

        if (
          !response ||
          response.success !== true
        ) {
          throw new Error(
            response?.message ||
              "Unable to load financial insights."
          );
        }

        setData(
          response
        );
      } catch (
        error
      ) {
        console.error(
          "Insights loading error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load financial insights."
        );
      } finally {
        setIsLoading(false);
      }
    };

  /* =======================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    void loadInsights(
      timeRange
    );
  }, [
    timeRange,
  ]);

  /* =======================================================
     DERIVED DATA
  ======================================================== */

  const summary =
    data?.summary || {
      totalIncome: 0,
      totalSpent: 0,
      netBalance: 0,
    };

  const cashflow:
    CashflowData[] =
      data?.cashflow || [];

  const categories:
    CategoryData[] =
      (
        data?.expenseCategories ||
        []
      ).map(
        (
          category,
          index
        ) => ({
          ...category,

          color:
            CATEGORY_COLORS[
              index %
                CATEGORY_COLORS.length
            ],
        })
      );

  const incomeTrend =
    formatTrend(
      data?.trends?.income
    );

  const expenseTrend =
    formatTrend(
      data?.trends?.expense
    );

  /* =========================================================
     RENDER
  ========================================================== */

  return (
    <main
      className="
        mx-auto
        w-full
        max-w-6xl
        space-y-6
        px-4
        pb-12
        text-foreground
        sm:px-6
      "
    >
      {/* ===================================================
          TOP HEADER
          
          IMPORTANT:
          No overflow-hidden here.
          This allows dropdown to escape parent bounds.
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: -10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="
          relative
          isolate
          overflow-visible
          rounded-[30px]
          border
          border-white/10
          bg-gradient-to-br
          from-[#17103B]
          via-[#33218B]
          to-[#6D28D9]
          p-5
          text-white
          shadow-[0_20px_60px_rgba(49,46,129,0.22)]
          sm:p-7
          lg:p-8
        "
      >
        {/* Decorative glows */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-fuchsia-400/10
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-28
            -left-20
            h-72
            w-72
            rounded-full
            bg-indigo-300/10
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-16
            -top-16
            h-48
            w-48
            rounded-full
            border
            border-white/10
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-10
            top-8
            h-28
            w-28
            rounded-full
            border
            border-white/[0.08]
          "
        />

        {/* Header content */}

        <div
          className="
            relative
            z-20
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          {/* LEFT */}

          <div className="min-w-0">
            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/15
                bg-white/10
                px-3
                py-1.5
                text-[10px]
                font-black
                uppercase
                tracking-[0.17em]
                text-indigo-100
                backdrop-blur-md
              "
            >
              <span
                className="
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-md
                  bg-white/10
                "
              >
                <Activity className="h-3 w-3" />
              </span>

              Analytics

              <span className="h-1 w-1 rounded-full bg-cyan-200/70" />

              <span
                className="
                  normal-case
                  tracking-normal
                  text-white/55
                "
              >
                Financial overview
              </span>
            </div>

            <h1
              className="
                text-[2rem]
                font-black
                tracking-[-0.045em]
                text-white
                sm:text-[2.7rem]
                lg:text-[3rem]
              "
            >
              Financial Insights
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-[13px]
                leading-6
                text-indigo-100/70
                sm:text-sm
              "
            >
              Track your spending habits,
              income, expenses and
              cashflow trends from one
              intelligent financial view.
            </p>

            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <span
                className="
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
                "
              >
                <span
                  className="
                    h-1.5
                    w-1.5
                    animate-pulse
                    rounded-full
                    bg-emerald-300
                  "
                />

                Live analytics
              </span>

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.06]
                  px-3
                  py-1.5
                  text-[9px]
                  font-semibold
                  text-indigo-100/70
                "
              >
                <Wallet className="h-3 w-3" />

                Wallet activity
              </span>
            </div>
          </div>

          {/* =================================================
              RANGE DROPDOWN

              Parent = relative + high z-index
              Dropdown = absolute + very high z-index
          ================================================= */}

          <div
            className="
              relative
              z-[60]
              shrink-0
            "
          >
            <button
              type="button"
              onClick={() =>
                setIsDropdownOpen(
                  (current) =>
                    !current
                )
              }
              aria-expanded={
                isDropdownOpen
              }
              aria-haspopup="listbox"
              className="
                flex
                min-w-[190px]
                items-center
                gap-2
                rounded-[15px]
                border
                border-white/15
                bg-white/10
                px-4
                py-3
                text-left
                text-sm
                font-bold
                text-white
                shadow-sm
                backdrop-blur-md
                transition
                hover:border-white/25
                hover:bg-white/15
                focus:outline-none
                focus:ring-2
                focus:ring-white/20
              "
            >
              <Calendar className="h-4 w-4 text-indigo-100/75" />

              <span className="flex-1 capitalize">
                This{" "}
                {timeRange}
              </span>

              <ChevronDown
                className={`
                  h-4
                  w-4
                  text-indigo-100/70
                  transition-transform
                  ${
                    isDropdownOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 8,
                    scale: 0.96,
                  }}
                  transition={{
                    duration: 0.15,
                  }}
                  role="listbox"
                  className="
                    absolute
                    right-0
                    top-full
                    z-[100]
                    mt-2
                    w-48
                    overflow-hidden
                    rounded-[16px]
                    border
                    border-border
                    bg-popover
                    p-1.5
                    text-popover-foreground
                    shadow-[0_20px_50px_rgba(0,0,0,0.20)]
                  "
                >
                  <div
                    className="
                      px-2.5
                      pb-1.5
                      pt-2
                    "
                  >
                    <p
                      className="
                        text-[8px]
                        font-black
                        uppercase
                        tracking-[0.14em]
                        text-muted-foreground
                      "
                    >
                      Time Range
                    </p>
                  </div>

                  {(
                    [
                      "week",
                      "month",
                      "year",
                    ] as TimeRange[]
                  ).map(
                    (
                      range
                    ) => (
                      <button
                        key={
                          range
                        }
                        type="button"
                        role="option"
                        aria-selected={
                          timeRange ===
                          range
                        }
                        onClick={() => {
                          setTimeRange(
                            range
                          );

                          setIsDropdownOpen(
                            false
                          );
                        }}
                        className={`
                          flex
                          w-full
                          items-center
                          justify-between
                          rounded-[11px]
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          font-semibold
                          capitalize
                          transition-colors
                          ${
                            timeRange ===
                            range
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }
                        `}
                      >
                        <span>
                          This{" "}
                          {range}
                        </span>

                        {timeRange ===
                          range && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      {errorMessage && (
        <motion.section
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            flex
            flex-col
            gap-4
            rounded-[22px]
            border
            border-rose-500/20
            bg-rose-500/10
            p-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="
                mt-0.5
                h-5
                w-5
                shrink-0
                text-rose-600
                dark:text-rose-400
              "
            />

            <div>
              <p
                className="
                  text-sm
                  font-extrabold
                  text-rose-700
                  dark:text-rose-300
                "
              >
                Unable to load insights
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-rose-600
                  dark:text-rose-300/80
                "
              >
                {errorMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadInsights(
                timeRange
              )
            }
            className="
              inline-flex
              h-10
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-[12px]
              bg-rose-600
              px-4
              text-xs
              font-extrabold
              text-white
              transition
              hover:bg-rose-700
              dark:bg-rose-500
              dark:hover:bg-rose-600
            "
          >
            <RefreshCw className="h-4 w-4" />

            Try Again
          </button>
        </motion.section>
      )}

      {/* ===================================================
          CONTENT
      ==================================================== */}

      <motion.div
        variants={
          containerVariants
        }
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* =================================================
            SUMMARY
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-3">
          {/* INCOME */}

          <motion.div
            variants={
              itemVariants
            }
            whileHover={{
              y: -4,
            }}
            className="
              relative
              overflow-hidden
              rounded-[26px]
              border
              border-indigo-400/20
              bg-gradient-to-br
              from-[#17103B]
              via-[#33218B]
              to-[#4C1D95]
              p-6
              text-white
              shadow-[0_18px_45px_rgba(49,46,129,0.18)]
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-12
                -top-12
                h-32
                w-32
                rounded-full
                bg-cyan-300/10
                blur-2xl
              "
            />

            <div className="relative z-10 flex items-center justify-between">
              <p className="text-sm font-medium text-indigo-100/75">
                Total Income
              </p>

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/10
                  bg-white/10
                "
              >
                <TrendingUp className="h-4 w-4 text-emerald-300" />
              </div>
            </div>

            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-white">
              {isLoading
                ? "—"
                : formatCurrency(
                    summary.totalIncome
                  )}
            </p>

            <div
              className="
                relative
                z-10
                mt-4
                flex
                items-center
                gap-1.5
                text-xs
                font-medium
                text-indigo-100/70
              "
            >
              <span
                className="
                  flex
                  items-center
                  gap-0.5
                  rounded-full
                  bg-emerald-400/15
                  px-2
                  py-0.5
                  text-emerald-300
                "
              >
                <ArrowUpRight className="h-3 w-3" />

                {incomeTrend}
              </span>

              <span>
                vs last{" "}
                {timeRange}
              </span>
            </div>
          </motion.div>

          {/* SPENT */}

          <motion.div
            variants={
              itemVariants
            }
            whileHover={{
              y: -4,
            }}
            className="
              relative
              overflow-hidden
              rounded-[26px]
              border
              border-border
              bg-card
              p-6
              text-card-foreground
              shadow-[var(--dashboard-shadow)]
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-10
                -top-10
                h-28
                w-28
                rounded-full
                bg-rose-500/5
                blur-2xl
              "
            />

            <div className="relative z-10 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total Spent
              </p>

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-rose-500/10
                  text-rose-600
                  dark:text-rose-400
                "
              >
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>

            <p className="relative z-10 mt-4 text-3xl font-black tracking-tight text-foreground">
              {isLoading
                ? "—"
                : formatCurrency(
                    summary.totalSpent
                  )}
            </p>

            <div
              className="
                relative
                z-10
                mt-4
                flex
                items-center
                gap-1.5
                text-xs
                font-medium
                text-muted-foreground
              "
            >
              <span
                className="
                  flex
                  items-center
                  gap-0.5
                  rounded-full
                  bg-rose-500/10
                  px-2
                  py-0.5
                  text-rose-600
                  dark:text-rose-400
                "
              >
                <ArrowDownRight className="h-3 w-3" />

                {expenseTrend}
              </span>

              <span>
                vs last{" "}
                {timeRange}
              </span>
            </div>
          </motion.div>

          {/* NET */}

          <motion.div
            variants={
              itemVariants
            }
            whileHover={{
              y: -4,
            }}
            className="
              relative
              overflow-hidden
              rounded-[26px]
              border
              border-border
              bg-card
              p-6
              text-card-foreground
              shadow-[var(--dashboard-shadow)]
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -left-10
                -top-10
                h-28
                w-28
                rounded-full
                bg-primary/5
                blur-2xl
              "
            />

            <div className="relative z-10 flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Net Flow
              </p>

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-primary/10
                  text-primary
                "
              >
                <Wallet className="h-4 w-4" />
              </div>
            </div>

            <p
              className={`
                relative
                z-10
                mt-4
                text-3xl
                font-black
                tracking-tight
                ${
                  summary.netBalance >=
                  0
                    ? "text-foreground"
                    : "text-rose-600 dark:text-rose-400"
                }
              `}
            >
              {isLoading
                ? "—"
                : formatCurrency(
                    summary.netBalance
                  )}
            </p>

            <div className="relative z-10 mt-4 text-xs font-medium">
              {summary.netBalance >
              0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Positive cashflow
                </span>
              ) : summary.netBalance <
                0 ? (
                <span className="text-rose-600 dark:text-rose-400">
                  Deficit cashflow
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Balanced cashflow
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* =================================================
            SMART INSIGHT
        ================================================== */}

        <motion.div
          variants={
            itemVariants
          }
          className="
            flex
            items-start
            gap-4
            rounded-[22px]
            border
            border-cyan-500/15
            bg-cyan-500/5
            p-5
            shadow-sm
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-cyan-500/10
              text-cyan-600
              dark:text-cyan-400
            "
          >
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-foreground">
              Financial Assistant
            </h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {data?.insight ||
                "Your real transaction analytics will appear here once completed activity is available for this period."}
            </p>
          </div>
        </motion.div>

        {/* =================================================
            CHART GRID

            Desktop:
            3 columns total

            Cashflow = 2 columns
            Expense = 1 column
        ================================================== */}

        <div
          className="
            grid
            min-w-0
            gap-6
            lg:grid-cols-3
          "
        >
          {/* =================================================
              CASHFLOW ANALYTICS — 2/3
          ================================================== */}

          <motion.div
            variants={
              itemVariants
            }
            className="
              min-w-0
              overflow-hidden
              rounded-[26px]
              border
              border-border
              bg-card
              p-6
              text-card-foreground
              shadow-[var(--dashboard-shadow)]
              lg:col-span-2
            "
          >
            <div className="mb-6">
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.15em]
                  text-primary
                "
              >
                Cashflow
              </p>

              <h2
                className="
                  mt-1
                  text-lg
                  font-extrabold
                  text-foreground
                "
              >
                Cashflow Analytics
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                Income vs Expenses over time
              </p>
            </div>

            <div className="h-[300px] w-full min-w-0">
              {isLoading ? (
                <div
                  className="
                    flex
                    h-full
                    items-center
                    justify-center
                    rounded-[18px]
                    bg-muted/50
                  "
                >
                  <Loader2
                    className="
                      h-6
                      w-6
                      animate-spin
                      text-muted-foreground
                    "
                  />
                </div>
              ) : cashflow.length ===
                0 ? (
                <EmptyChartState text="No cashflow data available for this period." />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <AreaChart
                    data={
                      cashflow
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="colorIncome"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={
                            0.3
                          }
                        />

                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={
                            0
                          }
                        />
                      </linearGradient>

                      <linearGradient
                        id="colorExpense"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EF4444"
                          stopOpacity={
                            0.25
                          }
                        />

                        <stop
                          offset="95%"
                          stopColor="#EF4444"
                          stopOpacity={
                            0
                          }
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.7}
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      dy={10}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickFormatter={(
                        value
                      ) =>
                        `৳${Math.round(
                          Number(
                            value
                          ) / 1000
                        )}k`
                      }
                    />

                    <Tooltip
                      cursor={{
                        stroke:
                          "hsl(var(--border))",
                        strokeWidth:
                          1,
                      }}
                      contentStyle={{
                        borderRadius:
                          "14px",
                        border:
                          "1px solid hsl(var(--border))",
                        background:
                          "hsl(var(--popover))",
                        color:
                          "hsl(var(--popover-foreground))",
                        boxShadow:
                          "0 14px 35px rgba(0,0,0,0.12)",
                      }}
                      labelStyle={{
                        color:
                          "hsl(var(--foreground))",
                        fontWeight:
                          800,
                      }}
                      itemStyle={{
                        color:
                          "hsl(var(--foreground))",
                      }}
                      formatter={(
                        value
                      ) => [
                        formatCurrency(
                          Number(
                            value ??
                              0
                          )
                        ),
                        "Amount",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      name="Income"
                    />

                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#EF4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      name="Expense"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* =================================================
              EXPENSE BREAKDOWN — 1/3
          ================================================== */}

          <motion.div
            variants={
              itemVariants
            }
            className="
              min-w-0
              overflow-hidden
              rounded-[26px]
              border
              border-border
              bg-card
              p-6
              text-card-foreground
              shadow-[var(--dashboard-shadow)]
              lg:col-span-1
            "
          >
            <div>
              <div className="flex items-center gap-2">
                <div
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-xl
                    bg-primary/10
                    text-primary
                  "
                >
                  <PieChartIcon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-[9px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      text-primary
                    "
                  >
                    Categories
                  </p>

                  <h2
                    className="
                      mt-0.5
                      text-lg
                      font-extrabold
                      text-foreground
                    "
                  >
                    Expense Breakdown
                  </h2>
                </div>
              </div>

              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                Completed outgoing transactions
              </p>
            </div>

            <div className="mt-4 min-h-[250px]">
              {isLoading ? (
                <div
                  className="
                    flex
                    h-[250px]
                    items-center
                    justify-center
                    rounded-[18px]
                    bg-muted/50
                  "
                >
                  <Loader2
                    className="
                      h-6
                      w-6
                      animate-spin
                      text-muted-foreground
                    "
                  />
                </div>
              ) : categories.length ===
                0 ? (
                <div
                  className="
                    flex
                    h-[250px]
                    items-center
                    justify-center
                    rounded-[18px]
                    border
                    border-dashed
                    border-border
                    bg-muted/30
                    px-5
                    text-center
                  "
                >
                  <p
                    className="
                      max-w-[240px]
                      text-xs
                      leading-5
                      text-muted-foreground
                    "
                  >
                    No completed outgoing
                    transfers or withdrawals
                    were found for this period.
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={
                            categories
                          }
                          cx="50%"
                          cy="50%"
                          innerRadius={
                            58
                          }
                          outerRadius={
                            78
                          }
                          paddingAngle={
                            4
                          }
                          dataKey="value"
                          stroke="none"
                        >
                          {categories.map(
                            (
                              entry,
                              index
                            ) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.color
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          cursor={{
                            fill:
                              "transparent",
                          }}
                          formatter={(
                            value
                          ) =>
                            formatCurrency(
                              Number(
                                value ??
                                  0
                              )
                            )
                          }
                          contentStyle={{
                            borderRadius:
                              "12px",
                            border:
                              "1px solid hsl(var(--border))",
                            background:
                              "hsl(var(--popover))",
                            color:
                              "hsl(var(--popover-foreground))",
                            boxShadow:
                              "0 10px 25px rgba(0,0,0,0.14)",
                          }}
                          labelStyle={{
                            color:
                              "hsl(var(--foreground))",
                          }}
                          itemStyle={{
                            color:
                              "hsl(var(--foreground))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 space-y-3">
                    {categories.map(
                      (
                        category
                      ) => (
                        <div
                          key={
                            category.name
                          }
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                            text-sm
                          "
                        >
                          <div
                            className="
                              flex
                              min-w-0
                              items-center
                              gap-2
                            "
                          >
                            <span
                              className="
                                h-2.5
                                w-2.5
                                shrink-0
                                rounded-full
                              "
                              style={{
                                backgroundColor:
                                  category.color,
                              }}
                            />

                            <span
                              className="
                                truncate
                                font-semibold
                                text-foreground
                              "
                            >
                              {
                                category.name
                              }
                            </span>
                          </div>

                          <span
                            className="
                              shrink-0
                              font-black
                              text-foreground
                            "
                          >
                            {formatCurrency(
                              category.value
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* =================================================
            PERIOD SNAPSHOT
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-3">
          <InsightMetric
            label="Income"
            value={
              isLoading
                ? "—"
                : formatCurrency(
                    summary.totalIncome
                  )
            }
            icon={
              ArrowDownRight
            }
            tone="emerald"
          />

          <InsightMetric
            label="Expenses"
            value={
              isLoading
                ? "—"
                : formatCurrency(
                    summary.totalSpent
                  )
            }
            icon={
              ArrowUpRight
            }
            tone="rose"
          />

          <InsightMetric
            label="Net flow"
            value={
              isLoading
                ? "—"
                : formatCurrency(
                    summary.netBalance
                  )
            }
            icon={
              Wallet
            }
            tone="violet"
          />
        </div>
      </motion.div>
    </main>
  );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChartState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="
        flex
        h-full
        items-center
        justify-center
        rounded-[18px]
        border
        border-dashed
        border-border
        bg-muted/30
        px-5
        text-center
      "
    >
      <p
        className="
          max-w-[280px]
          text-xs
          leading-5
          text-muted-foreground
        "
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   INSIGHT METRIC
========================================================= */

function InsightMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;

  value: string;

  icon: typeof Wallet;

  tone:
    | "emerald"
    | "rose"
    | "violet";
}) {
  const toneMap = {
    emerald: {
      box:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

      value:
        "text-emerald-700 dark:text-emerald-300",
    },

    rose: {
      box:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400",

      value:
        "text-rose-700 dark:text-rose-300",
    },

    violet: {
      box:
        "bg-violet-500/10 text-violet-600 dark:text-violet-400",

      value:
        "text-violet-700 dark:text-violet-300",
    },
  } as const;

  const current =
    toneMap[tone];

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="
        flex
        items-center
        justify-between
        gap-4
        rounded-[22px]
        border
        border-border
        bg-card
        p-4
        text-card-foreground
        shadow-[var(--dashboard-shadow)]
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            text-muted-foreground
          "
        >
          {label}
        </p>

        <p
          className={`
            mt-1.5
            truncate
            text-lg
            font-black
            ${current.value}
          `}
        >
          {value}
        </p>
      </div>

      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-[13px]
          ${current.box}
        `}
      >
        <Icon className="h-4 w-4" />
      </div>
    </motion.div>
  );
}