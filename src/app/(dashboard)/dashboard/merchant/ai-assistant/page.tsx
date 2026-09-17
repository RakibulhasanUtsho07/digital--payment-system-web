"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  CircleDot,
  Code2,
  Copy,
  KeyRound,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  TestTube2,
  WandSparkles,
} from "lucide-react";

import {
  getMerchantAiContext,
  sendMerchantAiMessage,
  type MerchantAiContext,
  type MerchantAiMessage,
} from "@/lib/api/merchantAiApi";

/* =========================================================
   TYPES
========================================================= */

interface ChatMessage
  extends MerchantAiMessage {
  id: string;
}

interface MarkdownCodeProps
  extends React.ComponentPropsWithoutRef<"code"> {
  children?: React.ReactNode;
}

interface MarkdownPreProps
  extends React.ComponentPropsWithoutRef<"pre"> {
  children?: React.ReactNode;
}

/* =========================================================
   QUICK PROMPTS
========================================================= */

const quickPrompts = [
  {
    title:
      "Integrate Next.js",

    description:
      "Generate complete App Router integration",

    icon:
      Code2,

    prompt:
      "My merchant website uses Next.js App Router. Show me the complete Coffer payment integration file-by-file, including environment variables, server route, checkout button, success page and cancel page.",
  },

  {
    title:
      "Fix API error",

    description:
      "Debug a Coffer integration problem",

    icon:
      SquareTerminal,

    prompt:
      "Help me debug my Coffer payment integration. Tell me exactly what request URL, status code, headers and files I should inspect.",
  },

  {
    title:
      "Test mode",

    description:
      "Setup sandbox payments safely",

    icon:
      TestTube2,

    prompt:
      "Show me how to integrate and test Coffer using a test API key without moving real money.",
  },

  {
    title:
      "Go live",

    description:
      "Prepare test → live migration",

    icon:
      ShieldCheck,

    prompt:
      "Explain everything I need to check before changing my Coffer integration from test mode to live mode.",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function MerchantAiAssistantPage() {
  const [
    context,
    setContext,
  ] =
    useState<MerchantAiContext | null>(
      null
    );

  const [
    contextLoading,
    setContextLoading,
  ] =
    useState(
      true
    );

  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    copiedId,
    setCopiedId,
  ] =
    useState<
      string | null
    >(null);

  const [
    messages,
    setMessages,
  ] =
    useState<
      ChatMessage[]
    >([
      {
        id:
          "welcome",

        role:
          "assistant",

        content:
          "Hi! I’m your Coffer Integration Assistant. Tell me what framework your merchant website uses, or paste the relevant project structure. I can show you exactly which files to create and how to connect Coffer safely.\n\n**Never paste a real API key, password, customer data, or database secret here.**",
      },
    ]);

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /* =======================================================
     LOAD MERCHANT CONTEXT
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      const loadContext =
        async () => {
          try {
            const data =
              await getMerchantAiContext();

            if (
              active
            ) {
              setContext(
                data
              );
            }
          } catch (
            loadError
          ) {
            if (
              active
            ) {
              setError(
                loadError instanceof Error
                  ? loadError.message
                  : "Unable to load merchant context."
              );
            }
          } finally {
            if (
              active
            ) {
              setContextLoading(
                false
              );
            }
          }
        };

      void loadContext();

      return () => {
        active =
          false;
      };
    },
    []
  );

  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(
    () => {
      bottomRef.current?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "nearest",
      });
    },
    [
      messages,
      sending,
    ]
  );

  /* =======================================================
     SEND MESSAGE
  ======================================================= */

  const sendMessage =
    async (
      override?: string
    ) => {
      const value =
        (
          override ??
          input
        ).trim();

      if (
        !value ||
        sending
      ) {
        return;
      }

      setError("");

      const userMessage:
        ChatMessage = {
        id:
          `user-${Date.now()}`,

        role:
          "user",

        content:
          value,
      };

      const previousMessages =
        messages;

      setMessages(
        (
          current
        ) => [
          ...current,
          userMessage,
        ]
      );

      setInput("");

      setSending(
        true
      );

      try {
        const history:
          MerchantAiMessage[] =
          previousMessages
            .filter(
              (
                message
              ) =>
                message.id !==
                "welcome"
            )
            .map(
              ({
                role,
                content,
              }) => ({
                role,
                content,
              })
            );

        const response =
          await sendMerchantAiMessage({
            message:
              value,

            history,
          });

        const assistantMessage:
          ChatMessage = {
          id:
            `assistant-${Date.now()}`,

          role:
            "assistant",

          content:
            response.answer,
        };

        setMessages(
          (
            current
          ) => [
            ...current,
            assistantMessage,
          ]
        );
      } catch (
        sendError
      ) {
        setError(
          sendError instanceof Error
            ? sendError.message
            : "Unable to get an AI response."
        );
      } finally {
        setSending(
          false
        );
      }
    };

  /* =======================================================
     COPY RESPONSE
  ======================================================= */

  const copyResponse =
    async (
      message:
        ChatMessage
    ) => {
      try {
        await navigator.clipboard.writeText(
          message.content
        );

        setCopiedId(
          message.id
        );

        window.setTimeout(
          () => {
            setCopiedId(
              null
            );
          },
          1600
        );
      } catch {
        setError(
          "Unable to copy response."
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="
        min-h-full
        bg-slate-50/70
        p-4

        dark:bg-[#070b14]

        sm:p-6
        lg:p-8
      "
    >
      <div className="mx-auto max-w-[1500px]">

        {/* =================================================
            HERO
        ================================================== */}

        <header
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm

            dark:border-white/10
            dark:bg-[#0b1120]

            sm:p-7
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-72
              w-72
              rounded-full
              bg-violet-500/10
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
              left-1/3
              h-64
              w-64
              rounded-full
              bg-cyan-500/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              flex
              flex-col
              gap-5

              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div className="max-w-3xl">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-violet-200
                  bg-violet-50
                  px-3
                  py-1.5
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.16em]
                  text-violet-700

                  dark:border-violet-500/20
                  dark:bg-violet-500/10
                  dark:text-violet-300
                "
              >
                <WandSparkles className="h-3.5 w-3.5" />

                Coffer AI
              </div>

              <h1
                className="
                  mt-4
                  text-2xl
                  font-black
                  tracking-tight
                  text-slate-950

                  dark:text-white

                  sm:text-3xl
                  lg:text-4xl
                "
              >
                Integration Assistant
              </h1>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-7
                  text-slate-600

                  dark:text-slate-400
                "
              >
                Connect Coffer to your website,
                generate integration code and
                troubleshoot API problems without
                exposing your merchant secret key.
              </p>
            </div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                px-4
                py-3
                text-xs
                font-bold
                text-emerald-700

                dark:border-emerald-500/20
                dark:bg-emerald-500/10
                dark:text-emerald-300
              "
            >
              <Sparkles className="h-4 w-4" />

              Free AI mode
            </div>
          </div>
        </header>

        {/* =================================================
            SECURITY NOTICE
        ================================================== */}

        <div
          className="
            mt-5
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            p-4
            text-xs
            leading-6
            text-amber-900

            dark:border-amber-900/50
            dark:bg-amber-950/25
            dark:text-amber-200
          "
        >
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <strong>
              Keep secrets private.
            </strong>{" "}

            Never paste API keys,
            passwords, customer identity
            data, database URLs or access
            tokens. Coffer also redacts
            common secret formats before
            sending your request to the AI
            provider.
          </div>
        </div>

        {/* =================================================
            MAIN LAYOUT
        ================================================== */}

        <section
          className="
            mt-5
            grid
            gap-5

            xl:grid-cols-[minmax(0,1fr)_340px]
          "
        >

          {/* ===============================================
              CHAT
          ================================================ */}

          <div
            className="
              flex
              min-h-[700px]
              min-w-0
              flex-col
              overflow-hidden
              rounded-[24px]
              border
              border-slate-200
              bg-white
              shadow-sm

              dark:border-white/10
              dark:bg-[#0b1120]
            "
          >

            {/* CHAT HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-200
                px-5
                py-4

                dark:border-white/10
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-violet-600
                    text-white
                    shadow-lg
                    shadow-violet-600/20
                  "
                >
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <p
                    className="
                      text-sm
                      font-black
                      text-slate-950

                      dark:text-white
                    "
                  >
                    Coffer AI
                  </p>

                  <p
                    className="
                      text-[10px]
                      font-semibold
                      text-slate-500
                    "
                  >
                    Merchant integration specialist
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-[10px]
                  font-bold
                  text-emerald-600
                "
              >
                <CircleDot className="h-3.5 w-3.5" />

                Ready
              </div>
            </div>

            {/* =============================================
                MESSAGES
            ============================================== */}

            <div
              className="
                flex-1
                space-y-5
                overflow-y-auto
                p-4

                sm:p-6
              "
            >
              {messages.map(
                (
                  message
                ) => {
                  const isAssistant =
                    message.role ===
                    "assistant";

                  return (
                    <div
                      key={
                        message.id
                      }
                      className={`
                        flex

                        ${
                          isAssistant
                            ? "justify-start"
                            : "justify-end"
                        }
                      `}
                    >
                      <div
                        className={`
                          relative
                          min-w-0
                          max-w-[92%]
                          overflow-hidden
                          rounded-2xl
                          px-4
                          py-3
                          text-sm
                          leading-7

                          sm:max-w-[82%]

                          ${
                            isAssistant
                              ? `
                                border
                                border-slate-200
                                bg-slate-50
                                text-slate-700

                                dark:border-white/10
                                dark:bg-white/[0.04]
                                dark:text-slate-300
                              `
                              : `
                                bg-violet-600
                                text-white
                              `
                          }
                        `}
                      >
                        {isAssistant ? (
                          <>
                            <div
                              className="
                                break-words

                                [&_a]:font-semibold
                                [&_a]:text-violet-600
                                [&_a]:underline

                                [&_blockquote]:my-3
                                [&_blockquote]:border-l-2
                                [&_blockquote]:border-violet-400
                                [&_blockquote]:pl-3

                                [&_h1]:mb-3
                                [&_h1]:mt-5
                                [&_h1]:text-xl
                                [&_h1]:font-black

                                [&_h2]:mb-2
                                [&_h2]:mt-5
                                [&_h2]:text-lg
                                [&_h2]:font-black

                                [&_h3]:mb-2
                                [&_h3]:mt-4
                                [&_h3]:text-base
                                [&_h3]:font-black

                                [&_li]:my-1

                                [&_ol]:my-3
                                [&_ol]:list-decimal
                                [&_ol]:pl-6

                                [&_p]:my-2

                                [&_strong]:font-black

                                [&_ul]:my-3
                                [&_ul]:list-disc
                                [&_ul]:pl-6
                              "
                            >
                              <ReactMarkdown
                                remarkPlugins={[
                                  remarkGfm,
                                ]}
                                components={{
                                  code: ({
                                    children,
                                    className,
                                    ...props
                                  }: MarkdownCodeProps) => {
                                    const isBlockCode =
                                      Boolean(
                                        className?.includes(
                                          "language-"
                                        )
                                      );

                                    if (
                                      isBlockCode
                                    ) {
                                      return (
                                        <code
                                          {...props}
                                          className={`
                                            ${className ?? ""}
                                            font-mono
                                            text-[12px]
                                          `}
                                        >
                                          {
                                            children
                                          }
                                        </code>
                                      );
                                    }

                                    return (
                                      <code
                                        {...props}
                                        className="
                                          rounded
                                          bg-black/10
                                          px-1.5
                                          py-0.5
                                          font-mono
                                          text-[12px]

                                          dark:bg-black/30
                                        "
                                      >
                                        {
                                          children
                                        }
                                      </code>
                                    );
                                  },

                                  pre: ({
                                    children,
                                    ...props
                                  }: MarkdownPreProps) => {
                                    return (
                                      <div className="relative my-3 max-w-full">
                                        <pre
                                          {...props}
                                          className="
                                            max-w-full
                                            overflow-x-auto
                                            rounded-xl
                                            border
                                            border-slate-800
                                            bg-slate-950
                                            p-4
                                            text-xs
                                            leading-6
                                            text-slate-100
                                          "
                                        >
                                          {
                                            children
                                          }
                                        </pre>
                                      </div>
                                    );
                                  },
                                }}
                              >
                                {
                                  message.content
                                }
                              </ReactMarkdown>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void copyResponse(
                                  message
                                )
                              }
                              className="
                                mt-3
                                inline-flex
                                items-center
                                gap-1.5
                                text-[10px]
                                font-bold
                                text-slate-500
                                transition

                                hover:text-violet-600
                              "
                            >
                              {copiedId ===
                              message.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />

                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />

                                  Copy
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">
                            {
                              message.content
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {/* AI LOADING */}

              {sending && (
                <div className="flex justify-start">
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-2xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-slate-500

                      dark:border-white/10
                      dark:bg-white/[0.04]
                    "
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Generating integration help...
                  </div>
                </div>
              )}

              <div
                ref={
                  bottomRef
                }
              />
            </div>

            {/* =============================================
                ERROR
            ============================================== */}

            {error && (
              <div
                className="
                  mx-4
                  mb-3
                  flex
                  items-start
                  gap-2
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-3
                  text-xs
                  font-semibold
                  text-red-700

                  dark:border-red-900/40
                  dark:bg-red-950/20
                  dark:text-red-300
                "
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                {
                  error
                }
              </div>
            )}

            {/* =============================================
                INPUT
            ============================================== */}

            <div
              className="
                border-t
                border-slate-200
                p-4

                dark:border-white/10
              "
            >
              <textarea
                value={
                  input
                }
                onChange={(
                  event
                ) => {
                  setInput(
                    event.target.value
                  );
                }}
                onKeyDown={(
                  event
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
                maxLength={
                  6000
                }
                rows={
                  4
                }
                disabled={
                  sending
                }
                placeholder="Example: My website uses Next.js 16 App Router. Show me exactly how to integrate Coffer..."
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  transition

                  placeholder:text-slate-400

                  focus:border-violet-400
                  focus:ring-4
                  focus:ring-violet-500/10

                  disabled:cursor-not-allowed
                  disabled:opacity-70

                  dark:border-white/10
                  dark:bg-white/[0.04]
                  dark:text-white
                "
              />

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <p
                  className="
                    text-[10px]
                    font-semibold
                    text-slate-400
                  "
                >
                  Enter to send • Shift + Enter
                  for new line
                </p>

                <button
                  type="button"
                  disabled={
                    sending ||
                    !input.trim()
                  }
                  onClick={() =>
                    void sendMessage()
                  }
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-violet-600
                    px-4
                    text-xs
                    font-extrabold
                    text-white
                    transition

                    hover:bg-violet-700

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}

                  Send
                </button>
              </div>
            </div>
          </div>

          {/* ===============================================
              RIGHT PANEL
          ================================================ */}

          <aside className="space-y-5">

            {/* =============================================
                QUICK ACTIONS
            ============================================== */}

            <div
              className="
                rounded-[22px]
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm

                dark:border-white/10
                dark:bg-[#0b1120]
              "
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />

                <h2
                  className="
                    text-sm
                    font-black
                    text-slate-950

                    dark:text-white
                  "
                >
                  Quick actions
                </h2>
              </div>

              <div className="mt-4 space-y-2">
                {quickPrompts.map(
                  (
                    item
                  ) => {
                    const Icon =
                      item.icon;

                    return (
                      <button
                        type="button"
                        key={
                          item.title
                        }
                        disabled={
                          sending
                        }
                        onClick={() =>
                          void sendMessage(
                            item.prompt
                          )
                        }
                        className="
                          flex
                          w-full
                          items-start
                          gap-3
                          rounded-xl
                          border
                          border-slate-200
                          p-3
                          text-left
                          transition

                          hover:border-violet-300
                          hover:bg-violet-50

                          disabled:cursor-not-allowed
                          disabled:opacity-60

                          dark:border-white/10
                          dark:hover:bg-violet-500/10
                        "
                      >
                        <div
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-violet-100
                            text-violet-600

                            dark:bg-violet-500/10
                            dark:text-violet-300
                          "
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <p
                            className="
                              text-xs
                              font-extrabold
                              text-slate-900

                              dark:text-white
                            "
                          >
                            {
                              item.title
                            }
                          </p>

                          <p
                            className="
                              mt-1
                              text-[10px]
                              leading-4
                              text-slate-500
                            "
                          >
                            {
                              item.description
                            }
                          </p>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* =============================================
                ACCOUNT CONTEXT
            ============================================== */}

            <div
              className="
                rounded-[22px]
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm

                dark:border-white/10
                dark:bg-[#0b1120]
              "
            >
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-violet-600" />

                <h2
                  className="
                    text-sm
                    font-black
                    text-slate-950

                    dark:text-white
                  "
                >
                  Integration status
                </h2>
              </div>

              {contextLoading ? (
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    py-6
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Loading...
                </div>
              ) : context ? (
                <div className="mt-4 space-y-3">

                  <StatusRow
                    label="Merchant"
                    value={
                      context.businessName
                    }
                  />

                  <StatusRow
                    label="Verification"
                    value={
                      context.verificationStatus
                    }
                    success={
                      context.verificationStatus ===
                      "verified"
                    }
                  />

                  <StatusRow
                    label="Test mode"
                    value={
                      context.testEnabled
                        ? "Enabled"
                        : "Disabled"
                    }
                    success={
                      context.testEnabled
                    }
                  />

                  <StatusRow
                    label="Test key"
                    value={
                      context.testKeyConfigured
                        ? "Configured"
                        : "Missing"
                    }
                    success={
                      context.testKeyConfigured
                    }
                  />

                  <StatusRow
                    label="Live mode"
                    value={
                      context.liveEnabled
                        ? "Enabled"
                        : "Disabled"
                    }
                    success={
                      context.liveEnabled
                    }
                  />

                  <StatusRow
                    label="Live key"
                    value={
                      context.liveKeyConfigured
                        ? "Configured"
                        : "Missing"
                    }
                    success={
                      context.liveKeyConfigured
                    }
                  />

                  {/* TEST SCOPES */}

                  <div
                    className="
                      border-t
                      border-slate-200
                      pt-3

                      dark:border-white/10
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-slate-400
                      "
                    >
                      Test scopes
                    </p>

                    <div
                      className="
                        mt-2
                        flex
                        flex-wrap
                        gap-1.5
                      "
                    >
                      {context.testScopes.length >
                      0 ? (
                        context.testScopes.map(
                          (
                            scope
                          ) => (
                            <span
                              key={
                                scope
                              }
                              className="
                                rounded-lg
                                bg-slate-100
                                px-2
                                py-1
                                font-mono
                                text-[9px]
                                font-bold
                                text-slate-600

                                dark:bg-white/[0.06]
                                dark:text-slate-300
                              "
                            >
                              {
                                scope
                              }
                            </span>
                          )
                        )
                      ) : (
                        <span
                          className="
                            text-[10px]
                            text-slate-400
                          "
                        >
                          No active test scopes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* LIVE SCOPES */}

                  <div
                    className="
                      border-t
                      border-slate-200
                      pt-3

                      dark:border-white/10
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-slate-400
                      "
                    >
                      Live scopes
                    </p>

                    <div
                      className="
                        mt-2
                        flex
                        flex-wrap
                        gap-1.5
                      "
                    >
                      {context.liveScopes.length >
                      0 ? (
                        context.liveScopes.map(
                          (
                            scope
                          ) => (
                            <span
                              key={
                                scope
                              }
                              className="
                                rounded-lg
                                bg-slate-100
                                px-2
                                py-1
                                font-mono
                                text-[9px]
                                font-bold
                                text-slate-600

                                dark:bg-white/[0.06]
                                dark:text-slate-300
                              "
                            >
                              {
                                scope
                              }
                            </span>
                          )
                        )
                      ) : (
                        <span
                          className="
                            text-[10px]
                            text-slate-400
                          "
                        >
                          No active live scopes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  className="
                    mt-4
                    text-xs
                    text-slate-500
                  "
                >
                  Merchant context unavailable.
                </p>
              )}
            </div>

            {/* =============================================
                SAFE CONTEXT CARD
            ============================================== */}

            <div
              className="
                rounded-[22px]
                border
                border-cyan-200
                bg-cyan-50
                p-5
                text-xs
                leading-6
                text-cyan-900

                dark:border-cyan-900/40
                dark:bg-cyan-950/20
                dark:text-cyan-200
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                  font-black
                "
              >
                <CheckCircle2 className="h-4 w-4" />

                Secret-safe context
              </div>

              <p className="mt-2">
                The AI sees whether your
                test/live keys are configured
                and which scopes exist, but it
                never receives the raw merchant
                secret.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   STATUS ROW
========================================================= */

function StatusRow({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-3
      "
    >
      <span
        className="
          text-[11px]
          font-semibold
          text-slate-500
        "
      >
        {
          label
        }
      </span>

      <span
        className={`
          inline-flex
          items-center
          gap-1.5
          text-[11px]
          font-extrabold

          ${
            success ===
            undefined
              ? `
                text-slate-800
                dark:text-slate-200
              `
              : success
                ? "text-emerald-600"
                : "text-amber-600"
          }
        `}
      >
        {success !==
          undefined && (
          <span
            className={`
              h-1.5
              w-1.5
              rounded-full

              ${
                success
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }
            `}
          />
        )}

        {
          value
        }
      </span>
    </div>
  );
}