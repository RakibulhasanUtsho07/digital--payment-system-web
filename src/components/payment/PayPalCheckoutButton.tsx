"use client";

/* =========================================================
   PAYPAL CHECKOUT BUTTON
========================================================= */

import {
  useState,
} from "react";

import {
  createPayPalPayment,
} from "@/lib/api/paypalPaymentApi";

/* =========================================================
   PROPS
========================================================= */

interface PayPalCheckoutButtonProps {
  amount: string;

  currency?: string;

  customerId?: string;

  orderId?: string;

  merchantReference?: string;

  description?: string;

  className?: string;

  disabled?: boolean;

  environment?: "test" | "live";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function PayPalCheckoutButton({
  amount,

  currency = "USD",

  customerId,

  orderId,

  merchantReference,

  description,

  className = "",

  disabled = false,

  environment = "test",
}: PayPalCheckoutButtonProps) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  /* =======================================================
     CLICK HANDLER
  ======================================================== */

  const handlePayment =
    async () => {
      if (loading || disabled) {
        return;
      }

      setError(null);

      setLoading(true);

      try {
        const result =
          await createPayPalPayment({
            amount,

            currency,

            customerId,

            orderId,

            merchantReference,

            description,

            environment,

            returnUrl:
              `${window.location.origin}/payment/paypal/success`,

            cancelUrl:
              `${window.location.origin}/payment/paypal/cancel`,
          });

        const approvalUrl =
          result.data
            ?.approvalUrl ??
          result.data
            ?.checkoutUrl;

        if (
          !approvalUrl
        ) {
          throw new Error(
            "PayPal approval URL was not returned.",
          );
        }

        /*
         * Send customer to PayPal.
         */
        window.location.assign(
          approvalUrl,
        );
      } catch (
        paymentError: unknown
      ) {
        setError(
          paymentError instanceof
            Error
            ? paymentError.message
            : "Unable to start PayPal payment.",
        );

        setLoading(false);
      }
    };

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div
      className={`w-full ${className}`}
    >
      <button
        type="button"
        onClick={
          handlePayment
        }
        disabled={
          loading ||
          disabled
        }
        className="
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-[#0070ba]
          px-5
          py-3.5
          text-sm
          font-semibold
          text-white
          shadow-lg
          transition
          hover:opacity-90
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {loading ? (
          <>
            <span
              className="
                h-4
                w-4
                animate-spin
                rounded-full
                border-2
                border-white/40
                border-t-white
              "
            />

            Redirecting to PayPal...
          </>
        ) : (
          <>
            Pay with PayPal
          </>
        )}
      </button>

      {error ? (
        <div
          className="
            mt-3
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
    </div>
  );
}