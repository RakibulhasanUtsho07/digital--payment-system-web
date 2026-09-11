"use client";

import React, {
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
  CreditCard,
  Loader2,
  LockKeyhole,
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

/* =========================================================
   TYPES
========================================================= */

type PageState =
  | "loading"
  | "ready"
  | "processing"
  | "success"
  | "error";

interface PageProps {
  params: Promise<{
    paymentId: string;
  }>;
}

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (
  amount: string,
  currency: string
): string => {
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
};

const getMerchantDisplayName = (
  payment: CheckoutPayment
): string => {
  /*
   * Current Payment response does not contain
   * merchant businessName.
   *
   * We therefore display a safe generic label
   * instead of inventing merchant data.
   */
  return "DAMO Merchant";
};

/* =========================================================
   PAGE
========================================================= */

export default function CheckoutPage({
  params,
}: PageProps) {
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
  ] =
    useState("");

  const [
    walletBalance,
    setWalletBalance,
  ] =
    useState<number | null>(
      null
    );

  /* =======================================================
     READ PARAM
  ======================================================== */

  useEffect(() => {
    let mounted = true;

    void params.then(
      ({
        paymentId: resolvedPaymentId,
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
      mounted = false;
    };
  }, [params]);

  /* =======================================================
     LOAD PAYMENT
  ======================================================== */

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

          const result =
            await getCheckoutPayment(
              paymentId
            );

          setPayment(
            result
          );

          /*
           * Completed payment:
           * show success immediately.
           */
          if (
            result.status ===
            "completed"
          ) {
            setPageState(
              "success"
            );

            return;
          }

          /*
           * Non-payable state.
           */
          if (
            result.status !==
            "pending"
          ) {
            setPageState(
              "error"
            );

            setError(
              `This payment is currently ${result.status}.`
            );

            return;
          }

          setPageState(
            "ready"
          );
        } catch (
          requestError
        ) {
          console.error(
            "CHECKOUT LOAD ERROR:",
            requestError
          );

          setPageState(
            "error"
          );

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load payment."
          );
        }
      },
      [paymentId]
    );

  useEffect(() => {
    void loadPayment();
  }, [loadPayment]);

  /* =======================================================
     PAY
  ======================================================== */

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

        const result =
          await confirmCheckoutPayment(
            paymentId
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
          ) =>
            previous
              ? {
                  ...previous,

                  status:
                    result.payment
                      .status,

                  completedAt:
                    result.payment
                      .completedAt,
                }
              : previous
        );

        if (
          result.payment.status ===
          "completed"
        ) {
          setPageState(
            "success"
          );

          /*
           * Merchant return URL is controlled by
           * merchant when payment was created.
           *
           * Give DAMO checkout a moment to show
           * success before redirecting.
           */
          const returnUrl =
            payment.returnUrl;

          if (
            returnUrl
          ) {
            window.setTimeout(
              () => {
                window.location.assign(
                  returnUrl
                );
              },
              1400
            );
          }

          return;
        }

        setPageState(
          "ready"
        );
      } catch (
        requestError
      ) {
        console.error(
          "CHECKOUT PAYMENT ERROR:",
          requestError
        );

        setPageState(
          "ready"
        );

        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Payment failed. Please try again."
        );
      }
    };

  /* =======================================================
     CANCEL
  ======================================================== */

  const handleCancel =
    () => {
      if (
        payment?.cancelUrl
      ) {
        window.location.assign(
          payment.cancelUrl
        );

        return;
      }

      window.history.back();
    };

  /* =======================================================
     MONEY
  ======================================================== */

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

  /* =======================================================
     LOADING
  ======================================================== */

  if (
    pageState ===
    "loading"
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Loader2 className="h-7 w-7 animate-spin text-slate-700" />
              </div>

              <h1 className="mt-5 text-xl font-black text-slate-900">
                Loading secure checkout
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Please wait while we securely
                load your payment details.
              </p>
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
    pageState ===
      "error" ||
    !payment
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <CircleAlert className="h-7 w-7 text-red-600" />
              </div>

              <h1 className="mt-5 text-xl font-black text-slate-900">
                Checkout unavailable
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {error ||
                  "We could not load this payment."}
              </p>

              <div className="mt-6 flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void loadPayment();
                  }}
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Try again
                </button>

                <Link
                  href="/dashboard"
                  className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
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
     SUCCESS
  ======================================================== */

  if (
    pageState ===
      "success" ||
    payment.status ===
      "completed"
  ) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
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
                Your payment has been completed
                successfully.
              </p>

              <div className="mt-7 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Payment ID
                  </span>

                  <span className="max-w-[210px] truncate text-xs font-black text-slate-800">
                    {payment.id}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Status
                  </span>

                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Completed
                  </span>
                </div>

                {walletBalance !==
                  null && (
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-500">
                      Wallet balance
                    </span>

                    <span className="text-xs font-black text-slate-800">
                      {formatMoney(
                        walletBalance.toFixed(
                          2
                        ),
                        payment.currency
                      )}
                    </span>
                  </div>
                )}
              </div>

              {!payment.returnUrl && (
                <Link
                  href="/dashboard"
                  className="mt-6 flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Back to Dashboard
                </Link>
              )}

              {payment.returnUrl && (
                <p className="mt-5 text-xs text-slate-400">
                  Returning to merchant...
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     CHECKOUT
  ======================================================== */

  const merchantName =
    getMerchantDisplayName(
      payment
    );

  const isProcessing =
    pageState ===
    "processing";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black tracking-tight text-slate-950">
                DAMO
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Secure Wallet Checkout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <LockKeyhole className="h-4 w-4" />
            Secure payment
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* =================================================
              PAYMENT SUMMARY
          ================================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified checkout
                </div>

                <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Review your payment
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Confirm the details below before
                  paying from your DAMO wallet.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <Store className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">
                    Merchant
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {merchantName}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/50">
                  Amount
                </p>

                <p className="mt-1 text-4xl font-black tracking-tight">
                  {formattedAmount}
                </p>
              </div>
            </div>

            {/* =================================================
                DETAILS
            ================================================== */}

            <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100">
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
                  <Wallet className="h-4 w-4 text-slate-500" />
                  DAMO Wallet
                </span>
              </div>

              {payment.orderId && (
                <div className="flex items-center justify-between gap-5 p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Order ID
                  </span>

                  <span className="max-w-[60%] truncate text-right text-xs font-black text-slate-800">
                    {payment.orderId}
                  </span>
                </div>
              )}

              {payment.merchantReference && (
                <div className="flex items-center justify-between gap-5 p-4">
                  <span className="text-xs font-semibold text-slate-500">
                    Reference
                  </span>

                  <span className="max-w-[60%] truncate text-right text-xs font-black text-slate-800">
                    {payment.merchantReference}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              PAY PANEL
          ================================================== */}

          <section className="lg:pt-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <CreditCard className="h-5 w-5 text-slate-700" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Pay with
                  </p>

                  <p className="mt-1 text-base font-black text-slate-950">
                    Your DAMO Wallet
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Secure wallet payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your wallet is charged only after
                      you approve this payment.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                  <div>
                    <p className="text-sm font-black text-red-800">
                      Payment could not be completed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700">
                      {error}
                    </p>
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
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing payment...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Pay {formattedAmount}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  disabled={
                    isProcessing
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </button>
              </div>

              <div className="mt-7 flex items-start gap-3 border-t border-slate-100 pt-6">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                <p className="text-[11px] leading-5 text-slate-400">
                  You are securely approving this
                  payment through your authenticated
                  DAMO wallet session. Never share your
                  wallet password or authentication
                  information with the merchant.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
          <ShieldCheck className="h-4 w-4" />
          DAMO protected payment session
        </div>
      </div>
    </main>
  );
}