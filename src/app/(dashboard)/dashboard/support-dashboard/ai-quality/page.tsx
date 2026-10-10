"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, BarChart3, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { getSupportAiQuality } from "@/lib/api/supportAiOperationsApi";
import { SupportAiMetricCard, humanizeSupportAi } from "@/components/support-ai/SupportAiUi";

export default function SupportAiQualityPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await getSupportAiQuality(range)); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load resolution quality analytics."); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { void load(); }, [load]);

  return <main className="min-h-screen p-3 sm:p-4 md:p-6"><div className="mx-auto max-w-[1500px] space-y-5">
    <section className="rounded-[30px] border border-emerald-500/15 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 p-5 text-white sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-emerald-200"><BarChart3 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.16em]">Resolution Intelligence</span></div><h1 className="mt-3 text-2xl font-black sm:text-3xl">Support AI Quality</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Descriptive outcome and playbook analytics. No opaque agent ranking or automatic performance verdict.</p></div><div className="flex gap-2">{(["7d","30d","90d"] as const).map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded-xl border px-3 py-2 text-xs font-black ${range === item ? "bg-white text-emerald-950" : "border-white/10 bg-white/5"}`}>{item}</button>)}<button onClick={() => void load()} className="rounded-xl border border-white/10 bg-white/10 p-2.5"><RefreshCw className="h-4 w-4" /></button></div></div></section>
    {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
    {loading || !data ? <div className="flex min-h-[350px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div> : <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><SupportAiMetricCard label="Outcome coverage" value={`${data.coverage.outcomeCoverageRate}%`} hint={`${data.coverage.casesWithRecordedOutcome}/${data.coverage.casesCreated} cases`} tone="default" /><SupportAiMetricCard label="Resolution rate" value={`${data.outcomes.resolutionRate}%`} hint={`${data.outcomes.resolved} resolved`} tone="healthy" /><SupportAiMetricCard label="Escalation rate" value={`${data.outcomes.escalationRate}%`} hint={`${data.outcomes.escalated} escalated`} tone={data.outcomes.escalationRate > 30 ? "attention" : "default"} /><SupportAiMetricCard label="Reopen rate" value={`${data.outcomes.reopenRate}%`} hint={`${data.outcomes.reopened} reopened`} tone={data.outcomes.reopenRate > 10 ? "attention" : "default"} /><SupportAiMetricCard label="Avg resolution" value={data.timing.averageResolutionMinutes == null ? "—" : `${data.timing.averageResolutionMinutes}m`} tone="default" /><SupportAiMetricCard label="Median resolution" value={data.timing.medianResolutionMinutes == null ? "—" : `${data.timing.medianResolutionMinutes}m`} tone="default" /></section>
      <section className="grid gap-4 xl:grid-cols-2"><div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-600" /><h2 className="font-black">By verified failure cause</h2></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground"><th className="px-2 py-3">Cause</th><th className="px-2 py-3">Outcomes</th><th className="px-2 py-3">Resolved</th><th className="px-2 py-3">Escalated</th><th className="px-2 py-3">Reopen</th><th className="px-2 py-3">Avg min</th></tr></thead><tbody>{data.byFailureCause.map((row: any) => <tr key={row.causeCode} className="border-b border-border/60"><td className="px-2 py-3 font-black">{humanizeSupportAi(row.causeCode)}</td><td className="px-2 py-3">{row.outcomes}</td><td className="px-2 py-3">{row.resolutionRate}%</td><td className="px-2 py-3">{row.escalationRate}%</td><td className="px-2 py-3">{row.reopenRate}%</td><td className="px-2 py-3">{row.averageResolutionMinutes ?? "—"}</td></tr>)}</tbody></table></div></div><div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Playbook effectiveness</h2></div><div className="mt-4 space-y-3">{data.playbookEffectiveness.map((row: any) => <div key={row.playbookId} className="rounded-2xl border border-border bg-muted/25 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{row.title}</p><p className="mt-1 text-xs text-muted-foreground">{row.started} started · {row.completed} completed · {row.linkedOutcomes} linked outcomes</p></div><span className="text-lg font-black text-emerald-700">{row.resolvedOutcomeRate}%</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><Mini label="Complete" value={`${row.completionRate}%`} /><Mini label="Escalate" value={`${row.escalationRate}%`} /><Mini label="Reopen" value={`${row.reopenRate}%`} /></div></div>)}{data.playbookEffectiveness.length === 0 ? <p className="text-sm text-muted-foreground">No playbook outcome data in this range.</p> : null}</div></div></section>
      <div className="rounded-2xl border border-border bg-muted/25 p-4 text-xs leading-5 text-muted-foreground">These are descriptive operational metrics. They do not prove that a playbook caused an outcome and they are not an automatic Support Agent score.</div>
    </>}
  </div></main>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-background p-2"><p className="text-[8px] font-black uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>; }
