import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export type SandboxOrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "cancelled"
  | "expired"
  | "failed";

export interface SandboxOrderCustomer {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  externalCustomerId?: string | null;
}

export interface SandboxOrderItem {
  name: string;
  sku?: string | null;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
}

export interface SandboxOrder {
  id: string;
  orderId: string;
  merchantId: string;
  mode: "test";
  status: SandboxOrderStatus;
  amount: number;
  currency: string;
  merchantReference?: string | null;
  description?: string | null;
  customer?: SandboxOrderCustomer | null;
  items: SandboxOrderItem[];
  metadata: Record<string, string>;
  returnUrl?: string | null;
  cancelUrl?: string | null;
  checkoutUrl: string;
  paidAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxPayment {
  paymentId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  sourceType?: string;
  mode?: "test";
  checkoutUrl?: string | null;
  createdAt?: string;
  completedAt?: string | null;
}

export interface SandboxPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateSandboxOrderInput {
  amount: number;
  currency: string;
  merchantReference?: string;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
    externalCustomerId?: string;
  };
  returnUrl?: string;
  cancelUrl?: string;
  expiresInMinutes?: number;
  metadata?: Record<
    string,
    string | number | boolean
  >;
}

export interface CreateSandboxOrderResult {
  duplicate: boolean;
  message: string;
  order: SandboxOrder;
}

export interface SandboxOrderDetail {
  order: SandboxOrder;
  payment: SandboxPayment | null;
}

export interface SandboxOrderList {
  merchant: {
    id: string;
    businessName: string;
    defaultCurrency: string;
  };
  orders: SandboxOrder[];
  pagination: SandboxPagination;
}

interface CreateResponse {
  success: boolean;
  duplicate: boolean;
  message: string;
  order: SandboxOrder;
}

interface DetailResponse
  extends SandboxOrderDetail {
  success: boolean;
}

interface ListResponse {
  success: boolean;
  data: SandboxOrderList;
}

/* =========================================================
   CREATE
========================================================= */

export async function createSandboxOrder(
  input: CreateSandboxOrderInput,
  idempotencyKey: string,
): Promise<CreateSandboxOrderResult> {
  const response =
    await apiClient<CreateResponse>(
      "/merchants/sandbox/orders",
      {
        method: "POST",

        headers: {
          "Idempotency-Key":
            idempotencyKey,
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  return {
    duplicate:
      response.duplicate,

    message:
      response.message,

    order:
      response.order,
  };
}

/* =========================================================
   LIST
========================================================= */

export async function listSandboxOrders(
  input: {
    page?: number;
    limit?: number;
    status?:
      | SandboxOrderStatus
      | "all";
    search?: string;
  } = {},
): Promise<SandboxOrderList> {
  const query =
    new URLSearchParams();

  query.set(
    "page",
    String(
      input.page ?? 1,
    ),
  );

  query.set(
    "limit",
    String(
      input.limit ?? 10,
    ),
  );

  if (
    input.status &&
    input.status !== "all"
  ) {
    query.set(
      "status",
      input.status,
    );
  }

  if (
    input.search?.trim()
  ) {
    query.set(
      "search",
      input.search.trim(),
    );
  }

  const response =
    await apiClient<ListResponse>(
      `/merchants/sandbox/orders?${query.toString()}`,
      {
        method: "GET",
      },
    );

  return response.data;
}

/* =========================================================
   DETAIL / STATUS
========================================================= */

export async function getSandboxOrder(
  orderId: string,
): Promise<SandboxOrderDetail> {
  const response =
    await apiClient<DetailResponse>(
      `/merchants/sandbox/orders/${encodeURIComponent(
        orderId,
      )}`,
      {
        method: "GET",
      },
    );

  return {
    order:
      response.order,

    payment:
      response.payment,
  };
}
