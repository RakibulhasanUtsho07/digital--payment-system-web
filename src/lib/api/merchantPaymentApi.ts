import { apiClient } from "./client";

/* =========================================================
   TYPES
========================================================= */

export interface CheckoutPayment {
  id: string;
  status:
    | "pending"
    | "authorized"
    | "captured"
    | "completed"
    | "failed"
    | "cancelled"
    | "expired";

  amount: string;
  currency: string;

  merchantId: string;
  customerId: string;

  orderId?: string;
  merchantReference?: string;

  provider: string;
  sourceType: string;
  mode: "test" | "live";

  returnUrl?: string;
  cancelUrl?: string;

  createdAt?: string;
  authorizedAt?: string;
  capturedAt?: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;

  failureCode?: string;
  failureMessage?: string;
}

interface CheckoutPaymentResponse {
  success: boolean;
  payment: CheckoutPayment;
}

interface ConfirmPaymentResponse {
  success: boolean;
  duplicate: boolean;
  message: string;

  payment: {
    id: string;
    status: CheckoutPayment["status"];
    amount: string;
    currency: string;
    merchantId: string;
    customerId: string;
    orderId?: string;
    provider: string;
    sourceType: string;
    completedAt?: string;
  };

  wallet?: {
    balance: number;
    currency: string;
  };
}

/* =========================================================
   GET CHECKOUT PAYMENT
========================================================= */

export const getCheckoutPayment =
  async (
    paymentId: string
  ): Promise<CheckoutPayment> => {
    const response =
      await apiClient<CheckoutPaymentResponse>(
        `/v1/payments/${encodeURIComponent(
          paymentId
        )}/checkout`,
        {
          method: "GET",
        }
      );

    return response.payment;
  };

/* =========================================================
   CONFIRM / PAY
========================================================= */

export const confirmCheckoutPayment =
  async (
    paymentId: string
  ): Promise<ConfirmPaymentResponse> => {
    return apiClient<ConfirmPaymentResponse>(
      `/v1/payments/${encodeURIComponent(
        paymentId
      )}/confirm`,
      {
        method: "POST",
      }
    );
  };