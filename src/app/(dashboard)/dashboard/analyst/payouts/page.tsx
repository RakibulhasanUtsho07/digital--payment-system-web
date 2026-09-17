"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCcw, WalletCards, XCircle } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  getAnalystPayoutAnalytics,
  type AnalystPayoutAnalyticsData,
  type AnalystPayoutStatus,
  type AnalystRange,
} from "@/lib/api/analystApi";

const ranges: AnalystRange[] = ["24h", "7d", "30d", "90d"];
const statuses: AnalystPayoutStatus[] = ["all", "pending", "processing", "completed", "failed", "cancelled"];

function money(minor: number, currency: string) {
  try { return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100); }
  catch { return `${currency} ${(minor / 100).toLocaleString("en-BD")}`; }
}
function pct(value: number) { return `${value.toFixed(2)}%`; }
function duration(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}
function labelBucket(value: string, range: AnalystRange) {
  return new Intl.DateTimeFormat("en-BD", range === "24h" ? { hour: "numeric" } : { month: "short", day: "numeric" }).format(new Date(value));
}

export default function AnalystPayoutsPage() {
  const [range, setRange] = useState<AnalystRange>("30d");
  const [status, setStatus] = useState<AnalystPayoutStatus>("all");
  const [currency, setCurrency] = useState("BDT");
  const [data, setData] = useState<AnalystPayoutAnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    (async () => {
      try {
        setLoading(true); setError("");
        const result = await getAnalystPayoutAnalytics({ range, status, currency }, controller.signal);
        if (active) setData(result);
      } catch (cause) {
        if (active && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load payout analytics.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [range, status, currency, refreshKey]);

  const chartData = useMemo(() => data?.trend.map(point => ({ ...point, label: labelBucket(point.bucket, range) })) ?? [], [data, range]);

  if (loading && !data) return <div className="flex min-h-[60vh] items-center justify-center"><RefreshCcw className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <main className="space-y-6">
      <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600"><WalletCards className="h-4 w-4" />Payout Intelligence</div>
            <h1 className="mt-4 text-3xl font-black">Merchant Payout Analytics</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Monitor payout lifecycle, payout value, merchant concentration, latency and ledger reconciliation.</p>
            {data && <p className="mt-2 text-[11px] text-muted-foreground">{data.scopeNote}</p>}
          </div>
          <button type="button" onClick={() => setRefreshKey(v => v + 1)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs font-bold"><RefreshCcw className="h-4 w-4" />Refresh</button>
        </div>
      </section>

      {error && <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600"><AlertTriangle className="h-5 w-5" /><p className="text-xs">{error}</p></div>}

      <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
        <select value={range} onChange={e => setRange(e.target.value as AnalystRange)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold">{ranges.map(v => <option key={v} value={v}>{v}</option>)}</select>
        <select value={status} onChange={e => setStatus(e.target.value as AnalystPayoutStatus)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold">{statuses.map(v => <option key={v} value={v}>{v}</option>)}</select>
        <input value={currency} onChange={e => setCurrency(e.target.value.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase())} className="h-11 rounded-xl border border-border bg-background px-3 text-center text-xs font-black uppercase" />
      </section>

      {data && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Payouts", data.metrics.payoutCount.value.toLocaleString()],
            ["Requested value", money(data.metrics.totalAmountMinor.value, data.filters.currency)],
            ["Completed net", money(data.metrics.completedNetAmountMinor.value, data.filters.currency)],
            ["Pending value", money(data.metrics.pendingAmountMinor.value, data.filters.currency)],
            ["Completion rate", pct(data.metrics.completionRate.value)],
            ["Failure rate", pct(data.metrics.failureRate.value)],
            ["Average completion", duration(data.metrics.averageCompletionSeconds.value)],
            ["Ledger coverage", pct(data.metrics.ledgerCoverageRate.value)],
          ].map(([title, value]) => <article key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{title}</p><p className="mt-3 text-2xl font-black">{value}</p></article>)}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-extrabold">Payout trend</h2>
          <div className="mt-4 h-[340px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData}><CartesianGrid vertical={false} strokeDasharray="4 4" opacity={0.15} /><XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="failedCount" name="Failed" fill="#ef4444" maxBarSize={14} /><Line type="monotone" dataKey="completedCount" name="Completed" stroke="#10b981" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="pendingCount" name="Pending" stroke="#f59e0b" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-extrabold">Ledger reconciliation</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">{[
              ["Completed", data.ledger.completedPayoutCount], ["With ledger group", data.ledger.withLedgerGroupCount], ["Balanced", data.ledger.balancedLedgerGroupCount], ["Unbalanced", data.ledger.unbalancedLedgerGroupCount],
            ].map(([title, value]) => <div key={title} className="rounded-xl border border-border bg-background p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">{title}</p><p className="mt-2 text-xl font-black">{value}</p></div>)}</div>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-extrabold">Payout methods</h2>
            <div className="mt-4 space-y-3">{data.methods.map(method => <div key={method.method} className="rounded-xl border border-border bg-background p-4"><div className="flex justify-between gap-3"><span className="text-xs font-bold capitalize">{method.method.replaceAll("_", " ")}</span><span className="text-xs font-black">{pct(method.completionRate)}</span></div><p className="mt-2 text-[11px] text-muted-foreground">{method.count} payouts · {money(method.netAmountMinor, data.filters.currency)}</p></div>)}</div>
          </article>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-extrabold">Merchant payout concentration</h2>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-xs"><thead><tr className="text-left text-[10px] uppercase text-muted-foreground"><th className="border-b border-border px-3 py-3">Merchant</th><th className="border-b border-border px-3 py-3 text-right">Payouts</th><th className="border-b border-border px-3 py-3 text-right">Completed</th><th className="border-b border-border px-3 py-3 text-right">Failed</th><th className="border-b border-border px-3 py-3 text-right">Net</th><th className="border-b border-border px-3 py-3 text-right">Share</th></tr></thead><tbody>{data.merchants.map(m => <tr key={m.merchantId}><td className="border-b border-border/60 px-3 py-3 font-bold">{m.businessName}</td><td className="border-b border-border/60 px-3 py-3 text-right">{m.payoutCount}</td><td className="border-b border-border/60 px-3 py-3 text-right text-emerald-600">{m.completedCount}</td><td className="border-b border-border/60 px-3 py-3 text-right text-red-600">{m.failedCount}</td><td className="border-b border-border/60 px-3 py-3 text-right font-bold">{money(m.netAmountMinor, data.filters.currency)}</td><td className="border-b border-border/60 px-3 py-3 text-right font-black">{pct(m.netShare)}</td></tr>)}</tbody></table></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">{data.insights.map(insight => <article key={insight.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex gap-3">{insight.severity === "positive" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-amber-600" />}<div><h3 className="text-sm font-extrabold">{insight.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{insight.description}</p><p className="mt-3 text-[11px] font-semibold">{insight.evidence}</p></div></div></article>)}</section>
      </>}
    </main>
  );
}
