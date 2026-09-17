"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  DatabaseZap,
  Layers3,
  RefreshCcw,
  ShieldAlert,
  TimerReset,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getAnalystPaymentAnalytics,
  type AnalystMode,
  type AnalystPaymentAnalyticsData,
  type AnalystPaymentInsight,
  type AnalystPaymentMetric,
  type AnalystPaymentSource,
  type AnalystPaymentStatus,
  type AnalystPulseStatus,
  type AnalystRange,
} from "@/lib/api/analystApi";

const ranges: Array<{
  value: AnalystRange;
  label: string;
}> = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const modes: Array<{
  value: AnalystMode;
  label: string;
}> = [
  { value: "all", label: "All modes" },
  { value: "live", label: "Live only" },
  { value: "test", label: "Test only" },
];

const statuses: Array<{
  value: AnalystPaymentStatus;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "captured", label: "Captured" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

const sources: Array<{
  value: AnalystPaymentSource;
  label: string;
}> = [
  { value: "all", label: "All sources" },
  { value: "wallet", label: "Wallet" },
  { value: "card", label: "Card" },
  { value: "paypal", label: "PayPal" },
  { value: "local_psp", label: "Local PSP" },
];

const colors: Record<string, string> = {
  completed: "#10b981",
  captured: "#14b8a6",
  authorized: "#3b82f6",
  pending: "#f59e0b",
  failed: "#ef4444",
  cancelled: "#94a3b8",
  expired: "#8b5cf6",
  live: "#10b981",
  test: "#3b82f6",
  wallet: "#06b6d4",
  card: "#8b5cf6",
  paypal: "#2563eb",
  local_psp: "#f59e0b",
};

function numberText(value: number): string {
  return new Intl.NumberFormat("en-BD").format(value);
}

function moneyText(
  minor: number,
  currency: string,
  compact = false
): string {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toLocaleString("en-BD")}`;
  }
}

function dateText(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-BD", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function bucketText(value: string, range: AnalystRange): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-BD",
    range === "24h"
      ? { hour: "numeric", hour12: true }
      : { month: "short", day: "numeric" }
  ).format(date);
}

function humanize(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Change({
  metric,
  inverse = false,
}: {
  metric: AnalystPaymentMetric;
  inverse?: boolean;
}) {
  const change = metric.changePercent;

  if (change === null) {
    return <span className="text-[11px] font-semibold text-muted-foreground">No previous baseline</span>;
  }

  const rising = change > 0;
  const neutral = change === 0;
  const good = neutral || (inverse ? !rising : rising);
  const Icon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${neutral ? "text-muted-foreground" : good ? "text-emerald-600" : "text-red-600"}`}>
      {!neutral && <Icon className="h-3.5 w-3.5" />}
      {Math.abs(change).toFixed(2)}%
      <span className="font-medium text-muted-foreground">vs previous</span>
    </span>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  metric,
  icon: Icon,
  style,
  inverse,
}: {
  title: string;
  value: string;
  subtitle: string;
  metric: AnalystPaymentMetric;
  icon: LucideIcon;
  style: string;
  inverse?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-muted-foreground">{title}</p>
          <p className="mt-3 truncate text-2xl font-black tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 border-t border-border/70 pt-3">
        <Change metric={metric} inverse={inverse} />
      </div>
    </motion.div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-extrabold text-foreground">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center">
      <DatabaseZap className="h-8 w-8 text-muted-foreground/60" />
      <p className="mt-3 text-sm font-bold text-foreground">No real payment data</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{message}</p>
    </div>
  );
}

function Breakdown({
  rows,
}: {
  rows: Array<{
    key: string;
    count: number;
    percentage: number;
  }>;
}) {
  if (rows.length === 0) {
    return <Empty message="No breakdown records match the selected filters." />;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 font-bold text-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[row.key] ?? "#3b82f6" }} />
              <span className="truncate">{humanize(row.key)}</span>
            </span>
            <span className="shrink-0 font-bold text-muted-foreground">{numberText(row.count)} · {row.percentage.toFixed(2)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, row.percentage)}%`, backgroundColor: colors[row.key] ?? "#3b82f6" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Health({ health }: { health: AnalystPulseStatus }) {
  const style = health === "healthy"
    ? "bg-emerald-500/10 text-emerald-600"
    : health === "attention"
      ? "bg-amber-500/10 text-amber-600"
      : "bg-red-500/10 text-red-600";

  return <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${style}`}>{health}</span>;
}

function Insight({ insight }: { insight: AnalystPaymentInsight }) {
  const style = insight.severity === "positive"
    ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-600"
    : insight.severity === "info"
      ? "border-blue-500/25 bg-blue-500/5 text-blue-600"
      : insight.severity === "critical"
        ? "border-red-500/25 bg-red-500/5 text-red-600"
        : "border-amber-500/25 bg-amber-500/5 text-amber-600";
  const Icon = insight.severity === "positive" ? CheckCircle2 : insight.severity === "critical" ? XCircle : AlertTriangle;

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-extrabold text-foreground">{insight.title}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{insight.description}</p>
          <p className="mt-3 text-[11px] font-bold text-foreground/80">Evidence: {insight.evidence}</p>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground"><span className="font-extrabold text-foreground">Review:</span> {insight.recommendedReview}</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalystPaymentsPage() {
  const [range, setRange] = useState<AnalystRange>("30d");
  const [mode, setMode] = useState<AnalystMode>("all");
  const [status, setStatus] = useState<AnalystPaymentStatus>("all");
  const [source, setSource] = useState<AnalystPaymentSource>("all");
  const [currency, setCurrency] = useState("BDT");
  const [currencyDraft, setCurrencyDraft] = useState("BDT");
  const [provider, setProvider] = useState("");
  const [providerDraft, setProviderDraft] = useState("");
  const [data, setData] = useState<AnalystPaymentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setRefreshing(true);
      setError("");

      try {
        const result = await getAnalystPaymentAnalytics(
          { range, mode, currency, provider, status, source },
          controller.signal
        );

        if (active) {
          setData(result);
        }
      } catch (loadError: unknown) {
        if (active && !controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load payment analytics.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [range, mode, currency, provider, status, source, refreshKey]);

  const chartData = useMemo(() => data?.trend.map((point) => ({
    ...point,
    label: bucketText(point.bucket, range),
    volumeMajor: point.volumeMinor / 100,
  })) ?? [], [data, range]);

  const applyTextFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCurrency = currencyDraft.trim().toUpperCase();
    const nextProvider = providerDraft.trim().toLowerCase();

    if (!/^[A-Z]{3}$/.test(nextCurrency)) {
      setError("Currency must be a three-letter ISO code.");
      return;
    }

    if (nextProvider && !/^[a-z0-9][a-z0-9_-]*$/.test(nextProvider)) {
      setError("Provider contains invalid characters.");
      return;
    }

    setError("");
    setCurrency(nextCurrency);
    setProvider(nextProvider);
  };

  const resetFilters = () => {
    setRange("30d");
    setMode("all");
    setStatus("all");
    setSource("all");
    setCurrency("BDT");
    setCurrencyDraft("BDT");
    setProvider("");
    setProviderDraft("");
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 xl:p-8">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative px-5 py-6 sm:px-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.10),transparent_32%)]" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-500/20">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Analyst Performance</p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Payment Analytics</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Read-only gateway performance, provider health, completed volume, fees, failures, and latency from the Payment collection.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                disabled={refreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <form onSubmit={applyTextFilters} className="relative flex flex-wrap items-center gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:px-7">
            <select value={range} onChange={(event) => setRange(event.target.value as AnalystRange)} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground">
              {ranges.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={mode} onChange={(event) => setMode(event.target.value as AnalystMode)} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground">
              {modes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value as AnalystPaymentStatus)} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground">
              {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={source} onChange={(event) => setSource(event.target.value as AnalystPaymentSource)} className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground">
              {sources.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input value={currencyDraft} onChange={(event) => setCurrencyDraft(event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase())} aria-label="Currency" className="h-10 w-20 rounded-xl border border-border bg-background px-3 text-center text-xs font-black uppercase" />
            <input value={providerDraft} onChange={(event) => setProviderDraft(event.target.value)} placeholder="Provider (optional)" aria-label="Provider" className="h-10 w-44 rounded-xl border border-border bg-background px-3 text-xs font-semibold" />
            <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">Apply</button>
            <button type="button" onClick={resetFilters} className="h-10 rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground">Reset</button>
            {data && <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Updated {dateText(data.generatedAt)}</span>}
          </form>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-4 text-red-600">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div><p className="text-sm font-extrabold">Payment analytics request failed</p><p className="mt-1 text-xs text-muted-foreground">{error}</p></div>
          </div>
        )}

        {loading && !data ? (
          <div className="grid min-h-[420px] place-items-center rounded-3xl border border-border bg-card">
            <div className="text-center"><RefreshCcw className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-4 text-sm font-bold">Aggregating payment records…</p></div>
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Payment attempts" value={numberText(data.metrics.attemptCount.value)} subtitle="All matching gateway attempts" metric={data.metrics.attemptCount} icon={Activity} style="bg-blue-500/10 text-blue-600" />
              <MetricCard title="Completed payments" value={numberText(data.metrics.completedCount.value)} subtitle={`${data.metrics.successRate.value.toFixed(2)}% success rate`} metric={data.metrics.completedCount} icon={CheckCircle2} style="bg-emerald-500/10 text-emerald-600" />
              <MetricCard title="Completed volume" value={moneyText(data.metrics.paymentVolumeMinor.value, data.filters.currency, true)} subtitle="Failed payments excluded" metric={data.metrics.paymentVolumeMinor} icon={CircleDollarSign} style="bg-violet-500/10 text-violet-600" />
              <MetricCard title="Fee revenue" value={moneyText(data.metrics.feeRevenueMinor.value, data.filters.currency, true)} subtitle="Captured payment fees" metric={data.metrics.feeRevenueMinor} icon={Banknote} style="bg-cyan-500/10 text-cyan-600" />
              <MetricCard title="Net merchant volume" value={moneyText(data.metrics.netVolumeMinor.value, data.filters.currency, true)} subtitle="Net credited payment value" metric={data.metrics.netVolumeMinor} icon={WalletCards} style="bg-indigo-500/10 text-indigo-600" />
              <MetricCard title="Average payment" value={moneyText(data.metrics.averagePaymentMinor.value, data.filters.currency)} subtitle="Completed payments only" metric={data.metrics.averagePaymentMinor} icon={Layers3} style="bg-fuchsia-500/10 text-fuchsia-600" />
              <MetricCard title="Failure rate" value={`${data.metrics.failureRate.value.toFixed(2)}%`} subtitle={`${numberText(data.metrics.failedCount.value)} failed payments`} metric={data.metrics.failureRate} icon={XCircle} style="bg-red-500/10 text-red-600" inverse />
              <MetricCard title="Completion latency" value={`${data.metrics.averageCompletionSeconds.value.toFixed(2)}s`} subtitle="Created-to-completed average" metric={data.metrics.averageCompletionSeconds} icon={TimerReset} style="bg-amber-500/10 text-amber-600" inverse />
            </div>

            <Panel title="Payment performance trend" description="Attempts, completed payments, failures, and completed volume across the selected period.">
              {data.metrics.attemptCount.value > 0 ? (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-border" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={22} />
                      <YAxis yAxisId="count" allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }} />
                      <Area yAxisId="volume" type="monotone" dataKey="volumeMajor" name="Completed volume" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.08} strokeWidth={2} />
                      <Bar yAxisId="count" dataKey="failedCount" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Line yAxisId="count" type="monotone" dataKey="attemptCount" name="Attempts" stroke="#3b82f6" strokeWidth={3} dot={false} />
                      <Line yAxisId="count" type="monotone" dataKey="completedCount" name="Completed" stroke="#10b981" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : <Empty message="No payment attempt matches the current filters." />}
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              <Panel title="Provider performance" description="Read-only provider success, volume, fees, and completion latency.">
                {data.providers.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-xs">
                      <thead><tr className="text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground"><th className="border-b border-border px-3 py-3">Provider</th><th className="border-b border-border px-3 py-3 text-right">Attempts</th><th className="border-b border-border px-3 py-3 text-right">Success</th><th className="border-b border-border px-3 py-3 text-right">Failed</th><th className="border-b border-border px-3 py-3 text-right">Volume</th><th className="border-b border-border px-3 py-3 text-right">Latency</th></tr></thead>
                      <tbody>{data.providers.map((item) => <tr key={item.provider}><td className="border-b border-border/60 px-3 py-3.5"><div className="flex items-center gap-2"><Health health={item.health} /><span className="font-extrabold">{humanize(item.provider)}</span></div></td><td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">{numberText(item.attemptCount)}</td><td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">{item.successRate.toFixed(2)}%</td><td className="border-b border-border/60 px-3 py-3.5 text-right font-bold text-red-600">{numberText(item.failedCount)}</td><td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">{moneyText(item.volumeMinor, data.filters.currency, true)}</td><td className="border-b border-border/60 px-3 py-3.5 text-right font-bold">{item.averageCompletionSeconds.toFixed(2)}s</td></tr>)}</tbody>
                    </table>
                  </div>
                ) : <Empty message="No provider performance record matches the filters." />}
              </Panel>

              <Panel title="Payment status" description="Lifecycle distribution across all matching attempts.">
                <Breakdown rows={data.statuses.map((item) => ({ key: item.status, count: item.count, percentage: item.percentage }))} />
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Panel title="Payment sources" description="Wallet, card, PayPal, and local provider usage.">
                <Breakdown rows={data.sources.map((item) => ({ key: item.source, count: item.count, percentage: item.percentage }))} />
              </Panel>
              <Panel title="Environment mix" description="Test and live request distribution.">
                <Breakdown rows={data.modes.map((item) => ({ key: item.mode, count: item.count, percentage: item.percentage }))} />
              </Panel>
              <Panel title="Completion latency" description="Completed payments grouped by processing duration.">
                <Breakdown rows={data.latency.map((item) => ({ key: item.label, count: item.count, percentage: item.percentage }))} />
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Failure reasons" description="Recorded failure codes; sensitive failure messages are not exposed.">
                {data.failureReasons.length ? <Breakdown rows={data.failureReasons.map((item) => ({ key: item.code, count: item.count, percentage: item.percentage }))} /> : <Empty message="No failed payment exists in the selected period." />}
              </Panel>
              <Panel title="Deterministic insights" description="Transparent threshold-based findings; no paid AI provider is used.">
                <div className="space-y-3">{data.insights.map((item) => <Insight key={item.id} insight={item} />)}</div>
              </Panel>
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">In progress</p><p className="mt-2 text-xl font-black">{numberText(data.operations.pendingCount)}</p></div>
                <div><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cancelled</p><p className="mt-2 text-xl font-black">{numberText(data.operations.cancelledCount)}</p></div>
                <div><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Expired</p><p className="mt-2 text-xl font-black">{numberText(data.operations.expiredCount)}</p></div>
                <div><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Risk blocked</p><p className="mt-2 text-xl font-black text-amber-600">{numberText(data.operations.riskBlockedCount)}</p></div>
              </div>
              <div className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-[11px] leading-5 text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />This analyst page can only read aggregated payment facts. It cannot create, capture, cancel, or refund a payment.</div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
