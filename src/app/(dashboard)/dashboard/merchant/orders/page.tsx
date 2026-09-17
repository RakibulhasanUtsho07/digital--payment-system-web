"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  getMerchantOrders,
  type MerchantOrder,
  type MerchantOrderStatus,
} from "@/lib/api/merchantOrderApi";

const statuses: Array<{ value: "" | MerchantOrderStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "created", label: "Created" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "partially_refunded", label: "Partially refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "failed", label: "Failed" },
];

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: MerchantOrderStatus) {
  if (status === "paid") return "merchant-status-success";
  if (["failed", "cancelled"].includes(status)) return "merchant-status-danger";
  if (["expired", "partially_refunded", "refunded"].includes(status)) {
    return "merchant-status-warning";
  }
  return "merchant-status-info";
}

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    grossAmount: 0,
  });
  const [currency, setCurrency] = useState("BDT");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const summaryCards: Array<{
    label: string;
    value: string | number;
    icon: LucideIcon;
  }> = [
    { label: "Total orders", value: summary.totalOrders, icon: ShoppingBag },
    { label: "Paid orders", value: summary.paidOrders, icon: CheckCircle2 },
    { label: "Awaiting payment", value: summary.pendingOrders, icon: Clock3 },
    { label: "Paid volume", value: money(summary.grossAmount, currency), icon: WalletCards },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (search.trim()) query.set("search", search.trim());
      if (status) query.set("status", status);
      if (mode) query.set("mode", mode);
      const response = await getMerchantOrders(query);
      setOrders(response.data.orders);
      setSummary(response.data.summary);
      setCurrency(response.data.merchant.defaultCurrency);
      setPages(response.data.pagination.totalPages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [mode, page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <main className="merchant-theme min-h-screen merchant-text">
      <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] merchant-primary">
              Gateway commerce
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Orders</h1>
            <p className="mt-2 max-w-2xl text-sm merchant-muted">
              Track orders created by your website through the Coffer API and follow their payment status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border merchant-border merchant-surface px-4 text-sm font-bold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-600">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, icon: CardIcon }) => {
            return (
              <article key={label} className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold merchant-muted">{label}</p>
                  <CardIcon className="h-5 w-5 merchant-primary" />
                </div>
                <p className="mt-4 text-2xl font-black">{value}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border merchant-border merchant-surface p-4 merchant-shadow">
          <div className="grid gap-3 md:grid-cols-[1fr_190px_150px]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 merchant-muted" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search order, reference or customer"
                className="h-11 w-full rounded-xl border merchant-border bg-transparent pl-11 pr-4 text-sm outline-none"
              />
            </label>
            <select
              value={status}
              onChange={(event) => { setStatus(event.target.value); setPage(1); }}
              className="h-11 rounded-xl border merchant-border merchant-surface px-3 text-sm outline-none"
            >
              {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select
              value={mode}
              onChange={(event) => { setMode(event.target.value); setPage(1); }}
              className="h-11 rounded-xl border merchant-border merchant-surface px-3 text-sm outline-none"
            >
              <option value="">All modes</option>
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border merchant-border merchant-surface merchant-shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b merchant-border merchant-primary-soft text-[11px] uppercase tracking-wider merchant-muted">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Mode</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y merchant-border">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center merchant-muted">Loading orders…</td></tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-14 text-center">
                      <PackageCheck className="mx-auto h-10 w-10 merchant-primary" />
                      <p className="mt-3 font-black">No gateway orders found</p>
                      <p className="mt-1 text-sm merchant-muted">Orders created through your API will appear here.</p>
                    </td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.orderId} className="transition hover:merchant-primary-soft">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold">{order.orderId}</p>
                      <p className="mt-1 text-xs merchant-muted">{order.merchantReference || "No reference"}</p>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <p className="font-bold">{order.customer?.name || "Guest customer"}</p>
                      <p className="text-xs merchant-muted">{order.customer?.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-black">{money(order.amount, order.currency)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black capitalize ${statusClass(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${order.mode === "live" ? "merchant-mode-live" : "merchant-mode-test"}`}>
                        {order.mode}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs merchant-muted">{date(order.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/merchant/orders/${encodeURIComponent(order.orderId)}`}
                        className="inline-flex h-9 items-center gap-2 rounded-lg merchant-primary-soft px-3 text-xs font-black merchant-primary"
                      >
                        <Eye className="h-4 w-4" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t merchant-border px-5 py-4">
            <p className="text-xs merchant-muted">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border merchant-border px-3 py-2 text-xs font-bold disabled:opacity-40">Previous</button>
              <button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border merchant-border px-3 py-2 text-xs font-bold disabled:opacity-40">Next</button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
