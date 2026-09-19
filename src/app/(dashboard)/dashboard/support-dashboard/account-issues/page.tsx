"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Eye,
  FileText,
  Gauge,
  Hash,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MessageSquare,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  supportApi,
  type SupportActivity,
  type SupportMessage,
  type SupportTicketDetail,
  type SupportTicketSummary,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/api/supportApi";

/* =========================================================
   TYPES
========================================================= */

type StatusFilter =
  | "All"
  | TicketStatus;

type PriorityFilter =
  | "All"
  | TicketPriority;

type SlaFilter =
  | "All"
  | "Due Soon"
  | "Breached";

type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type MetricTone =
  | "emerald"
  | "cyan"
  | "violet"
  | "amber"
  | "rose";

type DrawerTab =
  | "overview"
  | "conversation"
  | "activity"
  | "actions";

type ActionMode =
  | "reply"
  | "note"
  | "escalate"
  | "resolve"
  | "status"
  | "priority"
  | null;

/* =========================================================
   CONSTANTS
========================================================= */

const STATUS_OPTIONS: Array<
  SelectOption<StatusFilter>
> = [
  {
    value: "All",
    label: "All statuses",
    description:
      "Every account-support state",
  },
  {
    value: "Open",
    label: "Open",
    description:
      "New or active issue",
  },
  {
    value: "Waiting for Customer",
    label: "Waiting for Customer",
    description:
      "Customer response required",
  },
  {
    value: "In Progress",
    label: "In Progress",
    description:
      "Support investigation active",
  },
  {
    value: "Escalated",
    label: "Escalated",
    description:
      "Needs higher-level review",
  },
  {
    value: "Resolved",
    label: "Resolved",
    description:
      "Issue closed",
  },
];

const PRIORITY_OPTIONS: Array<
  SelectOption<PriorityFilter>
> = [
  {
    value: "All",
    label: "All priorities",
    description:
      "Any support priority",
  },
  {
    value: "Urgent",
    label: "Urgent",
    description:
      "Immediate attention",
  },
  {
    value: "High",
    label: "High",
    description:
      "Important customer impact",
  },
  {
    value: "Normal",
    label: "Normal",
    description:
      "Standard workflow",
  },
  {
    value: "Low",
    label: "Low",
    description:
      "Lower urgency",
  },
];

const SLA_OPTIONS: Array<
  SelectOption<SlaFilter>
> = [
  {
    value: "All",
    label: "All SLA states",
    description:
      "No SLA restriction",
  },
  {
    value: "Due Soon",
    label: "Due Soon",
    description:
      "SLA deadline approaching",
  },
  {
    value: "Breached",
    label: "Breached",
    description:
      "SLA deadline passed",
  },
];

const HERO_PARTICLES = [
  {
    left: "7%",
    top: "22%",
    size: 4,
    delay: 0.1,
    duration: 7.4,
  },
  {
    left: "16%",
    top: "72%",
    size: 3,
    delay: 1.2,
    duration: 8.8,
  },
  {
    left: "28%",
    top: "18%",
    size: 5,
    delay: 0.7,
    duration: 9.6,
  },
  {
    left: "41%",
    top: "78%",
    size: 4,
    delay: 2.1,
    duration: 7.8,
  },
  {
    left: "54%",
    top: "28%",
    size: 3,
    delay: 1.7,
    duration: 8.5,
  },
  {
    left: "66%",
    top: "68%",
    size: 5,
    delay: 0.4,
    duration: 10.2,
  },
  {
    left: "79%",
    top: "24%",
    size: 3,
    delay: 2.6,
    duration: 7.1,
  },
  {
    left: "90%",
    top: "70%",
    size: 4,
    delay: 1.5,
    duration: 9.2,
  },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function messageOf(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? "Not available"
    : date.toLocaleString();
}

function compactId(
  value:
    | string
    | null
    | undefined,
  start = 8,
  end = 5
): string {
  if (!value) {
    return "Not available";
  }

  if (
    value.length <=
    start + end + 3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start
  )}…${value.slice(
    -end
  )}`;
}

function humanize(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function statusStyle(
  status: TicketStatus
): string {
  if (
    status ===
    "Resolved"
  ) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    status ===
    "Escalated"
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    status ===
    "Waiting for Customer"
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }

  if (
    status ===
    "In Progress"
  ) {
    return "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
  }

  return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
}

function priorityStyle(
  priority: TicketPriority
): string {
  if (
    priority ===
    "Urgent"
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    priority ===
    "High"
  ) {
    return "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300";
  }

  if (
    priority ===
    "Low"
  ) {
    return "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
  }

  return "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
}

function slaTone(
  breached: boolean,
  minutes: number
): string {
  if (breached) {
    return "text-rose-700 dark:text-rose-300";
  }

  if (
    minutes <=
    15
  ) {
    return "text-amber-700 dark:text-amber-300";
  }

  return "text-emerald-700 dark:text-emerald-300";
}

function slaText(
  breached: boolean,
  minutes: number
): string {
  if (breached) {
    return `${Math.abs(
      minutes
    )}m breached`;
  }

  return `${Math.max(
    0,
    minutes
  )}m remaining`;
}

function selectedLabel<
  T extends string,
>(
  options:
    Array<
      SelectOption<T>
    >,
  value: T
): string {
  return (
    options.find(
      (item) =>
        item.value ===
        value
    )?.label ??
    value
  );
}

/* =========================================================
   MOTION
========================================================= */

const reveal = {
  hidden: {
    opacity: 0,
    y: 16,
    filter:
      "blur(7px)",
  },

  show: {
    opacity: 1,
    y: 0,
    filter:
      "blur(0px)",
  },
};

const stagger = {
  hidden: {},

  show: {
    transition: {
      staggerChildren:
        0.055,
    },
  },
};

/* =========================================================
   CUSTOM SELECT
========================================================= */

function SupportSelect<
  T extends string,
>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: T;
  options:
    Array<
      SelectOption<T>
    >;
  onChange:
    (
      value: T
    ) => void;
  icon: LucideIcon;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  const selected =
    options.find(
      (item) =>
        item.value ===
        value
    ) ??
    options[0];

  useEffect(
    () => {
      function onPointerDown(
        event:
          PointerEvent
      ) {
        if (
          rootRef.current &&
          !rootRef.current.contains(
            event.target as Node
          )
        ) {
          setOpen(
            false
          );
        }
      }

      function onKeyDown(
        event:
          KeyboardEvent
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setOpen(
            false
          );
        }
      }

      document.addEventListener(
        "pointerdown",
        onPointerDown
      );

      document.addEventListener(
        "keydown",
        onKeyDown
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          onPointerDown
        );

        document.removeEventListener(
          "keydown",
          onKeyDown
        );
      };
    },
    []
  );

  return (
    <div
      ref={
        rootRef
      }
      className="relative"
    >
      <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-white px-3.5 text-left shadow-sm outline-none transition duration-200 dark:bg-slate-950/70 ${
          open
            ? "border-emerald-500/60 ring-4 ring-emerald-500/10"
            : "border-emerald-100 hover:border-emerald-300 dark:border-white/10"
        }`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-slate-900 dark:text-white">
            {
              selected
                ?.label
            }
          </span>

          {selected?.description && (
            <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
              {
                selected.description
              }
            </span>
          )}
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
          transition={{
            duration:
              0.2,
          }}
          className="text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity:
                0,
              y:
                -6,
              scale:
                0.98,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
              scale:
                1,
            }}
            exit={{
              opacity:
                0,
              y:
                -5,
              scale:
                0.98,
            }}
            transition={{
              duration:
                0.16,
            }}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-emerald-100 bg-white/95 p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.28)] backdrop-blur-xl dark:border-white/10 dark:bg-[#071b16]/95"
          >
            {options.map(
              (
                option
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    role="option"
                    aria-selected={
                      active
                    }
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-emerald-500/10"
                        : "hover:bg-emerald-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-400 dark:bg-white/5"
                      }`}
                    >
                      {active ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                        {
                          option.label
                        }
                      </span>

                      {option.description && (
                        <span className="mt-0.5 block truncate text-[9px] text-slate-500 dark:text-slate-400">
                          {
                            option.description
                          }
                        </span>
                      )}
                    </span>
                  </button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function metricTone(
  tone:
    MetricTone
): {
  shell: string;
  glow: string;
  bar: string;
} {
  if (
    tone ===
    "cyan"
  ) {
    return {
      shell:
        "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      glow:
        "bg-cyan-400/10",
      bar:
        "from-cyan-500 to-sky-400",
    };
  }

  if (
    tone ===
    "violet"
  ) {
    return {
      shell:
        "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      glow:
        "bg-violet-400/10",
      bar:
        "from-violet-500 to-fuchsia-400",
    };
  }

  if (
    tone ===
    "amber"
  ) {
    return {
      shell:
        "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      glow:
        "bg-amber-400/10",
      bar:
        "from-amber-500 to-orange-400",
    };
  }

  if (
    tone ===
    "rose"
  ) {
    return {
      shell:
        "border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      glow:
        "bg-rose-400/10",
      bar:
        "from-rose-500 to-pink-400",
    };
  }

  return {
    shell:
      "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    glow:
      "bg-emerald-400/10",
    bar:
      "from-emerald-500 to-teal-400",
  };
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  description:
    string;
  icon: LucideIcon;
  tone:
    MetricTone;
}) {
  const styles =
    metricTone(
      tone
    );

  return (
    <motion.article
      variants={
        reveal
      }
      whileHover={{
        y: -4,
        scale:
          1.006,
      }}
      transition={{
        type:
          "spring",
        stiffness:
          280,
        damping:
          22,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-emerald-100/90 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(5,150,105,.48)] dark:border-white/10 dark:bg-slate-950/70"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            {
              description
            }
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate:
              8,
            scale:
              1.08,
          }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${styles.shell}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <motion.div
          initial={{
            width:
              "20%",
          }}
          animate={{
            width: [
              "20%",
              "72%",
              "46%",
            ],
          }}
          transition={{
            duration:
              4.8,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
        />
      </div>
    </motion.article>
  );
}

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description:
    string;
  icon: LucideIcon;
  action?: ReactNode;
  children:
    ReactNode;
}) {
  return (
    <motion.section
      variants={
        reveal
      }
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount:
          0.08,
      }}
      className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_20px_60px_-45px_rgba(5,150,105,.42)] dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="flex flex-col gap-3 border-b border-emerald-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{
              rotate:
                8,
              scale:
                1.06,
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <Icon className="h-5 w-5" />
          </motion.div>

          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {
                description
              }
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </motion.section>
  );
}

/* =========================================================
   MESSAGE
========================================================= */

function MessageBubble({
  message,
}: {
  message:
    SupportMessage;
}) {
  const customer =
    message.authorType ===
    "customer";

  const internal =
    message.visibility ===
    "internal";

  return (
    <motion.div
      variants={
        reveal
      }
      className={`rounded-2xl border p-4 ${
        internal
          ? "border-amber-500/15 bg-amber-500/[0.05]"
          : customer
            ? "border-cyan-500/15 bg-cyan-500/[0.05]"
            : "border-emerald-500/15 bg-emerald-500/[0.05]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`grid h-8 w-8 place-items-center rounded-xl ${
              internal
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : customer
                  ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            {internal ? (
              <ShieldCheck className="h-4 w-4" />
            ) : customer ? (
              <UserRound className="h-4 w-4" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </span>

          <div>
            <p className="text-xs font-black text-slate-900 dark:text-white">
              {
                message.authorName
              }
            </p>

            <p className="text-[9px] text-slate-400">
              {internal
                ? "Internal note"
                : humanize(
                    message.authorType
                  )}
            </p>
          </div>
        </div>

        <p className="text-[9px] text-slate-400">
          {formatDateTime(
            message.createdAt
          )}
        </p>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-600 dark:text-slate-300">
        {message.body}
      </p>
    </motion.div>
  );
}

/* =========================================================
   ACTIVITY
========================================================= */

function ActivityItem({
  item,
  index,
}: {
  item:
    SupportActivity;
  index: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 8,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay:
          index *
          0.035,
      }}
      className="relative rounded-2xl border border-emerald-100 bg-emerald-50/25 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]"
    >
      <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.10)] dark:border-slate-950" />

      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
        {humanize(
          item.eventType
        )}
      </p>

      <p className="mt-1 text-xs font-black text-slate-800 dark:text-slate-100">
        {item.summary}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-slate-400">
        <span>
          {item.actorName}
        </span>

        <span>•</span>

        <span>
          {formatDateTime(
            item.createdAt
          )}
        </span>
      </div>
    </motion.div>
  );
}

/* =========================================================
   ACTION COMPOSER
========================================================= */

function ActionComposer({
  title,
  description,
  value,
  setValue,
  placeholder,
  buttonLabel,
  icon: Icon,
  busy,
  tone = "emerald",
  minLength = 2,
  onSubmit,
}: {
  title: string;
  description:
    string;
  value: string;
  setValue:
    (
      value: string
    ) => void;
  placeholder:
    string;
  buttonLabel:
    string;
  icon: LucideIcon;
  busy: boolean;
  tone?:
    | "emerald"
    | "amber"
    | "rose";
  minLength?:
    number;
  onSubmit:
    () => void;
}) {
  const ready =
    value.trim()
      .length >=
    minLength;

  const buttonTone =
    tone ===
    "rose"
      ? "bg-rose-600 hover:bg-rose-700"
      : tone ===
          "amber"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/25 p-4 dark:border-white/10 dark:bg-white/[0.025]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <Icon className="h-4 w-4" />
        </span>

        <div>
          <p className="text-xs font-black text-slate-900 dark:text-white">
            {title}
          </p>

          <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
            {
              description
            }
          </p>
        </div>
      </div>

      <textarea
        value={
          value
        }
        onChange={(
          event
        ) =>
          setValue(
            event.target
              .value
          )
        }
        placeholder={
          placeholder
        }
        className="mt-4 min-h-28 w-full resize-y rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[9px] text-slate-400">
          {value.trim().length} characters
        </p>

        <button
          type="button"
          disabled={
            busy ||
            !ready
          }
          onClick={
            onSubmit
          }
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${buttonTone}`}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}

          {
            buttonLabel
          }
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportAccountIssuesPage() {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
      "All"
    );

  const [
    priority,
    setPriority,
  ] =
    useState<PriorityFilter>(
      "All"
    );

  const [
    sla,
    setSla,
  ] =
    useState<SlaFilter>(
      "All"
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    total,
    setTotal,
  ] =
    useState(
      0
    );

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(
      1
    );

  const [
    tickets,
    setTickets,
  ] =
    useState<
      SupportTicketSummary[]
    >([]);

  const [
    selectedId,
    setSelectedId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    detail,
    setDetail,
  ] =
    useState<
      SupportTicketDetail |
      null
    >(
      null
    );

  const [
    drawerTab,
    setDrawerTab,
  ] =
    useState<DrawerTab>(
      "overview"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    success,
    setSuccess,
  ] =
    useState(
      ""
    );

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(
      0
    );

  const [
    actionMode,
    setActionMode,
  ] =
    useState<ActionMode>(
      null
    );

  const [
    reply,
    setReply,
  ] =
    useState(
      ""
    );

  const [
    note,
    setNote,
  ] =
    useState(
      ""
    );

  const [
    escalation,
    setEscalation,
  ] =
    useState(
      ""
    );

  const [
    resolution,
    setResolution,
  ] =
    useState(
      ""
    );

  const loadTickets =
    useCallback(
      async (
        fullLoader:
          boolean
      ) => {
        if (
          fullLoader
        ) {
          setLoading(
            true
          );
        } else {
          setRefreshing(
            true
          );
        }

        setError(
          ""
        );

        try {
          const result =
            await supportApi.getTickets(
              {
                search:
                  search.trim() ||
                  undefined,
                status,
                priority,
                category:
                  "Account",
                sla,
                page,
                limit:
                  20,
              }
            );

          setTickets(
            result.tickets
          );

          setTotal(
            result.pagination
              .total
          );

          setTotalPages(
            Math.max(
              1,
              result.pagination
                .pages
            )
          );
        } catch (
          requestError:
            unknown
        ) {
          setError(
            messageOf(
              requestError
            )
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        search,
        status,
        priority,
        sla,
        page,
      ]
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            void loadTickets(
              tickets.length ===
                0
            );
          },
          250
        );

      return () =>
        window.clearTimeout(
          timer
        );
    },
    [
      loadTickets,
      refreshKey,
    ]
  );

  useEffect(
    () => {
      if (
        !selectedId
      ) {
        setDetail(
          null
        );

        return;
      }

      let active =
        true;

      setDetailLoading(
        true
      );

      setDetail(
        null
      );

      setError(
        ""
      );

      void supportApi
        .getTicket(
          selectedId
        )
        .then(
          (
            result
          ) => {
            if (
              active
            ) {
              setDetail(
                result.ticket
              );
            }
          }
        )
        .catch(
          (
            requestError:
              unknown
          ) => {
            if (
              active
            ) {
              setError(
                messageOf(
                  requestError
                )
              );
            }
          }
        )
        .finally(
          () => {
            if (
              active
            ) {
              setDetailLoading(
                false
              );
            }
          }
        );

      return () => {
        active =
          false;
      };
    },
    [
      selectedId,
    ]
  );

  useEffect(
    () => {
      if (
        !selectedId
      ) {
        return;
      }

      function onKeyDown(
        event:
          KeyboardEvent
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setSelectedId(
            null
          );
        }
      }

      window.addEventListener(
        "keydown",
        onKeyDown
      );

      return () =>
        window.removeEventListener(
          "keydown",
          onKeyDown
        );
    },
    [
      selectedId,
    ]
  );

  const activeFilterCount =
    useMemo(
      () =>
        [
          Boolean(
            search.trim()
          ),
          status !==
            "All",
          priority !==
            "All",
          sla !==
            "All",
        ].filter(
          Boolean
        ).length,
      [
        search,
        status,
        priority,
        sla,
      ]
    );

  const visibleOpen =
    useMemo(
      () =>
        tickets.filter(
          (
            ticket
          ) =>
            ticket.status ===
            "Open"
        ).length,
      [
        tickets,
      ]
    );

  const visibleProgress =
    useMemo(
      () =>
        tickets.filter(
          (
            ticket
          ) =>
            ticket.status ===
            "In Progress"
        ).length,
      [
        tickets,
      ]
    );

  const visibleEscalated =
    useMemo(
      () =>
        tickets.filter(
          (
            ticket
          ) =>
            ticket.status ===
            "Escalated"
        ).length,
      [
        tickets,
      ]
    );

  const visibleBreached =
    useMemo(
      () =>
        tickets.filter(
          (
            ticket
          ) =>
            ticket.slaBreached
        ).length,
      [
        tickets,
      ]
    );

  function resetFilters() {
    setSearch(
      ""
    );

    setStatus(
      "All"
    );

    setPriority(
      "All"
    );

    setSla(
      "All"
    );

    setPage(
      1
    );

    setError(
      ""
    );
  }

  async function reloadSelected(
    message:
      string
  ) {
    if (
      !selectedId
    ) {
      return;
    }

    setSuccess(
      message
    );

    const result =
      await supportApi.getTicket(
        selectedId
      );

    setDetail(
      result.ticket
    );

    await loadTickets(
      false
    );
  }

  async function runAction(
    mode:
      Exclude<
        ActionMode,
        null
      >,
    action:
      () =>
        Promise<unknown>,
    message:
      string
  ) {
    if (
      actionMode
    ) {
      return;
    }

    setActionMode(
      mode
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    try {
      await action();

      await reloadSelected(
        message
      );
    } catch (
      requestError:
        unknown
    ) {
      setError(
        messageOf(
          requestError
        )
      );
    } finally {
      setActionMode(
        null
      );
    }
  }

  return (
    <main className="space-y-6">
      {/* ===================================================
          HERO
      ==================================================== */}

      <motion.section
        initial={{
          opacity:
            0,
          y:
            14,
        }}
        animate={{
          opacity:
            1,
          y:
            0,
        }}
        transition={{
          duration:
            0.55,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_48%,#065F46_100%)] p-6 text-white shadow-[0_28px_80px_-42px_rgba(5,150,105,.58)] md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [
              0,
              30,
              -12,
              0,
            ],
            y: [
              0,
              -16,
              11,
              0,
            ],
            scale: [
              1,
              1.12,
              0.96,
              1,
            ],
          }}
          transition={{
            duration:
              13,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-emerald-300/15 blur-[90px]"
        />

        <motion.div
          animate={{
            x: [
              0,
              -22,
              16,
              0,
            ],
            y: [
              0,
              17,
              -9,
              0,
            ],
          }}
          transition={{
            duration:
              15,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-cyan-300/10 blur-[100px]"
        />

        <motion.div
          animate={{
            rotate: [
              0,
              4,
              -3,
              0,
            ],
            scale: [
              1,
              1.08,
              0.98,
              1,
            ],
          }}
          transition={{
            duration:
              18,
            repeat:
              Infinity,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute -left-[14%] top-[10%] h-[50%] w-[70%] rounded-[50%] bg-[linear-gradient(90deg,rgba(16,185,129,0),rgba(52,211,153,.12),rgba(34,211,238,.08),rgba(16,185,129,0))] blur-[55px]"
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:23px_23px]" />

        {HERO_PARTICLES.map(
          (
            particle,
            index
          ) => (
            <motion.span
              key={`${particle.left}-${particle.top}-${index}`}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.78)]"
              style={{
                left:
                  particle.left,
                top:
                  particle.top,
                width:
                  particle.size,
                height:
                  particle.size,
              }}
              animate={{
                y: [
                  0,
                  -13,
                  5,
                  0,
                ],
                x: [
                  0,
                  6,
                  -4,
                  0,
                ],
                opacity: [
                  0.18,
                  0.8,
                  0.32,
                  0.18,
                ],
                scale: [
                  0.8,
                  1.25,
                  0.95,
                  0.8,
                ],
              }}
              transition={{
                duration:
                  particle.duration,
                delay:
                  particle.delay,
                repeat:
                  Infinity,
                ease:
                  "easeInOut",
              }}
            />
          )
        )}

        <motion.div
          animate={{
            x: [
              "-30%",
              "130%",
            ],
          }}
          transition={{
            duration:
              5.8,
            repeat:
              Infinity,
            repeatDelay:
              2.6,
            ease:
              "easeInOut",
          }}
          className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-emerald-100 to-transparent shadow-[0_0_18px_rgba(209,250,229,.9)]"
        />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-100 backdrop-blur">
                <Users className="h-3.5 w-3.5" />

                Account Issues
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-100/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />

                Support workflow
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Investigate and resolve account support cases
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/75">
              Work only with real Account-category support tickets. Review
              customer account context, conversation history, internal activity,
              SLA state and support actions without inventing credential,
              security or balance mutations that the backend does not expose.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-50/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <FileText className="h-3.5 w-3.5" />

                {
                  total.toLocaleString(
                    "en-BD"
                  )
                }{" "}
                matches
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Gauge className="h-3.5 w-3.5" />

                {
                  selectedLabel(
                    STATUS_OPTIONS,
                    status
                  )
                }
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <LockKeyhole className="h-3.5 w-3.5" />

                No password / OTP handling
              </span>
            </div>
          </div>

          <div className="relative shrink-0">
            <motion.div
              animate={{
                rotate:
                  360,
              }}
              transition={{
                duration:
                  19,
                repeat:
                  Infinity,
                ease:
                  "linear",
              }}
              className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-emerald-100/20 xl:block"
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.9)]" />
            </motion.div>

            <button
              type="button"
              disabled={
                refreshing ||
                loading
              }
              onClick={() =>
                setRefreshKey(
                  (
                    value
                  ) =>
                    value +
                    1
                )
              }
              className="relative inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-900 shadow-[0_12px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  refreshing ||
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh issues
            </button>
          </div>
        </div>

        {(refreshing ||
          loading) && (
          <motion.div
            initial={{
              scaleX:
                0,
            }}
            animate={{
              scaleX:
                1,
            }}
            transition={{
              duration:
                1.15,
              repeat:
                Infinity,
            }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-emerald-100 to-transparent"
          />
        )}
      </motion.section>

      {/* ===================================================
          FILTERS
      ==================================================== */}

      <motion.section
        initial={{
          opacity:
            0,
          y:
            12,
        }}
        animate={{
          opacity:
            1,
          y:
            0,
        }}
        transition={{
          delay:
            0.08,
          duration:
            0.45,
        }}
        className="relative z-30 rounded-[26px] border border-emerald-100 bg-white p-4 shadow-[0_18px_55px_-42px_rgba(5,150,105,.45)] dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
              Account issue filters
            </p>

            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              Real server filters · {activeFilterCount} active
            </p>
          </div>

          <button
            type="button"
            onClick={
              resetFilters
            }
            disabled={
              activeFilterCount ===
              0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />

            Reset
          </button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Ticket / customer search
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.035]">
              <Search className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
                  );

                  setPage(
                    1
                  );
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="Ticket, subject, customer or reference"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch(
                      ""
                    );

                    setPage(
                      1
                    );
                  }}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-emerald-100 hover:text-emerald-700"
                  aria-label="Clear account issue search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>

          <SupportSelect
            label="Status"
            value={
              status
            }
            options={
              STATUS_OPTIONS
            }
            onChange={(
              value
            ) => {
              setStatus(
                value
              );

              setPage(
                1
              );
            }}
            icon={
              Gauge
            }
          />

          <SupportSelect
            label="Priority"
            value={
              priority
            }
            options={
              PRIORITY_OPTIONS
            }
            onChange={(
              value
            ) => {
              setPriority(
                value
              );

              setPage(
                1
              );
            }}
            icon={
              AlertCircle
            }
          />

          <SupportSelect
            label="SLA"
            value={
              sla
            }
            options={
              SLA_OPTIONS
            }
            onChange={(
              value
            ) => {
              setSla(
                value
              );

              setPage(
                1
              );
            }}
            icon={
              Clock3
            }
          />
        </div>
      </motion.section>

      {/* ===================================================
          FEEDBACK
      ==================================================== */}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{
              opacity:
                0,
              y:
                -8,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            exit={{
              opacity:
                0,
              y:
                -8,
            }}
            role="alert"
            className="flex items-start gap-3 rounded-[22px] border border-rose-500/20 bg-rose-500/[0.06] p-4 text-rose-700 dark:text-rose-300"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-black">
                Account issue request failed
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{
              opacity:
                0,
              y:
                -8,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
            }}
            exit={{
              opacity:
                0,
              y:
                -8,
            }}
            className="flex items-start gap-3 rounded-[22px] border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-emerald-700 dark:text-emerald-300"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-black">
                Support case updated
              </p>

              <p className="mt-1 text-xs leading-5">
                {success}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess(
                  ""
                )
              }
              className="ml-auto rounded-lg p-1 text-emerald-600 hover:bg-emerald-500/10"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          METRICS
      ==================================================== */}

      <motion.section
        variants={
          stagger
        }
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <MetricCard
          label="Total matches"
          value={
            total.toLocaleString(
              "en-BD"
            )
          }
          description="Server-reported Account-category matches"
          icon={
            Users
          }
          tone="emerald"
        />

        <MetricCard
          label="Visible open"
          value={
            visibleOpen.toLocaleString(
              "en-BD"
            )
          }
          description="Open issues on the current page"
          icon={
            AlertCircle
          }
          tone="violet"
        />

        <MetricCard
          label="Visible in progress"
          value={
            visibleProgress.toLocaleString(
              "en-BD"
            )
          }
          description="Active investigations on this page"
          icon={
            RefreshCcw
          }
          tone="cyan"
        />

        <MetricCard
          label="Visible escalated"
          value={
            visibleEscalated.toLocaleString(
              "en-BD"
            )
          }
          description="Escalated issues on the current page"
          icon={
            ShieldAlert
          }
          tone="rose"
        />

        <MetricCard
          label="Visible SLA breach"
          value={
            visibleBreached.toLocaleString(
              "en-BD"
            )
          }
          description="Breached issue SLAs on this page"
          icon={
            Clock3
          }
          tone="amber"
        />
      </motion.section>

      {/* ===================================================
          TABLE
      ==================================================== */}

      <Panel
        title="Account Issue Queue"
        description="Only real support tickets whose category is Account are loaded."
        icon={
          CircleUserRound
        }
        action={
          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-300">
            {tickets.length} visible
          </span>
        }
      >
        {loading ? (
          <div className="grid min-h-[340px] place-items-center">
            <div className="text-center">
              <div className="relative mx-auto h-16 w-16">
                <motion.div
                  animate={{
                    rotate:
                      360,
                  }}
                  transition={{
                    duration:
                      4,
                    repeat:
                      Infinity,
                    ease:
                      "linear",
                  }}
                  className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
                />

                <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-emerald-600" />
              </div>

              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                Loading account issues
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Reading the real Account support queue...
              </p>
            </div>
          </div>
        ) : tickets.length ===
          0 ? (
          <div className="grid min-h-[340px] place-items-center rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/30 px-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Search className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                No account issues match
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                Try another search, status, priority or SLA filter.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* MOBILE */}

            <div className="grid gap-3 lg:hidden">
              {tickets.map(
                (
                  ticket,
                  index
                ) => (
                  <motion.article
                    key={
                      ticket.id
                    }
                    initial={{
                      opacity:
                        0,
                      y:
                        8,
                    }}
                    animate={{
                      opacity:
                        1,
                      y:
                        0,
                    }}
                    transition={{
                      delay:
                        Math.min(
                          index *
                            0.025,
                          0.18
                        ),
                    }}
                    className="rounded-[20px] border border-emerald-100 bg-emerald-50/20 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                          {
                            ticket.ticketNumber
                          }
                        </p>

                        <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">
                          {
                            ticket.subject
                          }
                        </p>

                        <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {
                            ticket.customerName
                          }{" "}
                          ·{" "}
                          {
                            ticket.customerEmail
                          }
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${statusStyle(
                          ticket.status
                        )}`}
                      >
                        {
                          ticket.status
                        }
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                        <p className="font-bold text-slate-400">
                          Priority
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[8px] font-black ${priorityStyle(
                            ticket.priority
                          )}`}
                        >
                          {
                            ticket.priority
                          }
                        </span>
                      </div>

                      <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                        <p className="font-bold text-slate-400">
                          SLA
                        </p>

                        <p
                          className={`mt-1 font-black ${slaTone(
                            ticket.slaBreached,
                            ticket.slaMinutes
                          )}`}
                        >
                          {slaText(
                            ticket.slaBreached,
                            ticket.slaMinutes
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(
                          ticket.id
                        );

                        setDrawerTab(
                          "overview"
                        );

                        setSuccess(
                          ""
                        );
                      }}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                    >
                      <Eye className="h-4 w-4" />

                      Open account issue
                    </button>
                  </motion.article>
                )
              )}
            </div>

            {/* DESKTOP */}

            <div className="support-scroll-hidden hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1160px] text-left">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/60 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400">
                    <th className="px-4 py-3.5">
                      Ticket
                    </th>

                    <th className="px-4 py-3.5">
                      Customer
                    </th>

                    <th className="px-4 py-3.5">
                      Issue
                    </th>

                    <th className="px-4 py-3.5">
                      Priority
                    </th>

                    <th className="px-4 py-3.5">
                      Status
                    </th>

                    <th className="px-4 py-3.5">
                      SLA
                    </th>

                    <th className="px-4 py-3.5">
                      Assignee
                    </th>

                    <th className="px-4 py-3.5 text-right">
                      Review
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map(
                    (
                      ticket,
                      index
                    ) => (
                      <motion.tr
                        key={
                          ticket.id
                        }
                        initial={{
                          opacity:
                            0,
                          y:
                            4,
                        }}
                        animate={{
                          opacity:
                            1,
                          y:
                            0,
                        }}
                        transition={{
                          delay:
                            Math.min(
                              index *
                                0.02,
                              0.16
                            ),
                        }}
                        className="border-b border-emerald-100/70 text-xs transition hover:bg-emerald-50/60 dark:border-white/5 dark:hover:bg-emerald-500/[0.04]"
                      >
                        <td className="px-4 py-4">
                          <p className="font-black text-emerald-700 dark:text-emerald-300">
                            {
                              ticket.ticketNumber
                            }
                          </p>

                          <p className="mt-1 font-mono text-[9px] text-slate-400">
                            {
                              compactId(
                                ticket.id
                              )
                            }
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              <UserRound className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate font-black text-slate-900 dark:text-white">
                                {
                                  ticket.customerName
                                }
                              </p>

                              <p className="mt-1 max-w-[190px] truncate text-[9px] text-slate-400">
                                {
                                  ticket.customerEmail
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[260px] truncate font-black text-slate-800 dark:text-slate-100">
                            {
                              ticket.subject
                            }
                          </p>

                          <p className="mt-1 text-[9px] text-slate-400">
                            {
                              ticket.waitingOn ===
                              "customer"
                                ? "Waiting on customer"
                                : ticket.waitingOn ===
                                    "admin"
                                  ? "Waiting on support"
                                  : "No waiting party"
                            }
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${priorityStyle(
                              ticket.priority
                            )}`}
                          >
                            {
                              ticket.priority
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${statusStyle(
                              ticket.status
                            )}`}
                          >
                            {
                              ticket.status
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <p
                            className={`text-[10px] font-black ${slaTone(
                              ticket.slaBreached,
                              ticket.slaMinutes
                            )}`}
                          >
                            {slaText(
                              ticket.slaBreached,
                              ticket.slaMinutes
                            )}
                          </p>

                          <p className="mt-1 text-[9px] text-slate-400">
                            {
                              ticket.slaBreached
                                ? "Needs attention"
                                : "Within target"
                            }
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p
                            className={`max-w-[150px] truncate text-[10px] font-black ${
                              ticket.assignee
                                .id
                                ? "text-slate-700 dark:text-slate-200"
                                : "text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {
                              ticket.assignee
                                .name
                            }
                          </p>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <motion.button
                            type="button"
                            whileHover={{
                              y:
                                -1,
                            }}
                            whileTap={{
                              scale:
                                0.98,
                            }}
                            onClick={() => {
                              setSelectedId(
                                ticket.id
                              );

                              setDrawerTab(
                                "overview"
                              );

                              setSuccess(
                                ""
                              );
                            }}
                            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                          >
                            <Eye className="mr-1.5 inline h-3.5 w-3.5" />

                            Open
                          </motion.button>
                        </td>
                      </motion.tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Page{" "}
                <span className="font-black text-slate-900 dark:text-white">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-black text-slate-900 dark:text-white">
                  {totalPages}
                </span>{" "}
                ·{" "}
                {total.toLocaleString(
                  "en-BD"
                )}{" "}
                account issues
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    page <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (
                        value
                      ) =>
                        value -
                        1
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Previous account issues page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (
                        value
                      ) =>
                        value +
                        1
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Next account issues page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>

      {/* ===================================================
          DETAIL DRAWER
      ==================================================== */}

      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            transition={{
              duration:
                0.18,
            }}
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedId(
                  null
                );
              }
            }}
          >
            <motion.aside
              initial={{
                x:
                  "100%",
              }}
              animate={{
                x:
                  0,
              }}
              exit={{
                x:
                  "100%",
              }}
              transition={{
                type:
                  "spring",
                stiffness:
                  260,
                damping:
                  30,
              }}
              className="support-scroll-hidden absolute inset-y-0 right-0 w-full max-w-3xl overflow-y-auto bg-white text-slate-900 shadow-[-24px_0_80px_rgba(15,23,42,.32)] dark:bg-slate-950 dark:text-white"
            >
              {/* DRAWER HEADER */}

              <div className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_52%,#065F46_100%)] p-5 text-white shadow-lg">
                <motion.div
                  animate={{
                    x: [
                      0,
                      18,
                      -7,
                      0,
                    ],
                    y: [
                      0,
                      -9,
                      6,
                      0,
                    ],
                  }}
                  transition={{
                    duration:
                      12,
                    repeat:
                      Infinity,
                    ease:
                      "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100/70">
                      Account support case
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black text-white">
                      {detail?.ticketNumber ??
                        "Loading issue..."}
                    </h2>

                    <p className="mt-1 truncate text-[10px] text-emerald-50/60">
                      {detail?.subject ??
                        compactId(
                          selectedId,
                          12,
                          7
                        )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        null
                      )
                    }
                    className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:rotate-3 hover:bg-white/20"
                    aria-label="Close account issue detail"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="relative mt-4 flex gap-1 overflow-x-auto support-scroll-hidden">
                  {(
                    [
                      [
                        "overview",
                        "Overview",
                      ],
                      [
                        "conversation",
                        "Conversation",
                      ],
                      [
                        "activity",
                        "Activity",
                      ],
                      [
                        "actions",
                        "Actions",
                      ],
                    ] as Array<
                      [
                        DrawerTab,
                        string,
                      ]
                    >
                  ).map(
                    (
                      [
                        value,
                        label,
                      ]
                    ) => (
                      <button
                        key={
                          value
                        }
                        type="button"
                        onClick={() =>
                          setDrawerTab(
                            value
                          )
                        }
                        className={`whitespace-nowrap rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] transition ${
                          drawerTab ===
                          value
                            ? "bg-white text-emerald-900"
                            : "bg-white/[0.07] text-emerald-50/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {detailLoading ? (
                <div className="grid min-h-[65vh] place-items-center">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600" />

                    <p className="mt-3 text-xs font-black text-slate-600 dark:text-slate-300">
                      Loading account issue...
                    </p>
                  </div>
                </div>
              ) : detail ? (
                <motion.div
                  key={
                    drawerTab
                  }
                  initial={{
                    opacity:
                      0,
                    y:
                      6,
                  }}
                  animate={{
                    opacity:
                      1,
                    y:
                      0,
                  }}
                  transition={{
                    duration:
                      0.2,
                  }}
                  className="space-y-5 p-5 sm:p-6"
                >
                  {/* =========================================
                      OVERVIEW
                  ========================================== */}

                  {drawerTab ===
                    "overview" && (
                    <>
                      <motion.section
                        variants={
                          reveal
                        }
                        initial="hidden"
                        animate="show"
                        className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50/45 p-5 dark:border-white/10 dark:bg-white/[0.03]"
                      >
                        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${statusStyle(
                                  detail.status
                                )}`}
                              >
                                {
                                  detail.status
                                }
                              </span>

                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${priorityStyle(
                                  detail.priority
                                )}`}
                              >
                                {
                                  detail.priority
                                }
                              </span>
                            </div>

                            <p className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                              {
                                detail.subject
                              }
                            </p>

                            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500 dark:text-slate-400">
                              {
                                detail.description
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-right dark:border-white/10 dark:bg-white/5">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              SLA
                            </p>

                            <p
                              className={`mt-1 text-sm font-black ${slaTone(
                                detail.slaBreached,
                                detail.slaMinutes
                              )}`}
                            >
                              {slaText(
                                detail.slaBreached,
                                detail.slaMinutes
                              )}
                            </p>
                          </div>
                        </div>
                      </motion.section>

                      <Panel
                        title="Customer Account Context"
                        description="Account-level context already exposed by the support ticket detail API."
                        icon={
                          UserRoundCheck
                        }
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                            <Mail className="h-4 w-4 text-emerald-600" />

                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Customer
                            </p>

                            <p className="mt-1 text-xs font-black text-slate-800 dark:text-slate-100">
                              {
                                detail.customer
                                  .name
                              }
                            </p>

                            <p className="mt-1 break-all text-[10px] text-slate-500 dark:text-slate-400">
                              {
                                detail.customer
                                  .email
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                            <Hash className="h-4 w-4 text-emerald-600" />

                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              User ID
                            </p>

                            <p className="mt-1 break-all font-mono text-[10px] font-black text-slate-800 dark:text-slate-100">
                              {
                                detail.customer
                                  .userId
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                            <BadgeCheck className="h-4 w-4 text-emerald-600" />

                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              KYC status
                            </p>

                            <p className="mt-1 text-xs font-black text-slate-800 dark:text-slate-100">
                              {humanize(
                                detail.customer
                                  .kycStatus
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                            <WalletCards className="h-4 w-4 text-emerald-600" />

                            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                              Wallet link
                            </p>

                            <p className="mt-1 text-xs font-black text-slate-800 dark:text-slate-100">
                              {detail.customer
                                .walletLinked
                                ? "Linked"
                                : "Not linked"}
                            </p>
                          </div>
                        </div>
                      </Panel>

                      <Panel
                        title="Case Metadata"
                        description="Assignment, waiting state, reference and timestamps."
                        icon={
                          Sparkles
                        }
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            [
                              "Ticket ID",
                              detail.id,
                            ],
                            [
                              "Ticket number",
                              detail.ticketNumber,
                            ],
                            [
                              "Assignee",
                              detail.assignee
                                .name,
                            ],
                            [
                              "Waiting on",
                              humanize(
                                detail.waitingOn
                              ),
                            ],
                            [
                              "Related reference",
                              detail.relatedReference ||
                                "Not available",
                            ],
                            [
                              "Created",
                              formatDateTime(
                                detail.createdAt
                              ),
                            ],
                            [
                              "Last activity",
                              formatDateTime(
                                detail.lastActivityAt
                              ),
                            ],
                            [
                              "First response",
                              formatDateTime(
                                detail.firstResponseAt
                              ),
                            ],
                            [
                              "Resolved",
                              formatDateTime(
                                detail.resolvedAt
                              ),
                            ],
                          ].map(
                            (
                              [
                                label,
                                value,
                              ]
                            ) => (
                              <div
                                key={
                                  String(
                                    label
                                  )
                                }
                                className="rounded-2xl border border-emerald-100 bg-emerald-50/25 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                              >
                                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                                  {
                                    label
                                  }
                                </p>

                                <p className="mt-1 break-words text-xs font-black text-slate-800 dark:text-slate-100">
                                  {
                                    value
                                  }
                                </p>
                              </div>
                            )
                          )}
                        </div>

                        {detail.tags.length >
                          0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                              Tags
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {detail.tags.map(
                                (
                                  tag
                                ) => (
                                  <span
                                    key={
                                      tag
                                    }
                                    className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300"
                                  >
                                    {
                                      tag
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </Panel>

                      <motion.section
                        variants={
                          reveal
                        }
                        initial="hidden"
                        animate="show"
                        className="rounded-[22px] border border-amber-500/15 bg-amber-500/[0.05] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            <KeyRound className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                              Account security boundary
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                              This page manages the support case itself. It does
                              not reveal or reset passwords, PINs, OTPs or other
                              authentication secrets, and it does not invent
                              direct account-unlock or balance mutations that are
                              not exposed by the existing support API.
                            </p>
                          </div>
                        </div>
                      </motion.section>
                    </>
                  )}

                  {/* =========================================
                      CONVERSATION
                  ========================================== */}

                  {drawerTab ===
                    "conversation" && (
                    <motion.div
                      variants={
                        stagger
                      }
                      initial="hidden"
                      animate="show"
                      className="space-y-4"
                    >
                      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/35 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                          Original account issue
                        </p>

                        <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
                          {
                            detail.description
                          }
                        </p>

                        {detail.relatedReference && (
                          <p className="mt-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Reference:{" "}
                            {
                              detail.relatedReference
                            }
                          </p>
                        )}
                      </div>

                      {detail.messages.length ===
                      0 ? (
                        <div className="rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/25 p-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                          <MessageSquare className="mx-auto h-6 w-6 text-emerald-600" />

                          <p className="mt-3 text-xs font-black text-slate-800 dark:text-slate-100">
                            No conversation messages yet
                          </p>
                        </div>
                      ) : (
                        detail.messages.map(
                          (
                            message
                          ) => (
                            <MessageBubble
                              key={
                                message.id
                              }
                              message={
                                message
                              }
                            />
                          )
                        )
                      )}

                      <ActionComposer
                        title="Reply to customer"
                        description="Send a customer-visible support reply through the existing ticket API."
                        value={
                          reply
                        }
                        setValue={
                          setReply
                        }
                        placeholder="Write a clear customer-facing response..."
                        buttonLabel="Send reply"
                        icon={
                          Send
                        }
                        busy={
                          actionMode ===
                          "reply"
                        }
                        minLength={
                          2
                        }
                        onSubmit={() => {
                          const body =
                            reply.trim();

                          if (
                            !body
                          ) {
                            return;
                          }

                          void runAction(
                            "reply",
                            () =>
                              supportApi.addReply(
                                detail.id,
                                body
                              ),
                            "Customer reply sent."
                          ).then(
                            () =>
                              setReply(
                                ""
                              )
                          );
                        }}
                      />

                      <ActionComposer
                        title="Internal note"
                        description="Add investigation context visible to the internal support workflow."
                        value={
                          note
                        }
                        setValue={
                          setNote
                        }
                        placeholder="Add internal investigation notes..."
                        buttonLabel="Add note"
                        icon={
                          MessageSquare
                        }
                        busy={
                          actionMode ===
                          "note"
                        }
                        tone="amber"
                        minLength={
                          2
                        }
                        onSubmit={() => {
                          const body =
                            note.trim();

                          if (
                            !body
                          ) {
                            return;
                          }

                          void runAction(
                            "note",
                            () =>
                              supportApi.addInternalNote(
                                detail.id,
                                body
                              ),
                            "Internal note added."
                          ).then(
                            () =>
                              setNote(
                                ""
                              )
                          );
                        }}
                      />
                    </motion.div>
                  )}

                  {/* =========================================
                      ACTIVITY
                  ========================================== */}

                  {drawerTab ===
                    "activity" && (
                    <div>
                      {detail.activity.length ===
                      0 ? (
                        <div className="rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/25 p-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                          <Clock3 className="mx-auto h-6 w-6 text-emerald-600" />

                          <p className="mt-3 text-xs font-black text-slate-800 dark:text-slate-100">
                            No activity events yet
                          </p>
                        </div>
                      ) : (
                        <div className="relative space-y-3 pl-7">
                          <div className="absolute bottom-2 left-[9px] top-2 w-px bg-emerald-100 dark:bg-white/10" />

                          {detail.activity.map(
                            (
                              item,
                              index
                            ) => (
                              <ActivityItem
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                                index={
                                  index
                                }
                              />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================
                      ACTIONS
                  ========================================== */}

                  {drawerTab ===
                    "actions" && (
                    <div className="space-y-5">
                      <Panel
                        title="Workflow Status"
                        description="Use the existing support ticket status API. No account credential changes happen here."
                        icon={
                          Gauge
                        }
                      >
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(
                            [
                              "Open",
                              "Waiting for Customer",
                              "In Progress",
                              "Escalated",
                              "Resolved",
                            ] as TicketStatus[]
                          ).map(
                            (
                              nextStatus
                            ) => {
                              const active =
                                detail.status ===
                                nextStatus;

                              return (
                                <button
                                  key={
                                    nextStatus
                                  }
                                  type="button"
                                  disabled={
                                    Boolean(
                                      actionMode
                                    ) ||
                                    active
                                  }
                                  onClick={() =>
                                    void runAction(
                                      "status",
                                      () =>
                                        supportApi.updateTicket(
                                          detail.id,
                                          {
                                            status:
                                              nextStatus,
                                          }
                                        ),
                                      `Status changed to ${nextStatus}.`
                                    )
                                  }
                                  className={`rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed ${
                                    active
                                      ? "border-emerald-500 bg-emerald-500/10"
                                      : "border-emerald-100 bg-white hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                      {
                                        nextStatus
                                      }
                                    </span>

                                    {active && (
                                      <Check className="h-4 w-4 text-emerald-600" />
                                    )}
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </Panel>

                      <Panel
                        title="Priority"
                        description="Adjust support priority; the backend remains responsible for SLA recalculation."
                        icon={
                          AlertCircle
                        }
                      >
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(
                            [
                              "Urgent",
                              "High",
                              "Normal",
                              "Low",
                            ] as TicketPriority[]
                          ).map(
                            (
                              nextPriority
                            ) => {
                              const active =
                                detail.priority ===
                                nextPriority;

                              return (
                                <button
                                  key={
                                    nextPriority
                                  }
                                  type="button"
                                  disabled={
                                    Boolean(
                                      actionMode
                                    ) ||
                                    active
                                  }
                                  onClick={() =>
                                    void runAction(
                                      "priority",
                                      () =>
                                        supportApi.updateTicket(
                                          detail.id,
                                          {
                                            priority:
                                              nextPriority,
                                          }
                                        ),
                                      `Priority changed to ${nextPriority}.`
                                    )
                                  }
                                  className={`rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed ${
                                    active
                                      ? "border-emerald-500 bg-emerald-500/10"
                                      : "border-emerald-100 bg-white hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/5"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                      {
                                        nextPriority
                                      }
                                    </span>

                                    {active && (
                                      <Check className="h-4 w-4 text-emerald-600" />
                                    )}
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </Panel>

                      <ActionComposer
                        title="Escalate account issue"
                        description="Escalate unresolved or sensitive account cases with a documented reason."
                        value={
                          escalation
                        }
                        setValue={
                          setEscalation
                        }
                        placeholder="Explain why this account case requires escalation..."
                        buttonLabel="Escalate"
                        icon={
                          ShieldAlert
                        }
                        busy={
                          actionMode ===
                          "escalate"
                        }
                        tone="rose"
                        minLength={
                          4
                        }
                        onSubmit={() => {
                          const body =
                            escalation.trim();

                          if (
                            body.length <
                            4
                          ) {
                            return;
                          }

                          void runAction(
                            "escalate",
                            () =>
                              supportApi.escalate(
                                detail.id,
                                body
                              ),
                            "Account issue escalated."
                          ).then(
                            () =>
                              setEscalation(
                                ""
                              )
                          );
                        }}
                      />

                      <ActionComposer
                        title="Resolve account issue"
                        description="Close the support case with a clear resolution note. This resolves the ticket, not account credentials."
                        value={
                          resolution
                        }
                        setValue={
                          setResolution
                        }
                        placeholder="Document the support resolution..."
                        buttonLabel="Resolve issue"
                        icon={
                          CheckCircle2
                        }
                        busy={
                          actionMode ===
                          "resolve"
                        }
                        minLength={
                          4
                        }
                        onSubmit={() => {
                          const body =
                            resolution.trim();

                          if (
                            body.length <
                            4
                          ) {
                            return;
                          }

                          void runAction(
                            "resolve",
                            () =>
                              supportApi.resolve(
                                detail.id,
                                body
                              ),
                            "Account issue resolved."
                          ).then(
                            () =>
                              setResolution(
                                ""
                              )
                          );
                        }}
                      />

                      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/35 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                              Existing backend actions only
                            </p>

                            <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                              Available mutations on this page are ticket reply,
                              internal note, status, priority, escalation and
                              resolution because those actions are present in the
                              current support API. No fake suspend/unlock/reset
                              credential action has been added.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="grid min-h-[65vh] place-items-center px-6">
                  <div className="max-w-sm text-center">
                    <XCircle className="mx-auto h-7 w-7 text-rose-500" />

                    <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">
                      Account issue detail unavailable
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Close the drawer and retry the request.
                    </p>
                  </div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          SCROLLBAR
      ==================================================== */}

      <style jsx global>{`
        .support-scroll-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .support-scroll-hidden::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      `}</style>
    </main>
  );
}
