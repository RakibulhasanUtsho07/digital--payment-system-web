"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  createOrRefreshSupportAiCase,
  listSupportAiCases,
  type SupportAiCase,
} from "@/lib/api/supportAiOperationsApi";
import {
  SupportAiEmpty,
  SupportAiPill,
  formatSupportAiDate,
  humanizeSupportAi,
} from "@/components/support-ai/SupportAiUi";

export default function SupportAiCasesPage() {
  const [cases, setCases] = useState<SupportAiCase[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [queue, setQueue] = useState("");
  const [priority, setPriority] = useState("");
  const [mine, setMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [reference, setReference] = useState("");
  const [question, setQuestion] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const result = await listSupportAiCases({ page, limit: 20, status, queue, priority, mine });
      setCases(result.cases);
      setPages(result.pages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load AI Support cases.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, status, queue, priority, mine]);

  useEffect(() => { void load(false); }, [load]);

  const createCase = async () => {
    if (!reference.trim() && !question.trim()) return;
    setCreating(true);
    setError("");
    try {
      await createOrRefreshSupportAiCase({
        message: question.trim() || `Investigate ${reference.trim()}`,
        resourceId: reference.trim() || undefined,
        assignToMe: true,
      });
      setReference("");
      setQuestion("");
      setShowCreate(false);
      setPage(1);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the AI Support case.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-emerald-500/15 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white shadow-[0_20px_60px_rgba(5,150,105,.16)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-200"><BrainCircuit className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.16em]">AI Case Workspace</span></div>
              <h1 className="mt-3 text-2xl font-black sm:text-3xl">Investigate, triage and track support cases</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/70">Every case is rebuilt from backend evidence. Client-supplied cause, severity or role is never trusted.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void load(true)} disabled={refreshing} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black hover:bg-white/15"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
              <button onClick={() => setShowCreate((value) => !value)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-emerald-900"><Plus className="h-4 w-4" />New investigation</button>
            </div>
          </div>
        </motion.section>

        {showCreate ? (
          <section className="rounded-[26px] border border-emerald-500/20 bg-card p-5 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[.45fr_.55fr_auto]">
              <div><label className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">Payment / transaction / customer reference</label><input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="pay_..., transaction ID, customer ID" className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-500/50" /></div>
              <div><label className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">Investigation question</label><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Why did this payment fail?" className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-500/50" /></div>
              <button onClick={() => void createCase()} disabled={creating || (!reference.trim() && !question.trim())} className="mt-auto h-[42px] rounded-xl bg-emerald-600 px-5 text-sm font-black text-white disabled:opacity-50">{creating ? "Investigating..." : "Create & assign"}</button>
            </div>
          </section>
        ) : null}

        <section className="rounded-[26px] border border-border bg-card/90 p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold"><option value="">All status</option><option value="open">Open</option><option value="investigating">Investigating</option><option value="waiting_customer">Waiting customer</option><option value="escalated">Escalated</option><option value="resolved">Resolved</option></select>
            <select value={queue} onChange={(e) => { setQueue(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold"><option value="">All queues</option><option value="support">Support</option><option value="payments">Payments</option><option value="provider">Provider</option><option value="risk_security">Risk / Security</option><option value="kyc">KYC</option><option value="engineering">Engineering</option></select>
            <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold"><option value="">All priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold"><input type="checkbox" checked={mine} onChange={(e) => { setMine(e.target.checked); setPage(1); }} className="accent-emerald-600" />Assigned to me</label>
            <div className="flex items-center justify-end text-sm font-black text-muted-foreground">{total} cases</div>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-200">{error}</div> : null}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
        ) : cases.length === 0 ? (
          <SupportAiEmpty title="No AI Support cases" description="Create an investigation from a payment, transaction or customer reference, or change the current filters." />
        ) : (
          <section className="grid gap-3 xl:grid-cols-2">
            {cases.map((item) => (
              <Link href={`/dashboard/support-dashboard/ai-cases/${encodeURIComponent(item.caseId)}`} key={item.caseId} className="group rounded-[24px] border border-border bg-card/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/25 hover:shadow-[0_14px_35px_rgba(16,185,129,.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">{item.caseId}</p><h2 className="mt-1 truncate text-lg font-black">{item.subjectReference}</h2><p className="mt-1 text-xs font-semibold text-muted-foreground">{humanizeSupportAi(item.subjectKind)} · {humanizeSupportAi(item.queue)}</p></div>
                  <div className="flex flex-col items-end gap-2"><SupportAiPill tone={item.severity}>{item.severity}</SupportAiPill><SupportAiPill tone={item.priority}>{item.priority}</SupportAiPill></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted/35 p-3 text-center"><div><p className="text-[8px] font-black uppercase tracking-wide text-muted-foreground">Status</p><p className="mt-1 text-xs font-black">{humanizeSupportAi(item.status)}</p></div><div><p className="text-[8px] font-black uppercase tracking-wide text-muted-foreground">SLA</p><p className="mt-1 text-xs font-black">{humanizeSupportAi(item.sla.state)}</p></div><div><p className="text-[8px] font-black uppercase tracking-wide text-muted-foreground">Cause</p><p className="mt-1 truncate text-xs font-black">{item.confirmedCause ? humanizeSupportAi(item.confirmedCause.code) : "Not proven"}</p></div></div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.agentSummary}</p>
                <div className="mt-4 flex items-center justify-between"><span className="text-[10px] font-bold text-muted-foreground"><Clock3 className="mr-1 inline h-3 w-3" />{formatSupportAiDate(item.updatedAt)}</span><span className="flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-300">Open case <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span></div>
              </Link>
            ))}
          </section>
        )}

        <div className="flex items-center justify-between gap-3 pb-3"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-border px-4 py-2 text-xs font-black disabled:opacity-40">Previous</button><span className="text-xs font-bold text-muted-foreground">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className="rounded-xl border border-border px-4 py-2 text-xs font-black disabled:opacity-40">Next</button></div>
      </div>
    </main>
  );
}
