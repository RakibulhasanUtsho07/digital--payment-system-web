"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Hash,
  Layers3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import IssueRefundButton from "../components/IssueRefundButton";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type DecimalValue =
  | string
  | number
  | {
      $numberDecimal?: string;
    }
  | null;

interface MerchantSummary {
  _id: string;
  businessName?: string;
  displayName?: string;
  slug?: string;
  status?: string;
  verificationStatus?: string;
  defaultCurrency?: string;
  testEnabled?: boolean;
  liveEnabled?: boolean;
}

interface MerchantPayment {
  _id?: string;
  paymentId: string;
  merchantId?: string;
  customerId?: string | null;
  orderId?: string | null;
  amount: DecimalValue;
  feeAmount?: DecimalValue;
  netAmount?: DecimalValue;
  currency: string;
  sourceType?: string;
  provider?: string;
  mode?: string;
  status?: string;
  providerPaymentId?: string | null;
  merchantReference?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  returnUrl?: string | null;
  cancelUrl?: string | null;
  checkoutUrl?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentDetailResponse {
  success: boolean;
  message?: string;
  merchant: MerchantSummary;
  payment: MerchantPayment;
}

interface TimelineItem {
  key: string;
  title: string;
  description: string;
  date?: string | null;
  completed: boolean;
  danger?: boolean;
}

/* =========================================================
   PURPLE BACKGROUND
========================================================= */

function PurpleAuroraBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
        }}
      />

      <motion.div
        animate={{
          x: [0, 90, 10, 0],
          y: [0, 30, 70, 0],
          scale: [1, 1.18, 0.92, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -left-32
          -top-40
          h-[420px]
          w-[420px]
          rounded-full
          bg-fuchsia-400/30
          blur-[110px]
        "
      />

      <motion.div
        animate={{
          x: [0, -75, 25, 0],
          y: [0, -35, 50, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{
          duration: 21,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          pointer-events-none
          absolute
          -bottom-44
          right-[-60px]
          h-[450px]
          w-[450px]
          rounded-full
          bg-violet-300/30
          blur-[115px]
        "
      />

      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 46,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          pointer-events-none
          absolute
          right-[10%]
          top-[-190px]
          h-[390px]
          w-[390px]
          rounded-full
          border
          border-white/10
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.07]
          [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)]
          [background-size:24px_24px]
        "
      />
    </>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getDecimalNumber(
  value:
    DecimalValue |
    undefined
): number {
  if (
    typeof value ===
      "object" &&
    value !== null
  ) {
    const amount =
      Number(
        value.$numberDecimal ??
          0
      );

    return Number.isFinite(
      amount
    )
      ? amount
      : 0;
  }

  const amount =
    Number(
      value ?? 0
    );

  return Number.isFinite(
    amount
  )
    ? amount
    : 0;
}

function formatMoney(
  value:
    DecimalValue |
    undefined,
  currency =
    "BDT"
): string {
  const amount =
    getDecimalNumber(
      value
    );

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",

        currency:
          currency ||
          "BDT",

        maximumFractionDigits:
          2,
      }
    ).format(
      amount
    );
  } catch {
    return `${currency || "BDT"} ${amount.toFixed(
      2
    )}`;
  }
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function humanize(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

function normalizeStatus(
  status?: string
): string {
  return (
    status
      ?.trim()
      .toLowerCase() ||
    "pending"
  );
}

function getStatusMeta(
  status?: string
) {
  const normalized =
    normalizeStatus(
      status
    );

  switch (
    normalized
  ) {
    case "completed":
      return {
        label:
          "Completed",

        icon:
          CheckCircle2,

        className:
          "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300",

        description:
          "The payment completed successfully.",
      };

    case "authorized":
      return {
        label:
          "Authorized",

        icon:
          ShieldCheck,

        className:
          "border-violet-300/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",

        description:
          "The payment was authorized and is ready for capture.",
      };

    case "captured":
      return {
        label:
          "Captured",

        icon:
          CreditCard,

        className:
          "border-violet-300/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",

        description:
          "The authorized payment amount was captured.",
      };

    case "failed":
      return {
        label:
          "Failed",

        icon:
          XCircle,

        className:
          "border-red-200 bg-red-500/10 text-red-700 dark:border-red-900/50 dark:text-red-300",

        description:
          "The payment could not be completed.",
      };

    case "cancelled":
      return {
        label:
          "Cancelled",

        icon:
          XCircle,

        className:
          "border-red-200 bg-red-500/10 text-red-700 dark:border-red-900/50 dark:text-red-300",

        description:
          "The payment was cancelled.",
      };

    case "expired":
      return {
        label:
          "Expired",

        icon:
          Clock3,

        className:
          "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:text-amber-300",

        description:
          "The payment expired before completion.",
      };

    default:
      return {
        label:
          "Pending",

        icon:
          Clock3,

        className:
          "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:text-amber-300",

        description:
          "The payment is waiting for further processing.",
      };
  }
}

function getMethodMeta(
  sourceType?: string
) {
  switch (
    sourceType
      ?.trim()
      .toLowerCase()
  ) {
    case "wallet":
      return {
        icon:
          WalletCards,

        label:
          "Wallet",
      };

    case "paypal":
      return {
        icon:
          CreditCard,

        label:
          "PayPal",
      };

    case "card":
      return {
        icon:
          CreditCard,

        label:
          "Card",
      };

    case "local_psp":
      return {
        icon:
          Zap,

        label:
          "Local PSP",
      };

    default:
      return {
        icon:
          CreditCard,

        label:
          humanize(
            sourceType
          ),
      };
  }
}

function safeExternalUrl(
  value?: string | null
): string | null {
  if (!value) {
    return null;
  }

  try {
    const url =
      new URL(
        value
      );

    if (
      url.protocol !==
        "https:" &&
      url.protocol !==
        "http:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/* =========================================================
   COPY
========================================================= */

function CopyButton({
  value,
  inverted =
    false,
}: {
  value?: string | null;
  inverted?: boolean;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(
      false
    );

  if (!value) {
    return null;
  }

  const copyValue =
    async () => {
      try {
        await navigator.clipboard.writeText(
          value
        );

        setCopied(
          true
        );

        window.setTimeout(
          () =>
            setCopied(
              false
            ),
          1500
        );
      } catch {
        setCopied(
          false
        );
      }
    };

  return (
    <motion.button
      type="button"
      whileTap={{
        scale:
          0.96,
      }}
      onClick={() =>
        void copyValue()
      }
      className={`
        inline-flex
        h-8
        items-center
        gap-1.5
        rounded-lg
        border
        px-2.5
        text-xs
        font-black
        transition

        ${
          inverted
            ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
            : "border-violet-300/20 bg-violet-500/[0.04] text-violet-600 hover:bg-violet-500/10"
        }
      `}
    >
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}

      {copied
        ? "Copied"
        : "Copy"}
    </motion.button>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  mono =
    false,
  copy =
    false,
}: {
  label:
    string;

  value?: string | null;

  mono?:
    boolean;

  copy?:
    boolean;
}) {
  const displayValue =
    value?.trim() ||
    "Not available";

  return (
    <motion.div
      className="
        flex
        min-w-0
        flex-col
        gap-2
        border-b
        border-violet-300/10
        py-4

        last:border-b-0

        sm:flex-row
        sm:items-start
        sm:justify-between
        sm:gap-6
      "
    >
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-500/75">
          {
            label
          }
        </p>

        <p
          className={`
            mt-1
            break-all
            text-sm
            font-bold
            text-foreground

            ${
              mono
                ? "font-mono"
                : ""
            }
          `}
        >
          {
            displayValue
          }
        </p>
      </div>

      {copy &&
        value && (
          <div className="shrink-0">
            <CopyButton
              value={
                value
              }
            />
          </div>
        )}
    </motion.div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  description,
  icon:
    Icon,
  index,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Banknote;
  index: number;
}) {
  return (
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
        delay:
          index *
          0.05,
      }}
      whileHover={{
        y: -5,
      }}
      className="
        group
        relative
        h-full
        min-w-0
        overflow-hidden
        rounded-[22px]
        border
        merchant-border
        bg-[linear-gradient(145deg,rgba(124,58,237,.06),rgba(255,255,255,.92))]
        p-5

        dark:bg-[linear-gradient(145deg,rgba(124,58,237,.10),rgba(15,23,42,.9))]
      "
    >
      <div
        className="
          absolute
          inset-x-0
          top-0
          h-[3px]
          bg-gradient-to-r
          from-violet-700
          via-purple-500
          to-fuchsia-400
        "
      />

      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-500/75">
            {
              title
            }
          </p>

          <p className="mt-3 break-words text-xl font-black leading-tight text-violet-800 dark:text-violet-100 [overflow-wrap:anywhere]">
            {
              value
            }
          </p>

          <p className="mt-2 text-xs leading-5 merchant-muted">
            {
              description
            }
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate:
              7,
            scale:
              1.1,
          }}
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-violet-500/10
            text-violet-600

            dark:text-violet-300
          "
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.section>
  );
}

/* =========================================================
   LOADING + ERROR
========================================================= */

function LoadingState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
          <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
        </div>

        <p className="mt-4 text-sm font-black text-foreground">
          Loading payment details
        </p>

        <p className="mt-1 text-xs merchant-muted">
          Please wait while the payment record is retrieved.
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message:
    string;

  onRetry:
    () => void;
}) {
  return (
    <div className="flex min-h-[520px] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border merchant-border merchant-surface p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>

        <h2 className="mt-4 text-lg font-black text-foreground">
          Unable to load payment
        </h2>

        <p className="mt-2 text-sm leading-6 merchant-muted">
          {
            message
          }
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/merchant/payments"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border merchant-border px-4 text-sm font-black text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to payments
          </Link>

          <button
            type="button"
            onClick={
              onRetry
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white"
          >
            <RefreshCw className="h-4 w-4" />

            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantPaymentDetailsPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isMerchantRole =
    user.role === "merchant";

  useEffect(() => {
    if (isMerchantRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  const params =
    useParams();

  const rawPaymentId =
    params?.paymentId;

  const paymentId =
    Array.isArray(
      rawPaymentId
    )
      ? rawPaymentId[0]
      : typeof rawPaymentId ===
          "string"
        ? rawPaymentId
        : "";

  const [
    data,
    setData,
  ] =
    useState<PaymentDetailResponse | null>(
      null
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
    useState("");

  const fetchPayment =
    useCallback(
      async ({
        silent =
          false,
      }: {
        silent?: boolean;
      } = {}) => {
        if (!isMerchantRole) {
          setLoading(false);
          setRefreshing(false);
          setData(null);
          setError("");

          return;
        }

        if (
          !paymentId
        ) {
          setError(
            "A valid payment ID is required."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setError(
            ""
          );

          if (
            silent
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          const response =
            await apiClient<PaymentDetailResponse>(
              `/merchants/payments/${encodeURIComponent(
                paymentId
              )}`,
              {
                method:
                  "GET",
              }
            );

          if (
            !response?.payment ||
            !response?.merchant
          ) {
            throw new Error(
              "The server returned an invalid payment response."
            );
          }

          setData(
            response
          );
        } catch (
          err
        ) {
          const message =
            err instanceof
              Error
              ? err.message
              : "Unable to load payment details.";

          setError(
            message
          );

          if (
            !silent
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
        isMerchantRole,
        paymentId,
      ]
    );

  useEffect(
    () => {
      if (!isMerchantRole) {
        setLoading(false);

        return;
      }

      void fetchPayment();
    },
    [
      isMerchantRole,
      fetchPayment,
    ]
  );

  const payment =
    data?.payment;

  const merchant =
    data?.merchant;

  const statusMeta =
    getStatusMeta(
      payment?.status
    );

  const methodMeta =
    getMethodMeta(
      payment?.sourceType
    );

  const StatusIcon =
    statusMeta.icon;

  const MethodIcon =
    methodMeta.icon;

  const currency =
    payment?.currency ||
    merchant?.defaultCurrency ||
    "BDT";

  const amount =
    formatMoney(
      payment?.amount,
      currency
    );

  const feeAmount =
    formatMoney(
      payment?.feeAmount,
      currency
    );

  const netAmount =
    formatMoney(
      payment?.netAmount,
      currency
    );

  const returnUrl =
    safeExternalUrl(
      payment?.returnUrl
    );

  const cancelUrl =
    safeExternalUrl(
      payment?.cancelUrl
    );

  const checkoutUrl =
    safeExternalUrl(
      payment?.checkoutUrl
    );

  const timeline =
    useMemo<TimelineItem[]>(
      () => {
        if (
          !payment
        ) {
          return [];
        }

        const status =
          normalizeStatus(
            payment.status
          );

        const items:
          TimelineItem[] = [
          {
            key:
              "created",

            title:
              "Payment created",

            description:
              "The merchant payment was created.",

            date:
              payment.createdAt,

            completed:
              Boolean(
                payment.createdAt
              ),
          },

          {
            key:
              "authorized",

            title:
              "Payment authorized",

            description:
              "The payment received authorization.",

            date:
              payment.authorizedAt,

            completed:
              Boolean(
                payment.authorizedAt
              ),
          },

          {
            key:
              "captured",

            title:
              "Payment captured",

            description:
              "The authorized payment amount was captured.",

            date:
              payment.capturedAt,

            completed:
              Boolean(
                payment.capturedAt
              ),
          },

          {
            key:
              "completed",

            title:
              "Payment completed",

            description:
              "The payment completed successfully.",

            date:
              payment.completedAt,

            completed:
              Boolean(
                payment.completedAt
              ) ||
              status ===
                "completed",
          },
        ];

        if (
          status ===
            "failed" ||
          payment.failedAt
        ) {
          items.push({
            key:
              "failed",

            title:
              "Payment failed",

            description:
              payment.failureMessage ||
              "The payment could not be completed.",

            date:
              payment.failedAt,

            completed:
              true,

            danger:
              true,
          });
        }

        if (
          status ===
            "cancelled" ||
          payment.cancelledAt
        ) {
          items.push({
            key:
              "cancelled",

            title:
              "Payment cancelled",

            description:
              "The payment was cancelled.",

            date:
              payment.cancelledAt,

            completed:
              true,

            danger:
              true,
          });
        }

        if (
          status ===
            "expired" ||
          payment.expiredAt
        ) {
          items.push({
            key:
              "expired",

            title:
              "Payment expired",

            description:
              "The payment expired before completion.",

            date:
              payment.expiredAt,

            completed:
              true,

            danger:
              true,
          });
        }

        return items;
      },
      [
        payment,
      ]
    );

  if (!isMerchantRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-background px-4 text-foreground">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening your workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Merchant payment details are available only to merchant accounts.
          </p>
        </div>
      </main>
    );
  }

  if (
    loading
  ) {
    return (
      <div className="merchant-theme min-h-full">
        <LoadingState />
      </div>
    );
  }

  if (
    error &&
    !data
  ) {
    return (
      <div className="merchant-theme min-h-full">
        <ErrorState
          message={
            error
          }
          onRetry={() => {
            if (!isMerchantRole) {
              return;
            }

            void fetchPayment();
          }}
        />
      </div>
    );
  }

  if (
    !payment ||
    !merchant
  ) {
    return (
      <div className="merchant-theme min-h-full">
        <ErrorState
          message="Payment details were not found."
          onRetry={() =>
            void fetchPayment()
          }
        />
      </div>
    );
  }

  return (
    <div className="merchant-theme min-h-full">
      <div className="min-h-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px] space-y-6">

          <Link
            href="/dashboard/merchant/payments"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-black
              text-violet-600
              transition

              hover:text-fuchsia-600
            "
          >
            <ArrowLeft className="h-4 w-4" />

            Back to payments
          </Link>

          {error &&
            data && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-500/[0.06] p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">
                    Refresh failed
                  </p>

                  <p className="mt-1 break-words text-sm leading-5 merchant-muted [overflow-wrap:anywhere]">
                    {
                      error
                    }
                  </p>
                </div>
              </div>
            )}

          {/* =================================================
              PURPLE PAYMENT HERO
          ================================================== */}

          <motion.header
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              relative
              overflow-hidden
              rounded-[30px]
              p-6
              text-white

              sm:p-7
              lg:p-8
            "
          >
            <PurpleAuroraBackground />

            <div
              className="
                relative
                z-10
                flex
                flex-col
                gap-7

                lg:flex-row
                lg:items-end
                lg:justify-between
              "
            >
              <div className="min-w-0 max-w-[850px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      border
                      px-3
                      py-1.5
                      text-xs
                      font-black

                      ${statusMeta.className}
                    `}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />

                    {
                      statusMeta.label
                    }
                  </span>

                  <span
                    className="
                      inline-flex
                      items-center
                      rounded-full
                      border
                      border-white/15
                      bg-white/10
                      px-3
                      py-1.5
                      text-xs
                      font-black
                      text-white
                    "
                  >
                    {normalizeStatus(
                      payment.mode
                    ) ===
                    "live"
                      ? "Live mode"
                      : "Test mode"}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.19em] text-fuchsia-100/60">
                  <Sparkles className="h-3.5 w-3.5" />

                  Payment record
                </div>

                <h1
                  className="
                    mt-3
                    break-all
                    font-mono
                    text-[25px]
                    font-black
                    tracking-[-0.04em]

                    sm:text-[30px]
                    lg:text-[34px]
                  "
                >
                  {
                    payment.paymentId
                  }
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  {
                    statusMeta.description
                  }
                </p>

                <div className="mt-4">
                  <CopyButton
                    value={
                      payment.paymentId
                    }
                    inverted
                  />
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap lg:justify-end">
                <IssueRefundButton
                  paymentId={
                    payment.paymentId
                  }
                  paymentAmount={getDecimalNumber(
                    payment.amount
                  )}
                  currency={
                    currency
                  }
                  status={
                    payment.status
                  }
                  sourceType={
                    payment.sourceType
                  }
                  provider={
                    payment.provider
                  }
                  mode={
                    payment.mode
                  }
                  onCompleted={() =>
                    void fetchPayment({
                      silent:
                        true,
                    })
                  }
                />

                <motion.button
                  type="button"
                  whileHover={{
                    y: -3,
                  }}
                  onClick={() => {
                    if (!isMerchantRole) {
                      return;
                    }

                    void fetchPayment({
                      silent:
                        true,
                    });
                  }}
                  disabled={
                    refreshing
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
                    text-sm
                    font-black
                    text-violet-700

                    disabled:opacity-60
                  "
                >
                  <RefreshCw
                    className={`
                      h-4
                      w-4

                      ${
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                    `}
                  />

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* =================================================
              SUMMARY
          ================================================== */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Payment amount"
              value={
                amount
              }
              description="Original payment amount"
              icon={
                Banknote
              }
              index={
                0
              }
            />

            <SummaryCard
              title="Processing fee"
              value={
                feeAmount
              }
              description="Fee applied to this payment"
              icon={
                CreditCard
              }
              index={
                1
              }
            />

            <SummaryCard
              title="Net amount"
              value={
                netAmount
              }
              description="Merchant settlement amount"
              icon={
                WalletCards
              }
              index={
                2
              }
            />

            <SummaryCard
              title="Payment method"
              value={
                methodMeta.label
              }
              description={humanize(
                payment.provider
              )}
              icon={
                MethodIcon
              }
              index={
                3
              }
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">

            {/* LEFT */}

            <div className="space-y-6">

              {/* PAYMENT INFO */}

              <motion.section
                whileHover={{
                  y: -3,
                }}
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  merchant-border
                  merchant-surface
                "
              >
                <div className="border-b border-violet-300/15 bg-violet-500/[0.035] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                      <CreditCard className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-500">
                        Core details
                      </p>

                      <h2 className="mt-0.5 font-black text-foreground">
                        Payment information
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="px-5">
                  <DetailRow
                    label="Payment ID"
                    value={
                      payment.paymentId
                    }
                    mono
                    copy
                  />

                  <DetailRow
                    label="Provider payment ID"
                    value={
                      payment.providerPaymentId
                    }
                    mono
                    copy
                  />

                  <DetailRow
                    label="Merchant reference"
                    value={
                      payment.merchantReference
                    }
                    mono
                    copy
                  />

                  <DetailRow
                    label="Provider"
                    value={humanize(
                      payment.provider
                    )}
                  />

                  <DetailRow
                    label="Source type"
                    value={humanize(
                      payment.sourceType
                    )}
                  />

                  <DetailRow
                    label="Environment"
                    value={humanize(
                      payment.mode
                    )}
                  />

                  <DetailRow
                    label="Currency"
                    value={
                      currency
                    }
                  />
                </div>
              </motion.section>

              {/* CUSTOMER */}

              <motion.section
                whileHover={{
                  y: -3,
                }}
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  merchant-border
                  merchant-surface
                "
              >
                <div className="border-b border-violet-300/15 bg-violet-500/[0.035] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-500">
                        References
                      </p>

                      <h2 className="mt-0.5 font-black text-foreground">
                        Customer and order
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="px-5">
                  <DetailRow
                    label="Customer ID"
                    value={
                      payment.customerId
                    }
                    mono
                    copy
                  />

                  <DetailRow
                    label="Order ID"
                    value={
                      payment.orderId
                    }
                    mono
                    copy
                  />

                  <DetailRow
                    label="Merchant ID"
                    value={
                      typeof payment.merchantId ===
                      "string"
                        ? payment.merchantId
                        : merchant._id
                    }
                    mono
                    copy
                  />
                </div>
              </motion.section>

              {/* URLS */}

              {(checkoutUrl ||
                returnUrl ||
                cancelUrl) && (
                <motion.section
                  whileHover={{
                    y: -3,
                  }}
                  className="
                    overflow-hidden
                    rounded-[24px]
                    border
                    merchant-border
                    merchant-surface
                  "
                >
                  <div className="border-b border-violet-300/15 bg-violet-500/[0.035] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                        <ExternalLink className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-500">
                          Redirects
                        </p>

                        <h2 className="mt-0.5 font-black text-foreground">
                          Payment URLs
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    {checkoutUrl && (
                      <ExternalUrl
                        label="Checkout URL"
                        url={
                          checkoutUrl
                        }
                      />
                    )}

                    {returnUrl && (
                      <ExternalUrl
                        label="Return URL"
                        url={
                          returnUrl
                        }
                      />
                    )}

                    {cancelUrl && (
                      <ExternalUrl
                        label="Cancel URL"
                        url={
                          cancelUrl
                        }
                      />
                    )}
                  </div>
                </motion.section>
              )}

              {(payment.failureCode ||
                payment.failureMessage) && (
                <section className="rounded-2xl border border-red-200 bg-red-500/[0.06] p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

                    <div className="min-w-0">
                      <h2 className="font-black text-foreground">
                        Failure information
                      </h2>

                      {payment.failureCode && (
                        <p className="mt-3 font-mono text-sm font-black text-red-500">
                          {
                            payment.failureCode
                          }
                        </p>
                      )}

                      {payment.failureMessage && (
                        <p className="mt-2 text-sm leading-6 merchant-muted">
                          {
                            payment.failureMessage
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT */}

            <div className="space-y-6">

              {/* SECOND PURPLE SECTION */}

              <motion.section
                initial={{
                  opacity: 0,
                  x: 15,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[25px]
                  p-5
                  text-white

                  sm:p-6
                "
              >
                <PurpleAuroraBackground />

                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                      <CalendarClock className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-fuchsia-100/55">
                        Lifecycle
                      </p>

                      <h2 className="mt-0.5 font-black">
                        Payment timeline
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6">
                    {timeline.map(
                      (
                        item,
                        index
                      ) => (
                        <motion.div
                          key={
                            item.key
                          }
                          initial={{
                            opacity: 0,
                            x: 10,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{
                            delay:
                              index *
                              0.06,
                          }}
                          className="relative flex gap-4 pb-6 last:pb-0"
                        >
                          {index <
                            timeline.length -
                              1 && (
                            <div className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-white/15" />
                          )}

                          <motion.div
                            whileHover={{
                              scale: 1.12,
                            }}
                            className={`
                              relative
                              z-10
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border
                              backdrop-blur

                              ${
                                item.danger
                                  ? "border-red-200/20 bg-red-300/15 text-red-100"
                                  : item.completed
                                    ? "border-white/15 bg-white/15 text-fuchsia-100"
                                    : "border-white/10 bg-white/[0.06] text-white/45"
                              }
                            `}
                          >
                            {item.danger ? (
                              <XCircle className="h-4 w-4" />
                            ) : item.completed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Clock3 className="h-4 w-4" />
                            )}
                          </motion.div>

                          <div className="min-w-0">
                            <p className="text-sm font-black">
                              {
                                item.title
                              }
                            </p>

                            <p className="mt-1 text-xs leading-5 text-white/55">
                              {
                                item.description
                              }
                            </p>

                            <p className="mt-2 text-[10px] font-bold text-fuchsia-100/60">
                              {formatDate(
                                item.date
                              )}
                            </p>
                          </div>
                        </motion.div>
                      )
                    )}
                  </div>
                </div>
              </motion.section>

              {/* THIRD PURPLE SECTION */}

              <motion.section
                whileHover={{
                  y: -3,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[24px]
                  p-5
                  text-white
                "
              >
                <PurpleAuroraBackground />

                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                      <Layers3 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-fuchsia-100/55">
                        Merchant
                      </p>

                      <h2 className="mt-0.5 font-black">
                        Merchant account
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 divide-y divide-white/10">
                    {[
                      {
                        label:
                          "Business name",

                        value:
                          merchant.businessName ||
                          merchant.displayName ||
                          "Not available",
                      },

                      {
                        label:
                          "Merchant slug",

                        value:
                          merchant.slug ||
                          "Not available",
                      },

                      {
                        label:
                          "Account status",

                        value:
                          humanize(
                            merchant.status
                          ),
                      },

                      {
                        label:
                          "Verification",

                        value:
                          humanize(
                            merchant.verificationStatus
                          ),
                      },

                      {
                        label:
                          "Default currency",

                        value:
                          merchant.defaultCurrency ||
                          "Not available",
                      },
                    ].map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.label
                          }
                          className="py-3.5"
                        >
                          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-fuchsia-100/45">
                            {
                              item.label
                            }
                          </p>

                          <p className="mt-1 text-sm font-black">
                            {
                              item.value
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.section>

              {/* METADATA */}

              <motion.section
                whileHover={{
                  y: -3,
                }}
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  merchant-border
                  merchant-surface
                "
              >
                <div className="border-b border-violet-300/15 bg-violet-500/[0.035] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                      <Hash className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-violet-500">
                        Technical record
                      </p>

                      <h2 className="mt-0.5 font-black text-foreground">
                        Record metadata
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="px-5">
                  <DetailRow
                    label="Created at"
                    value={formatDate(
                      payment.createdAt
                    )}
                  />

                  <DetailRow
                    label="Last updated"
                    value={formatDate(
                      payment.updatedAt
                    )}
                  />

                  <DetailRow
                    label="Internal record ID"
                    value={
                      payment._id
                    }
                    mono
                    copy
                  />
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EXTERNAL URL
========================================================= */

function ExternalUrl({
  label,
  url,
}: {
  label:
    string;

  url:
    string;
}) {
  return (
    <motion.div
      whileHover={{
        x:
          3,
      }}
      className="
        rounded-xl
        border
        border-violet-300/20
        bg-violet-500/[0.025]
        p-4
        transition

        hover:bg-violet-500/[0.05]
      "
    >
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-500">
        {
          label
        }
      </p>

      <div className="mt-2 flex items-start justify-between gap-3">
        <p
          className="
            min-w-0
            flex-1
            overflow-x-auto
            scroll-smooth
            whitespace-nowrap
            font-mono
            text-xs
            leading-5
            text-foreground

            [scrollbar-width:none]
            [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {
            url
          }
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <CopyButton
            value={
              url
            }
          />

          <a
            href={
              url
            }
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex
              h-8
              items-center
              justify-center
              rounded-lg
              border
              border-violet-300/20
              bg-violet-500/[0.04]
              px-2.5
              text-violet-600
              transition

              hover:bg-violet-500/10
            "
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}