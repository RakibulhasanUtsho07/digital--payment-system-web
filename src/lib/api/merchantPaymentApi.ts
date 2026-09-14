import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export type CheckoutPaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export type CheckoutPaymentMode =
  | "test"
  | "live";

/* =========================================================
   MERCHANT
========================================================= */

export interface CheckoutMerchant {
  id: string;

  businessName: string;

  displayName?: string;

  slug?: string;

  status?: string;

  verificationStatus?: string;
}

/* =========================================================
   CHECKOUT PAYMENT
========================================================= */

export interface CheckoutPayment {
  id: string;

  status:
    CheckoutPaymentStatus;

  amount: string;

  currency: string;

  merchantId: string;

  /*
   * Customer may not be assigned when the merchant
   * initially creates the payment.
   *
   * It will be assigned when an authenticated Coffer
   * customer successfully confirms the payment.
   */
  customerId?: string;

  merchant:
    CheckoutMerchant;

  orderId?: string;

  merchantReference?: string;

  provider: string;

  sourceType: string;

  mode:
    CheckoutPaymentMode;

  returnUrl?: string;

  cancelUrl?: string;

  createdAt?: string;

  updatedAt?: string;

  authorizedAt?: string;

  capturedAt?: string;

  completedAt?: string;

  failedAt?: string;

  cancelledAt?: string;

  expiredAt?: string;

  failureCode?: string;

  failureMessage?: string;
}

/* =========================================================
   GET CHECKOUT RESPONSE
========================================================= */

export interface CheckoutPaymentResponse {
  success: boolean;

  message?: string;

  payment:
    CheckoutPayment;
}

/* =========================================================
   CONFIRMED PAYMENT
========================================================= */

export interface ConfirmedCheckoutPayment {
  id: string;

  status:
    CheckoutPaymentStatus;

  amount: string;

  currency: string;

  merchantId: string;

  customerId: string;

  orderId?: string;

  merchantReference?: string;

  provider: string;

  sourceType: string;

  mode:
    CheckoutPaymentMode;

  authorizedAt?: string;

  capturedAt?: string;

  completedAt?: string;

  createdAt?: string;

  updatedAt?: string;
}

/* =========================================================
   CONFIRM RESPONSE
========================================================= */

export interface ConfirmPaymentResponse {
  success: boolean;

  duplicate: boolean;

  message: string;

  payment:
    ConfirmedCheckoutPayment;

  wallet?: {
    balance: number;

    currency: string;
  };
}

/* =========================================================
   HELPERS
========================================================= */

function normalizePaymentId(
  paymentId: string
): string {
  const normalized =
    paymentId.trim();

  if (!normalized) {
    throw new Error(
      "Payment ID is required."
    );
  }

  return normalized;
}

function normalizeAuthorizationToken(
  authorizationToken: string
): string {
  const normalized =
    authorizationToken.trim();

  if (!normalized) {
    throw new Error(
      "Payment authorization is required."
    );
  }

  return normalized;
}

/* =========================================================
   GET CHECKOUT PAYMENT

   GET /api/v1/payments/:paymentId/checkout
========================================================= */

export const getCheckoutPayment =
  async (
    paymentId: string
  ): Promise<CheckoutPayment> => {
    const normalizedPaymentId =
      normalizePaymentId(
        paymentId
      );

    const response =
      await apiClient<CheckoutPaymentResponse>(
        `/v1/payments/${encodeURIComponent(
          normalizedPaymentId
        )}/checkout`,
        {
          method:
            "GET",
        }
      );

    if (
      !response.success ||
      !response.payment
    ) {
      throw new Error(
        response.message ||
          "Unable to load checkout payment."
      );
    }

    return response.payment;
  };

/* =========================================================
   CONFIRM CHECKOUT PAYMENT

   POST /api/v1/payments/:paymentId/confirm

   The authorization token is created only after successful
   WebAuthn/passkey verification.

   It is sent through:
   X-Payment-Authorization
========================================================= */

export const confirmCheckoutPayment =
  async (
    paymentId: string,
    authorizationToken: string
  ): Promise<ConfirmPaymentResponse> => {
    const normalizedPaymentId =
      normalizePaymentId(
        paymentId
      );

    const normalizedAuthorizationToken =
      normalizeAuthorizationToken(
        authorizationToken
      );

    const response =
      await apiClient<ConfirmPaymentResponse>(
        `/v1/payments/${encodeURIComponent(
          normalizedPaymentId
        )}/confirm`,
        {
          method:
            "POST",

          headers: {
            "X-Payment-Authorization":
              normalizedAuthorizationToken,
          },
        }
      );

    if (
      !response.success ||
      !response.payment
    ) {
      throw new Error(
        response.message ||
          "Unable to confirm payment."
      );
    }

    return response;
  };