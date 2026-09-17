"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

interface CofferAiCopilotProps {
  userName?: string;
  portal?:
    | "personal"
    | "merchant";
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
        className="group fixed bottom-4 right-4 z-[120] flex h-[58px] items-center gap-3 overflow-hidden rounded-[20px] border border-violet-300/25 bg-[#120b27] px-3.5 text-white shadow-[0_22px_65px_rgba(65,31,132,.38)] outline-none focus-visible:ring-4 focus-visible:ring-violet-400/35 sm:bottom-6 sm:right-6"
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,.34),transparent_42%),linear-gradient(135deg,rgba(91,51,163,.32),rgba(15,9,35,.1))]" />

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

        <span className="relative flex h-9 w-9 items-center justify-center rounded-[13px] border border-white/15 bg-white/10 shadow-inner">
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
            <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#120b27] bg-emerald-400">
              <span className="h-1 w-1 rounded-full bg-white" />
            </span>
          )}
        </span>

        <span className="relative hidden pr-1 text-left sm:block">
          <span className="block text-[11px] font-black tracking-[-0.01em]">
            {isMerchant
              ? "Merchant AI"
              : "Coffer AI"}
          </span>
          <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-violet-200/70">
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
            className="fixed inset-0 z-[140] flex overflow-hidden bg-card text-card-foreground shadow-[0_35px_120px_rgba(15,7,40,.34)] sm:inset-auto sm:bottom-[94px] sm:right-6 sm:h-[min(760px,calc(100dvh-7.5rem))] sm:w-[440px] sm:rounded-[30px] sm:border sm:border-violet-200/70 dark:sm:border-white/10"
          >
            <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
              <header className="relative shrink-0 overflow-hidden bg-[#100821] px-4 pb-4 pt-4 text-white sm:px-5 sm:pt-5">
                <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-500/25 blur-[70px]" />
                <div className="pointer-events-none absolute -bottom-24 -left-12 h-44 w-44 rounded-full bg-fuchsia-500/15 blur-[65px]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.04),transparent)]" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-white/15 bg-white/10 shadow-[0_10px_30px_rgba(139,92,246,.16)] backdrop-blur-xl">
                      <Sparkles className="h-5 w-5 text-violet-100" />
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#100821] bg-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-[15px] font-black tracking-[-0.025em]">
                          {isMerchant
                            ? "Coffer Merchant Copilot"
                            : "Coffer AI Copilot"}
                        </h2>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-emerald-200">
                          Read only
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[9px] font-semibold text-violet-100/60">
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
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-violet-100 transition hover:bg-white/[0.13]"
                    >
                      <History className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      aria-label="New conversation"
                      onClick={
                        startNewConversation
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-violet-100 transition hover:bg-white/[0.13]"
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
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-violet-100 transition hover:bg-white/[0.13] sm:hidden"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="relative mt-4 flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.055] px-3 py-2.5 text-[9px] font-semibold leading-4 text-violet-100/70">
                  <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  {isMerchant
                    ? "It can inspect only payments owned by this merchant account."
                    : "It can inspect only records owned by your signed-in account."}
                </div>
              </header>

              <div
                ref={scrollRef}
                className="relative min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,.07),transparent_30%),var(--background)] px-4 py-5 sm:px-5"
              >
                {loadingMessages ? (
                  <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600 dark:text-violet-300" />
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
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-700 shadow-[0_16px_40px_rgba(109,40,217,.12)] dark:border-violet-800/70 dark:from-violet-950/50 dark:to-fuchsia-950/30 dark:text-violet-200"
                    >
                      <Bot className="h-7 w-7" />
                    </motion.div>

                    <p className="mt-5 text-[9px] font-black uppercase tracking-[0.19em] text-violet-600 dark:text-violet-300">
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
                        className="mt-5 flex w-full items-center justify-between gap-3 rounded-[15px] border border-violet-300 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-3 text-left text-[10px] font-black text-white shadow-[0_12px_28px_rgba(109,40,217,.22)] transition hover:-translate-y-0.5 hover:brightness-110"
                      >
                        <span className="min-w-0">
                          <span className="block">
                            Analyze this payment
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[8px] text-violet-100/80">
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
                            className="group flex w-full items-center justify-between gap-3 rounded-[15px] border border-border bg-card px-3.5 py-3 text-left text-[10px] font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-950/25"
                          >
                            <span>
                              {suggestion}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-violet-500 transition group-hover:translate-x-0.5" />
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
                      className="mx-auto mt-5 inline-flex items-center gap-2 text-[10px] font-black text-violet-700 transition hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-200"
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
                              <div className="max-w-[84%] rounded-[19px] rounded-br-[6px] bg-gradient-to-br from-[#50308a] to-[#271843] px-4 py-3 text-[11px] font-semibold leading-5 text-white shadow-[0_10px_28px_rgba(60,35,105,.18)]">
                                <p>
                                  {message.content}
                                </p>

                                {(message.pending ||
                                  message.failed) && (
                                  <span className={`mt-2 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.1em] ${
                                    message.failed
                                      ? "text-rose-200"
                                      : "text-violet-200"
                                  }`}>
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
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#1a102f] text-violet-100 shadow-[0_8px_22px_rgba(65,31,132,.18)]">
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
                                            className="inline-flex max-w-full items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[8px] font-bold text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/30 dark:text-violet-300"
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
                                          className="rounded-[10px] border border-border bg-muted px-2.5 py-1.5 text-[8px] font-black text-foreground transition enabled:hover:border-violet-300 enabled:hover:text-violet-700 disabled:cursor-default disabled:opacity-70 dark:enabled:hover:border-violet-700 dark:enabled:hover:text-violet-300"
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#1a102f] text-violet-100">
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
                                className="h-1.5 w-1.5 rounded-full bg-violet-500"
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
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-[11px] border border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-800/60 dark:bg-violet-950/30">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-violet-600 dark:text-violet-300">
                        {isMerchant
                          ? "Attached merchant payment"
                          : "Attached transaction"}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[9px] font-bold text-violet-900 dark:text-violet-100">
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
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-violet-500 transition hover:bg-violet-100 dark:hover:bg-violet-900/50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 rounded-[18px] border border-border bg-muted/70 p-2 transition focus-within:border-violet-400 focus-within:bg-card focus-within:ring-4 focus-within:ring-violet-500/10">
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#5b3594] to-[#271641] text-white shadow-[0_8px_20px_rgba(75,42,130,.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted text-foreground transition hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
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
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground transition hover:text-violet-600 disabled:opacity-50"
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
                        className="flex w-full items-center gap-3 rounded-[16px] border border-dashed border-violet-300 bg-violet-50/70 p-3.5 text-left transition hover:border-violet-500 hover:bg-violet-50 dark:border-violet-700 dark:bg-violet-950/25 dark:hover:border-violet-500"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-violet-700 text-white shadow-sm">
                          <Plus className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-[11px] font-black text-violet-900 dark:text-violet-100">
                            Start a new conversation
                          </span>
                          <span className="mt-0.5 block text-[9px] font-semibold text-violet-600/75 dark:text-violet-300/70">
                            {isMerchant
                              ? "Check another merchant payment"
                              : "Check another transaction"}
                          </span>
                        </span>
                      </button>

                      {loadingHistory ? (
                        <div className="flex min-h-[260px] items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
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
                                className={`group w-full rounded-[16px] border p-3.5 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm dark:hover:border-violet-700 ${
                                  selectedConversationId ===
                                  conversation.conversationId
                                    ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/25"
                                    : "border-border bg-card"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-muted text-violet-600 transition group-hover:bg-violet-100 dark:text-violet-300 dark:group-hover:bg-violet-950/40">
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

                                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
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
