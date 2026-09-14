/* =========================================================
   MERCHANT TRANSACTION API
========================================================= */

import { apiClient } from "./client";

/* =========================================================
   TYPES
========================================================= */

export type MerchantTransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type MerchantTransactionType =
  | "PAYMENT"
  | "REFUND"
  | "PAYOUT";

/* =========================================================
   PARAMS
========================================================= */

export interface MerchantTransactionParams {
  page?: number;
  limit?: number;

  search?: string;

  status?: string;

  type?: string;

  currency?: string;

  provider?: string;

  mode?: "test" | "live";

  from?: string;

  to?: string;
}

/* =========================================================
   TRANSACTION
========================================================= */

export interface MerchantTransaction {
  transactionId: string;

  type: MerchantTransactionType;

  paymentId: string;

  orderId: string | null;

  customerId: string | null;

  amount: number;

  feeAmount: number;

  netAmount: number | null;

  currency: string;

  provider: string;

  sourceType: string;

  mode: string;

  status: MerchantTransactionStatus;

  merchantReference: string | null;

  providerReference: string | null;

  createdAt: string;

  completedAt: string | null;

  failedAt: string | null;
}

/* =========================================================
   LIST SUMMARY
========================================================= */

export interface MerchantTransactionSummary {
  totalCount: number;

  totalAmount: number;

  completedCount: number;

  completedAmount: number;

  pendingCount: number;

  failedCount: number;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface MerchantTransactionPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
}

/* =========================================================
   LIST DATA
========================================================= */

export interface MerchantTransactionListData {
  merchant: {
    id: string;

    businessName: string;

    businessDisplayName:
      | string
      | null;

    defaultCurrency: string;
  };

  pagination:
    MerchantTransactionPagination;

  summary:
    MerchantTransactionSummary;

  transactions:
    MerchantTransaction[];
}

/* =========================================================
   DETAIL TIMELINE
========================================================= */

export interface MerchantTransactionTimeline {
  createdAt: string;

  authorizedAt:
    | string
    | null;

  capturedAt:
    | string
    | null;

  completedAt:
    | string
    | null;

  failedAt:
    | string
    | null;

  cancelledAt:
    | string
    | null;

  expiredAt:
    | string
    | null;
}

/* =========================================================
   DETAIL
========================================================= */

export interface MerchantTransactionDetail {
  merchant: {
    id: string;

    businessName: string;

    businessDisplayName:
      | string
      | null;

    defaultCurrency: string;
  };

  transaction: {
    transactionId: string;

    type: "PAYMENT";

    paymentId: string;

    orderId: string | null;

    customerId: string | null;

    amount: number;

    feeAmount: number;

    netAmount:
      | number
      | null;

    currency: string;

    provider: string;

    sourceType: string;

    mode: string;

    status: string;

    merchantReference:
      | string
      | null;

    providerReference:
      | string
      | null;

    failureCode:
      | string
      | null;

    failureMessage:
      | string
      | null;

    idempotencyKey:
      | string
      | null;

    checkoutUrl:
      | string
      | null;

    timeline:
      MerchantTransactionTimeline;
  };
}

/* =========================================================
   API RESPONSE
========================================================= */

interface MerchantTransactionListApiResponse {
  success: boolean;

  data: MerchantTransactionListData;

  message?: string;
}

interface MerchantTransactionDetailApiResponse {
  success: boolean;

  data: MerchantTransactionDetail;

  message?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function setOptionalParam(
  params: URLSearchParams,
  key: string,
  value:
    | string
    | number
    | undefined
): void {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return;
  }

  params.set(
    key,
    String(value)
  );
}

/* =========================================================
   GET MERCHANT TRANSACTIONS
========================================================= */

export async function getMerchantTransactions(
  params: MerchantTransactionParams = {}
): Promise<MerchantTransactionListData> {
  const searchParams =
    new URLSearchParams();

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

  setOptionalParam(
    searchParams,
    "search",
    params.search
  );

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
    "currency",
    params.currency
  );

  setOptionalParam(
    searchParams,
    "provider",
    params.provider
  );

  setOptionalParam(
    searchParams,
    "mode",
    params.mode
  );

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

  const query =
    searchParams.toString();

  const endpoint =
    `/api/merchants/transactions${
      query
        ? `?${query}`
        : ""
    }`;

  const response =
    (await apiClient(
      endpoint,
      {
        method: "GET",
      }
    )) as MerchantTransactionListApiResponse;

  if (
    !response ||
    typeof response !== "object"
  ) {
    throw new Error(
      "Invalid merchant transaction response."
    );
  }

  if (
    response.success === false
  ) {
    throw new Error(
      response.message ||
        "Unable to load merchant transactions."
    );
  }

  if (!response.data) {
    throw new Error(
      response.message ||
        "Merchant transaction data was not returned."
    );
  }

  return response.data;
}

/* =========================================================
   GET SINGLE MERCHANT TRANSACTION
========================================================= */

export async function getMerchantTransactionDetail(
  transactionId: string
): Promise<MerchantTransactionDetail> {
  const normalizedId =
    transactionId.trim();

  if (!normalizedId) {
    throw new Error(
      "Transaction ID is required."
    );
  }

  const response =
    (await apiClient(
      `/api/merchants/transactions/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "GET",
      }
    )) as MerchantTransactionDetailApiResponse;

  if (
    !response ||
    typeof response !== "object"
  ) {
    throw new Error(
      "Invalid merchant transaction detail response."
    );
  }

  if (
    response.success === false
  ) {
    throw new Error(
      response.message ||
        "Unable to load merchant transaction."
    );
  }

  if (!response.data) {
    throw new Error(
      response.message ||
        "Merchant transaction data was not returned."
    );
  }

  return response.data;
}