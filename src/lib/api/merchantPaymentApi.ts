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

export type CheckoutVerificationChannel =
  | "email"
  | "sms";

/* =========================================================
   MERCHANT
========================================================= */

export interface CheckoutMerchant {
  id:
    string;

  businessName:
    string;

  displayName?:
    string;

  slug?:
    string;

  status?:
    string;

  verificationStatus?:
    string;
}

/* =========================================================
   SANDBOX INFO
========================================================= */

export interface CheckoutSandboxInfo {
  email:
    string;

  phone:
    string;

  password:
    string;

  otp:
    string;

  balance:
    number;
}

/* =========================================================
   CHECKOUT PAYMENT
========================================================= */

export interface CheckoutPayment {
  id:
    string;

  status:
    CheckoutPaymentStatus;

  amount:
    string;

  currency:
    string;

  /*
   * Public hosted checkout does not need merchantId for
   * security decisions, but the API may still include it
   * in other contexts.
   */
  merchantId?:
    string;

  /*
   * For normal merchant checkout this is usually empty
   * until live payment confirmation securely claims the
   * authenticated Coffer customer.
   *
   * Sandbox payments intentionally do not require a real
   * Coffer customer ID.
   */
  customerId?:
    string;

  merchant:
    CheckoutMerchant;

  orderId?:
    string;

  merchantReference?:
    string;

  provider:
    string;

  sourceType:
    string;

  mode:
    CheckoutPaymentMode;

  returnUrl?:
    string;

  cancelUrl?:
    string;

  createdAt?:
    string;

  updatedAt?:
    string;

  authorizedAt?:
    string;

  capturedAt?:
    string;

  completedAt?:
    string;

  failedAt?:
    string;

  cancelledAt?:
    string;

  expiredAt?:
    string;

  failureCode?:
    string;

  failureMessage?:
    string;

  /*
   * Present only for TEST checkout.
   *
   * These credentials belong to the sandbox environment,
   * not a real Coffer account.
   */
  sandbox?:
    CheckoutSandboxInfo;
}

/* =========================================================
   GET CHECKOUT RESPONSE
========================================================= */

export interface CheckoutPaymentResponse {
  success:
    boolean;

  message?:
    string;

  payment:
    CheckoutPayment;
}

/* =========================================================
   PASSWORD AUTHENTICATION RESPONSE
========================================================= */

export interface AuthenticateCheckoutResponse {
  success:
    boolean;

  message:
    string;

  challengeId:
    string;

  channel:
    CheckoutVerificationChannel;

  target:
    string;

  mode:
    CheckoutPaymentMode;

  expiresInSeconds:
    number;

  /*
   * Returned only for sandbox/test mode.
   */
  testOtp?:
    string;
}

/* =========================================================
   OTP VERIFICATION RESPONSE
========================================================= */

export interface VerifyCheckoutOtpResponse {
  success:
    boolean;

  message:
    string;

  checkoutToken:
    string;

  expiresInSeconds:
    number;

  mode:
    CheckoutPaymentMode;
}

/* =========================================================
   CONFIRMED PAYMENT
========================================================= */

export interface ConfirmedCheckoutPayment {
  id:
    string;

  status:
    CheckoutPaymentStatus;

  amount:
    string;

  currency:
    string;

  merchantId:
    string;

  /*
   * LIVE payment normally returns customerId.
   * TEST sandbox payment may not have one.
   */
  customerId?:
    string;

  orderId?:
    string;

  merchantReference?:
    string;

  provider:
    string;

  sourceType:
    string;

  mode:
    CheckoutPaymentMode;

  checkoutUrl?:
    string;

  returnUrl?:
    string;

  cancelUrl?:
    string;

  failureCode?:
    string;

  failureMessage?:
    string;

  authorizedAt?:
    string;

  capturedAt?:
    string;

  completedAt?:
    string;

  failedAt?:
    string;

  cancelledAt?:
    string;

  expiredAt?:
    string;

  createdAt?:
    string;

  updatedAt?:
    string;
}

/* =========================================================
   CONFIRM RESPONSE
========================================================= */

export interface ConfirmPaymentResponse {
  success:
    boolean;

  duplicate:
    boolean;

  message:
    string;

  payment:
    ConfirmedCheckoutPayment;

  wallet?: {
    balance:
      number;

    currency:
      string;
  };
}

/* =========================================================
   HELPERS
========================================================= */

function normalizePaymentId(
  paymentId:
    string
): string {
  const normalized =
    paymentId.trim();

  if (
    !normalized
  ) {
    throw new Error(
      "Payment ID is required."
    );
  }

  return normalized;
}

function normalizeIdentifier(
  identifier:
    string
): string {
  const normalized =
    identifier.trim();

  if (
    !normalized
  ) {
    throw new Error(
      "Email or phone number is required."
    );
  }

  return normalized;
}

function normalizePassword(
  password:
    string
): string {
  if (
    typeof password !==
      "string" ||
    !password
  ) {
    throw new Error(
      "Password is required."
    );
  }

  return password;
}

function normalizeChallengeId(
  challengeId:
    string
): string {
  const normalized =
    challengeId.trim();

  if (
    !normalized
  ) {
    throw new Error(
      "Checkout challenge ID is required."
    );
  }

  return normalized;
}

function normalizeOtp(
  otp:
    string
): string {
  const normalized =
    otp.trim();

  if (
    !/^\d{6}$/.test(
      normalized
    )
  ) {
    throw new Error(
      "A valid 6-digit verification code is required."
    );
  }

  return normalized;
}

function normalizeCheckoutToken(
  checkoutToken:
    string
): string {
  const normalized =
    checkoutToken.trim();

  if (
    !normalized
  ) {
    throw new Error(
      "Checkout verification is required."
    );
  }

  return normalized;
}

/* =========================================================
   GET PUBLIC CHECKOUT PAYMENT

   GET /api/v1/payments/:paymentId/checkout

   No normal Coffer login/session required.
========================================================= */

export const getCheckoutPayment =
  async (
    paymentId:
      string
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
   PASSWORD VERIFY + SEND OTP

   POST
   /api/v1/payments/:paymentId/checkout/authenticate

   LIVE:
   - email/phone
   - real Coffer password
   - real OTP sent

   TEST:
   - sandbox identifier
   - sandbox password
   - sandbox OTP
========================================================= */

export const authenticateCheckoutCustomer =
  async ({
    paymentId,
    identifier,
    password,
  }: {
    paymentId:
      string;

    identifier:
      string;

    password:
      string;
  }): Promise<AuthenticateCheckoutResponse> => {
    const normalizedPaymentId =
      normalizePaymentId(
        paymentId
      );

    const normalizedIdentifier =
      normalizeIdentifier(
        identifier
      );

    const normalizedPassword =
      normalizePassword(
        password
      );

    const response =
      await apiClient<AuthenticateCheckoutResponse>(
        `/v1/payments/${encodeURIComponent(
          normalizedPaymentId
        )}/checkout/authenticate`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              identifier:
                normalizedIdentifier,

              password:
                normalizedPassword,
            }),
        }
      );

    if (
      !response.success ||
      !response.challengeId
    ) {
      throw new Error(
        response.message ||
          "Unable to verify checkout credentials."
      );
    }

    return response;
  };

/* =========================================================
   VERIFY OTP

   POST
   /api/v1/payments/:paymentId/checkout/verify-otp

   Returns short-lived payment-bound checkout token.
========================================================= */

export const verifyCheckoutOtp =
  async ({
    paymentId,
    challengeId,
    otp,
  }: {
    paymentId:
      string;

    challengeId:
      string;

    otp:
      string;
  }): Promise<VerifyCheckoutOtpResponse> => {
    const normalizedPaymentId =
      normalizePaymentId(
        paymentId
      );

    const normalizedChallengeId =
      normalizeChallengeId(
        challengeId
      );

    const normalizedOtp =
      normalizeOtp(
        otp
      );

    const response =
      await apiClient<VerifyCheckoutOtpResponse>(
        `/v1/payments/${encodeURIComponent(
          normalizedPaymentId
        )}/checkout/verify-otp`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              challengeId:
                normalizedChallengeId,

              otp:
                normalizedOtp,
            }),
        }
      );

    if (
      !response.success ||
      !response.checkoutToken
    ) {
      throw new Error(
        response.message ||
          "Unable to verify checkout OTP."
      );
    }

    return response;
  };

/* =========================================================
   CONFIRM CHECKOUT PAYMENT

   POST /api/v1/payments/:paymentId/confirm

   Authentication:
   X-Checkout-Token

   This token is created only after:

   Password ✅
   OTP ✅
   Live KYC check ✅

   Passkey is NOT mandatory.
========================================================= */

export const confirmCheckoutPayment =
  async (
    paymentId:
      string,

    checkoutToken:
      string
  ): Promise<ConfirmPaymentResponse> => {
    const normalizedPaymentId =
      normalizePaymentId(
        paymentId
      );

    const normalizedCheckoutToken =
      normalizeCheckoutToken(
        checkoutToken
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
            "X-Checkout-Token":
              normalizedCheckoutToken,
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