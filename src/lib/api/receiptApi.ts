import {
  apiClient,
} from "@/lib/api/client";

export type ReceiptStatus =
  | "normal"
  | "warranty_active"
  | "warranty_expiring"
  | "return_open";

export interface ReceiptLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

export interface ReceiptData {
  id: string;
  merchant: string;
  date: string;
  total: number;
  tax: number;
  currency: string;
  category: string;
  paymentMethod: string;
  receiptNumber: string;
  status: ReceiptStatus;
  warrantyExpiry?: string;
  returnDeadline?: string;
  isFavorite: boolean;
  tags: string[];
  lineItems:
    ReceiptLineItem[];
  imageUrl?: string;
  isAiParsed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ReceiptsResponse {
  success: boolean;
  count: number;
  receipts: ReceiptData[];
  message?: string;
}

interface ReceiptResponse {
  success: boolean;
  receipt: ReceiptData;
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  id: string;
  message?: string;
}

function jsonRequest(
  method: string,
  body: unknown
): RequestInit {
  return {
    method,
    headers: {
      "Content-Type":
        "application/json",
    },
    body:
      JSON.stringify(
        body
      ),
  };
}

export async function getReceipts() {
  return apiClient<ReceiptsResponse>(
    "/receipts"
  );
}

export async function getReceiptById(
  id: string
) {
  return apiClient<ReceiptResponse>(
    `/receipts/${encodeURIComponent(
      id
    )}`
  );
}

export async function createReceipt(
  payload: {
    merchant: string;
    total: number;
    tax: number;
    currency?: string;
    category: string;
    paymentMethod?: string;
    receiptNumber?: string;
    date: string;
    status: ReceiptStatus;
    warrantyExpiry?: string;
    returnDeadline?: string;
    isFavorite?: boolean;
    tags?: string[];
    lineItems?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      category: string;
    }>;
    imageUrl?: string;
    isAiParsed?: boolean;
  }
) {
  return apiClient<ReceiptResponse>(
    "/receipts",
    jsonRequest(
      "POST",
      payload
    )
  );
}

export async function updateReceipt(
  id: string,
  payload:
    Partial<{
      merchant: string;
      total: number;
      tax: number;
      currency: string;
      category: string;
      paymentMethod: string;
      receiptNumber: string;
      date: string;
      status: ReceiptStatus;
      warrantyExpiry?: string;
      returnDeadline?: string;
      isFavorite: boolean;
      tags: string[];
      lineItems: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        total: number;
        category: string;
      }>;
    }>
) {
  return apiClient<ReceiptResponse>(
    `/receipts/${encodeURIComponent(
      id
    )}`,
    jsonRequest(
      "PATCH",
      payload
    )
  );
}

export async function setReceiptFavorite(
  id: string,
  isFavorite: boolean
) {
  return apiClient<ReceiptResponse>(
    `/receipts/${encodeURIComponent(
      id
    )}/favorite`,
    jsonRequest(
      "PATCH",
      {
        isFavorite,
      }
    )
  );
}

export async function addReceiptTag(
  id: string,
  tag: string
) {
  return apiClient<ReceiptResponse>(
    `/receipts/${encodeURIComponent(
      id
    )}/tags`,
    jsonRequest(
      "POST",
      {
        tag,
      }
    )
  );
}

export async function deleteReceipt(
  id: string
) {
  return apiClient<DeleteResponse>(
    `/receipts/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "DELETE",
    }
  );
}
