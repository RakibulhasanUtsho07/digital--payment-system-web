/* =========================================================
   MERCHANT SETTLEMENT API
========================================================= */

import {
  apiClient,
} from "./client";

/* =========================================================
   SHARED TYPES
========================================================= */

export type MerchantSettlementStatus =
  | "pending"
  | "processing"
  | "settled"
  | "failed"
  | "cancelled";

export type MerchantSettlementMode =
  | "test"
  | "live";

/* =========================================================
   SETTLEMENT REFUND
========================================================= */

export interface MerchantSettlementRefund {
  refundId: string;

  paymentId: string;

  customerId:
    | string
    | null;

  amount: number;

  currency: string;

  mode:
    MerchantSettlementMode;

  status: string;

  reason:
    | string
    | null;

  merchantReference:
    | string
    | null;

  ledgerEntryGroupId:
    | string
    | null;

  createdAt:
    | string
    | null;

  completedAt:
    | string
    | null;

  settledAt:
    | string
    | null;
}

/* =========================================================
   RECONCILIATION
========================================================= */

export interface MerchantSettlementReconciliation {
  paymentCount: number;

  refundCount: number;

  refundAmount: number;

  status: string;
}

/* =========================================================
   SETTLEMENT
========================================================= */

export interface MerchantSettlement {
  id: string;

  settlementId: string;

  merchantId:
    | string
    | null;

  /* =======================================================
     PERIOD
  ======================================================== */

  periodStart: string;

  periodEnd: string;

  /* =======================================================
     FINANCIAL
  ======================================================== */

  currency: string;

  paymentCount: number;

  grossAmount: number;

  feeAmount: number;

  refundAmount: number;

  adjustmentAmount: number;

  netAmount: number;

  /* =======================================================
     STATUS
  ======================================================== */

  status:
    MerchantSettlementStatus;

  /* =======================================================
     PAYOUT
  ======================================================== */

  payoutId:
    | string
    | null;

  /* =======================================================
     NOTES / FAILURE
  ======================================================== */

  note:
    | string
    | null;

  failureReason:
    | string
    | null;

  /* =======================================================
     OPTIONAL DETAIL DATA

     Depending on backend response these can either live
     inside settlement or at response.data level.

     The detail page supports both shapes.
  ======================================================== */

  refunds?:
    MerchantSettlementRefund[];

  reconciliation?:
    MerchantSettlementReconciliation;

  /* =======================================================
     TIMESTAMPS
  ======================================================== */

  settledAt:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   SETTLEMENT PAYMENT
========================================================= */

export interface MerchantSettlementPayment {
  paymentId: string;

  orderId:
    | string
    | null;

  customerId:
    | string
    | null;

  amount: number;

  currency: string;

  feeAmount: number;

  netAmount:
    | number
    | null;

  provider: string;

  sourceType: string;

  mode: string;

  merchantReference:
    | string
    | null;

  completedAt:
    | string
    | null;
}

/* =========================================================
   MERCHANT
========================================================= */

export interface MerchantSettlementMerchant {
  id: string;

  businessName: string;

  businessDisplayName:
    | string
    | null;

  defaultCurrency: string;
}

/* =========================================================
   SUMMARY
========================================================= */

export interface MerchantSettlementSummary {
  total: number;

  pending: number;

  processing: number;

  settled: number;

  failed: number;

  cancelled: number;

  grossAmount: number;

  feeAmount: number;

  refundAmount: number;

  netAmount: number;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface MerchantSettlementPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

/* =========================================================
   FILTERS
========================================================= */

export interface MerchantSettlementFilters {
  search: string;

  status:
    | MerchantSettlementStatus
    | null;

  currency:
    | string
    | null;

  from:
    | string
    | null;

  to:
    | string
    | null;
}

/* =========================================================
   LIST PARAMS
========================================================= */

export interface MerchantSettlementListParams {
  page?: number;

  limit?: number;

  search?: string;

  status?:
    | MerchantSettlementStatus
    | "";

  currency?: string;

  from?: string;

  to?: string;
}

/* =========================================================
   LIST DATA
========================================================= */

export interface MerchantSettlementListData {
  merchant:
    MerchantSettlementMerchant;

  settlements:
    MerchantSettlement[];

  summary:
    MerchantSettlementSummary;

  pagination:
    MerchantSettlementPagination;

  filters:
    MerchantSettlementFilters;
}

/* =========================================================
   DETAIL DATA
========================================================= */

export interface MerchantSettlementDetailData {
  merchant:
    MerchantSettlementMerchant;

  settlement:
    MerchantSettlement;

  payments:
    MerchantSettlementPayment[];

  /*
   * Optional because an older backend response may not
   * provide these fields at the root detail-data level.
   */
  refunds?:
    MerchantSettlementRefund[];

  reconciliation?:
    MerchantSettlementReconciliation;
}

/* =========================================================
   LIST RESPONSE
========================================================= */

export interface MerchantSettlementListResponse {
  success: boolean;

  data:
    MerchantSettlementListData;

  message?: string;
}

/* =========================================================
   DETAIL RESPONSE
========================================================= */

export interface MerchantSettlementDetailResponse {
  success: boolean;

  data:
    MerchantSettlementDetailData;

  message?: string;
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
    | null
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
    String(
      value
    )
  );
}

/* =========================================================
   VALIDATE BASIC API RESPONSE
========================================================= */

function validateApiResponse(
  response:
    | {
        success?: boolean;
        message?: string;
      }
    | null
    | undefined,

  fallbackMessage:
    string
): void {
  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      fallbackMessage
    );
  }

  if (
    response.success ===
    false
  ) {
    throw new Error(
      response.message ||
        fallbackMessage
    );
  }
}

/* =========================================================
   GET SETTLEMENTS

   apiClient base URL already contains:

   http://localhost:5000/api

   Therefore this file MUST use:

   /merchants/settlements

   NOT:

   /api/merchants/settlements
========================================================= */

export async function getMerchantSettlements(
  params:
    MerchantSettlementListParams = {}
): Promise<MerchantSettlementListResponse> {
  const query =
    new URLSearchParams();

  /* =======================================================
     PAGINATION
  ======================================================== */

  setOptionalParam(
    query,
    "page",
    params.page
  );

  setOptionalParam(
    query,
    "limit",
    params.limit
  );

  /* =======================================================
     SEARCH
  ======================================================== */

  const normalizedSearch =
    params.search?.trim();

  setOptionalParam(
    query,
    "search",
    normalizedSearch
  );

  /* =======================================================
     STATUS
  ======================================================== */

  setOptionalParam(
    query,
    "status",
    params.status
  );

  /* =======================================================
     CURRENCY
  ======================================================== */

  const normalizedCurrency =
    params.currency
      ?.trim()
      .toUpperCase();

  setOptionalParam(
    query,
    "currency",
    normalizedCurrency
  );

  /* =======================================================
     DATE RANGE
  ======================================================== */

  if (
    params.from &&
    params.to &&
    params.from >
      params.to
  ) {
    throw new Error(
      "From date cannot be later than To date."
    );
  }

  setOptionalParam(
    query,
    "from",
    params.from
  );

  setOptionalParam(
    query,
    "to",
    params.to
  );

  /* =======================================================
     ENDPOINT
  ======================================================== */

  const queryString =
    query.toString();

  const endpoint =
    `/merchants/settlements${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  /* =======================================================
     REQUEST
  ======================================================== */

  const response =
    await apiClient<MerchantSettlementListResponse>(
      endpoint,
      {
        method:
          "GET",
      }
    );

  /* =======================================================
     BASIC VALIDATION
  ======================================================== */

  validateApiResponse(
    response,
    "Unable to load merchant settlements."
  );

  if (
    !response.data ||
    typeof response.data !==
      "object"
  ) {
    throw new Error(
      response.message ||
        "Merchant settlement data was not returned."
    );
  }

  /* =======================================================
     SETTLEMENTS
  ======================================================== */

  if (
    !Array.isArray(
      response.data
        .settlements
    )
  ) {
    throw new Error(
      "Invalid merchant settlement list."
    );
  }

  /* =======================================================
     MERCHANT
  ======================================================== */

  if (
    !response.data
      .merchant ||
    typeof response.data
      .merchant !==
      "object"
  ) {
    throw new Error(
      "Merchant information was not returned."
    );
  }

  /* =======================================================
     SUMMARY
  ======================================================== */

  if (
    !response.data
      .summary ||
    typeof response.data
      .summary !==
      "object"
  ) {
    throw new Error(
      "Settlement summary was not returned."
    );
  }

  /* =======================================================
     PAGINATION
  ======================================================== */

  if (
    !response.data
      .pagination ||
    typeof response.data
      .pagination !==
      "object"
  ) {
    throw new Error(
      "Settlement pagination was not returned."
    );
  }

  return response;
}

/* =========================================================
   GET SETTLEMENT DETAIL

   Final backend URL:

   GET
   /api/merchants/settlements/:settlementId

   Because apiClient already contains /api,
   this function uses:

   /merchants/settlements/:settlementId
========================================================= */

export async function getMerchantSettlementDetail(
  settlementId:
    string
): Promise<MerchantSettlementDetailResponse> {
  const normalizedSettlementId =
    settlementId.trim();

  if (
    !normalizedSettlementId
  ) {
    throw new Error(
      "Settlement ID is required."
    );
  }

  /* =======================================================
     REQUEST
  ======================================================== */

  const response =
    await apiClient<MerchantSettlementDetailResponse>(
      `/merchants/settlements/${encodeURIComponent(
        normalizedSettlementId
      )}`,
      {
        method:
          "GET",
      }
    );

  /* =======================================================
     BASIC VALIDATION
  ======================================================== */

  validateApiResponse(
    response,
    "Unable to load settlement."
  );

  if (
    !response.data ||
    typeof response.data !==
      "object"
  ) {
    throw new Error(
      response.message ||
        "Settlement detail data was not returned."
    );
  }

  /* =======================================================
     SETTLEMENT
  ======================================================== */

  if (
    !response.data
      .settlement ||
    typeof response.data
      .settlement !==
      "object"
  ) {
    throw new Error(
      response.message ||
        "Settlement data was not returned."
    );
  }

  /* =======================================================
     MERCHANT
  ======================================================== */

  if (
    !response.data
      .merchant ||
    typeof response.data
      .merchant !==
      "object"
  ) {
    throw new Error(
      "Merchant information was not returned."
    );
  }

  /* =======================================================
     PAYMENTS

     Required by the detail page.
  ======================================================== */

  if (
    !Array.isArray(
      response.data
        .payments
    )
  ) {
    throw new Error(
      "Settlement payment data was not returned."
    );
  }

  /* =======================================================
     REFUNDS

     Optional for backwards compatibility.
     Validate only when backend sends it.
  ======================================================== */

  if (
    response.data
      .refunds !==
      undefined &&
    !Array.isArray(
      response.data
        .refunds
    )
  ) {
    throw new Error(
      "Invalid settlement refund data."
    );
  }

  /* =======================================================
     NESTED SETTLEMENT REFUNDS

     Also optional because some backend versions may place
     reconciliation data inside settlement.
  ======================================================== */

  if (
    response.data
      .settlement
      .refunds !==
      undefined &&
    !Array.isArray(
      response.data
        .settlement
        .refunds
    )
  ) {
    throw new Error(
      "Invalid nested settlement refund data."
    );
  }

  /* =======================================================
     ROOT RECONCILIATION
  ======================================================== */

  if (
    response.data
      .reconciliation !==
      undefined &&
    (
      !response.data
        .reconciliation ||
      typeof response.data
        .reconciliation !==
        "object"
    )
  ) {
    throw new Error(
      "Invalid settlement reconciliation data."
    );
  }

  /* =======================================================
     NESTED RECONCILIATION
  ======================================================== */

  if (
    response.data
      .settlement
      .reconciliation !==
      undefined &&
    (
      !response.data
        .settlement
        .reconciliation ||
      typeof response.data
        .settlement
        .reconciliation !==
        "object"
    )
  ) {
    throw new Error(
      "Invalid nested settlement reconciliation data."
    );
  }

  return response;
}