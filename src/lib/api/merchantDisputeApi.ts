import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

export interface MerchantDispute {
  disputeId: string;
  paymentId: string;
  customerId: string | null;

  customerName: string;
  customerAvatarUrl?: string;

  amount: string;
  currency: string;

  reason: string;
  description?: string | null;

  status: string;

  merchantResponse?: string | null;
  resolutionNote?: string | null;

  resolvedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface MerchantDisputesResponse {
  success: boolean;

  data: {
    disputes: MerchantDispute[];

    summary: {
      total: number;
      disputed: number;
      underReview: number;
      won: number;
      lost: number;
      disputedAmount: string;
    };

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
      status: string;
      from: string;
      to: string;
    };
  };
}

/* =========================================================
   GET MERCHANT DISPUTES
========================================================= */

export async function getMerchantDisputes(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    from?: string;
    to?: string;
  } = {},
): Promise<MerchantDisputesResponse> {
  const searchParams =
    new URLSearchParams();

  if (params.page) {
    searchParams.set(
      "page",
      String(params.page),
    );
  }

  if (params.limit) {
    searchParams.set(
      "limit",
      String(params.limit),
    );
  }

  if (params.search?.trim()) {
    searchParams.set(
      "search",
      params.search.trim(),
    );
  }

  if (params.status) {
    searchParams.set(
      "status",
      params.status,
    );
  }

  if (params.from) {
    searchParams.set(
      "from",
      params.from,
    );
  }

  if (params.to) {
    searchParams.set(
      "to",
      params.to,
    );
  }

  const query =
    searchParams.toString();

  return apiClient<MerchantDisputesResponse>(
    `/merchants/disputes${
      query
        ? `?${query}`
        : ""
    }`,
    {
      method: "GET",
    },
  );
}

/* =========================================================
   DETAIL TYPES
========================================================= */

export interface MerchantDisputeDetailResponse {
  success: boolean;

  data: {
    merchant: {
      id: string;
      businessName: string;
      defaultCurrency?: string;
    };

    dispute: {
      disputeId: string;
      paymentId: string;
      customerId: string | null;

      amount: string;
      currency: string;

      reason: string;
      description: string | null;

      status: string;

      merchantResponse: string | null;
      resolutionNote: string | null;

      resolvedAt: string | null;

      createdAt: string;
      updatedAt: string;

      evidence: Array<{
        title: string;
        description: string | null;
        url: string | null;
        submittedAt: string;
      }>;
    };

    customer: {
      customerId: string;
      name: string;
      avatarUrl?: string;
      accountStatus?: string;
      kycStatus?: string;
    } | null;

    payment: {
      paymentId: string;
      amount: string;
      currency: string;
      status: string;
      provider: string;
      sourceType: string;
      mode: string;
      merchantReference: string | null;
      providerPaymentId: string | null;
      orderId: string | null;
      createdAt: string;
      completedAt: string | null;
    } | null;
  };
}

/* =========================================================
   GET DISPUTE DETAIL
========================================================= */

export async function getMerchantDisputeDetail(
  disputeId: string,
): Promise<MerchantDisputeDetailResponse> {
  return apiClient<MerchantDisputeDetailResponse>(
    `/merchants/disputes/${encodeURIComponent(
      disputeId,
    )}`,
    {
      method: "GET",
    },
  );
}