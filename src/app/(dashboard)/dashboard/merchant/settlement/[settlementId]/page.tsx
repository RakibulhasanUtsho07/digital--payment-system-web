"use client";

import React, {
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
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  DollarSign,
  FileText,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  getMerchantSettlementDetail,
  type MerchantSettlement,
  type MerchantSettlementPayment,
  type MerchantSettlementReconciliation,
  type MerchantSettlementRefund,
  type MerchantSettlementStatus,
} from "@/lib/api/merchantSettlementApi";

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

function formatDate(
  value:
    | string
    | Date
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

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
  ).format(date);
}

function formatCompactDate(
  value:
    | string
    | Date
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
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(date);
}

function formatPeriod(
  start: string,
  end: string
): string {
  return `${formatCompactDate(
    start
  )} – ${formatCompactDate(
    end
  )}`;
}

function shortId(
  value:
    | string
    | null
    | undefined,

  start = 12,
  end = 6
): string {
  if (!value) {
    return "—";
  }

  if (
    value.length <=
    start +
      end +
      3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start
  )}...${value.slice(
    -end
  )}`;
}

function getStatusMeta(
  status:
    MerchantSettlementStatus
) {
  switch (status) {
    case "settled":
      return {
        label:
          "Settled",

        icon:
          CheckCircle2,

        badgeClass:
          "bg-emerald-400/15 text-emerald-100",
      };

    case "processing":
      return {
        label:
          "Processing",

        icon:
          RefreshCw,

        badgeClass:
          "bg-sky-400/15 text-sky-100",
      };

    case "failed":
      return {
        label:
          "Failed",

        icon:
          XCircle,

        badgeClass:
          "bg-rose-400/15 text-rose-100",
      };

    case "cancelled":
      return {
        label:
          "Cancelled",

        icon:
          XCircle,

        badgeClass:
          "bg-white/10 text-white/75",
      };

    default:
      return {
        label:
          "Pending",

        icon:
          Clock3,

        badgeClass:
          "bg-amber-300/15 text-amber-100",
      };
  }
}

/* =========================================================
   PURPLE AURORA
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
          duration:
            11,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -bottom-40
          left-[25%]
          h-80
          w-80
          rounded-full
          bg-violet-200/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            -20,
            0,
          ],

          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration:
            13,

          repeat:
            Infinity,

          ease:
            "easeInOut",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          inset-y-[-35%]
          left-[-20%]
          w-[18%]
          rotate-[14deg]
          bg-white/[0.055]
          blur-xl
        "
        animate={{
          x: [
            "0%",
            "760%",
          ],
        }}
        transition={{
          duration:
            7,

          repeat:
            Infinity,

          repeatDelay:
            4,

          ease:
            "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   COPY BUTTON
========================================================= */

function CopyButton({
  value,
  inverse = false,
}: {
  value: string;
  inverse?: boolean;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const copyValue =
    async () => {
      try {
        await navigator.clipboard.writeText(
          value
        );

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(false);
          },
          1400
        );
      } catch {
        setCopied(false);
      }
    };

  return (
    <motion.button
      type="button"
      whileTap={{
        scale:
          0.94,
      }}
      onClick={() =>
        void copyValue()
      }
      className={`
        inline-flex
        h-8
        shrink-0
        items-center
        gap-1.5
        rounded-lg
        px-2.5
        text-xs
        font-bold
        transition

        ${
          inverse
            ? "bg-white/10 text-white hover:bg-white/15"
            : "bg-violet-500/[0.07] text-violet-600 hover:bg-violet-500/[0.12]"
        }
      `}
    >
      <AnimatePresence
        mode="wait"
        initial={
          false
        }
      >
        {copied ? (
          <motion.span
            key="copied"
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            className="
              inline-flex
              items-center
              gap-1.5
            "
          >
            <CheckCircle2 className="h-3.5 w-3.5" />

            Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            className="
              inline-flex
              items-center
              gap-1.5
            "
          >
            <Copy className="h-3.5 w-3.5" />

            Copy
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  copyValue,
}: {
  label: string;

  value:
    React.ReactNode;

  copyValue?: string;
}) {
  return (
    <div
      className="
        flex
        flex-col
        gap-3
        py-4

        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-[10px]
            font-black
            uppercase
            tracking-[0.12em]
            merchant-muted
          "
        >
          {label}
        </p>

        <div
          className="
            mt-1
            break-all
            text-sm
            font-semibold
            merchant-text
          "
        >
          {value}
        </div>
      </div>

      {copyValue ? (
        <CopyButton
          value={
            copyValue
          }
        />
      ) : null}
    </div>
  );
}

/* =========================================================
   PURPLE INFO ROW
========================================================= */

function PurpleInfoRow({
  label,
  value,
  copy = false,
}: {
  label: string;

  value: string;

  copy?: boolean;
}) {
  return (
    <div
      className="
        flex
        flex-col
        gap-3
        rounded-2xl
        bg-white/[0.075]
        p-3.5

        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div className="min-w-0">
        <p
          className="
            text-[10px]
            font-black
            uppercase
            tracking-[0.12em]
            text-violet-100/65
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            break-all
            text-sm
            font-black
            text-white
          "
        >
          {value}
        </p>
      </div>

      {copy &&
      value !==
        "Not available" ? (
        <CopyButton
          value={
            value
          }
          inverse
        />
      ) : null}
    </div>
  );
}

/* =========================================================
   PAYMENT ROW
========================================================= */

function PaymentRow({
  payment,
}: {
  payment:
    MerchantSettlementPayment;
}) {
  return (
    <Link
      href={`/dashboard/merchant/payments/${encodeURIComponent(
        payment.paymentId
      )}`}
      className="
        block
        rounded-2xl
        bg-violet-500/[0.035]
        p-4
        transition

        hover:bg-violet-500/[0.065]
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4

          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="
                break-all
                font-mono
                text-xs
                font-black
                text-violet-600
              "
            >
              {
                payment.paymentId
              }
            </span>

            <span
              className="
                rounded-full
                bg-emerald-500/10
                px-2.5
                py-1
                text-[10px]
                font-bold
                text-emerald-600
              "
            >
              Completed
            </span>
          </div>

          <p className="mt-2 text-xs merchant-muted">
            {payment.provider}
            {" · "}
            {payment.sourceType}
            {" · "}
            {payment.mode}
          </p>

          {payment.merchantReference ? (
            <p className="mt-1 truncate text-xs merchant-muted">
              Reference:{" "}

              <span className="font-semibold merchant-text">
                {
                  payment.merchantReference
                }
              </span>
            </p>
          ) : null}
        </div>

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-4

            lg:text-right
          "
        >
          <div>
            <p
              className="
                whitespace-nowrap
                text-sm
                font-black
                merchant-text
              "
            >
              {formatMoney(
                payment.amount,
                payment.currency
              )}
            </p>

            <p className="mt-1 text-[11px] merchant-muted">
              {formatDate(
                payment.completedAt
              )}
            </p>
          </div>

          <ArrowRight className="h-4 w-4 text-violet-500" />
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   REFUND ROW
========================================================= */

function RefundRow({
  refund,
}: {
  refund:
    MerchantSettlementRefund;
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-rose-500/[0.04]
        p-4
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4

          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="
                break-all
                font-mono
                text-xs
                font-black
                merchant-text
              "
            >
              {
                refund.refundId
              }
            </span>

            <span
              className="
                rounded-full
                bg-rose-500/10
                px-2.5
                py-1
                text-[10px]
                font-bold
                text-rose-600
              "
            >
              Refund
            </span>

            <span
              className="
                rounded-full
                bg-emerald-500/10
                px-2.5
                py-1
                text-[10px]
                font-bold
                text-emerald-600
              "
            >
              {
                refund.status
              }
            </span>
          </div>

          <p className="mt-2 text-xs merchant-muted">
            Payment:{" "}

            <Link
              href={`/dashboard/merchant/payments/${encodeURIComponent(
                refund.paymentId
              )}`}
              className="
                font-semibold
                text-violet-600

                hover:underline
              "
            >
              {shortId(
                refund.paymentId
              )}
            </Link>

            {" · "}

            {refund.mode}
          </p>

          {refund.reason ? (
            <p className="mt-1 text-xs merchant-muted">
              {
                refund.reason
              }
            </p>
          ) : null}
        </div>

        <div className="shrink-0 lg:text-right">
          <p
            className="
              whitespace-nowrap
              text-base
              font-black
              text-rose-600
            "
          >
            −{" "}
            {formatMoney(
              refund.amount,
              refund.currency
            )}
          </p>

          <p className="mt-1 text-[11px] merchant-muted">
            Allocated{" "}

            {formatDate(
              refund.settledAt
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon:
    Icon,
  delay = 0,
}: {
  label: string;

  value: string;

  icon:
    React.ComponentType<{
      className?: string;
    }>;

  delay?: number;
}) {
  return (
    <motion.article
      initial={{
        opacity:
          0,

        y:
          12,
      }}
      animate={{
        opacity:
          1,

        y:
          0,
      }}
      transition={{
        duration:
          0.45,

        delay,
      }}
      whileHover={{
        y:
          -3,
      }}
      className="
        min-w-0
        rounded-[24px]
        bg-white/80
        p-5
        shadow-[0_10px_30px_rgba(109,40,217,0.04)]

        dark:bg-slate-950/50
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-[0.13em]
              merchant-muted
            "
          >
            {label}
          </p>

          <p
            title={
              value
            }
            className="
              mt-3
              whitespace-nowrap
              text-[clamp(1rem,1.6vw,1.55rem)]
              font-black
              leading-none
              tracking-[-0.035em]
              merchant-text
              tabular-nums
            "
          >
            {value}
          </p>
        </div>

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-violet-500/[0.08]
            text-violet-600
          "
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   CALCULATION ROW
========================================================= */

function CalculationRow({
  label,
  value,
  danger = false,
}: {
  label: string;

  value: string;

  danger?: boolean;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        rounded-xl
        px-1
        py-2
      "
    >
      <span className="text-sm merchant-muted">
        {label}
      </span>

      <span
        className={`
          whitespace-nowrap
          text-sm
          font-bold

          ${
            danger
              ? "text-rose-600"
              : "merchant-text"
          }
        `}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   LOADING STATE
========================================================= */

function LoadingState() {
  return (
    <div className="space-y-6">
      <div
        className="
          h-64
          animate-pulse
          rounded-[30px]
          bg-violet-500/[0.07]
        "
      />

      <div
        className="
          grid
          gap-6

          xl:grid-cols-[0.9fr_1.1fr]
        "
      >
        <div
          className="
            h-[500px]
            animate-pulse
            rounded-[28px]
            bg-violet-500/[0.04]
          "
        />

        <div
          className="
            h-[500px]
            animate-pulse
            rounded-[28px]
            bg-violet-500/[0.04]
          "
        />
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantSettlementDetailPage() {
  const params =
    useParams<{
      settlementId:
        | string
        | string[];
    }>();

  const router =
    useRouter();

  /* =======================================================
     ROUTE PARAM
  ======================================================== */

  const settlementId =
    useMemo(
      () => {
        const value =
          params?.settlementId;

        if (
          typeof value ===
          "string"
        ) {
          return value;
        }

        if (
          Array.isArray(
            value
          )
        ) {
          return (
            value[0] ||
            ""
          );
        }

        return "";
      },
      [
        params,
      ]
    );

  /* =======================================================
     DATA STATE
  ======================================================== */

  const [
    settlement,
    setSettlement,
  ] =
    useState<
      MerchantSettlement | null
    >(
      null
    );

  const [
    payments,
    setPayments,
  ] =
    useState<
      MerchantSettlementPayment[]
    >([]);

  const [
    refunds,
    setRefunds,
  ] =
    useState<
      MerchantSettlementRefund[]
    >([]);

  const [
    reconciliation,
    setReconciliation,
  ] =
    useState<
      MerchantSettlementReconciliation | null
    >(
      null
    );

  const [
    merchantName,
    setMerchantName,
  ] =
    useState(
      "Merchant"
    );

  /* =======================================================
     UI STATE
  ======================================================== */

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
     LOAD SETTLEMENT
  ======================================================== */

  const loadSettlement =
    useCallback(
      async (
        showRefresh = false
      ) => {
        if (
          !settlementId
        ) {
          setError(
            "Settlement ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          if (
            showRefresh
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
            await getMerchantSettlementDetail(
              settlementId
            );

          if (
            !response.success
          ) {
            throw new Error(
              response.message ||
                "Unable to load settlement."
            );
          }

          const data =
            response.data;

          setSettlement(
            data.settlement
          );

          setPayments(
            data.payments ??
              []
          );

          /*
           * Backend may expose refunds at:
           *
           * data.refunds
           *
           * OR
           *
           * data.settlement.refunds
           *
           * Both are supported by the shared API types.
           */
          setRefunds(
            data.refunds ??
              data.settlement
                .refunds ??
              []
          );

          /*
           * Same backwards-compatible support for
           * reconciliation.
           */
          setReconciliation(
            data.reconciliation ??
              data.settlement
                .reconciliation ??
              null
          );

          setMerchantName(
            data.merchant
              .businessDisplayName ||
              data.merchant
                .businessName ||
              "Merchant"
          );
        } catch (
          caughtError
        ) {
          setError(
            caughtError instanceof
              Error
              ? caughtError.message
              : "Unable to load settlement."
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
        settlementId,
      ]
    );

  useEffect(
    () => {
      void loadSettlement();
    },
    [
      loadSettlement,
    ]
  );

  /* =======================================================
     LOADING
  ======================================================== */

  if (
    loading &&
    !settlement
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
        <div className="mx-auto max-w-[1400px]">
          <LoadingState />
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================== */

  if (
    !settlement
  ) {
    return (
      <main
        className="
          merchant-theme
          flex
          min-h-[560px]
          items-center
          justify-center
          p-4
        "
      >
        <motion.div
          initial={{
            opacity:
              0,

            y:
              16,
          }}
          animate={{
            opacity:
              1,

            y:
              0,
          }}
          className="
            w-full
            max-w-xl
            rounded-[28px]
            bg-white/75
            p-6
            text-center
            shadow-[0_18px_50px_rgba(109,40,217,0.07)]

            dark:bg-slate-950/50
          "
        >
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-rose-500/10
              text-rose-600
            "
          >
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-lg font-black merchant-text">
            Unable to load settlement
          </h1>

          <p className="mt-2 text-sm leading-6 merchant-muted">
            {error ||
              "Settlement was not found."}
          </p>

          <div
            className="
              mt-6
              flex
              flex-col
              justify-center
              gap-3

              sm:flex-row
            "
          >
            <button
              type="button"
              onClick={() =>
                void loadSettlement()
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-600
                px-4
                py-2.5
                text-sm
                font-bold
                text-white
              "
            >
              <RefreshCw className="h-4 w-4" />

              Try again
            </button>

            <Link
              href="/dashboard/merchant/settlement"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-violet-500/[0.07]
                px-4
                py-2.5
                text-sm
                font-bold
                merchant-text
              "
            >
              <ArrowLeft className="h-4 w-4" />

              Back to settlements
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  /* =======================================================
     DERIVED
  ======================================================== */

  const statusMeta =
    getStatusMeta(
      settlement.status
    );

  const StatusIcon =
    statusMeta.icon;

  const refundTotal =
    reconciliation
      ?.refundAmount ??
    settlement.refundAmount;

  const refundCount =
    reconciliation
      ?.refundCount ??
    refunds.length;

  const paymentCount =
    reconciliation
      ?.paymentCount ??
    settlement.paymentCount;

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
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          {/* =================================================
              TOP ACTIONS
          ================================================= */}

          <div
            className="
              mb-5
              flex
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <Link
              href="/dashboard/merchant/settlement"
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                text-sm
                font-bold
                merchant-muted
                transition

                hover:text-violet-600
              "
            >
              <ArrowLeft className="h-4 w-4" />

              Back to settlements
            </Link>

            <motion.button
              whileHover={{
                y:
                  -1,
              }}
              whileTap={{
                scale:
                  0.97,
              }}
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadSettlement(
                  true
                )
              }
              className="
                inline-flex
                h-10
                w-fit
                items-center
                gap-2
                rounded-xl
                bg-violet-500/[0.07]
                px-4
                text-sm
                font-bold
                merchant-text
                transition

                hover:bg-violet-500/[0.12]
                hover:text-violet-600

                disabled:cursor-not-allowed
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

          {/* =================================================
              REFRESH ERROR
          ================================================= */}

          {error ? (
            <motion.div
              initial={{
                opacity:
                  0,

                y:
                  -4,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              className="
                mb-5
                flex
                items-start
                gap-3
                rounded-2xl
                bg-rose-500/[0.06]
                p-4
              "
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

              <div>
                <p className="text-sm font-black merchant-text">
                  Unable to refresh settlement
                </p>

                <p className="mt-1 text-sm text-rose-600">
                  {error}
                </p>
              </div>
            </motion.div>
          ) : null}

          {/* =================================================
              HERO
          ================================================= */}

          <motion.section
            initial={{
              opacity:
                0,

              y:
                14,
            }}
            animate={{
              opacity:
                1,

              y:
                0,
            }}
            transition={{
              duration:
                0.5,
            }}
            className="
              relative
              mb-6
              overflow-hidden
              rounded-[30px]
              px-5
              py-6
              text-white
              shadow-[0_20px_58px_rgba(76,29,149,0.18)]

              sm:px-7
              sm:py-7
            "
          >
            <PurpleAuroraBackground />

            <div className="relative">
              <div
                className="
                  flex
                  flex-col
                  gap-6

                  xl:flex-row
                  xl:items-start
                  xl:justify-between
                "
              >
                <div className="min-w-0 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="
                        rounded-full
                        border
                        border-white/15
                        bg-white/10
                        px-3
                        py-1.5
                        text-xs
                        font-bold
                        text-white
                      "
                    >
                      Settlement
                    </span>

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        px-3
                        py-1.5
                        text-xs
                        font-bold

                        ${statusMeta.badgeClass}
                      `}
                    >
                      <StatusIcon
                        className={`h-3.5 w-3.5 ${
                          settlement.status ===
                          "processing"
                            ? "animate-spin"
                            : ""
                        }`}
                      />

                      {
                        statusMeta.label
                      }
                    </span>
                  </div>

                  <p
                    className="
                      mt-5
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-violet-100/65
                    "
                  >
                    Settlement ID
                  </p>

                  <h1
                    className="
                      mt-2
                      break-all
                      font-mono
                      text-xl
                      font-black
                      tracking-tight

                      sm:text-2xl
                    "
                  >
                    {
                      settlement.settlementId
                    }
                  </h1>

                  <p
                    className="
                      mt-3
                      text-sm
                      leading-6
                      text-violet-100/80
                    "
                  >
                    Settlement period for{" "}

                    <span className="font-bold text-white">
                      {merchantName}
                    </span>

                    {" · "}

                    {formatPeriod(
                      settlement.periodStart,
                      settlement.periodEnd
                    )}
                  </p>
                </div>

                <div className="xl:text-right">
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-violet-100/65
                    "
                  >
                    Net settlement
                  </p>

                  <p
                    className="
                      mt-2
                      whitespace-nowrap
                      text-[clamp(1.4rem,3vw,2.4rem)]
                      font-black
                      tracking-[-0.04em]
                      tabular-nums
                    "
                  >
                    {formatMoney(
                      settlement.netAmount,
                      settlement.currency
                    )}
                  </p>

                  <p className="mt-2 text-xs text-violet-100/70">
                    {
                      settlement.paymentCount
                    }{" "}
                    payment records
                  </p>
                </div>
              </div>

              {/* HERO METRICS */}

              <div
                className="
                  mt-6
                  grid
                  gap-3

                  sm:grid-cols-3
                "
              >
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
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-violet-100/65
                    "
                  >
                    Gross amount
                  </p>

                  <p
                    className="
                      mt-1
                      whitespace-nowrap
                      text-lg
                      font-black
                      tabular-nums
                    "
                  >
                    {formatMoney(
                      settlement.grossAmount,
                      settlement.currency
                    )}
                  </p>
                </div>

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
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-violet-100/65
                    "
                  >
                    Platform fees
                  </p>

                  <p
                    className="
                      mt-1
                      whitespace-nowrap
                      text-lg
                      font-black
                      tabular-nums
                    "
                  >
                    {formatMoney(
                      settlement.feeAmount,
                      settlement.currency
                    )}
                  </p>
                </div>

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
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.12em]
                      text-violet-100/65
                    "
                  >
                    Refunds
                  </p>

                  <p
                    className="
                      mt-1
                      whitespace-nowrap
                      text-lg
                      font-black
                      tabular-nums
                    "
                  >
                    {formatMoney(
                      refundTotal,
                      settlement.currency
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <section
            className="
              mb-6
              grid
              gap-4

              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            <SummaryCard
              label="Gross amount"
              value={formatMoney(
                settlement.grossAmount,
                settlement.currency
              )}
              icon={
                DollarSign
              }
              delay={
                0.04
              }
            />

            <SummaryCard
              label="Platform fees"
              value={formatMoney(
                settlement.feeAmount,
                settlement.currency
              )}
              icon={
                WalletCards
              }
              delay={
                0.08
              }
            />

            <SummaryCard
              label="Refunds"
              value={formatMoney(
                refundTotal,
                settlement.currency
              )}
              icon={
                RefreshCw
              }
              delay={
                0.12
              }
            />

            <SummaryCard
              label="Net amount"
              value={formatMoney(
                settlement.netAmount,
                settlement.currency
              )}
              icon={
                CheckCircle2
              }
              delay={
                0.16
              }
            />
          </section>

          {/* =================================================
              RECONCILIATION
          ================================================= */}

          <motion.section
            initial={{
              opacity:
                0,

              y:
                12,
            }}
            animate={{
              opacity:
                1,

              y:
                0,
            }}
            transition={{
              delay:
                0.06,
            }}
            className="
              relative
              mb-6
              overflow-hidden
              rounded-[28px]
              p-5
              text-white
              shadow-[0_18px_45px_rgba(109,40,217,0.16)]

              sm:p-6
            "
            style={{
              background:
                "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
            }}
          >
            <motion.div
              className="
                pointer-events-none
                absolute
                -right-14
                -top-16
                h-40
                w-40
                rounded-full
                bg-white/10
                blur-2xl
              "
              animate={{
                scale: [
                  1,
                  1.12,
                  1,
                ],
              }}
              transition={{
                duration:
                  8,

                repeat:
                  Infinity,
              }}
            />

            <div className="relative">
              <div
                className="
                  flex
                  flex-col
                  gap-4

                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-violet-100/65
                    "
                  >
                    Financial reconciliation
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Settlement reconciliation
                  </h2>

                  <p className="mt-1 text-xs text-violet-100/75">
                    Payments and completed refunds allocated to this
                    settlement.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="
                      rounded-full
                      bg-white/10
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                    "
                  >
                    {
                      paymentCount
                    }{" "}
                    payments
                  </span>

                  <span
                    className="
                      rounded-full
                      bg-white/10
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                    "
                  >
                    {
                      refundCount
                    }{" "}
                    refunds
                  </span>

                  <span
                    className="
                      rounded-full
                      bg-emerald-400/15
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                      text-emerald-100
                    "
                  >
                    {reconciliation
                      ?.status ||
                      "Reconciled"}
                  </span>
                </div>
              </div>

              <div
                className="
                  mt-5
                  grid
                  gap-3

                  md:grid-cols-4
                "
              >
                <PurpleInfoRow
                  label="Payments"
                  value={String(
                    paymentCount
                  )}
                />

                <PurpleInfoRow
                  label="Refunds"
                  value={String(
                    refundCount
                  )}
                />

                <PurpleInfoRow
                  label="Refund amount"
                  value={formatMoney(
                    refundTotal,
                    settlement.currency
                  )}
                />

                <PurpleInfoRow
                  label="Net settlement"
                  value={formatMoney(
                    settlement.netAmount,
                    settlement.currency
                  )}
                />
              </div>
            </div>
          </motion.section>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div
            className="
              grid
              gap-6

              xl:grid-cols-[0.9fr_1.1fr]
            "
          >
            {/* =================================================
                LEFT
            ================================================= */}

            <div className="space-y-6">
              {/* INFORMATION */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    10,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.08,
                }}
                className="
                  rounded-[28px]
                  bg-white/70
                  p-5
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div className="mb-2">
                  <h2 className="text-base font-black merchant-text">
                    Settlement information
                  </h2>

                  <p className="mt-1 text-xs merchant-muted">
                    Core settlement identifiers and period details
                  </p>
                </div>

                <DetailRow
                  label="Settlement ID"
                  value={
                    settlement.settlementId
                  }
                  copyValue={
                    settlement.settlementId
                  }
                />

                <DetailRow
                  label="Settlement period"
                  value={formatPeriod(
                    settlement.periodStart,
                    settlement.periodEnd
                  )}
                />

                <DetailRow
                  label="Currency"
                  value={
                    settlement.currency
                  }
                />

                <DetailRow
                  label="Included payments"
                  value={String(
                    settlement.paymentCount
                  )}
                />

                <DetailRow
                  label="Created"
                  value={formatDate(
                    settlement.createdAt
                  )}
                />

                <DetailRow
                  label="Settled at"
                  value={formatDate(
                    settlement.settledAt
                  )}
                />
              </motion.section>

              {/* =================================================
                  CALCULATION
              ================================================= */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    10,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.12,
                }}
                className="
                  rounded-[28px]
                  bg-white/70
                  p-5
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <h2 className="text-base font-black merchant-text">
                  Settlement calculation
                </h2>

                <p className="mt-1 text-xs merchant-muted">
                  How the merchant net settlement was calculated
                </p>

                <div className="mt-5 space-y-3">
                  <CalculationRow
                    label="Gross payment volume"
                    value={formatMoney(
                      settlement.grossAmount,
                      settlement.currency
                    )}
                  />

                  <CalculationRow
                    label="Platform fees"
                    value={`− ${formatMoney(
                      settlement.feeAmount,
                      settlement.currency
                    )}`}
                  />

                  <CalculationRow
                    label="Refund adjustments"
                    value={`− ${formatMoney(
                      refundTotal,
                      settlement.currency
                    )}`}
                    danger
                  />

                  <CalculationRow
                    label="Other adjustments"
                    value={`${
                      settlement.adjustmentAmount >=
                      0
                        ? "+"
                        : "−"
                    } ${formatMoney(
                      Math.abs(
                        settlement.adjustmentAmount
                      ),
                      settlement.currency
                    )}`}
                  />

                  <div
                    className={`
                      mt-4
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-2xl
                      p-4

                      ${
                        settlement.netAmount <
                        0
                          ? "bg-rose-500/[0.07]"
                          : "bg-emerald-500/[0.07]"
                      }
                    `}
                  >
                    <span className="text-sm font-black merchant-text">
                      Net settlement
                    </span>

                    <span
                      className={`
                        whitespace-nowrap
                        text-lg
                        font-black

                        ${
                          settlement.netAmount <
                          0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }
                      `}
                    >
                      {formatMoney(
                        settlement.netAmount,
                        settlement.currency
                      )}
                    </span>
                  </div>
                </div>
              </motion.section>

              {/* =================================================
                  PAYOUT
              ================================================= */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    10,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.16,
                }}
                className="
                  rounded-[28px]
                  bg-white/70
                  p-5
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black merchant-text">
                      Payout reference
                    </h2>

                    <p className="mt-1 text-xs merchant-muted">
                      Payout associated with this settlement
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-2xl
                      bg-violet-500/[0.08]
                      text-violet-600
                    "
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div
                  className="
                    mt-5
                    rounded-2xl
                    bg-violet-500/[0.04]
                    p-4
                  "
                >
                  {settlement.payoutId ? (
                    <Link
                      href={`/dashboard/merchant/payouts/${encodeURIComponent(
                        settlement.payoutId
                      )}`}
                      className="
                        group
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >
                      <div className="min-w-0">
                        <p
                          className="
                            text-[10px]
                            font-black
                            uppercase
                            tracking-wider
                            merchant-muted
                          "
                        >
                          Payout ID
                        </p>

                        <p
                          className="
                            mt-1
                            break-all
                            font-mono
                            text-xs
                            font-black
                            text-violet-600
                          "
                        >
                          {
                            settlement.payoutId
                          }
                        </p>
                      </div>

                      <ArrowRight
                        className="
                          h-4
                          w-4
                          shrink-0
                          text-violet-600
                          transition-transform

                          group-hover:translate-x-1
                        "
                      />
                    </Link>
                  ) : (
                    <div>
                      <p
                        className="
                          text-[10px]
                          font-black
                          uppercase
                          tracking-wider
                          merchant-muted
                        "
                      >
                        Payout
                      </p>

                      <p className="mt-1 text-sm font-bold merchant-text">
                        No payout linked
                      </p>
                    </div>
                  )}
                </div>

                {settlement.note ? (
                  <div
                    className="
                      mt-3
                      rounded-2xl
                      bg-violet-500/[0.04]
                      p-4
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-wider
                        merchant-muted
                      "
                    >
                      Note
                    </p>

                    <p className="mt-2 text-sm leading-6 merchant-text">
                      {
                        settlement.note
                      }
                    </p>
                  </div>
                ) : null}

                {settlement.failureReason ? (
                  <div
                    className="
                      mt-3
                      rounded-2xl
                      bg-rose-500/[0.06]
                      p-4
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-wider
                        text-rose-600
                      "
                    >
                      Failure reason
                    </p>

                    <p className="mt-2 text-sm leading-6 merchant-text">
                      {
                        settlement.failureReason
                      }
                    </p>
                  </div>
                ) : null}
              </motion.section>
            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <div className="space-y-6">
              {/* =================================================
                  LIFECYCLE
              ================================================= */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    10,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.1,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  p-5
                  text-white
                  shadow-[0_18px_45px_rgba(109,40,217,0.16)]

                  sm:p-6
                "
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <motion.div
                  className="
                    pointer-events-none
                    absolute
                    -bottom-14
                    -right-12
                    h-40
                    w-40
                    rounded-full
                    bg-white/10
                    blur-2xl
                  "
                  animate={{
                    scale: [
                      1,
                      1.12,
                      1,
                    ],
                  }}
                  transition={{
                    duration:
                      9,

                    repeat:
                      Infinity,
                  }}
                />

                <div className="relative">
                  <div
                    className="
                      mb-6
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.14em]
                          text-violet-100/65
                        "
                      >
                        Settlement lifecycle
                      </p>

                      <h2 className="mt-1 text-lg font-black">
                        Current status
                      </h2>
                    </div>

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-white/15
                        bg-white/10
                      "
                    >
                      <StatusIcon
                        className={`h-5 w-5 ${
                          settlement.status ===
                          "processing"
                            ? "animate-spin"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      bg-white/[0.08]
                      p-4
                    "
                  >
                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        px-3
                        py-1.5
                        text-xs
                        font-black

                        ${statusMeta.badgeClass}
                      `}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />

                      {
                        statusMeta.label
                      }
                    </span>

                    <p className="mt-3 text-sm leading-6 text-violet-100/80">
                      {settlement.status ===
                      "settled"
                        ? "This settlement has been successfully completed."
                        : settlement.status ===
                            "processing"
                          ? "This settlement is currently being processed."
                          : settlement.status ===
                              "pending"
                            ? "This settlement is waiting to be processed."
                            : settlement.status ===
                                "failed"
                              ? "This settlement could not be completed."
                              : "This settlement has been cancelled."}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <PurpleInfoRow
                      label="Created"
                      value={formatDate(
                        settlement.createdAt
                      )}
                    />

                    <PurpleInfoRow
                      label="Period end"
                      value={formatDate(
                        settlement.periodEnd
                      )}
                    />

                    <PurpleInfoRow
                      label="Settled"
                      value={formatDate(
                        settlement.settledAt
                      )}
                    />

                    <PurpleInfoRow
                      label="Last updated"
                      value={formatDate(
                        settlement.updatedAt
                      )}
                    />
                  </div>
                </div>
              </motion.section>

              {/* =================================================
                  PAYMENTS
              ================================================= */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    10,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.14,
                }}
                className="
                  overflow-hidden
                  rounded-[28px]
                  bg-white/70
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    px-5
                    py-4

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>
                    <h2 className="text-base font-black merchant-text">
                      Included payments
                    </h2>

                    <p className="mt-1 text-xs merchant-muted">
                      Completed payments contributing to this settlement
                    </p>
                  </div>

                  <span
                    className="
                      w-fit
                      rounded-full
                      bg-violet-500/[0.08]
                      px-3
                      py-1.5
                      text-xs
                      font-black
                      text-violet-600
                    "
                  >
                    {
                      payments.length
                    }
                  </span>
                </div>

                {payments.length ===
                0 ? (
                  <div className="px-5 py-12 text-center">
                    <div
                      className="
                        mx-auto
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-violet-500/[0.07]
                        text-violet-500
                      "
                    >
                      <WalletCards className="h-6 w-6" />
                    </div>

                    <p className="mt-3 text-sm font-black merchant-text">
                      No payment records
                    </p>

                    <p className="mt-1 text-xs merchant-muted">
                      No completed payments were returned for this
                      settlement.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 px-4 pb-4">
                    {payments.map(
                      (
                        payment
                      ) => (
                        <PaymentRow
                          key={
                            payment.paymentId
                          }
                          payment={
                            payment
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </motion.section>

              {/* =================================================
                  REFUNDS
              ================================================= */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    10,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.18,
                }}
                className="
                  overflow-hidden
                  rounded-[28px]
                  bg-white/70
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    px-5
                    py-4

                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>
                    <h2 className="text-base font-black merchant-text">
                      Refund reconciliation
                    </h2>

                    <p className="mt-1 text-xs merchant-muted">
                      Completed refunds allocated against this settlement
                    </p>
                  </div>

                  <span
                    className="
                      w-fit
                      rounded-full
                      bg-rose-500/[0.08]
                      px-3
                      py-1.5
                      text-xs
                      font-black
                      text-rose-600
                    "
                  >
                    {
                      refundCount
                    }
                  </span>
                </div>

                {refunds.length ===
                0 ? (
                  <div className="px-5 py-12 text-center">
                    <div
                      className="
                        mx-auto
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-rose-500/[0.06]
                        text-rose-500
                      "
                    >
                      <RefreshCw className="h-6 w-6" />
                    </div>

                    <p className="mt-3 text-sm font-black merchant-text">
                      No refunds allocated
                    </p>

                    <p className="mt-1 text-xs merchant-muted">
                      This settlement has no completed refunds attached.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 px-4 pb-4">
                    {refunds.map(
                      (
                        refund
                      ) => (
                        <RefundRow
                          key={
                            refund.refundId
                          }
                          refund={
                            refund
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </motion.section>

              {/* =================================================
                  TRACEABILITY
              ================================================= */}

              <motion.section
                initial={{
                  opacity:
                    0,

                  y:
                    8,
                }}
                animate={{
                  opacity:
                    1,

                  y:
                    0,
                }}
                transition={{
                  delay:
                    0.22,
                }}
                className="
                  flex
                  items-start
                  gap-3
                  rounded-[24px]
                  bg-violet-500/[0.045]
                  p-4
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
                    bg-violet-500/[0.08]
                    text-violet-600
                  "
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-black merchant-text">
                    Settlement traceability
                  </p>

                  <p className="mt-1 text-xs leading-5 merchant-muted">
                    Settlement, payment, refund and payout references
                    remain linked for merchant reconciliation and
                    financial audit history.
                  </p>
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}