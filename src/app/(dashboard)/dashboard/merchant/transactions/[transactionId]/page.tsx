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
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  Copy,
  FileKey2,
  Hash,
  Layers3,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getMerchantTransactionDetail,
  type MerchantTransactionDirection,
  type MerchantTransactionStatus,
  type MerchantTransactionType,
} from "@/lib/api/merchantTransactionApi";

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  amount:
    number,

  currency =
    "BDT",
): string {
  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          2,
      },
    ).format(
      amount,
    );
  } catch {
    return `${currency} ${amount.toFixed(
      2,
    )}`;
  }
}

function formatDate(
  value:
    string | null | undefined,
): string {
  if (
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      second:
        "2-digit",
    },
  ).format(
    date,
  );
}

function humanize(
  value:
    string | null | undefined,
): string {
  if (
    !value
  ) {
    return "—";
  }

  return value
    .toLowerCase()
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
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

      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 left-[25%] h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
    </>
  );
}

/* =========================================================
   COPY
========================================================= */

function CopyButton({
  value,
}: {
  value:
    string | null | undefined;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(
      false,
    );

  if (
    !value
  ) {
    return null;
  }

  const copy =
    async () => {
      try {
        await navigator.clipboard.writeText(
          value,
        );

        setCopied(
          true,
        );

        window.setTimeout(
          () =>
            setCopied(
              false,
            ),
          1400,
        );
      } catch {
        setCopied(
          false,
        );
      }
    };

  return (
    <button
      type="button"
      onClick={
        copy
      }
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border merchant-border merchant-surface merchant-muted transition hover:border-violet-400/50 hover:text-violet-600"
      aria-label="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/* =========================================================
   ROW
========================================================= */

function DetailRow({
  label,
  value,
  mono =
    false,
  copyable =
    false,
}: {
  label:
    string;

  value:
    string | null | undefined;

  mono?:
    boolean;

  copyable?:
    boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b py-3.5 last:border-b-0 merchant-border sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs font-bold merchant-muted">
        {label}
      </span>

      <div className="flex min-w-0 items-start gap-2 sm:max-w-[68%] sm:justify-end">
        <span
          className={`min-w-0 break-words text-left text-sm font-bold leading-5 merchant-text [overflow-wrap:anywhere] sm:text-right ${
            mono
              ? "font-mono text-xs"
              : ""
          }`}
        >
          {value ||
            "—"}
        </span>

        {copyable ? (
          <CopyButton
            value={
              value
            }
          />
        ) : null}
      </div>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({
  title,
  description,
  icon:
    Icon,
  children,
  purple =
    false,
}: {
  title:
    string;

  description:
    string;

  icon:
    React.ElementType;

  children:
    React.ReactNode;

  purple?:
    boolean;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border merchant-border merchant-surface">
      <div
        className={`border-b px-5 py-4 merchant-border ${
          purple
            ? "text-white"
            : ""
        }`}
        style={
          purple
            ? {
                background:
                  "linear-gradient(132deg,#4C1D95 0%,#6D28D9 65%,#9333EA 100%)",
              }
            : undefined
        }
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              purple
                ? "border border-white/15 bg-white/10"
                : "bg-violet-500/10 text-violet-600"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2
              className={`break-words text-sm font-black leading-tight [overflow-wrap:anywhere] ${
                purple
                  ? "text-white"
                  : "merchant-text"
              }`}
            >
              {title}
            </h2>

            <p
              className={`mt-0.5 break-words text-xs leading-5 [overflow-wrap:anywhere] ${
                purple
                  ? "text-violet-100/75"
                  : "merchant-muted"
              }`}
            >
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   DIRECTION BADGE
========================================================= */

function DirectionBadge({
  direction,
}: {
  direction:
    MerchantTransactionDirection;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${
        direction ===
        "CREDIT"
          ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
          : "border-rose-200 bg-rose-500/10 text-rose-600"
      }`}
    >
      {direction ===
      "CREDIT" ? (
        <ArrowDownLeft className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpRight className="h-3.5 w-3.5" />
      )}

      {humanize(
        direction,
      )}
    </span>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status:
    MerchantTransactionStatus;
}) {
  if (
    status ===
    "REVERSED"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-600">
        <RotateCcw className="h-3.5 w-3.5" />
        Reversed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-500/10 px-3 py-1.5 text-xs font-black text-violet-600">
      <Check className="h-3.5 w-3.5" />
      Posted
    </span>
  );
}

/* =========================================================
   TYPE ICON
========================================================= */

function getTypeIcon(
  type:
    MerchantTransactionType,
) {
  switch (
    type
  ) {
    case "PAYMENT":
      return CircleDollarSign;

    case "REFUND":
      return RotateCcw;

    case "PAYOUT":
      return Send;

    case "REVERSAL":
      return RefreshCw;

    default:
      return Activity;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantTransactionDetailPage() {
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
        user.role,
      ),
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  const params =
    useParams();

  const transactionId =
    useMemo(
      () => {
        const raw =
          params?.transactionId;

        if (
          Array.isArray(
            raw,
          )
        ) {
          return raw[0] ??
            "";
        }

        return typeof raw ===
          "string"
          ? raw
          : "";
      },
      [
        params,
      ],
    );

  const [
    data,
    setData,
  ] =
    useState<
      Awaited<
        ReturnType<
          typeof getMerchantTransactionDetail
        >
      > | null
    >(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  /* =======================================================
     LOAD
  ======================================================== */

  const loadDetail =
    useCallback(
      async (
        fullLoader =
          true,
      ) => {
        if (!isMerchantRole) {
          setLoading(false);
          setRefreshing(false);
          setData(null);
          setError("");

          return;
        }

        if (
          !transactionId
        ) {
          setError(
            "Transaction ID is missing.",
          );

          setLoading(
            false,
          );

          return;
        }

        try {
          setError(
            "",
          );

          if (
            fullLoader
          ) {
            setLoading(
              true,
            );
          } else {
            setRefreshing(
              true,
            );
          }

          const result =
            await getMerchantTransactionDetail(
              transactionId,
            );

          setData(
            result,
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load transaction details.",
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        isMerchantRole,
        transactionId,
      ],
    );

  useEffect(
    () => {
      if (!isMerchantRole) {
        setLoading(false);

        return;
      }

      void loadDetail(
        true,
      );
    },
    [
      isMerchantRole,
      loadDetail,
    ],
  );

  /* =======================================================
     MERCHANT-ONLY REDIRECTING
  ======================================================== */

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
            Merchant transaction details are available only to merchant accounts.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     LOADING
  ======================================================== */

  if (
    loading
  ) {
    return (
      <main className="min-h-full merchant-surface-soft">
        <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse space-y-5">
            <div className="h-10 w-36 rounded-xl merchant-surface" />

            <div className="h-52 rounded-3xl bg-violet-500/20" />

            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({
                length:
                  4,
              }).map(
                (
                  _,
                  index,
                ) => (
                  <div
                    key={
                      index
                    }
                    className="h-28 rounded-2xl merchant-surface"
                  />
                ),
              )}
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <div className="h-96 rounded-2xl merchant-surface xl:col-span-2" />

              <div className="h-96 rounded-2xl merchant-surface" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================== */

  if (
    error ||
    !data
  ) {
    return (
      <main className="min-h-full merchant-surface-soft">
        <div className="mx-auto flex min-h-[60vh] max-w-[800px] items-center justify-center p-6">
          <div className="w-full rounded-2xl border p-7 text-center merchant-border merchant-surface">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl merchant-danger-soft merchant-danger">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="mt-4 text-lg font-black merchant-text">
              Unable to load transaction
            </h1>

            <p className="mt-2 break-words text-sm leading-6 merchant-muted [overflow-wrap:anywhere]">
              {error ||
                "Transaction not found."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard/merchant/transactions"
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold merchant-border merchant-text"
              >
                <ArrowLeft className="h-4 w-4" />
                Transactions
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (!isMerchantRole) {
                    return;
                  }

                  void loadDetail(
                    true,
                  );
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const {
    merchant,
    transaction,
    ledgerGroup,
  } =
    data;

  const TypeIcon =
    getTypeIcon(
      transaction.type,
    );

  const positive =
    transaction.balanceImpact >=
    0;

  /* =======================================================
     RELATED LINK
  ======================================================== */

  const relatedLink =
    transaction.refundId
      ? {
          label:
            "View refund",

          href:
            `/dashboard/merchant/refunds/${encodeURIComponent(
              transaction.refundId,
            )}`,
        }
      : transaction.payoutId
        ? {
            label:
              "View payout",

            href:
              `/dashboard/merchant/payouts/${encodeURIComponent(
                transaction.payoutId,
              )}`,
          }
        : transaction.paymentId
          ? {
              label:
                "View payment",

              href:
                `/dashboard/merchant/payments/${encodeURIComponent(
                  transaction.paymentId,
                )}`,
            }
          : null;

  return (
    <main className="min-h-full merchant-surface-soft">
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {/* TOP */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/merchant/transactions"
            className="inline-flex w-fit items-center gap-2 text-sm font-bold merchant-muted transition hover:text-violet-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to transactions
          </Link>

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() => {
              if (!isMerchantRole) {
                return;
              }

              void loadDetail(
                false,
              );
            }}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold merchant-border merchant-surface merchant-text disabled:opacity-50 sm:w-auto"
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
          </button>
        </div>

        {/* HERO */}

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
          className="relative mb-5 overflow-hidden rounded-[26px] border border-violet-400/20 p-6 text-white sm:p-7"
        >
          <PurpleAuroraBackground />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-violet-100">
                <TypeIcon className="h-3.5 w-3.5" />

                {humanize(
                  transaction.type,
                )}
              </div>

              <h1 className="mt-4 break-all font-mono text-xl font-black tracking-tight sm:text-2xl">
                {transaction.transactionId}
              </h1>

              <p className="mt-2 text-sm text-violet-100/80">
                Effective{" "}
                {formatDate(
                  transaction.effectiveAt,
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DirectionBadge
                direction={
                  transaction.direction
                }
              />

              <StatusBadge
                status={
                  transaction.status
                }
              />
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <div className="h-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.08] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                Amount
              </p>

              <p className="mt-2 break-words text-xl font-black leading-tight [overflow-wrap:anywhere]">
                {formatCurrency(
                  transaction.amount,
                  transaction.currency,
                )}
              </p>
            </div>

            <div className="h-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.08] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                Balance impact
              </p>

              <p
                className={`mt-2 break-words text-xl font-black leading-tight [overflow-wrap:anywhere] ${
                  positive
                    ? "text-emerald-300"
                    : "text-rose-300"
                }`}
              >
                {positive
                  ? "+"
                  : ""}
                {formatCurrency(
                  transaction.balanceImpact,
                  transaction.currency,
                )}
              </p>
            </div>

            <div className="h-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.08] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/70">
                Reference
              </p>

              <p className="mt-2 break-all font-mono text-sm font-black leading-5">
                {transaction.referenceId}
              </p>
            </div>
          </div>
        </motion.section>

        {/* SUMMARY */}

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="h-full min-w-0 overflow-hidden rounded-2xl border p-5 merchant-border merchant-surface">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wide merchant-muted">
              Amount
            </p>

            <p className="mt-1 break-words text-xl font-black leading-tight merchant-text [overflow-wrap:anywhere]">
              {formatCurrency(
                transaction.amount,
                transaction.currency,
              )}
            </p>
          </div>

          <div className="h-full min-w-0 overflow-hidden rounded-2xl border p-5 merchant-border merchant-surface">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                positive
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              {positive ? (
                <ArrowDownLeft className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wide merchant-muted">
              Balance impact
            </p>

            <p
              className={`mt-1 break-words text-xl font-black leading-tight [overflow-wrap:anywhere] ${
                positive
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {positive
                ? "+"
                : ""}
              {formatCurrency(
                transaction.balanceImpact,
                transaction.currency,
              )}
            </p>
          </div>

          <div className="h-full min-w-0 overflow-hidden rounded-2xl border p-5 merchant-border merchant-surface">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <WalletCards className="h-5 w-5" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wide merchant-muted">
              Direction
            </p>

            <div className="mt-2">
              <DirectionBadge
                direction={
                  transaction.direction
                }
              />
            </div>
          </div>

          <div className="h-full min-w-0 overflow-hidden rounded-2xl border p-5 merchant-border merchant-surface">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wide merchant-muted">
              Ledger status
            </p>

            <div className="mt-2">
              <StatusBadge
                status={
                  transaction.status
                }
              />
            </div>
          </div>
        </div>

        {/* MAIN */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <Section
              title="Transaction details"
              description="Financial ledger entry information"
              icon={Activity}
              purple
            >
              <DetailRow
                label="Transaction ID"
                value={
                  transaction.transactionId
                }
                mono
                copyable
              />

              <DetailRow
                label="Entry group ID"
                value={
                  transaction.entryGroupId
                }
                mono
                copyable
              />

              <DetailRow
                label="Type"
                value={humanize(
                  transaction.type,
                )}
              />

              <DetailRow
                label="Direction"
                value={humanize(
                  transaction.direction,
                )}
              />

              <DetailRow
                label="Amount"
                value={formatCurrency(
                  transaction.amount,
                  transaction.currency,
                )}
              />

              <DetailRow
                label="Balance impact"
                value={`${positive ? "+" : ""}${formatCurrency(
                  transaction.balanceImpact,
                  transaction.currency,
                )}`}
              />

              <DetailRow
                label="Currency"
                value={
                  transaction.currency
                }
              />

              <DetailRow
                label="Status"
                value={humanize(
                  transaction.status,
                )}
              />
            </Section>

            <Section
              title="Source references"
              description="Domain records connected to this ledger movement"
              icon={Hash}
            >
              <DetailRow
                label="Reference type"
                value={humanize(
                  transaction.referenceType,
                )}
              />

              <DetailRow
                label="Reference ID"
                value={
                  transaction.referenceId
                }
                mono
                copyable
              />

              <DetailRow
                label="Payment ID"
                value={
                  transaction.paymentId
                }
                mono
                copyable
              />

              <DetailRow
                label="Refund ID"
                value={
                  transaction.refundId
                }
                mono
                copyable
              />

              <DetailRow
                label="Payout ID"
                value={
                  transaction.payoutId
                }
                mono
                copyable
              />

              <DetailRow
                label="Merchant reference"
                value={
                  transaction.merchantReference
                }
                mono
                copyable
              />

              {relatedLink ? (
                <div className="py-4">
                  <Link
                    href={
                      relatedLink.href
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
                  >
                    {relatedLink.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </Section>

            <Section
              title="Ledger group"
              description="Merchant-side entries from the same financial posting"
              icon={Layers3}
              purple
            >
              <div className="py-5">
                <div className="space-y-3">
                  {ledgerGroup.entries.map(
                    (
                      entry,
                    ) => {
                      const entryPositive =
                        entry.balanceImpact >=
                        0;

                      return (
                        <div
                          key={
                            entry.transactionId
                          }
                          className="rounded-xl border p-4 merchant-border merchant-surface-soft"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="break-all font-mono text-xs font-black leading-5 merchant-text">
                                {entry.transactionId}
                              </p>

                              <p className="mt-1 text-xs merchant-muted">
                                {humanize(
                                  entry.referenceType,
                                )}
                                {" • "}
                                {formatDate(
                                  entry.effectiveAt,
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <DirectionBadge
                                direction={
                                  entry.direction
                                }
                              />

                              <p
                                className={`text-sm font-black ${
                                  entryPositive
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {entryPositive
                                  ? "+"
                                  : ""}
                                {formatCurrency(
                                  entry.balanceImpact,
                                  entry.currency,
                                )}
                              </p>
                            </div>
                          </div>

                          {entry.description ? (
                            <p className="mt-3 text-xs leading-5 merchant-muted">
                              {entry.description}
                            </p>
                          ) : null}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </Section>
          </div>

          <div className="space-y-5">
            <Section
              title="Merchant account"
              description="Owner of this financial activity"
              icon={ShieldCheck}
            >
              <DetailRow
                label="Business"
                value={
                  merchant.businessDisplayName ||
                  merchant.businessName
                }
              />

              <DetailRow
                label="Merchant ID"
                value={
                  merchant.id
                }
                mono
                copyable
              />

              <DetailRow
                label="Currency"
                value={
                  merchant.defaultCurrency
                }
              />

              <DetailRow
                label="Account status"
                value={humanize(
                  merchant.status,
                )}
              />

              <DetailRow
                label="Verification"
                value={humanize(
                  merchant.verificationStatus,
                )}
              />
            </Section>

            <Section
              title="Source context"
              description="Additional source information when available"
              icon={FileKey2}
            >
              <DetailRow
                label="Provider"
                value={
                  transaction.provider
                }
              />

              <DetailRow
                label="Source type"
                value={humanize(
                  transaction.sourceType,
                )}
              />

              <DetailRow
                label="Mode"
                value={humanize(
                  transaction.mode,
                )}
              />

              <DetailRow
                label="Source status"
                value={humanize(
                  transaction.sourceStatus,
                )}
              />

              <DetailRow
                label="Reversal"
                value={
                  transaction.isReversal
                    ? "Yes"
                    : "No"
                }
              />
            </Section>

            <Section
              title="Timestamps"
              description="Ledger posting and creation time"
              icon={Activity}
            >
              <DetailRow
                label="Effective at"
                value={formatDate(
                  transaction.effectiveAt,
                )}
              />

              <DetailRow
                label="Created at"
                value={formatDate(
                  transaction.createdAt,
                )}
              />
            </Section>

            {transaction.description ? (
              <section className="rounded-2xl border border-violet-300/30 bg-violet-500/[0.07] p-5">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-violet-600">
                  Ledger description
                </p>

                <p className="mt-3 text-sm leading-6 merchant-text">
                  {transaction.description}
                </p>
              </section>
            ) : null}
          </div>
        </div>

        {/* BOTTOM */}

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border p-4 merchant-border merchant-surface sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <TypeIcon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black merchant-text">
                {humanize(
                  transaction.type,
                )}
              </p>

              <p className="text-xs merchant-muted">
                {humanize(
                  transaction.referenceType,
                )}
                {" • "}
                {transaction.currency}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/merchant/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold merchant-border merchant-text transition hover:bg-violet-500/[0.06] hover:text-violet-600"
          >
            <ArrowLeft className="h-4 w-4" />
            All transactions
          </Link>
        </div>
      </div>
    </main>
  );
}