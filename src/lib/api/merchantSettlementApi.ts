

/* =========================================================
   TYPES
========================================================= */

import { apiClient } from "./client";

export type MerchantSettlementStatus =
  | "pending"
  | "processing"
  | "settled"
  | "failed"
  | "cancelled";

export interface MerchantSettlement {
  id: string;
  settlementId: string;
  merchantId: string | null;

  periodStart: string;
  periodEnd: string;

  currency: string;

  paymentCount: number;

  grossAmount: number;
  feeAmount: number;
  refundAmount: number;
  adjustmentAmount: number;
  netAmount: number;

  status: MerchantSettlementStatus;

  payoutId: string | null;

  note: string | null;
  failureReason: string | null;

  settledAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface MerchantSettlementPayment {
  paymentId: string;
  orderId: string | null;
  customerId: string | null;

  amount: number;
  currency: string;

  feeAmount: number;
  netAmount: number | null;

  provider: string;
  sourceType: string;
  mode: string;

  merchantReference: string | null;

  completedAt: string | null;
}

export interface MerchantSettlementMerchant {
  id: string;
  businessName: string;
  businessDisplayName: string | null;
  defaultCurrency: string;
}

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

export interface MerchantSettlementListResponse {
  success: boolean;

  data: {
    merchant: MerchantSettlementMerchant;

    settlements: MerchantSettlement[];

    summary: MerchantSettlementSummary;

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
      status: MerchantSettlementStatus | null;
      currency: string | null;
      from: string | null;
      to: string | null;
    };
  };

  message?: string;
}

export interface MerchantSettlementDetailResponse {
  success: boolean;

  data: {
    merchant: MerchantSettlementMerchant;

    settlement: MerchantSettlement;

    payments: MerchantSettlementPayment[];
  };

  message?: string;
}

/* =========================================================
   GET SETTLEMENTS
========================================================= */

export async function getMerchantSettlements(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: MerchantSettlementStatus | "";
    currency?: string;
    from?: string;
    to?: string;
  } = {}
): Promise<MerchantSettlementListResponse> {
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

  if (params.currency) {
    query.set(
      "currency",
      params.currency
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
    `/api/merchants/settlements${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  return apiClient<MerchantSettlementListResponse>(
    url,
    {
      method: "GET",
    }
  );
}

/* =========================================================
   GET SETTLEMENT DETAIL
========================================================= */

export async function getMerchantSettlementDetail(
  settlementId: string
): Promise<MerchantSettlementDetailResponse> {
  return apiClient<MerchantSettlementDetailResponse>(
    `/api/merchants/settlements/${encodeURIComponent(
      settlementId
    )}`,
    {
      method: "GET",
    }
  );
}