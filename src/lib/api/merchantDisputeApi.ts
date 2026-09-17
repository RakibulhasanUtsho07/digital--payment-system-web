/* =========================================================
   MERCHANT DISPUTE API
========================================================= */

import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export type MerchantDisputeStatus =
  | "disputed"
  | "under_review"
  | "won"
  | "lost";

export type MerchantDisputeReason =
  | "fraud"
  | "duplicate"
  | "product_not_received"
  | "product_not_as_described"
  | "unauthorized"
  | "processing_error"
  | "other";

/* =========================================================
   LIST ITEM
========================================================= */

export interface MerchantDispute {
  disputeId: string;

  paymentId: string;

  customerId:
    | string
    | null;

  customerName: string;

  customerAvatarUrl?: string;

  amount: string;

  currency: string;

  reason: string;

  description?:
    | string
    | null;

  status:
    MerchantDisputeStatus;

  merchantResponse?:
    | string
    | null;

  resolutionNote?:
    | string
    | null;

  resolvedAt?:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   SUMMARY
========================================================= */

export interface MerchantDisputeSummary {
  total: number;

  disputed: number;

  underReview: number;

  won: number;

  lost: number;

  disputedAmount: string;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface MerchantDisputePagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

/* =========================================================
   LIST RESPONSE
========================================================= */

export interface MerchantDisputesResponse {
  success: boolean;

  data: {
    disputes:
      MerchantDispute[];

    summary:
      MerchantDisputeSummary;

    pagination:
      MerchantDisputePagination;

    filters: {
      search: string;

      status: string;

      from: string;

      to: string;
    };
  };

  message?: string;
}

/* =========================================================
   DETAIL
========================================================= */

export interface MerchantDisputeEvidence {
  title: string;

  description:
    | string
    | null;

  url:
    | string
    | null;

  submittedAt: string;
}

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

      customerId:
        | string
        | null;

      amount: string;

      currency: string;

      reason: string;

      description:
        | string
        | null;

      status:
        MerchantDisputeStatus;

      merchantResponse:
        | string
        | null;

      resolutionNote:
        | string
        | null;

      resolvedAt:
        | string
        | null;

      createdAt: string;

      updatedAt: string;

      evidence:
        MerchantDisputeEvidence[];
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

      merchantReference:
        | string
        | null;

      providerPaymentId:
        | string
        | null;

      orderId:
        | string
        | null;

      createdAt: string;

      completedAt:
        | string
        | null;
    } | null;
  };

  message?: string;
}

/* =========================================================
   PARAMS
========================================================= */

export interface MerchantDisputeListParams {
  page?: number;

  limit?: number;

  search?: string;

  status?:
    | MerchantDisputeStatus
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
   LIST

   apiClient base already contains /api.

   Therefore:
   /merchants/disputes

   NOT:
   /api/merchants/disputes
========================================================= */

export async function getMerchantDisputes(
  params:
    MerchantDisputeListParams = {}
): Promise<MerchantDisputesResponse> {
  if (
    params.from &&
    params.to &&
    params.from > params.to
  ) {
    throw new Error(
      "From date cannot be later than To date."
    );
  }

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
    params.search?.trim()
  );

  setOptionalParam(
    searchParams,
    "status",
    params.status
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

  const response =
    await apiClient<MerchantDisputesResponse>(
      `/merchants/disputes${
        query
          ? `?${query}`
          : ""
      }`,
      {
        method: "GET",
      }
    );

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid merchant dispute response."
    );
  }

  if (
    response.success ===
    false
  ) {
    throw new Error(
      response.message ||
        "Unable to load disputes."
    );
  }

  if (
    !response.data ||
    !Array.isArray(
      response.data.disputes
    )
  ) {
    throw new Error(
      "Merchant dispute data was not returned."
    );
  }

  return response;
}

/* =========================================================
   DETAIL
========================================================= */

export async function getMerchantDisputeDetail(
  disputeId:
    string
): Promise<MerchantDisputeDetailResponse> {
  const normalizedId =
    disputeId.trim();

  if (!normalizedId) {
    throw new Error(
      "Dispute ID is required."
    );
  }

  const response =
    await apiClient<MerchantDisputeDetailResponse>(
      `/merchants/disputes/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "GET",
      }
    );

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid dispute detail response."
    );
  }

  if (
    response.success ===
    false
  ) {
    throw new Error(
      response.message ||
        "Unable to load dispute."
    );
  }

  if (
    !response.data?.dispute
  ) {
    throw new Error(
      "Dispute detail was not returned."
    );
  }

  return response;
}