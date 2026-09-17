import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

export type InvoiceMode =
  | "test"
  | "live";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "void";

export interface MerchantInvoiceCustomer {
  userId?: string;
  name: string;
  email: string;
  phone?: string;
}

export interface MerchantInvoiceItem {
  itemId: string;
  name: string;
  description?: string;
  quantity: number;
  unitAmount: string;
  lineAmount: string;
}

export interface MerchantInvoice {
  _id: string;

  invoiceId: string;
  invoiceNumber: string;

  merchantId: string;

  mode: InvoiceMode;
  status: InvoiceStatus;

  customer: MerchantInvoiceCustomer;

  items: MerchantInvoiceItem[];

  currency: string;

  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  amountPaid: string;
  amountDue: string;

  subtotalMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  amountDueMinor: number;

  issueDate: string;
  dueDate: string;

  title?: string;
  note?: string;
  footer?: string;

  merchantReference?: string;

  paymentId?: string;
  checkoutUrl?: string;

  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  overdueAt?: string;
  cancelledAt?: string;
  voidedAt?: string;

  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   CREATE INPUT
========================================================= */

export interface CreateInvoiceItemInput {
  name: string;
  description?: string;
  quantity: number;
  unitAmount: number | string;
}

export interface CreateInvoiceCustomerInput {
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface CreateMerchantInvoiceInput {
  mode: InvoiceMode;

  customer: CreateInvoiceCustomerInput;

  items: CreateInvoiceItemInput[];

  currency?: string;

  taxAmount?: number | string;
  discountAmount?: number | string;

  dueDate: string;

  title?: string;
  note?: string;
  footer?: string;

  merchantReference?: string;

  idempotencyKey?: string;
}

/* =========================================================
   FILTERS
========================================================= */

export interface MerchantInvoiceFilters {
  status?: InvoiceStatus | "";
  mode?: InvoiceMode | "";
  search?: string;
  page?: number;
  limit?: number;
}

/* =========================================================
   RESPONSES
========================================================= */

export interface CreateInvoiceResponse {
  success: boolean;
  message?: string;
  duplicate: boolean;
  invoice: MerchantInvoice;
}

export interface InvoiceListResponse {
  success: boolean;

  invoices: MerchantInvoice[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InvoiceDetailResponse {
  success: boolean;
  message?: string;
  invoice: MerchantInvoice;
}

export interface SendInvoiceResponse {
  success: boolean;
  message?: string;
  invoice: MerchantInvoice;
  publicUrl: string;
}

export interface PublicInvoiceResponse {
  success: boolean;
  invoice: MerchantInvoice;
}

/* =========================================================
   IDEMPOTENCY KEY
========================================================= */

export function createInvoiceIdempotencyKey(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `invoice_${globalThis.crypto.randomUUID()}`;
  }

  return [
    "invoice",
    Date.now(),
    Math.random().toString(36).slice(2),
  ].join("_");
}

/* =========================================================
   CREATE DASHBOARD INVOICE

   POST /api/merchants/invoices
========================================================= */

export async function createMerchantInvoice(
  input: CreateMerchantInvoiceInput
): Promise<CreateInvoiceResponse> {
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    createInvoiceIdempotencyKey();

  const {
    idempotencyKey: _ignored,
    ...body
  } = input;

  return apiClient<CreateInvoiceResponse>(
    "/merchants/invoices",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },

      body: JSON.stringify(body),
    }
  );
}

/* =========================================================
   LIST DASHBOARD INVOICES

   GET /api/merchants/invoices
========================================================= */

export async function getMerchantInvoices(
  filters: MerchantInvoiceFilters = {}
): Promise<InvoiceListResponse> {
  const query =
    new URLSearchParams();

  if (filters.status) {
    query.set(
      "status",
      filters.status
    );
  }

  if (filters.mode) {
    query.set(
      "mode",
      filters.mode
    );
  }

  if (filters.search?.trim()) {
    query.set(
      "search",
      filters.search.trim()
    );
  }

  if (
    filters.page &&
    filters.page > 0
  ) {
    query.set(
      "page",
      String(filters.page)
    );
  }

  if (
    filters.limit &&
    filters.limit > 0
  ) {
    query.set(
      "limit",
      String(filters.limit)
    );
  }

  const queryString =
    query.toString();

  return apiClient<InvoiceListResponse>(
    `/merchants/invoices${
      queryString
        ? `?${queryString}`
        : ""
    }`,
    {
      method: "GET",
    }
  );
}

/* =========================================================
   GET DASHBOARD INVOICE

   GET /api/merchants/invoices/:invoiceId
========================================================= */

export async function getMerchantInvoice(
  invoiceId: string
): Promise<InvoiceDetailResponse> {
  const normalizedInvoiceId =
    invoiceId.trim();

  if (!normalizedInvoiceId) {
    throw new Error(
      "Invoice ID is required."
    );
  }

  return apiClient<InvoiceDetailResponse>(
    `/merchants/invoices/${encodeURIComponent(
      normalizedInvoiceId
    )}`,
    {
      method: "GET",
    }
  );
}

/* =========================================================
   SEND INVOICE

   POST /api/merchants/invoices/:invoiceId/send
========================================================= */

export async function sendMerchantInvoice(
  invoiceId: string
): Promise<SendInvoiceResponse> {
  const normalizedInvoiceId =
    invoiceId.trim();

  if (!normalizedInvoiceId) {
    throw new Error(
      "Invoice ID is required."
    );
  }

  return apiClient<SendInvoiceResponse>(
    `/merchants/invoices/${encodeURIComponent(
      normalizedInvoiceId
    )}/send`,
    {
      method: "POST",
    }
  );
}

/* =========================================================
   CANCEL INVOICE

   POST /api/merchants/invoices/:invoiceId/cancel
========================================================= */

export async function cancelMerchantInvoice(
  invoiceId: string
): Promise<InvoiceDetailResponse> {
  const normalizedInvoiceId =
    invoiceId.trim();

  if (!normalizedInvoiceId) {
    throw new Error(
      "Invoice ID is required."
    );
  }

  return apiClient<InvoiceDetailResponse>(
    `/merchants/invoices/${encodeURIComponent(
      normalizedInvoiceId
    )}/cancel`,
    {
      method: "POST",
    }
  );
}

/* =========================================================
   GET PUBLIC INVOICE

   GET /api/public/invoices/:invoiceId
========================================================= */

export async function getPublicMerchantInvoice(
  invoiceId: string,
  token: string
): Promise<PublicInvoiceResponse> {
  const normalizedInvoiceId =
    invoiceId.trim();

  const normalizedToken =
    token.trim();

  if (
    !normalizedInvoiceId ||
    !normalizedToken
  ) {
    throw new Error(
      "Valid invoice access is required."
    );
  }

  return apiClient<PublicInvoiceResponse>(
    `/public/invoices/${encodeURIComponent(
      normalizedInvoiceId
    )}`,
    {
      method: "GET",

      headers: {
        "X-Invoice-Token":
          normalizedToken,
      },
    }
  );
}