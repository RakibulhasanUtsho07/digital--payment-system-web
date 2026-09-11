"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  capturePayPalPayment,
} from "@/lib/api/paypalPaymentApi";

/* =========================================================
   TYPES
========================================================= */

interface PaymentData {
  paymentId: string;

  provider: "paypal";

  providerPaymentId: string;

  providerTransactionId:
    | string
    | null;

  status: string;

  amount: string;

  currency: string;
}

/* =========================================================
   PAGE
========================================================= */

export default function PayPalSuccessPage() {
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [payment, setPayment] =
    useState<
      PaymentData | null
    >(null);

  /* =======================================================
     CAPTURE
  ======================================================== */

  useEffect(() => {
    const runCapture =
      async () => {
        try {
          const params =
            new URLSearchParams(
              window.location.search,
            );

          const token =
            params.get(
              "token",
            );

          if (!token) {
            throw new Error(
              "PayPal order token was not found.",
            );
          }

          const response =
            await capturePayPalPayment(
              token,
            );

          setPayment(
            response.data,
          );
        } catch (
          captureError: unknown
        ) {
          setError(
            captureError instanceof
              Error
              ? captureError.message
              : "Payment capture failed.",
          );
        } finally {
          setLoading(false);
        }
      };

    void runCapture();
  }, []);

  /* =======================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-background
          px-6
        "
      >
        <div
          className="
            w-full
            max-w-md
            rounded-2xl
            border
            border-border
            bg-card
            p-8
            text-center
          "
        >
          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-border
              border-t-indigo-500
            "
          />

          <h1
            className="
              mt-5
              text-xl
              font-bold
              text-foreground
            "
          >
            Processing payment
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-muted-foreground
            "
          >
            Please wait while we confirm
            your PayPal payment.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================== */

  if (
    error ||
    !payment
  ) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-background
          px-6
        "
      >
        <div
          className="
            w-full
            max-w-md
            rounded-2xl
            border
            border-border
            bg-card
            p-8
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-red-500/10
              text-red-500
            "
          >
            !
          </div>

          <h1
            className="
              mt-5
              text-2xl
              font-bold
              text-foreground
            "
          >
            Payment failed
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-muted-foreground
            "
          >
            {error ??
              "We could not confirm your payment."}
          </p>

          <Link
            href="/dashboard"
            className="
              mt-6
              inline-flex
              rounded-xl
              bg-indigo-600
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:opacity-90
            "
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     SUCCESS
  ======================================================== */

  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-background
        px-6
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-border
          bg-card
          p-8
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-emerald-500/10
            text-2xl
            text-emerald-500
          "
        >
          ✓
        </div>

        <h1
          className="
            mt-5
            text-2xl
            font-bold
            text-foreground
          "
        >
          Payment successful
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-muted-foreground
          "
        >
          Your PayPal payment has been
          confirmed successfully.
        </p>

        <div
          className="
            mt-6
            space-y-3
            rounded-xl
            border
            border-border
            bg-muted/40
            p-4
          "
        >
          <div className="flex justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Amount
            </span>

            <span className="font-semibold text-foreground">
              {payment.amount}{" "}
              {payment.currency}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Status
            </span>

            <span className="font-semibold text-emerald-500">
              {payment.status}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              Payment ID
            </span>

            <span className="max-w-[190px] truncate text-right text-xs text-foreground">
              {payment.paymentId}
            </span>
          </div>

          {payment.providerTransactionId ? (
            <div className="flex justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Transaction
              </span>

              <span className="max-w-[190px] truncate text-right text-xs text-foreground">
                {
                  payment.providerTransactionId
                }
              </span>
            </div>
          ) : null}
        </div>

        <Link
          href="/dashboard"
          className="
            mt-6
            flex
            w-full
            items-center
            justify-center
            rounded-xl
            bg-indigo-600
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            transition
            hover:opacity-90
          "
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}