import {
  apiClient,
} from "@/lib/api/client";

export type CofferAiVerification =
  | "verified"
  | "partial"
  | "unknown";

export type CofferAiConfidence =
  | "high"
  | "medium"
  | "low";

export type CofferAiSubjectType =
  | "gateway_payment"
  | "wallet_transaction";

export interface CofferAiSource {
  type: string;
  label: string;
  reference: string;
}

export interface CofferAiAction {
  label: string;
  href?: string;
}

export interface CofferAiDiagnosisCause {
  code: string;
  label: string;
  evidenceRefs: string[];
  confidence?: CofferAiConfidence;
}

export interface CofferAiDiagnosis {
  subjectType:
    CofferAiSubjectType;
  subjectId: string;
  state: string;
  exactCause?:
    CofferAiDiagnosisCause;
  possibleCauses:
    CofferAiDiagnosisCause[];
  nextSteps:
    CofferAiAction[];
  verified: boolean;
}

export interface CofferAiAssistantMessage {
  messageId: string;
  conversationId: string;
  content: string;
  verification:
    CofferAiVerification;
  confidence:
    CofferAiConfidence;
  sources:
    CofferAiSource[];
  diagnosis:
    CofferAiDiagnosis |
    null;
  suggestedActions:
    CofferAiAction[];
}

export interface CofferAiChatResponse {
  success: true;
  data:
    CofferAiAssistantMessage;
  meta: {
    requestId: string;
    intent: string;
    degraded: boolean;
  };
}

export interface CofferAiConversation {
  conversationId: string;
  title: string;
  lastIntent: string;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CofferAiStoredMessage {
  messageId: string;
  conversationId: string;
  role:
    | "user"
    | "assistant";
  content: string;
  requestId: string;
  intent: string;
  verification:
    CofferAiVerification;
  confidence:
    CofferAiConfidence;
  subjectType?:
    CofferAiSubjectType;
  resourceId?: string;
  sources:
    CofferAiSource[];
  suggestedActions:
    CofferAiAction[];
  createdAt: string;
}

interface ConversationListResponse {
  success: true;
  data: {
    conversations:
      CofferAiConversation[];
  };
  meta: {
    requestId: string;
    count: number;
  };
}

interface MessageListResponse {
  success: true;
  data: {
    messages:
      CofferAiStoredMessage[];
  };
  meta: {
    requestId: string;
    count: number;
  };
}

interface FeedbackResponse {
  success: true;
  message: string;
  meta: {
    requestId: string;
  };
}

export async function sendCofferAiMessage(
  input: {
    message: string;
    conversationId?: string;
    pageContext?: {
      route?: string;
      resourceId?: string;
    };
    signal?: AbortSignal;
  },
): Promise<CofferAiChatResponse> {
  return apiClient<CofferAiChatResponse>(
    "/ai/chat",
    {
      method: "POST",
      signal:
        input.signal,
      body: JSON.stringify({
        message:
          input.message,
        conversationId:
          input.conversationId,
        pageContext:
          input.pageContext,
      }),
    },
  );
}

export async function getCofferAiConversations(
  limit = 20,
  signal?: AbortSignal,
): Promise<ConversationListResponse> {
  const safeLimit =
    Math.min(
      Math.max(
        Math.trunc(limit),
        1,
      ),
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

export async function getCofferAiMessages(
  conversationId: string,
  limit = 100,
  signal?: AbortSignal,
): Promise<MessageListResponse> {
  const safeLimit =
    Math.min(
      Math.max(
        Math.trunc(limit),
        1,
      ),
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

export async function saveCofferAiFeedback(
  input: {
    conversationId: string;
    messageId: string;
    rating:
      | "helpful"
      | "not_helpful";
    comment?: string;
  },
): Promise<FeedbackResponse> {
  return apiClient<FeedbackResponse>(
    `/ai/conversations/${encodeURIComponent(
      input.conversationId,
    )}/feedback`,
    {
      method: "POST",
      body: JSON.stringify({
        messageId:
          input.messageId,
        rating:
          input.rating,
        comment:
          input.comment,
      }),
    },
  );
}
