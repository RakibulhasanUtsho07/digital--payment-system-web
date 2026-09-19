import { apiClient } from "@/lib/api/client";

/* =========================================================
   TRANSACTION TYPES
========================================================= */

export type TransactionType =
  | "TRANSFER"
  | "DEPOSIT"
  | "WITHDRAW"
  | "PAYMENT"
  | "REFUND";

export type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type TransactionSource =
  | "WALLET"
  | "ADD_MONEY"
  | "MERCHANT_PAYMENT"
  | "MERCHANT_REFUND";

export type TransactionIntegrity =
  | "VERIFIED"
  | "UNREADABLE";

export type TransactionPartyKind =
  | "USER"
  | "MERCHANT"
  | "PROVIDER"
  | "PLATFORM";

export type TransactionMode =
  | "test"
  | "live"
  | string;

export type TransactionRiskScore =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | string;

/* =========================================================
   TRANSACTION USER / PARTY
========================================================= */

export interface TransactionUser {
  _id: string;

  /*
   * USER
   * MERCHANT
   * PROVIDER
   * PLATFORM
   */
  kind?: TransactionPartyKind;

  /*
   * কিছু legacy transaction-এ এগুলো নাও থাকতে পারে।
   */
  name?: string;
  email?: string;
  phone?: string;
}

/*
 * Backend populate করলে TransactionUser আসবে।
 * Populate না হলে শুধু MongoDB id string আসতে পারে।
 */
export type TransactionParty =
  | TransactionUser
  | string;

/* =========================================================
   TRANSACTION ITEM
========================================================= */

export interface TransactionItem {
  /*
   * Internal MongoDB transaction id.
   */
  _id: string;

  /*
   * Public-facing transaction id.
   *
   * Example:
   * TXN-20260918-XXXX
   *
   * Legacy transaction-এ এটি নাও থাকতে পারে।
   */
  publicId?: string;

  /*
   * Sender এবং receiver populated user/merchant/provider
   * অথবা raw MongoDB id হতে পারে।
   */
  senderId: TransactionParty;

  receiverId: TransactionParty;

  /*
   * IMPORTANT:
   *
   * Frontend কখনো amountEncrypted handle করবে না।
   *
   * Backend encrypted amount decrypt করে
   * major currency units frontend-এ পাঠাবে।
   *
   * Example:
   * 500
   * 1250.75
   *
   * `null` হলে বুঝতে হবে legacy record-এর encrypted
   * amount current encryption key দিয়ে authenticate/decrypt
   * করা যায়নি।
   *
   * Frontend এই amount guess করবে না।
   */
  amount: number | null;

  /*
   * Example:
   * BDT
   * USD
   */
  currency: string;

  /*
   * Main transaction category.
   */
  type: TransactionType;

  /*
   * Transaction current status.
   */
  status: TransactionStatus;

  /*
   * Transaction কোথা থেকে unified ledger-এ এসেছে।
   *
   * WALLET
   * ADD_MONEY
   * MERCHANT_PAYMENT
   * MERCHANT_REFUND
   */
  source?: TransactionSource;

  /*
   * Encryption/data integrity status.
   *
   * VERIFIED:
   * encrypted value successfully authenticated.
   *
   * UNREADABLE:
   * legacy encrypted value current key দিয়ে
   * authenticate করা যায়নি।
   */
  integrity?: TransactionIntegrity;

  /*
   * Backend referenceEncrypted decrypt করে
   * safe reference frontend-এ পাঠাবে।
   *
   * Frontend referenceEncrypted handle করবে না।
   */
  reference?: string;

  /*
   * Optional human-readable transaction description.
   */
  description?: string;

  /*
   * Add-money/payment provider.
   *
   * Example:
   * bKash
   * Nagad
   * Stripe
   * SSLCommerz
   */
  provider?: string;

  /*
   * Environment / payment mode.
   */
  mode?: TransactionMode;

  /*
   * Backend generated risk score.
   */
  riskScore?: TransactionRiskScore;

  createdAt?: string;

  updatedAt?: string;
}

/* =========================================================
   MY TRANSACTIONS RESPONSE
========================================================= */

export interface TransactionsResponse {
  success: boolean;

  count: number;

  transactions: TransactionItem[];

  message?: string;
}

/* =========================================================
   ADMIN TRANSACTION META
========================================================= */

export interface AdminTransactionsMeta {
  /*
   * যেসব legacy record-এর encrypted amount
   * current key দিয়ে readable না।
   */
  integrityWarnings: number;

  /*
   * Unified ledger-এর source অনুযায়ী transaction count.
   */
  sourceCounts: Record<
    TransactionSource,
    number
  >;
}

/* =========================================================
   ADMIN UNIFIED LEDGER RESPONSE
========================================================= */

export interface AdminTransactionsResponse
  extends TransactionsResponse {
  meta: AdminTransactionsMeta;
}

/* =========================================================
   SINGLE TRANSACTION RESPONSE
========================================================= */

export interface TransactionDetailsResponse {
  success: boolean;

  transaction: TransactionItem;

  message?: string;
}

/* =========================================================
   GET MY TRANSACTIONS

   Logged-in user-এর নিজের transactions।
========================================================= */

export async function getMyTransactions(): Promise<TransactionsResponse> {
  return apiClient<TransactionsResponse>(
    "/transactions",
    {
      method: "GET",
    }
  );
}

/* =========================================================
   GET ADMIN UNIFIED TRANSACTION LEDGER

   Includes:
   - Wallet transfers
   - Add money
   - Merchant payments
   - Merchant refunds
   - Withdrawals
========================================================= */

export async function getAdminTransactions(): Promise<AdminTransactionsResponse> {
  return apiClient<AdminTransactionsResponse>(
    "/admin/transactions",
    {
      method: "GET",
    }
  );
}

/* =========================================================
   GET TRANSACTION BY ID
========================================================= */

export async function getTransactionById(
  id: string
): Promise<TransactionDetailsResponse> {
  /*
   * Accidental whitespace remove করা হচ্ছে।
   */
  const normalizedId = id.trim();

  if (!normalizedId) {
    throw new Error(
      "Transaction ID is required."
    );
  }

  return apiClient<TransactionDetailsResponse>(
    `/transactions/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "GET",
    }
  );
}