"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import {
  getMerchantInvoices,
  type InvoiceMode,
  type InvoiceStatus,
  type MerchantInvoice,
} from "@/lib/api/merchantInvoiceApi";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const statusOptions: Array<{
  value: InvoiceStatus | "";
  label: string;
}> = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "sent",
    label: "Sent",
  },
  {
    value: "viewed",
    label: "Viewed",
  },
  {
    value: "partially_paid",
    label: "Partially paid",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "overdue",
    label: "Overdue",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "void",
    label: "Void",
  },
];

const modeOptions: Array<{
  value: InvoiceMode | "";
  label: string;
}> = [
  {
    value: "",
    label: "All modes",
  },
  {
    value: "test",
    label: "Test",
  },
  {
    value: "live",
    label: "Live",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  value: string | number,
  currency: string
): string {
  const amount =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(amount)) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatStatus(
  status: InvoiceStatus
): string {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : "Unable to load invoices.";
}

/* =========================================================
   STATUS BADGE
========================================================= */

function InvoiceStatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  const styles:
    Record<
      InvoiceStatus,
      string
    > = {
    draft:
      "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",

    sent:
      "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",

    viewed:
      "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",

    partially_paid:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",

    paid:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",

    overdue:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",

    cancelled:
      "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",

    void:
      "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border
        px-2.5 py-1 text-[10px] font-bold
        ${styles[status]}
      `}
    >
      {formatStatus(status)}
    </span>
  );
}

/* =========================================================
   MODE BADGE
========================================================= */

function InvoiceModeBadge({
  mode,
}: {
  mode: InvoiceMode;
}) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full border
        px-2 py-1 text-[9px] font-black uppercase
        tracking-[0.12em]
        ${
          mode === "live"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            : "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300"
        }
      `}
    >
      {mode}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof FileText;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-black text-foreground">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`
            flex h-11 w-11 shrink-0 items-center
            justify-center rounded-2xl
            ${iconClassName}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function InvoiceTableLoading() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({
        length: 6,
      }).map(
        (_, index) => (
          <div
            key={index}
            className="h-[72px] animate-pulse rounded-xl bg-muted"
          />
        )
      )}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function InvoiceEmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <FileText className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-black text-foreground">
        {filtered
          ? "No matching invoices"
          : "No invoices created"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {filtered
          ? "Try changing your search, status or mode filters."
          : "Create your first invoice and send it directly to your customer."}
      </p>

      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-bold text-foreground transition hover:bg-muted"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/dashboard/merchant/invoices/create"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>
      )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantInvoicesPage() {
  const [
    invoices,
    setInvoices,
  ] = useState<
    MerchantInvoice[]
  >([]);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    status,
    setStatus,
  ] = useState<
    InvoiceStatus | ""
  >("");

  const [
    mode,
    setMode,
  ] = useState<
    InvoiceMode | ""
  >("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  /* =======================================================
     LOAD
  ======================================================= */

  const loadInvoices =
    useCallback(
      async ({
        silent = false,
      }: {
        silent?: boolean;
      } = {}) => {
        try {
          setError("");

          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await getMerchantInvoices({
              page,
              limit:
                PAGE_SIZE,
              status,
              mode,
              search:
                appliedSearch,
            });

          setInvoices(
            response.invoices
          );

          setPagination(
            response.pagination
          );
        } catch (loadError) {
          setError(
            getErrorMessage(
              loadError
            )
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        page,
        status,
        mode,
        appliedSearch,
      ]
    );

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  /* =======================================================
     FILTER HANDLERS
  ======================================================= */

  const handleSearch =
    (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setPage(1);

      setAppliedSearch(
        searchInput.trim()
      );
    };

  const clearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatus("");
    setMode("");
    setPage(1);
  };

  const filtersActive =
    Boolean(
      appliedSearch ||
        status ||
        mode
    );

  /* =======================================================
     CURRENT PAGE STATS
  ======================================================= */

  const stats =
    useMemo(() => {
      const currency =
        invoices[0]
          ?.currency ||
        "BDT";

      const visibleValue =
        invoices.reduce(
          (
            total,
            invoice
          ) =>
            total +
            Number(
              invoice.total
            ),
          0
        );

      const outstanding =
        invoices.reduce(
          (
            total,
            invoice
          ) =>
            total +
            Number(
              invoice.amountDue
            ),
          0
        );

      const paidCount =
        invoices.filter(
          (invoice) =>
            invoice.status ===
            "paid"
        ).length;

      const overdueCount =
        invoices.filter(
          (invoice) =>
            invoice.status ===
            "overdue"
        ).length;

      return {
        currency,
        visibleValue,
        outstanding,
        paidCount,
        overdueCount,
      };
    }, [invoices]);

  const totalPages =
    Math.max(
      pagination.totalPages,
      1
    );

  const startItem =
    pagination.total === 0
      ? 0
      : (
          pagination.page -
          1
        ) *
          pagination.limit +
        1;

  const endItem =
    Math.min(
      pagination.page *
        pagination.limit,
      pagination.total
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-background p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Merchant Billing
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Invoices
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create, send and monitor customer invoices from your merchant dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void loadInvoices({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <Link
              href="/dashboard/merchant/invoices/create"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Invoice
            </Link>
          </div>
        </div>

        {/* Stats */}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total invoices"
            value={String(
              pagination.total
            )}
            description="All matching invoices"
            icon={FileText}
            iconClassName="bg-primary/10 text-primary"
          />

          <StatCard
            label="Visible invoice value"
            value={formatMoney(
              stats.visibleValue,
              stats.currency
            )}
            description="Current page total"
            icon={
              CircleDollarSign
            }
            iconClassName="bg-blue-500/10 text-blue-500"
          />

          <StatCard
            label="Outstanding"
            value={formatMoney(
              stats.outstanding,
              stats.currency
            )}
            description="Due on current page"
            icon={WalletCards}
            iconClassName="bg-amber-500/10 text-amber-500"
          />

          <StatCard
            label="Payment status"
            value={`${stats.paidCount} paid`}
            description={`${stats.overdueCount} overdue on this page`}
            icon={Clock3}
            iconClassName="bg-emerald-500/10 text-emerald-500"
          />
        </div>

        {/* Filters */}

        <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row">
            <form
              onSubmit={handleSearch}
              className="flex min-w-0 flex-1 gap-2"
            >
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="search"
                  value={
                    searchInput
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchInput(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search invoice, customer or reference"
                  className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90"
              >
                Search
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[400px]">
              <select
                value={status}
                onChange={(
                  event
                ) => {
                  setStatus(
                    event.target
                      .value as
                      | InvoiceStatus
                      | ""
                  );

                  setPage(1);
                }}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {statusOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "all-status"
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <select
                value={mode}
                onChange={(
                  event
                ) => {
                  setMode(
                    event.target
                      .value as
                      | InvoiceMode
                      | ""
                  );

                  setPage(1);
                }}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {modeOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "all-mode"
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {filtersActive && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Table */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-foreground">
                Invoice records
              </h2>

              <p className="mt-1 text-[11px] text-muted-foreground">
                Customer billing and payment status
              </p>
            </div>

            <p className="text-xs font-bold text-muted-foreground">
              {pagination.total} records
            </p>
          </div>

          {error &&
          invoices.length >
            0 ? (
            <div className="flex items-center justify-between gap-4 border-b border-red-500/20 bg-red-500/10 px-5 py-3">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadInvoices()
                }
                className="shrink-0 text-xs font-black text-red-600 underline dark:text-red-300"
              >
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <InvoiceTableLoading />
          ) : error &&
            invoices.length ===
              0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>

              <h3 className="mt-4 text-base font-black text-foreground">
                Unable to load invoices
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadInvoices()
                }
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          ) : invoices.length ===
            0 ? (
            <InvoiceEmptyState
              filtered={
                filtersActive
              }
              onClear={
                clearFilters
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Invoice
                      </th>

                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Mode
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Total
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Due
                      </th>

                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Due date
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoices.map(
                      (
                        invoice
                      ) => (
                        <tr
                          key={
                            invoice.invoiceId
                          }
                          className="border-b border-border/70 transition last:border-b-0 hover:bg-muted/30"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/dashboard/merchant/invoices/${encodeURIComponent(
                                invoice.invoiceId
                              )}`}
                              className="font-black text-foreground transition hover:text-primary"
                            >
                              {
                                invoice.invoiceNumber
                              }
                            </Link>

                            <p className="mt-1 max-w-[180px] truncate text-[10px] font-medium text-muted-foreground">
                              {
                                invoice.invoiceId
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[190px] truncate text-sm font-bold text-foreground">
                              {
                                invoice.customer
                                  .name
                              }
                            </p>

                            <p className="mt-1 max-w-[190px] truncate text-[11px] text-muted-foreground">
                              {
                                invoice.customer
                                  .email
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <InvoiceStatusBadge
                              status={
                                invoice.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <InvoiceModeBadge
                              mode={
                                invoice.mode
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <p className="text-sm font-black text-foreground">
                              {formatMoney(
                                invoice.total,
                                invoice.currency
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <p
                              className={`text-sm font-black ${
                                invoice.amountDueMinor >
                                0
                                  ? "text-amber-600 dark:text-amber-300"
                                  : "text-emerald-600 dark:text-emerald-300"
                              }`}
                            >
                              {formatMoney(
                                invoice.amountDue,
                                invoice.currency
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-xs font-bold text-foreground">
                              {formatDate(
                                invoice.dueDate
                              )}
                            </p>

                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Issued{" "}
                              {formatDate(
                                invoice.issueDate
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/dashboard/merchant/invoices/${encodeURIComponent(
                                invoice.invoiceId
                              )}`}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-black text-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                            >
                              View
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}

              <div className="flex flex-col gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Showing{" "}
                  <span className="font-black text-foreground">
                    {startItem}
                  </span>
                  {" - "}
                  <span className="font-black text-foreground">
                    {endItem}
                  </span>
                  {" of "}
                  <span className="font-black text-foreground">
                    {pagination.total}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.max(
                            current -
                              1,
                            1
                          )
                      )
                    }
                    disabled={
                      page <= 1
                    }
                    aria-label="Previous page"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex h-9 min-w-[110px] items-center justify-center rounded-xl border border-border bg-muted/40 px-3 text-xs font-black text-foreground">
                    Page {page} of{" "}
                    {totalPages}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.min(
                            current +
                              1,
                            totalPages
                          )
                      )
                    }
                    disabled={
                      page >=
                      totalPages
                    }
                    aria-label="Next page"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}