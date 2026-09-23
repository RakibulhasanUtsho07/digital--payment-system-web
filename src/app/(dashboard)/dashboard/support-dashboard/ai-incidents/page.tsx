"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Siren, UserCheck } from "lucide-react";
import {
  listSupportAiIncidents,
  updateSupportAiIncident,
  type SupportAiIncident,
} from "@/lib/api/supportAiOperationsApi";
import { SupportAiEmpty, SupportAiPill, formatSupportAiDate, humanizeSupportAi } from "@/components/support-ai/SupportAiUi";

export default function SupportAiIncidentsPage() {
  const [items, setItems] = useState<SupportAiIncident[]>([]);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setItems((await listSupportAiIncidents({ status, severity, limit: 50 })).incidents); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load incidents."); }
    finally { setLoading(false); }
  }, [status, severity]);

  useEffect(() => { void load(); }, [load]);

  const patch = async (incidentId: string, payload: { status?: string; assignToMe?: boolean }) => {
    setBusy(incidentId);
    try { await updateSupportAiIncident({ incidentId, ...payload }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to update incident."); }
    finally { setBusy(""); }
  };

  return <main className="min-h-screen p-3 sm:p-4 md:p-6"><div className="mx-auto max-w-[1450px] space-y-5">
    <section className="rounded-[30px] border border-rose-500/15 bg-gradient-to-br from-slate-950 via-rose-950/70 to-emerald-950 p-5 text-white sm:p-7"><div className="flex items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-rose-200"><Siren className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.16em]">Systemic Correlation</span></div><h1 className="mt-3 text-2xl font-black sm:text-3xl">AI Support Incidents</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Multiple matching support cases are grouped into incidents so provider/systemic failures are visible early.</p></div><button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black"><RefreshCw className="h-4 w-4" />Refresh</button></div></section>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold"><option value="">All status</option><option value="detected">Detected</option><option value="acknowledged">Acknowledged</option><option value="investigating">Investigating</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold"><option value="">All severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></section>
    {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
    {loading ? <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div> : items.length === 0 ? <SupportAiEmpty title="No matching incidents" description="No correlated multi-case incident matches the current filter." /> : <section className="space-y-3">{items.map((incident) => <article key={incident.incidentId} className="rounded-[24px] border border-border bg-card p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-3xl"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">{incident.incidentId} · {humanizeSupportAi(incident.queue)}</p><h2 className="mt-2 text-lg font-black">{incident.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{incident.summary}</p><div className="mt-3 flex flex-wrap gap-2"><SupportAiPill tone={incident.severity}>{incident.severity}</SupportAiPill><SupportAiPill tone={incident.status}>{incident.status}</SupportAiPill><span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-black">{incident.caseCount} cases</span>{incident.causeCode ? <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-700">{humanizeSupportAi(incident.causeCode)}</span> : null}</div></div><div className="flex flex-wrap gap-2"><button onClick={() => void patch(incident.incidentId, { assignToMe: true })} disabled={busy === incident.incidentId} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-black"><UserCheck className="h-3.5 w-3.5" />Assign to me</button><select value={incident.status} onChange={(e) => void patch(incident.incidentId, { status: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-black"><option value="detected">Detected</option><option value="acknowledged">Acknowledged</option><option value="investigating">Investigating</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div></div><div className="mt-4 text-[10px] font-bold text-muted-foreground">First seen {formatSupportAiDate(incident.firstSeenAt)} · Last seen {formatSupportAiDate(incident.lastSeenAt)}</div></article>)}</section>}
  </div></main>;
}
