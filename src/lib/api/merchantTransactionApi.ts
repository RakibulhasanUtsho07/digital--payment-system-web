/* =========================================================
   MERCHANT TRANSACTION API
========================================================= */

import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export type MerchantTransactionStatus =
  | "POSTED"
  | "REVERSED";

export type MerchantTransactionType =
  | "PAYMENT"
  | "REFUND"
  | "PAYOUT"
  | "FEE"
  | "ADJUSTMENT"
  | "REVERSAL";

export type MerchantTransactionDirection =
  | "CREDIT"
  | "DEBIT";

export type MerchantLedgerReferenceType =
  | "payment"
  | "payment_attempt"
  | "order"
  | "refund"
  | "payout"
  | "transfer"
  | "settlement"
  | "invoice"
  | "subscription"
  | "dispute"
  | "wallet"
  | "adjustment"
  | "provider"
  | "fee";

/* =========================================================
   MERCHANT
========================================================= */

export interface MerchantTransactionMerchant {
  id: string;

  businessName: string;

  businessDisplayName:
    | string
    | null;

  defaultCurrency: string;

  status:
    | string
    | null;

  verificationStatus:
    | string
    | null;
}

/* =========================================================
   PARAMS
========================================================= */

export interface MerchantTransactionParams {
  page?: number;

  limit?: number;

  search?: string;

  status?:
    | MerchantTransactionStatus
    | "";

  type?:
    | MerchantTransactionType
    | "";

  direction?:
    | MerchantTransactionDirection
    | "";

  currency?: string;

  from?: string;

  to?: string;
}

/* =========================================================
   TRANSACTION
========================================================= */

export interface MerchantTransaction {
  /*
   * Ledger entry ID.
   *
   * Example:
   * led_xxxxx
   */
  transactionId: string;

  /*
   * Balanced ledger operation group.
   *
   * Example:
   * ledgrp_xxxxx
   */
  entryGroupId: string;

  type:
    MerchantTransactionType;

  direction:
    MerchantTransactionDirection;

  /*
   * Absolute ledger amount.
   */
  amount: number;

  /*
   * Signed merchant balance effect.
   *
   * CREDIT => positive
   * DEBIT  => negative
   */
  balanceImpact: number;

  currency: string;

  status:
    MerchantTransactionStatus;

  /*
   * Source financial object.
   *
   * Example:
   * payment
   * refund
   * payout
   */
  referenceType:
    MerchantLedgerReferenceType;

  /*
   * Public source ID.
   *
   * Example:
   * pay_xxx
   * re_xxx
   * payout_xxx
   */
  referenceId: string;

  /* =======================================================
     RELATED DOMAIN REFERENCES
  ======================================================== */

  paymentId:
    | string
    | null;

  refundId:
    | string
    | null;

  payoutId:
    | string
    | null;

  merchantReference:
    | string
    | null;

  /* =======================================================
     SOURCE CONTEXT

     Available when the ledger entry is connected
     to a source record such as Payment.
  ======================================================== */

  provider:
    | string
    | null;

  sourceType:
    | string
    | null;

  mode:
    | string
    | null;

  sourceStatus:
    | string
    | null;

  /* =======================================================
     LEDGER INFORMATION
  ======================================================== */

  description:
    | string
    | null;

  metadata:
    | Record<
        string,
        unknown
      >
    | null;

  isReversal: boolean;

  effectiveAt: string;

  createdAt: string;
}

/* =========================================================
   LIST SUMMARY
========================================================= */

export interface MerchantTransactionSummary {
  currency: string;

  /*
   * Ledger entry counts.
   */
  transactionCount: number;

  postedCount: number;

  reversedCount: number;

  reversalCount: number;

  /*
   * Gross direction totals.
   */
  totalCredits: number;

  totalDebits: number;

  /*
   * Current merchant payable position.
   */
  ledgerBalance: number;

  /*
   * Pending/processing payout reservations.
   */
  reservedPayoutAmount: number;

  /*
   * ledgerBalance - reservedPayoutAmount
   */
  availableBalance: number;

  pendingPayoutCount: number;

  /*
   * Financial breakdown.
   */
  paymentCredits: number;

  refundDebits: number;

  payoutDebits: number;

  feeDebits: number;

  /*
   * Net effects including reversals.
   */
  paymentNetImpact: number;

  refundNetImpact: number;

  payoutNetImpact: number;

  feeNetImpact: number;

  adjustmentNetImpact: number;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface MerchantTransactionPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

/* =========================================================
   RESPONSE FILTERS
========================================================= */

export interface MerchantTransactionAppliedFilters {
  search:
    | string
    | null;

  type:
    | MerchantTransactionType
    | null;

  direction:
    | MerchantTransactionDirection
    | null;

  status:
    | MerchantTransactionStatus
    | null;

  currency: string;

  from:
    | string
    | null;

  to:
    | string
    | null;
}

/* =========================================================
   LIST DATA
========================================================= */

export interface MerchantTransactionListData {
  merchant:
    MerchantTransactionMerchant;

  summary:
    MerchantTransactionSummary;

  transactions:
    MerchantTransaction[];

  pagination:
    MerchantTransactionPagination;

  filters:
    MerchantTransactionAppliedFilters;
}

/* =========================================================
   LEDGER GROUP ENTRY
========================================================= */

export interface MerchantLedgerGroupEntry {
  transactionId: string;

  direction:
    MerchantTransactionDirection;

  amount: number;

  balanceImpact: number;

  currency: string;

  referenceType:
    MerchantLedgerReferenceType;

  referenceId: string;

  description:
    | string
    | null;

  status:
    MerchantTransactionStatus;

  effectiveAt: string;

  createdAt: string;
}

/* =========================================================
   DETAIL
========================================================= */

export interface MerchantTransactionDetail {
  merchant:
    MerchantTransactionMerchant;

  transaction:
    MerchantTransaction;

  /*
   * Only merchant-side lines from the same
   * balanced ledger operation are returned.
   *
   * Customer/platform counterparty ledger lines
   * are not exposed through merchant dashboard.
   */
  ledgerGroup: {
    entryGroupId: string;

    entries:
      MerchantLedgerGroupEntry[];
  };
}

/* =========================================================
   API RESPONSE
========================================================= */

interface MerchantTransactionListApiResponse {
  success: boolean;

  data:
    MerchantTransactionListData;

  message?: string;

  code?: string;
}

interface MerchantTransactionDetailApiResponse {
  success: boolean;

  data:
    MerchantTransactionDetail;

  message?: string;

  code?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function setOptionalParam(
  params:
    URLSearchParams,

  key:
    string,

  value:
    | string
    | number
    | undefined
    | null
): void {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return;
  }

  params.set(
    key,
    String(
      value
    )
  );
}

/* =========================================================
   GET MERCHANT TRANSACTIONS

   Backend:
   GET /api/merchants/transactions

   IMPORTANT:
   apiClient already prefixes NEXT_PUBLIC_API_URL.

   Example:
   NEXT_PUBLIC_API_URL=http://localhost:5000/api

   Therefore endpoint here must be:
   /merchants/transactions

   NOT:
   /api/merchants/transactions
========================================================= */

export async function getMerchantTransactions(
  params:
    MerchantTransactionParams = {}
): Promise<
  MerchantTransactionListData
> {
  const searchParams =
    new URLSearchParams();

  /* -------------------------------------------------------
     PAGINATION
  ------------------------------------------------------- */

  setOptionalParam(
    searchParams,
    "page",
    params.page
  );

  setOptionalParam(
    searchParams,
    "limit",
    params.limit
  );

  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  setOptionalParam(
    searchParams,
    "search",
    params.search?.trim()
  );

  /* -------------------------------------------------------
     LEDGER FILTERS
  ------------------------------------------------------- */

  setOptionalParam(
    searchParams,
    "status",
    params.status
  );

  setOptionalParam(
    searchParams,
    "type",
    params.type
  );

  setOptionalParam(
    searchParams,
    "direction",
    params.direction
  );

  setOptionalParam(
    searchParams,
    "currency",
    params.currency
      ?.trim()
      .toUpperCase()
  );

  /* -------------------------------------------------------
     DATE RANGE
  ------------------------------------------------------- */

  setOptionalParam(
    searchParams,
    "from",
    params.from
  );

  setOptionalParam(
    searchParams,
    "to",
    params.to
  );

  /* -------------------------------------------------------
     ENDPOINT
  ------------------------------------------------------- */

  const query =
    searchParams.toString();

  const endpoint =
    `/merchants/transactions${
      query
        ? `?${query}`
        : ""
    }`;

  /* -------------------------------------------------------
     REQUEST
  ------------------------------------------------------- */

  const response =
    await apiClient<
      MerchantTransactionListApiResponse
    >(
      endpoint,
      {
        method:
          "GET",
      }
    );

  /* -------------------------------------------------------
     VALIDATE RESPONSE
  ------------------------------------------------------- */

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid merchant transaction response."
    );
  }

  if (
    response.success ===
    false
  ) {
    throw new Error(
      response.message ||
        "Unable to load merchant transactions."
    );
  }

  if (
    !response.data
  ) {
    throw new Error(
      response.message ||
        "Merchant transaction data was not returned."
    );
  }

  return response.data;
}

/* =========================================================
   GET SINGLE MERCHANT TRANSACTION

   Backend:
   GET /api/merchants/transactions/:transactionId
========================================================= */

export async function getMerchantTransactionDetail(
  transactionId:
    string
): Promise<
  MerchantTransactionDetail
> {
  const normalizedId =
    transactionId.trim();

  if (
    !normalizedId
  ) {
    throw new Error(
      "Transaction ID is required."
    );
  }

  const response =
    await apiClient<
      MerchantTransactionDetailApiResponse
    >(
      `/merchants/transactions/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method:
          "GET",
      }
    );

  /* -------------------------------------------------------
     VALIDATE RESPONSE
  ------------------------------------------------------- */

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid merchant transaction detail response."
    );
  }

  if (
    response.success ===
    false
  ) {
    throw new Error(
      response.message ||
        "Unable to load merchant transaction."
    );
  }

  if (
    !response.data
  ) {
    throw new Error(
      response.message ||
        "Merchant transaction data was not returned."
    );
  }

  return response.data;
}