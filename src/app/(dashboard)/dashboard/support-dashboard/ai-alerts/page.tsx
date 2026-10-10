"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BellRing, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import {
  evaluateSupportAiAlerts,
  listSupportAiAlerts,
  updateSupportAiAlert,
  type SupportAiAlert,
} from "@/lib/api/supportAiOperationsApi";
import { SupportAiEmpty, SupportAiPill, formatSupportAiDate, humanizeSupportAi } from "@/components/support-ai/SupportAiUi";

export default function SupportAiAlertsPage() {
  const [alerts, setAlerts] = useState<SupportAiAlert[]>([]);
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setAlerts((await listSupportAiAlerts({ status, severity, limit: 50 })).alerts); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load proactive alerts."); }
    finally { setLoading(false); }
  }, [status, severity]);

  useEffect(() => { void load(); }, [load]);

  const evaluate = async () => {
    setBusy("evaluate");
    try { await evaluateSupportAiAlerts(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to evaluate alerts."); }
    finally { setBusy(""); }
  };

  const changeStatus = async (alertId: string, nextStatus: "acknowledged" | "resolved") => {
    setBusy(alertId);
    try { await updateSupportAiAlert({ alertId, status: nextStatus }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update alert."); }
    finally { setBusy(""); }
  };

  return (
    <main className="min-h-screen p-3 sm:p-4 md:p-6"><div className="mx-auto max-w-[1450px] space-y-5">
      <section className="rounded-[30px] border border-amber-500/15 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-5 text-white sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-amber-200"><BellRing className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.16em]">Proactive Signal Feed</span></div><h1 className="mt-3 text-2xl font-black sm:text-3xl">AI Support Alerts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Detect payment/provider failure spikes, SLA pressure and critical incidents before they become a large support backlog.</p></div><button onClick={() => void evaluate()} disabled={busy === "evaluate"} className="flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-xs font-black text-emerald-950"><RefreshCw className={`h-4 w-4 ${busy === "evaluate" ? "animate-spin" : ""}`} />Evaluate now</button></div></section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold"><option value="">All status</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select><select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold"><option value="">All severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><div className="col-span-2 flex items-center justify-end text-xs font-black text-muted-foreground">{alerts.length} alert(s)</div></section>
      {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      {loading ? <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div> : alerts.length === 0 ? <SupportAiEmpty title="No matching alerts" description="The current alert filters have no active signal." /> : <section className="grid gap-3 xl:grid-cols-2">{alerts.map((alert) => <article key={alert.alertId} className="rounded-[24px] border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">{alert.alertId} · {humanizeSupportAi(alert.type)}</p><h2 className="mt-2 text-lg font-black">{alert.title}</h2></div><SupportAiPill tone={alert.severity}>{alert.severity}</SupportAiPill></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{alert.summary}</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Mini label="Current" value={`${alert.evidence.currentRate}%`} /><Mini label="Baseline" value={`${alert.evidence.baselineRate}%`} /><Mini label="Delta" value={`${alert.evidence.deltaRatePoints}pt`} /><Mini label="Multiplier" value={alert.evidence.multiplier ? `${alert.evidence.multiplier}x` : "—"} /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="text-[10px] font-bold text-muted-foreground">Last detected {formatSupportAiDate(alert.lastDetectedAt)} · {humanizeSupportAi(alert.status)}</div><div className="flex gap-2">{alert.status === "open" ? <button onClick={() => void changeStatus(alert.alertId, "acknowledged")} disabled={busy === alert.alertId} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black text-amber-700">Acknowledge</button> : null}{alert.status !== "resolved" ? <button onClick={() => void changeStatus(alert.alertId, "resolved")} disabled={busy === alert.alertId} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-700">Resolve</button> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}</div></div></article>)}</section>}
    </div></main>
  );
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted/40 p-2.5 text-center"><p className="text-[8px] font-black uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>; }
