"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

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
  UserRound,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

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
   HELPERS
========================================================= */

function getDecimalNumber(
  value: DecimalValue | undefined
): number {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    const decimal =
      value.$numberDecimal;

    const amount =
      Number(decimal ?? 0);

    return Number.isFinite(amount)
      ? amount
      : 0;
  }

  const amount =
    Number(value ?? 0);

  return Number.isFinite(amount)
    ? amount
    : 0;
}

function formatMoney(
  value: DecimalValue | undefined,
  currency = "BDT"
): string {
  const amount =
    getDecimalNumber(value);

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency:
          currency || "BDT",
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `${currency || "BDT"} ${amount.toFixed(2)}`;
  }
}

function formatDate(
  value?: string | null
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
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function humanize(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
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
    normalizeStatus(status);

  switch (normalized) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className:
          "merchant-status-success",
        description:
          "The payment completed successfully.",
      };

    case "authorized":
      return {
        label: "Authorized",
        icon: ShieldCheck,
        className:
          "merchant-status-info",
        description:
          "The payment was authorized and is ready for capture.",
      };

    case "captured":
      return {
        label: "Captured",
        icon: CreditCard,
        className:
          "merchant-status-info",
        description:
          "The authorized payment amount was captured.",
      };

    case "failed":
      return {
        label: "Failed",
        icon: XCircle,
        className:
          "merchant-status-danger",
        description:
          "The payment could not be completed.",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className:
          "merchant-status-danger",
        description:
          "The payment was cancelled.",
      };

    case "expired":
      return {
        label: "Expired",
        icon: Clock3,
        className:
          "merchant-status-warning",
        description:
          "The payment expired before completion.",
      };

    default:
      return {
        label: "Pending",
        icon: Clock3,
        className:
          "merchant-status-warning",
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
        icon: Zap,
        label: "Wallet",
      };

    case "paypal":
      return {
        icon: CreditCard,
        label: "PayPal",
      };

    case "card":
      return {
        icon: CreditCard,
        label: "Card",
      };

    case "local_psp":
      return {
        icon: WalletCards,
        label: "Local PSP",
      };

    default:
      return {
        icon: CreditCard,
        label:
          humanize(sourceType),
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
      new URL(value);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/* =========================================================
   COPY BUTTON
========================================================= */

function CopyButton({
  value,
}: {
  value?: string | null;
}) {
  const [copied, setCopied] =
    useState(false);

  if (!value) {
    return null;
  }

  const copyValue =
    async () => {
      try {
        await navigator.clipboard.writeText(
          value
        );

        setCopied(true);

        window.setTimeout(
          () => setCopied(false),
          1500
        );
      } catch {
        setCopied(false);
      }
    };

  return (
    <button
      type="button"
      onClick={() =>
        void copyValue()
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold merchant-border merchant-surface merchant-muted transition hover:merchant-primary-soft hover:merchant-primary"
      aria-label={`Copy ${value}`}
    >
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}

      {copied
        ? "Copied"
        : "Copy"}
    </button>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  mono = false,
  copy = false,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  copy?: boolean;
}) {
  const displayValue =
    value?.trim() ||
    "Not available";

  return (
    <div className="flex flex-col gap-2 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between merchant-border">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide merchant-muted">
          {label}
        </p>

        <p
          className={`mt-1 break-all text-sm font-semibold merchant-text ${
            mono
              ? "font-mono"
              : ""
          }`}
        >
          {displayValue}
        </p>
      </div>

      {copy && value && (
        <div className="shrink-0">
          <CopyButton
            value={value}
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Banknote;
}) {
  return (
    <section className="rounded-2xl border p-5 merchant-border merchant-surface merchant-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide merchant-muted">
            {title}
          </p>

          <p className="mt-3 break-words text-xl font-bold merchant-text">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 merchant-muted">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl merchant-primary-soft merchant-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl merchant-primary-soft">
          <Loader2 className="h-7 w-7 animate-spin merchant-primary" />
        </div>

        <p className="mt-4 text-sm font-semibold merchant-text">
          Loading payment details
        </p>

        <p className="mt-1 text-xs merchant-muted">
          Please wait while the payment record is retrieved.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[520px] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border p-6 text-center merchant-border merchant-surface merchant-shadow">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl merchant-danger-soft">
          <AlertCircle className="h-7 w-7 merchant-danger" />
        </div>

        <h2 className="mt-4 text-lg font-bold merchant-text">
          Unable to load payment
        </h2>

        <p className="mt-2 text-sm leading-6 merchant-muted">
          {message}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/merchant/payments"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold merchant-border merchant-surface merchant-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payments
          </Link>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white merchant-gradient"
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
  const params =
    useParams();

  const rawPaymentId =
    params?.paymentId;

  const paymentId =
    Array.isArray(rawPaymentId)
      ? rawPaymentId[0]
      : typeof rawPaymentId ===
          "string"
        ? rawPaymentId
        : "";

  const [data, setData] =
    useState<PaymentDetailResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH PAYMENT
  ======================================================== */

  const fetchPayment =
    useCallback(
      async ({
        silent = false,
      }: {
        silent?: boolean;
      } = {}) => {
        if (!paymentId) {
          setError(
            "A valid payment ID is required."
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
            await apiClient<PaymentDetailResponse>(
              `/merchants/payments/${encodeURIComponent(
                paymentId
              )}`,
              {
                method: "GET",
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

          setData(response);
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load payment details.";

          setError(message);

          if (!silent) {
            setData(null);
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [paymentId]
    );

  useEffect(() => {
    void fetchPayment();
  }, [fetchPayment]);

  /* =======================================================
     DERIVED DATA
  ======================================================== */

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
        if (!payment) {
          return [];
        }

        const status =
          normalizeStatus(
            payment.status
          );

        const items: TimelineItem[] =
          [
            {
              key: "created",
              title:
                "Payment created",
              description:
                "The merchant payment was created.",
              date:
                payment.createdAt,
              completed: Boolean(
                payment.createdAt
              ),
            },
            {
              key: "authorized",
              title:
                "Payment authorized",
              description:
                "The payment received authorization.",
              date:
                payment.authorizedAt,
              completed: Boolean(
                payment.authorizedAt
              ),
            },
            {
              key: "captured",
              title:
                "Payment captured",
              description:
                "The authorized payment amount was captured.",
              date:
                payment.capturedAt,
              completed: Boolean(
                payment.capturedAt
              ),
            },
            {
              key: "completed",
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
          status === "failed" ||
          payment.failedAt
        ) {
          items.push({
            key: "failed",
            title:
              "Payment failed",
            description:
              payment.failureMessage ||
              "The payment could not be completed.",
            date:
              payment.failedAt,
            completed: true,
            danger: true,
          });
        }

        if (
          status === "cancelled" ||
          payment.cancelledAt
        ) {
          items.push({
            key: "cancelled",
            title:
              "Payment cancelled",
            description:
              "The payment was cancelled.",
            date:
              payment.cancelledAt,
            completed: true,
            danger: true,
          });
        }

        if (
          status === "expired" ||
          payment.expiredAt
        ) {
          items.push({
            key: "expired",
            title:
              "Payment expired",
            description:
              "The payment expired before completion.",
            date:
              payment.expiredAt,
            completed: true,
            danger: true,
          });
        }

        return items;
      },
      [payment]
    );

  /* =======================================================
     STATES
  ======================================================== */

  if (loading) {
    return (
      <div className="merchant-theme min-h-full bg-[var(--merchant-background)]">
        <LoadingState />
      </div>
    );
  }

  if (
    error &&
    !data
  ) {
    return (
      <div className="merchant-theme min-h-full bg-[var(--merchant-background)]">
        <ErrorState
          message={error}
          onRetry={() =>
            void fetchPayment()
          }
        />
      </div>
    );
  }

  if (
    !payment ||
    !merchant
  ) {
    return (
      <div className="merchant-theme min-h-full bg-[var(--merchant-background)]">
        <ErrorState
          message="Payment details were not found."
          onRetry={() =>
            void fetchPayment()
          }
        />
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="merchant-theme min-h-full">
      <div className="min-h-full bg-[var(--merchant-background)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          {/* Back navigation */}

          <Link
            href="/dashboard/merchant/payments"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold merchant-muted transition hover:merchant-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payments
          </Link>

          {/* Error while refreshing */}

          {error && data && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border p-4 merchant-border merchant-danger-soft">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 merchant-danger" />

              <div>
                <p className="text-sm font-semibold merchant-text">
                  Refresh failed
                </p>

                <p className="mt-1 text-sm merchant-muted">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Header */}

          <header className="mb-6 rounded-2xl border p-5 sm:p-6 merchant-border merchant-surface merchant-shadow">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${statusMeta.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusMeta.label}
                  </span>

                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${
                      normalizeStatus(
                        payment.mode
                      ) === "live"
                        ? "merchant-mode-live"
                        : "merchant-mode-test"
                    }`}
                  >
                    {normalizeStatus(
                      payment.mode
                    ) === "live"
                      ? "Live mode"
                      : "Test mode"}
                  </span>
                </div>

                <h1 className="mt-4 break-all font-mono text-xl font-bold tracking-tight merchant-text sm:text-2xl">
                  {payment.paymentId}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 merchant-muted">
                  {statusMeta.description}
                </p>

                <div className="mt-4">
                  <CopyButton
                    value={
                      payment.paymentId
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchPayment({
                    silent: true,
                  })
                }
                disabled={refreshing}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold merchant-border merchant-surface merchant-text transition hover:merchant-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
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
          </header>

          {/* Financial summary */}

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Payment amount"
              value={amount}
              description="Original payment amount"
              icon={Banknote}
            />

            <SummaryCard
              title="Processing fee"
              value={feeAmount}
              description="Fee applied to this payment"
              icon={CreditCard}
            />

            <SummaryCard
              title="Net amount"
              value={netAmount}
              description="Merchant settlement amount"
              icon={WalletCards}
            />

            <SummaryCard
              title="Payment method"
              value={methodMeta.label}
              description={humanize(
                payment.provider
              )}
              icon={MethodIcon}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
            {/* Left column */}

            <div className="space-y-6">
              {/* Payment information */}

              <section className="rounded-2xl border merchant-border merchant-surface merchant-shadow">
                <div className="border-b px-5 py-4 merchant-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl merchant-primary-soft merchant-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold merchant-text">
                        Payment information
                      </h2>

                      <p className="mt-0.5 text-xs merchant-muted">
                        Core payment and provider information
                      </p>
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
                    value={currency}
                  />
                </div>
              </section>

              {/* Customer and order */}

              <section className="rounded-2xl border merchant-border merchant-surface merchant-shadow">
                <div className="border-b px-5 py-4 merchant-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl merchant-primary-soft merchant-primary">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold merchant-text">
                        Customer and order
                      </h2>

                      <p className="mt-0.5 text-xs merchant-muted">
                        References connected with this payment
                      </p>
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
              </section>

              {/* Payment URLs */}

              {(checkoutUrl ||
                returnUrl ||
                cancelUrl) && (
                <section className="rounded-2xl border merchant-border merchant-surface merchant-shadow">
                  <div className="border-b px-5 py-4 merchant-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl merchant-primary-soft merchant-primary">
                        <ExternalLink className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="font-bold merchant-text">
                          Payment URLs
                        </h2>

                        <p className="mt-0.5 text-xs merchant-muted">
                          Redirect and checkout destinations
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    {checkoutUrl && (
                      <ExternalUrl
                        label="Checkout URL"
                        url={checkoutUrl}
                      />
                    )}

                    {returnUrl && (
                      <ExternalUrl
                        label="Return URL"
                        url={returnUrl}
                      />
                    )}

                    {cancelUrl && (
                      <ExternalUrl
                        label="Cancel URL"
                        url={cancelUrl}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* Failure */}

              {(payment.failureCode ||
                payment.failureMessage) && (
                <section className="rounded-2xl border p-5 merchant-border merchant-danger-soft">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 merchant-danger" />

                    <div className="min-w-0">
                      <h2 className="font-bold merchant-text">
                        Failure information
                      </h2>

                      {payment.failureCode && (
                        <p className="mt-3 font-mono text-sm font-semibold merchant-danger">
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

            {/* Right column */}

            <div className="space-y-6">
              {/* Timeline */}

              <section className="rounded-2xl border merchant-border merchant-surface merchant-shadow">
                <div className="border-b px-5 py-4 merchant-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl merchant-primary-soft merchant-primary">
                      <CalendarClock className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold merchant-text">
                        Payment timeline
                      </h2>

                      <p className="mt-0.5 text-xs merchant-muted">
                        Payment lifecycle events
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {timeline.map(
                    (item, index) => (
                      <div
                        key={item.key}
                        className="relative flex gap-4 pb-6 last:pb-0"
                      >
                        {index <
                          timeline.length -
                            1 && (
                          <div className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px merchant-timeline-line" />
                        )}

                        <div
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                            item.danger
                              ? "merchant-danger-soft merchant-danger merchant-border"
                              : item.completed
                                ? "merchant-primary-soft merchant-primary merchant-border"
                                : "merchant-surface-soft merchant-muted merchant-border"
                          }`}
                        >
                          {item.danger ? (
                            <XCircle className="h-4 w-4" />
                          ) : item.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock3 className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold merchant-text">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 merchant-muted">
                            {
                              item.description
                            }
                          </p>

                          <p className="mt-2 text-xs font-semibold merchant-muted">
                            {formatDate(
                              item.date
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* Merchant */}

              <section className="rounded-2xl border merchant-border merchant-surface merchant-shadow">
                <div className="border-b px-5 py-4 merchant-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl merchant-primary-soft merchant-primary">
                      <Layers3 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold merchant-text">
                        Merchant account
                      </h2>

                      <p className="mt-0.5 text-xs merchant-muted">
                        Owner of this payment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5">
                  <DetailRow
                    label="Business name"
                    value={
                      merchant.businessName ||
                      merchant.displayName
                    }
                  />

                  <DetailRow
                    label="Merchant slug"
                    value={
                      merchant.slug
                    }
                    mono
                  />

                  <DetailRow
                    label="Account status"
                    value={humanize(
                      merchant.status
                    )}
                  />

                  <DetailRow
                    label="Verification"
                    value={humanize(
                      merchant.verificationStatus
                    )}
                  />

                  <DetailRow
                    label="Default currency"
                    value={
                      merchant.defaultCurrency
                    }
                  />
                </div>
              </section>

              {/* Record metadata */}

              <section className="rounded-2xl border merchant-border merchant-surface merchant-shadow">
                <div className="border-b px-5 py-4 merchant-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl merchant-primary-soft merchant-primary">
                      <Hash className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-bold merchant-text">
                        Record metadata
                      </h2>

                      <p className="mt-0.5 text-xs merchant-muted">
                        Creation and update information
                      </p>
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
                    value={payment._id}
                    mono
                    copy
                  />
                </div>
              </section>
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
  label: string;
  url: string;
}) {
  return (
    <div className="rounded-xl border p-4 merchant-border merchant-surface-soft">
      <p className="text-xs font-bold uppercase tracking-wide merchant-muted">
        {label}
      </p>

      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="min-w-0 break-all font-mono text-xs leading-5 merchant-text">
          {url}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <CopyButton
            value={url}
          />

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-lg border px-2.5 merchant-border merchant-surface merchant-primary transition hover:merchant-primary-soft"
            aria-label={`Open ${label}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}