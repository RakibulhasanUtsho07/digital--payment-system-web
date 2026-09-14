import {
  apiClient,
} from "./client";

import type {
  MerchantVerificationStatus,
  MerchantVerificationView,
} from "./merchantVerificationApi";

export interface AdminMerchantVerificationDetail
  extends MerchantVerificationView {
  merchant: {
    businessName: string;
    businessEmail: string;
    businessPhone?: string;
    businessType: string;
    websiteUrl?: string;
    country: string;
    countryCode: string;
  };

  owner: {
    id: string;
    name: string;
    email?: string;
    kycStatus?: string;
  };

  documentReadUrls: Array<{
    kind: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    url: string;
    expiresAt: string;
  }>;
}

export interface MerchantVerificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListResponse {
  success: boolean;
  data: {
    verifications:
      MerchantVerificationView[];
    pagination:
      MerchantVerificationPagination;
  };
}

interface DetailResponse {
  success: boolean;
  verification:
    AdminMerchantVerificationDetail;
}

interface ReviewResponse {
  success: boolean;
  message: string;
  verification:
    MerchantVerificationView;
}

export async function listAdminMerchantVerifications(
  input: {
    status?:
      MerchantVerificationStatus |
      "all";
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<ListResponse["data"]> {
  const query =
    new URLSearchParams();

  if (
    input.status &&
    input.status !== "all"
  ) {
    query.set(
      "status",
      input.status
    );
  }

  if (input.search?.trim()) {
    query.set(
      "search",
      input.search.trim()
    );
  }

  query.set(
    "page",
    String(input.page || 1)
  );

  query.set(
    "limit",
    String(input.limit || 20)
  );

  const response =
    await apiClient<ListResponse>(
      `/admin/merchant-verifications?${query.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return response.data;
}

export async function getAdminMerchantVerification(
  verificationId: string
): Promise<AdminMerchantVerificationDetail> {
  const response =
    await apiClient<DetailResponse>(
      `/admin/merchant-verifications/${encodeURIComponent(
        verificationId
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return response.verification;
}

export async function approveAdminMerchantVerification(
  verificationId: string,
  internalNote?: string
): Promise<ReviewResponse> {
  return apiClient<ReviewResponse>(
    `/admin/merchant-verifications/${encodeURIComponent(
      verificationId
    )}/approve`,
    {
      method: "POST",
      body: JSON.stringify({
        internalNote:
          internalNote?.trim() ||
          undefined,
      }),
    }
  );
}

export async function rejectAdminMerchantVerification(
  verificationId: string,
  reason: string,
  internalNote?: string
): Promise<ReviewResponse> {
  return apiClient<ReviewResponse>(
    `/admin/merchant-verifications/${encodeURIComponent(
      verificationId
    )}/reject`,
    {
      method: "POST",
      body: JSON.stringify({
        reason:
          reason.trim(),

        internalNote:
          internalNote?.trim() ||
          undefined,
      }),
    }
  );
}
