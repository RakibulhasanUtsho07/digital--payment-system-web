"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bot,
  ChevronLeft,
  Clock3,
  History,
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
  X,
} from "lucide-react";

import {
  getCofferAiConversations,
  getCofferAiMessages,
  saveCofferAiFeedback,
  sendCofferAiMessage,
  type CofferAiAssistantMessage,
  type CofferAiConfidence,
  type CofferAiConversation,
  type CofferAiSource,
  type CofferAiStoredMessage,
  type CofferAiVerification,
} from "@/lib/api/cofferAiApi";

const OPEN_EVENT =
  "coffer-ai:open";

interface CofferAiOpenDetail {
  message?: string;
  resourceId?: string;
}

type CofferAiVisualRole =
  | "user"
  | "admin"
  | "super_admin"
  | "merchant"
  | "analyst"
  | "support";

interface CofferAiCopilotProps {
  userName?: string;
  portal?:
    | "personal"
    | "merchant";
  role?:
    CofferAiVisualRole;
}

interface CofferAiVisualTheme {
  key:
    | "default"
    | "merchant"
    | "analyst"
    | "support";
  buttonGradient: string;
  buttonOverlay: string;
  headerGradient: string;
  headerBase: string;
  primary: string;
  secondary: string;
  softBg: string;
  softBorder: string;
  softHover: string;
  softText: string;
  lightText: string;
  mutedLightText: string;
  border: string;
  shadow: string;
  glowA: string;
  glowB: string;
  messageGradient: string;
  assistantGradient: string;
  sendGradient: string;
}

const DEFAULT_AI_THEME: CofferAiVisualTheme = {
  key: "default",
  buttonGradient:
    "#120b27",
  buttonOverlay:
    "radial-gradient(circle at 20% 20%, rgba(167,139,250,.34), transparent 42%), linear-gradient(135deg, rgba(91,51,163,.32), rgba(15,9,35,.10))",
  headerGradient:
    "#100821",
  headerBase: "#100821",
  primary: "#7c3aed",
  secondary: "#a855f7",
  softBg: "rgba(124,58,237,0.08)",
  softBorder: "rgba(139,92,246,0.24)",
  softHover: "rgba(124,58,237,0.13)",
  softText: "#6d28d9",
  lightText: "#ede9fe",
  mutedLightText: "rgba(237,233,254,0.66)",
  border: "rgba(196,181,253,0.30)",
  shadow: "rgba(65,31,132,0.38)",
  glowA: "rgba(139,92,246,0.25)",
  glowB: "rgba(217,70,239,0.15)",
  messageGradient:
    "linear-gradient(135deg, #50308a 0%, #271843 100%)",
  assistantGradient:
    "linear-gradient(135deg, #1a102f 0%, #2e1f4f 100%)",
  sendGradient:
    "linear-gradient(135deg, #5b3594 0%, #271641 100%)",
};

const MERCHANT_AI_THEME: CofferAiVisualTheme = {
  key: "merchant",
  buttonGradient:
    "linear-gradient(135deg, #160827 0%, #4c1d95 52%, #7c3aed 100%)",
  buttonOverlay:
    "radial-gradient(circle at 20% 20%, rgba(216,180,254,.35), transparent 42%), linear-gradient(135deg, rgba(126,34,206,.34), rgba(49,10,101,.12))",
  headerGradient:
    "linear-gradient(135deg, #160827 0%, #3b146f 48%, #6d28d9 100%)",
  headerBase: "#160827",
  primary: "#7c3aed",
  secondary: "#c026d3",
  softBg: "rgba(124,58,237,0.09)",
  softBorder: "rgba(192,132,252,0.28)",
  softHover: "rgba(124,58,237,0.14)",
  softText: "#7c3aed",
  lightText: "#f3e8ff",
  mutedLightText: "rgba(243,232,255,0.70)",
  border: "rgba(216,180,254,0.30)",
  shadow: "rgba(91,33,182,0.38)",
  glowA: "rgba(168,85,247,0.28)",
  glowB: "rgba(217,70,239,0.18)",
  messageGradient:
    "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
  assistantGradient:
    "linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)",
  sendGradient:
    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 55%, #4c1d95 100%)",
};

const ANALYST_AI_THEME: CofferAiVisualTheme = {
  key: "analyst",
  buttonGradient:
    "linear-gradient(135deg, #10243A 0%, #0B4F52 52%, #10273A 100%)",
  buttonOverlay:
    "radial-gradient(circle at 20% 20%, rgba(34,211,238,.30), transparent 42%), linear-gradient(135deg, rgba(20,184,166,.24), rgba(16,39,58,.10))",
  headerGradient:
    "linear-gradient(135deg, #10243A 0%, #0B4F52 52%, #10273A 100%)",
  headerBase: "#10243A",
  primary: "#0f9f9a",
  secondary: "#22d3ee",
  softBg: "rgba(20,184,166,0.08)",
  softBorder: "rgba(103,232,249,0.24)",
  softHover: "rgba(20,184,166,0.13)",
  softText: "#0f9f9a",
  lightText: "#cffafe",
  mutedLightText: "rgba(207,250,254,0.68)",
  border: "rgba(103,232,249,0.26)",
  shadow: "rgba(13,148,136,0.34)",
  glowA: "rgba(34,211,238,0.20)",
  glowB: "rgba(45,212,191,0.16)",
  messageGradient:
    "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
  assistantGradient:
    "linear-gradient(135deg, #10243A 0%, #0B4F52 100%)",
  sendGradient:
    "linear-gradient(135deg, #14b8a6 0%, #0f766e 60%, #0B4F52 100%)",
};

const SUPPORT_AI_THEME: CofferAiVisualTheme = {
  key: "support",
  buttonGradient:
    "linear-gradient(135deg, #10b981 0%, #059669 48%, #0f766e 100%)",
  buttonOverlay:
    "radial-gradient(circle at 20% 20%, rgba(209,250,229,.34), transparent 42%), linear-gradient(135deg, rgba(16,185,129,.20), rgba(15,118,110,.12))",
  headerGradient:
    "linear-gradient(135deg, #10b981 0%, #059669 48%, #0f766e 100%)",
  headerBase: "#059669",
  primary: "#059669",
  secondary: "#14b8a6",
  softBg: "rgba(16,185,129,0.08)",
  softBorder: "rgba(110,231,183,0.28)",
  softHover: "rgba(16,185,129,0.13)",
  softText: "#047857",
  lightText: "#d1fae5",
  mutedLightText: "rgba(209,250,229,0.72)",
  border: "rgba(167,243,208,0.30)",
  shadow: "rgba(16,185,129,0.34)",
  glowA: "rgba(167,243,208,0.22)",
  glowB: "rgba(103,232,249,0.16)",
  messageGradient:
    "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  assistantGradient:
    "linear-gradient(135deg, #065f46 0%, #0f766e 100%)",
  sendGradient:
    "linear-gradient(135deg, #10b981 0%, #059669 55%, #0f766e 100%)",
};

function getCofferAiTheme(
  role:
    CofferAiVisualRole
): CofferAiVisualTheme {
  if (role === "merchant") {
    return MERCHANT_AI_THEME;
  }

  if (role === "analyst") {
    return ANALYST_AI_THEME;
  }

  if (role === "support") {
    return SUPPORT_AI_THEME;
  }

  return DEFAULT_AI_THEME;
}

interface UiMessage {
  messageId: string;
  conversationId?: string;
  role:
    | "user"
    | "assistant";
  content: string;
  verification:
    CofferAiVerification;
  confidence:
    CofferAiConfidence;
  sources:
    CofferAiSource[];
  suggestedActions:
    Array<{
      label: string;
      href?: string;
    }>;
  resourceId?: string;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
}

type FeedbackState =
  | "saving"
  | "helpful"
  | "not_helpful"
  | "error";

const PERSONAL_SUGGESTIONS = [
  "Why is my payment pending?",
  "Why did my transaction fail?",
  "Is my transfer completed?",
] as const;

const MERCHANT_SUGGESTIONS = [
  "Why is this payment pending?",
  "Why did this checkout fail?",
  "Is this payment completed?",
] as const;

function getMerchantPaymentId(
  pathname: string,
): string | null {
  const match =
    pathname.match(
      /^\/dashboard\/merchant\/payments\/([^/?#]+)\/?$/,
    );

  if (!match?.[1]) {
    return null;
  }

  try {
    const paymentId =
      decodeURIComponent(
        match[1],
      ).trim();

    return /^[A-Za-z0-9_-]{6,128}$/.test(
      paymentId,
    )
      ? paymentId
      : null;
  } catch {
    return null;
  }
}

function firstName(
  value?: string,
): string {
  const normalized =
    value?.trim();

  return normalized
    ? normalized.split(/\s+/)[0]
    : "there";
}

function mapStoredMessage(
  message: CofferAiStoredMessage,
): UiMessage {
  return {
    messageId:
      message.messageId,
    conversationId:
      message.conversationId,
    role:
      message.role,
    content:
      message.content,
    verification:
      message.verification,
    confidence:
      message.confidence,
    sources:
      message.sources ?? [],
    suggestedActions:
      message.suggestedActions ?? [],
    resourceId:
      message.resourceId,
    createdAt:
      message.createdAt,
  };
}

function mapAssistantMessage(
  message: CofferAiAssistantMessage,
): UiMessage {
  return {
    messageId:
      message.messageId,
    conversationId:
      message.conversationId,
    role:
      "assistant",
    content:
      message.content,
    verification:
      message.verification,
    confidence:
      message.confidence,
    sources:
      message.sources ?? [],
    suggestedActions:
      message.suggestedActions ?? [],
    resourceId:
      message.diagnosis?.subjectId,
    createdAt:
      new Date().toISOString(),
  };
}

function relativeTime(
  value: string,
): string {
  const date =
    new Date(value);
  const milliseconds =
    Date.now() -
    date.getTime();

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recently";
  }

  const minutes =
    Math.max(
      0,
      Math.floor(
        milliseconds /
          60_000,
      ),
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  );
}

function VerificationBadge({
  verification,
  confidence,
}: {
  verification:
    CofferAiVerification;
  confidence:
    CofferAiConfidence;
}) {
  if (
    verification ===
    "verified"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.09em] text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300">
        <BadgeCheck className="h-3 w-3" />
        Verified · {confidence}
      </span>
    );
  }

  if (
    verification ===
    "partial"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.09em] text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/35 dark:text-amber-300">
        <AlertCircle className="h-3 w-3" />
        Partial · {confidence}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.09em] text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
      <ShieldCheck className="h-3 w-3" />
      Needs details
    </span>
  );
}

export default function CofferAiCopilot({
  userName,
  portal = "personal",
  role,
}: CofferAiCopilotProps) {
  const pathname =
    usePathname();
  const router =
    useRouter();
  const reduceMotion =
    useReducedMotion();
  const scrollRef =
    useRef<HTMLDivElement | null>(
      null,
    );
  const requestControllerRef =
    useRef<AbortController | null>(
      null,
    );

  const isMerchant =
    portal === "merchant";

  const visualRole:
    CofferAiVisualRole =
    role ??
    (
      isMerchant
        ? "merchant"
        : "user"
    );

  const aiTheme =
    getCofferAiTheme(
      visualRole
    );

  const aiThemeStyle =
    {
      "--ai-primary":
        aiTheme.primary,
      "--ai-secondary":
        aiTheme.secondary,
      "--ai-soft-bg":
        aiTheme.softBg,
      "--ai-soft-border":
        aiTheme.softBorder,
      "--ai-soft-hover":
        aiTheme.softHover,
      "--ai-soft-text":
        aiTheme.softText,
      "--ai-light":
        aiTheme.lightText,
      "--ai-muted-light":
        aiTheme.mutedLightText,
      "--ai-border":
        aiTheme.border,
    } as CSSProperties;

  const merchantPaymentId =
    useMemo(
      () =>
        isMerchant
          ? getMerchantPaymentId(
              pathname,
            )
          : null,
      [
        isMerchant,
        pathname,
      ],
    );

  const suggestions =
    isMerchant
      ? MERCHANT_SUGGESTIONS
      : PERSONAL_SUGGESTIONS;

  const [open, setOpen] =
    useState(false);
  const [historyOpen, setHistoryOpen] =
    useState(false);
  const [input, setInput] =
    useState("");
  const [messages, setMessages] =
    useState<UiMessage[]>([]);
  const [conversations, setConversations] =
    useState<CofferAiConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);
  const [activeResourceId, setActiveResourceId] =
    useState<string | null>(
      merchantPaymentId,
    );
  const [loadingHistory, setLoadingHistory] =
    useState(false);
  const [loadingMessages, setLoadingMessages] =
    useState(false);
  const [sending, setSending] =
    useState(false);
  const [historyLoaded, setHistoryLoaded] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [feedback, setFeedback] =
    useState<Record<string, FeedbackState>>({});
  const [queuedRequest, setQueuedRequest] =
    useState<CofferAiOpenDetail | null>(null);

  const displayName =
    useMemo(
      () =>
        firstName(
          userName,
        ),
      [userName],
    );

  useEffect(
    () => {
      if (
        !isMerchant ||
        !merchantPaymentId ||
        selectedConversationId ||
        messages.length > 0
      ) {
        return;
      }

      setActiveResourceId(
        merchantPaymentId,
      );
    }, [
      isMerchant,
      merchantPaymentId,
      messages.length,
      selectedConversationId,
    ],
  );

  const loadConversations =
    useCallback(
      async (
        silent = false,
      ) => {
        try {
          if (!silent) {
            setLoadingHistory(
              true,
            );
          }

          const response =
            await getCofferAiConversations(
              20,
            );

          setConversations(
            response.data
              .conversations,
          );
          setHistoryLoaded(
            true,
          );
        } catch (error) {
          if (!silent) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Unable to load AI conversations.",
            );
          }
        } finally {
          if (!silent) {
            setLoadingHistory(
              false,
            );
          }
        }
      },
      [],
    );

  const startNewConversation =
    useCallback(() => {
      requestControllerRef.current?.abort();
      setSelectedConversationId(
        null,
      );
      setActiveResourceId(
        merchantPaymentId,
      );
      setMessages([]);
      setInput("");
      setErrorMessage("");
      setHistoryOpen(false);
      setSending(false);
    }, [merchantPaymentId]);

  const loadConversation =
    useCallback(
      async (
        conversationId: string,
      ) => {
        try {
          setLoadingMessages(
            true,
          );
          setErrorMessage("");

          const response =
            await getCofferAiMessages(
              conversationId,
              100,
            );
          const nextMessages =
            response.data.messages.map(
              mapStoredMessage,
            );
          const lastResource =
            [...response.data.messages]
              .reverse()
              .find(
                (message) =>
                  Boolean(
                    message.resourceId,
                  ),
              )?.resourceId ??
            null;

          setMessages(
            nextMessages,
          );
          setSelectedConversationId(
            conversationId,
          );
          setActiveResourceId(
            lastResource,
          );
          setHistoryOpen(false);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
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

  const submitMessage =
    useCallback(
      async (
        rawMessage: string,
        resourceIdOverride?: string,
      ) => {
        const message =
          rawMessage.trim();

        if (
          !message ||
          sending
        ) {
          return;
        }

        const resourceId =
          resourceIdOverride ??
          activeResourceId ??
          undefined;
        const optimisticId =
          `local-${Date.now()}`;
        const controller =
          new AbortController();

        requestControllerRef.current?.abort();
        requestControllerRef.current =
          controller;

        setInput("");
        setErrorMessage("");
        setSending(true);
        setMessages(
          (current) => [
            ...current,
            {
              messageId:
                optimisticId,
              conversationId:
                selectedConversationId ??
                undefined,
              role:
                "user",
              content:
                message,
              verification:
                "unknown",
              confidence:
                "low",
              sources:
                [],
              suggestedActions:
                [],
              resourceId,
              createdAt:
                new Date().toISOString(),
              pending:
                true,
            },
          ],
        );

        try {
          const response =
            await sendCofferAiMessage({
              message,
              conversationId:
                selectedConversationId ??
                undefined,
              pageContext: {
                route:
                  pathname ||
                  "/dashboard",
                resourceId,
              },
              signal:
                controller.signal,
            });

          const assistant =
            mapAssistantMessage(
              response.data,
            );

          setSelectedConversationId(
            response.data
              .conversationId,
          );
          setActiveResourceId(
            response.data.diagnosis
              ?.subjectId ??
              resourceId ??
              null,
          );
          setMessages(
            (current) => [
              ...current.map(
                (item) =>
                  item.messageId ===
                  optimisticId
                    ? {
                        ...item,
                        conversationId:
                          response.data
                            .conversationId,
                        pending:
                          false,
                      }
                    : item,
              ),
              assistant,
            ],
          );

          void loadConversations(
            true,
          );
        } catch (error) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setMessages(
            (current) =>
              current.map(
                (item) =>
                  item.messageId ===
                  optimisticId
                    ? {
                        ...item,
                        pending:
                          false,
                        failed:
                          true,
                      }
                    : item,
              ),
          );
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Coffer AI could not complete the request.",
          );
        } finally {
          if (
            requestControllerRef.current ===
            controller
          ) {
            requestControllerRef.current =
              null;
          }

          setSending(false);
        }
      },
      [
        activeResourceId,
        loadConversations,
        pathname,
        selectedConversationId,
        sending,
      ],
    );

  const handleSubmit =
    (
      event: FormEvent,
    ) => {
      event.preventDefault();
      void submitMessage(
        input,
      );
    };

  const handleInputKeyDown =
    (
      event: KeyboardEvent<HTMLTextAreaElement>,
    ) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        void submitMessage(
          input,
        );
      }
    };

  const submitFeedback =
    useCallback(
      async (
        message: UiMessage,
        rating:
          | "helpful"
          | "not_helpful",
      ) => {
        const conversationId =
          message.conversationId ??
          selectedConversationId;

        if (!conversationId) {
          return;
        }

        setFeedback(
          (current) => ({
            ...current,
            [message.messageId]:
              "saving",
          }),
        );

        try {
          await saveCofferAiFeedback({
            conversationId,
            messageId:
              message.messageId,
            rating,
          });

          setFeedback(
            (current) => ({
              ...current,
              [message.messageId]:
                rating,
            }),
          );
        } catch {
          setFeedback(
            (current) => ({
              ...current,
              [message.messageId]:
                "error",
            }),
          );
        }
      },
      [selectedConversationId],
    );

  useEffect(
    () => {
      if (
        open &&
        !historyLoaded
      ) {
        void loadConversations();
      }
    },
    [
      historyLoaded,
      loadConversations,
      open,
    ],
  );

  useEffect(
    () => {
      const handleOpen =
        (
          event: Event,
        ) => {
          const detail =
            (
              event as CustomEvent<CofferAiOpenDetail>
            ).detail ?? {};

          requestControllerRef.current?.abort();
          setSelectedConversationId(
            null,
          );
          setMessages([]);
          setHistoryOpen(false);
          setErrorMessage("");
          setInput("");
          setActiveResourceId(
            detail.resourceId ??
            null,
          );
          setOpen(true);

          if (
            detail.message?.trim()
          ) {
            setQueuedRequest({
              message:
                detail.message.trim(),
              resourceId:
                detail.resourceId,
            });
          }
        };

      window.addEventListener(
        OPEN_EVENT,
        handleOpen,
      );

      return () => {
        window.removeEventListener(
          OPEN_EVENT,
          handleOpen,
        );
      };
    },
    [],
  );

  useEffect(
    () => {
      if (
        !open ||
        !queuedRequest ||
        sending
      ) {
        return;
      }

      const request =
        queuedRequest;
      const timer =
        window.setTimeout(
          () => {
            setQueuedRequest(
              null,
            );
            void submitMessage(
              request.message ??
                (isMerchant
                  ? "Explain this merchant payment."
                  : "Explain this transaction."),
              request.resourceId,
            );
          },
          260,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [
      open,
      isMerchant,
      queuedRequest,
      sending,
      submitMessage,
    ],
  );

  useEffect(
    () => {
      const element =
        scrollRef.current;

      if (!element) {
        return;
      }

      element.scrollTo({
        top:
          element.scrollHeight,
        behavior:
          reduceMotion
            ? "auto"
            : "smooth",
      });
    },
    [
      messages,
      reduceMotion,
      sending,
    ],
  );

  useEffect(
    () => {
      const handleEscape =
        (
          event: globalThis.KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setOpen(false);
            setHistoryOpen(false);
          }
        };

      window.addEventListener(
        "keydown",
        handleEscape,
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleEscape,
        );
        requestControllerRef.current?.abort();
      };
    },
    [],
  );

  return (
    <>
      <motion.button
        type="button"
        aria-label={
          open
            ? "Close Coffer AI Copilot"
            : "Open Coffer AI Copilot"
        }
        aria-expanded={open}
        onClick={() => {
          setOpen(
            (current) =>
              !current,
          );
          setHistoryOpen(false);
        }}
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                scale: 0.75,
                y: 18,
              }
        }
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        whileHover={
          reduceMotion
            ? undefined
            : {
                y: -3,
                scale: 1.02,
              }
        }
        whileTap={{
          scale: 0.96,
        }}
        className="group fixed bottom-4 right-4 z-[120] flex h-[58px] items-center gap-3 overflow-hidden rounded-[20px] border bg-card px-3.5 text-card-foreground outline-none transition hover:bg-muted focus-visible:ring-4 dark:bg-[#0B0F19] dark:text-slate-100 sm:bottom-6 sm:right-6"
        style={{
          borderColor:
            aiTheme.border,
          boxShadow:
            `0 18px 48px ${aiTheme.shadow}`,
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-5 top-0 h-px"
          style={{
            background:
              `linear-gradient(90deg, transparent, ${aiTheme.primary}, transparent)`,
            opacity: 0.7,
          }}
        />

        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            animate={{
              x: [
                "-160%",
                "260%",
              ],
            }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              repeatDelay: 2.2,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-y-0 w-12 -skew-x-12 bg-white/10 blur-sm"
          />
        )}

        <span
          className="relative flex h-9 w-9 items-center justify-center rounded-[13px] border bg-muted/70 shadow-inner"
          style={{
            borderColor: aiTheme.softBorder,
            color: aiTheme.primary,
          }}
        >
          <AnimatePresence
            mode="wait"
            initial={false}
          >
            <motion.span
              key={
                open
                  ? "close"
                  : "bot"
              }
              initial={{
                opacity: 0,
                rotate: -20,
                scale: 0.7,
              }}
              animate={{
                opacity: 1,
                rotate: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                rotate: 20,
                scale: 0.7,
              }}
              transition={{
                duration: 0.16,
              }}
            >
              {open ? (
                <X className="h-[18px] w-[18px]" />
              ) : (
                <Bot className="h-[19px] w-[19px]" />
              )}
            </motion.span>
          </AnimatePresence>

          {!open && (
            <span
              className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 bg-emerald-400"
              style={{
                borderColor:
                  "var(--card)",
              }}
            >
              <span className="h-1 w-1 rounded-full bg-white" />
            </span>
          )}
        </span>

        <span className="relative hidden pr-1 text-left sm:block">
          <span
            className="block text-[11px] font-black tracking-[-0.01em]"
            style={{
              color: aiTheme.primary,
            }}
          >
            {isMerchant
              ? "Merchant AI"
              : "Coffer AI"}
          </span>
          <span
            className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.16em]"
            style={{
              color:
                aiTheme.softText,
            }}
          >
            {isMerchant
              ? "Gateway copilot"
              : "Verified copilot"}
          </span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Coffer AI Copilot"
            initial={
              reduceMotion
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    y: 26,
                    scale: 0.94,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={
              reduceMotion
                ? {
                    opacity: 0,
                  }
                : {
                    opacity: 0,
                    y: 18,
                    scale: 0.96,
                  }
            }
            transition={{
              duration: 0.28,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="fixed inset-0 z-[140] flex overflow-hidden bg-card text-card-foreground shadow-[0_35px_120px_rgba(15,7,40,.34)] sm:inset-auto sm:bottom-[94px] sm:right-6 sm:h-[min(760px,calc(100dvh-7.5rem))] sm:w-[440px] sm:rounded-[30px] sm:border dark:sm:border-white/10"
            style={{
              ...aiThemeStyle,
              borderColor:
                aiTheme.border,
            }}
          >
            <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
              <header
                className="relative shrink-0 overflow-hidden border-b border-border bg-card px-4 pb-4 pt-4 text-card-foreground dark:border-white/10 dark:bg-[#0B0F19] dark:text-slate-100 sm:px-5 sm:pt-5"
              >
                <div
                  className="pointer-events-none absolute inset-x-8 top-0 h-px"
                  style={{
                    background:
                      `linear-gradient(90deg, transparent, ${aiTheme.primary}, ${aiTheme.secondary}, transparent)`,
                    opacity: 0.85,
                  }}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border bg-muted/70 backdrop-blur-xl"
                      style={{
                        borderColor:
                          aiTheme.softBorder,
                        color:
                          aiTheme.primary,
                        boxShadow:
                          `0 10px 30px ${aiTheme.shadow}`,
                      }}
                    >
                      <Sparkles className="h-5 w-5" />
                      <span
                        className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] bg-emerald-400"
                        style={{
                          borderColor:
                            "var(--card)",
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2
                          className="truncate text-[15px] font-black tracking-[-0.025em]"
                          style={{
                            color: aiTheme.primary,
                          }}
                        >
                          {isMerchant
                            ? "Coffer Merchant Copilot"
                            : "Coffer AI Copilot"}
                        </h2>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-emerald-200">
                          Read only
                        </span>
                      </div>

                      <p
                        className="mt-1 truncate text-[9px] font-semibold"
                        style={{
                          color:
                            aiTheme.softText,
                        }}
                      >
                        {isMerchant
                          ? "Evidence-backed gateway assistance"
                          : "Evidence-backed wallet assistance"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Conversation history"
                      onClick={() =>
                        setHistoryOpen(
                          (current) =>
                            !current,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/60 transition hover:bg-muted"
                      style={{
                        borderColor: aiTheme.softBorder,
                        color: aiTheme.primary,
                      }}
                    >
                      <History className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      aria-label="New conversation"
                      onClick={
                        startNewConversation
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/60 transition hover:bg-muted"
                      style={{
                        borderColor: aiTheme.softBorder,
                        color: aiTheme.primary,
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      aria-label="Close Coffer AI"
                      onClick={() => {
                        setOpen(false);
                        setHistoryOpen(false);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/60 transition hover:bg-muted sm:hidden"
                      style={{
                        borderColor: aiTheme.softBorder,
                        color: aiTheme.primary,
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  className="relative mt-4 flex items-center gap-2 rounded-[14px] border bg-muted/50 px-3 py-2.5 text-[9px] font-semibold leading-4 text-muted-foreground"
                  style={{
                    borderColor: aiTheme.softBorder,
                  }}
                >
                  <LockKeyhole
                    className="h-3.5 w-3.5 shrink-0"
                    style={{
                      color: aiTheme.primary,
                    }}
                  />
                  {isMerchant
                    ? "It can inspect only payments owned by this merchant account."
                    : "It can inspect only records owned by your signed-in account."}
                </div>
              </header>

              <div
                ref={scrollRef}
                className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
                style={{
                  background:
                    "var(--background)",
                }}
              >
                {loadingMessages ? (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                    <Loader2
                      className="h-6 w-6 animate-spin"
                      style={{
                        color:
                          aiTheme.primary,
                      }}
                    />
                    <p className="mt-3 text-xs font-bold text-foreground">
                      Loading conversation
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="mx-auto flex min-h-full max-w-[350px] flex-col justify-center py-4 text-center">
                    <motion.div
                      initial={
                        reduceMotion
                          ? false
                          : {
                              opacity: 0,
                              scale: 0.85,
                            }
                      }
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border"
                      style={{
                        borderColor:
                          aiTheme.softBorder,
                        background:
                          "var(--card)",
                        color:
                          aiTheme.primary,
                        boxShadow:
                          `0 16px 40px ${aiTheme.shadow.replace("0.38", "0.14").replace("0.34", "0.14")}`,
                      }}
                    >
                      <Bot className="h-7 w-7" />
                    </motion.div>

                    <p
                      className="mt-5 text-[9px] font-black uppercase tracking-[0.19em]"
                      style={{
                        color:
                          aiTheme.primary,
                      }}
                    >
                      {isMerchant
                        ? "Merchant gateway copilot"
                        : "Personal wallet copilot"}
                    </p>

                    <h3 className="mt-2 text-xl font-black tracking-[-0.035em] text-foreground">
                      Hi {displayName}, what should we {isMerchant
                        ? "verify"
                        : "check"}?
                    </h3>

                    <p className="mx-auto mt-2 max-w-[300px] text-[11px] leading-5 text-muted-foreground">
                      {isMerchant
                        ? "Ask about a gateway payment, checkout status, decline, capture, or settlement readiness. Answers use only verified merchant records."
                        : "Ask about one of your payments or transactions. Coffer AI answers only from verified account records."}
                    </p>

                    {isMerchant && merchantPaymentId && (
                      <button
                        type="button"
                        onClick={() =>
                          void submitMessage(
                            `Check merchant payment ${merchantPaymentId}`,
                            merchantPaymentId,
                          )
                        }
                        className="mt-5 flex w-full items-center justify-between gap-3 rounded-[15px] border px-3.5 py-3 text-left text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:brightness-110"
                        style={{
                          borderColor:
                            aiTheme.border,
                          background:
                            aiTheme.buttonGradient,
                          boxShadow:
                            `0 12px 28px ${aiTheme.shadow}`,
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block">
                            Analyze this payment
                          </span>
                          <span
                            className="mt-0.5 block truncate font-mono text-[8px]"
                            style={{
                              color:
                                aiTheme.mutedLightText,
                            }}
                          >
                            {merchantPaymentId}
                          </span>
                        </span>
                        <BadgeCheck className="h-4 w-4 shrink-0" />
                      </button>
                    )}

                    <div className={`${isMerchant && merchantPaymentId ? "mt-2" : "mt-5"} space-y-2`}>
                      {suggestions.map(
                        (suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() =>
                              void submitMessage(
                                suggestion,
                              )
                            }
                            className="group flex w-full items-center justify-between gap-3 rounded-[15px] border bg-card px-3.5 py-3 text-left text-[10px] font-bold text-foreground shadow-sm transition hover:-translate-y-0.5"
                            style={{
                              borderColor:
                                aiTheme.softBorder,
                            }}
                          >
                            <span>
                              {suggestion}
                            </span>
                            <ArrowRight
                              className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5"
                              style={{
                                color:
                                  aiTheme.primary,
                              }}
                            />
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(
                          isMerchant
                            ? "/dashboard/merchant/payments"
                            : "/dashboard/transactions",
                        );
                      }}
                      className="mx-auto mt-5 inline-flex items-center gap-2 text-[10px] font-black transition hover:brightness-90"
                      style={{
                        color:
                          aiTheme.primary,
                      }}
                    >
                      <MessageSquareText className="h-3.5 w-3.5" />
                      {isMerchant
                        ? "Open a merchant payment to diagnose it"
                        : "Open a transaction to diagnose it"}
                    </button>
                  </div>
                ) : (
                  <div
                    aria-live="polite"
                    className="space-y-5"
                  >
                    {messages.map(
                      (message) => {
                        const feedbackState =
                          feedback[
                            message.messageId
                          ];

                        if (
                          message.role ===
                          "user"
                        ) {
                          return (
                            <div
                              key={
                                message.messageId
                              }
                              className="flex justify-end"
                            >
                              <div
                                className="max-w-[84%] rounded-[19px] rounded-br-[6px] border bg-muted px-4 py-3 text-[11px] font-semibold leading-5 text-foreground"
                                style={{
                                  borderColor:
                                    aiTheme.softBorder,
                                  boxShadow:
                                    `0 10px 28px ${aiTheme.shadow}`,
                                }}
                              >
                                <p>
                                  {message.content}
                                </p>

                                {(message.pending ||
                                  message.failed) && (
                                  <span
                                    className={`mt-2 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.1em] ${
                                      message.failed
                                        ? "text-rose-500"
                                        : ""
                                    }`}
                                    style={
                                      message.failed
                                        ? undefined
                                        : {
                                            color: aiTheme.primary,
                                          }
                                    }
                                  >
                                    {message.pending ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      <AlertCircle className="h-2.5 w-2.5" />
                                    )}
                                    {message.pending
                                      ? "Checking"
                                      : "Not sent"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={
                              message.messageId
                            }
                            className="flex items-start gap-2.5"
                          >
                            <div
                              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border bg-card"
                              style={{
                                borderColor:
                                  aiTheme.softBorder,
                                color:
                                  aiTheme.primary,
                                boxShadow:
                                  `0 8px 22px ${aiTheme.shadow}`,
                              }}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0 max-w-[calc(100%_-_42px)] flex-1">
                              <div className="rounded-[20px] rounded-tl-[6px] border border-border bg-card p-4 shadow-[0_10px_32px_rgba(15,23,42,.055)]">
                                <div className="prose prose-sm max-w-none text-[11px] leading-5 text-foreground prose-p:my-0 prose-ul:my-2 prose-li:my-0 dark:prose-invert">
                                  <ReactMarkdown
                                    remarkPlugins={[
                                      remarkGfm,
                                    ]}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <VerificationBadge
                                    verification={
                                      message.verification
                                    }
                                    confidence={
                                      message.confidence
                                    }
                                  />

                                  {message.resourceId && (
                                    <span className="max-w-[180px] truncate rounded-full border border-border bg-muted px-2 py-1 font-mono text-[8px] font-bold text-muted-foreground">
                                      {message.resourceId}
                                    </span>
                                  )}
                                </div>

                                {message.sources.length > 0 && (
                                  <div className="mt-3 border-t border-border pt-3">
                                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                                      Verified sources
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {message.sources.map(
                                        (source) => (
                                          <span
                                            key={`${message.messageId}-${source.type}-${source.reference}`}
                                            title={
                                              source.reference
                                            }
                                            className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-bold"
                                            style={{
                                              borderColor:
                                                aiTheme.softBorder,
                                              background:
                                                aiTheme.softBg,
                                              color:
                                                aiTheme.softText,
                                            }}
                                          >
                                            <ShieldCheck className="h-2.5 w-2.5 shrink-0" />
                                            <span className="truncate">
                                              {source.label}
                                            </span>
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                                {message.suggestedActions.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {message.suggestedActions.map(
                                      (action) => (
                                        <button
                                          key={`${message.messageId}-${action.label}`}
                                          type="button"
                                          onClick={() => {
                                            if (
                                              action.href
                                            ) {
                                              setOpen(false);
                                              router.push(
                                                action.href,
                                              );
                                            }
                                          }}
                                          disabled={
                                            !action.href
                                          }
                                          className="rounded-[10px] border bg-muted px-2.5 py-1.5 text-[8px] font-black text-foreground transition enabled:hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-70"
                                          style={{
                                            borderColor:
                                              aiTheme.softBorder,
                                          }}
                                        >
                                          {action.label}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 flex items-center gap-1.5 pl-1">
                                <span className="mr-1 text-[8px] font-semibold text-muted-foreground">
                                  Helpful?
                                </span>

                                <button
                                  type="button"
                                  aria-label="Helpful response"
                                  disabled={
                                    feedbackState ===
                                    "saving"
                                  }
                                  onClick={() =>
                                    void submitFeedback(
                                      message,
                                      "helpful",
                                    )
                                  }
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                    feedbackState ===
                                    "helpful"
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                                      : "border-border bg-card text-muted-foreground hover:text-emerald-600"
                                  }`}
                                >
                                  {feedbackState ===
                                  "saving" ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ThumbsUp className="h-3 w-3" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  aria-label="Not helpful response"
                                  disabled={
                                    feedbackState ===
                                    "saving"
                                  }
                                  onClick={() =>
                                    void submitFeedback(
                                      message,
                                      "not_helpful",
                                    )
                                  }
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                    feedbackState ===
                                    "not_helpful"
                                      ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                                      : "border-border bg-card text-muted-foreground hover:text-rose-600"
                                  }`}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </button>

                                {feedbackState ===
                                  "error" && (
                                  <span className="text-[8px] font-semibold text-rose-600">
                                    Try again
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}

                    {sending && (
                      <div className="flex items-start gap-2.5">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border bg-card"
                          style={{
                            borderColor:
                              aiTheme.softBorder,
                            color:
                              aiTheme.primary,
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex items-center gap-1.5 rounded-[16px] rounded-tl-[6px] border border-border bg-card px-4 py-3 shadow-sm">
                          {[0, 1, 2].map(
                            (index) => (
                              <motion.span
                                key={index}
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
                                  duration: 0.85,
                                  repeat: Infinity,
                                  delay:
                                    index * 0.12,
                                }}
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  background:
                                    aiTheme.primary,
                                }}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="shrink-0 border-t border-rose-200 bg-rose-50 px-4 py-2.5 dark:border-rose-900/60 dark:bg-rose-950/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <p className="min-w-0 flex-1 text-[9px] font-semibold leading-4 text-rose-700 dark:text-rose-300">
                      {errorMessage}
                    </p>
                    <button
                      type="button"
                      aria-label="Dismiss error"
                      onClick={() =>
                        setErrorMessage("")
                      }
                      className="text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="shrink-0 border-t border-border bg-card px-3.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 sm:px-4"
              >
                {activeResourceId && (
                  <div
                    className="mb-2 flex items-center justify-between gap-2 rounded-[11px] border px-3 py-2"
                    style={{
                      borderColor:
                        aiTheme.softBorder,
                      background:
                        "var(--muted)",
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[8px] font-black uppercase tracking-[0.13em]"
                        style={{
                          color:
                            aiTheme.softText,
                        }}
                      >
                        {isMerchant
                          ? "Attached merchant payment"
                          : "Attached transaction"}
                      </p>
                      <p
                        className="mt-0.5 truncate font-mono text-[9px] font-bold"
                        style={{
                          color:
                            aiTheme.primary,
                        }}
                      >
                        {activeResourceId}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={
                        isMerchant
                          ? "Remove attached merchant payment"
                          : "Remove attached transaction"
                      }
                      onClick={() =>
                        setActiveResourceId(
                          null,
                        )
                      }
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition hover:opacity-80"
                      style={{
                        color:
                          aiTheme.primary,
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div
                  className="flex items-end gap-2 rounded-[18px] border bg-muted/70 p-2 transition focus-within:bg-card focus-within:ring-4"
                  style={{
                    borderColor:
                      aiTheme.softBorder,
                    boxShadow:
                      "none",
                  }}
                >
                  <textarea
                    value={input}
                    onChange={(
                      event,
                    ) =>
                      setInput(
                        event.target.value,
                      )
                    }
                    onKeyDown={
                      handleInputKeyDown
                    }
                    rows={1}
                    maxLength={2000}
                    disabled={sending}
                    placeholder={
                      isMerchant
                        ? "Ask about a merchant payment or checkout..."
                        : "Ask about a payment or transaction..."
                    }
                    className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[11px] font-semibold leading-5 text-foreground outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
                  />

                  <motion.button
                    type="submit"
                    aria-label="Send message"
                    disabled={
                      sending ||
                      !input.trim()
                    }
                    whileTap={{
                      scale: 0.9,
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background:
                        aiTheme.sendGradient,
                      boxShadow:
                        `0 8px 20px ${aiTheme.shadow}`,
                    }}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  <p className="text-[8px] font-semibold text-muted-foreground">
                    {isMerchant
                      ? "Read-only · No captures, refunds or payouts"
                      : "Read-only · No transfers or refunds"}
                  </p>
                  {input.length > 1600 && (
                    <span className="text-[8px] font-bold text-muted-foreground">
                      {input.length}/2000
                    </span>
                  )}
                </div>
              </form>

              <AnimatePresence>
                {historyOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: -28,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -20,
                    }}
                    transition={{
                      duration: 0.22,
                    }}
                    className="absolute inset-0 z-30 flex flex-col bg-card"
                  >
                    <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Back to chat"
                          onClick={() =>
                            setHistoryOpen(
                              false,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted text-foreground transition hover:opacity-80"
                          style={{
                            borderColor:
                              aiTheme.softBorder,
                            color:
                              aiTheme.primary,
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div>
                          <p
                            className="text-[9px] font-black uppercase tracking-[0.16em]"
                            style={{
                              color:
                                aiTheme.primary,
                            }}
                          >
                            Coffer AI
                          </p>
                          <h3 className="mt-0.5 text-sm font-black text-foreground">
                            Conversation history
                          </h3>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label="Refresh history"
                        onClick={() =>
                          void loadConversations()
                        }
                        disabled={
                          loadingHistory
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted text-muted-foreground transition hover:opacity-80 disabled:opacity-50"
                        style={{
                          borderColor:
                            aiTheme.softBorder,
                          color:
                            aiTheme.primary,
                        }}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            loadingHistory
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                      <button
                        type="button"
                        onClick={
                          startNewConversation
                        }
                        className="flex w-full items-center gap-3 rounded-[16px] border border-dashed p-3.5 text-left transition hover:brightness-[0.98]"
                        style={{
                          borderColor:
                            aiTheme.softBorder,
                          background:
                            "var(--card)",
                        }}
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-[13px] text-white shadow-sm"
                          style={{
                            background:
                              aiTheme.buttonGradient,
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </span>
                        <span>
                          <span
                            className="block text-[11px] font-black"
                            style={{
                              color:
                                aiTheme.primary,
                            }}
                          >
                            Start a new conversation
                          </span>
                          <span
                            className="mt-0.5 block text-[9px] font-semibold"
                            style={{
                              color:
                                aiTheme.softText,
                              opacity:
                                0.78,
                            }}
                          >
                            {isMerchant
                              ? "Check another merchant payment"
                              : "Check another transaction"}
                          </span>
                        </span>
                      </button>

                      {loadingHistory ? (
                        <div className="flex min-h-[260px] items-center justify-center">
                          <Loader2
                            className="h-6 w-6 animate-spin"
                            style={{
                              color:
                                aiTheme.primary,
                            }}
                          />
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-muted text-muted-foreground">
                            <Clock3 className="h-5 w-5" />
                          </div>
                          <p className="mt-4 text-sm font-black text-foreground">
                            No conversations yet
                          </p>
                          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                            Your verified AI conversations will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2">
                          {conversations.map(
                            (conversation) => (
                              <button
                                key={
                                  conversation.conversationId
                                }
                                type="button"
                                onClick={() =>
                                  void loadConversation(
                                    conversation.conversationId,
                                  )
                                }
                                className={`group w-full rounded-[16px] border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                                  selectedConversationId ===
                                  conversation.conversationId
                                    ? ""
                                    : "border-border bg-card"
                                }`}
                                style={
                                  selectedConversationId ===
                                  conversation.conversationId
                                    ? {
                                        borderColor:
                                          aiTheme.softBorder,
                                        background:
                                          "var(--muted)",
                                      }
                                    : undefined
                                }
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] transition"
                                    style={{
                                      background:
                                        "var(--muted)",
                                      color:
                                        aiTheme.primary,
                                    }}
                                  >
                                    <MessageSquareText className="h-4 w-4" />
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[11px] font-black text-foreground">
                                      {conversation.title}
                                    </span>
                                    <span className="mt-1 flex items-center gap-2 text-[8px] font-semibold text-muted-foreground">
                                      <span>
                                        {conversation.messageCount} messages
                                      </span>
                                      <span className="h-1 w-1 rounded-full bg-border" />
                                      <span>
                                        {relativeTime(
                                          conversation.lastMessageAt,
                                        )}
                                      </span>
                                    </span>
                                  </span>

                                  <ArrowRight
                                    className="mt-1 h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5"
                                    style={{
                                      color:
                                        aiTheme.primary,
                                    }}
                                  />
                                </div>
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
