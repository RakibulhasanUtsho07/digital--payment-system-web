import { apiClient } from "@/lib/api/client";

export type MerchantOrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "cancelled"
  | "expired"
  | "failed";

export interface MerchantOrder {
  id: string;
  orderId: string;
  merchantId: string;
  mode: "test" | "live";
  status: MerchantOrderStatus;
  amount: number;
  currency: string;
  merchantReference?: string | null;
  description?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    externalCustomerId?: string | null;
  } | null;
  items: Array<{
    name: string;
    sku?: string | null;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
  }>;
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

export interface MerchantOrderPayment {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  provider: string;
  sourceType: string;
  checkoutUrl?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface OrderListResponse {
  success: boolean;
  data: {
    merchant: { id: string; businessName: string; defaultCurrency: string };
    orders: MerchantOrder[];
    summary: {
      totalOrders: number;
      paidOrders: number;
      pendingOrders: number;
      grossAmount: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export function getMerchantOrders(query: URLSearchParams): Promise<OrderListResponse> {
  return apiClient<OrderListResponse>(`/merchants/orders?${query.toString()}`);
}

export async function getMerchantOrder(orderId: string): Promise<{
  order: MerchantOrder;
  payment: MerchantOrderPayment | null;
}> {
  const result = await apiClient<{
    success: boolean;
    order: MerchantOrder;
    payment: MerchantOrderPayment | null;
  }>(`/merchants/orders/${encodeURIComponent(orderId)}`);
  return { order: result.order, payment: result.payment };
}
