"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  approveAdminMerchantVerification,
  getAdminMerchantVerification,
  listAdminMerchantVerifications,
  rejectAdminMerchantVerification,
  type AdminMerchantVerificationDetail,
  type MerchantVerificationPagination,
} from "@/lib/api/adminMerchantVerificationApi";

import type {
  MerchantVerificationStatus,
  MerchantVerificationView,
} from "@/lib/api/merchantVerificationApi";

type StatusFilter =
  | "all"
  | MerchantVerificationStatus;

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(
  value?: string
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function statusClasses(
  status: MerchantVerificationStatus
): string {
  if (status === "verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
}

function statusLabel(
  status: string
): string {
  return status
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function documentLabel(
  kind: string
): string {
  if (kind === "registration") {
    return "Registration document";
  }

  if (kind === "tax") {
    return "Tax document";
  }

  if (kind === "bank") {
    return "Bank ownership proof";
  }

  return "Business document";
}

function ReviewDrawer({
  detail,
  loading,
  acting,
  onClose,
  onApprove,
  onReject,
}: {
  detail:
    AdminMerchantVerificationDetail | null;
  loading: boolean;
  acting: boolean;
  onClose: () => void;
  onApprove: (
    internalNote: string
  ) => Promise<void>;
  onReject: (
    reason: string,
    internalNote: string
  ) => Promise<void>;
}) {
  const [reason, setReason] =
    useState("");

  const [internalNote, setInternalNote] =
    useState("");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close verification review"
        onClick={onClose}
        className="absolute inset-0"
      />

      <aside className="relative z-10 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
              Merchant KYB
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              Verification review
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : detail ? (
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white">
                    {detail.legalBusinessName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {detail.merchant.businessEmail}
                  </p>
                </div>

                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(detail.status)}`}>
                  {statusLabel(detail.status)}
                </span>
              </div>

              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Owner</dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{detail.owner.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Owner e-KYC</dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{detail.owner.kycStatus || "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Registration</dt>
                  <dd className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100">{detail.registrationNumberMasked}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Type</dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{statusLabel(detail.registrationType)}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500">Business address</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-200">{detail.businessAddress}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="flex items-center gap-2 font-extrabold text-slate-950 dark:text-white">
                <FileText className="h-4 w-4 text-violet-600" />
                Private documents
              </h3>

              <div className="mt-3 space-y-2">
                {detail.documentReadUrls.map(
                  (document) => (
                    <a
                      key={document.kind}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-800 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:text-slate-200"
                    >
                      {documentLabel(document.kind)}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )
                )}
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Document links expire automatically after five minutes.
              </p>
            </section>

            {[
              "submitted",
              "under_review",
            ].includes(detail.status) && (
              <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Internal note (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-transparent p-3 text-sm outline-none focus:border-violet-500 dark:border-slate-800"
                />

                <label className="mt-4 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rejection reason
                </label>
                <textarea
                  rows={3}
                  minLength={5}
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Required only when rejecting"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-transparent p-3 text-sm outline-none focus:border-violet-500 dark:border-slate-800"
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void onReject(reason, internalNote)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => void onApprove(internalNote)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve live access
                  </button>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </aside>
    </div>
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>

        <p className="mt-4 text-sm font-black">
          Checking access
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Verifying administrator permissions…
        </p>
      </div>
    </main>
  );
}

function AdminNotFoundState() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-violet-500/[0.08] blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-indigo-500/[0.07] blur-[100px]" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200 bg-white p-7 text-center shadow-[0_30px_90px_rgba(15,23,42,.12)] dark:border-slate-800 dark:bg-slate-900 sm:p-10">
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            Error 404
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Page not found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            The page you are looking for does not exist or is not available.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function AdminMerchantVerificationsPage() {
  const [access, setAccess] =
    useState<AccessState>(
      "checking"
    );

  const [records, setRecords] =
    useState<MerchantVerificationView[]>([]);
  const [pagination, setPagination] =
    useState<MerchantVerificationPagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  const [status, setStatus] =
    useState<StatusFilter>("submitted");
  const [search, setSearch] =
    useState("");
  const [appliedSearch, setAppliedSearch] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");
  const [selectedId, setSelectedId] =
    useState("");
  const [detail, setDetail] =
    useState<AdminMerchantVerificationDetail | null>(null);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [acting, setActing] =
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

  const loadRecords =
    useCallback(async () => {
      if (
        access !== "allowed"
      ) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await listAdminMerchantVerifications({
            status,
            search: appliedSearch,
            page: pagination.page,
            limit: pagination.limit,
          });

        setRecords(result.verifications);
        setPagination(result.pagination);
      } catch (loadError) {
        if (
          isAuthorizationError(
            loadError
          )
        ) {
          setAccess("denied");
          setRecords([]);
          setError("");
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load merchant verifications."
        );
      } finally {
        setLoading(false);
      }
    }, [
      access,
      appliedSearch,
      pagination.limit,
      pagination.page,
      status,
    ]);

  useEffect(() => {
    if (
      access !== "allowed"
    ) {
      return;
    }

    void loadRecords();
  }, [
    access,
    loadRecords,
  ]);

  const openReview = async (
    verificationId: string
  ) => {
    if (
      access !== "allowed"
    ) {
      setAccess("denied");
      return;
    }

    try {
      setSelectedId(verificationId);
      setDetail(null);
      setDetailLoading(true);
      setError("");

      setDetail(
        await getAdminMerchantVerification(
          verificationId
        )
      );
    } catch (detailError) {
      if (
        isAuthorizationError(
          detailError
        )
      ) {
        setSelectedId("");
        setDetail(null);
        setAccess("denied");
        setError("");
        return;
      }

      setSelectedId("");
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Unable to load verification details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const finishReview = async (
    action: "approve" | "reject",
    reason: string,
    internalNote: string
  ) => {
    if (
      access !== "allowed"
    ) {
      setAccess("denied");
      return;
    }

    if (!selectedId) {
      return;
    }

    if (
      action === "reject" &&
      reason.trim().length < 5
    ) {
      setError(
        "Enter a rejection reason containing at least five characters."
      );
      return;
    }

    try {
      setActing(true);
      setError("");

      const response =
        action === "approve"
          ? await approveAdminMerchantVerification(
              selectedId,
              internalNote
            )
          : await rejectAdminMerchantVerification(
              selectedId,
              reason,
              internalNote
            );

      setNotice(response.message);
      setSelectedId("");
      setDetail(null);
      await loadRecords();
    } catch (reviewError) {
      if (
        isAuthorizationError(
          reviewError
        )
      ) {
        setSelectedId("");
        setDetail(null);
        setAccess("denied");
        setError("");
        return;
      }

      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to complete verification review."
      );
    } finally {
      setActing(false);
    }
  };

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
    <main className="min-h-full bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1450px]">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950 dark:text-white">Merchant verifications</h1>
                <p className="mt-1 text-sm text-slate-500">Approve owner-linked business documents before enabling live API access.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadRecords()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {notice}
          </div>
        )}

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-slate-800 lg:grid-cols-[1fr_220px_auto]">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPagination((current) => ({ ...current, page: 1 }));
                setAppliedSearch(search.trim());
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search business name or last 4 digits"
                className="h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-10 pr-3 text-sm outline-none focus:border-violet-500 dark:border-slate-800"
              />
            </form>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPagination((current) => ({ ...current, page: 1 }));
              }}
              className="h-11 rounded-xl border border-slate-200 bg-transparent px-3 text-sm font-semibold outline-none dark:border-slate-800"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setPagination((current) => ({ ...current, page: 1 }));
                setAppliedSearch(search.trim());
              }}
              className="h-11 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white"
            >
              Apply
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">
              <ShieldCheck className="h-10 w-10 text-slate-300" />
              <h2 className="mt-3 font-extrabold text-slate-900 dark:text-white">No verifications found</h2>
              <p className="mt-1 text-sm text-slate-500">No merchant matches the selected filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {records.map((record) => (
                <article key={record.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-slate-950 dark:text-white">{record.legalBusinessName}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{record.registrationNumberMasked}</span>
                        <span>•</span>
                        <span>{formatDate(record.submittedAt)}</span>
                        <span className={`rounded-full border px-2 py-0.5 font-bold ${statusClasses(record.status)}`}>{statusLabel(record.status)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openReview(record.id)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white dark:bg-white dark:text-slate-950"
                  >
                    {record.status === "submitted" ? <Clock3 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    Review
                  </button>
                </article>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 p-4 text-xs font-semibold text-slate-500 dark:border-slate-800">
            <span>{pagination.total} total</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
                className="h-9 rounded-lg border border-slate-200 px-3 disabled:opacity-40 dark:border-slate-800"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
                className="h-9 rounded-lg border border-slate-200 px-3 disabled:opacity-40 dark:border-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {selectedId && (
        <ReviewDrawer
          detail={detail}
          loading={detailLoading}
          acting={acting}
          onClose={() => {
            if (!acting) {
              setSelectedId("");
              setDetail(null);
            }
          }}
          onApprove={(internalNote) => finishReview("approve", "", internalNote)}
          onReject={(reason, internalNote) => finishReview("reject", reason, internalNote)}
        />
      )}
    </main>
  );
}
