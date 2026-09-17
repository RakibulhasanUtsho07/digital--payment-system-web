"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAnalystCompliance, type AnalystComplianceData, type AnalystRange } from "@/lib/api/analystApi";

const ranges: AnalystRange[] = ["24h", "7d", "30d", "90d"];
const bucketLabel = (value: string, range: AnalystRange) => new Intl.DateTimeFormat("en-BD", range === "24h" ? { hour: "numeric" } : { month: "short", day: "numeric" }).format(new Date(value));

export default function AnalystCompliancePage() {
  const [range, setRange] = useState<AnalystRange>("30d");
  const [data, setData] = useState<AnalystComplianceData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController(); let active = true;
    (async () => {
      try { setLoading(true); setError(""); const result = await getAnalystCompliance(range, controller.signal); if (active) setData(result); }
      catch (cause) { if (active && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load compliance analytics."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [range, refreshKey]);

  const chartData = useMemo(() => data?.trend.map(item => ({ ...item, label: bucketLabel(item.bucket, range) })) ?? [], [data, range]);
  if (loading && !data) return <div className="flex min-h-[60vh] items-center justify-center"><RefreshCcw className="h-8 w-8 animate-spin text-primary" /></div>;

  return <main className="space-y-6">
    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-600"><ShieldCheck className="h-4 w-4" />Compliance Intelligence</div><h1 className="mt-4 text-3xl font-black">Compliance Analytics</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">KYC verification, AI review risk, security warnings, audit activity and system compliance signals.</p></div><div className="flex gap-2"><select value={range} onChange={e => setRange(e.target.value as AnalystRange)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold">{ranges.map(v => <option key={v} value={v}>{v}</option>)}</select><button type="button" onClick={() => setRefreshKey(v => v + 1)} className="h-11 rounded-xl border border-border bg-background px-4"><RefreshCcw className="h-4 w-4" /></button></div></div></section>
    {error && <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600"><AlertTriangle className="h-5 w-5" /><p className="text-xs">{error}</p></div>}
    {data && <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        ["KYC coverage", `${data.population.verificationCoverage.toFixed(2)}%`], ["Submitted KYC", data.metrics.submittedKycCount.value], ["Verified", data.metrics.verifiedKycCount.value], ["AI reviews", data.metrics.aiReviewCount.value], ["High-risk AI", data.metrics.highRiskAiReviewCount.value], ["Security warnings", data.metrics.securityWarningCount.value], ["Critical settings", data.metrics.criticalSettingsChangeCount.value], ["System errors", data.metrics.systemErrorCount.value],
      ].map(([title, value]) => <article key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{title}</p><p className="mt-3 text-2xl font-black">{value}</p></article>)}</section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-extrabold">Compliance signal trend</h2><div className="mt-4 h-[340px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid vertical={false} strokeDasharray="4 4" opacity={0.15} /><XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="submittedKycCount" name="KYC submitted" stroke="#2563eb" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="verifiedKycCount" name="KYC verified" stroke="#10b981" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="highRiskAiReviewCount" name="High-risk AI" stroke="#f59e0b" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="systemErrorCount" name="System errors" stroke="#ef4444" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></section>
      <section className="grid gap-6 lg:grid-cols-3">{[
        ["KYC status", data.kycStatuses.map(x => ({ label: x.status, count: x.count, percentage: x.percentage }))],
        ["AI risk levels", data.aiRiskLevels.map(x => ({ label: x.riskLevel, count: x.count, percentage: x.percentage }))],
        ["Security warnings", data.securityEvents.map(x => ({ label: x.eventType, count: x.count, percentage: x.percentage }))],
      ].map(([title, rows]) => <article key={String(title)} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-extrabold">{String(title)}</h2><div className="mt-4 space-y-3">{(rows as Array<{label:string;count:number;percentage:number}>).map(row => <div key={row.label} className="rounded-xl border border-border bg-background p-3"><div className="flex justify-between gap-3"><span className="truncate text-xs font-bold">{row.label.replaceAll("_", " ")}</span><span className="text-xs font-black">{row.count}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(row.percentage, 100)}%` }} /></div></div>)}</div></article>)}</section>
      <section className="grid gap-4 lg:grid-cols-2">{data.insights.map(insight => <article key={insight.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex gap-3">{insight.severity === "positive" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-amber-600" />}<div><h3 className="text-sm font-extrabold">{insight.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{insight.description}</p><p className="mt-3 text-[11px] font-semibold">{insight.evidence}</p></div></div></article>)}</section>
    </>}
  </main>;
}
