import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

export interface PasskeySummary {
  _id: string;

  label: string;

  deviceType:
    | "singleDevice"
    | "multiDevice";

  backedUp: boolean;

  transports:
    string[];

  lastUsedAt?: string;

  createdAt: string;
}

export interface TransferAuthorizationPayload {
  recipient: string;

  amount: number;

  reference?: string;

  idempotencyKey: string;
}

export interface PaymentAuthorization {
  token: string;

  expiresAt: string;
}

interface RegistrationOptionsResponse {
  success: boolean;

  flowId: string;

  options:
    PublicKeyCredentialCreationOptionsJSON;
}

interface AuthenticationOptionsResponse {
  success: boolean;

  flowId: string;

  operation:
    | "TRANSFER"
    | "MERCHANT_PAYMENT";

  options:
    PublicKeyCredentialRequestOptionsJSON;
}

interface AuthenticationVerifyResponse {
  success: boolean;

  authorization:
    PaymentAuthorization;
}

/* =========================================================
   HELPERS
========================================================= */

function ensureWebAuthnSupport(): void {
  if (
    typeof window ===
      "undefined" ||
    !(
      "PublicKeyCredential" in
      window
    ) ||
    !navigator.credentials
  ) {
    throw new Error(
      "This browser or device does not support passkeys."
    );
  }
}

function normalizeRequiredText(
  value: string,
  fieldName: string
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  return normalized;
}

function validateAuthorization(
  authorization:
    PaymentAuthorization | undefined
): PaymentAuthorization {
  if (
    !authorization
      ?.token ||
    !authorization
      .expiresAt
  ) {
    throw new Error(
      "Passkey authorization was not returned by the server."
    );
  }

  return authorization;
}

/* =========================================================
   GET PASSKEYS
========================================================= */

export async function getPasskeys(): Promise<
  PasskeySummary[]
> {
  const response =
    await apiClient<{
      success: boolean;

      passkeys:
        PasskeySummary[];
    }>(
      "/passkeys",
      {
        method:
          "GET",
      }
    );

  return response.passkeys;
}

/* =========================================================
   REGISTER DEVICE PASSKEY
========================================================= */

export async function registerDevicePasskey(
  label =
    "Windows Hello"
): Promise<void> {
  ensureWebAuthnSupport();

  const start =
    await apiClient<RegistrationOptionsResponse>(
      "/passkeys/registration/options",
      {
        method:
          "POST",
      }
    );

  const credential:
    RegistrationResponseJSON =
    await startRegistration({
      optionsJSON:
        start.options,
    });

  await apiClient<{
    success: boolean;

    message: string;

    passkeyId: string;
  }>(
    "/passkeys/registration/verify",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          flowId:
            start.flowId,

          label:
            label.trim() ||
            "This device",

          response:
            credential,
        }),
    }
  );
}

/* =========================================================
   REVOKE PASSKEY
========================================================= */

export async function revokeDevicePasskey(
  passkeyId: string
): Promise<void> {
  const normalizedPasskeyId =
    normalizeRequiredText(
      passkeyId,
      "Passkey ID"
    );

  await apiClient<{
    success: boolean;

    message: string;
  }>(
    `/passkeys/${encodeURIComponent(
      normalizedPasskeyId
    )}`,
    {
      method:
        "DELETE",
    }
  );
}

/* =========================================================
   VERIFY AUTHENTICATION FLOW
========================================================= */

async function verifyAuthenticationFlow(
  start:
    AuthenticationOptionsResponse
): Promise<PaymentAuthorization> {
  ensureWebAuthnSupport();

  const credential:
    AuthenticationResponseJSON =
    await startAuthentication({
      optionsJSON:
        start.options,
    });

  const verified =
    await apiClient<AuthenticationVerifyResponse>(
      "/passkeys/payment/verify",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            flowId:
              start.flowId,

            response:
              credential,
          }),
      }
    );

  return validateAuthorization(
    verified.authorization
  );
}

/* =========================================================
   AUTHORIZE SEND MONEY TRANSFER
========================================================= */

export async function authorizeTransferWithPasskey(
  input:
    TransferAuthorizationPayload
): Promise<string> {
  ensureWebAuthnSupport();

  const recipient =
    normalizeRequiredText(
      input.recipient,
      "Recipient"
    );

  const idempotencyKey =
    normalizeRequiredText(
      input.idempotencyKey,
      "Idempotency key"
    );

  if (
    !Number.isFinite(
      input.amount
    ) ||
    input.amount <= 0
  ) {
    throw new Error(
      "A valid transfer amount is required."
    );
  }

  const start =
    await apiClient<AuthenticationOptionsResponse>(
      "/passkeys/payment/options",
      {
        method:
          "POST",

        headers: {
          "Idempotency-Key":
            idempotencyKey,
        },

        body:
          JSON.stringify({
            operation:
              "TRANSFER",

            recipient,

            amount:
              input.amount,

            reference:
              input.reference
                ?.trim() ||
              undefined,
          }),
      }
    );

  const authorization =
    await verifyAuthenticationFlow(
      start
    );

  return authorization.token;
}

/* =========================================================
   AUTHORIZE MERCHANT CHECKOUT PAYMENT

   Only paymentId is sent from the frontend.

   Backend loads the trusted:
   - merchantId
   - amount
   - currency
   - customer access
========================================================= */

export async function authorizeMerchantPaymentWithPasskey(
  paymentId: string
): Promise<string> {
  ensureWebAuthnSupport();

  const normalizedPaymentId =
    normalizeRequiredText(
      paymentId,
      "Payment ID"
    );

  const start =
    await apiClient<AuthenticationOptionsResponse>(
      "/passkeys/payment/options",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            operation:
              "MERCHANT_PAYMENT",

            paymentId:
              normalizedPaymentId,
          }),
      }
    );

  if (
    start.operation !==
    "MERCHANT_PAYMENT"
  ) {
    throw new Error(
      "The server returned an invalid payment authorization operation."
    );
  }

  const authorization =
    await verifyAuthenticationFlow(
      start
    );

  return authorization.token;
}