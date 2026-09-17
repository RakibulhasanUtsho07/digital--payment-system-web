/* =========================================================
   MERCHANT PAYOUT API
========================================================= */

import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export type MerchantPayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type MerchantPayoutMethod =
  | "bank"
  | "mobile_wallet"
  | "wallet"
  | "other";

/* =========================================================
   PAYOUT
========================================================= */

export interface MerchantPayout {
  id: string;

  payoutId: string;

  merchantId:
    | string
    | null;

  amount: number;

  currency: string;

  feeAmount: number;

  netAmount: number;

  payoutMethod:
    MerchantPayoutMethod;

  destination:
    | string
    | null;

  destinationReference:
    | string
    | null;

  status:
    MerchantPayoutStatus;

  merchantReference:
    | string
    | null;

  externalReference:
    | string
    | null;

  failureReason:
    | string
    | null;

  ledgerEntryGroupId:
    | string
    | null;

  requestedAt: string;

  processingAt:
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

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   SUMMARY
========================================================= */

export interface MerchantPayoutSummary {
  total: number;

  pending: number;

  processing: number;

  completed: number;

  failed: number;

  cancelled: number;

  totalAmount: number;

  pendingAmount: number;

  completedAmount: number;
}

/* =========================================================
   BALANCE
========================================================= */

export interface MerchantPayoutBalance {
  currency: string;

  ledgerBalance: number;

  reservedAmount: number;

  availableBalance: number;
}

/* =========================================================
   MERCHANT
========================================================= */

export interface MerchantPayoutMerchant {
  id: string;

  businessName: string;

  businessDisplayName:
    | string
    | null;

  defaultCurrency: string;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface MerchantPayoutPagination {
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

export interface MerchantPayoutFilters {
  search: string;

  status:
    | MerchantPayoutStatus
    | null;

  payoutMethod:
    | MerchantPayoutMethod
    | null;

  from:
    | string
    | null;

  to:
    | string
    | null;
}

/* =========================================================
   LIST RESPONSE
========================================================= */

export interface MerchantPayoutListResponse {
  success: boolean;

  data: {
    merchant:
      MerchantPayoutMerchant;

    payouts:
      MerchantPayout[];

    summary:
      MerchantPayoutSummary;

    balance:
      MerchantPayoutBalance;

    pagination:
      MerchantPayoutPagination;

    filters:
      MerchantPayoutFilters;
  };

  message?: string;
}

/* =========================================================
   DETAIL RESPONSE
========================================================= */

export interface MerchantPayoutDetailResponse {
  success: boolean;

  data: {
    merchant:
      MerchantPayoutMerchant;

    payout:
      MerchantPayout;
  };

  message?: string;
}

/* =========================================================
   CREATE PAYLOAD
========================================================= */

export interface CreateMerchantPayoutPayload {
  amount: number;

  currency?: string;

  payoutMethod:
    MerchantPayoutMethod;

  destination?: string;

  destinationReference?: string;

  merchantReference?: string;

  idempotencyKey?: string;
}

/* =========================================================
   CREATE RESPONSE
========================================================= */

export interface CreateMerchantPayoutResponse {
  success: boolean;

  data: {
    duplicate: boolean;

    payout:
      MerchantPayout;

    balance?: {
      currency: string;

      currentBalance: number;

      reservedAmount: number;

      availableAfterRequest: number;
    };
  };

  message?: string;
}

/* =========================================================
   LIST PARAMS
========================================================= */

export interface MerchantPayoutListParams {
  page?: number;

  limit?: number;

  search?: string;

  status?:
    | MerchantPayoutStatus
    | "";

  payoutMethod?:
    | MerchantPayoutMethod
    | "";

  from?: string;

  to?: string;
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

function ensureSuccess(
  response: {
    success: boolean;
    message?: string;
  },

  fallbackMessage:
    string
): void {
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
   LIST PAYOUTS

   FINAL BACKEND URL:
   /api/merchants/payouts

   IMPORTANT:
   apiClient base URL already contains /api

   Therefore here we use:
   /merchants/payouts
========================================================= */

export async function getMerchantPayouts(
  params:
    MerchantPayoutListParams = {}
): Promise<MerchantPayoutListResponse> {
  const query =
    new URLSearchParams();

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

  setOptionalParam(
    query,
    "search",
    params.search?.trim()
  );

  setOptionalParam(
    query,
    "status",
    params.status
  );

  setOptionalParam(
    query,
    "payoutMethod",
    params.payoutMethod
  );

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

  const queryString =
    query.toString();

  /*
   * DO NOT use:
   *
   * /api/merchants/payouts
   *
   * Because apiClient already points to:
   *
   * http://localhost:5000/api
   *
   * Otherwise it becomes:
   *
   * /api/api/merchants/payouts
   */
  const endpoint =
    `/merchants/payouts${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  const response =
    await apiClient<MerchantPayoutListResponse>(
      endpoint,
      {
        method:
          "GET",
      }
    );

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid merchant payout response."
    );
  }

  ensureSuccess(
    response,
    "Unable to load merchant payouts."
  );

  if (
    !response.data
  ) {
    throw new Error(
      response.message ||
        "Merchant payout data was not returned."
    );
  }

  if (
    !Array.isArray(
      response.data.payouts
    )
  ) {
    throw new Error(
      "Invalid merchant payout list."
    );
  }

  return response;
}

/* =========================================================
   GET PAYOUT DETAIL

   FINAL BACKEND URL:
   /api/merchants/payouts/:payoutId
========================================================= */

export async function getMerchantPayoutDetail(
  payoutId:
    string
): Promise<MerchantPayoutDetailResponse> {
  const normalizedPayoutId =
    payoutId.trim();

  if (
    !normalizedPayoutId
  ) {
    throw new Error(
      "Payout ID is required."
    );
  }

  const response =
    await apiClient<MerchantPayoutDetailResponse>(
      `/merchants/payouts/${encodeURIComponent(
        normalizedPayoutId
      )}`,
      {
        method:
          "GET",
      }
    );

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid merchant payout detail response."
    );
  }

  ensureSuccess(
    response,
    "Unable to load payout."
  );

  if (
    !response.data?.payout
  ) {
    throw new Error(
      response.message ||
        "Payout data was not returned."
    );
  }

  return response;
}

/* =========================================================
   CREATE PAYOUT

   FINAL BACKEND URL:
   POST /api/merchants/payouts
========================================================= */

export async function createMerchantPayout(
  payload:
    CreateMerchantPayoutPayload
): Promise<CreateMerchantPayoutResponse> {
  if (
    !Number.isFinite(
      payload.amount
    ) ||
    payload.amount <=
      0
  ) {
    throw new Error(
      "Payout amount must be greater than zero."
    );
  }

  if (
    !payload.payoutMethod
  ) {
    throw new Error(
      "Payout method is required."
    );
  }

  const normalizedPayload:
    CreateMerchantPayoutPayload = {
      amount:
        payload.amount,

      payoutMethod:
        payload.payoutMethod,

      ...(payload.currency?.trim()
        ? {
            currency:
              payload.currency
                .trim()
                .toUpperCase(),
          }
        : {}),

      ...(payload.destination?.trim()
        ? {
            destination:
              payload.destination.trim(),
          }
        : {}),

      ...(payload.destinationReference?.trim()
        ? {
            destinationReference:
              payload.destinationReference.trim(),
          }
        : {}),

      ...(payload.merchantReference?.trim()
        ? {
            merchantReference:
              payload.merchantReference.trim(),
          }
        : {}),

      ...(payload.idempotencyKey?.trim()
        ? {
            idempotencyKey:
              payload.idempotencyKey.trim(),
          }
        : {}),
    };

  const response =
    await apiClient<CreateMerchantPayoutResponse>(
      "/merchants/payouts",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...(normalizedPayload
            .idempotencyKey
            ? {
                "Idempotency-Key":
                  normalizedPayload
                    .idempotencyKey,
              }
            : {}),
        },

        body:
          JSON.stringify(
            normalizedPayload
          ),
      }
    );

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid create payout response."
    );
  }

  ensureSuccess(
    response,
    "Unable to create payout request."
  );

  if (
    !response.data?.payout
  ) {
    throw new Error(
      response.message ||
        "Created payout data was not returned."
    );
  }

  return response;
}