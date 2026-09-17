import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export type MerchantWebhookEnvironment =
  | "test"
  | "live";

export const MERCHANT_WEBHOOK_EVENTS = [
  "payment.created",
  "payment.authorized",
  "payment.captured",
  "payment.completed",
  "payment.failed",
  "payment.cancelled",
  "payment.expired",
] as const;

export type MerchantWebhookEventType =
  (typeof MERCHANT_WEBHOOK_EVENTS)[number];

export type MerchantWebhookDeliveryStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed";

export interface MerchantWebhookEndpoint {
  id: string;
  url: string;
  environment: MerchantWebhookEnvironment;
  events: MerchantWebhookEventType[];
  enabled: boolean;
  description?: string;
  secretHint: string;
  secretVersion: number;
  secretRotatedAt?: string;
  lastDeliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantWebhookDelivery {
  id: string;
  eventId: string;
  endpointId: string;
  type: MerchantWebhookEventType;
  environment: MerchantWebhookEnvironment;
  paymentId: string;
  payload: Record<string, unknown>;
  status: MerchantWebhookDeliveryStatus;
  attempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  deliveredAt?: string;
  lastResponseStatus?: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMerchantWebhookInput {
  url: string;
  environment: MerchantWebhookEnvironment;
  events: MerchantWebhookEventType[];
  description?: string;
}

interface WebhookListResponse {
  success: boolean;
  environment: MerchantWebhookEnvironment;
  webhooks: MerchantWebhookEndpoint[];
}

interface WebhookMutationResponse {
  success: boolean;
  message: string;
  webhook: MerchantWebhookEndpoint;
}

interface WebhookSecretResponse
  extends WebhookMutationResponse {
  signingSecret: string;
  warning: string;
}

export interface MerchantWebhookPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WebhookDeliveryListResponse {
  success: boolean;
  environment: MerchantWebhookEnvironment;
  events: MerchantWebhookDelivery[];
  pagination: MerchantWebhookPagination;
}

interface RetryWebhookResponse {
  success: boolean;
  message: string;
  event: {
    eventId: string;
    status: MerchantWebhookDeliveryStatus;
    attempts: number;
    nextAttemptAt?: string;
  };
}

/* =========================================================
   ENDPOINTS
========================================================= */

export async function getMerchantWebhookEndpoints(
  environment: MerchantWebhookEnvironment
): Promise<MerchantWebhookEndpoint[]> {
  const response = await apiClient<WebhookListResponse>(
    `/merchants/webhooks?environment=${encodeURIComponent(
      environment
    )}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return response.webhooks;
}

export async function createMerchantWebhook(
  input: CreateMerchantWebhookInput
): Promise<WebhookSecretResponse> {
  return apiClient<WebhookSecretResponse>(
    "/merchants/webhooks",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );
}

export async function disableMerchantWebhook(
  endpointId: string,
  environment: MerchantWebhookEnvironment
): Promise<WebhookMutationResponse> {
  return apiClient<WebhookMutationResponse>(
    `/merchants/webhooks/${encodeURIComponent(
      endpointId
    )}?environment=${encodeURIComponent(environment)}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
}

export async function rotateMerchantWebhookSecret(
  endpointId: string,
  environment: MerchantWebhookEnvironment
): Promise<WebhookSecretResponse> {
  return apiClient<WebhookSecretResponse>(
    `/merchants/webhooks/${encodeURIComponent(
      endpointId
    )}/rotate-secret`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        environment,
      }),
    }
  );
}

/* =========================================================
   DELIVERY EVENTS
========================================================= */

export async function getMerchantWebhookDeliveries({
  environment,
  status,
  page = 1,
  limit = 20,
}: {
  environment: MerchantWebhookEnvironment;
  status?: MerchantWebhookDeliveryStatus | "all";
  page?: number;
  limit?: number;
}): Promise<{
  events: MerchantWebhookDelivery[];
  pagination: MerchantWebhookPagination;
}> {
  const query = new URLSearchParams({
    environment,
    page: String(page),
    limit: String(limit),
  });

  if (
    status &&
    status !== "all"
  ) {
    query.set("status", status);
  }

  const response =
    await apiClient<WebhookDeliveryListResponse>(
      `/merchants/webhook-events?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

  return {
    events: response.events,
    pagination: response.pagination,
  };
}

export async function retryMerchantWebhookDelivery(
  eventId: string,
  environment: MerchantWebhookEnvironment
): Promise<RetryWebhookResponse> {
  return apiClient<RetryWebhookResponse>(
    `/merchants/webhook-events/${encodeURIComponent(
      eventId
    )}/retry`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        environment,
      }),
    }
  );
}
