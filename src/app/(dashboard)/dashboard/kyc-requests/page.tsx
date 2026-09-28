"use client";
/* eslint-disable @next/next/no-img-element -- private signed KYC URLs are short-lived */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileCheck2,
  Fingerprint,
  Image as ImageIcon,
  Loader2,
  Phone,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Video,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  decideAdminEKYC,
  getAdminEKYCDetails,
  getAdminEKYCDocuments,
  getAdminEKYCList,
  getAdminEKYCOverview,
  rerunAdminEKYC,
} from "@/lib/api/ekycApi";

import type {
  AdminEKYCVerification,
  EKYCAuditItem,
  EKYCDocuments,
  EKYCOverview,
  EKYCStatus,
} from "@/types/ekyc";

/* =========================================================
   FILTERS
========================================================= */

const FILTERS: Array<{
  label: string;
  value?: EKYCStatus;
}> = [
  { label: "All" },
  {
    label: "Manual review",
    value: "PENDING_MANUAL_REVIEW",
  },
  {
    label: "Processing",
    value: "PROCESSING",
  },
  {
    label: "Verified",
    value: "VERIFIED",
  },
  {
    label: "Rejected",
    value: "REJECTED",
  },
];


const HERO_PARTICLES = [
  { left: "7%", top: "22%", size: 4, delay: 0.1, duration: 7.4 },
  { left: "16%", top: "72%", size: 3, delay: 1.2, duration: 8.8 },
  { left: "28%", top: "18%", size: 5, delay: 0.7, duration: 9.6 },
  { left: "41%", top: "78%", size: 4, delay: 2.1, duration: 7.8 },
  { left: "54%", top: "28%", size: 3, delay: 1.7, duration: 8.5 },
  { left: "66%", top: "68%", size: 5, delay: 0.4, duration: 10.2 },
  { left: "79%", top: "24%", size: 3, delay: 2.6, duration: 7.1 },
  { left: "90%", top: "70%", size: 4, delay: 1.5, duration: 9.2 },
] as const;

/* =========================================================
   HELPERS
========================================================= */

const messageOf = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : "The request could not be completed.";

function readable(value: string): string {
  return value.replaceAll("_", " ");
}

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function statusStyle(status: EKYCStatus): string {
  if (status === "VERIFIED") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "REJECTED") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (status === "PENDING_MANUAL_REVIEW") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }

  return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
}

/* =========================================================
   MOTION
========================================================= */

const reveal = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(7px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

/* =========================================================
   REUSABLE UI
========================================================= */

type MetricTone =
  | "amber"
  | "violet"
  | "emerald"
  | "rose";

function metricTone(tone: MetricTone): {
  icon: string;
  glow: string;
  line: string;
} {
  switch (tone) {
    case "amber":
      return {
        icon:
          "border-amber-400/20 bg-amber-400/10 text-amber-600 dark:text-amber-300",
        glow: "bg-amber-400/10",
        line: "from-transparent via-amber-400/70 to-transparent",
      };

    case "emerald":
      return {
        icon:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
        glow: "bg-emerald-400/10",
        line: "from-transparent via-emerald-400/70 to-transparent",
      };

    case "rose":
      return {
        icon:
          "border-rose-400/20 bg-rose-400/10 text-rose-600 dark:text-rose-300",
        glow: "bg-rose-400/10",
        line: "from-transparent via-rose-400/70 to-transparent",
      };

    case "violet":
    default:
      return {
        icon:
          "border-violet-400/20 bg-violet-400/10 text-violet-600 dark:text-violet-300",
        glow: "bg-violet-400/10",
        line: "from-transparent via-violet-400/70 to-transparent",
      };
  }
}

function Metric({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: MetricTone;
  icon: LucideIcon;
}) {
  const styles = metricTone(tone);

  return (
    <motion.article
      variants={reveal}
      whileHover={{
        y: -4,
        scale: 1.006,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-[var(--coffer-border)] bg-[var(--coffer-surface)] p-5 shadow-[var(--coffer-shadow)]"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div
        className={`pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r ${styles.line}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--coffer-text-muted)]">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-[var(--coffer-text)]">
            {value}
          </p>
        </div>

        <motion.span
          whileHover={{
            rotate: 9,
            scale: 1.08,
          }}
          transition={{
            type: "spring",
            stiffness: 360,
            damping: 18,
          }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </motion.span>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--coffer-surface-muted)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width:
              value > 0
                ? `${Math.min(
                    100,
                    Math.max(
                      18,
                      Math.log10(value + 1) * 32
                    )
                  )}%`
                : "8%",
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className={`h-full rounded-full ${
            tone === "amber"
              ? "bg-amber-400"
              : tone === "emerald"
                ? "bg-emerald-500"
                : tone === "rose"
                  ? "bg-rose-500"
                  : "bg-violet-500"
          }`}
        />
      </div>
    </motion.article>
  );
}

function Score({
  label,
  value,
  icon: Icon = Sparkles,
}: {
  label: string;
  value: number | null | undefined;
  icon?: LucideIcon;
}) {
  const normalized =
    typeof value === "number"
      ? Math.round(value)
      : null;

  const tone =
    normalized === null
      ? "text-[var(--coffer-text-muted)]"
      : normalized >= 80
        ? "text-emerald-600 dark:text-emerald-300"
        : normalized >= 60
          ? "text-amber-600 dark:text-amber-300"
          : "text-rose-600 dark:text-rose-300";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--coffer-text-muted)]">
            {label}
          </p>

          <p className={`mt-2 text-xl font-black ${tone}`}>
            {normalized === null
              ? "Not available"
              : `${normalized}%`}
          </p>
        </div>

        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--coffer-primary-soft)] text-[var(--coffer-primary)]">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {normalized !== null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--coffer-surface)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(
                100,
                Math.max(0, normalized)
              )}%`,
            }}
            transition={{ duration: 0.75 }}
            className={`h-full rounded-full ${
              normalized >= 80
                ? "bg-emerald-500"
                : normalized >= 60
                  ? "bg-amber-400"
                  : "bg-rose-500"
            }`}
          />
        </div>
      )}
    </motion.div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount: 0.08,
      }}
      className="rounded-[24px] border border-[var(--coffer-border)] bg-[var(--coffer-surface)] shadow-[var(--coffer-shadow)]"
    >
      <div className="flex items-start gap-3 border-b border-[var(--coffer-border)] px-5 py-4">
        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.06,
          }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300"
        >
          <Icon className="h-5 w-5" />
        </motion.div>

        <div>
          <h3 className="text-sm font-black text-[var(--coffer-text)]">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-[var(--coffer-text-muted)]">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="p-5">{children}</div>
    </motion.section>
  );
}

/* =========================================================
   ADMIN / SUPER ADMIN ACCESS
========================================================= */

type AccessState =
  | "checking"
  | "allowed"
  | "denied";

const ADMIN_ROLES = new Set([
  "admin",
  "super_admin",
]);

function normalizeRole(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getStoredRole(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const rawUser =
    window.localStorage.getItem(
      "auth_user"
    );

  if (!rawUser) {
    return "";
  }

  try {
    const parsed =
      JSON.parse(rawUser);

    const candidates = [
      parsed?.role,
      parsed?.user?.role,
      parsed?.data?.role,
      parsed?.profile?.role,
    ];

    for (const candidate of candidates) {
      const role =
        normalizeRole(candidate);

      if (role) {
        return role;
      }
    }
  } catch {
    return "";
  }

  return "";
}

function hasAdminAccess(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const authenticated =
    window.localStorage.getItem(
      "is_authenticated"
    );

  if (
    authenticated !== "true" &&
    authenticated !== "1"
  ) {
    return false;
  }

  return ADMIN_ROLES.has(
    getStoredRole()
  );
}

function isAuthorizationError(
  error: unknown
): boolean {
  const message =
    error instanceof Error
      ? error.message
      : String(error ?? "");

  const normalized =
    message.toLowerCase();

  return (
    normalized.includes("401") ||
    normalized.includes("403") ||
    normalized.includes(
      "unauthorized"
    ) ||
    normalized.includes(
      "forbidden"
    ) ||
    normalized.includes(
      "access denied"
    ) ||
    normalized.includes(
      "not authorized"
    )
  );
}

function AccessCheckingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-600">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>

        <p className="mt-4 text-sm font-black">
          Checking access
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Verifying administrator permissions…
        </p>
      </motion.div>
    </main>
  );
}

function AdminNotFoundState() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 text-foreground">
      <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-violet-500/[0.07] blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-fuchsia-500/[0.05] blur-[100px]" />

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
        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-7 text-center shadow-[0_30px_90px_rgba(15,23,42,.12)] sm:p-10"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.7) 1px, transparent 1px)",
            backgroundSize:
              "32px 32px",
          }}
        />

        <div className="relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-500/15 bg-violet-500/10 text-violet-600">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
            Error 404
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Page not found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The page you are looking for does not exist or is not available.
          </p>
        </div>
      </motion.section>
    </main>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminEkycPage() {
  const [access, setAccess] =
    useState<AccessState>(
      "checking"
    );

  const [overview, setOverview] =
    useState<EKYCOverview | null>(null);

  const [records, setRecords] =
    useState<AdminEKYCVerification[]>([]);

  const [filter, setFilter] =
    useState<EKYCStatus | undefined>(
      "PENDING_MANUAL_REVIEW"
    );

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selected, setSelected] =
    useState<AdminEKYCVerification | null>(
      null
    );

  const [audit, setAudit] =
    useState<EKYCAuditItem[]>([]);

  const [documents, setDocuments] =
    useState<EKYCDocuments | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const [action, setAction] =
    useState<"VERIFIED" | "REJECTED" | null>(
      null
    );

  const [saving, setSaving] =
    useState(false);

  /* =======================================================
     ACCESS CHECK
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setAccess(
            hasAdminAccess()
              ? "allowed"
              : "denied"
          );
        },
        0
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, []);

  const load = useCallback(async () => {
    if (
      access !== "allowed"
    ) {
      return;
    }
    setLoading(true);
    setError("");

    try {
      const [summary, list] =
        await Promise.all([
          getAdminEKYCOverview(),
          getAdminEKYCList({
            status: filter,
            search,
            page,
            limit: 20,
          }),
        ]);

      setOverview(summary);
      setRecords(list.verifications);
      setTotalPages(
        list.pagination.totalPages
      );
    } catch (requestError: unknown) {
      if (
        isAuthorizationError(
          requestError
        )
      ) {
        setAccess("denied");
        setOverview(null);
        setRecords([]);
        setError("");
        return;
      }

      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }, [
    access,
    filter,
    page,
    search,
  ]);

  useEffect(() => {
    if (
      access !== "allowed"
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => void load(),
        250
      );

    return () =>
      window.clearTimeout(timer);
  }, [
    access,
    load,
  ]);

  useEffect(() => {
    if (!selected) return;

    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        setSelected(null);
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
  }, [selected, saving]);

  async function openRecord(
    record: AdminEKYCVerification
  ) {
    setSelected(record);
    setDocuments(null);
    setAudit([]);
    setReason("");
    setAction(null);
    setDetailLoading(true);
    setError("");

    try {
      const [detail, privateDocuments] =
        await Promise.all([
          getAdminEKYCDetails(record.id),
          getAdminEKYCDocuments(record.id),
        ]);

      setSelected(detail.verification);
      setAudit(detail.audit);
      setDocuments(privateDocuments);
    } catch (requestError: unknown) {
      if (
        isAuthorizationError(
          requestError
        )
      ) {
        setAccess("denied");
        setSelected(null);
        setDocuments(null);
        setAudit([]);
        setError("");
        return;
      }

      setError(messageOf(requestError));
    } finally {
      setDetailLoading(false);
    }
  }

  async function saveDecision() {
    if (!selected || !action) return;

    if (reason.trim().length < 10) {
      setError(
        "Enter a review reason with at least 10 characters."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await decideAdminEKYC(
        selected.id,
        action,
        reason
      );

      setSelected(null);
      await load();
    } catch (requestError: unknown) {
      if (
        isAuthorizationError(
          requestError
        )
      ) {
        setAccess("denied");
        setSelected(null);
        setError("");
        return;
      }

      setError(messageOf(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function rerun() {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      await rerunAdminEKYC(selected.id);
      setSelected(null);
      await load();
    } catch (requestError: unknown) {
      if (
        isAuthorizationError(
          requestError
        )
      ) {
        setAccess("denied");
        setSelected(null);
        setError("");
        return;
      }

      setError(messageOf(requestError));
    } finally {
      setSaving(false);
    }
  }

  const metrics = useMemo(
    () =>
      overview
        ? [
            {
              label: "Manual review",
              value: overview.manualReview,
              tone: "amber" as const,
              icon: ShieldAlert,
            },
            {
              label: "Processing",
              value:
                overview.processing +
                overview.queued,
              tone: "violet" as const,
              icon: RefreshCcw,
            },
            {
              label: "Verified",
              value: overview.verified,
              tone: "emerald" as const,
              icon: BadgeCheck,
            },
            {
              label: "Rejected",
              value: overview.rejected,
              tone: "rose" as const,
              icon: XCircle,
            },
          ]
        : [],
    [overview]
  );

  if (access === "checking") {
    return (
      <AccessCheckingState />
    );
  }

  if (access === "denied") {
    return (
      <AdminNotFoundState />
    );
  }

  return (
    <main className="min-h-screen px-4 py-7 text-[var(--coffer-text)] sm:px-7">
      <div className="mx-auto max-w-[1500px]">
        {/* ===================================================
            HERO
        ==================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative isolate overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,#10091f_0%,#1d1239_48%,#4b2a84_100%)] p-6 text-white shadow-[0_28px_80px_rgba(42,24,84,0.30)] sm:p-8"
        >
          <motion.div
            animate={{
              x: [0, 32, -12, 0],
              y: [0, -18, 12, 0],
              scale: [1, 1.12, 0.96, 1],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl"
          />

          <motion.div
            animate={{
              x: [0, -24, 15, 0],
              y: [0, 16, -8, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-fuchsia-500/12 blur-3xl"
          />

          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:23px_23px]" />

          {/* Always-on aurora ribbons */}
          <motion.div
            aria-hidden
            animate={{
              rotate: [0, 5, -3, 0],
              scale: [1, 1.08, 0.98, 1],
              x: ["-6%", "3%", "-2%", "-6%"],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -left-[12%] top-[8%] h-[52%] w-[76%] rounded-[50%] bg-[linear-gradient(90deg,rgba(139,92,246,.00),rgba(167,139,250,.16),rgba(217,70,239,.09),rgba(139,92,246,.00))] blur-[54px]"
          />

          <motion.div
            aria-hidden
            animate={{
              rotate: [0, -6, 4, 0],
              scale: [1, 0.96, 1.1, 1],
              x: ["4%", "-5%", "2%", "4%"],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-[10%] bottom-[4%] h-[48%] w-[68%] rounded-[50%] bg-[linear-gradient(90deg,rgba(76,29,149,.00),rgba(99,102,241,.10),rgba(168,85,247,.15),rgba(76,29,149,.00))] blur-[60px]"
          />

          {/* Continuous fine particles */}
          {HERO_PARTICLES.map((particle, index) => (
            <motion.span
              key={`${particle.left}-${particle.top}-${index}`}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-violet-100 shadow-[0_0_12px_rgba(221,214,254,.75)]"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [0, -14, 4, 0],
                x: [0, 7, -4, 0],
                opacity: [0.18, 0.8, 0.32, 0.18],
                scale: [0.8, 1.25, 0.95, 0.8],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Slow concentric radar rings */}
          <motion.div
            aria-hidden
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute -right-20 bottom-[-92px] h-72 w-72 rounded-full border border-violet-200/10"
          >
            <div className="absolute inset-7 rounded-full border border-dashed border-fuchsia-200/10" />
            <div className="absolute inset-16 rounded-full border border-violet-200/10" />
            <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-100 shadow-[0_0_14px_rgba(221,214,254,.9)]" />
          </motion.div>

          {/* Repeating top light sweep */}
          <motion.div
            animate={{
              x: ["-30%", "130%"],
            }}
            transition={{
              duration: 5.8,
              repeat: Infinity,
              repeatDelay: 2.8,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-violet-200 to-transparent shadow-[0_0_18px_rgba(221,214,254,0.9)]"
          />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-violet-100 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Compliance command center
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-amber-200">
                  <UserRoundCheck className="h-3.5 w-3.5" />
                  Human approval required
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
                Advanced e-KYC review
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-violet-100/75">
                Review identity documents, biometric signals,
                liveness evidence and audit activity before
                recording a final administrator decision.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-violet-100/80">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  Document evidence
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Biometric signals
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  Audit trail
                </span>
              </div>
            </div>

            <div className="relative flex shrink-0 flex-col items-stretch gap-3 lg:min-w-[250px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative hidden overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.075] p-4 shadow-[0_18px_50px_rgba(0,0,0,.18)] backdrop-blur-xl lg:block"
              >
                <motion.div
                  animate={{
                    opacity: [0.25, 0.7, 0.25],
                    scale: [0.9, 1.12, 0.9],
                  }}
                  transition={{
                    duration: 3.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-300/20 blur-2xl"
                />

                <div className="relative flex items-center gap-3">
                  <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-white/12 bg-white/[0.08]">
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-[-6px] rounded-[24px] border border-dashed border-violet-200/25"
                    />

                    <motion.div
                      animate={{
                        scale: [1, 1.08, 1],
                        filter: [
                          "drop-shadow(0 0 0 rgba(196,181,253,0))",
                          "drop-shadow(0 0 10px rgba(196,181,253,.8))",
                          "drop-shadow(0 0 0 rgba(196,181,253,0))",
                        ],
                      }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ShieldCheck className="h-7 w-7 text-violet-100" />
                    </motion.div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-200/70">
                      Review security core
                    </p>
                    <p className="mt-1 text-sm font-black text-white">
                      Evidence-first workflow
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-violet-100/55">
                      Documents · biometrics · audit
                    </p>
                  </div>
                </div>

                <div className="relative mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["Docs", FileCheck2],
                    ["Face", UserRoundCheck],
                    ["Audit", Clock3],
                  ].map(([label, Icon], index) => {
                    const IconComponent = Icon as LucideIcon;
                    return (
                      <motion.div
                        key={String(label)}
                        animate={{
                          y: [0, -2, 0],
                          opacity: [0.72, 1, 0.72],
                        }}
                        transition={{
                          duration: 2.6 + index * 0.35,
                          repeat: Infinity,
                          delay: index * 0.25,
                          ease: "easeInOut",
                        }}
                        className="rounded-xl border border-white/10 bg-white/[0.055] px-2 py-2 text-center"
                      >
                        <IconComponent className="mx-auto h-3.5 w-3.5 text-violet-200" />
                        <p className="mt-1 text-[8px] font-black uppercase tracking-wide text-violet-100/65">
                          {String(label)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-violet-200/20 lg:block"
              >
                <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-200 shadow-[0_0_12px_rgba(221,214,254,0.9)]" />
              </motion.div>

              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#261447] shadow-[0_12px_30px_rgba(0,0,0,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />

                {loading
                  ? "Refreshing"
                  : "Refresh queue"}
              </button>
            </div>
          </div>

          {loading && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: 1.15,
                repeat: Infinity,
              }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-violet-200 to-transparent"
            />
          )}
        </motion.header>

        {/* ERROR */}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3 text-rose-700 dark:text-rose-300"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500/10">
                <AlertTriangle className="h-4 w-4" />
              </span>

              <div>
                <p className="text-sm font-black">
                  e-KYC request failed
                </p>

                <p className="mt-1 text-xs leading-5">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METRICS */}

        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map((item) => (
            <Metric
              key={item.label}
              label={item.label}
              value={item.value}
              tone={item.tone}
              icon={item.icon}
            />
          ))}
        </motion.section>

        {/* QUEUE */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.08,
            duration: 0.45,
          }}
          className="mt-6 overflow-hidden rounded-[28px] border border-[var(--coffer-border)] bg-[var(--coffer-surface)] shadow-[var(--coffer-shadow)]"
        >
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#120b25_0%,#25164b_55%,#4b2a84_100%)] p-5 text-white">
            <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => {
                  const active =
                    filter === item.value;

                  return (
                    <motion.button
                      key={item.label}
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setFilter(item.value);
                        setPage(1);
                      }}
                      className={`rounded-full border px-4 py-2 text-xs font-black transition ${
                        active
                          ? "border-white bg-white text-[#2b1850] shadow-md"
                          : "border-white/15 bg-white/[0.07] text-violet-100 hover:bg-white/15"
                      }`}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>

              <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-2.5 shadow-inner lg:w-80">
                <Search className="h-4 w-4 shrink-0 text-violet-200" />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-violet-200/60"
                  placeholder="Search applicant name"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="rounded-lg p-1 text-violet-200 transition hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </label>
            </div>
          </div>

          <div className="ekyc-scroll-hidden overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead>
                <tr className="border-b border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] text-[10px] font-black uppercase tracking-widest text-[var(--coffer-text-muted)]">
                  <th className="px-6 py-4">
                    Applicant
                  </th>
                  <th className="px-4 py-4">
                    Status
                  </th>
                  <th className="px-4 py-4">
                    Face
                  </th>
                  <th className="px-4 py-4">
                    Liveness
                  </th>
                  <th className="px-4 py-4">
                    Phone / device
                  </th>
                  <th className="px-4 py-4">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-right">
                    Review
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-20 text-center"
                    >
                      <div className="mx-auto flex w-fit flex-col items-center">
                        <div className="relative h-14 w-14">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="absolute inset-0 rounded-full border border-dashed border-violet-500/40"
                          />

                          <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-violet-600" />
                        </div>

                        <p className="mt-3 text-xs font-bold text-[var(--coffer-text-muted)]">
                          Loading review queue...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-20 text-center"
                    >
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--coffer-primary-soft)] text-[var(--coffer-primary)]">
                          <Search className="h-5 w-5" />
                        </div>

                        <p className="mt-3 text-sm font-black text-[var(--coffer-text)]">
                          No matching e-KYC cases
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[var(--coffer-text-muted)]">
                          Try another filter or applicant search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map(
                    (record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: Math.min(
                            index * 0.02,
                            0.16
                          ),
                        }}
                        className="group border-b border-[var(--coffer-border)] text-sm transition hover:bg-[var(--coffer-primary-soft)]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                              <UserRoundCheck className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-black text-[var(--coffer-text)]">
                                {record.user.name}
                              </p>

                              <p className="mt-1 truncate text-xs text-[var(--coffer-text-muted)]">
                                {record.user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${statusStyle(
                              record.status
                            )}`}
                          >
                            {readable(record.status)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-black text-[var(--coffer-text-soft)]">
                            {record.faceScore === null
                              ? "—"
                              : `${Math.round(
                                  record.faceScore
                                )}%`}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {record.livenessPassed === true ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Passed
                            </span>
                          ) : record.livenessPassed === false ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-300">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Flagged
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-[var(--coffer-text-soft)]">
                            {record.phoneVerifiedAt
                              ? "Phone verified"
                              : "Phone unavailable"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--coffer-text-muted)]">
                            {record.deviceBiometricVerified
                              ? "WebAuthn verified"
                              : "Biometric skipped"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-xs text-[var(--coffer-text-muted)]">
                          {formatDateTime(
                            record.submittedAt
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              void openRecord(record)
                            }
                            className="rounded-xl bg-[#6d3fc0] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#5a31a5] hover:shadow-md"
                          >
                            <Eye className="mr-2 inline h-4 w-4" />
                            Open
                          </motion.button>
                        </td>
                      </motion.tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--coffer-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[var(--coffer-text-muted)]">
              Page{" "}
              <span className="font-black text-[var(--coffer-text)]">
                {page}
              </span>{" "}
              of{" "}
              <span className="font-black text-[var(--coffer-text)]">
                {totalPages}
              </span>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (value) => value - 1
                  )
                }
                className="rounded-xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] p-2.5 text-[var(--coffer-text-soft)] transition hover:-translate-y-0.5 hover:border-violet-500/30 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (value) => value + 1
                  )
                }
                className="rounded-xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] p-2.5 text-[var(--coffer-text-soft)] transition hover:-translate-y-0.5 hover:border-violet-500/30 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>
      </div>

      {/* =====================================================
          REVIEW DRAWER
      ====================================================== */}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving
              ) {
                setSelected(null);
              }
            }}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 30,
              }}
              className="ekyc-scroll-hidden absolute inset-y-0 right-0 w-full max-w-3xl overflow-y-auto bg-[var(--coffer-surface)] text-[var(--coffer-text)] shadow-[-24px_0_80px_rgba(15,23,42,0.30)]"
            >
              <div className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#10091f_0%,#25164b_58%,#4b2a84_100%)] p-5 text-white shadow-lg">
                <motion.div
                  animate={{
                    x: [0, 18, -8, 0],
                    y: [0, -8, 7, 0],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl"
                />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-violet-200">
                      Manual review
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black text-white">
                      {selected.user.name}
                    </h2>

                    <p className="mt-1 truncate text-[10px] text-violet-100/60">
                      {selected.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      !saving &&
                      setSelected(null)
                    }
                    className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:rotate-3 hover:bg-white/20 disabled:opacity-40"
                    aria-label="Close review"
                    disabled={saving}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {detailLoading ? (
                <div className="grid min-h-[70vh] place-items-center">
                  <div className="text-center">
                    <div className="relative mx-auto h-16 w-16">
                      <motion.div
                        animate={{
                          rotate: 360,
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0 rounded-full border border-dashed border-violet-500/40"
                      />

                      <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-violet-600" />
                    </div>

                    <p className="mt-3 text-xs font-bold text-[var(--coffer-text-muted)]">
                      Loading private evidence...
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-6 p-5 sm:p-7"
                >
                  <motion.div
                    variants={reveal}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide ${statusStyle(
                        selected.status
                      )}`}
                    >
                      {readable(selected.status)}
                    </span>

                    <span className="rounded-full border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] px-4 py-2 text-xs font-bold text-[var(--coffer-text-soft)]">
                      Case {selected.id}
                    </span>
                  </motion.div>

                  {selected.identity && (
                    <SectionCard
                      title="Submitted identity"
                      description="Identity fields supplied by the applicant."
                      icon={UserRoundCheck}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          [
                            "NID full name",
                            selected.identity.claimedName,
                          ],
                          [
                            "NID number",
                            selected.identity.nid,
                          ],
                          [
                            "Date of birth",
                            selected.identity.dateOfBirth,
                          ],
                          [
                            "Verified phone",
                            selected.identity.verifiedPhone,
                          ],
                        ].map(([label, value]) => (
                          <motion.div
                            key={label}
                            whileHover={{ y: -2 }}
                            className="rounded-2xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] p-4"
                          >
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--coffer-text-muted)]">
                              {label}
                            </p>

                            <p className="mt-2 break-words text-sm font-black text-[var(--coffer-text)]">
                              {value ||
                                "Not available"}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  <SectionCard
                    title="Evidence signals"
                    description="Automated checks are review evidence, not the final approval decision."
                    icon={ShieldCheck}
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Score
                        label="Face match"
                        value={selected.faceScore}
                        icon={UserRoundCheck}
                      />

                      <Score
                        label="Face quality"
                        value={selected.faceQualityScore}
                        icon={Eye}
                      />

                      <Score
                        label="Name match"
                        value={selected.nameScore}
                        icon={FileCheck2}
                      />
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] p-4"
                      >
                        <UserRoundCheck
                          className={`h-5 w-5 ${
                            selected.livenessPassed
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        />

                        <p className="mt-3 text-sm font-black">
                          Liveness{" "}
                          {selected.livenessPassed
                            ? "passed"
                            : "needs review"}
                        </p>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] p-4"
                      >
                        <Phone className="h-5 w-5 text-violet-600 dark:text-violet-300" />

                        <p className="mt-3 text-sm font-black">
                          Phone{" "}
                          {selected.phoneVerifiedAt
                            ? "verified"
                            : "not recorded"}
                        </p>
                      </motion.div>

                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] p-4"
                      >
                        <Fingerprint className="h-5 w-5 text-violet-600 dark:text-violet-300" />

                        <p className="mt-3 text-sm font-black">
                          {selected.deviceBiometricVerified
                            ? "WebAuthn verified"
                            : "Biometric optional / skipped"}
                        </p>
                      </motion.div>
                    </div>

                    {selected.reasonCodes.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                          Review reason codes
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.reasonCodes.map(
                            (code) => (
                              <span
                                key={code}
                                className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black text-amber-800 dark:text-amber-300"
                              >
                                {readable(code)}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Private documents"
                    description="Short-lived signed URLs for manual identity evidence review."
                    icon={ImageIcon}
                  >
                    {documents ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          [
                            "NID front",
                            documents.nidFrontUrl,
                          ],
                          [
                            "NID back",
                            documents.nidBackUrl,
                          ],
                          [
                            "Selfie",
                            documents.selfieUrl,
                          ],
                        ].map(([label, url]) => (
                          <motion.a
                            key={label}
                            whileHover={{ y: -3 }}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group overflow-hidden rounded-[20px] border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] shadow-sm transition hover:border-violet-500/30 hover:shadow-md"
                          >
                            <div className="relative aspect-video overflow-hidden bg-[var(--coffer-surface-muted)]">
                              <img
                                src={url}
                                alt={label}
                                className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.025]"
                              />

                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                              <span className="absolute bottom-2 right-2 rounded-xl bg-slate-950/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                                Open
                              </span>
                            </div>

                            <p className="flex items-center gap-2 p-3 text-xs font-black">
                              <ImageIcon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                              {label}
                            </p>
                          </motion.a>
                        ))}

                        {documents.livenessVideoUrl && (
                          <motion.a
                            whileHover={{ y: -3 }}
                            href={
                              documents.livenessVideoUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="relative overflow-hidden rounded-[20px] border border-[var(--coffer-border)] bg-[linear-gradient(135deg,var(--coffer-surface-muted),var(--coffer-surface))] p-5 text-sm font-black shadow-sm transition hover:border-violet-500/30 hover:shadow-md"
                          >
                            <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />

                            <Video className="relative mb-3 h-6 w-6 text-violet-600 dark:text-violet-300" />

                            <span className="relative">
                              Open liveness recording
                            </span>

                            <p className="relative mt-1 text-[10px] font-medium text-[var(--coffer-text-muted)]">
                              Review recorded active-liveness evidence
                            </p>
                          </motion.a>
                        )}
                      </div>
                    ) : (
                      <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-[var(--coffer-border)]">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-7 w-7 text-[var(--coffer-text-muted)]" />

                          <p className="mt-2 text-sm font-bold text-[var(--coffer-text-muted)]">
                            Documents unavailable.
                          </p>
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Audit trail"
                    description="Chronological case activity recorded by the e-KYC system."
                    icon={Clock3}
                  >
                    {audit.length > 0 ? (
                      <div className="relative space-y-3 pl-7">
                        <div className="absolute bottom-2 left-[9px] top-2 w-px bg-[var(--coffer-border)]" />

                        {audit.map((item, index) => (
                          <motion.div
                            key={item._id}
                            initial={{
                              opacity: 0,
                              x: 8,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              delay: Math.min(
                                index * 0.03,
                                0.18
                              ),
                            }}
                            className="relative rounded-2xl border border-[var(--coffer-border)] bg-[var(--coffer-surface-muted)] px-4 py-3 text-xs"
                          >
                            <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-[var(--coffer-surface)] bg-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,.10)]" />

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-black text-[var(--coffer-text)]">
                                {readable(
                                  item.eventType
                                )}
                              </span>

                              <span className="text-[var(--coffer-text-muted)]">
                                {formatDateTime(
                                  item.createdAt
                                )}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--coffer-text-muted)]">
                        No audit events are available for this case.
                      </p>
                    )}
                  </SectionCard>

                  {selected.status ===
                    "PENDING_MANUAL_REVIEW" && (
                    <motion.section
                      variants={reveal}
                      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#10091f_0%,#25164b_55%,#4b2a84_100%)] p-5 text-white shadow-[0_18px_48px_rgba(45,26,88,.24)]"
                    >
                      <motion.div
                        animate={{
                          x: [0, 18, -8, 0],
                          y: [0, -10, 8, 0],
                        }}
                        transition={{
                          duration: 12,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl"
                      />

                      <div className="relative">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10">
                            <ShieldCheck className="h-5 w-5 text-violet-100" />
                          </div>

                          <div>
                            <h3 className="font-black text-white">
                              Record manual decision
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-violet-100/75">
                              Review both NID images, selfie, liveness video,
                              automated signals, and audit events before deciding.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <motion.button
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() =>
                              setAction("VERIFIED")
                            }
                            className={`relative rounded-2xl border p-4 text-left transition ${
                              action === "VERIFIED"
                                ? "border-emerald-300 bg-emerald-300/20 text-white shadow-[0_12px_30px_rgba(16,185,129,.14)]"
                                : "border-white/15 bg-white/[0.08] text-white hover:bg-white/15"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CheckCircle2 className="h-5 w-5 text-emerald-300" />

                                <b className="mt-2 block">
                                  Approve
                                </b>

                                <p className="mt-1 text-[10px] font-medium text-white/60">
                                  Mark identity as verified
                                </p>
                              </div>

                              {action === "VERIFIED" && (
                                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400 text-slate-950">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                          </motion.button>

                          <motion.button
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() =>
                              setAction("REJECTED")
                            }
                            className={`relative rounded-2xl border p-4 text-left transition ${
                              action === "REJECTED"
                                ? "border-rose-300 bg-rose-300/20 text-white shadow-[0_12px_30px_rgba(244,63,94,.14)]"
                                : "border-white/15 bg-white/[0.08] text-white hover:bg-white/15"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <XCircle className="h-5 w-5 text-rose-300" />

                                <b className="mt-2 block">
                                  Reject
                                </b>

                                <p className="mt-1 text-[10px] font-medium text-white/60">
                                  Reject with review reason
                                </p>
                              </div>

                              {action === "REJECTED" && (
                                <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-400 text-white">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                          </motion.button>
                        </div>

                        <div className="relative mt-3">
                          <textarea
                            value={reason}
                            onChange={(event) =>
                              setReason(
                                event.target.value
                              )
                            }
                            className="min-h-28 w-full rounded-2xl border border-white/15 bg-white/[0.09] p-4 pb-8 text-sm text-white outline-none transition placeholder:text-violet-200/55 focus:border-violet-300 focus:ring-4 focus:ring-violet-300/10"
                            placeholder="Required review reason (minimum 10 characters)"
                          />

                          <span
                            className={`absolute bottom-3 right-3 text-[9px] font-black ${
                              reason.trim().length >= 10
                                ? "text-emerald-300"
                                : "text-violet-200/55"
                            }`}
                          >
                            {reason.trim().length}
                            /10+
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              void rerun()
                            }
                            className="relative rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20 disabled:opacity-50"
                          >
                            <RefreshCcw
                              className={`mr-2 inline h-4 w-4 ${
                                saving
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />

                            Re-run checks
                          </button>

                          <button
                            type="button"
                            disabled={
                              saving ||
                              !action ||
                              reason.trim().length < 10
                            }
                            onClick={() =>
                              void saveDecision()
                            }
                            className="relative rounded-xl bg-white px-5 py-2.5 text-xs font-black text-[#2b1850] shadow-md transition hover:-translate-y-0.5 hover:bg-violet-50 disabled:opacity-40"
                          >
                            {saving && (
                              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                            )}

                            Save admin decision
                          </button>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </motion.div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .ekyc-scroll-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .ekyc-scroll-hidden::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .ekyc-scroll-hidden::-webkit-scrollbar-thumb,
        .ekyc-scroll-hidden::-webkit-scrollbar-track {
          background: transparent;
        }

        .ekyc-scroll-hidden {
          overscroll-behavior: contain;
        }

        ::selection {
          background: rgba(139, 92, 246, 0.24);
        }
      `}</style>
    </main>
  );
}
