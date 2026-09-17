import {
  apiClient,
} from "@/lib/api/client";

export type MerchantAiRole =
  | "user"
  | "assistant";

export interface MerchantAiMessage {
  role: MerchantAiRole;
  content: string;
}

export interface MerchantAiContext {
  businessName: string;

  merchantStatus: string;

  verificationStatus:
    string;

  defaultCurrency:
    string;

  testEnabled:
    boolean;

  liveEnabled:
    boolean;

  testKeyConfigured:
    boolean;

  liveKeyConfigured:
    boolean;

  testScopes:
    string[];

  liveScopes:
    string[];

  activeKeyCount:
    number;
}

export async function getMerchantAiContext() {
  const response =
    await apiClient<{
      success: boolean;

      context:
        MerchantAiContext;
    }>(
      "/merchants/ai-assistant/context"
    );

  return response.context;
}

export async function sendMerchantAiMessage(
  input: {
    message: string;

    history:
      MerchantAiMessage[];
  }
) {
  return apiClient<{
    success: boolean;

    answer: string;

    provider: string;

    model: string;
  }>(
    "/merchants/ai-assistant/chat",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          input
        ),
    }
  );
}