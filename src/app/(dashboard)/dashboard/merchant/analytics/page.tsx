"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getMerchantAnalytics,
  type MerchantAnalyticsBreakdownItem,
  type MerchantAnalyticsPeriod,
  type MerchantAnalyticsResponse,
  type MerchantAnalyticsTrendItem,
} from "@/lib/api/merchantAnalyticsApi";

/* =========================================================
   CONSTANTS
========================================================= */

const PERIOD_OPTIONS: Array<{
  value: MerchantAnalyticsPeriod;
  label: string;
}> = [
  {
    value: "7d",
    label: "Last 7 days",
  },
  {
    value: "30d",
    label: "Last 30 days",
  },
  {
    value: "90d",
    label: "Last 90 days",
  },
  {
    value: "12m",
    label: "Last 12 months",
  },
  {
    value: "all",
    label: "All time",
  },
];

const CHART_COLORS = [
  "#7C3AED",
  "#A855F7",
  "#D946EF",
  "#6366F1",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#F43F5E",
];

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount: number,
  currency: string
): string {
  const safeAmount =
    Number.isFinite(amount)
      ? amount
      : 0;

  return `${currency} ${safeAmount.toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatCompactMoney(
  amount: number,
  currency: string
): string {
  const safeAmount =
    Number.isFinite(amount)
      ? amount
      : 0;

  return `${currency} ${new Intl.NumberFormat(
    "en-BD",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  ).format(safeAmount)}`;
}

function formatNumber(
  value: number
): string {
  return Number(
    value || 0
  ).toLocaleString(
    "en-BD"
  );
}

function formatPercent(
  value: number
): string {
  const safeValue =
    Number.isFinite(value)
      ? value
      : 0;

  return `${safeValue.toFixed(
    2
  )}%`;
}

function formatDate(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "—";
  }

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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "—";
  }

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
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function labelize(
  value: string
): string {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function shortChartDate(
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
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

/* =========================================================
   AURORA
========================================================= */

function PurpleAuroraBackground() {
  return (
    <>
      <div
        className="
          pointer-events-none
          absolute
          inset-0
        "
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-28
          h-80
          w-80
          rounded-full
          bg-fuchsia-300/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            22,
            0,
          ],
          y: [
            0,
            -16,
            0,
          ],
          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-36
          left-[25%]
          h-72
          w-72
          rounded-full
          bg-violet-100/20
          blur-3xl
        "
        animate={{
          scale: [
            1,
            1.12,
            1,
          ],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   PERIOD DROPDOWN
========================================================= */

function PeriodDropdown({
  value,
  onChange,
}: {
  value: MerchantAnalyticsPeriod;

  onChange: (
    value:
      MerchantAnalyticsPeriod
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  const selected =
    PERIOD_OPTIONS.find(
      (option) =>
        option.value ===
        value
    ) ??
    PERIOD_OPTIONS[1];

  useEffect(
    () => {
      if (!open) {
        return;
      }

      const handleOutside =
        (
          event:
            MouseEvent
        ) => {
          if (
            !rootRef.current?.contains(
              event.target as Node
            )
          ) {
            setOpen(false);
          }
        };

      const handleEscape =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(false);
          }
        };

      const handleScroll =
        () => {
          setOpen(false);
        };

      document.addEventListener(
        "mousedown",
        handleOutside
      );

      document.addEventListener(
        "keydown",
        handleEscape
      );

      window.addEventListener(
        "scroll",
        handleScroll,
        true
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handleOutside
        );

        document.removeEventListener(
          "keydown",
          handleEscape
        );

        window.removeEventListener(
          "scroll",
          handleScroll,
          true
        );
      };
    },
    [
      open,
    ]
  );

  return (
    <div
      ref={rootRef}
      className={`
        relative

        ${
          open
            ? "z-50"
            : "z-20"
        }
      `}
    >
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="
          flex
          h-11
          min-w-[180px]
          items-center
          justify-between
          gap-3
          rounded-2xl
          border
          border-white/15
          bg-white/10
          px-4
          text-sm
          font-black
          text-white
          backdrop-blur
          transition

          hover:bg-white/15
        "
      >
        <span>
          {
            selected.label
          }
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      {open ? (
        <motion.div
          initial={{
            opacity: 0,
            y: -5,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          className="
            absolute
            right-0
            top-[calc(100%+8px)]
            z-50
            w-full
            min-w-[210px]
            overflow-hidden
            rounded-2xl
            merchant-surface
            p-1.5
            shadow-[0_22px_55px_rgba(35,15,70,0.18)]
          "
        >
          {PERIOD_OPTIONS.map(
            (option) => {
              const active =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  onClick={() => {
                    onChange(
                      option.value
                    );

                    setOpen(false);
                  }}
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    font-semibold
                    transition

                    ${
                      active
                        ? "bg-violet-500/10 text-violet-600"
                        : "merchant-text hover:bg-violet-500/[0.05]"
                    }
                  `}
                >
                  {
                    option.label
                  }

                  {active ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </button>
              );
            }
          )}
        </motion.div>
      ) : null}
    </div>
  );
}

/* =========================================================
   CARD COMPONENTS
========================================================= */

function KpiCard({
  label,
  value,
  note,
  icon:
    Icon,
  featured = false,
  delay = 0,
}: {
  label: string;

  value: string;

  note: string;

  icon:
    React.ElementType;

  featured?: boolean;

  delay?: number;
}) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay,
      }}
      whileHover={{
        y: -3,
      }}
      className={`
        min-w-0
        overflow-hidden
        rounded-[24px]
        p-5

        ${
          featured
            ? "text-white"
            : "merchant-surface"
        }
      `}
      style={
        featured
          ? {
              background:
                "linear-gradient(135deg,#5B21B6 0%,#7C3AED 58%,#A855F7 100%)",
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`
              text-[10px]
              font-black
              uppercase
              tracking-[0.13em]

              ${
                featured
                  ? "text-violet-100/75"
                  : "merchant-muted"
              }
            `}
          >
            {label}
          </p>

          <p
            title={value}
            className={`
              mt-3
              truncate
              text-[clamp(1rem,1.8vw,1.55rem)]
              font-black
              tracking-[-0.035em]
              tabular-nums

              ${
                featured
                  ? "text-white"
                  : "merchant-text"
              }
            `}
          >
            {value}
          </p>

          <p
            className={`
              mt-2
              text-xs
              leading-5

              ${
                featured
                  ? "text-violet-100/75"
                  : "merchant-muted"
              }
            `}
          >
            {note}
          </p>
        </div>

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl

            ${
              featured
                ? "bg-white/10 text-white"
                : "bg-violet-500/[0.08] text-violet-600"
            }
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.article>
  );
}

function SmallKpi({
  label,
  value,
  icon:
    Icon,
  tone = "violet",
}: {
  label: string;

  value: string;

  icon:
    React.ElementType;

  tone?:
    | "violet"
    | "amber"
    | "rose"
    | "emerald";
}) {
  const iconClass =
    tone ===
    "amber"
      ? "bg-amber-500/10 text-amber-600"
      : tone ===
          "rose"
        ? "bg-rose-500/10 text-rose-600"
        : tone ===
            "emerald"
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-violet-500/[0.08] text-violet-600";

  return (
    <motion.article
      whileHover={{
        y: -2,
      }}
      className="
        min-w-0
        rounded-[22px]
        merchant-surface
        p-4
      "
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl

            ${iconClass}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider merchant-muted">
            {label}
          </p>

          <p
            title={value}
            className="mt-1 truncate text-base font-black merchant-text"
          >
            {value}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-2xl
        border
        border-white/10
        bg-white/[0.08]
        p-3
      "
    >
      <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
        {label}
      </p>

      <p
        title={value}
        className="mt-1 truncate text-sm font-black text-white"
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   CHART PANEL
========================================================= */

function ChartPanel({
  eyebrow,
  title,
  subtitle,
  children,
  badge,
}: {
  eyebrow: string;

  title: string;

  subtitle: string;

  children:
    React.ReactNode;

  badge?: string;
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        min-w-0
        rounded-[28px]
        merchant-surface
        p-5

        sm:p-6
      "
    >
      <div
        className="
          flex
          flex-col
          gap-3

          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-violet-600">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-lg font-black merchant-text">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 merchant-muted">
            {subtitle}
          </p>
        </div>

        {badge ? (
          <span
            className="
              w-fit
              rounded-full
              bg-violet-500/[0.08]
              px-3
              py-1.5
              text-[10px]
              font-black
              text-violet-600
            "
          >
            {badge}
          </span>
        ) : null}
      </div>

      {children}
    </motion.section>
  );
}

/* =========================================================
   TOOLTIP TYPES
========================================================= */

interface TrendTooltipPayload {
  value?: number;

  dataKey?: string;

  payload?:
    MerchantAnalyticsTrendItem;
}

function TrendTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;

  payload?:
    TrendTooltipPayload[];

  label?:
    string;

  currency: string;
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  const row =
    payload[0]
      ?.payload;

  return (
    <div
      className="
        min-w-[190px]
        rounded-2xl
        bg-[#1B0B33]
        p-3
        text-white
        shadow-[0_18px_45px_rgba(20,8,40,0.32)]
      "
    >
      <p className="text-xs font-black">
        {label
          ? formatDate(
              label
            )
          : "—"}
      </p>

      <p className="mt-2 text-sm font-black text-violet-200">
        {formatMoney(
          row?.volume ??
            0,
          currency
        )}
      </p>

      <div className="mt-2 space-y-1 text-[10px] text-violet-100/70">
        <p>
          Total:{" "}
          {formatNumber(
            row?.paymentCount ??
              0
          )}
        </p>

        <p>
          Completed:{" "}
          {formatNumber(
            row?.completedCount ??
              0
          )}
        </p>

        <p>
          Failed:{" "}
          {formatNumber(
            row?.failedCount ??
              0
          )}
        </p>
      </div>
    </div>
  );
}

function BreakdownTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;

  payload?: Array<{
    value?: number;

    payload?: {
      label?: string;

      volume?: number;

      count?: number;
    };
  }>;

  currency: string;
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  const row =
    payload[0]
      ?.payload;

  return (
    <div
      className="
        min-w-[170px]
        rounded-2xl
        bg-[#1B0B33]
        p-3
        text-white
        shadow-[0_18px_45px_rgba(20,8,40,0.3)]
      "
    >
      <p className="text-xs font-black">
        {row?.label ||
          "—"}
      </p>

      <p className="mt-2 text-sm font-black text-violet-200">
        {formatMoney(
          row?.volume ??
            0,
          currency
        )}
      </p>

      <p className="mt-1 text-[10px] text-violet-100/70">
        {formatNumber(
          row?.count ??
            0
        )}{" "}
        payments
      </p>
    </div>
  );
}

/* =========================================================
   PIE LEGEND
========================================================= */

function PieLegend({
  items,
  currency,
  valueType =
    "count",
}: {
  items: Array<{
    label: string;

    count: number;

    volume: number;
  }>;

  currency: string;

  valueType?:
    | "count"
    | "volume";
}) {
  return (
    <div className="space-y-2.5">
      {items.map(
        (
          item,
          index
        ) => (
          <div
            key={`${item.label}-${index}`}
            className="
              flex
              items-center
              justify-between
              gap-4
              rounded-xl
              bg-violet-500/[0.035]
              px-3
              py-2.5
            "
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background:
                    CHART_COLORS[
                      index %
                        CHART_COLORS.length
                    ],
                }}
              />

              <span className="truncate text-xs font-bold merchant-text">
                {
                  item.label
                }
              </span>
            </div>

            <span className="shrink-0 text-xs font-black text-violet-600">
              {valueType ===
              "volume"
                ? formatMoney(
                    item.volume,
                    currency
                  )
                : formatNumber(
                    item.count
                  )}
            </span>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyChart({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="
        flex
        min-h-[260px]
        items-center
        justify-center
        text-center
      "
    >
      <div>
        <TrendingUp className="mx-auto h-7 w-7 text-violet-300" />

        <p className="mt-3 text-sm merchant-muted">
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MerchantAnalyticsPage() {
  /* =======================================================
     HOOKS

     IMPORTANT:
     All hooks stay before every conditional return.
  ======================================================== */

  const [
    data,
    setData,
  ] =
    useState<
      MerchantAnalyticsResponse["data"] | null
    >(
      null
    );

  const [
    period,
    setPeriod,
  ] =
    useState<
      MerchantAnalyticsPeriod
    >(
      "30d"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  /* =======================================================
     LOAD
  ======================================================== */

  const loadAnalytics =
    useCallback(
      async (
        refresh =
          false
      ) => {
        try {
          if (
            refresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            null
          );

          const response =
            await getMerchantAnalytics({
              period,
            });

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Unable to load merchant analytics."
            );
          }

          setData(
            response.data
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load merchant analytics."
          );

          if (
            !refresh
          ) {
            setData(
              null
            );
          }
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
        period,
      ]
    );

  useEffect(
    () => {
      void loadAnalytics();
    },
    [
      loadAnalytics,
    ]
  );

  /* =======================================================
     INITIAL ERROR
  ======================================================== */

  if (
    error &&
    !data &&
    !loading
  ) {
    return (
      <main
        className="
          merchant-theme
          min-h-full
          px-4
          py-5

          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-[1500px]">
          <section
            className="
              rounded-[28px]
              bg-rose-500/[0.07]
              p-6
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-rose-500/10
                text-rose-600
              "
            >
              <XCircle className="h-6 w-6" />
            </div>

            <h1 className="mt-4 text-xl font-black merchant-text">
              Unable to load analytics
            </h1>

            <p className="mt-2 text-sm text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadAnalytics(
                  true
                )
              }
              className="
                mt-5
                inline-flex
                h-10
                items-center
                gap-2
                rounded-xl
                bg-violet-600
                px-4
                text-sm
                font-black
                text-white
              "
            >
              <RefreshCw className="h-4 w-4" />

              Try again
            </button>
          </section>
        </div>
      </main>
    );
  }

  /* =======================================================
     LOADING
  ======================================================== */

  if (
    loading &&
    !data
  ) {
    return (
      <main
        className="
          merchant-theme
          min-h-full
          px-4
          py-5

          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-[1500px] space-y-6">
          <div className="h-[280px] animate-pulse rounded-[30px] bg-violet-500/[0.06]" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="h-36 animate-pulse rounded-[24px] bg-violet-500/[0.04]"
                />
              )
            )}
          </div>

          <div className="h-[420px] animate-pulse rounded-[28px] bg-violet-500/[0.04]" />
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  /* =======================================================
     DERIVED DATA

     Normal JS only.
     No React hooks below this point.
  ======================================================== */

  const overview =
    data.overview;

  const trend =
    data.trend ??
    [];

  const currency =
    data.merchant
      .defaultCurrency ||
    "BDT";

  const merchantName =
    data.merchant
      .businessDisplayName ||
    data.merchant
      .businessName ||
    "Merchant";

  const selectedPeriodLabel =
    PERIOD_OPTIONS.find(
      (option) =>
        option.value ===
        period
    )?.label ??
    period;

  const statusPieData =
    (
      data.statusBreakdown ??
      []
    ).map(
      (item) => ({
        label:
          labelize(
            item.key
          ),

        count:
          item.count,

        volume:
          item.volume,
      })
    );

  const methodPieData =
    (
      data.paymentMethods ??
      []
    ).map(
      (item) => ({
        label:
          labelize(
            item.key
          ),

        count:
          item.count,

        volume:
          item.volume,
      })
    );

  const providerBarData =
    (
      data.providers ??
      []
    ).map(
      (item) => ({
        label:
          labelize(
            item.key
          ),

        count:
          item.count,

        volume:
          item.volume,
      })
    );

  const topDaysData =
    (
      data.topDays ??
      []
    ).map(
      (item) => ({
        ...item,

        label:
          shortChartDate(
            item.date
          ),
      })
    );

  const financialComposition =
    [
      {
        label:
          "Net payment value",

        value:
          Math.max(
            0,
            overview.netRevenue
          ),
      },

      {
        label:
          "Fees",

        value:
          Math.max(
            0,
            overview.totalFees
          ),
      },
    ].filter(
      (item) =>
        item.value >
        0
    );

  const successCount =
    overview.completedPayments;

  const failedCount =
    overview.failedPayments;

  const pendingCount =
    overview.pendingPayments +
    overview.processingPayments;

  const otherCount =
    overview.cancelledPayments +
    overview.expiredPayments;

  const lifecyclePieData =
    [
      {
        label:
          "Successful",

        count:
          successCount,

        volume:
          0,
      },
      {
        label:
          "Failed",

        count:
          failedCount,

        volume:
          0,
      },
      {
        label:
          "Pending / Processing",

        count:
          pendingCount,

        volume:
          0,
      },
      {
        label:
          "Cancelled / Expired",

        count:
          otherCount,

        volume:
          0,
      },
    ].filter(
      (item) =>
        item.count >
        0
    );

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <main
      className="
        merchant-theme
        relative
        z-0
        isolate
        min-h-full
      "
    >
      <div
        className="
          px-4
          py-5

          sm:px-6
          lg:px-8
        "
      >
        <div className="mx-auto max-w-[1600px] space-y-6">
          {/* =================================================
              HERO
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              relative
              overflow-visible
              rounded-[30px]
              px-5
              py-6
              text-white

              sm:px-7
              sm:py-7
            "
          >
            <div
              className="
                absolute
                inset-0
                overflow-hidden
                rounded-[30px]
              "
            >
              <PurpleAuroraBackground />
            </div>

            <div className="relative">
              <div
                className="
                  flex
                  flex-col
                  gap-6

                  lg:flex-row
                  lg:items-start
                  lg:justify-between
                "
              >
                <div className="max-w-3xl">
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-full
                      border
                      border-white/15
                      bg-white/10
                      px-3
                      py-1.5
                      text-[11px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                    "
                  >
                    <Activity className="h-3.5 w-3.5" />

                    Merchant intelligence
                  </div>

                  <h1 className="mt-4 text-3xl font-black tracking-tight">
                    Payment Analytics
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/80">
                    Visualize payment volume, success performance,
                    payment methods, providers and customer activity
                    processed through the Coffer gateway.
                  </p>
                </div>

                <div
                  className="
                    relative
                    z-40
                    flex
                    flex-col
                    gap-2

                    sm:flex-row
                  "
                >
                  <PeriodDropdown
                    value={
                      period
                    }
                    onChange={
                      setPeriod
                    }
                  />

                  <motion.button
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.97,
                    }}
                    type="button"
                    disabled={
                      refreshing
                    }
                    onClick={() =>
                      void loadAnalytics(
                        true
                      )
                    }
                    className="
                      inline-flex
                      h-11
                      items-center
                      justify-center
                      gap-2
                      rounded-2xl
                      border
                      border-white/15
                      bg-white/10
                      px-4
                      text-sm
                      font-black
                      text-white

                      hover:bg-white/15

                      disabled:opacity-50
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
                  </motion.button>
                </div>
              </div>

              <div
                className="
                  mt-6
                  grid
                  gap-3

                  sm:grid-cols-3
                "
              >
                <HeroStat
                  label="Merchant"
                  value={
                    merchantName
                  }
                />

                <HeroStat
                  label="Analytics period"
                  value={
                    selectedPeriodLabel
                  }
                />

                <HeroStat
                  label="Generated"
                  value={formatDateTime(
                    data.generatedAt
                  )}
                />
              </div>
            </div>
          </motion.section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error ? (
            <div className="rounded-2xl bg-rose-500/[0.07] p-4 text-sm font-semibold text-rose-600">
              {error}
            </div>
          ) : null}

          {/* =================================================
              PRIMARY KPI
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              featured
              label="Gross Volume"
              value={formatMoney(
                overview.grossVolume,
                currency
              )}
              note="Completed payment volume"
              icon={
                CircleDollarSign
              }
            />

            <KpiCard
              label="Net Payment Value"
              value={formatMoney(
                overview.netRevenue,
                currency
              )}
              note={`After ${formatMoney(
                overview.totalFees,
                currency
              )} in fees`}
              icon={
                WalletCards
              }
              delay={
                0.04
              }
            />

            <KpiCard
              label="Success Rate"
              value={formatPercent(
                overview.successRate
              )}
              note={`${formatNumber(
                overview.completedPayments
              )} completed payments`}
              icon={
                CheckCircle2
              }
              delay={
                0.08
              }
            />

            <KpiCard
              label="Average Payment"
              value={formatMoney(
                overview.averagePaymentValue,
                currency
              )}
              note="Average completed payment"
              icon={
                BarChart3
              }
              delay={
                0.12
              }
            />
          </section>

          {/* =================================================
              SECONDARY KPI
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SmallKpi
              label="Total Payments"
              value={formatNumber(
                overview.totalPayments
              )}
              icon={
                CreditCard
              }
            />

            <SmallKpi
              label="Unique Customers"
              value={formatNumber(
                overview.uniqueCustomers
              )}
              icon={
                Users
              }
            />

            <SmallKpi
              label="Pending / Processing"
              value={formatNumber(
                pendingCount
              )}
              icon={
                Clock3
              }
              tone="amber"
            />

            <SmallKpi
              label="Failed Payments"
              value={formatNumber(
                overview.failedPayments
              )}
              icon={
                XCircle
              }
              tone="rose"
            />
          </section>

          {/* =================================================
              1. PAYMENT VOLUME AREA CHART
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              relative
              overflow-hidden
              rounded-[28px]
              p-5
              text-white

              sm:p-6
            "
            style={{
              background:
                "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
            }}
          >
            <div className="relative">
              <div
                className="
                  flex
                  flex-col
                  gap-3

                  sm:flex-row
                  sm:items-end
                  sm:justify-between
                "
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/60">
                    Volume intelligence
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Payment volume trend
                  </h2>

                  <p className="mt-1 text-xs text-violet-100/70">
                    Daily completed payment value across the selected
                    period.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                  {trend.length} data points
                </span>
              </div>

              {trend.length ===
              0 ? (
                <div className="flex min-h-[340px] items-center justify-center text-sm text-violet-100/70">
                  No payment volume data available.
                </div>
              ) : (
                <div
                  className="
                    mt-6
                    h-[350px]
                    overflow-hidden
                    rounded-2xl
                    bg-white/[0.055]
                    p-3

                    sm:p-4
                  "
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={
                        trend
                      }
                      margin={{
                        top: 10,
                        right: 12,
                        bottom: 0,
                        left: -8,
                      }}
                    >
                      <defs>
                        <linearGradient
                          id="analyticsAreaFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ffffff"
                            stopOpacity={
                              0.4
                            }
                          />

                          <stop
                            offset="100%"
                            stopColor="#ffffff"
                            stopOpacity={
                              0.01
                            }
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        vertical={
                          false
                        }
                        strokeDasharray="4 4"
                        stroke="rgba(255,255,255,.10)"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={
                          shortChartDate
                        }
                        minTickGap={
                          28
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill:
                            "rgba(237,233,254,.72)",
                          fontSize: 10,
                        }}
                      />

                      <YAxis
                        tickFormatter={(
                          value
                        ) =>
                          new Intl.NumberFormat(
                            "en-US",
                            {
                              notation:
                                "compact",
                              maximumFractionDigits:
                                1,
                            }
                          ).format(
                            Number(
                              value
                            )
                          )
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        width={
                          55
                        }
                        tick={{
                          fill:
                            "rgba(237,233,254,.72)",
                          fontSize: 10,
                        }}
                      />

                      <Tooltip
                        content={(
                          props
                        ) => (
                          <TrendTooltip
                            active={
                              props.active
                            }
                            payload={
                              props.payload as unknown as
                                TrendTooltipPayload[]
                            }
                            label={
                              typeof props.label ===
                              "string"
                                ? props.label
                                : undefined
                            }
                            currency={
                              currency
                            }
                          />
                        )}
                      />

                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#ffffff"
                        strokeWidth={
                          2.5
                        }
                        fill="url(#analyticsAreaFill)"
                        isAnimationActive
                        animationDuration={
                          1000
                        }
                        activeDot={{
                          r: 5,
                          fill: "#ffffff",
                          stroke: "#7C3AED",
                          strokeWidth: 3,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.section>

          {/* =================================================
              2. ACTIVITY LINE
              3. STATUS DONUT
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <ChartPanel
              eyebrow="Activity trend"
              title="Payment activity"
              subtitle="Compare total, completed and failed payment counts over time."
              badge={`${formatNumber(
                overview.totalPayments
              )} total`}
            >
              {trend.length ===
              0 ? (
                <EmptyChart
                  text="No payment activity data."
                />
              ) : (
                <div className="mt-6 h-[330px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        trend
                      }
                      margin={{
                        top: 5,
                        right: 10,
                        bottom: 0,
                        left: -15,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        strokeDasharray="4 4"
                        stroke="rgba(148,163,184,.16)"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={
                          shortChartDate
                        }
                        minTickGap={
                          28
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#94A3B8",
                          fontSize: 10,
                        }}
                      />

                      <YAxis
                        allowDecimals={
                          false
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#94A3B8",
                          fontSize: 10,
                        }}
                      />

                      <Tooltip />

                      <Legend
                        wrapperStyle={{
                          fontSize:
                            "11px",
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="paymentCount"
                        name="Total payments"
                        stroke="#7C3AED"
                        strokeWidth={
                          2.5
                        }
                        dot={
                          false
                        }
                        activeDot={{
                          r: 4,
                        }}
                        animationDuration={
                          900
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="completedCount"
                        name="Completed"
                        stroke="#10B981"
                        strokeWidth={
                          2.5
                        }
                        dot={
                          false
                        }
                        activeDot={{
                          r: 4,
                        }}
                        animationDuration={
                          1000
                        }
                      />

                      <Line
                        type="monotone"
                        dataKey="failedCount"
                        name="Failed"
                        stroke="#F43F5E"
                        strokeWidth={
                          2.5
                        }
                        dot={
                          false
                        }
                        activeDot={{
                          r: 4,
                        }}
                        animationDuration={
                          1100
                        }
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartPanel>

            <ChartPanel
              eyebrow="Lifecycle"
              title="Status distribution"
              subtitle="Share of payment lifecycle states."
            >
              {statusPieData.length ===
              0 ? (
                <EmptyChart
                  text="No payment status data."
                />
              ) : (
                <>
                  <div className="mt-5 h-[230px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Tooltip />

                        <Pie
                          data={
                            statusPieData
                          }
                          dataKey="count"
                          nameKey="label"
                          innerRadius={
                            62
                          }
                          outerRadius={
                            92
                          }
                          paddingAngle={
                            3
                          }
                          animationDuration={
                            900
                          }
                        >
                          {statusPieData.map(
                            (
                              item,
                              index
                            ) => (
                              <Cell
                                key={`${item.label}-${index}`}
                                fill={
                                  CHART_COLORS[
                                    index %
                                      CHART_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <PieLegend
                    items={
                      statusPieData
                    }
                    currency={
                      currency
                    }
                  />
                </>
              )}
            </ChartPanel>
          </div>

          {/* =================================================
              4. COMPLETED VS FAILED STACKED BAR
          ================================================= */}

          <ChartPanel
            eyebrow="Outcome comparison"
            title="Completed vs failed payments"
            subtitle="Daily successful and failed payment counts."
          >
            {trend.length ===
            0 ? (
              <EmptyChart
                text="No outcome comparison data."
              />
            ) : (
              <div className="mt-6 h-[330px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      trend
                    }
                    margin={{
                      top: 5,
                      right: 10,
                      bottom: 0,
                      left: -15,
                    }}
                  >
                    <CartesianGrid
                      vertical={
                        false
                      }
                      strokeDasharray="4 4"
                      stroke="rgba(148,163,184,.16)"
                    />

                    <XAxis
                      dataKey="date"
                      tickFormatter={
                        shortChartDate
                      }
                      minTickGap={
                        28
                      }
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      allowDecimals={
                        false
                      }
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 10,
                      }}
                    />

                    <Tooltip />

                    <Legend
                      wrapperStyle={{
                        fontSize:
                          "11px",
                      }}
                    />

                    <Bar
                      dataKey="completedCount"
                      name="Completed"
                      stackId="outcome"
                      fill="#10B981"
                      radius={[
                        0,
                        0,
                        4,
                        4,
                      ]}
                      animationDuration={
                        900
                      }
                    />

                    <Bar
                      dataKey="failedCount"
                      name="Failed"
                      stackId="outcome"
                      fill="#F43F5E"
                      radius={[
                        4,
                        4,
                        0,
                        0,
                      ]}
                      animationDuration={
                        1000
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartPanel>

          {/* =================================================
              5. PAYMENT METHODS DONUT
              6. PROVIDER BAR
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartPanel
              eyebrow="Source distribution"
              title="Payment methods"
              subtitle="Completed payment volume by source type."
            >
              {methodPieData.length ===
              0 ? (
                <EmptyChart
                  text="No payment method data."
                />
              ) : (
                <div
                  className="
                    mt-5
                    grid
                    gap-4

                    lg:grid-cols-[0.9fr_1.1fr]
                    lg:items-center
                  "
                >
                  <div className="h-[250px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Tooltip />

                        <Pie
                          data={
                            methodPieData
                          }
                          dataKey="volume"
                          nameKey="label"
                          innerRadius={
                            62
                          }
                          outerRadius={
                            94
                          }
                          paddingAngle={
                            3
                          }
                          animationDuration={
                            950
                          }
                        >
                          {methodPieData.map(
                            (
                              item,
                              index
                            ) => (
                              <Cell
                                key={`${item.label}-${index}`}
                                fill={
                                  CHART_COLORS[
                                    index %
                                      CHART_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <PieLegend
                    items={
                      methodPieData
                    }
                    currency={
                      currency
                    }
                    valueType="volume"
                  />
                </div>
              )}
            </ChartPanel>

            <ChartPanel
              eyebrow="Gateway performance"
              title="Payment providers"
              subtitle="Completed payment volume handled by each provider."
            >
              {providerBarData.length ===
              0 ? (
                <EmptyChart
                  text="No provider data."
                />
              ) : (
                <div className="mt-6 h-[330px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        providerBarData
                      }
                      layout="vertical"
                      margin={{
                        top: 0,
                        right: 15,
                        bottom: 0,
                        left: 25,
                      }}
                    >
                      <CartesianGrid
                        horizontal={
                          false
                        }
                        strokeDasharray="4 4"
                        stroke="rgba(148,163,184,.16)"
                      />

                      <XAxis
                        type="number"
                        tickFormatter={(
                          value
                        ) =>
                          new Intl.NumberFormat(
                            "en-US",
                            {
                              notation:
                                "compact",
                              maximumFractionDigits:
                                1,
                            }
                          ).format(
                            Number(
                              value
                            )
                          )
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#94A3B8",
                          fontSize: 10,
                        }}
                      />

                      <YAxis
                        type="category"
                        dataKey="label"
                        width={
                          95
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#94A3B8",
                          fontSize: 10,
                        }}
                      />

                      <Tooltip
                        content={(
                          props
                        ) => (
                          <BreakdownTooltip
                            active={
                              props.active
                            }
                            payload={
                              props.payload as unknown as Array<{
                                value?: number;
                                payload?: {
                                  label?: string;
                                  volume?: number;
                                  count?: number;
                                };
                              }>
                            }
                            currency={
                              currency
                            }
                          />
                        )}
                      />

                      <Bar
                        dataKey="volume"
                        fill="#7C3AED"
                        radius={[
                          0,
                          8,
                          8,
                          0,
                        ]}
                        animationDuration={
                          950
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartPanel>
          </div>

          {/* =================================================
              7. TOP DAYS
              8. FINANCIAL COMPOSITION
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <ChartPanel
              eyebrow="Peak performance"
              title="Highest-volume days"
              subtitle="Top completed-payment days for the selected period."
            >
              {topDaysData.length ===
              0 ? (
                <EmptyChart
                  text="No high-volume day data."
                />
              ) : (
                <div className="mt-6 h-[330px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        topDaysData
                      }
                      margin={{
                        top: 5,
                        right: 10,
                        bottom: 0,
                        left: -5,
                      }}
                    >
                      <CartesianGrid
                        vertical={
                          false
                        }
                        strokeDasharray="4 4"
                        stroke="rgba(148,163,184,.16)"
                      />

                      <XAxis
                        dataKey="label"
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#94A3B8",
                          fontSize: 10,
                        }}
                      />

                      <YAxis
                        tickFormatter={(
                          value
                        ) =>
                          new Intl.NumberFormat(
                            "en-US",
                            {
                              notation:
                                "compact",
                              maximumFractionDigits:
                                1,
                            }
                          ).format(
                            Number(
                              value
                            )
                          )
                        }
                        axisLine={
                          false
                        }
                        tickLine={
                          false
                        }
                        tick={{
                          fill: "#94A3B8",
                          fontSize: 10,
                        }}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="volume"
                        name="Completed volume"
                        fill="#7C3AED"
                        radius={[
                          8,
                          8,
                          0,
                          0,
                        ]}
                        animationDuration={
                          1000
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartPanel>

            <ChartPanel
              eyebrow="Financial composition"
              title="Net value vs fees"
              subtitle="How completed gross payment volume is divided."
            >
              {financialComposition.length ===
              0 ? (
                <EmptyChart
                  text="No financial composition data."
                />
              ) : (
                <>
                  <div className="mt-5 h-[240px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Tooltip
                          formatter={(
                            value
                          ) =>
                            formatMoney(
                              Number(
                                value
                              ),
                              currency
                            )
                          }
                        />

                        <Pie
                          data={
                            financialComposition
                          }
                          dataKey="value"
                          nameKey="label"
                          innerRadius={
                            62
                          }
                          outerRadius={
                            94
                          }
                          paddingAngle={
                            4
                          }
                          animationDuration={
                            950
                          }
                        >
                          {financialComposition.map(
                            (
                              item,
                              index
                            ) => (
                              <Cell
                                key={
                                  item.label
                                }
                                fill={
                                  index ===
                                  0
                                    ? "#7C3AED"
                                    : "#D946EF"
                                }
                              />
                            )
                          )}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2.5">
                    {financialComposition.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.label
                          }
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            bg-violet-500/[0.04]
                            px-3
                            py-2.5
                          "
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                background:
                                  index ===
                                  0
                                    ? "#7C3AED"
                                    : "#D946EF",
                              }}
                            />

                            <span className="text-xs font-bold merchant-text">
                              {
                                item.label
                              }
                            </span>
                          </div>

                          <span className="text-xs font-black text-violet-600">
                            {formatMoney(
                              item.value,
                              currency
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </ChartPanel>
          </div>

          {/* =================================================
              PAYMENT LIFECYCLE DONUT + SUMMARY
          ================================================= */}

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <ChartPanel
              eyebrow="Payment health"
              title="Lifecycle overview"
              subtitle="Overall payment outcome composition."
            >
              {lifecyclePieData.length ===
              0 ? (
                <EmptyChart
                  text="No lifecycle data."
                />
              ) : (
                <>
                  <div className="mt-5 h-[240px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Tooltip />

                        <Pie
                          data={
                            lifecyclePieData
                          }
                          dataKey="count"
                          nameKey="label"
                          innerRadius={
                            62
                          }
                          outerRadius={
                            94
                          }
                          paddingAngle={
                            3
                          }
                          animationDuration={
                            900
                          }
                        >
                          {lifecyclePieData.map(
                            (
                              item,
                              index
                            ) => (
                              <Cell
                                key={
                                  item.label
                                }
                                fill={
                                  [
                                    "#10B981",
                                    "#F43F5E",
                                    "#F59E0B",
                                    "#94A3B8",
                                  ][
                                    index %
                                      4
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <PieLegend
                    items={
                      lifecyclePieData
                    }
                    currency={
                      currency
                    }
                  />
                </>
              )}
            </ChartPanel>

            <motion.section
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                relative
                overflow-hidden
                rounded-[28px]
                p-5
                text-white

                sm:p-6
              "
              style={{
                background:
                  "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
              }}
            >
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/65">
                  Analytics snapshot
                </p>

                <h2 className="mt-1 text-lg font-black">
                  Gateway performance
                </h2>

                <p className="mt-1 text-xs text-violet-100/70">
                  A compact view of merchant payment performance for the
                  selected period.
                </p>

                <div
                  className="
                    mt-6
                    grid
                    gap-3

                    sm:grid-cols-2
                  "
                >
                  <SnapshotItem
                    label="Successful"
                    value={formatNumber(
                      overview.completedPayments
                    )}
                    secondary={formatPercent(
                      overview.successRate
                    )}
                  />

                  <SnapshotItem
                    label="Gross volume"
                    value={formatCompactMoney(
                      overview.grossVolume,
                      currency
                    )}
                    secondary={formatMoney(
                      overview.grossVolume,
                      currency
                    )}
                  />

                  <SnapshotItem
                    label="Gateway fees"
                    value={formatCompactMoney(
                      overview.totalFees,
                      currency
                    )}
                    secondary="Completed payment fees"
                  />

                  <SnapshotItem
                    label="Customers"
                    value={formatNumber(
                      overview.uniqueCustomers
                    )}
                    secondary="Unique payment customers"
                  />

                  <SnapshotItem
                    label="Failed"
                    value={formatNumber(
                      overview.failedPayments
                    )}
                    secondary="Failed payment attempts"
                  />

                  <SnapshotItem
                    label="Cancelled / Expired"
                    value={formatNumber(
                      overview.cancelledPayments +
                        overview.expiredPayments
                    )}
                    secondary="Non-completed payments"
                  />
                </div>
              </div>
            </motion.section>
          </div>

          {/* =================================================
              RANGE
          ================================================= */}

          <section
            className="
              flex
              flex-col
              gap-4
              rounded-[24px]
              bg-violet-500/[0.045]
              p-5

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-violet-500/[0.09]
                  text-violet-600
                "
              >
                <Activity className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black merchant-text">
                  Analytics range
                </p>

                <p className="mt-1 text-xs merchant-muted">
                  {data.range.start
                    ? formatDate(
                        data.range.start
                      )
                    : "Beginning of merchant data"}

                  {" → "}

                  {data.range.end
                    ? formatDate(
                        data.range.end
                      )
                    : "Now"}
                </p>
              </div>
            </div>

            <p className="text-xs merchant-muted">
              Generated{" "}
              {formatDateTime(
                data.generatedAt
              )}
            </p>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <section
            className="
              relative
              overflow-hidden
              rounded-[26px]
              p-5
              text-white
            "
            style={{
              background:
                "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
            }}
          >
            <div
              className="
                relative
                flex
                flex-col
                gap-4

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-white/10
                  "
                >
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-black">
                    Coffer Gateway Analytics
                  </p>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-violet-100/75">
                    All charts on this page are generated from the
                    merchant&apos;s actual gateway payment analytics
                    response. No fake production records are inserted.
                  </p>
                </div>
              </div>

              <div className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                Real merchant data
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   SNAPSHOT
========================================================= */

function SnapshotItem({
  label,
  value,
  secondary,
}: {
  label: string;

  value: string;

  secondary: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="
        min-w-0
        rounded-2xl
        bg-white/[0.08]
        p-4
      "
    >
      <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
        {label}
      </p>

      <p
        title={value}
        className="mt-2 truncate text-lg font-black text-white"
      >
        {value}
      </p>

      <p
        title={secondary}
        className="mt-1 truncate text-[10px] text-violet-100/70"
      >
        {secondary}
      </p>
    </motion.div>
  );
}