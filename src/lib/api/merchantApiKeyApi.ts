import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export const MERCHANT_API_SCOPES = [
  "payments:read",
  "payments:write",
  "refunds:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "subscriptions:write",
  "payouts:write",
  "invoices:write",
  "webhooks:manage",
] as const;

export type MerchantApiScope =
  (typeof MERCHANT_API_SCOPES)[number];

export type MerchantApiKeyEnvironment =
  | "test"
  | "live";

export type MerchantApiKeyStatus =
  | "active"
  | "revoked"
  | "expired";

export interface MerchantApiKeySummary {
  id: string;
  keyId: string;
  keyPrefix: string;
  name?: string;
  environment:
    MerchantApiKeyEnvironment;
  scopes:
    MerchantApiScope[];
  status:
    MerchantApiKeyStatus;
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GeneratedMerchantApiKey
  extends MerchantApiKeySummary {
  /*
   * Returned only after create/rotate.
   * It is never returned by the list endpoint.
   */
  key: string;
}

export interface CreateMerchantApiKeyInput {
  name?: string;
  environment:
    MerchantApiKeyEnvironment;
  scopes:
    MerchantApiScope[];
  expiresAt?: string;
}

interface ApiKeyListResponse {
  success: boolean;
  apiKeys:
    MerchantApiKeySummary[];
}

interface GeneratedApiKeyResponse {
  success: boolean;
  message: string;
  apiKey:
    GeneratedMerchantApiKey;
}

interface ApiMessageResponse {
  success: boolean;
  message: string;
}

/* =========================================================
   LIST
========================================================= */

export async function getMerchantApiKeys():
  Promise<MerchantApiKeySummary[]> {
  const response =
    await apiClient<ApiKeyListResponse>(
      "/merchants/api-keys",
      {
        method: "GET",
      }
    );

  return Array.isArray(
    response.apiKeys
  )
    ? response.apiKeys
    : [];
}

/* =========================================================
   CREATE
========================================================= */

export async function createMerchantApiKey(
  input: CreateMerchantApiKeyInput
): Promise<GeneratedApiKeyResponse> {
  return apiClient<GeneratedApiKeyResponse>(
    "/merchants/api-keys",
    {
      method: "POST",

      body:
        JSON.stringify(input),
    }
  );
}

/* =========================================================
   ROTATE
========================================================= */

export async function rotateMerchantApiKey(
  keyId: string
): Promise<GeneratedApiKeyResponse> {
  return apiClient<GeneratedApiKeyResponse>(
    `/merchants/api-keys/${encodeURIComponent(
      keyId
    )}/rotate`,
    {
      method: "POST",
    }
  );
}

/* =========================================================
   REVOKE
========================================================= */

export async function revokeMerchantApiKey(
  keyId: string
): Promise<ApiMessageResponse> {
  return apiClient<ApiMessageResponse>(
    `/merchants/api-keys/${encodeURIComponent(
      keyId
    )}`,
    {
      method: "DELETE",
    }
  );
}

