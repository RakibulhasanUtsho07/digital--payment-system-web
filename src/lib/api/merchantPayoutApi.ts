

/* =========================================================
   TYPES
========================================================= */

import { apiClient } from "./client";

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

export interface MerchantPayout {
  id: string;
  payoutId: string;
  merchantId: string | null;

  amount: number;
  currency: string;
  feeAmount: number;
  netAmount: number;

  payoutMethod: MerchantPayoutMethod;

  destination: string | null;
  destinationReference: string | null;

  status: MerchantPayoutStatus;

  merchantReference: string | null;
  externalReference: string | null;
  failureReason: string | null;

  ledgerEntryGroupId: string | null;

  requestedAt: string;
  processingAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;
}

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

export interface MerchantPayoutBalance {
  currency: string;
  ledgerBalance: number;
  reservedAmount: number;
  availableBalance: number;
}

export interface MerchantPayoutMerchant {
  id: string;
  businessName: string;
  businessDisplayName: string | null;
  defaultCurrency: string;
}

export interface MerchantPayoutListResponse {
  success: boolean;

  data: {
    merchant: MerchantPayoutMerchant;

    payouts: MerchantPayout[];

    summary: MerchantPayoutSummary;

    balance: MerchantPayoutBalance;

    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };

    filters: {
      search: string;
      status: MerchantPayoutStatus | null;
      payoutMethod: MerchantPayoutMethod | null;
      from: string | null;
      to: string | null;
    };
  };

  message?: string;
}

export interface MerchantPayoutDetailResponse {
  success: boolean;

  data: {
    merchant: MerchantPayoutMerchant;
    payout: MerchantPayout;
  };

  message?: string;
}

export interface CreateMerchantPayoutPayload {
  amount: number;
  currency?: string;
  payoutMethod: MerchantPayoutMethod;

  destination?: string;

  destinationReference?: string;

  merchantReference?: string;

  idempotencyKey?: string;
}

/* =========================================================
   LIST PAYOUTS
========================================================= */

export async function getMerchantPayouts(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: MerchantPayoutStatus | "";
    payoutMethod?: MerchantPayoutMethod | "";
    from?: string;
    to?: string;
  } = {}
): Promise<MerchantPayoutListResponse> {
  const query =
    new URLSearchParams();

  if (
    params.page !==
    undefined
  ) {
    query.set(
      "page",
      String(params.page)
    );
  }

  if (
    params.limit !==
    undefined
  ) {
    query.set(
      "limit",
      String(params.limit)
    );
  }

  if (params.search) {
    query.set(
      "search",
      params.search
    );
  }

  if (params.status) {
    query.set(
      "status",
      params.status
    );
  }

  if (params.payoutMethod) {
    query.set(
      "payoutMethod",
      params.payoutMethod
    );
  }

  if (params.from) {
    query.set(
      "from",
      params.from
    );
  }

  if (params.to) {
    query.set(
      "to",
      params.to
    );
  }

  const queryString =
    query.toString();

  const url =
    `/api/merchants/payouts${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  return apiClient<MerchantPayoutListResponse>(
    url,
    {
      method: "GET",
    }
  );
}

/* =========================================================
   GET PAYOUT DETAIL
========================================================= */

export async function getMerchantPayoutDetail(
  payoutId: string
): Promise<MerchantPayoutDetailResponse> {
  return apiClient<MerchantPayoutDetailResponse>(
    `/api/merchants/payouts/${encodeURIComponent(
      payoutId
    )}`,
    {
      method: "GET",
    }
  );
}

/* =========================================================
   CREATE PAYOUT
========================================================= */

export async function createMerchantPayout(
  payload: CreateMerchantPayoutPayload
): Promise<{
  success: boolean;
  data: {
    duplicate: boolean;
    payout: MerchantPayout;

    balance?: {
      currency: string;
      currentBalance: number;
      reservedAmount: number;
      availableAfterRequest: number;
    };
  };
  message?: string;
}> {
  return apiClient(
    "/api/merchants/payouts",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        ...(payload.idempotencyKey
          ? {
              "Idempotency-Key":
                payload.idempotencyKey,
            }
          : {}),
      },

      body: JSON.stringify(
        payload
      ),
    }
  );
}