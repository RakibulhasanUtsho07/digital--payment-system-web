import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

export type FundsAction =
  | "DEPOSIT"
  | "WITHDRAW";

export type PaymentProvider =
  | "bkash"
  | "nagad"
  | "rocket"
  | "upay"
  | "dbbl"
  | "brac"
  | "city"
  | "ebl"
  | "bankasia"
  | "prime"
  | "sonali";

/* =========================================================
   WALLET
========================================================= */

export interface FundsWallet {
  _id: string;

  userId?: string;

  balance: number;

  pendingBalance?: number;

  currency: string;

  status: string;

  createdAt?: string;

  updatedAt?: string;
}

/* =========================================================
   TRANSACTION
========================================================= */

export interface FundsTransaction {
  _id: string;

  type: string;

  status: string;

  amount: number;

  currency?: string;

  reference?: string;

  provider?: string;

  providerTransactionId?: string | null;

  createdAt?: string;
}

/* =========================================================
   SOURCE
========================================================= */

export interface PaymentSourceAccount {
  provider: string;

  accountNumber: string;

  accountName: string;

  availableBalance: number;

  currency?: string;

  status?: string;

  verified?: boolean;
}

/* =========================================================
   PAYMENT
========================================================= */

export interface PaymentResult {
  id?: string;

  provider?: string;

  amount?: number;

  status?: string;

  providerTransactionId?:
    | string
    | null;
}

/* =========================================================
   RESPONSE
========================================================= */

export interface FundsResponse {
  success: boolean;

  duplicate?: boolean;

  message?: string;

  account?: PaymentSourceAccount;

  payment?: PaymentResult;

  wallet?: FundsWallet;

  transaction?: FundsTransaction;
}

/* =========================================================
   SOURCE VALIDATION
========================================================= */

export interface ValidateSourceResponse {
  success: boolean;

  account?: PaymentSourceAccount;

  message?: string;
}

/* =========================================================
   DEPOSIT REQUEST
========================================================= */

export interface DepositRequest {
  provider: PaymentProvider;

  accountNumber: string;

  secretCode: string;

  amount: number;

  reference?: string;

  idempotencyKey: string;
}

/* =========================================================
   WITHDRAW REQUEST
========================================================= */

export interface WithdrawRequest {
  amount: number;

  reference?: string;

  idempotencyKey: string;
}

/* =========================================================
   SECURE REQUEST ID
========================================================= */

function ensureIdempotencyKey(
  value: string
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      "A secure request ID is required."
    );
  }

  return normalized;
}

/* =========================================================
   VALIDATE SOURCE
========================================================= */

export async function validatePaymentSource(
  payload: {
    provider: PaymentProvider;

    accountNumber: string;

    secretCode: string;
  }
): Promise<ValidateSourceResponse> {
  const provider =
    payload.provider
      .trim()
      .toLowerCase();

  const accountNumber =
    payload.accountNumber
      .trim()
      .replace(
        /\s+/g,
        ""
      );

  const secretCode =
    payload.secretCode.trim();

  if (!provider) {
    throw new Error(
      "Payment provider is required."
    );
  }

  if (!accountNumber) {
    throw new Error(
      "Account number is required."
    );
  }

  if (!secretCode) {
    throw new Error(
      "Secret code is required."
    );
  }

  return apiClient<ValidateSourceResponse>(
    "/payment/validate-source",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        provider,

        accountNumber,

        secretCode,
      }),
    }
  );
}

/* =========================================================
   ADD MONEY
========================================================= */

export async function depositFunds(
  payload: DepositRequest
): Promise<FundsResponse> {
  const provider =
    payload.provider
      .trim()
      .toLowerCase();

  const accountNumber =
    payload.accountNumber
      .trim()
      .replace(
        /\s+/g,
        ""
      );

  const secretCode =
    payload.secretCode.trim();

  const reference =
    payload.reference?.trim();

  if (!provider) {
    throw new Error(
      "Payment provider is required."
    );
  }

  if (!accountNumber) {
    throw new Error(
      "Source account number is required."
    );
  }

  if (!secretCode) {
    throw new Error(
      "Source account secret code is required."
    );
  }

  if (
    !Number.isFinite(
      payload.amount
    ) ||
    payload.amount <= 0
  ) {
    throw new Error(
      "Amount must be greater than zero."
    );
  }

  const idempotencyKey =
    ensureIdempotencyKey(
      payload.idempotencyKey
    );

  const body: {
    provider: string;

    accountNumber: string;

    secretCode: string;

    amount: number;

    reference?: string;
  } = {
    provider,

    accountNumber,

    secretCode,

    amount:
      payload.amount,
  };

  if (reference) {
    body.reference =
      reference.slice(
        0,
        160
      );
  }

  return apiClient<FundsResponse>(
    "/payment/add-money",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "Idempotency-Key":
          idempotencyKey,
      },

      body:
        JSON.stringify(body),
    }
  );
}

/* =========================================================
   WITHDRAW
========================================================= */

export async function withdrawFunds(
  payload: WithdrawRequest
): Promise<FundsResponse> {
  const reference =
    payload.reference?.trim();

  if (
    !Number.isFinite(
      payload.amount
    ) ||
    payload.amount <= 0
  ) {
    throw new Error(
      "Amount must be greater than zero."
    );
  }

  const idempotencyKey =
    ensureIdempotencyKey(
      payload.idempotencyKey
    );

  const body: {
    amount: number;

    reference?: string;
  } = {
    amount:
      payload.amount,
  };

  if (reference) {
    body.reference =
      reference.slice(
        0,
        160
      );
  }

  return apiClient<FundsResponse>(
    "/funds/withdraw",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "Idempotency-Key":
          idempotencyKey,
      },

      body:
        JSON.stringify(body),
    }
  );
}

/* =========================================================
   ALIASES
========================================================= */

export const addMoney =
  depositFunds;

export const verifyPaymentSource =
  validatePaymentSource;