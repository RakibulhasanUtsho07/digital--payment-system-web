"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  AlertTriangle,
  Bot,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  Database,
  History,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserRound,
} from "lucide-react";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";
import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type VerificationLevel =
  | "verified"
  | "partial"
  | "unknown";

type ConfidenceLevel =
  | "high"
  | "medium"
  | "low";

type AiSource = {
  type: string;
  label: string;
  reference: string;
};

type AiFact = {
  label: string;
  value:
    | string
    | number
    | boolean
    | null;
};

type AiAction = {
  label: string;
  href?: string;
};

type AiChatData = {
  messageId: string;
  conversationId: string;
  content: string;
  verification: VerificationLevel;
  confidence: ConfidenceLevel;
  sources: AiSource[];
  suggestedActions: AiAction[];
  facts: AiFact[];
  toolIds: string[];
  diagnosis?: unknown;
  data?: Record<string, unknown>;
};

type AiChatResponse = {
  success: boolean;
  data: AiChatData;
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
};

type ConversationSummary = {
  conversationId: string;
  title: string;
  lastIntent: string;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

type ConversationListResponse = {
  success: boolean;
  data: {
    conversations: ConversationSummary[];
  };
};

type StoredConversationMessage = {
  messageId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  requestId: string;
  intent: string;
  verification: VerificationLevel;
  confidence: ConfidenceLevel;
  subjectType?: string;
  resourceId?: string;
  sources: AiSource[];
  suggestedActions: AiAction[];
  createdAt: string;
};

type ConversationMessagesResponse = {
  success: boolean;
  data: {
    messages: StoredConversationMessage[];
  };
};

type FeedbackRating =
  | "helpful"
  | "not_helpful";

type UiMessage = {
  key: string;
  messageId?: string;
  conversationId?: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  intent?: string;
  verification?: VerificationLevel;
  confidence?: ConfidenceLevel;
  sources?: AiSource[];
  actions?: AiAction[];
  facts?: AiFact[];
  requestId?: string;
  readOnly?: boolean;
  grounded?: boolean;
  degraded?: boolean;
  modelProvider?: string;
  knowledgeCount?: number;
};

/* =========================================================
   CONSTANTS
========================================================= */

const COPILOT_ROUTE =
  "/dashboard/support-dashboard/ai-copilot";

const SUGGESTED_PROMPTS = [
  "A payment failed with provider_error and the payment attempt shows timeout. What should Support do?",
  "How should Support investigate a failed payment without guessing the exact cause?",
  "What evidence should I verify before escalating a provider-side payment failure?",
];

const verificationClasses:
  Record<VerificationLevel, string> = {
    verified:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    partial:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    unknown:
      "border-border bg-muted text-muted-foreground",
  };

const confidenceClasses:
  Record<ConfidenceLevel, string> = {
    high:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    medium:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    low:
      "border-border bg-muted text-muted-foreground",
  };

/* =========================================================
   HELPERS
========================================================= */

function normalizeRole(
  value: unknown,
): string {
  return String(
    value ?? "",
  )
    .trim()
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_",
    );
}

function formatTime(
  value: string,
): string {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      hour:
        "numeric",
      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}

function formatRelativeLabel(
  value: string,
): string {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recent";
  }

  const diff =
    Date.now() -
    date.getTime();

  const minutes =
    Math.max(
      0,
      Math.floor(
        diff /
          60_000,
      ),
    );

  if (
    minutes < 1
  ) {
    return "Just now";
  }

  if (
    minutes < 60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (
    hours < 24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `${days}d ago`;
}

function safeResourceId(
  value: string,
): string | undefined {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    return undefined;
  }

  if (
    !/^[a-zA-Z0-9_-]+$/.test(
      normalized,
    )
  ) {
    return undefined;
  }

  return normalized.slice(
    0,
    180,
  );
}

function isAuthorizationError(
  error: unknown,
): boolean {
  if (
    !error ||
    typeof error !==
      "object"
  ) {
    return false;
  }

  const status =
    Number(
      (
        error as {
          status?: unknown;
        }
      ).status,
    );

  return (
    status === 401 ||
    status === 403
  );
}

function toUiMessages(
  messages: StoredConversationMessage[],
): UiMessage[] {
  return messages.map(
    (message) => ({
      key:
        message.messageId,
      messageId:
        message.messageId,
      conversationId:
        message.conversationId,
      role:
        message.role,
      content:
        message.content,
      createdAt:
        message.createdAt,
      intent:
        message.intent,
      verification:
        message.verification,
      confidence:
        message.confidence,
      sources:
        message.sources,
      actions:
        message.suggestedActions,
    }),
  );
}


type StructuredAssistantContent = {
  diagnosis: string[];
  supportActions: string[];
  customerReply: string[];
  evidence: string[];
  nextSteps: string[];
  publishedGuidance: string[];
  overview: string[];
  structured: boolean;
};

function stripListPrefix(
  value: string,
): string {
  return value
    .replace(
      /^[-•*]\s*/,
      "",
    )
    .replace(
      /^\d+[.)]\s*/,
      "",
    )
    .trim();
}

function parseAssistantContent(
  content: string,
): StructuredAssistantContent {
  const result: StructuredAssistantContent = {
    diagnosis: [],
    supportActions: [],
    customerReply: [],
    evidence: [],
    nextSteps: [],
    publishedGuidance: [],
    overview: [],
    structured: false,
  };

  const lines =
    content
      .split(/\r?\n/)
      .map(
        (line) =>
          line.trim(),
      )
      .filter(Boolean);

  let section:
    | "overview"
    | "evidence"
    | "next"
    | "knowledge" =
    "overview";

  let correlatedContext =
    false;

  for (
    const rawLine of lines
  ) {
    const line =
      rawLine
        .replace(
          /\\([.*_`#\[\]()])/g,
          "$1",
        )
        .trim();

    const normalized =
      line.toLowerCase();

    if (
      normalized ===
      "evidence"
    ) {
      section =
        "evidence";
      correlatedContext =
        false;
      result.structured =
        true;
      continue;
    }

    if (
      normalized ===
      "next step" ||
      normalized ===
        "next steps"
    ) {
      section =
        "next";
      correlatedContext =
        false;
      result.structured =
        true;
      continue;
    }

    if (
      normalized ===
      "published support guidance"
    ) {
      section =
        "knowledge";
      correlatedContext =
        false;
      result.structured =
        true;
      continue;
    }

    if (
      section ===
      "evidence"
    ) {
      result.evidence.push(
        stripListPrefix(
          line,
        ),
      );
      continue;
    }

    if (
      section ===
      "next"
    ) {
      result.nextSteps.push(
        stripListPrefix(
          line,
        ),
      );
      continue;
    }

    if (
      section ===
      "knowledge"
    ) {
      result.publishedGuidance.push(
        stripListPrefix(
          line,
        ),
      );
      continue;
    }

    if (
      normalized.startsWith(
        "customer-facing first response:",
      )
    ) {
      result.customerReply.push(
        line.slice(
          line.indexOf(
            ":",
          ) + 1,
        ).trim(),
      );
      result.structured =
        true;
      correlatedContext =
        false;
      continue;
    }

    if (
      normalized.startsWith(
        "first support:",
      )
    ) {
      result.supportActions.push(
        line.slice(
          line.indexOf(
            ":",
          ) + 1,
        ).trim(),
      );
      result.structured =
        true;
      correlatedContext =
        false;
      continue;
    }

    if (
      normalized.startsWith(
        "correlated context:",
      )
    ) {
      correlatedContext =
        true;
      result.structured =
        true;
      continue;
    }

    if (
      correlatedContext &&
      /^[-•*]/.test(
        line,
      )
    ) {
      result.diagnosis.push(
        stripListPrefix(
          line,
        ),
      );
      continue;
    }

    correlatedContext =
      false;

    if (
      normalized.startsWith(
        "diagnosis:",
      ) ||
      normalized.startsWith(
        "verified state:",
      ) ||
      normalized.startsWith(
        "verified cause:",
      ) ||
      normalized.startsWith(
        "escalation:",
      ) ||
      normalized.startsWith(
        "case resolution:",
      ) ||
      normalized.startsWith(
        "internal escalation required:",
      ) ||
      normalized.startsWith(
        "escalation team:",
      )
    ) {
      result.diagnosis.push(
        line,
      );
      result.structured =
        true;
      continue;
    }

    if (
      normalized.startsWith(
        "deep case report:",
      ) ||
      normalized.startsWith(
        "payment ",
      ) ||
      normalized.startsWith(
        "customer:",
      ) ||
      normalized.startsWith(
        "status:",
      )
    ) {
      continue;
    }

    result.overview.push(
      line,
    );
  }

  return result;
}

/* =========================================================
   ACCESS STATES
========================================================= */

function SupportNotFoundState() {
  return (
    <main className="relative flex min-h-[78vh] items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[120px]" />

      <motion.section
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.45,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,.10)] sm:p-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/[0.08] blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-500/15 bg-emerald-500/10 text-emerald-600">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">
            Support only
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Page not available
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            This workspace is available only to the authenticated Support role.
          </p>
        </div>
      </motion.section>
    </main>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportAiCopilotPage() {
  const {
    user,
  } =
    useDashboardSession();

  const role =
    normalizeRole(
      user.role,
    );

  if (
    role !== "support"
  ) {
    return (
      <SupportNotFoundState />
    );
  }

  return (
    <SupportAiCopilotContent />
  );
}

/* =========================================================
   CONTENT
========================================================= */

function SupportAiCopilotContent() {
  const [
    conversations,
    setConversations,
  ] =
    useState<ConversationSummary[]>([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] =
    useState("");

  const [
    messages,
    setMessages,
  ] =
    useState<UiMessage[]>([]);

  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    resourceId,
    setResourceId,
  ] =
    useState("");

  const [
    loadingConversations,
    setLoadingConversations,
  ] =
    useState(true);

  const [
    loadingMessages,
    setLoadingMessages,
  ] =
    useState(false);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    copiedMessageId,
    setCopiedMessageId,
  ] =
    useState("");

  const [
    feedbackByMessage,
    setFeedbackByMessage,
  ] =
    useState<Record<string, FeedbackRating>>({});

  const endRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  const activeConversation =
    useMemo(
      () =>
        conversations.find(
          (conversation) =>
            conversation.conversationId ===
            activeConversationId,
        ) ?? null,
      [
        activeConversationId,
        conversations,
      ],
    );

  const loadConversations =
    useCallback(
      async (
        selectNewest = false,
      ) => {
        setLoadingConversations(
          true,
        );

        try {
          const response =
            await apiClient<ConversationListResponse>(
              "/ai/conversations?limit=30",
            );

          const next =
            response.data
              ?.conversations ??
            [];

          setConversations(
            next,
          );

          if (
            selectNewest &&
            next.length > 0
          ) {
            setActiveConversationId(
              next[0].conversationId,
            );
          }
        } catch (
          loadError
        ) {
          if (
            isAuthorizationError(
              loadError,
            )
          ) {
            setError(
              "Your Support session is no longer authorized. Please sign in again.",
            );
          } else {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Unable to load AI conversations.",
            );
          }
        } finally {
          setLoadingConversations(
            false,
          );
        }
      },
      [],
    );

  const loadConversationMessages =
    useCallback(
      async (
        conversationId: string,
      ) => {
        if (
          !conversationId
        ) {
          return;
        }

        setLoadingMessages(
          true,
        );
        setError("");

        try {
          const response =
            await apiClient<ConversationMessagesResponse>(
              `/ai/conversations/${encodeURIComponent(
                conversationId,
              )}/messages?limit=200`,
            );

          setMessages(
            toUiMessages(
              response.data
                ?.messages ??
                [],
            ),
          );
        } catch (
          loadError
        ) {
          setMessages([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load this conversation.",
          );
        } finally {
          setLoadingMessages(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    void loadConversations();
  }, [
    loadConversations,
  ]);

  useEffect(() => {
    if (
      activeConversationId
    ) {
      void loadConversationMessages(
        activeConversationId,
      );
    }
  }, [
    activeConversationId,
    loadConversationMessages,
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior:
        "smooth",
      block:
        "end",
    });
  }, [
    messages,
    sending,
  ]);

  const startNewConversation =
    () => {
      setActiveConversationId("");
      setMessages([]);
      setInput("");
      setResourceId("");
      setError("");
      window.setTimeout(
        () =>
          textareaRef.current?.focus(),
        0,
      );
    };

  const sendMessage =
    useCallback(
      async (
        overrideMessage?: string,
      ) => {
        const message =
          (
            overrideMessage ??
            input
          ).trim();

        if (
          !message ||
          sending
        ) {
          return;
        }

        const optimisticKey =
          `user-${Date.now()}`;

        const now =
          new Date().toISOString();

        setMessages(
          (current) => [
            ...current,
            {
              key:
                optimisticKey,
              role:
                "user",
              content:
                message,
              createdAt:
                now,
            },
          ],
        );

        setInput("");
        setError("");
        setSending(
          true,
        );

        try {
          const contextResourceId =
            safeResourceId(
              resourceId,
            );

          const response =
            await apiClient<AiChatResponse>(
              "/ai/chat",
              {
                method:
                  "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    message,
                    ...(activeConversationId
                      ? {
                          conversationId:
                            activeConversationId,
                        }
                      : {}),
                    pageContext: {
                      route:
                        COPILOT_ROUTE,
                      ...(contextResourceId
                        ? {
                            resourceId:
                              contextResourceId,
                          }
                        : {}),
                    },
                  }),
              },
            );

          const nextConversationId =
            response.data
              .conversationId;

          setActiveConversationId(
            nextConversationId,
          );

          setMessages(
            (current) => [
              ...current,
              {
                key:
                  response.data
                    .messageId,
                messageId:
                  response.data
                    .messageId,
                conversationId:
                  nextConversationId,
                role:
                  "assistant",
                content:
                  response.data
                    .content,
                createdAt:
                  new Date().toISOString(),
                intent:
                  response.meta
                    .intent,
                verification:
                  response.data
                    .verification,
                confidence:
                  response.data
                    .confidence,
                sources:
                  response.data
                    .sources,
                actions:
                  response.data
                    .suggestedActions,
                facts:
                  response.data
                    .facts,
                requestId:
                  response.meta
                    .requestId,
                readOnly:
                  response.meta
                    .readOnly,
                grounded:
                  response.meta
                    .grounded,
                degraded:
                  response.meta
                    .degraded,
                modelProvider:
                  response.meta
                    .modelProvider,
                knowledgeCount:
                  response.meta
                    .knowledgeCount ??
                  0,
              },
            ],
          );

          await loadConversations();
        } catch (
          sendError
        ) {
          setMessages(
            (current) =>
              current.filter(
                (messageItem) =>
                  messageItem.key !==
                  optimisticKey,
              ),
          );

          setInput(
            message,
          );

          setError(
            sendError instanceof Error
              ? sendError.message
              : "Coffer AI could not complete the request.",
          );
        } finally {
          setSending(
            false,
          );
        }
      },
      [
        activeConversationId,
        input,
        loadConversations,
        resourceId,
        sending,
      ],
    );

  const sendFeedback =
    useCallback(
      async (
        message: UiMessage,
        rating: FeedbackRating,
      ) => {
        if (
          !message.messageId ||
          !message.conversationId
        ) {
          return;
        }

        try {
          await apiClient(
            `/ai/conversations/${encodeURIComponent(
              message.conversationId,
            )}/feedback`,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  messageId:
                    message.messageId,
                  rating,
                }),
            },
          );

          setFeedbackByMessage(
            (current) => ({
              ...current,
              [message.messageId!]:
                rating,
            }),
          );
        } catch (
          feedbackError
        ) {
          setError(
            feedbackError instanceof Error
              ? feedbackError.message
              : "Unable to save feedback.",
          );
        }
      },
      [],
    );

  const copyMessage =
    useCallback(
      async (
        message: UiMessage,
      ) => {
        try {
          await navigator.clipboard.writeText(
            message.content,
          );

          setCopiedMessageId(
            message.key,
          );

          window.setTimeout(
            () =>
              setCopiedMessageId(
                "",
              ),
            1600,
          );
        } catch {
          setCopiedMessageId(
            "",
          );
        }
      },
      [],
    );

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-transparent px-1 pb-6 sm:px-2 md:px-3">
      <div className="mx-auto w-full max-w-[1550px] space-y-5">
        {/* =====================================================
            PREMIUM HERO — ORIGINAL VISUAL LANGUAGE PRESERVED
        ===================================================== */}
        <motion.section
          initial={{
            opacity: 0,
            y: -14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.58,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          className="support-ai-hero relative overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_22px_65px_rgba(16,185,129,0.22)]"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="support-ai-grid absolute inset-0 opacity-40" />
            <div className="support-ai-stars absolute inset-0 opacity-50" />
            <div className="support-ai-orb absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="support-ai-orb-delayed absolute -bottom-32 left-[30%] h-80 w-80 rounded-full bg-cyan-200/15 blur-3xl" />
            <div className="support-ai-beam absolute -left-48 top-1/2 h-28 w-[520px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="support-ai-ring support-ai-ring-one absolute -right-20 top-1/2 hidden h-[380px] w-[380px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
            <div className="support-ai-ring support-ai-ring-two absolute right-0 top-1/2 hidden h-[250px] w-[250px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
          </div>

          <div className="relative z-10 grid min-h-[300px] gap-8 p-5 sm:p-6 lg:p-7 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center xl:p-8 2xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="max-w-3xl">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-50 backdrop-blur-md sm:text-[10px]">
                <span className="support-ai-live-dot h-2 w-2 rounded-full bg-emerald-200" />
                Support Operations
                <span className="h-1 w-1 rounded-full bg-white/40" />
                Grounded AI copilot
              </div>

              <div className="mt-5 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-start">
                <motion.div
                  animate={{
                    y: [
                      0,
                      -6,
                      0,
                    ],
                    rotate: [
                      0,
                      1.5,
                      0,
                      -1.5,
                      0,
                    ],
                  }}
                  transition={{
                    duration: 6.5,
                    repeat:
                      Infinity,
                    ease:
                      "easeInOut",
                  }}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-white shadow-[0_14px_34px_rgba(6,78,59,0.22)] backdrop-blur-md sm:h-16 sm:w-16"
                >
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
                  <span className="support-ai-icon-pulse absolute inset-0 rounded-[20px] border border-white/20" />
                </motion.div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[36px] lg:leading-[1.08]">
                    AI Support Copilot
                  </h1>

                  <p className="mt-3 max-w-2xl text-[11px] leading-5 text-emerald-50/80 sm:text-xs sm:leading-6">
                    Ask questions in natural language, investigate live evidence,
                    reuse human-approved knowledge and keep every financial action
                    under human control.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-3">
                <HeroMini
                  icon={
                    MessageSquareText
                  }
                  label="Conversation"
                  value={
                    activeConversationId
                      ? "Active"
                      : "New"
                  }
                />

                <HeroMini
                  icon={
                    Database
                  }
                  label="Knowledge"
                  value="Published only"
                />

                <HeroMini
                  icon={
                    ShieldCheck
                  }
                  label="Financial actions"
                  value="Disabled"
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-[9px] font-bold text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_12px_rgba(167,243,208,0.85)]" />
                  Server-verified Support role
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5">
                  <BookOpen className="h-3 w-3" />
                  Human-approved KB
                </span>
              </div>
            </div>

            {/* Desktop animated copilot visual */}
            <div className="relative mx-auto hidden h-[260px] w-full max-w-[430px] xl:block">
              <div className="absolute left-1/2 top-1/2 h-[238px] w-[238px] -translate-x-1/2 -translate-y-1/2">
                <div className="support-ai-core absolute left-1/2 top-1/2 flex h-[108px] w-[108px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[32px] border border-white/20 bg-white/10 shadow-[0_28px_65px_rgba(6,78,59,0.30)] backdrop-blur-xl">
                  <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[24px] border border-white/15 bg-white/10 text-white">
                    <Bot className="h-8 w-8" />
                  </div>

                  <span className="support-ai-core-ring absolute -inset-3 rounded-[38px] border border-white/15" />
                  <span className="support-ai-core-ring support-ai-core-ring-delay absolute -inset-7 rounded-[48px] border border-white/10" />
                </div>

                <div className="support-ai-orbit support-ai-orbit-one absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20">
                  <div className="support-ai-orbit-item support-ai-orbit-item-one absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-ai-orbit support-ai-orbit-two absolute left-1/2 top-1/2 h-[246px] w-[246px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10">
                  <div className="support-ai-orbit-item support-ai-orbit-item-two absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-ai-float-card support-ai-float-card-one absolute -left-14 top-8 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <Database className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Grounded
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        Live evidence
                      </p>
                    </div>
                  </div>
                </div>

                <div className="support-ai-float-card support-ai-float-card-two absolute -right-16 bottom-7 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Controlled
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        Human approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="support-ai-scan absolute left-1/2 top-1/2 h-[1px] w-[315px] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-100/70 to-transparent" />
            </div>
          </div>
        </motion.section>

        {/* =====================================================
            COPILOT WORKSPACE
        ===================================================== */}
        <section className="grid min-w-0 gap-5 xl:grid-cols-[310px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* CONVERSATION RAIL */}
          <aside className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-sm font-black text-foreground">
                      Conversations
                    </h2>
                  </div>

                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                    Your private Support AI history
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadConversations()
                  }
                  disabled={
                    loadingConversations
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-50 dark:hover:text-emerald-400"
                  title="Refresh conversations"
                >
                  {loadingConversations ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>

              <motion.button
                type="button"
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.985,
                }}
                onClick={
                  startNewConversation
                }
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white shadow-[0_10px_25px_rgba(16,185,129,0.18)] transition hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                New conversation
              </motion.button>
            </div>

            <div className="support-ai-scroll max-h-[600px] overflow-y-auto p-2 xl:max-h-[calc(100vh-250px)]">
              {loadingConversations ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-[78px] animate-pulse rounded-2xl bg-muted"
                      />
                    ),
                  )}
                </div>
              ) : conversations.length ===
                0 ? (
                <div className="px-4 py-10 text-center">
                  <MessageSquareText className="mx-auto h-7 w-7 text-muted-foreground/40" />
                  <p className="mt-3 text-xs font-black text-muted-foreground">
                    No conversations yet
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Ask your first Support question to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {conversations.map(
                    (conversation) => {
                      const active =
                        conversation.conversationId ===
                        activeConversationId;

                      return (
                        <button
                          key={
                            conversation.conversationId
                          }
                          type="button"
                          onClick={() => {
                            setActiveConversationId(
                              conversation.conversationId,
                            );
                            setError("");
                          }}
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-emerald-500/30 bg-emerald-500/10 shadow-sm"
                              : "border-transparent hover:border-border hover:bg-muted/70"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              active
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              <MessageSquareText className="h-3.5 w-3.5" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-[11px] font-black leading-4 text-foreground">
                                {conversation.title}
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-emerald-700/80 dark:text-emerald-400/80">
                                  {conversation.lastIntent.replace(
                                    /_/g,
                                    " ",
                                  )}
                                </span>

                                <span className="shrink-0 text-[8px] font-semibold text-muted-foreground">
                                  {formatRelativeLabel(
                                    conversation.lastMessageAt,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* CHAT PANEL */}
          <section className="min-w-0 overflow-hidden rounded-[30px] border border-border bg-card shadow-sm">
            {/* CHAT HEADER */}
            <div className="border-b border-border bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-teal-500/[0.06] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <motion.div
                    animate={{
                      rotate: [
                        0,
                        2,
                        0,
                        -2,
                        0,
                      ],
                    }}
                    transition={{
                      duration: 8,
                      repeat:
                        Infinity,
                      ease:
                        "easeInOut",
                    }}
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    <Bot className="h-5 w-5" />
                    <span className="support-ai-chat-pulse absolute -inset-1 rounded-[18px] border border-emerald-500/15" />
                  </motion.div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-black text-foreground sm:text-base">
                        {activeConversation?.title ||
                          "Ask Coffer AI"}
                      </h2>

                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.09em] text-emerald-700 dark:text-emerald-300">
                        Read only
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                      Live evidence + published Support knowledge + conversation context
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:w-auto">
                  <StatusMini
                    icon={
                      ShieldCheck
                    }
                    label="Role"
                    value="Support"
                  />
                  <StatusMini
                    icon={
                      Database
                    }
                    label="Grounding"
                    value="On"
                  />
                  <StatusMini
                    icon={
                      BookOpen
                    }
                    label="KB"
                    value="Approved"
                  />
                </div>
              </div>
            </div>

            {/* MESSAGE VIEWPORT */}
            <div className="support-ai-scroll relative h-[560px] overflow-y-auto bg-background/35 px-3 py-5 sm:h-[620px] sm:px-5 lg:px-6">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-24 top-16 h-64 w-64 rounded-full bg-emerald-500/[0.04] blur-3xl" />
                <div className="absolute -left-28 bottom-12 h-64 w-64 rounded-full bg-teal-500/[0.04] blur-3xl" />
              </div>

              <div className="relative mx-auto w-full max-w-5xl">
                {loadingMessages ? (
                  <div className="flex min-h-[420px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                      <p className="mt-3 text-xs font-black text-foreground">
                        Loading conversation
                      </p>
                    </div>
                  </div>
                ) : messages.length ===
                  0 ? (
                  <EmptyChatState
                    onPrompt={(prompt) => {
                      setInput(
                        prompt,
                      );
                      window.setTimeout(
                        () =>
                          textareaRef.current?.focus(),
                        0,
                      );
                    }}
                  />
                ) : (
                  <div className="space-y-5">
                    <AnimatePresence initial={false}>
                      {messages.map(
                        (message) => (
                          <ChatMessage
                            key={
                              message.key
                            }
                            message={
                              message
                            }
                            copied={
                              copiedMessageId ===
                              message.key
                            }
                            feedback={
                              message.messageId
                                ? feedbackByMessage[
                                    message.messageId
                                  ]
                                : undefined
                            }
                            onCopy={() =>
                              void copyMessage(
                                message,
                              )
                            }
                            onFeedback={(
                              rating,
                            ) =>
                              void sendFeedback(
                                message,
                                rating,
                              )
                            }
                          />
                        ),
                      )}
                    </AnimatePresence>

                    {sending ? (
                      <TypingIndicator />
                    ) : null}
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </div>

            {/* ERROR */}
            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 8,
                  }}
                  className="border-t border-rose-500/15 bg-rose-500/[0.07] px-4 py-3 sm:px-5"
                >
                  <div className="flex items-start gap-2 text-xs font-semibold leading-5 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* COMPOSER */}
            <div className="border-t border-border bg-card p-3 sm:p-4 lg:p-5">
              <div className="mx-auto w-full max-w-5xl">
                <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="relative">
                    <Database className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={
                        resourceId
                      }
                      onChange={(
                        event,
                      ) =>
                        setResourceId(
                          event.target.value,
                        )
                      }
                      placeholder="Optional payment / transaction / customer reference"
                      className="h-10 w-full rounded-xl border border-border bg-muted/55 pl-9 pr-3 text-[10px] font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:bg-background focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    IDs are re-authorized by the backend
                  </span>
                </div>

                <div className="relative rounded-[24px] border border-border bg-background p-2 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10">
                  <textarea
                    ref={
                      textareaRef
                    }
                    value={input}
                    onChange={(
                      event,
                    ) =>
                      setInput(
                        event.target.value,
                      )
                    }
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                          "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    disabled={sending}
                    rows={3}
                    maxLength={4000}
                    placeholder="Ask Coffer AI about a payment, transaction, customer issue, support procedure, or verified evidence..."
                    className="max-h-40 min-h-[74px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
                  />

                  <div className="flex flex-col gap-2 border-t border-border/70 px-2 pb-1 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.08] px-2.5 py-1">
                        <BookOpen className="h-3 w-3 text-emerald-600" />
                        Published KB eligible
                      </span>
                      <span>
                        Enter to send · Shift+Enter for new line
                      </span>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{
                        y: -1,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      onClick={() =>
                        void sendMessage()
                      }
                      disabled={
                        sending ||
                        !input.trim()
                      }
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-[0_10px_22px_rgba(16,185,129,0.18)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {sending
                        ? "Thinking…"
                        : "Ask Coffer AI"}
                    </motion.button>
                  </div>
                </div>

                <p className="mt-2 text-center text-[9px] leading-4 text-muted-foreground">
                  Coffer AI can investigate and recommend. It cannot execute payments, refunds, transfers, wallet changes, KYC decisions, or other financial/security mutations.
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>

      <style>{`
        .support-ai-hero {
          isolation: isolate;
        }

        .support-ai-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.42) transparent;
        }

        .support-ai-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .support-ai-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .support-ai-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.36);
          background-clip: padding-box;
        }

        .support-ai-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(5, 150, 105, 0.54);
          background-clip: padding-box;
        }

        .support-ai-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(circle at 56% 45%, rgba(0,0,0,.98), rgba(0,0,0,.3) 65%, transparent 100%);
          animation: supportAiGridMove 20s linear infinite;
        }

        .support-ai-stars {
          background-image:
            radial-gradient(circle at 18% 22%, rgba(255,255,255,.20) 0 1px, transparent 1px),
            radial-gradient(circle at 82% 28%, rgba(255,255,255,.12) 0 1px, transparent 1px),
            radial-gradient(circle at 36% 82%, rgba(255,255,255,.14) 0 1px, transparent 1px);
          background-size: 82px 82px, 104px 104px, 126px 126px;
          animation: supportAiStars 28s linear infinite;
        }

        .support-ai-orb {
          animation: supportAiOrb 7.5s ease-in-out infinite;
        }

        .support-ai-orb-delayed {
          animation: supportAiOrb 9.5s ease-in-out 1.2s infinite reverse;
        }

        .support-ai-beam {
          animation: supportAiBeam 8s ease-in-out infinite;
        }

        .support-ai-ring-one {
          animation: supportAiRing 12s linear infinite;
        }

        .support-ai-ring-two {
          animation: supportAiRing 8.5s linear infinite reverse;
        }

        .support-ai-live-dot {
          box-shadow: 0 0 0 0 rgba(167,243,208,.65);
          animation: supportAiLiveDot 2s ease-out infinite;
        }

        .support-ai-icon-pulse {
          animation: supportAiIconPulse 3.2s ease-out infinite;
        }

        .support-ai-card-shine {
          animation: supportAiCardShine 6.5s ease-in-out infinite;
        }

        .support-ai-core {
          animation: supportAiCoreFloat 5.3s ease-in-out infinite;
        }

        .support-ai-core-ring {
          animation: supportAiCoreRing 3.5s ease-out infinite;
        }

        .support-ai-core-ring-delay {
          animation-delay: 1.75s;
        }

        .support-ai-orbit-one {
          animation: supportAiOrbit 13s linear infinite;
        }

        .support-ai-orbit-two {
          animation: supportAiOrbit 18s linear infinite reverse;
        }

        .support-ai-orbit-item-one {
          animation: supportAiCounterOrbit 13s linear infinite reverse;
        }

        .support-ai-orbit-item-two {
          animation: supportAiCounterOrbit 18s linear infinite;
        }

        .support-ai-float-card-one {
          animation: supportAiFloatCard 5.4s ease-in-out infinite;
        }

        .support-ai-float-card-two {
          animation: supportAiFloatCard 6.3s ease-in-out .8s infinite reverse;
        }

        .support-ai-scan {
          animation: supportAiScan 4.4s ease-in-out infinite;
          filter: drop-shadow(0 0 7px rgba(209,250,229,.6));
        }

        .support-ai-chat-pulse {
          animation: supportAiChatPulse 2.8s ease-out infinite;
        }

        @keyframes supportAiGridMove {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(28px,28px,0); }
        }

        @keyframes supportAiStars {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(-46px,30px,0); }
        }

        @keyframes supportAiOrb {
          0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: .72; }
          50% { transform: translate3d(0,-15px,0) scale(1.08); opacity: 1; }
        }

        @keyframes supportAiBeam {
          0%, 100% { transform: translate3d(0,-50%,0); opacity: .2; }
          50% { transform: translate3d(105px,-50%,0); opacity: .5; }
        }

        @keyframes supportAiRing {
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }

        @keyframes supportAiLiveDot {
          0% { box-shadow: 0 0 0 0 rgba(167,243,208,.58); }
          75%, 100% { box-shadow: 0 0 0 8px rgba(167,243,208,0); }
        }

        @keyframes supportAiIconPulse {
          0% { transform: scale(.92); opacity: .45; }
          70%, 100% { transform: scale(1.22); opacity: 0; }
        }

        @keyframes supportAiCardShine {
          0%, 25% { transform: translateX(-180%); opacity: 0; }
          40% { opacity: 1; }
          70%, 100% { transform: translateX(460%); opacity: 0; }
        }

        @keyframes supportAiCoreFloat {
          0%, 100% { transform: translate(-50%,-50%) translateY(0) rotate(0deg); }
          50% { transform: translate(-50%,-50%) translateY(-7px) rotate(1.6deg); }
        }

        @keyframes supportAiCoreRing {
          0% { transform: scale(.88); opacity: .5; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        @keyframes supportAiOrbit {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }

        @keyframes supportAiCounterOrbit {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(-360deg); }
        }

        @keyframes supportAiFloatCard {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-9px,0); }
        }

        @keyframes supportAiScan {
          0%, 100% { transform: translate(-50%,-98px) scaleX(.75); opacity: 0; }
          15% { opacity: .85; }
          50% { transform: translate(-50%,0) scaleX(1); opacity: .98; }
          85% { opacity: .72; }
          100% { transform: translate(-50%,98px) scaleX(.75); opacity: 0; }
        }

        @keyframes supportAiChatPulse {
          0% { transform: scale(.92); opacity: .55; }
          75%, 100% { transform: scale(1.28); opacity: 0; }
        }

        @media (max-width: 640px) {
          .support-ai-grid { background-size: 24px 24px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-ai-grid,
          .support-ai-stars,
          .support-ai-orb,
          .support-ai-orb-delayed,
          .support-ai-beam,
          .support-ai-ring-one,
          .support-ai-ring-two,
          .support-ai-live-dot,
          .support-ai-icon-pulse,
          .support-ai-card-shine,
          .support-ai-core,
          .support-ai-core-ring,
          .support-ai-orbit-one,
          .support-ai-orbit-two,
          .support-ai-orbit-item-one,
          .support-ai-orbit-item-two,
          .support-ai-float-card-one,
          .support-ai-float-card-two,
          .support-ai-scan,
          .support-ai-chat-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function HeroMini({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 backdrop-blur-md">
      <div className="support-ai-card-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>
          <p className="mt-0.5 truncate text-sm font-black text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusMini({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-[10px] font-black text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyChatState({
  onPrompt,
}: {
  onPrompt: (
    prompt: string,
  ) => void;
}) {
  return (
    <div className="flex min-h-[470px] items-center justify-center py-6">
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="w-full max-w-3xl text-center"
      >
        <motion.div
          animate={{
            y: [
              0,
              -5,
              0,
            ],
          }}
          transition={{
            duration: 4,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[0_18px_45px_rgba(16,185,129,0.10)] dark:text-emerald-300"
        >
          <Bot className="h-7 w-7" />
          <span className="support-ai-chat-pulse absolute -inset-2 rounded-[28px] border border-emerald-500/15" />
        </motion.div>

        <h2 className="mt-5 text-xl font-black tracking-tight text-foreground sm:text-2xl">
          What should Support investigate?
        </h2>

        <p className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">
          Ask about a live payment or transaction, request first-line guidance,
          or test whether published Support knowledge is being reused.
        </p>

        <div className="mt-6 grid gap-2.5 text-left md:grid-cols-3">
          {SUGGESTED_PROMPTS.map(
            (prompt, index) => (
              <motion.button
                key={prompt}
                type="button"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    0.08 *
                    index,
                }}
                whileHover={{
                  y: -2,
                }}
                onClick={() =>
                  onPrompt(
                    prompt,
                  )
                }
                className="group rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-emerald-500/30 hover:bg-emerald-500/[0.05]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {index === 0 ? (
                      <BookOpen className="h-3.5 w-3.5" />
                    ) : index ===
                      1 ? (
                      <CircleHelp className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                </div>

                <p className="mt-3 line-clamp-4 text-[11px] font-bold leading-5 text-foreground/80">
                  {prompt}
                </p>
              </motion.button>
            ),
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AssistantSection({
  icon,
  eyebrow,
  title,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  tone?:
    | "default"
    | "green"
    | "violet"
    | "amber";
}) {
  const toneClasses =
    tone === "green"
      ? "border-emerald-500/20 bg-emerald-500/[0.055]"
      : tone === "violet"
        ? "border-violet-500/20 bg-violet-500/[0.055]"
        : tone === "amber"
          ? "border-amber-500/20 bg-amber-500/[0.055]"
          : "border-border bg-muted/35";

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.28,
      }}
      className={`overflow-hidden rounded-[20px] border p-4 ${toneClasses}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-background/70 bg-background/85 text-emerald-700 shadow-sm dark:text-emerald-300">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[7px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
          <h4 className="mt-1 text-[12px] font-black leading-5 text-foreground">
            {title}
          </h4>

          <div className="mt-3 text-[11px] leading-6 text-foreground/80 sm:text-xs">
            {children}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function AssistantList({
  items,
  numbered = false,
}: {
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div className="space-y-2">
      {items.map(
        (item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-start gap-2.5"
          >
            <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-lg bg-background text-[8px] font-black text-emerald-700 shadow-sm dark:text-emerald-300">
              {numbered
                ? index + 1
                : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
            </span>
            <p className="min-w-0 flex-1 break-words">
              {item}
            </p>
          </div>
        ),
      )}
    </div>
  );
}

function AssistantStructuredResponse({
  message,
}: {
  message: UiMessage;
}) {
  const parsed =
    useMemo(
      () =>
        parseAssistantContent(
          message.content,
        ),
      [message.content],
    );

  const [
    showTechnicalDetails,
    setShowTechnicalDetails,
  ] =
    useState(false);

  const cleanFacts =
    useMemo(
      () =>
        (message.facts ?? [])
          .filter(
            (fact) =>
              fact.value !==
                null &&
              fact.value !==
                "",
          )
          .slice(
            0,
            12,
          ),
      [message.facts],
    );

  if (
    !parsed.structured
  ) {
    return (
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/88">
        {message.content}
      </p>
    );
  }

  const diagnosisTitle =
    message.verification ===
      "verified"
      ? "Verified diagnosis"
      : "Support assessment";

  return (
    <div className="mt-4 space-y-3">
      {parsed.overview.length >
      0 ? (
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
          <p className="whitespace-pre-wrap text-xs leading-6 text-foreground/75">
            {parsed.overview.join(
              "\n",
            )}
          </p>
        </div>
      ) : null}

      {parsed.diagnosis.length >
      0 ? (
        <AssistantSection
          icon={
            <ShieldCheck className="h-4 w-4" />
          }
          eyebrow="Live backend evidence"
          title={diagnosisTitle}
          tone="green"
        >
          <AssistantList
            items={
              parsed.diagnosis
            }
          />
        </AssistantSection>
      ) : null}

      {parsed.supportActions.length >
        0 ||
      parsed.nextSteps.length >
        0 ? (
        <AssistantSection
          icon={
            <ChevronRight className="h-4 w-4" />
          }
          eyebrow="Recommended workflow"
          title="What Support should do next"
          tone="default"
        >
          {parsed.supportActions.length >
          0 ? (
            <div className="mb-3 rounded-xl border border-border bg-background/70 px-3 py-2.5 text-foreground/75">
              {parsed.supportActions.join(
                " ",
              )}
            </div>
          ) : null}

          {parsed.nextSteps.length >
          0 ? (
            <AssistantList
              items={
                parsed.nextSteps
              }
              numbered
            />
          ) : null}
        </AssistantSection>
      ) : null}

      {parsed.customerReply.length >
      0 ? (
        <AssistantSection
          icon={
            <MessageSquareText className="h-4 w-4" />
          }
          eyebrow="Customer-safe wording"
          title="Suggested first response"
          tone="amber"
        >
          <p className="whitespace-pre-wrap">
            {parsed.customerReply.join(
              "\n",
            )}
          </p>
        </AssistantSection>
      ) : null}

      {parsed.publishedGuidance.length >
      0 ? (
        <AssistantSection
          icon={
            <BookOpen className="h-4 w-4" />
          }
          eyebrow="Human-approved knowledge"
          title="Published Support guidance"
          tone="violet"
        >
          <AssistantList
            items={
              parsed.publishedGuidance
            }
          />
        </AssistantSection>
      ) : null}

      {(parsed.evidence.length >
        0 ||
        cleanFacts.length >
          0) ? (
        <div className="rounded-[20px] border border-border bg-background/45">
          <button
            type="button"
            onClick={() =>
              setShowTechnicalDetails(
                (current) =>
                  !current,
              )
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Database className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-muted-foreground">
                  Technical details
                </p>
                <p className="mt-0.5 truncate text-[11px] font-black text-foreground">
                  Evidence and verified facts
                </p>
              </div>
            </div>

            <span className="rounded-full border border-border bg-muted px-2 py-1 text-[8px] font-black text-muted-foreground">
              {showTechnicalDetails
                ? "Hide"
                : "Show"}
            </span>
          </button>

          <AnimatePresence
            initial={false}
          >
            {showTechnicalDetails ? (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: "auto",
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="overflow-hidden"
              >
                <div className="border-t border-border p-4">
                  {parsed.evidence.length >
                  0 ? (
                    <AssistantList
                      items={
                        parsed.evidence
                      }
                    />
                  ) : null}

                  {cleanFacts.length >
                  0 ? (
                    <div className={`grid gap-2 sm:grid-cols-2 xl:grid-cols-3 ${
                      parsed.evidence.length >
                      0
                        ? "mt-4 border-t border-border pt-4"
                        : ""
                    }`}>
                      {cleanFacts.map(
                        (fact) => (
                          <div
                            key={`${fact.label}-${String(
                              fact.value,
                            )}`}
                            className="rounded-xl border border-border bg-muted/50 px-3 py-2"
                          >
                            <p className="text-[7px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                              {fact.label}
                            </p>
                            <p className="mt-1 break-words text-[10px] font-bold text-foreground">
                              {String(
                                fact.value,
                              )}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}

function ChatMessage({
  message,
  copied,
  feedback,
  onCopy,
  onFeedback,
}: {
  message: UiMessage;
  copied: boolean;
  feedback?: FeedbackRating;
  onCopy: () => void;
  onFeedback: (
    rating: FeedbackRating,
  ) => void;
}) {
  const assistant =
    message.role ===
    "assistant";

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 12,
        scale: 0.99,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 6,
      }}
      transition={{
        duration: 0.3,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className={`flex gap-3 ${
        assistant
          ? "items-start"
          : "items-start justify-end"
      }`}
    >
      {assistant ? (
        <div className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <Bot className="h-4 w-4" />
          <span className="support-ai-chat-pulse absolute -inset-1 rounded-[18px] border border-emerald-500/10" />
        </div>
      ) : null}

      <div className={`min-w-0 ${
        assistant
          ? "max-w-[92%] flex-1"
          : "max-w-[82%]"
      }`}>
        <div className={`rounded-[24px] border p-4 sm:p-5 ${
          assistant
            ? "border-border bg-card shadow-sm"
            : "border-emerald-500/25 bg-emerald-600 text-white shadow-[0_12px_30px_rgba(16,185,129,0.16)]"
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.12em] ${
                assistant
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-emerald-50/80"
              }`}>
                {assistant
                  ? "Coffer AI"
                  : "You"}
              </span>

              {assistant &&
              message.verification ? (
                <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${
                  verificationClasses[
                    message.verification
                  ]
                }`}>
                  {message.verification}
                </span>
              ) : null}

              {assistant &&
              message.confidence ? (
                <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${
                  confidenceClasses[
                    message.confidence
                  ]
                }`}>
                  {message.confidence}
                </span>
              ) : null}
            </div>

            <span className={`shrink-0 text-[8px] font-semibold ${
              assistant
                ? "text-muted-foreground"
                : "text-white/60"
            }`}>
              {formatTime(
                message.createdAt,
              )}
            </span>
          </div>

          {assistant ? (
            <AssistantStructuredResponse
              message={message}
            />
          ) : (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white">
              {message.content}
            </p>
          )}

          {assistant &&
          message.sources &&
          message.sources.length >
            0 ? (
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Evidence & sources
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {message.sources.map(
                  (source) => (
                    <span
                      key={`${source.type}-${source.reference}`}
                      title={
                        source.reference
                      }
                      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-black ${
                        source.type ===
                        "knowledge_base"
                          ? "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {source.type ===
                      "knowledge_base" ? (
                        <BookOpen className="h-3 w-3" />
                      ) : (
                        <Database className="h-3 w-3" />
                      )}
                      <span className="truncate">
                        {source.label}
                      </span>
                    </span>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {assistant &&
          message.actions &&
          message.actions.length >
            0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.actions
                .slice(
                  0,
                  6,
                )
                .map(
                  (action) =>
                    action.href ? (
                      <Link
                        key={`${action.label}-${action.href}`}
                        href={
                          action.href
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-[9px] font-black text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        {action.label}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span
                        key={
                          action.label
                        }
                        className="inline-flex items-center rounded-xl border border-border bg-muted/60 px-3 py-2 text-[9px] font-black text-foreground/75"
                      >
                        {action.label}
                      </span>
                    ),
                )}
            </div>
          ) : null}

          {assistant ? (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-[8px] font-semibold text-muted-foreground">
                {message.intent ? (
                  <span className="rounded-full bg-muted px-2 py-1">
                    {message.intent.replace(
                      /_/g,
                      " ",
                    )}
                  </span>
                ) : null}

                {message.knowledgeCount &&
                message.knowledgeCount >
                  0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-violet-700 dark:text-violet-300">
                    <BookOpen className="h-3 w-3" />
                    {message.knowledgeCount} KB source
                  </span>
                ) : null}

                {message.readOnly ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" />
                    read only
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onCopy}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Copy response"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>

                {message.messageId &&
                message.conversationId ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        onFeedback(
                          "helpful",
                        )
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        feedback ===
                        "helpful"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onFeedback(
                          "not_helpful",
                        )
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        feedback ===
                        "not_helpful"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {!assistant ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <UserRound className="h-4 w-4" />
        </div>
      ) : null}
    </motion.article>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="flex items-start gap-3"
    >
      <div className="relative mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <Bot className="h-4 w-4" />
        <span className="support-ai-chat-pulse absolute -inset-1 rounded-[18px] border border-emerald-500/10" />
      </div>

      <div className="rounded-[22px] border border-border bg-card px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(
            (item) => (
              <motion.span
                key={item}
                animate={{
                  y: [
                    0,
                    -4,
                    0,
                  ],
                  opacity: [
                    0.45,
                    1,
                    0.45,
                  ],
                }}
                transition={{
                  duration: 1,
                  repeat:
                    Infinity,
                  delay:
                    item *
                    0.14,
                }}
                className="h-2 w-2 rounded-full bg-emerald-500"
              />
            ),
          )}

          <span className="ml-1 text-[10px] font-bold text-muted-foreground">
            Reviewing live evidence and approved guidance…
          </span>
        </div>
      </div>
    </motion.div>
  );
}
