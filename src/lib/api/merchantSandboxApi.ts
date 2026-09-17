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

  metadata: Record<
    string,
    string
  >;

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

    phone?: string;

    externalCustomerId?: string;
  };

  items?: Array<{
    name: string;

    sku?: string;

    quantity: number;

    unitAmount: number;
  }>;

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

/* =========================================================
   INTERNAL RESPONSE TYPES
========================================================= */

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
   CREATE SANDBOX ORDER

   IMPORTANT:
   apiClient already owns the /api base prefix.

   Browser:
   POST /api/merchants/sandbox/orders
========================================================= */

export async function createSandboxOrder(
  input: CreateSandboxOrderInput,
  idempotencyKey: string,
): Promise<CreateSandboxOrderResult> {
  const normalizedKey =
    idempotencyKey.trim();

  if (!normalizedKey) {
    throw new Error(
      "Idempotency key is required.",
    );
  }

  const response =
    await apiClient<CreateResponse>(
      "/merchants/sandbox/orders",
      {
        method: "POST",

        headers: {
          "Idempotency-Key":
            normalizedKey,
        },

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  if (
    !response.success
  ) {
    throw new Error(
      response.message ||
        "Unable to create sandbox order.",
    );
  }

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
   LIST SANDBOX ORDERS

   Browser:
   GET /api/merchants/sandbox/orders
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

  const normalizedSearch =
    input.search?.trim();

  if (
    normalizedSearch
  ) {
    query.set(
      "search",
      normalizedSearch,
    );
  }

  const response =
    await apiClient<ListResponse>(
      `/merchants/sandbox/orders?${query.toString()}`,
      {
        method: "GET",
      },
    );

  if (
    !response.success
  ) {
    throw new Error(
      "Unable to load sandbox orders.",
    );
  }

  return response.data;
}

/* =========================================================
   GET SANDBOX ORDER

   Browser:
   GET /api/merchants/sandbox/orders/:orderId
========================================================= */

export async function getSandboxOrder(
  orderId: string,
): Promise<SandboxOrderDetail> {
  const normalizedOrderId =
    orderId.trim();

  if (
    !normalizedOrderId
  ) {
    throw new Error(
      "Order ID is required.",
    );
  }

  const response =
    await apiClient<DetailResponse>(
      `/merchants/sandbox/orders/${encodeURIComponent(
        normalizedOrderId,
      )}`,
      {
        method: "GET",
      },
    );

  if (
    !response.success
  ) {
    throw new Error(
      "Unable to load sandbox order.",
    );
  }

  return {
    order:
      response.order,

    payment:
      response.payment,
  };
}