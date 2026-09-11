"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

type PaymentMode = "test" | "live";

type SourceType =
  | "paypal"
  | "card"
  | "local_psp"
  | "wallet";

interface MerchantPayment {
  paymentId: string;
  merchantId: string;
  customerId?: string | null;
  orderId?: string | null;
  amount: string | number;
  currency: string;
  feeAmount?: string | number | null;
  netAmount?: string | number | null;
  sourceType: SourceType | string;
  provider: string;
  mode: PaymentMode;
  status: PaymentStatus;
  providerPaymentId?: string | null;
  merchantReference?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  returnUrl?: string | null;
  cancelUrl?: string | null;
  checkoutUrl?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  expiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaymentsResponse {
  success?: boolean;
  message?: string;

  data?: {
    payments: MerchantPayment[];
    pagination: Pagination;
    filters?: Record<string, unknown>;
  };

  payments?: MerchantPayment[];
  pagination?: Pagination;
}

interface FiltersState {
  search: string;
  status: string;
  mode: string;
  provider: string;
  sourceType: string;
  from: string;
  to: string;
}

const STATUS_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "captured", label: "Captured" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const MODE_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "", label: "All modes" },
  { value: "test", label: "Test mode" },
  { value: "live", label: "Live mode" },
];

const SOURCE_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "", label: "All methods" },
  { value: "wallet", label: "Wallet" },
  { value: "card", label: "Card" },
  { value: "paypal", label: "PayPal" },
  { value: "local_psp", label: "Local PSP" },
];

const PROVIDER_OPTIONS = [
  { value: "", label: "All providers" },
  { value: "damo_wallet", label: "DAMO Wallet" },
  { value: "paypal", label: "PayPal" },
  { value: "card", label: "Card" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "upay", label: "Upay" },
];

const DEFAULT_LIMIT = 20;

function formatMoney(
  value: string | number | null | undefined,
  currency = "BDT",
): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCompactDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function humanize(value?: string | null): string {
  if (!value) return "—";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function truncate(value?: string | null, length = 18): string {
  if (!value) return "—";
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}

function getStatusMeta(status: PaymentStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className: "merchant-status-success",
      };

    case "failed":
      return {
        label: "Failed",
        icon: XCircle,
        className: "merchant-status-danger",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        className: "merchant-status-danger",
      };

    case "expired":
      return {
        label: "Expired",
        icon: Clock3,
        className: "merchant-status-warning",
      };

    case "authorized":
      return {
        label: "Authorized",
        icon: CheckCircle2,
        className: "merchant-status-info",
      };

    case "captured":
      return {
        label: "Captured",
        icon: CreditCard,
        className: "merchant-status-info",
      };

    case "pending":
    default:
      return {
        label: "Pending",
        icon: Clock3,
        className: "merchant-status-warning",
      };
  }
}

function getModeMeta(mode: PaymentMode) {
  if (mode === "live") {
    return {
      label: "Live",
      className: "merchant-mode-live",
    };
  }

  return {
    label: "Test",
    className: "merchant-mode-test",
  };
}

function getMethodMeta(sourceType?: string) {
  switch (sourceType) {
    case "wallet":
      return {
        icon: Zap,
        label: "Wallet",
      };

    case "card":
      return {
        icon: CreditCard,
        label: "Card",
      };

    case "paypal":
      return {
        icon: CreditCard,
        label: "PayPal",
      };

    case "local_psp":
      return {
        icon: CreditCard,
        label: "Local PSP",
      };

    default:
      return {
        icon: CreditCard,
        label: humanize(sourceType),
      };
  }
}

function getInitialFilters(): FiltersState {
  return {
    search: "",
    status: "",
    mode: "",
    provider: "",
    sourceType: "",
    from: "",
    to: "",
  };
}

function buildQueryString(
  filters: FiltersState,
  page: number,
  limit: number,
): string {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.mode) {
    params.set("mode", filters.mode);
  }

  if (filters.provider) {
    params.set("provider", filters.provider);
  }

  if (filters.sourceType) {
    params.set("sourceType", filters.sourceType);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  return params.toString();
}

function extractResponse(
  response: PaymentsResponse | unknown,
): {
  payments: MerchantPayment[];
  pagination: Pagination;
} {
  const result = response as PaymentsResponse;

  const nested = result?.data;

  const payments =
    nested?.payments ??
    result?.payments ??
    [];

  const pagination =
    nested?.pagination ??
    result?.pagination ??
    ({
      page: 1,
      limit: DEFAULT_LIMIT,
      total: payments.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    } satisfies Pagination);

  return {
    payments: Array.isArray(payments) ? payments : [],
    pagination,
  };
}

function LoadingRows() {
  return (
    <div className="divide-y merchant-border">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.3fr_1.2fr_1fr_0.9fr_0.9fr_1fr_0.9fr_0.75fr_0.9fr_auto] gap-4 px-5 py-4"
        >
          {Array.from({ length: 10 }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className="h-4 animate-pulse rounded-md merchant-skeleton"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl merchant-primary-soft">
        <CreditCard className="h-8 w-8 merchant-primary" />
      </div>

      <h3 className="text-lg font-semibold merchant-text">
        {hasFilters ? "No matching payments" : "No payments yet"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 merchant-muted">
        {hasFilters
          ? "Try changing your search or filters to find the payment you're looking for."
          : "Payments created for your merchant account will appear here."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium merchant-border merchant-surface merchant-text transition hover:merchant-primary-soft"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function MerchantPaymentsPage() {
  const [payments, setPayments] = useState<MerchantPayment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filters, setFilters] = useState<FiltersState>(
    getInitialFilters(),
  );

  const [appliedFilters, setAppliedFilters] =
    useState<FiltersState>(getInitialFilters());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(
    async (
      page = 1,
      nextAppliedFilters = appliedFilters,
      options?: {
        silent?: boolean;
      },
    ) => {
      const isSilent = options?.silent === true;

      try {
        setError("");

        if (isSilent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const query = buildQueryString(
          nextAppliedFilters,
          page,
          DEFAULT_LIMIT,
        );

        const response = await apiClient<PaymentsResponse>(
  `/merchants/payments?${query}`,
  {
    method: "GET",
  },
);

        const { payments: nextPayments, pagination: nextPagination } =
          extractResponse(response);

        setPayments(nextPayments);
        setPagination(nextPagination);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load merchant payments.";

        setError(message);
        setPayments([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    void fetchPayments(1, appliedFilters);
  }, [fetchPayments, appliedFilters]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(appliedFilters).some(
      (value) => value.trim() !== "",
    );
  }, [appliedFilters]);

  const visibleRange = useMemo(() => {
    if (pagination.total === 0) {
      return "0 results";
    }

    const start =
      (pagination.page - 1) * pagination.limit + 1;

    const end = Math.min(
      pagination.page * pagination.limit,
      pagination.total,
    );

    return `${start.toLocaleString()}–${end.toLocaleString()} of ${pagination.total.toLocaleString()}`;
  }, [pagination]);

  const handleFilterChange = (
    key: keyof FiltersState,
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters({
      ...filters,
    });
  };

  const clearFilters = () => {
    const cleared = getInitialFilters();

    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) {
      return;
    }

    void fetchPayments(page);
  };

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages;

    if (totalPages <= 1) {
      return [1];
    }

    const pages: number[] = [];
    const current = pagination.page;

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (!pages.includes(1)) {
      pages.unshift(1);
    }

    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  }, [pagination]);

  return (
    <div className="merchant-theme min-h-full">
      <div className="min-h-full bg-[var(--merchant-background)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1800px]">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold merchant-border merchant-primary-soft merchant-primary">
                <CreditCard className="h-3.5 w-3.5" />
                Merchant Payments
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl merchant-text">
                Payment transactions
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 merchant-muted">
                Review, search, filter and inspect every payment created
                for your merchant account.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void fetchPayments(pagination.page, appliedFilters, {
                  silent: true,
                })
              }
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold merchant-border merchant-surface merchant-text shadow-sm transition hover:merchant-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Search + Filters */}
          <div className="mb-6 rounded-2xl border merchant-border merchant-surface merchant-shadow">
            <div className="border-b px-5 py-4 merchant-border">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 merchant-primary" />

                  <span className="text-sm font-semibold merchant-text">
                    Search & filters
                  </span>
                </div>

                <span className="text-xs merchant-muted">
                  {visibleRange}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="grid gap-4 xl:grid-cols-[2fr_1fr_1fr_1fr]">
                {/* Search */}
                <div>
                  <label
                    htmlFor="payment-search"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide merchant-muted"
                  >
                    Search
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />

                    <input
                      id="payment-search"
                      type="text"
                      value={filters.search}
                      onChange={(event) =>
                        handleFilterChange(
                          "search",
                          event.target.value,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          applyFilters();
                        }
                      }}
                      placeholder="Payment ID, merchant reference..."
                      className="h-11 w-full rounded-xl border pl-10 pr-10 text-sm outline-none merchant-border merchant-surface merchant-text placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--merchant-primary)]/20"
                    />

                    {filters.search && (
                      <button
                        type="button"
                        onClick={() =>
                          handleFilterChange("search", "")
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 merchant-muted hover:merchant-text"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="payment-status"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide merchant-muted"
                  >
                    Status
                  </label>

                  <div className="relative">
                    <select
                      id="payment-status"
                      value={filters.status}
                      onChange={(event) =>
                        handleFilterChange(
                          "status",
                          event.target.value,
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border px-3.5 pr-10 text-sm outline-none merchant-border merchant-surface merchant-text focus:ring-2 focus:ring-[var(--merchant-primary)]/20"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />
                  </div>
                </div>

                {/* Mode */}
                <div>
                  <label
                    htmlFor="payment-mode"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide merchant-muted"
                  >
                    Environment
                  </label>

                  <div className="relative">
                    <select
                      id="payment-mode"
                      value={filters.mode}
                      onChange={(event) =>
                        handleFilterChange(
                          "mode",
                          event.target.value,
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border px-3.5 pr-10 text-sm outline-none merchant-border merchant-surface merchant-text focus:ring-2 focus:ring-[var(--merchant-primary)]/20"
                    >
                      {MODE_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label
                    htmlFor="payment-source"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide merchant-muted"
                  >
                    Payment method
                  </label>

                  <div className="relative">
                    <select
                      id="payment-source"
                      value={filters.sourceType}
                      onChange={(event) =>
                        handleFilterChange(
                          "sourceType",
                          event.target.value,
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border px-3.5 pr-10 text-sm outline-none merchant-border merchant-surface merchant-text focus:ring-2 focus:ring-[var(--merchant-primary)]/20"
                    >
                      {SOURCE_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
                {/* Provider */}
                <div>
                  <label
                    htmlFor="payment-provider"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide merchant-muted"
                  >
                    Provider
                  </label>

                  <div className="relative">
                    <select
                      id="payment-provider"
                      value={filters.provider}
                      onChange={(event) =>
                        handleFilterChange(
                          "provider",
                          event.target.value,
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border px-3.5 pr-10 text-sm outline-none merchant-border merchant-surface merchant-text focus:ring-2 focus:ring-[var(--merchant-primary)]/20"
                    >
                      {PROVIDER_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />
                  </div>
                </div>

                {/* From */}
                <div>
                  <label
                    htmlFor="payment-from"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide merchant-muted"
                  >
                    From date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />

                    <input
                      id="payment-from"
                      type="date"
                      value={filters.from}
                      onChange={(event) =>
                        handleFilterChange(
                          "from",
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none merchant-border merchant-surface merchant-text focus:ring-2 focus:ring-[var(--merchant-primary)]/20"
                    />
                  </div>
                </div>

                {/* To */}
                <div>
                  <label
                    htmlFor="payment-to"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide merchant-muted"
                  >
                    To date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />

                    <input
                      id="payment-to"
                      type="date"
                      value={filters.to}
                      min={filters.from || undefined}
                      onChange={(event) =>
                        handleFilterChange(
                          "to",
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none merchant-border merchant-surface merchant-text focus:ring-2 focus:ring-[var(--merchant-primary)]/20"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="h-11 flex-1 rounded-xl px-4 text-sm font-semibold text-white merchant-gradient shadow-sm transition hover:opacity-95"
                  >
                    Apply filters
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-11 rounded-xl border px-3.5 merchant-border merchant-surface merchant-text transition hover:merchant-primary-soft"
                      title="Clear filters"
                      aria-label="Clear filters"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between merchant-border merchant-danger-soft">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 merchant-danger" />

                <div>
                  <p className="text-sm font-semibold merchant-text">
                    Unable to load payments
                  </p>

                  <p className="mt-1 text-sm merchant-muted">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchPayments(
                    pagination.page,
                    appliedFilters,
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold merchant-border merchant-surface merchant-text"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border merchant-border merchant-surface merchant-shadow">
            <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between merchant-border">
              <div>
                <h2 className="text-base font-semibold merchant-text">
                  All payments
                </h2>

                <p className="mt-1 text-xs merchant-muted">
                  {loading
                    ? "Loading payment records..."
                    : `${pagination.total.toLocaleString()} payment records`}
                </p>
              </div>

              {hasActiveFilters && (
                <div className="inline-flex items-center gap-2 text-xs font-medium merchant-primary">
                  <Filter className="h-3.5 w-3.5" />
                  Filters applied
                </div>
              )}
            </div>

            {loading ? (
              <div className="hidden overflow-x-auto xl:block">
                <LoadingRows />
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                hasFilters={hasActiveFilters}
                onClear={clearFilters}
              />
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden overflow-x-auto xl:block">
                  <table className="min-w-[1500px] w-full">
                    <thead>
                      <tr className="border-b text-left merchant-border merchant-surface-soft">
                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Payment
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Customer
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Amount
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Fee
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Net
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Method
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Status
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Mode
                        </th>

                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          Date
                        </th>

                        <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider merchant-muted">
                          View
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y merchant-border">
                      {payments.map((payment) => {
                        const statusMeta = getStatusMeta(
                          payment.status,
                        );
                        const modeMeta = getModeMeta(payment.mode);
                        const methodMeta = getMethodMeta(
                          payment.sourceType,
                        );

                        const StatusIcon = statusMeta.icon;
                        const MethodIcon = methodMeta.icon;

                        return (
                          <tr
                            key={payment.paymentId}
                            className="group transition hover:merchant-surface-soft"
                          >
                            <td className="px-5 py-4">
                              <div className="min-w-[200px]">
                                <Link
                                  href={`/dashboard/merchant/payments/${encodeURIComponent(
                                    payment.paymentId,
                                  )}`}
                                  className="font-mono text-sm font-semibold merchant-primary hover:underline"
                                >
                                  {truncate(payment.paymentId, 24)}
                                </Link>

                                <p className="mt-1 text-xs merchant-muted">
                                  {payment.merchantReference
                                    ? truncate(
                                        payment.merchantReference,
                                        28,
                                      )
                                    : "No merchant reference"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="min-w-[170px]">
                                <p className="font-mono text-xs font-medium merchant-text">
                                  {truncate(
                                    payment.customerId,
                                    24,
                                  )}
                                </p>

                                {payment.orderId && (
                                  <p className="mt-1 text-xs merchant-muted">
                                    Order:{" "}
                                    {truncate(payment.orderId, 18)}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap text-sm font-bold merchant-text">
                                {formatMoney(
                                  payment.amount,
                                  payment.currency,
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap text-sm merchant-muted">
                                {formatMoney(
                                  payment.feeAmount,
                                  payment.currency,
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="whitespace-nowrap text-sm font-semibold merchant-text">
                                {formatMoney(
                                  payment.netAmount,
                                  payment.currency,
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex min-w-[170px] items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl merchant-primary-soft">
                                  <MethodIcon className="h-4 w-4 merchant-primary" />
                                </div>

                                <div>
                                  <p className="text-sm font-medium merchant-text">
                                    {methodMeta.label}
                                  </p>

                                  <p className="mt-0.5 text-xs merchant-muted">
                                    {humanize(payment.provider)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-semibold ${statusMeta.className}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusMeta.label}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-semibold ${modeMeta.className}`}
                              >
                                {modeMeta.label}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="min-w-[130px]">
                                <p className="text-sm font-medium merchant-text">
                                  {formatCompactDate(
                                    payment.createdAt,
                                  )}
                                </p>

                                <p className="mt-1 text-xs merchant-muted">
                                  {new Date(
                                    payment.createdAt,
                                  ).toLocaleTimeString("en-BD", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/dashboard/merchant/payments/${encodeURIComponent(
                                  payment.paymentId,
                                )}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border merchant-border merchant-surface merchant-text transition hover:merchant-primary-soft hover:merchant-primary"
                                title="View payment"
                                aria-label={`View ${payment.paymentId}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Cards */}
                <div className="divide-y xl:hidden merchant-border">
                  {payments.map((payment) => {
                    const statusMeta = getStatusMeta(
                      payment.status,
                    );
                    const modeMeta = getModeMeta(payment.mode);
                    const methodMeta = getMethodMeta(
                      payment.sourceType,
                    );

                    const StatusIcon = statusMeta.icon;
                    const MethodIcon = methodMeta.icon;

                    return (
                      <Link
                        key={payment.paymentId}
                        href={`/dashboard/merchant/payments/${encodeURIComponent(
                          payment.paymentId,
                        )}`}
                        className="block p-4 transition hover:merchant-surface-soft sm:p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-semibold merchant-primary">
                              {truncate(payment.paymentId, 28)}
                            </p>

                            <p className="mt-1 text-xs merchant-muted">
                              {formatDate(payment.createdAt)}
                            </p>
                          </div>

                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${statusMeta.className}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusMeta.label}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide merchant-muted">
                              Amount
                            </p>

                            <p className="mt-1 text-sm font-bold merchant-text">
                              {formatMoney(
                                payment.amount,
                                payment.currency,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide merchant-muted">
                              Net
                            </p>

                            <p className="mt-1 text-sm font-semibold merchant-text">
                              {formatMoney(
                                payment.netAmount,
                                payment.currency,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide merchant-muted">
                              Method
                            </p>

                            <div className="mt-1 flex items-center gap-1.5">
                              <MethodIcon className="h-3.5 w-3.5 merchant-primary" />

                              <span className="text-sm font-medium merchant-text">
                                {methodMeta.label}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide merchant-muted">
                              Mode
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${modeMeta.className}`}
                            >
                              {modeMeta.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4 border-t pt-3 merchant-border">
                          <div className="min-w-0">
                            <p className="text-xs merchant-muted">
                              Provider
                            </p>

                            <p className="truncate text-sm font-medium merchant-text">
                              {humanize(payment.provider)}
                            </p>
                          </div>

                          <div className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold merchant-primary">
                            View details
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {!loading &&
              payments.length > 0 &&
              pagination.totalPages > 1 && (
                <div className="flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between merchant-border">
                  <p className="text-xs merchant-muted">
                    Showing{" "}
                    <span className="font-semibold merchant-text">
                      {visibleRange}
                    </span>
                  </p>

                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        goToPage(pagination.page - 1)
                      }
                      disabled={!pagination.hasPreviousPage}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold merchant-border merchant-surface merchant-text disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {pageNumbers.map((page, index) => {
                        const previousPage =
                          pageNumbers[index - 1];

                        const showGap =
                          index > 0 &&
                          previousPage !== undefined &&
                          page - previousPage > 1;

                        return (
                          <React.Fragment key={page}>
                            {showGap && (
                              <span className="px-1 text-xs merchant-muted">
                                ...
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => goToPage(page)}
                              className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold transition ${
                                page === pagination.page
                                  ? "text-white merchant-gradient"
                                  : "border merchant-border merchant-surface merchant-text hover:merchant-primary-soft"
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        goToPage(pagination.page + 1)
                      }
                      disabled={!pagination.hasNextPage}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold merchant-border merchant-surface merchant-text disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}