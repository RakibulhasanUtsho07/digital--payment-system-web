import { apiClient } from "@/lib/api/client";

export type UserAiVerification =
  | "verified"
  | "partial"
  | "unknown";

export type UserAiConfidence =
  | "high"
  | "medium"
  | "low";

export interface UserAiSource {
  type: string;
  label: string;
  reference: string;
}

export interface UserAiFact {
  label: string;
  value: string | number | boolean | null;
}

export interface UserAiAction {
  label: string;
  href?: string;
}

export interface UserAiChatData {
  messageId: string;
  conversationId: string;
  content: string;
  verification: UserAiVerification;
  confidence: UserAiConfidence;
  sources: UserAiSource[];
  suggestedActions: UserAiAction[];
  facts: UserAiFact[];
  toolIds: string[];
  diagnosis?: unknown;
  data?: Record<string, unknown>;
}

export interface UserAiChatResponse {
  success: boolean;
  data: UserAiChatData;
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

export interface UserAiConversation {
  conversationId: string;
  title: string;
  lastIntent: string;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserAiStoredMessage {
  messageId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  requestId: string;
  intent: string;
  verification: UserAiVerification;
  confidence: UserAiConfidence;
  subjectType?: string;
  resourceId?: string;
  sources: UserAiSource[];
  suggestedActions: UserAiAction[];
  createdAt: string;
}

interface ConversationListResponse {
  success: boolean;
  data: {
    conversations: UserAiConversation[];
  };
  meta?: {
    requestId?: string;
    count?: number;
  };
}

interface MessageListResponse {
  success: boolean;
  data: {
    messages: UserAiStoredMessage[];
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

export async function sendUserAiMessage(input: {
  message: string;
  conversationId?: string;
  resourceId?: string;
  route?: string;
  signal?: AbortSignal;
}): Promise<UserAiChatResponse> {
  const resourceId = input.resourceId?.trim() || undefined;

  return apiClient<UserAiChatResponse>(
    "/ai/chat",
    {
      method: "POST",
      signal: input.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: input.message,
        conversationId: input.conversationId || undefined,
        pageContext: {
          route: input.route || "/dashboard/ai-assistant",
          resourceId,
        },
      }),
    },
  );
}

export async function getUserAiConversations(
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

export async function getUserAiMessages(
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

export async function saveUserAiFeedback(input: {
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
