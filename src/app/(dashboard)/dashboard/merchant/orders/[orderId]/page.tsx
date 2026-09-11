"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Package,
  RefreshCw,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  getMerchantOrder,
  type MerchantOrder,
  type MerchantOrderPayment,
} from "@/lib/api/merchantOrderApi";

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-BD", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function date(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("en-BD");
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border merchant-border p-4">
      <p className="text-[11px] font-black uppercase tracking-wider merchant-muted">{label}</p>
      <p className="mt-2 break-words text-sm font-bold">{value === null || value === undefined || value === "" ? "—" : String(value)}</p>
    </div>
  );
}

export default function MerchantOrderDetailsPage() {
  const params = useParams();
  const rawId = params.orderId;
  const orderId = Array.isArray(rawId) ? rawId[0] || "" : rawId || "";
  const [order, setOrder] = useState<MerchantOrder | null>(null);
  const [payment, setPayment] = useState<MerchantOrderPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");
    try {
      const result = await getMerchantOrder(orderId);
      setOrder(result.order);
      setPayment(result.payment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <main className="merchant-theme min-h-screen p-10 text-center merchant-muted">Loading order details…</main>;
  }

  if (error || !order) {
    return (
      <main className="merchant-theme min-h-screen p-6 merchant-text">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <p className="mt-3 font-black">{error || "Order not found."}</p>
          <Link href="/dashboard/merchant/orders" className="mt-5 inline-flex rounded-xl merchant-primary-soft px-4 py-2 text-sm font-black merchant-primary">Back to orders</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="merchant-theme min-h-screen merchant-text">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard/merchant/orders" className="inline-flex items-center gap-2 text-sm font-bold merchant-muted hover:merchant-primary">
              <ArrowLeft className="h-4 w-4" /> Back to orders
            </Link>
            <h1 className="mt-3 text-3xl font-black">Order details</h1>
            <p className="mt-1 font-mono text-xs merchant-muted">{order.orderId}</p>
          </div>
          <button onClick={() => void load()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border merchant-border merchant-surface px-4 text-sm font-bold">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
            <Package className="h-5 w-5 merchant-primary" />
            <p className="mt-4 text-xs font-bold merchant-muted">Order status</p>
            <p className="mt-1 text-xl font-black capitalize">{order.status.replace(/_/g, " ")}</p>
          </article>
          <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
            <WalletCards className="h-5 w-5 merchant-primary" />
            <p className="mt-4 text-xs font-bold merchant-muted">Order amount</p>
            <p className="mt-1 text-xl font-black">{money(order.amount, order.currency)}</p>
          </article>
          <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
            <CheckCircle2 className="h-5 w-5 merchant-primary" />
            <p className="mt-4 text-xs font-bold merchant-muted">Payment</p>
            <p className="mt-1 text-xl font-black capitalize">{payment?.status || "Not started"}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
              <h2 className="font-black">Order information</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Merchant reference" value={order.merchantReference} />
                <Field label="Mode" value={order.mode.toUpperCase()} />
                <Field label="Created" value={date(order.createdAt)} />
                <Field label="Expires" value={date(order.expiresAt)} />
                <Field label="Paid" value={date(order.paidAt)} />
                <Field label="Description" value={order.description} />
              </div>
            </article>

            <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
              <h2 className="font-black">Items</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="merchant-muted"><tr><th className="pb-3">Item</th><th className="pb-3">Qty</th><th className="pb-3">Unit</th><th className="pb-3 text-right">Total</th></tr></thead>
                  <tbody className="divide-y merchant-border">
                    {order.items.length ? order.items.map((item, index) => (
                      <tr key={`${item.sku || item.name}-${index}`}>
                        <td className="py-3"><p className="font-bold">{item.name}</p><p className="text-xs merchant-muted">{item.sku || "No SKU"}</p></td>
                        <td className="py-3">{item.quantity}</td>
                        <td className="py-3">{money(item.unitAmount, order.currency)}</td>
                        <td className="py-3 text-right font-black">{money(item.totalAmount, order.currency)}</td>
                      </tr>
                    )) : <tr><td colSpan={4} className="py-8 text-center merchant-muted">No item breakdown supplied.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <aside className="space-y-6">
            <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
              <div className="flex items-center gap-2"><UserRound className="h-5 w-5 merchant-primary" /><h2 className="font-black">Customer</h2></div>
              <div className="mt-4 space-y-3">
                <Field label="Name" value={order.customer?.name} />
                <Field label="Email" value={order.customer?.email} />
                <Field label="Phone" value={order.customer?.phone} />
                <Field label="External customer ID" value={order.customer?.externalCustomerId} />
              </div>
            </article>

            <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
              <h2 className="font-black">Checkout</h2>
              <p className="mt-2 break-all text-xs merchant-muted">{order.checkoutUrl}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(order.checkoutUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl merchant-primary-soft px-3 py-2.5 text-xs font-black merchant-primary"
                >
                  <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
                </button>
                <a href={order.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl merchant-gradient px-3 py-2.5 text-xs font-black text-white">
                  <ExternalLink className="h-4 w-4" /> Open
                </a>
              </div>
            </article>

            {payment && (
              <article className="rounded-2xl border merchant-border merchant-surface p-5 merchant-shadow">
                <h2 className="font-black">Latest payment</h2>
                <div className="mt-4 space-y-3">
                  <Field label="Payment ID" value={payment.paymentId} />
                  <Field label="Provider" value={payment.provider} />
                  <Field label="Method" value={payment.sourceType} />
                  <Link href={`/dashboard/merchant/payments/${encodeURIComponent(payment.paymentId)}`} className="inline-flex w-full items-center justify-center rounded-xl merchant-primary-soft px-4 py-3 text-sm font-black merchant-primary">View payment details</Link>
                </div>
              </article>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
