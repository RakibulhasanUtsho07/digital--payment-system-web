import {
  apiClient,
} from "@/lib/api/client";

export type MerchantRefundStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export type MerchantRefundMode =
  | "test"
  | "live";

export interface MerchantRefund {
  _id: string;
  refundId: string;
  paymentId: string;
  merchantId: string;
  customerId: string;
  amount: string;
  amountMinor: number;
  currency: string;
  mode: MerchantRefundMode;
  status: MerchantRefundStatus;
  reason?: string;
  merchantReference?: string;
  ledgerEntryGroupId?: string;
  failureCode?: string;
  failureMessage?: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantRefundListResponse {
  success: boolean;

  refunds:
    MerchantRefund[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  message?: string;
}

export interface MerchantRefundDetailResponse {
  success: boolean;
  refund: MerchantRefund;
  message?: string;
}

export interface CreateMerchantRefundInput {
  paymentId: string;

  mode:
    MerchantRefundMode;

  amount:
    number | string;

  reason?: string;

  merchantReference?:
    string;

  idempotencyKey:
    string;
}

export interface CreateMerchantRefundResponse {
  success: boolean;
  duplicate: boolean;
  message: string;
  refund: MerchantRefund;
}

export async function getMerchantRefunds(
  input: {
    search?: string;
    status?: MerchantRefundStatus;
    mode?: MerchantRefundMode;
    page?: number;
    limit?: number;
  } = {}
): Promise<MerchantRefundListResponse> {
  const query =
    new URLSearchParams();

  if (input.search?.trim()) {
    query.set(
      "search",
      input.search.trim()
    );
  }

  if (input.status) {
    query.set(
      "status",
      input.status
    );
  }

  if (input.mode) {
    query.set(
      "mode",
      input.mode
    );
  }

  query.set(
    "page",
    String(input.page ?? 1)
  );

  query.set(
    "limit",
    String(input.limit ?? 20)
  );

  return apiClient<MerchantRefundListResponse>(
    `/merchants/refunds?${query.toString()}`,
    {
      method: "GET",
    }
  );
}

export async function getMerchantRefund(
  refundId: string
): Promise<MerchantRefundDetailResponse> {
  const normalized =
    refundId.trim();

  if (!normalized) {
    throw new Error(
      "Refund ID is required."
    );
  }

  return apiClient<MerchantRefundDetailResponse>(
    `/merchants/refunds/${encodeURIComponent(
      normalized
    )}`,
    {
      method: "GET",
    }
  );
}

export async function createMerchantRefund(
  input:
    CreateMerchantRefundInput
): Promise<CreateMerchantRefundResponse> {
  if (!input.paymentId.trim()) {
    throw new Error(
      "Payment ID is required."
    );
  }

  if (!input.idempotencyKey.trim()) {
    throw new Error(
      "A secure request ID is required."
    );
  }

  return apiClient<CreateMerchantRefundResponse>(
    "/merchants/refunds",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "Idempotency-Key":
          input.idempotencyKey,
      },

      body:
        JSON.stringify({
          paymentId:
            input.paymentId.trim(),

          mode:
            input.mode,

          amount:
            input.amount,

          reason:
            input.reason?.trim() ||
            undefined,

          merchantReference:
            input.merchantReference
              ?.trim() ||
            undefined,
        }),
    }
  );
}