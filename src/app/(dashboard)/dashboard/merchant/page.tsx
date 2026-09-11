"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileBarChart2,
  RefreshCcw,
  ShoppingBag,
  Store,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type Period =
  | "1d"
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "all";

type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

interface MerchantInfo {
  id: string;
  businessName: string;
  businessDisplayName:
    | string
    | null;
  slug: string;
  status: string;
  verificationStatus: string;
  defaultCurrency: string;
  testEnabled: boolean;
  liveEnabled: boolean;
}

interface OverviewSummary {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  processingPayments: number;
  failedPayments: number;
  cancelledPayments: number;
  expiredPayments: number;

  grossVolume: number;
  totalFees: number;
  netRevenue: number;

  successRate: number;
  averagePaymentValue: number;
  uniqueCustomers: number;
}

interface BreakdownItem {
  key: string;
  count: number;
  amount: number;
}

interface TrendItem {
  date: string;
  paymentCount: number;
  volume: number;
}

interface RecentPayment {
  paymentId: string;
  customerId: string | null;
  orderId: string | null;

  amount: number;
  currency: string;

  feeAmount: number;
  netAmount: number | null;

  sourceType: string;
  provider: string;
  mode: "test" | "live";

  status: PaymentStatus;

  merchantReference:
    | string
    | null;

  failureCode:
    | string
    | null;

  failureMessage:
    | string
    | null;

  createdAt: string;
  completedAt:
    | string
    | null;
}

interface MerchantOverviewData {
  merchant: MerchantInfo;

  period: Period;

  periodStart:
    | string
    | null;

  generatedAt: string;

  summary: OverviewSummary;

  statusBreakdown: BreakdownItem[];

  paymentMethods: BreakdownItem[];

  providers: BreakdownItem[];

  trend: TrendItem[];

  recentPayments: RecentPayment[];
}

interface MerchantOverviewResponse {
  success: boolean;
  message?: string;
  data: MerchantOverviewData;
}

/* =========================================================
   CONSTANTS
========================================================= */

const PERIOD_OPTIONS: {
  value: Period;
  label: string;
}[] = [
  {
    value: "1d",
    label: "Last 24 hours",
  },
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

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount: number,
  currency = "BDT"
) {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatCompactMoney(
  amount: number,
  currency = "BDT"
) {
  if (
    Math.abs(amount) >=
    1_000_000
  ) {
    return `${currency} ${(amount / 1_000_000).toFixed(2)}M`;
  }

  if (
    Math.abs(amount) >=
    1_000
  ) {
    return `${currency} ${(amount / 1_000).toFixed(1)}K`;
  }

  return formatMoney(
    amount,
    currency
  );
}

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
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatShortDate(
  value: string
) {
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
    }
  ).format(date);
}

function formatStatus(
  status: string
) {
  return status
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

function formatSourceType(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    wallet:
      "Wallet",
    card:
      "Card",
    paypal:
      "PayPal",
    local_psp:
      "Local PSP",
  };

  return (
    labels[value] ??
    formatStatus(value)
  );
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}

/* =========================================================
   STATUS CONFIG
========================================================= */

function getStatusConfig(
  status: PaymentStatus
) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className:
          "merchant-success-soft",
        icon:
          CheckCircle2,
      };

    case "pending":
      return {
        label: "Pending",
        className:
          "merchant-warning-soft",
        icon:
          Clock3,
      };

    case "authorized":
    case "captured":
      return {
        label:
          formatStatus(
            status
          ),
        className:
          "merchant-primary-soft",
        icon:
          Activity,
      };

    case "failed":
      return {
        label: "Failed",
        className:
          "merchant-danger-soft",
        icon:
          XCircle,
      };

    case "cancelled":
    case "expired":
      return {
        label:
          formatStatus(
            status
          ),
        className:
          "merchant-danger-soft",
        icon:
          XCircle,
      };

    default:
      return {
        label:
          formatStatus(
            status
          ),
        className:
          "bg-muted text-muted-foreground",
        icon:
          Activity,
      };
  }
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone:
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "neutral";
  loading?: boolean;
}) {
  const iconClass =
    tone === "primary"
      ? "merchant-primary-soft merchant-primary"
      : tone === "success"
        ? "merchant-success-soft merchant-success"
        : tone === "warning"
          ? "merchant-warning-soft merchant-warning"
          : tone === "danger"
            ? "merchant-danger-soft merchant-danger"
            : "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
      className="
        merchant-surface
        merchant-border
        merchant-shadow

        rounded-[22px]
        border
        p-5
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-[0.16em]
              merchant-muted
            "
          >
            {label}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p
              className="
                mt-2
                truncate
                text-[25px]
                font-black
                tracking-[-0.045em]
                text-foreground
              "
            >
              {value}
            </p>
          )}

          <p
            className="
              mt-2
              text-[10px]
              font-semibold
              merchant-muted
            "
          >
            {helper}
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
            rounded-[14px]
            ${iconClass}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   REVENUE TREND CHART
========================================================= */

function RevenueTrendChart({
  data,
  currency,
  loading,
}: {
  data: TrendItem[];
  currency: string;
  loading: boolean;
}) {
  const maxVolume =
    Math.max(
      ...data.map(
        (item) =>
          Number(
            item.volume
          ) || 0
      ),
      1
    );

  if (loading) {
    return (
      <div className="h-[300px] animate-pulse rounded-2xl bg-muted/60" />
    );
  }

  if (!data.length) {
    return (
      <div
        className="
          flex
          h-[300px]
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          merchant-border
          bg-muted/30
        "
      >
        <div className="text-center">
          <BarChart3 className="mx-auto h-8 w-8 merchant-muted" />

          <p className="mt-3 text-sm font-bold text-foreground">
            No completed payment data yet
          </p>

          <p className="mt-1 text-xs merchant-muted">
            Revenue trend will appear after payments are completed.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Keep the chart readable when all-time data
   * contains many daily points.
   */
  const visibleData =
    data.length > 30
      ? data.slice(
          data.length - 30
        )
      : data;

  const width = 1000;
  const height = 280;

  const points =
    visibleData.map(
      (
        item,
        index
      ) => {
        const x =
          visibleData.length ===
          1
            ? width / 2
            : (index /
                (visibleData.length -
                  1)) *
              width;

        const value =
          Number(
            item.volume
          ) || 0;

        const normalized =
          value /
          maxVolume;

        const y =
          height -
          normalized *
            (height - 30) -
          15;

        return {
          x,
          y,
          value,
          item,
        };
      }
    );

  const polylinePoints =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");

  return (
    <div>
      <div className="relative h-[280px] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(37,99,235,0.06),rgba(14,165,233,0.03))]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 right-0 top-[25%] border-t merchant-border" />
          <div className="absolute left-0 right-0 top-[50%] border-t merchant-border" />
          <div className="absolute left-0 right-0 top-[75%] border-t merchant-border" />
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="
            absolute
            inset-x-0
            bottom-0
            h-full
            w-full
            px-2
            py-3
          "
        >
          <defs>
            <linearGradient
              id="merchantRevenueFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#2563eb"
                stopOpacity="0.22"
              />

              <stop
                offset="100%"
                stopColor="#0ea5e9"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {points.length > 1 && (
            <polygon
              points={`
                0,${height}
                ${polylinePoints}
                ${width},${height}
              `}
              fill="url(#merchantRevenueFill)"
            />
          )}

          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map(
            (point) => (
              <circle
                key={
                  point.item.date
                }
                cx={
                  point.x
                }
                cy={
                  point.y
                }
                r="4"
                fill="#0ea5e9"
                stroke="white"
                strokeWidth="2"
              />
            )
          )}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visibleData
          .filter(
            (_, index) =>
              index === 0 ||
              index ===
                Math.floor(
                  visibleData.length /
                    3
                ) ||
              index ===
                Math.floor(
                  (visibleData.length *
                    2) /
                    3
                ) ||
              index ===
                visibleData.length -
                  1
          )
          .map(
            (item) => (
              <div
                key={
                  item.date
                }
                className="
                  rounded-xl
                  border
                  merchant-border
                  bg-background/60
                  px-3
                  py-2.5
                "
              >
                <p className="text-[9px] font-black uppercase tracking-[0.12em] merchant-muted">
                  {formatShortDate(
                    item.date
                  )}
                </p>

                <p className="mt-1 text-xs font-black text-foreground">
                  {formatCompactMoney(
                    Number(
                      item.volume
                    ),
                    currency
                  )}
                </p>
              </div>
            )
          )}
      </div>
    </div>
  );
}

/* =========================================================
   PAYMENT STATUS BREAKDOWN
========================================================= */

function PaymentStatusBreakdown({
  items,
  total,
  loading,
}: {
  items: BreakdownItem[];
  total: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({
          length: 5,
        }).map(
          (_, index) => (
            <div
              key={
                index
              }
              className="animate-pulse"
            >
              <div className="mb-2 h-3 w-24 rounded bg-muted" />
              <div className="h-2 rounded-full bg-muted" />
            </div>
          )
        )}
      </div>
    );
  }

  const orderedStatuses = [
    "completed",
    "pending",
    "authorized",
    "captured",
    "failed",
    "cancelled",
    "expired",
  ];

  const orderedItems =
    orderedStatuses
      .map(
        (status) =>
          items.find(
            (item) =>
              item.key ===
              status
          )
      )
      .filter(
        (
          item
        ): item is BreakdownItem =>
          Boolean(item)
      );

  if (!orderedItems.length) {
    return (
      <div
        className="
          flex
          min-h-[220px]
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          merchant-border
          bg-muted/30
          text-center
        "
      >
        <div>
          <Activity className="mx-auto h-7 w-7 merchant-muted" />

          <p className="mt-3 text-sm font-bold text-foreground">
            No payment activity
          </p>

          <p className="mt-1 text-xs merchant-muted">
            Status distribution will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orderedItems.map(
        (item) => {
          const percentage =
            total > 0
              ? (item.count /
                  total) *
                100
              : 0;

          const config =
            getStatusConfig(
              item.key as PaymentStatus
            );

          return (
            <div
              key={
                item.key
              }
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-lg
                      ${config.className}
                    `}
                  >
                    <config.icon className="h-3.5 w-3.5" />
                  </span>

                  <span className="truncate text-xs font-bold text-foreground">
                    {
                      config.label
                    }
                  </span>
                </div>

                <span className="text-[10px] font-black merchant-muted">
                  {item.count} • {percentage.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${clamp(
                      percentage,
                      0,
                      100
                    )}%`,
                  }}
                  transition={{
                    duration:
                      0.7,
                  }}
                  className="
                    h-full
                    rounded-full
                    bg-[linear-gradient(90deg,#2563eb,#0ea5e9)]
                  "
                />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   RECENT PAYMENTS
========================================================= */

function RecentPayments({
  payments,
  currency,
  loading,
}: {
  payments: RecentPayment[];
  currency: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({
          length: 6,
        }).map(
          (_, index) => (
            <div
              key={
                index
              }
              className="
                animate-pulse
                rounded-2xl
                bg-muted/60
                p-4
              "
            >
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted" />

                <div className="flex-1">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="mt-2 h-2.5 w-48 rounded bg-muted" />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div
        className="
          flex
          min-h-[250px]
          items-center
          justify-center
          rounded-2xl
          border
          border-dashed
          merchant-border
          bg-muted/30
          text-center
        "
      >
        <div>
          <CreditCard className="mx-auto h-8 w-8 merchant-muted" />

          <p className="mt-3 text-sm font-bold text-foreground">
            No payments found
          </p>

          <p className="mt-1 text-xs merchant-muted">
            Your latest payment activity will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map(
        (payment) => {
          const status =
            getStatusConfig(
              payment.status
            );

          return (
            <Link
              key={
                payment.paymentId
              }
              href={`/dashboard/merchant/payments/${encodeURIComponent(
                payment.paymentId
              )}`}
              className="
                group
                flex
                items-center
                gap-3
                rounded-2xl
                border
                merchant-border
                bg-background/50
                px-3
                py-3
                transition-all
                duration-200
                hover:bg-muted/60
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
                  rounded-xl
                  merchant-primary-soft
                  merchant-primary
                "
              >
                <CreditCard className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-black text-foreground">
                    {payment.paymentId}
                  </p>

                  <span
                    className={`
                      shrink-0
                      rounded-full
                      px-2
                      py-1
                      text-[8px]
                      font-black
                      ${status.className}
                    `}
                  >
                    {
                      status.label
                    }
                  </span>
                </div>

                <p className="mt-1 truncate text-[10px] font-semibold merchant-muted">
                  {formatSourceType(
                    payment.sourceType
                  )}{" "}
                  •{" "}
                  {payment.provider}{" "}
                  •{" "}
                  {formatDate(
                    payment.createdAt
                  )}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-foreground">
                  {formatMoney(
                    Number(
                      payment.amount
                    ),
                    payment.currency ||
                      currency
                  )}
                </p>

                <p className="mt-1 text-[9px] font-semibold merchant-muted">
                  {payment.mode.toUpperCase()}
                </p>
              </div>

              <ArrowRight className="hidden h-4 w-4 merchant-muted transition-transform group-hover:translate-x-0.5 sm:block" />
            </Link>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   ANALYTICS BREAKDOWN CARD
========================================================= */

function BreakdownCard({
  title,
  icon: Icon,
  items,
  currency,
  loading,
}: {
  title: string;
  icon: React.ElementType;
  items: BreakdownItem[];
  currency: string;
  loading: boolean;
}) {
  return (
    <div
      className="
        merchant-surface
        merchant-border
        merchant-shadow

        rounded-[22px]
        border
        p-5
      "
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="merchant-primary-soft merchant-primary flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-sm font-black text-foreground">
              {title}
            </h3>

            <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
              Based on completed payments
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <div
                key={
                  index
                }
                className="animate-pulse"
              >
                <div className="h-10 rounded-xl bg-muted" />
              </div>
            )
          )}
        </div>
      ) : items.length ? (
        <div className="space-y-2">
          {items
            .slice(
              0,
              5
            )
            .map(
              (item) => (
                <div
                  key={
                    item.key
                  }
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    merchant-border
                    bg-muted/30
                    px-3
                    py-2.5
                  "
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-foreground">
                      {title ===
                      "Payment Methods"
                        ? formatSourceType(
                            item.key
                          )
                        : formatStatus(
                            item.key
                          )}
                    </p>

                    <p className="mt-0.5 text-[9px] font-semibold merchant-muted">
                      {item.count} payments
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-black text-foreground">
                    {formatCompactMoney(
                      Number(
                        item.amount
                      ),
                      currency
                    )}
                  </p>
                </div>
              )
            )}
        </div>
      ) : (
        <div className="rounded-xl bg-muted/30 px-4 py-8 text-center">
          <p className="text-xs font-bold merchant-muted">
            No data available yet.
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantOverviewPage() {
  const [
    period,
    setPeriod,
  ] = useState<Period>(
    "30d"
  );

  const [
    data,
    setData,
  ] = useState<
    MerchantOverviewData | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =======================================================
     LOAD OVERVIEW
  ======================================================= */

  const loadOverview =
    useCallback(
      async (
        isRefresh = false
      ) => {
        try {
          if (
            isRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setErrorMessage("");

          const response =
            await apiClient<MerchantOverviewResponse>(
              `/merchants/overview?period=${period}`,
              {
                method:
                  "GET",
              }
            );

          if (
            !response?.success ||
            !response.data
          ) {
            throw new Error(
              response?.message ||
                "Unable to load merchant overview."
            );
          }

          setData(
            response.data
          );
        } catch (
          error
        ) {
          console.error(
            "Merchant overview loading error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load merchant overview."
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
      [period]
    );

  useEffect(() => {
    void loadOverview();
  }, [
    loadOverview,
  ]);

  /* =======================================================
     DERIVED
  ======================================================= */

  const summary =
    data?.summary;

  const merchant =
    data?.merchant;

  const currency =
    merchant?.defaultCurrency ||
    "BDT";

  const totalPayments =
    summary?.totalPayments ??
    0;

  const successfulPayments =
    summary?.successfulPayments ??
    0;

  const pendingPayments =
    summary?.pendingPayments ??
    0;

  const failedPayments =
    summary?.failedPayments ??
    0;

  const successRate =
    summary?.successRate ??
    0;

  const grossVolume =
    summary?.grossVolume ??
    0;

  const totalFees =
    summary?.totalFees ??
    0;

  const netRevenue =
    summary?.netRevenue ??
    0;

  const averagePaymentValue =
    summary?.averagePaymentValue ??
    0;

  const uniqueCustomers =
    summary?.uniqueCustomers ??
    0;

  const periodLabel =
    PERIOD_OPTIONS.find(
      (
        item
      ) =>
        item.value ===
        period
    )?.label ??
    "Last 30 days";

  const liveEnvironmentReady =
    merchant?.liveEnabled &&
    merchant.verificationStatus ===
      "verified";

  const latestActivityText =
    useMemo(() => {
      if (
        !data?.generatedAt
      ) {
        return "Waiting for data...";
      }

      return `Updated ${formatDate(
        data.generatedAt
      )}`;
    }, [
      data?.generatedAt,
    ]);

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    !loading &&
    errorMessage &&
    !data
  ) {
    return (
      <div className="merchant-theme">
        <div className="mx-auto max-w-[1440px]">
          <div
            className="
              merchant-surface
              merchant-border
              merchant-shadow

              rounded-[28px]
              border
              p-8
              text-center
            "
          >
            <div
              className="
                merchant-danger-soft
                merchant-danger

                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
              "
            >
              <XCircle className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-black text-foreground">
              Merchant overview unavailable
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 merchant-muted">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadOverview()
              }
              className="
                merchant-primary-bg

                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                px-5
                py-3
                text-sm
                font-black
                transition
                hover:opacity-90
              "
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-theme space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

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
          duration: 0.4,
        }}
        className="
          relative
          overflow-hidden
          rounded-[28px]
          p-6
          text-white
          merchant-gradient
          shadow-xl
          sm:p-7
          lg:p-8
        "
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
                <Store className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                  Merchant Portal
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="truncate text-lg font-black sm:text-xl">
                    {merchant?.businessDisplayName ||
                      merchant?.businessName ||
                      "Your Business"}
                  </span>

                  {merchant?.status ===
                    "active" && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/20 bg-emerald-300/15 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h2 className="mt-7 max-w-2xl text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">
              Your payment business at a glance.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Monitor payment volume, revenue,
              customer activity and payment
              performance from one place.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white/80 backdrop-blur">
                {periodLabel}
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white/80 backdrop-blur">
                {currency}
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white/80 backdrop-blur">
                {latestActivityText}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/merchant/payments"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/15
                bg-white/10
                px-4
                py-3
                text-xs
                font-black
                text-white
                backdrop-blur
                transition
                hover:bg-white/15
              "
            >
              <CreditCard className="h-4 w-4" />
              View Payments
            </Link>

            <Link
              href="/dashboard/merchant/analytics"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-4
                py-3
                text-xs
                font-black
                text-blue-700
                transition
                hover:bg-white/90
              "
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ===================================================
          ERROR BANNER
      =================================================== */}

      {errorMessage &&
        data && (
          <div
            className="
              merchant-danger-soft
              merchant-danger

              flex
              items-center
              justify-between
              gap-3
              rounded-2xl
              border
              border-red-200/70
              px-4
              py-3
              text-xs
              font-bold
            "
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>
                {errorMessage}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadOverview(
                  true
                )
              }
              className="shrink-0 rounded-lg px-3 py-2 font-black transition hover:bg-white/40"
            >
              Retry
            </button>
          </div>
        )}

      {/* ===================================================
          PERIOD FILTER
      =================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] merchant-muted">
            Business Overview
          </p>

          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-foreground">
            Performance snapshot
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={period}
              onChange={(
                event
              ) =>
                setPeriod(
                  event.target
                    .value as Period
                )
              }
              className="
                h-10
                appearance-none
                rounded-xl
                border
                merchant-border
                bg-card
                px-3
                pr-9
                text-xs
                font-black
                text-foreground
                outline-none
                transition
                focus:border-blue-400
              "
            >
              {PERIOD_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <ChevronDown
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                h-3.5
                w-3.5
                -translate-y-1/2
                merchant-muted
              "
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void loadOverview(
                true
              )
            }
            disabled={refreshing}
            className="
              inline-flex
              h-10
              items-center
              gap-2
              rounded-xl
              border
              merchant-border
              bg-card
              px-3.5
              text-xs
              font-black
              text-foreground
              shadow-sm
              transition
              hover:bg-muted
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCcw
              className={`
                h-3.5
                w-3.5
                ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              `}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* ===================================================
          PRIMARY STATS
      =================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross Payment Volume"
          value={formatCompactMoney(
            grossVolume,
            currency
          )}
          helper={`${totalPayments.toLocaleString()} total payments`}
          icon={
            DollarSign
          }
          tone="primary"
          loading={loading}
        />

        <StatCard
          label="Net Revenue"
          value={formatCompactMoney(
            netRevenue,
            currency
          )}
          helper={`${formatMoney(
            totalFees,
            currency
          )} platform fees`}
          icon={
            WalletCards
          }
          tone="success"
          loading={loading}
        />

        <StatCard
          label="Successful Payments"
          value={successfulPayments.toLocaleString()}
          helper={`${successRate.toFixed(
            1
          )}% payment success rate`}
          icon={
            CheckCircle2
          }
          tone="success"
          loading={loading}
        />

        <StatCard
          label="Failed Payments"
          value={failedPayments.toLocaleString()}
          helper={`${pendingPayments.toLocaleString()} currently pending`}
          icon={
            XCircle
          }
          tone="danger"
          loading={loading}
        />
      </section>

      {/* ===================================================
          SECONDARY STATS
      =================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={uniqueCustomers.toLocaleString()}
          helper="Unique customers in selected period"
          icon={
            Users
          }
          tone="neutral"
          loading={loading}
        />

        <StatCard
          label="Average Payment"
          value={formatCompactMoney(
            averagePaymentValue,
            currency
          )}
          helper="Average completed payment"
          icon={
            ShoppingBag
          }
          tone="primary"
          loading={loading}
        />

        <StatCard
          label="Pending Payments"
          value={pendingPayments.toLocaleString()}
          helper={`${summary?.processingPayments ?? 0} authorized/captured`}
          icon={
            Clock3
          }
          tone="warning"
          loading={loading}
        />

        <StatCard
          label="Refund / Fee Impact"
          value={formatCompactMoney(
            totalFees,
            currency
          )}
          helper="Current platform fee total"
          icon={
            RefreshCcw
          }
          tone="warning"
          loading={loading}
        />
      </section>

      {/* ===================================================
          REVENUE + STATUS
      =================================================== */}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        {/* Revenue */}

        <div
          className="
            merchant-surface
            merchant-border
            merchant-shadow

            rounded-[22px]
            border
            p-5
            sm:p-6
          "
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="merchant-primary-soft merchant-primary flex h-10 w-10 items-center justify-center rounded-xl">
                  <BarChart3 className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-foreground">
                    Revenue Trend
                  </h3>

                  <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
                    Completed payment volume over time
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border merchant-border bg-muted/40 px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] merchant-muted">
                Net Revenue
              </p>

              <p className="mt-1 text-sm font-black text-foreground">
                {loading
                  ? "—"
                  : formatMoney(
                      netRevenue,
                      currency
                    )}
              </p>
            </div>
          </div>

          <RevenueTrendChart
            data={
              data?.trend ??
              []
            }
            currency={
              currency
            }
            loading={
              loading
            }
          />
        </div>

        {/* Status */}

        <div
          className="
            merchant-surface
            merchant-border
            merchant-shadow

            rounded-[22px]
            border
            p-5
            sm:p-6
          "
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="merchant-primary-soft merchant-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <Activity className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-sm font-black text-foreground">
                Payment Status
              </h3>

              <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
                Payment lifecycle distribution
              </p>
            </div>
          </div>

          <PaymentStatusBreakdown
            items={
              data?.statusBreakdown ??
              []
            }
            total={
              totalPayments
            }
            loading={
              loading
            }
          />
        </div>
      </section>

      {/* ===================================================
          RECENT PAYMENTS + PAYMENT METHODS
      =================================================== */}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,0.9fr)]">
        {/* Recent */}

        <div
          className="
            merchant-surface
            merchant-border
            merchant-shadow

            rounded-[22px]
            border
            p-5
            sm:p-6
          "
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-foreground">
                Recent Payments
              </h3>

              <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
                Latest activity from your payment gateway
              </p>
            </div>

            <Link
              href="/dashboard/merchant/payments"
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                px-2.5
                py-2
                text-[10px]
                font-black
                merchant-primary
                transition
                hover:bg-muted
              "
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <RecentPayments
            payments={
              data?.recentPayments ??
              []
            }
            currency={
              currency
            }
            loading={
              loading
            }
          />
        </div>

        {/* Methods */}

        <div className="space-y-5">
          <BreakdownCard
            title="Payment Methods"
            icon={
              CreditCard
            }
            items={
              data?.paymentMethods ??
              []
            }
            currency={
              currency
            }
            loading={
              loading
            }
          />

          <BreakdownCard
            title="Providers"
            icon={
              Activity
            }
            items={
              data?.providers ??
              []
            }
            currency={
              currency
            }
            loading={
              loading
            }
          />
        </div>
      </section>

      {/* ===================================================
          BUSINESS HEALTH / QUICK ACTIONS
      =================================================== */}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* Business health */}

        <div
          className="
            merchant-surface
            merchant-border
            merchant-shadow

            rounded-[22px]
            border
            p-5
            sm:p-6
          "
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="merchant-accent-soft merchant-accent flex h-10 w-10 items-center justify-center rounded-xl">
                  <Store className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-foreground">
                    Merchant Health
                  </h3>

                  <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
                    Integration and payment readiness
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border merchant-border bg-muted/30 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] merchant-muted">
                    Account
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`
                        h-2
                        w-2
                        rounded-full
                        ${
                          merchant?.status ===
                          "active"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }
                      `}
                    />

                    <span className="text-xs font-black text-foreground">
                      {formatStatus(
                        merchant?.status ??
                          "unknown"
                      )}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border merchant-border bg-muted/30 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] merchant-muted">
                    Verification
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`
                        h-2
                        w-2
                        rounded-full
                        ${
                          merchant?.verificationStatus ===
                          "verified"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }
                      `}
                    />

                    <span className="truncate text-xs font-black text-foreground">
                      {formatStatus(
                        merchant?.verificationStatus ??
                          "unknown"
                      )}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border merchant-border bg-muted/30 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] merchant-muted">
                    Live Mode
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`
                        h-2
                        w-2
                        rounded-full
                        ${
                          liveEnvironmentReady
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }
                      `}
                    />

                    <span className="text-xs font-black text-foreground">
                      {liveEnvironmentReady
                        ? "Ready"
                        : "Not Ready"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-blue-100 dark:border-blue-500/10">
                <svg
                  className="absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/60"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="264"
                    strokeDashoffset={
                      loading
                        ? 264
                        : 264 -
                          (clamp(
                            successRate,
                            0,
                            100
                          ) /
                            100) *
                            264
                    }
                  />
                </svg>

                <div className="relative text-center">
                  <p className="text-2xl font-black tracking-[-0.05em] text-foreground">
                    {loading
                      ? "—"
                      : `${successRate.toFixed(
                          0
                        )}%`}
                  </p>

                  <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] merchant-muted">
                    Success
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}

        <div
          className="
            merchant-surface
            merchant-border
            merchant-shadow

            rounded-[22px]
            border
            p-5
            sm:p-6
          "
        >
          <div className="flex items-center gap-3">
            <div className="merchant-primary-soft merchant-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <ZapIcon className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-sm font-black text-foreground">
                Quick Actions
              </h3>

              <p className="mt-0.5 text-[10px] font-semibold merchant-muted">
                Manage your merchant platform
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            <QuickAction
              href="/dashboard/merchant/payments"
              icon={
                CreditCard
              }
              label="Manage Payments"
              description="Review and search payment activity"
            />

            <QuickAction
              href="/dashboard/merchant/analytics"
              icon={
                BarChart3
              }
              label="Open Analytics"
              description="Explore detailed business analytics"
            />

            <QuickAction
              href="/dashboard/merchant/api-keys"
              icon={
                KeyIcon
              }
              label="API Keys"
              description="Manage test and live credentials"
            />

            <QuickAction
              href="/dashboard/merchant/webhooks"
              icon={
                WebhookIcon
              }
              label="Webhooks"
              description="Configure event delivery endpoints"
            />

            <QuickAction
              href="/dashboard/merchant/reports"
              icon={
                FileBarChart2
              }
              label="Reports"
              description="Generate and review merchant reports"
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          FOOTER SUMMARY
      =================================================== */}

      <div className="flex flex-col gap-3 border-t merchant-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-bold merchant-muted">
          <span>
            {totalPayments.toLocaleString()} payments
          </span>

          <span>
            {uniqueCustomers.toLocaleString()} customers
          </span>

          <span>
            {formatMoney(
              grossVolume,
              currency
            )}{" "}
            gross volume
          </span>
        </div>

        <Link
          href="/dashboard/merchant/reports"
          className="
            inline-flex
            items-center
            gap-1.5
            text-[9px]
            font-black
            merchant-primary
            transition
            hover:opacity-80
          "
        >
          Open reports
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="
        group
        flex
        items-center
        gap-3
        rounded-2xl
        border
        merchant-border
        bg-muted/30
        p-3
        transition-all
        duration-200
        hover:bg-muted/60
      "
    >
      <div className="merchant-primary-soft merchant-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-foreground">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[9px] font-semibold merchant-muted">
          {description}
        </p>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 merchant-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* =========================================================
   SMALL ICON HELPERS
========================================================= */

function ZapIcon(
  props: React.ComponentProps<
    typeof Activity
  >
) {
  return (
    <Activity
      {...props}
      strokeWidth={2}
    />
  );
}

function KeyIcon(
  props: React.ComponentProps<
    typeof Activity
  >
) {
  return (
    <Activity
      {...props}
      strokeWidth={2}
    />
  );
}

function WebhookIcon(
  props: React.ComponentProps<
    typeof Activity
  >
) {
  return (
    <Activity
      {...props}
      strokeWidth={2}
    />
  );
}