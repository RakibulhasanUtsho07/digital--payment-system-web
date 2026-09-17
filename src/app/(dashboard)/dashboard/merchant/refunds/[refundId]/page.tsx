"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Hash,
  Receipt,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  getMerchantRefund,
  type MerchantRefund,
} from "@/lib/api/merchantRefundApi";

/* =========================================================
   ANIMATION
========================================================= */

const heroContainer = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.55,

      ease: [
        0.22,
        1,
        0.36,
        1,
      ] as const,
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value?: string,
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatCompactDate(
  value?: string,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
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
    },
  ).format(date);
}

function formatMoney(
  value: string,
  currency: string,
): string {
  const amount =
    Number(value);

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )
      .format(
        Number.isFinite(amount)
          ? amount
          : 0,
      )
      .replace(
        /\u00A0/g,
        " ",
      );
  } catch {
    return `${currency} ${value}`;
  }
}

function shortId(
  value:
    | string
    | null
    | undefined,

  start = 12,
  end = 6,
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
    start,
  )}...${value.slice(
    -end,
  )}`;
}

function getMoneyTextClass(
  value: string,
): string {
  const length =
    value.length;

  if (
    length >= 24
  ) {
    return "text-lg sm:text-xl";
  }

  if (
    length >= 20
  ) {
    return "text-xl sm:text-2xl";
  }

  if (
    length >= 16
  ) {
    return "text-2xl sm:text-[1.8rem]";
  }

  return "text-3xl";
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
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl"
        animate={{
          x: [
            0,
            24,
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
        className="pointer-events-none absolute -bottom-36 left-[26%] h-80 w-80 rounded-full bg-violet-200/20 blur-3xl"
        animate={{
          x: [
            0,
            -18,
            0,
          ],

          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
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
          duration: 7,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
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
          value,
        );

        setCopied(true);

        window.setTimeout(
          () =>
            setCopied(false),
          1500,
        );
      } catch {
        setCopied(false);
      }
    };

  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.94,
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
            : "bg-violet-500/[0.07] merchant-text hover:bg-violet-500/[0.12] hover:text-violet-600"
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
              opacity: 0,
              scale: 0.85,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.85,
            }}
            className="inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />

            Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="inline-flex items-center gap-1.5"
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
        py-4

        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] merchant-muted">
          {label}
        </p>

        <p className="mt-1 break-all text-sm font-semibold merchant-text">
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
        />
      ) : null}
    </div>
  );
}

/* =========================================================
   PURPLE DETAIL ROW
========================================================= */

function PurpleDetailRow({
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
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/65">
          {label}
        </p>

        <p className="mt-1 break-all text-sm font-bold text-white">
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
   PAGE
========================================================= */

export default function MerchantRefundDetailsPage() {
  const params =
    useParams();

  const rawRefundId =
    params?.refundId;

  const refundId =
    Array.isArray(
      rawRefundId,
    )
      ? rawRefundId[0]
      : typeof rawRefundId ===
          "string"
        ? rawRefundId
        : "";

  const [
    refund,
    setRefund,
  ] =
    useState<
      MerchantRefund | null
    >(null);

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
    error,
    setError,
  ] =
    useState("");

  const loadRefund =
    useCallback(
      async (
        silent = false,
      ) => {
        if (!refundId) {
          setError(
            "Refund ID is required.",
          );

          setLoading(false);
          return;
        }

        try {
          setError("");

          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await getMerchantRefund(
              refundId,
            );

          setRefund(
            response.refund,
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load refund.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        refundId,
      ],
    );

  useEffect(
    () => {
      void loadRefund();
    },
    [
      loadRefund,
    ],
  );

  /* =======================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <main className="merchant-theme min-h-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] space-y-6">
          <div className="h-64 animate-pulse rounded-[30px] bg-violet-500/[0.07]" />

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[420px] animate-pulse rounded-[28px] bg-violet-500/[0.04]" />

            <div className="space-y-6">
              <div className="h-44 animate-pulse rounded-[28px] bg-violet-500/[0.05]" />

              <div className="h-64 animate-pulse rounded-[28px] bg-violet-500/[0.04]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================== */

  if (!refund) {
    return (
      <main className="merchant-theme flex min-h-[520px] items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-[28px] bg-white/75 p-6 text-center shadow-[0_18px_50px_rgba(109,40,217,0.07)] dark:bg-slate-950/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-lg font-black merchant-text">
            Refund unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 merchant-muted">
            {error ||
              "The refund could not be found."}
          </p>

          <Link
            href="/dashboard/merchant/refunds"
            className="
              mt-6
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
              transition

              hover:bg-violet-500/[0.12]
              hover:text-violet-600
            "
          >
            <ArrowLeft className="h-4 w-4" />

            Back to refunds
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     DERIVED
  ======================================================== */

  const StatusIcon =
    refund.status ===
    "completed"
      ? CheckCircle2
      : refund.status ===
          "pending"
        ? Clock3
        : XCircle;

  const statusClass =
    refund.status ===
    "completed"
      ? "merchant-status-success"
      : refund.status ===
          "pending"
        ? "merchant-status-warning"
        : "merchant-status-danger";

  const amountText =
    formatMoney(
      refund.amount,
      refund.currency,
    );

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    /*
     * Extra full-page merchant background removed.
     */
    <main className="merchant-theme relative z-0 isolate min-h-full">
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          {/* BACK */}

          <Link
            href="/dashboard/merchant/refunds"
            className="
              mb-5
              inline-flex
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

            Back to refunds
          </Link>

          {/* ERROR */}

          {error ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-rose-500/[0.055] p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 merchant-danger" />

              <div>
                <p className="text-sm font-bold merchant-text">
                  Refresh failed
                </p>

                <p className="mt-1 text-sm merchant-danger">
                  {error}
                </p>
              </div>
            </div>
          ) : null}

          {/* =================================================
              HERO
          ================================================= */}

          <motion.section
            variants={
              heroContainer
            }
            initial="hidden"
            animate="visible"
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
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 max-w-3xl">
                  <motion.div
                    variants={
                      heroItem
                    }
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${statusClass}`}
                    >
                      <StatusIcon className="h-4 w-4" />

                      {refund.status}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${
                        refund.mode ===
                        "live"
                          ? "merchant-mode-live"
                          : "merchant-mode-test"
                      }`}
                    >
                      {refund.mode}
                    </span>
                  </motion.div>

                  <motion.p
                    variants={
                      heroItem
                    }
                    className="mt-5 text-[11px] font-black uppercase tracking-[0.14em] text-violet-100/70"
                  >
                    Refund record
                  </motion.p>

                  <motion.h1
                    variants={
                      heroItem
                    }
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
                    {refund.refundId}
                  </motion.h1>

                  <motion.p
                    variants={
                      heroItem
                    }
                    className="mt-3 text-sm text-violet-100/80"
                  >
                    Refund linked to payment{" "}

                    <span className="font-mono font-bold text-white">
                      {shortId(
                        refund.paymentId,
                      )}
                    </span>
                  </motion.p>
                </div>

                <motion.button
                  variants={
                    heroItem
                  }
                  whileHover={{
                    y: -2,
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  type="button"
                  onClick={() =>
                    void loadRefund(
                      true,
                    )
                  }
                  disabled={
                    refreshing
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    self-start
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    text-sm
                    font-bold
                    text-white
                    backdrop-blur
                    transition

                    hover:bg-white/15

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <RefreshCcw
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

              <motion.div
                variants={
                  heroItem
                }
                className="mt-6 grid gap-3 sm:grid-cols-3"
              >
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    Refunded amount
                  </p>

                  <p
                    className={`
                      mt-1
                      whitespace-nowrap
                      font-black
                      tracking-tight
                      tabular-nums

                      ${getMoneyTextClass(
                        amountText,
                      )}
                    `}
                  >
                    {amountText}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    Currency
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {refund.currency}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {formatCompactDate(
                      refund.createdAt,
                    )}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* LEFT */}

            <div className="space-y-6">
              {/* REFUND INFO */}

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
                  duration: 0.45,
                  delay: 0.06,
                }}
                className="
                  overflow-hidden
                  rounded-[28px]
                  bg-white/70
                  p-5
                  shadow-[0_10px_30px_rgba(109,40,217,0.04)]

                  dark:bg-slate-950/45
                "
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                    <Receipt className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black merchant-text">
                      Refund information
                    </h2>

                    <p className="mt-0.5 text-xs merchant-muted">
                      Core identifiers and customer refund context
                    </p>
                  </div>
                </div>

                <DetailRow
                  label="Refund ID"
                  value={
                    refund.refundId
                  }
                  copy
                />

                <DetailRow
                  label="Payment ID"
                  value={
                    refund.paymentId
                  }
                  copy
                />

                <DetailRow
                  label="Customer ID"
                  value={
                    refund.customerId
                  }
                  copy
                />

                <DetailRow
                  label="Merchant reference"
                  value={
                    refund.merchantReference ||
                    "Not available"
                  }
                />

                <DetailRow
                  label="Reason"
                  value={
                    refund.reason ||
                    "No reason supplied"
                  }
                />
              </motion.section>

              {/* =================================================
                  PURPLE SECTION 2 — LEDGER
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
                transition={{
                  duration: 0.45,
                  delay: 0.1,
                }}
                whileHover={{
                  y: -2,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  p-5
                  text-white
                  shadow-[0_18px_45px_rgba(109,40,217,0.16)]
                "
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <motion.div
                  className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl"
                  animate={{
                    scale: [
                      1,
                      1.12,
                      1,
                    ],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                  }}
                />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black">
                        Ledger information
                      </h2>

                      <p className="mt-1 text-xs text-violet-100/75">
                        Financial traceability and refund environment
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                      <Hash className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <PurpleDetailRow
                      label="Ledger group"
                      value={
                        refund.ledgerEntryGroupId ||
                        "Not available"
                      }
                      copy={
                        Boolean(
                          refund.ledgerEntryGroupId,
                        )
                      }
                    />

                    <PurpleDetailRow
                      label="Environment"
                      value={
                        refund.mode
                      }
                    />

                    <PurpleDetailRow
                      label="Currency"
                      value={
                        refund.currency
                      }
                    />
                  </div>
                </div>
              </motion.section>
            </div>

            {/* RIGHT */}

            <div className="space-y-6">
              {/* AMOUNT */}

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
                  duration: 0.45,
                  delay: 0.08,
                }}
                whileHover={{
                  y: -3,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  bg-white/75
                  p-6
                  shadow-[0_12px_34px_rgba(109,40,217,0.05)]

                  dark:bg-slate-950/50
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] merchant-muted">
                      Refunded amount
                    </p>

                    <p
                      title={
                        amountText
                      }
                      className={`
                        mt-3
                        whitespace-nowrap
                        font-black
                        leading-none
                        tracking-[-0.035em]
                        merchant-text
                        tabular-nums

                        ${getMoneyTextClass(
                          amountText,
                        )}
                      `}
                    >
                      {amountText}
                    </p>

                    <p className="mt-4 text-xs leading-5 merchant-muted">
                      Amount returned to the customer for this refund.
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/[0.09] text-violet-600">
                    <WalletCards className="h-6 w-6" />
                  </div>
                </div>
              </motion.section>

              {/* =================================================
                  PURPLE SECTION 3 — TIMELINE
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
                transition={{
                  duration: 0.45,
                  delay: 0.14,
                }}
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  p-5
                  text-white
                  shadow-[0_18px_45px_rgba(109,40,217,0.16)]
                "
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <motion.div
                  className="pointer-events-none absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-white/10 blur-2xl"
                  animate={{
                    scale: [
                      1,
                      1.12,
                      1,
                    ],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                  }}
                />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black">
                        Refund timeline
                      </h2>

                      <p className="mt-1 text-xs text-violet-100/75">
                        Lifecycle timestamps for this refund
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>

                  <TimelineItem
                    icon={
                      Receipt
                    }
                    label="Created"
                    value={
                      formatDate(
                        refund.createdAt,
                      )
                    }
                    active
                  />

                  <TimelineItem
                    icon={
                      CheckCircle2
                    }
                    label="Completed"
                    value={
                      formatDate(
                        refund.completedAt,
                      )
                    }
                    active={
                      Boolean(
                        refund.completedAt,
                      )
                    }
                  />

                  <TimelineItem
                    icon={
                      RefreshCcw
                    }
                    label="Last updated"
                    value={
                      formatDate(
                        refund.updatedAt,
                      )
                    }
                    active
                    last
                  />
                </div>
              </motion.section>

              {/* PAYMENT CTA */}

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.18,
                }}
              >
                <Link
                  href={`/dashboard/merchant/payments/${encodeURIComponent(
                    refund.paymentId,
                  )}`}
                  className="
                    group
                    flex
                    h-12
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    px-4
                    text-sm
                    font-black
                    text-white
                    merchant-gradient
                    transition

                    hover:opacity-95
                  "
                >
                  View original payment

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>

              {/* STATUS NOTE */}

              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  delay: 0.22,
                }}
                className="
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  bg-violet-500/[0.045]
                  p-4
                "
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-bold merchant-text">
                    Refund traceability
                  </p>

                  <p className="mt-1 text-xs leading-5 merchant-muted">
                    Payment, customer and ledger references are retained so
                    the refund can be reconciled with merchant financial
                    activity.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   TIMELINE
========================================================= */

function TimelineItem({
  icon:
    Icon,
  label,
  value,
  active = false,
  last = false,
}: {
  icon:
    React.ComponentType<{
      className?:
        string;
    }>;

  label: string;
  value: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last ? (
        <div className="absolute left-[17px] top-9 h-[calc(100%-14px)] w-px bg-white/15" />
      ) : null}

      <div
        className={`
          relative
          z-[1]
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl

          ${
            active
              ? "bg-white/15 text-white"
              : "bg-white/[0.06] text-white/45"
          }
        `}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 pb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/60">
          {label}
        </p>

        <p
          className={`mt-1 text-sm font-bold ${
            active
              ? "text-white"
              : "text-white/50"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}