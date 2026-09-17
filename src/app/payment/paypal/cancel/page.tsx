"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  cancelPayPalPayment,
} from "@/lib/api/paypalPaymentApi";

/* =========================================================
   PAGE
========================================================= */

export default function PayPalCancelPage() {
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const runCancel =
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

          /*
           * Token may be absent in some cancel scenarios.
           * We still show the cancel page.
           */
          if (token) {
            await cancelPayPalPayment(
              token,
            );
          }
        } catch (
          cancelError: unknown
        ) {
          setError(
            cancelError instanceof
              Error
              ? cancelError.message
              : "Unable to update cancelled payment.",
          );
        } finally {
          setLoading(false);
        }
      };

    void runCancel();
  }, []);

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
            bg-amber-500/10
            text-2xl
            text-amber-500
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
          Payment cancelled
        </h1>

        <p
          className="
            mt-2
            text-sm
            text-muted-foreground
          "
        >
          Your PayPal checkout was
          cancelled. No payment was
          completed through this checkout.
        </p>

        {loading ? (
          <p
            className="
              mt-4
              text-xs
              text-muted-foreground
            "
          >
            Updating payment status...
          </p>
        ) : null}

        {error ? (
          <div
            className="
              mt-4
              rounded-lg
              border
              border-red-500/30
              bg-red-500/10
              px-3
              py-2
              text-sm
              text-red-500
            "
          >
            {error}
          </div>
        ) : null}

        <Link
          href="/dashboard"
          className="
            mt-6
            flex
            w-full
            items-center
            justify-center
            rounded-xl
            border
            border-border
            px-5
            py-3
            text-sm
            font-semibold
            text-foreground
            transition
            hover:bg-muted
          "
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}