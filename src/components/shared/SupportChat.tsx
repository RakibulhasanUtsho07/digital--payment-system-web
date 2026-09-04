"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  CircleHelp,
  Headphones,
  Loader2,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

type SupportCategory =
  | "transfer"
  | "wallet"
  | "account"
  | "verification"
  | "other";

interface ChatMessage {
  id: number;
  sender: "support" | "user";
  text: string;
}

interface CreateSupportTicketResponse {
  success: boolean;
  message: string;
  ticket: {
    ticketNumber: string;
    status: "open";
    createdAt: string;
  };
}

const categories: Array<{
  id: SupportCategory;
  label: string;
}> = [
  { id: "transfer", label: "Transfer issue" },
  { id: "wallet", label: "Wallet or balance" },
  { id: "account", label: "Account access" },
  { id: "verification", label: "Verification" },
  { id: "other", label: "Something else" },
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "support",
    text: "Hi! Tell us what went wrong and choose the closest topic below. We’ll use this information to create a support request.",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 600;

export default function SupportChat() {
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<SupportCategory | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [submitting, setSubmitting] = useState(false);
  const [messageTouched, setMessageTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [submitError, setSubmitError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const normalizedMessage = message.trim();
  const normalizedEmail = email.trim();

  const messageError = useMemo(() => {
    if (!normalizedMessage) return "Please describe the problem.";

    if (normalizedMessage.length < MIN_MESSAGE_LENGTH) {
      return `Please add a little more detail (${MIN_MESSAGE_LENGTH} characters minimum).`;
    }

    return "";
  }, [normalizedMessage]);

  const emailError = useMemo(() => {
    if (!normalizedEmail) return "";
    return EMAIL_PATTERN.test(normalizedEmail)
      ? ""
      : "Enter a valid email address or leave it blank.";
  }, [normalizedEmail]);

  const formValid = Boolean(category && !messageError && !emailError);

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 220);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const resetForm = () => {
    setCategory(null);
    setEmail("");
    setMessage("");
    setMessageTouched(false);
    setEmailTouched(false);
    setCategoryTouched(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessageTouched(true);
    setEmailTouched(true);
    setCategoryTouched(true);

    if (!formValid || !category || submitting) return;

    const formData = new FormData(event.currentTarget);
    const website = String(formData.get("website") || "");

    setSubmitting(true);
    setSubmitError("");
    setTicketNumber("");

    const categoryLabel =
      categories.find((item) => item.id === category)?.label ?? "Support";

    try {
      const response = await apiClient<CreateSupportTicketResponse>(
        "/support/tickets",
        {
          method: "POST",
          body: JSON.stringify({
            category,
            message: normalizedMessage,
            email: normalizedEmail,
            website,
          }),
        }
      );

      if (!response.success || !response.ticket?.ticketNumber) {
        throw new Error(response.message || "Unable to create support ticket.");
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          sender: "user",
          text: `${categoryLabel}: ${normalizedMessage}`,
        },
        {
          id: Date.now() + 1,
          sender: "support",
          text: `Your request was received. Keep ticket ${response.ticket.ticketNumber} for reference.`,
        },
      ]);

      setTicketNumber(response.ticket.ticketNumber);
      resetForm();
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to send your support request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label={open ? "Close support chat" : "Open support chat"}
        aria-expanded={open}
        aria-controls="coffer-support-panel"
        onClick={() => setOpen((current) => !current)}
        whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.02 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
        className="fixed bottom-24 right-4 z-[70] flex h-14 items-center gap-3 rounded-full border border-violet-300/25 bg-[#130b2d] px-4 text-white shadow-[0_18px_55px_rgba(76,29,149,.34)] outline-none transition hover:bg-[#1b1040] focus-visible:ring-4 focus-visible:ring-violet-300/40 sm:bottom-6 sm:right-6"
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-violet-500">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "chat"}
              initial={prefersReducedMotion ? false : { opacity: 0, rotate: -30, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, rotate: 30, scale: 0.7 }}
              className="absolute"
            >
              {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
            </motion.span>
          </AnimatePresence>

          {!open && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#130b2d] bg-emerald-400" />
          )}
        </span>

        <span className="hidden pr-1 text-left sm:block">
          <span className="block text-xs font-black">Need help?</span>
          <span className="block text-[9px] text-violet-200/65">Report a problem</span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.aside
            id="coffer-support-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="coffer-support-title"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-40 right-3 z-[69] flex max-h-[min(720px,calc(100dvh-11rem))] w-[calc(100vw-1.5rem)] max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,7,40,.28)] sm:bottom-24 sm:right-6 sm:max-h-[min(720px,calc(100dvh-7rem))]"
          >
            <header className="relative overflow-hidden bg-[#0b0718] px-5 pb-5 pt-5 text-white">
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(167,139,250,.65)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
              <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-violet-600/30 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
                    <Headphones className="h-5 w-5" />
                  </span>

                  <div>
                    <h2 id="coffer-support-title" className="text-base font-black tracking-[-0.02em]">
                      Coffer Support
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/55">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Secure support request
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close support chat"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-[#faf9fd] px-4 py-4">
              <div aria-live="polite" className="space-y-3">
                {messages.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-5 ${
                        item.sender === "user"
                          ? "rounded-br-md bg-violet-600 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-600 shadow-sm"
                      }`}
                    >
                      {item.text}
                    </div>
                  </motion.div>
                ))}

                {submitting && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
                      Sending securely...
                    </div>
                  </div>
                )}
              </div>

              {ticketNumber && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[10px] leading-4 text-emerald-800">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Ticket <strong>{ticketNumber}</strong> was created successfully.
                </div>
              )}

              {submitError && (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-[10px] leading-4 text-red-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="support-website">Website</label>
                  <input
                    id="support-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      What happened?
                    </label>
                    <CircleHelp className="h-3.5 w-3.5 text-violet-500" />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((item) => {
                      const active = category === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setCategory(item.id);
                            setCategoryTouched(true);
                          }}
                          aria-pressed={active}
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
                            active
                              ? "border-violet-600 bg-violet-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 hover:bg-violet-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {categoryTouched && !category && (
                    <p className="mt-2 text-[10px] font-semibold text-red-600">
                      Choose a support topic.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="support-message" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Describe the problem
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="support-message"
                    rows={4}
                    maxLength={MAX_MESSAGE_LENGTH}
                    value={message}
                    onBlur={() => setMessageTouched(true)}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tell us what you tried and what you expected to happen..."
                    aria-invalid={messageTouched && Boolean(messageError)}
                    aria-describedby="support-message-help support-message-error"
                    className={`mt-2 w-full resize-none rounded-2xl border bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      messageTouched && messageError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                    }`}
                  />

                  <div id="support-message-help" className="mt-1 flex items-start justify-between gap-3 text-[9px] text-slate-400">
                    <span>Do not include passwords, PINs or OTP codes.</span>
                    <span className="shrink-0">{message.length}/{MAX_MESSAGE_LENGTH}</span>
                  </div>

                  {messageTouched && messageError && (
                    <p id="support-message-error" className="mt-1 text-[10px] font-semibold text-red-600">
                      {messageError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="support-email" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    Reply email <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="support-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    aria-invalid={emailTouched && Boolean(emailError)}
                    className={`mt-2 h-11 w-full rounded-xl border bg-slate-50 px-3.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      emailTouched && emailError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                    }`}
                  />

                  {emailTouched && emailError && (
                    <p className="mt-1 text-[10px] font-semibold text-red-600">
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                  <div className="flex items-start gap-2">
                    <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <p className="text-[9px] leading-4 text-emerald-800">
                      Support will never ask for your password, full card number, PIN or one-time code.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#120d25] px-4 text-xs font-black text-white shadow-[0_14px_30px_rgba(18,13,37,.18)] transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      Send support request
                      <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-[9px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Protected data handling
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Powered by Coffer
              </span>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
