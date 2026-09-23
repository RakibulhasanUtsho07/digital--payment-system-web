import { apiClient } from "@/lib/api/client";

export type MerchantAiVerification =
  | "verified"
  | "partial"
  | "unknown";

export type MerchantAiConfidence =
  | "high"
  | "medium"
  | "low";

export interface MerchantAiSource {
  type: string;
  label: string;
  reference: string;
}

export interface MerchantAiFact {
  label: string;
  value: string | number | boolean | null;
}

export interface MerchantAiAction {
  label: string;
  href?: string;
}

export interface MerchantAiChatData {
  messageId: string;
  conversationId: string;
  content: string;
  verification: MerchantAiVerification;
  confidence: MerchantAiConfidence;
  sources: MerchantAiSource[];
  suggestedActions: MerchantAiAction[];
  facts: MerchantAiFact[];
  toolIds: string[];
  diagnosis?: unknown;
  data?: Record<string, unknown>;
}

export interface MerchantAiChatResponse {
  success: boolean;
  data: MerchantAiChatData;
  meta: {
    requestId: string;
    intent: string;
    role: string;
    readOnly: boolean;
    degraded: boolean;
    modelUsed?: boolean;
    model?: string | null;
    modelTier?: string;
    modelProvider?: string;
    grounded?: boolean;
    knowledgeCount?: number;
  };
}

export interface MerchantAiConversation {
  conversationId: string;
  title: string;
  lastIntent: string;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantAiStoredMessage {
  messageId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  requestId: string;
  intent: string;
  verification: MerchantAiVerification;
  confidence: MerchantAiConfidence;
  subjectType?: string;
  resourceId?: string;
  sources: MerchantAiSource[];
  suggestedActions: MerchantAiAction[];
  createdAt: string;
}

interface ConversationListResponse {
  success: boolean;
  data: {
    conversations: MerchantAiConversation[];
  };
  meta?: {
    requestId?: string;
    count?: number;
  };
}

interface MessageListResponse {
  success: boolean;
  data: {
    messages: MerchantAiStoredMessage[];
  };
  meta?: {
    requestId?: string;
    count?: number;
  };
}

interface FeedbackResponse {
  success: boolean;
  message?: string;
  meta?: {
    requestId?: string;
  };
}

function normalizeResourceId(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  if (
    normalized.length < 6 ||
    normalized.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(normalized)
  ) {
    return undefined;
  }

  const placeholder = normalized.toUpperCase();

  if (
    /^(?:YOUR_)?(?:PAYMENT|TRANSACTION|TXN|REFUND|PAYOUT|SETTLEMENT|EVENT|WEBHOOK_EVENT|KEY|API_KEY|RESOURCE)_ID$/.test(
      placeholder,
    )
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeConversationId(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim();

  if (
    !normalized ||
    normalized.length > 160 ||
    !/^[a-zA-Z0-9_-]+$/.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeMerchantRoute(
  value: string | undefined,
): string {
  const normalized = value?.trim();

  if (
    normalized &&
    normalized.length <= 240 &&
    normalized.startsWith(
      "/dashboard/merchant",
    ) &&
    !/[\u0000-\u001f\u007f]/.test(
      normalized,
    )
  ) {
    return normalized;
  }

  return "/dashboard/merchant/ai-assistant";
}

export async function sendMerchantAiMessage(input: {
  message: string;
  conversationId?: string;
  resourceId?: string;
  route?: string;
  signal?: AbortSignal;
}): Promise<MerchantAiChatResponse> {
  const message = input.message.trim();
  const resourceId =
    normalizeResourceId(
      input.resourceId,
    );
  const conversationId =
    normalizeConversationId(
      input.conversationId,
    );
  const route = normalizeMerchantRoute(
    input.route,
  );

  return apiClient<MerchantAiChatResponse>(
    "/ai/chat",
    {
      method: "POST",
      signal: input.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversationId,
        pageContext: {
          route,
          resourceId,
        },
      }),
    },
  );
}

export async function getMerchantAiConversations(
  limit = 30,
  signal?: AbortSignal,
): Promise<ConversationListResponse> {
  const safeLimit = Math.min(
    Math.max(Math.trunc(limit), 1),
    50,
  );

  return apiClient<ConversationListResponse>(
    `/ai/conversations?limit=${safeLimit}`,
    {
      method: "GET",
      signal,
    },
  );
}

export async function getMerchantAiMessages(
  conversationId: string,
  limit = 200,
  signal?: AbortSignal,
): Promise<MessageListResponse> {
  const safeLimit = Math.min(
    Math.max(Math.trunc(limit), 1),
    200,
  );

  return apiClient<MessageListResponse>(
    `/ai/conversations/${encodeURIComponent(
      conversationId,
    )}/messages?limit=${safeLimit}`,
    {
      method: "GET",
      signal,
    },
  );
}

export async function saveMerchantAiFeedback(input: {
  conversationId: string;
  messageId: string;
  rating: "helpful" | "not_helpful";
  comment?: string;
}): Promise<FeedbackResponse> {
  return apiClient<FeedbackResponse>(
    `/ai/conversations/${encodeURIComponent(
      input.conversationId,
    )}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageId: input.messageId,
        rating: input.rating,
        comment: input.comment,
      }),
    },
  );
}
