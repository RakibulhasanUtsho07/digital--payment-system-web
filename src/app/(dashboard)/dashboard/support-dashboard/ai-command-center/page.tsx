"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Siren,
  Sparkles,
} from "lucide-react";
import {
  getSupportAiCommandCenter,
  getSupportAiHealth,
  type SupportAiCommandCenterSnapshot,
  type SupportAiRange,
} from "@/lib/api/supportAiOperationsApi";
import {
  SupportAiMetricCard,
  SupportAiPill,
  formatSupportAiDate,
  humanizeSupportAi,
  toneForSeverity,
} from "@/components/support-ai/SupportAiUi";

const ranges: SupportAiRange[] = ["24h", "7d", "30d"];

export default function SupportAiCommandCenterPage() {
  const [range, setRange] = useState<SupportAiRange>("24h");
  const [snapshot, setSnapshot] = useState<SupportAiCommandCenterSnapshot | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [nextSnapshot, nextHealth] = await Promise.all([
        getSupportAiCommandCenter(range),
        getSupportAiHealth(),
      ]);
      setSnapshot(nextSnapshot);
      setHealth(nextHealth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Coffer AI Support Command Center.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const maxTrend = useMemo(() => {
    if (!snapshot?.trend.length) return 1;
    return Math.max(1, ...snapshot.trend.map((point) => point.createdCases));
  }, [snapshot]);

  if (loading) {
    return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>;
  }

  if (!snapshot) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-rose-500/20 bg-rose-500/5 p-7 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-xl font-black">Unable to open AI Command Center</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "No operational snapshot was returned."}</p>
          <button onClick={() => void load(false)} className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1560px] space-y-5">
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[30px] border border-emerald-500/15 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white shadow-[0_24px_70px_rgba(5,150,105,0.18)] sm:p-7"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-emerald-200">
                <BrainCircuit className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em]">Coffer AI · Support Operations</span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Support AI Command Center</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">Live case pressure, SLA risk, incidents, alerts, verified causes and resolution quality from the backend evidence layer.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <SupportAiPill tone={snapshot.health.status}>{snapshot.health.status}</SupportAiPill>
                <span className="text-xs font-bold text-emerald-100/75">{snapshot.health.headline}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ranges.map((item) => (
                <button key={item} onClick={() => setRange(item)} className={`rounded-xl border px-3.5 py-2 text-xs font-black transition ${range === item ? "border-white/25 bg-white text-emerald-900" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}>{item}</button>
              ))}
              <button onClick={() => void load(true)} disabled={refreshing} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black text-white hover:bg-white/15 disabled:opacity-60">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>
        </motion.section>

        {error ? <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">{error}</div> : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SupportAiMetricCard label="Open AI Cases" value={snapshot.overview.openCases} hint={`${snapshot.overview.unassignedOpenCases} unassigned`} tone={snapshot.overview.criticalOpenCases ? "critical" : "healthy"} />
          <SupportAiMetricCard label="Urgent" value={snapshot.overview.urgentOpenCases} hint={`${snapshot.overview.criticalOpenCases} critical`} tone={snapshot.overview.urgentOpenCases ? "critical" : "healthy"} />
          <SupportAiMetricCard label="SLA Breached" value={snapshot.sla.breached} hint={`${snapshot.sla.atRiskHigh} high-risk`} tone={snapshot.sla.breached ? "critical" : snapshot.sla.atRiskHigh ? "attention" : "healthy"} />
          <SupportAiMetricCard label="Active Incidents" value={snapshot.overview.openIncidents} hint={`${snapshot.overview.criticalIncidents} critical`} tone={snapshot.overview.criticalIncidents ? "critical" : snapshot.overview.openIncidents ? "attention" : "healthy"} />
          <SupportAiMetricCard label="Open Alerts" value={snapshot.alerts.open} hint={`${snapshot.alerts.critical} critical · ${snapshot.alerts.high} high`} tone={snapshot.alerts.critical ? "critical" : snapshot.alerts.high ? "attention" : "healthy"} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[28px] border border-border bg-card/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">Operations Trend</p>
                <h2 className="mt-1 text-lg font-black">Case creation pressure</h2>
              </div>
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-6 flex h-52 items-end gap-1.5 overflow-hidden rounded-2xl border border-border bg-muted/30 p-3">
              {snapshot.trend.map((point) => {
                const height = Math.max(4, Math.round((point.createdCases / maxTrend) * 100));
                return (
                  <div key={point.bucket} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${point.bucket}: ${point.createdCases} cases`}>
                    <div className="w-full max-w-7 rounded-t-lg bg-gradient-to-t from-emerald-700 to-emerald-400 transition group-hover:from-emerald-600 group-hover:to-teal-300" style={{ height: `${height}%` }} />
                    <span className="hidden text-[7px] font-bold text-muted-foreground 2xl:block">{point.bucket}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-[28px] border p-5 shadow-sm ${toneForSeverity(snapshot.health.status)}`}>
            <div className="flex items-center gap-2">
              {snapshot.health.status === "critical" ? <Siren className="h-5 w-5" /> : snapshot.health.status === "attention" ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              <p className="text-[9px] font-black uppercase tracking-[0.14em]">Operational Health</p>
            </div>
            <h2 className="mt-4 text-xl font-black">{snapshot.health.headline}</h2>
            <p className="mt-2 text-sm leading-6 opacity-80">{snapshot.health.summary}</p>
            <div className="mt-5 rounded-2xl border border-current/10 bg-background/50 p-4 text-sm leading-6 text-foreground">{snapshot.dailyOperationsSummary}</div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold opacity-75">
              <span>Backend</span>
              <span>{health?.status ?? "—"} · {health?.ai?.provider ?? "—"}</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[28px] border border-border bg-card/90 p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Queue Pressure</p><h2 className="mt-1 text-lg font-black">Live operational queues</h2></div>
              <Link href="/dashboard/support-dashboard/ai-cases" className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">Open cases <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {snapshot.queues.map((queue) => (
                <div key={queue.queue} className="rounded-2xl border border-border bg-muted/25 p-4">
                  <div className="flex items-center justify-between gap-3"><span className="font-black">{humanizeSupportAi(queue.queue)}</span><span className="text-xl font-black">{queue.openCases}</span></div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground"><span>{queue.critical} critical</span><span>·</span><span>{queue.urgent} urgent</span><span>·</span><span>{queue.breached} breached</span></div>
                </div>
              ))}
              {snapshot.queues.length === 0 ? <p className="text-sm text-muted-foreground">No active queue pressure.</p> : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card/90 p-5">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Verified Failure Causes</h2></div>
            <div className="mt-4 space-y-3">
              {snapshot.topFailureCauses.slice(0, 6).map((cause) => (
                <div key={cause.code} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/45 px-3 py-2.5"><span className="truncate text-sm font-bold">{humanizeSupportAi(cause.code)}</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">{cause.count}</span></div>
              ))}
              {snapshot.topFailureCauses.length === 0 ? <p className="text-sm text-muted-foreground">No verified failure cause dominates this window.</p> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[28px] border border-border bg-card/90 p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Proactive Alerts</p><h2 className="mt-1 text-lg font-black">Latest alert feed</h2></div><BellRing className="h-5 w-5 text-amber-500" /></div>
            <div className="mt-4 space-y-3">
              {snapshot.alertFeed.slice(0, 6).map((alert) => (
                <Link href="/dashboard/support-dashboard/ai-alerts" key={alert.alertId} className="block rounded-2xl border border-border bg-muted/25 p-4 transition hover:border-emerald-500/20 hover:bg-emerald-500/[0.04]">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-black">{alert.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{alert.summary}</p></div><SupportAiPill tone={alert.severity}>{alert.severity}</SupportAiPill></div>
                  <p className="mt-2 text-[10px] font-bold text-muted-foreground">{formatSupportAiDate(alert.lastDetectedAt)}</p>
                </Link>
              ))}
              {snapshot.alertFeed.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No active proactive alert.</div> : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card/90 p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">Correlated Incidents</p><h2 className="mt-1 text-lg font-black">Systemic issue candidates</h2></div><Siren className="h-5 w-5 text-rose-500" /></div>
            <div className="mt-4 space-y-3">
              {snapshot.incidents.slice(0, 6).map((incident) => (
                <Link href="/dashboard/support-dashboard/ai-incidents" key={incident.incidentId} className="block rounded-2xl border border-border bg-muted/25 p-4 transition hover:border-emerald-500/20 hover:bg-emerald-500/[0.04]">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-black">{incident.title}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{incident.incidentId} · {incident.caseCount} cases · {humanizeSupportAi(incident.queue)}</p></div><SupportAiPill tone={incident.severity}>{incident.severity}</SupportAiPill></div>
                  <p className="mt-2 text-[10px] font-bold text-muted-foreground">Last seen {formatSupportAiDate(incident.lastSeenAt)}</p>
                </Link>
              ))}
              {snapshot.incidents.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No active correlated incident.</div> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SupportAiMetricCard label="Resolution Rate" value={`${snapshot.resolutionQuality.resolutionRate}%`} hint={`${snapshot.resolutionQuality.outcomesInRange} outcomes`} tone="healthy" />
          <SupportAiMetricCard label="Escalation Rate" value={`${snapshot.resolutionQuality.escalationRate}%`} hint={`${snapshot.resolutionQuality.escalated} escalated`} tone={snapshot.resolutionQuality.escalationRate > 30 ? "attention" : "default"} />
          <SupportAiMetricCard label="Reopen Rate" value={`${snapshot.resolutionQuality.reopenRate}%`} hint={`${snapshot.resolutionQuality.reopened} reopened`} tone={snapshot.resolutionQuality.reopenRate > 10 ? "attention" : "default"} />
          <SupportAiMetricCard label="Knowledge Published" value={snapshot.knowledgeLearning.published} hint={`${snapshot.knowledgeLearning.submitted} awaiting review`} tone="healthy" />
        </section>

        <p className="pb-2 text-center text-[10px] font-semibold text-muted-foreground">Generated {formatSupportAiDate(snapshot.generatedAt)} · Coffer AI Support remains read-only for financial/security state.</p>
      </div>
    </main>
  );
}
