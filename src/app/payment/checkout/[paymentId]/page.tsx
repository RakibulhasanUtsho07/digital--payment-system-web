"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  Loader2,
  LockKeyhole,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Store,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  confirmCheckoutPayment,
  getCheckoutPayment,
  type CheckoutPayment,
} from "@/lib/api/merchantPaymentApi";

import {
  authorizeMerchantPaymentWithPasskey,
} from "@/lib/api/passkeyApi";

/* =========================================================
   TYPES
========================================================= */

type PageState =
  | "loading"
  | "ready"
  | "processing"
  | "success"
  | "error";

interface CheckoutPageProps {
  params: Promise<{
    paymentId: string;
  }>;
}

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount: string | number,
  currency: string
): string {
  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    )
  ) {
    return `${currency} ${amount}`;
  }

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(
      numericAmount
    );
  } catch {
    return `${currency} ${numericAmount.toFixed(
      2
    )}`;
  }
}

function formatDate(
  value?: string
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
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(date);
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : "Unable to process this payment.";
}

function isAuthenticationError(
  message: string
): boolean {
  const normalized =
    message.toLowerCase();

  return (
    normalized.includes(
      "authentication required"
    ) ||
    normalized.includes(
      "not authorized"
    ) ||
    normalized.includes(
      "unauthorized"
    )
  );
}

/* =========================================================
   SAFE MERCHANT REDIRECT

   Adds non-sensitive payment status information to the
   merchant's return/cancel URL.
========================================================= */

function createMerchantRedirectUrl(
  rawUrl: string,
  paymentId: string,
  result:
    | "completed"
    | "not_completed"
): string {
  try {
    const url =
      new URL(rawUrl);

    url.searchParams.set(
      "coffer_payment_id",
      paymentId
    );

    url.searchParams.set(
      "coffer_result",
      result
    );

    return url.toString();
  } catch {
    return rawUrl;
  }
}

/* =========================================================
   LOADING SCREEN
========================================================= */

function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
              <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
            </div>

            <h1 className="mt-5 text-xl font-black text-slate-950">
              Loading Coffer Checkout
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Please wait while we securely load your payment details.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CheckoutPage({
  params,
}: CheckoutPageProps) {
  const [
    paymentId,
    setPaymentId,
  ] = useState("");

  const [
    payment,
    setPayment,
  ] =
    useState<CheckoutPayment | null>(
      null
    );

  const [
    pageState,
    setPageState,
  ] =
    useState<PageState>(
      "loading"
    );

  const [
    error,
    setError,
  ] = useState("");

  const [
    needsAuthentication,
    setNeedsAuthentication,
  ] = useState(false);

  const [
    walletBalance,
    setWalletBalance,
  ] =
    useState<number | null>(
      null
    );

  /* =======================================================
     RESOLVE ROUTE PARAM
  ======================================================= */

  useEffect(() => {
    let mounted =
      true;

    void params.then(
      ({
        paymentId:
          resolvedPaymentId,
      }) => {
        if (!mounted) {
          return;
        }

        setPaymentId(
          resolvedPaymentId
        );
      }
    );

    return () => {
      mounted =
        false;
    };
  }, [params]);

  /* =======================================================
     LOGIN RETURN URL
  ======================================================= */

  const loginUrl =
    useMemo(() => {
      const callbackUrl =
        paymentId
          ? `/payment/checkout/${encodeURIComponent(
              paymentId
            )}`
          : "/dashboard";

      return `/login?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`;
    }, [paymentId]);

  /* =======================================================
     LOAD PAYMENT
  ======================================================= */

  const loadPayment =
    useCallback(
      async () => {
        if (!paymentId) {
          return;
        }

        try {
          setPageState(
            "loading"
          );

          setError("");

          setNeedsAuthentication(
            false
          );

          const result =
            await getCheckoutPayment(
              paymentId
            );

          setPayment(
            result
          );

          if (
            result.status ===
            "completed"
          ) {
            setPageState(
              "success"
            );

            return;
          }

          if (
            result.status !==
            "pending"
          ) {
            setError(
              `This payment is currently ${result.status}.`
            );

            setPageState(
              "error"
            );

            return;
          }

          setPageState(
            "ready"
          );
        } catch (
          loadError
        ) {
          const message =
            getErrorMessage(
              loadError
            );

          console.error(
            "COFFER CHECKOUT LOAD ERROR:",
            loadError
          );

          setError(
            message
          );

          setNeedsAuthentication(
            isAuthenticationError(
              message
            )
          );

          setPageState(
            "error"
          );
        }
      },
      [paymentId]
    );

  useEffect(() => {
    void loadPayment();
  }, [loadPayment]);

  /* =======================================================
     SUCCESS REDIRECT

     Webhook remains the merchant's trusted payment source.
     Query values here are only for frontend navigation.
  ======================================================= */

  useEffect(() => {
    if (
      pageState !==
        "success" ||
      !payment?.returnUrl
    ) {
      return;
    }

    const redirectUrl =
      createMerchantRedirectUrl(
        payment.returnUrl,
        payment.id,
        "completed"
      );

    const timer =
      window.setTimeout(
        () => {
          window.location.assign(
            redirectUrl
          );
        },
        1800
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    pageState,
    payment,
  ]);

  /* =======================================================
     PAY
  ======================================================= */

  const handlePay =
    async () => {
      if (
        !paymentId ||
        !payment ||
        pageState ===
          "processing"
      ) {
        return;
      }

      try {
        setPageState(
          "processing"
        );

        setError("");

        const authorizationToken =
          await authorizeMerchantPaymentWithPasskey(
            paymentId
          );

        const result =
          await confirmCheckoutPayment(
            paymentId,
            authorizationToken
          );

        if (
          result.wallet
        ) {
          setWalletBalance(
            result.wallet
              .balance
          );
        }

        setPayment(
          (
            previous
          ) => {
            if (!previous) {
              return previous;
            }

            return {
              ...previous,

              status:
                result.payment
                  .status,

              customerId:
                result.payment
                  .customerId,

              authorizedAt:
                result.payment
                  .authorizedAt,

              capturedAt:
                result.payment
                  .capturedAt,

              completedAt:
                result.payment
                  .completedAt,
            };
          }
        );

        if (
          result.payment
            .status ===
          "completed"
        ) {
          setPageState(
            "success"
          );

          return;
        }

        setPageState(
          "ready"
        );
      } catch (
        paymentError
      ) {
        const message =
          paymentError instanceof Error &&
          paymentError.name ===
            "NotAllowedError"
            ? "Passkey verification was cancelled or timed out."
            : getErrorMessage(
                paymentError
              );

        console.error(
          "COFFER PAYMENT ERROR:",
          paymentError
        );

        setError(
          message
        );

        setNeedsAuthentication(
          isAuthenticationError(
            message
          )
        );

        setPageState(
          "ready"
        );
      }
    };

  /* =======================================================
     RETURN TO MERCHANT

     This does not falsely mark the backend payment as
     cancelled. It only returns the customer to the
     merchant's cancel URL.
  ======================================================= */

  const handleReturnToMerchant =
    () => {
      if (
        payment?.cancelUrl
      ) {
        const redirectUrl =
          createMerchantRedirectUrl(
            payment.cancelUrl,
            payment.id,
            "not_completed"
          );

        window.location.assign(
          redirectUrl
        );

        return;
      }

      if (
        window.history.length >
        1
      ) {
        window.history.back();

        return;
      }

      window.location.assign(
        "/dashboard"
      );
    };

  /* =======================================================
     DISPLAY VALUES
  ======================================================= */

  const merchantName =
    payment?.merchant
      ?.displayName ||
    payment?.merchant
      ?.businessName ||
    "Coffer Merchant";

  const formattedAmount =
    useMemo(() => {
      if (!payment) {
        return "";
      }

      return formatMoney(
        payment.amount,
        payment.currency
      );
    }, [payment]);

  const isProcessing =
    pageState ===
    "processing";

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    pageState ===
    "loading"
  ) {
    return (
      <CheckoutLoading />
    );
  }

  /* =======================================================
     ERROR SCREEN
  ======================================================= */

  if (
    pageState ===
      "error" ||
    !payment
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <CircleAlert className="h-7 w-7 text-red-600" />
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
                Coffer Checkout
              </p>

              <h1 className="mt-2 text-xl font-black text-slate-950">
                {needsAuthentication
                  ? "Sign in required"
                  : "Checkout unavailable"}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {needsAuthentication
                  ? "Sign in to your Coffer account to continue this wallet payment."
                  : error ||
                    "We could not load this payment."}
              </p>

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                {needsAuthentication ? (
                  <Link
                    href={
                      loginUrl
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-700"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      void loadPayment()
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                )}

                <Link
                  href="/dashboard"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     SUCCESS SCREEN
  ======================================================= */

  if (
    pageState ===
      "success" ||
    payment.status ===
      "completed"
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Payment successful
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {formattedAmount}
              </h1>

              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                Your payment to{" "}
                <span className="font-bold text-slate-700">
                  {merchantName}
                </span>{" "}
                has been completed successfully.
              </p>

              <div className="mt-7 w-full divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 text-left">
                <div className="flex items-center justify-between gap-4 p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Payment ID
                  </span>

                  <span className="max-w-[210px] truncate text-xs font-black text-slate-800">
                    {payment.id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Merchant
                  </span>

                  <span className="max-w-[210px] truncate text-xs font-black text-slate-800">
                    {merchantName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Status
                  </span>

                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Completed
                  </span>
                </div>

                {walletBalance !==
                  null && (
                  <div className="flex items-center justify-between gap-4 p-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Wallet balance
                    </span>

                    <span className="text-xs font-black text-slate-800">
                      {formatMoney(
                        walletBalance,
                        payment.currency
                      )}
                    </span>
                  </div>
                )}
              </div>

              {payment.returnUrl ? (
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Returning to {merchantName}...
                </div>
              ) : (
                <Link
                  href="/dashboard"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Back to Coffer
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     CHECKOUT SCREEN
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black tracking-tight text-slate-950">
                Coffer
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Secure Wallet Checkout
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <LockKeyhole className="h-4 w-4" />
            Protected payment
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {payment.mode ===
          "test" && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <CircleAlert className="h-4 w-4 shrink-0" />

            <p className="text-xs font-bold">
              Test mode payment — no live settlement will be created.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Payment summary */}

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Coffer protected
              </div>

              <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Review your payment
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Confirm the merchant and amount before paying from your Coffer wallet.
              </p>
            </div>

            <div className="mt-8 rounded-[26px] bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Store className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">
                    Paying to
                  </p>

                  <p className="mt-1 truncate text-sm font-black">
                    {merchantName}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">
                  Total amount
                </p>

                <p className="mt-1 text-4xl font-black tracking-tight">
                  {formattedAmount}
                </p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between gap-5 p-4">
                <span className="text-xs font-semibold text-slate-500">
                  Payment ID
                </span>

                <span className="max-w-[60%] truncate text-right text-xs font-black text-slate-800">
                  {payment.id}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 p-4">
                <span className="text-xs font-semibold text-slate-500">
                  Currency
                </span>

                <span className="text-xs font-black text-slate-800">
                  {payment.currency}
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 p-4">
                <span className="text-xs font-semibold text-slate-500">
                  Payment method
                </span>

                <span className="inline-flex items-center gap-2 text-xs font-black text-slate-800">
                  <Wallet className="h-4 w-4 text-violet-600" />
                  Coffer Wallet
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 p-4">
                <span className="text-xs font-semibold text-slate-500">
                  Created
                </span>

                <span className="text-right text-xs font-black text-slate-800">
                  {formatDate(
                    payment.createdAt
                  )}
                </span>
              </div>

              {payment.orderId && (
                <div className="flex items-center justify-between gap-5 p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Coffer order
                  </span>

                  <span className="max-w-[60%] truncate text-right text-xs font-black text-slate-800">
                    {payment.orderId}
                  </span>
                </div>
              )}

              {payment.merchantReference && (
                <div className="flex items-center justify-between gap-5 p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Merchant reference
                  </span>

                  <span className="max-w-[60%] truncate text-right text-xs font-black text-slate-800">
                    {payment.merchantReference}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Payment action */}

          <section className="lg:pt-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
                  <CreditCard className="h-5 w-5 text-violet-600" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Pay with
                  </p>

                  <p className="mt-1 text-base font-black text-slate-950">
                    Coffer Wallet
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="text-sm font-black text-emerald-950">
                      Protected wallet payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-800/70">
                      Your wallet will be charged only after you confirm this payment.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <div>
                    <p className="text-sm font-black text-red-800">
                      Payment could not be completed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700">
                      {error}
                    </p>

                    {needsAuthentication && (
                      <Link
                        href={
                          loginUrl
                        }
                        className="mt-3 inline-flex items-center gap-2 text-xs font-black text-red-800 underline"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        Sign in again
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Total
                  </span>

                  <span className="text-2xl font-black tracking-tight text-slate-950">
                    {formattedAmount}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={
                    handlePay
                  }
                  disabled={
                    isProcessing
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing payment...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Verify and Pay {formattedAmount}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={
                    handleReturnToMerchant
                  }
                  disabled={
                    isProcessing
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Return without paying
                </button>
              </div>

              <div className="mt-7 flex items-start gap-3 border-t border-slate-100 pt-6">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                <p className="text-[11px] leading-5 text-slate-400">
                  The merchant should verify the final payment through Coffer&apos;s signed webhook, not from browser redirect parameters.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
          <ShieldCheck className="h-4 w-4" />
          Payments protected by Coffer
        </div>
      </div>
    </main>
  );
}
