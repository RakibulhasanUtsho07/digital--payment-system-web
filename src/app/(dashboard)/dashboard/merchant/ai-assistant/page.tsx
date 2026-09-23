"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  Copy,
  CreditCard,
  Database,
  HandCoins,
  History,
  KeyRound,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  WalletCards,
  Webhook,
} from "lucide-react";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";
import {
  getMerchantAiConversations,
  getMerchantAiMessages,
  saveMerchantAiFeedback,
  sendMerchantAiMessage,
  type MerchantAiAction,
  type MerchantAiConfidence,
  type MerchantAiConversation,
  type MerchantAiFact,
  type MerchantAiSource,
  type MerchantAiVerification,
} from "@/lib/api/cofferMerchantAiApi";

/* =========================================================
   TYPES
========================================================= */

type UiMessage = {
  key: string;
  messageId?: string;
  conversationId?: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  intent?: string;
  verification?: MerchantAiVerification;
  confidence?: MerchantAiConfidence;
  sources?: MerchantAiSource[];
  actions?: MerchantAiAction[];
  facts?: MerchantAiFact[];
  requestId?: string;
  readOnly?: boolean;
  grounded?: boolean;
  degraded?: boolean;
  knowledgeCount?: number;
  pending?: boolean;
};

type FeedbackRating =
  | "helpful"
  | "not_helpful";

/* =========================================================
   CONSTANTS
========================================================= */

const ROUTE =
  "/dashboard/merchant/ai-assistant";

const QUICK_PROMPTS = [
  {
    title: "Business overview",
    description:
      "Review your last 30 days of merchant payment performance.",
    prompt:
      "Give me my merchant payment performance overview for the last 30 days.",
    icon: CircleDollarSign,
  },
  {
    title: "Merchant status",
    description:
      "Check verification plus Test and Live mode availability.",
    prompt:
      "What is my merchant verification status and are Test mode and Live mode enabled?",
    icon: BadgeCheck,
  },
  {
    title: "Payment diagnosis",
    description:
      "Investigate one merchant-owned payment using its payment reference.",
    prompt:
      "Why did this merchant payment fail? Use only verified merchant-owned backend evidence.",
    icon: CreditCard,
  },
  {
    title: "Refunds",
    description:
      "Summarize refund volume and refund statuses from your merchant records.",
    prompt:
      "Give me my merchant refund summary and status breakdown.",
    icon: RefreshCw,
  },
  {
    title: "Payouts",
    description:
      "Review payout counts, amounts, reserved funds and available payout balance.",
    prompt:
      "Give me my payout summary, including pending, completed and failed payouts.",
    icon: HandCoins,
  },
  {
    title: "Settlements",
    description:
      "Review settlement state, gross value, fees, refunds and net value.",
    prompt:
      "Give me my settlement and reconciliation summary.",
    icon: WalletCards,
  },
  {
    title: "Webhooks",
    description:
      "Check endpoint counts and delivery health without exposing signing secrets.",
    prompt:
      "Summarize my webhook endpoints and delivery health for Test and Live.",
    icon: Webhook,
  },
  {
    title: "API-key metadata",
    description:
      "Review safe key metadata, environment, status and scopes only.",
    prompt:
      "Summarize my API key metadata and scopes. Do not reveal any secret.",
    icon: KeyRound,
  },

  {
    title: "Refund diagnosis",
    description:
      "Diagnose one owned refund and distinguish recorded cause from unknown cause.",
    prompt:
      "Why did this refund fail? Use only recorded backend evidence. I will provide the refund ID in the resource field.",
    icon: RefreshCw,
  },
  {
    title: "Payout diagnosis",
    description:
      "Check one owned payout status and its recorded failure reason when available.",
    prompt:
      "Why did this payout fail or get stuck? I will provide the payout ID in the resource field.",
    icon: HandCoins,
  },
  {
    title: "Settlement diagnosis",
    description:
      "Inspect one settlement lifecycle and any recorded reconciliation failure.",
    prompt:
      "Diagnose this settlement and tell me only what is verified. I will provide the settlement ID in the resource field.",
    icon: WalletCards,
  },
  {
    title: "Webhook diagnosis",
    description:
      "Inspect one delivery event without exposing the endpoint signing secret.",
    prompt:
      "Why did this webhook event fail? I will provide the event ID in the resource field.",
    icon: Webhook,
  },
  {
    title: "API-key diagnosis",
    description:
      "Check one key's safe metadata, eligibility and scope without retrieving its secret.",
    prompt:
      "Why is this API key not working? I will provide the key ID in the resource field. Do not reveal any secret.",
    icon: KeyRound,
  },

  {
    title: "Analytics",
    description:
      "Review payment success rate, volume, revenue and customer activity.",
    prompt:
      "Give me my merchant analytics summary for the last 30 days.",
    icon: BarChart3,
  },
] as const;

const verificationClasses:
  Record<MerchantAiVerification, string> = {
    verified:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    partial:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    unknown:
      "border-border bg-muted text-muted-foreground",
  };

const confidenceClasses:
  Record<MerchantAiConfidence, string> = {
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
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function firstName(
  value?: string,
): string {
  const normalized =
    value?.trim();

  if (!normalized) {
    return "there";
  }

  return normalized.split(/\s+/)[0];
}

function formatTime(
  value: string,
): string {
  const date = new Date(value);

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
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

function relativeTime(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recent";
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(
    0,
    Math.floor(diff / 60_000),
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function safeResourceId(
  value: string,
): string | undefined {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  if (
    normalized.length < 6 ||
    normalized.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(
      normalized,
    )
  ) {
    return undefined;
  }

  const placeholder =
    normalized.toUpperCase();

  if (
    /^(?:YOUR_)?(?:PAYMENT|TRANSACTION|TXN|REFUND|PAYOUT|SETTLEMENT|EVENT|WEBHOOK_EVENT|KEY|API_KEY|RESOURCE)_ID$/.test(
      placeholder,
    )
  ) {
    return undefined;
  }

  return normalized;
}

function messageOf(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Coffer AI could not complete the request.";
}

function isAuthorizationError(
  error: unknown,
): boolean {
  const record =
    error &&
    typeof error === "object"
      ? (error as Record<string, unknown>)
      : null;

  const response =
    record?.response &&
    typeof record.response === "object"
      ? (record.response as Record<string, unknown>)
      : null;

  const status = Number(
    record?.status ??
      record?.statusCode ??
      response?.status,
  );

  if (
    status === 401 ||
    status === 403
  ) {
    return true;
  }

  const message = String(
    error instanceof Error
      ? error.message
      : error ?? "",
  ).toLowerCase();

  return (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("not authorized")
  );
}

function MerchantAiNotFoundState() {
  return (
    <main className="relative flex min-h-[78vh] items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.08] blur-[120px]" />

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
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,.10)] sm:p-10"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-violet-500/15 bg-violet-500/10 text-violet-600">
          <LockKeyhole className="h-6 w-6" />
        </div>

        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">
          Error 404
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          Page not found
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          This AI workspace is available only to an authenticated Merchant account.
        </p>
      </motion.section>
    </main>
  );
}

function TextContent({
  value,
}: {
  value: string;
}) {
  const blocks = value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const lines = block.split(/\r?\n/);

        return (
          <div
            key={`${index}-${block.slice(0, 18)}`}
            className="space-y-1"
          >
            {lines.map((line, lineIndex) => {
              const trimmed = line.trim();
              const isBullet = /^[-•*]\s+/.test(trimmed);
              const isNumber = /^\d+\.\s+/.test(trimmed);

              if (isBullet || isNumber) {
                return (
                  <p
                    key={`${lineIndex}-${trimmed}`}
                    className="pl-2 text-[12px] leading-6 text-foreground/90"
                  >
                    {trimmed}
                  </p>
                );
              }

              const headingLike =
                lineIndex === 0 &&
                trimmed.length <= 72 &&
                !/[.!?]$/.test(trimmed);

              return headingLike ? (
                <p
                  key={`${lineIndex}-${trimmed}`}
                  className="text-[12px] font-black leading-5 text-foreground"
                >
                  {trimmed}
                </p>
              ) : (
                <p
                  key={`${lineIndex}-${trimmed}`}
                  className="text-[12px] leading-6 text-foreground/85"
                >
                  {trimmed}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantAiAssistantPage() {
  const { user } =
    useDashboardSession();

  const role = normalizeRole(
    user.role,
  );

  if (role !== "merchant") {
    return <MerchantAiNotFoundState />;
  }

  return (
    <MerchantAiAssistantContent
      merchantName={user.name}
    />
  );
}

/* =========================================================
   CONTENT
========================================================= */

function MerchantAiAssistantContent({
  merchantName,
}: {
  merchantName?: string;
}) {
  const [
    conversations,
    setConversations,
  ] = useState<MerchantAiConversation[]>([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState("");

  const [
    messages,
    setMessages,
  ] = useState<UiMessage[]>([]);

  const [input, setInput] =
    useState("");

  const [
    resourceId,
    setResourceId,
  ] = useState("");

  const [
    loadingConversations,
    setLoadingConversations,
  ] = useState(true);

  const [
    loadingMessages,
    setLoadingMessages,
  ] = useState(false);

  const [sending, setSending] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    accessDenied,
    setAccessDenied,
  ] = useState(false);

  const [
    copiedMessageId,
    setCopiedMessageId,
  ] = useState("");

  const [
    feedbackByMessage,
    setFeedbackByMessage,
  ] = useState<
    Record<string, FeedbackRating>
  >({});

  const messagesScrollRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  const requestRef =
    useRef<AbortController | null>(
      null,
    );

  const messageRequestRef =
    useRef<AbortController | null>(
      null,
    );

  const activeConversation =
    useMemo(
      () =>
        conversations.find(
          (item) =>
            item.conversationId ===
            activeConversationId,
        ) ?? null,
      [
        activeConversationId,
        conversations,
      ],
    );

  const selectConversation =
    useCallback(
      (conversationId: string) => {
        if (
          conversationId ===
          activeConversationId
        ) {
          return;
        }

        /*
         * A conversation switch is a hard request boundary.
         * Abort the old send/history request so an older response
         * cannot append itself into the newly selected thread.
         */
        requestRef.current?.abort();
        messageRequestRef.current?.abort();
        requestRef.current = null;
        messageRequestRef.current = null;

        setSending(false);
        setLoadingMessages(false);
        setResourceId("");
        setError("");
        setActiveConversationId(
          conversationId,
        );
      },
      [activeConversationId],
    );

  const loadConversations =
    useCallback(
      async (
        selectNewest = false,
      ) => {
        setLoadingConversations(true);

        try {
          const response =
            await getMerchantAiConversations(30);

          const next =
            response.data?.conversations ?? [];

          setConversations(next);

          if (
            selectNewest &&
            next.length > 0
          ) {
            setActiveConversationId(
              next[0].conversationId,
            );
          }
        } catch (loadError) {
          if (
            isAuthorizationError(
              loadError,
            )
          ) {
            setAccessDenied(true);
            return;
          }

          setError(
            messageOf(loadError),
          );
        } finally {
          setLoadingConversations(false);
        }
      },
      [],
    );

  const loadMessages =
    useCallback(
      async (
        conversationId: string,
      ) => {
        messageRequestRef.current?.abort();

        if (!conversationId) {
          setMessages([]);
          setLoadingMessages(false);
          return;
        }

        const controller =
          new AbortController();

        messageRequestRef.current =
          controller;

        setLoadingMessages(true);
        setError("");

        try {
          const response =
            await getMerchantAiMessages(
              conversationId,
              200,
              controller.signal,
            );

          if (controller.signal.aborted) {
            return;
          }

          setMessages(
            (response.data?.messages ?? []).map(
              (message) => ({
                key: message.messageId,
                messageId: message.messageId,
                conversationId:
                  message.conversationId,
                role: message.role,
                content: message.content,
                createdAt: message.createdAt,
                intent: message.intent,
                verification:
                  message.verification,
                confidence:
                  message.confidence,
                sources:
                  message.sources ?? [],
                actions:
                  message.suggestedActions ?? [],
                requestId:
                  message.requestId,
              }),
            ),
          );
        } catch (loadError) {
          if (controller.signal.aborted) {
            return;
          }

          if (
            isAuthorizationError(
              loadError,
            )
          ) {
            setAccessDenied(true);
            return;
          }

          setError(
            messageOf(loadError),
          );
        } finally {
          if (
            messageRequestRef.current ===
            controller
          ) {
            messageRequestRef.current =
              null;

            setLoadingMessages(false);
          }
        }
      },
      [],
    );

  useEffect(() => {
    void loadConversations();

    return () => {
      requestRef.current?.abort();
      messageRequestRef.current?.abort();
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(
      activeConversationId,
    );
  }, [
    activeConversationId,
    loadMessages,
  ]);

  useEffect(() => {
    const container =
      messagesScrollRef.current;

    if (!container) {
      return;
    }

    const frame =
      window.requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [messages, sending]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    const element = textareaRef.current;
    element.style.height = "0px";
    element.style.height = `${Math.min(
      180,
      Math.max(54, element.scrollHeight),
    )}px`;
  }, [input]);

  const startNewConversation =
    useCallback(() => {
      requestRef.current?.abort();
      messageRequestRef.current?.abort();
      requestRef.current = null;
      messageRequestRef.current = null;
      setSending(false);
      setLoadingMessages(false);
      setActiveConversationId("");
      setMessages([]);
      setInput("");
      setResourceId("");
      setError("");
      window.setTimeout(
        () => textareaRef.current?.focus(),
        50,
      );
    }, []);

  const submitMessage =
    useCallback(
      async (
        rawMessage?: string,
      ) => {
        const message =
          (rawMessage ?? input).trim();

        if (!message || sending) {
          return;
        }

        const safeId =
          safeResourceId(resourceId);

        if (
          resourceId.trim() &&
          !safeId
        ) {
          setError(
            "Reference must be 6-128 characters and may contain only letters, numbers, underscore, and hyphen. Placeholder IDs are not accepted.",
          );
          return;
        }

        requestRef.current?.abort();
        const controller =
          new AbortController();
        requestRef.current =
          controller;

        const optimisticKey =
          `pending-${Date.now()}`;

        setMessages((current) => [
          ...current,
          {
            key: optimisticKey,
            role: "user",
            content: message,
            createdAt:
              new Date().toISOString(),
            pending: true,
          },
        ]);

        setInput("");
        setError("");
        setSending(true);

        try {
          const response =
            await sendMerchantAiMessage({
              message,
              conversationId:
                activeConversationId ||
                undefined,
              resourceId: safeId,
              route: ROUTE,
              signal: controller.signal,
            });

          const now =
            new Date().toISOString();

          setMessages((current) => [
            ...current.map((item) =>
              item.key === optimisticKey
                ? {
                    ...item,
                    pending: false,
                  }
                : item,
            ),
            {
              key: response.data.messageId,
              messageId:
                response.data.messageId,
              conversationId:
                response.data.conversationId,
              role: "assistant",
              content:
                response.data.content,
              createdAt: now,
              intent:
                response.meta.intent,
              verification:
                response.data.verification,
              confidence:
                response.data.confidence,
              sources:
                response.data.sources ?? [],
              actions:
                response.data.suggestedActions ?? [],
              facts:
                response.data.facts ?? [],
              requestId:
                response.meta.requestId,
              readOnly:
                response.meta.readOnly,
              grounded:
                response.meta.grounded,
              degraded:
                response.meta.degraded,
              knowledgeCount:
                response.meta.knowledgeCount ?? 0,
            },
          ]);

          if (
            !activeConversationId
          ) {
            setActiveConversationId(
              response.data.conversationId,
            );
          }

          await loadConversations();
        } catch (sendError) {
          if (
            controller.signal.aborted
          ) {
            return;
          }

          if (
            isAuthorizationError(
              sendError,
            )
          ) {
            setAccessDenied(true);
            return;
          }

          setMessages((current) =>
            current.filter(
              (item) =>
                item.key !== optimisticKey,
            ),
          );

          setInput(message);
          setError(
            messageOf(sendError),
          );
        } finally {
          if (
            requestRef.current ===
            controller
          ) {
            requestRef.current = null;
            setSending(false);
          }
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

  const submit = (
    event: FormEvent,
  ) => {
    event.preventDefault();
    void submitMessage();
  };

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
          await saveMerchantAiFeedback({
            conversationId:
              message.conversationId,
            messageId:
              message.messageId,
            rating,
          });

          setFeedbackByMessage(
            (current) => ({
              ...current,
              [message.messageId!]: rating,
            }),
          );
        } catch (feedbackError) {
          setError(
            messageOf(feedbackError),
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
            () => setCopiedMessageId(""),
            1500,
          );
        } catch {
          setCopiedMessageId("");
        }
      },
      [],
    );

  if (accessDenied) {
    return <MerchantAiNotFoundState />;
  }

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-transparent px-1 pb-6 sm:px-2 md:px-3">
      <div className="mx-auto w-full max-w-[1540px] space-y-5">
        {/* HERO */}
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
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative isolate overflow-hidden rounded-[30px] border border-violet-300/20 bg-[linear-gradient(135deg,#140B29_0%,#2C1854_45%,#4C2B85_100%)] p-5 text-white shadow-[0_28px_85px_-42px_rgba(91,58,143,.75)] sm:p-6 lg:p-8"
        >
          <motion.div
            aria-hidden
            animate={{
              x: [0, 34, -12, 0],
              y: [0, -18, 10, 0],
              scale: [1, 1.14, 0.97, 1],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-violet-300/20 blur-[100px]"
          />

          <motion.div
            aria-hidden
            animate={{
              x: [0, -20, 14, 0],
              y: [0, 18, -8, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-36 left-[20%] h-80 w-80 rounded-full bg-fuchsia-300/15 blur-[105px]"
          />

          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-violet-50 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  Merchant AI Copilot
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100/20 bg-emerald-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Owned merchant only
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.04em] sm:text-3xl lg:text-[38px] lg:leading-[1.08]">
                Hi {firstName(merchantName)}, ask Coffer AI about your business
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-violet-100/75">
                Review merchant payments, refunds, payouts, settlements, webhooks, API-key metadata and analytics — including resource-level diagnostics — through a read-only, backend-authorized AI workspace. Coffer AI never trusts a client-supplied role, merchant ID or financial state as authority.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-violet-50/75">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Live merchant evidence
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Read only
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Evidence-bound answers
                </span>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{
                y: -2,
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.97,
              }}
              onClick={startNewConversation}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-violet-900 shadow-[0_12px_32px_rgba(0,0,0,.18)] transition hover:bg-violet-50 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New conversation
            </motion.button>
          </div>
        </motion.section>

        {/* CAPABILITY CARDS */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_PROMPTS.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.button
                key={item.title}
                type="button"
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.05,
                }}
                whileHover={{
                  y: -3,
                }}
                onClick={() =>
                  void submitMessage(
                    item.prompt,
                  )
                }
                disabled={sending}
                className="group rounded-[24px] border border-border bg-card p-4 text-left shadow-sm transition hover:border-violet-300 disabled:opacity-60 dark:hover:border-violet-700"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                </div>
              </motion.button>
            );
          })}
        </section>

        {/* WORKSPACE */}
        <section className="grid gap-4 xl:h-[calc(100dvh-120px)] xl:min-h-[620px] xl:max-h-[820px] xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch xl:overflow-hidden">
          {/* HISTORY */}
          <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-sm xl:h-full xl:min-h-0">
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                  <History className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-black text-foreground">
                    Conversations
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    Your AI history
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Refresh conversations"
                onClick={() => {
                  setRefreshing(true);
                  void loadConversations().finally(
                    () => setRefreshing(false),
                  );
                }}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-violet-600"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5">
              {loadingConversations ? (
                <div className="grid min-h-[220px] place-items-center text-center">
                  <div>
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-violet-600" />
                    <p className="mt-3 text-[10px] font-bold text-muted-foreground">
                      Loading history…
                    </p>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                  <MessageSquareText className="mx-auto h-5 w-5 text-muted-foreground/60" />
                  <p className="mt-3 text-xs font-black text-foreground">
                    No conversations yet
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Ask about merchant performance, finance operations, integrations or investigate one of your merchant payments.
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
                          key={conversation.conversationId}
                          type="button"
                          onClick={() =>
                            selectConversation(
                              conversation.conversationId,
                            )
                          }
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-violet-500/25 bg-violet-500/10"
                              : "border-transparent hover:border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                              active
                                ? "bg-violet-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              <Bot className="h-3.5 w-3.5" />
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10px] font-black text-foreground">
                                {conversation.title ||
                                  "Coffer AI conversation"}
                              </p>
                              <p className="mt-1 truncate text-[9px] text-muted-foreground">
                                {conversation.lastIntent.replaceAll(
                                  "_",
                                  " ",
                                )} · {relativeTime(
                                  conversation.lastMessageAt,
                                )}
                              </p>
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

          {/* CHAT */}
          <article className="flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-sm xl:h-full xl:min-h-0">
            <div className="shrink-0 flex flex-col gap-3 border-b border-border bg-violet-500/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/15">
                  <Sparkles className="h-4 w-4" />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-foreground">
                    {activeConversation?.title ||
                      "Coffer AI Merchant Assistant"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-bold text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      authenticated merchant scope
                    </span>
                    <span>·</span>
                    <span>read only</span>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/merchant/payments"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-[10px] font-black text-foreground transition hover:border-violet-300 hover:text-violet-600"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Merchant payments
              </Link>
            </div>

            <div
              ref={messagesScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
            >
              {loadingMessages ? (
                <div className="grid h-full min-h-[360px] place-items-center text-center">
                  <div>
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />
                    <p className="mt-3 text-xs font-black text-foreground">
                      Loading conversation
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="mx-auto flex h-full min-h-[420px] max-w-xl flex-col items-center justify-center text-center">
                  <motion.div
                    animate={{
                      y: [0, -6, 0],
                    }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="grid h-20 w-20 place-items-center rounded-[28px] border border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                  >
                    <Bot className="h-8 w-8" />
                  </motion.div>

                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                    Merchant operations copilot
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-foreground">
                    What would you like to check?
                  </h2>

                  <p className="mt-3 max-w-md text-xs leading-6 text-muted-foreground">
                    Ask about payments, refunds, payouts, settlements, webhook delivery, API-key metadata or analytics. You can also paste an owned resource ID for deterministic diagnosis. Merchant-owned backend records remain authoritative, and secrets or money-moving actions are never exposed through chat.
                  </p>
                </div>
              ) : (
                <div
                  aria-live="polite"
                  className="space-y-5"
                >
                  {messages.map((message) => {
                    if (
                      message.role === "user"
                    ) {
                      return (
                        <div
                          key={message.key}
                          className="flex justify-end"
                        >
                          <div className="max-w-[88%] rounded-[20px] rounded-br-[6px] bg-gradient-to-br from-violet-700 to-[#2B174E] px-4 py-3 text-[12px] font-semibold leading-6 text-white shadow-[0_12px_30px_rgba(91,58,143,.20)] sm:max-w-[78%]">
                            {message.content}
                            {message.pending ? (
                              <span className="mt-2 flex items-center justify-end gap-1 text-[8px] font-bold uppercase tracking-wider text-violet-200">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                checking
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    }

                    const verification =
                      message.verification ??
                      "unknown";
                    const confidence =
                      message.confidence ??
                      "low";
                    const feedback =
                      message.messageId
                        ? feedbackByMessage[
                            message.messageId
                          ]
                        : undefined;

                    return (
                      <div
                        key={message.key}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <Sparkles className="h-4 w-4" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="rounded-[22px] rounded-tl-[7px] border border-border bg-background p-4 shadow-sm sm:p-5">
                            <TextContent
                              value={message.content}
                            />

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${verificationClasses[verification]}`}>
                                {verification === "verified" ? (
                                  <span className="inline-flex items-center gap-1">
                                    <BadgeCheck className="h-3 w-3" />
                                    verified
                                  </span>
                                ) : (
                                  verification
                                )}
                              </span>

                              <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${confidenceClasses[confidence]}`}>
                                {confidence} confidence
                              </span>

                              {message.readOnly ? (
                                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[8px] font-black uppercase tracking-wide text-muted-foreground">
                                  read only
                                </span>
                              ) : null}
                            </div>

                            {message.facts &&
                            message.facts.length > 0 ? (
                              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {message.facts
                                  .filter(
                                    (fact) =>
                                      fact.value !== null &&
                                      fact.value !== "",
                                  )
                                  .slice(0, 8)
                                  .map((fact) => (
                                    <div
                                      key={`${message.key}-${fact.label}`}
                                      className="rounded-2xl border border-border bg-card p-3"
                                    >
                                      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-muted-foreground">
                                        {fact.label}
                                      </p>
                                      <p className="mt-1 break-words text-[10px] font-black text-foreground [overflow-wrap:anywhere]">
                                        {String(
                                          fact.value,
                                        )}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            ) : null}

                            {message.sources &&
                            message.sources.length > 0 ? (
                              <div className="mt-4 border-t border-border pt-4">
                                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                                  Evidence & sources
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {message.sources.map(
                                    (source) => (
                                      <span
                                        key={`${message.key}-${source.type}-${source.reference}`}
                                        title={source.reference}
                                        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-2.5 py-1.5 text-[8px] font-bold text-violet-700 dark:text-violet-300"
                                      >
                                        <Database className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                          {source.label}
                                        </span>
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            ) : null}

                            {message.actions &&
                            message.actions.length > 0 ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {message.actions
                                  .slice(0, 5)
                                  .map((action) =>
                                    action.href ? (
                                      <Link
                                        key={`${message.key}-${action.label}`}
                                        href={action.href}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2 text-[9px] font-black text-violet-700 transition hover:bg-violet-500/10 dark:text-violet-300"
                                      >
                                        {action.label}
                                        <ChevronRight className="h-3 w-3" />
                                      </Link>
                                    ) : (
                                      <span
                                        key={`${message.key}-${action.label}`}
                                        className="inline-flex items-center rounded-xl border border-border bg-muted px-3 py-2 text-[9px] font-black text-muted-foreground"
                                      >
                                        {action.label}
                                      </span>
                                    ),
                                  )}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 px-1 text-[9px] text-muted-foreground">
                            <span>
                              {formatTime(
                                message.createdAt,
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                void copyMessage(
                                  message,
                                )
                              }
                              className="inline-flex items-center gap-1 font-bold transition hover:text-violet-600"
                            >
                              {copiedMessageId ===
                              message.key ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedMessageId ===
                              message.key
                                ? "Copied"
                                : "Copy"}
                            </button>

                            {message.messageId &&
                            message.conversationId ? (
                              <>
                                <button
                                  type="button"
                                  aria-label="Helpful"
                                  onClick={() =>
                                    void sendFeedback(
                                      message,
                                      "helpful",
                                    )
                                  }
                                  className={`inline-flex items-center gap-1 font-bold transition ${
                                    feedback === "helpful"
                                      ? "text-emerald-600"
                                      : "hover:text-emerald-600"
                                  }`}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  Helpful
                                </button>

                                <button
                                  type="button"
                                  aria-label="Not helpful"
                                  onClick={() =>
                                    void sendFeedback(
                                      message,
                                      "not_helpful",
                                    )
                                  }
                                  className={`inline-flex items-center gap-1 font-bold transition ${
                                    feedback === "not_helpful"
                                      ? "text-rose-600"
                                      : "hover:text-rose-600"
                                  }`}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                  Not helpful
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {sending ? (
                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                      Checking your authorized merchant records…
                    </div>
                  ) : null}
                </div>
              )}

              <div aria-hidden className="h-px" />
            </div>

            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 6,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 6,
                  }}
                  role="alert"
                  className="mx-4 mb-3 flex shrink-0 items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-rose-700 dark:text-rose-300 sm:mx-5"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black">
                      AI request failed
                    </p>
                    <p className="mt-1 break-words text-[10px] leading-5">
                      {error}
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* COMPOSER */}
            <form
              onSubmit={submit}
              className="shrink-0 border-t border-border bg-card p-4 sm:p-5"
            >
              <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/10">
                  <CircleDollarSign className="h-4 w-4 shrink-0 text-violet-600" />
                  <input
                    value={resourceId}
                    onChange={(event) =>
                      setResourceId(
                        event.target.value,
                      )
                    }
                    placeholder="Optional payment / refund / payout / settlement / event / key ID"
                    className="min-w-0 flex-1 bg-transparent text-[10px] font-bold text-foreground outline-none placeholder:text-muted-foreground"
                    maxLength={180}
                  />
                </label>

                <span className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  ownership checked by backend
                </span>
              </div>

              <div className="flex items-end gap-2 rounded-[20px] border border-border bg-background p-2 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/10">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      void submitMessage();
                    }
                  }}
                  placeholder="Ask about merchant performance or diagnose an owned resource…"
                  rows={1}
                  maxLength={4000}
                  className="min-h-[54px] max-h-[180px] min-w-0 flex-1 resize-none bg-transparent px-2.5 py-3 text-xs leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                />

                <motion.button
                  type="submit"
                  whileTap={{
                    scale: 0.96,
                  }}
                  disabled={
                    sending ||
                    !input.trim()
                  }
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/15 transition disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Send to Coffer AI"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </motion.button>
              </div>

              <div className="mt-3 flex flex-col gap-2 text-[8px] font-bold text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Enter to send · Shift+Enter for a new line
                </span>
                <span className="inline-flex items-center gap-1">
                  <LockKeyhole className="h-3 w-3" />
                  Coffer AI cannot capture, refund, pay out, rotate keys or change webhooks
                </span>
              </div>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}
