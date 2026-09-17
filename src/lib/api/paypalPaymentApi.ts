/* =========================================================
   PAYPAL PAYMENT API
========================================================= */

export interface CreatePayPalPaymentRequest {
  amount: string;

  currency: string;

  customerId?: string;

  orderId?: string;

  merchantReference?: string;

  description?: string;

  returnUrl: string;

  cancelUrl: string;

  environment?: "test" | "live";

  metadata?: Record<
    string,
    unknown
  >;
}

export interface CreatePayPalPaymentResponse {
  success: boolean;

  message: string;

  data: {
    paymentId: string;

    provider: "paypal";

    providerPaymentId: string;

    merchantId: string;

    businessName: string;

    environment: "test" | "live";

    status: string;

    amount: string;

    currency: string;

    approvalUrl: string | null;

    checkoutUrl: string | null;

    idempotencyKey: string;
  };
}

export interface CapturePayPalPaymentResponse {
  success: boolean;

  message: string;

  data: {
    paymentId: string;

    provider: "paypal";

    providerPaymentId: string;

    providerTransactionId: string | null;

    status: string;

    amount: string;

    currency: string;
  };
}

/* =========================================================
   API BASE URL
========================================================= */

const API_BASE_URL =
  (
    process.env
      .NEXT_PUBLIC_API_URL ??
    "http://localhost:5000/api"
  ).replace(
    /\/$/,
    "",
  );

/* =========================================================
   ERROR PARSER
========================================================= */

const getErrorMessage = (
  data: unknown,
  fallback: string,
): string => {
  if (
    data &&
    typeof data ===
      "object"
  ) {
    const object =
      data as Record<
        string,
        unknown
      >;

    if (
      typeof object.message ===
      "string"
    ) {
      return object.message;
    }

    if (
      typeof object.error ===
      "string"
    ) {
      return object.error;
    }
  }

  return fallback;
};

/* =========================================================
   CREATE PAYPAL PAYMENT
========================================================= */

export const createPayPalPayment =
  async (
    input: CreatePayPalPaymentRequest,
  ): Promise<CreatePayPalPaymentResponse> => {
    const idempotencyKey =
      globalThis.crypto?.randomUUID?.() ??
      `paypal-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

    const response =
      await fetch(
        `${API_BASE_URL}/v1/payments/paypal`,
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",

            "Idempotency-Key":
              idempotencyKey,
          },

          body: JSON.stringify({
            ...input,

            environment:
              input.environment ??
              "test",
          }),
        },
      );

    const data =
      (await response
        .json()
        .catch(
          () => null,
        )) as
        | CreatePayPalPaymentResponse
        | Record<
            string,
            unknown
          >
        | null;

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Unable to create PayPal payment.",
        ),
      );
    }

    return data as CreatePayPalPaymentResponse;
  };

/* =========================================================
   CAPTURE PAYPAL PAYMENT
========================================================= */

export const capturePayPalPayment =
  async (
    token: string,
  ): Promise<CapturePayPalPaymentResponse> => {
    const normalizedToken =
      token.trim();

    if (!normalizedToken) {
      throw new Error(
        "PayPal order token is required.",
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/v1/payments/paypal/return?token=${encodeURIComponent(
          normalizedToken,
        )}`,
        {
          method: "GET",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        },
      );

    const data =
      (await response
        .json()
        .catch(
          () => null,
        )) as
        | CapturePayPalPaymentResponse
        | Record<
            string,
            unknown
          >
        | null;

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Unable to capture PayPal payment.",
        ),
      );
    }

    return data as CapturePayPalPaymentResponse;
  };

/* =========================================================
   CANCEL PAYPAL PAYMENT
========================================================= */

export const cancelPayPalPayment =
  async (
    token: string,
  ): Promise<unknown> => {
    const normalizedToken =
      token.trim();

    if (!normalizedToken) {
      throw new Error(
        "PayPal order token is required.",
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/v1/payments/paypal/cancel?token=${encodeURIComponent(
          normalizedToken,
        )}`,
        {
          method: "GET",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        },
      );

    const data =
      (await response
        .json()
        .catch(
          () => null,
        )) as unknown;

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Unable to cancel PayPal payment.",
        ),
      );
    }

    return data;
  };