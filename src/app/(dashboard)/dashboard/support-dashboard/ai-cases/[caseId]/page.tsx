"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  addSupportAiCaseNote,
  createSupportKnowledgeDraft,
  getSupportAiCase,
  getSupportAiCaseCorrelation,
  getSupportAiCaseTimeline,
  recommendSupportCasePlaybooks,
  startSupportCasePlaybook,
  updateSupportAiCase,
  type SupportAiCase,
  type SupportAiCaseEvent,
  type SupportAiCorrelation,
} from "@/lib/api/supportAiOperationsApi";
import {
  SupportAiPill,
  formatSupportAiDate,
  humanizeSupportAi,
} from "@/components/support-ai/SupportAiUi";

export default function SupportAiCaseDetailPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = decodeURIComponent(params.caseId);
  const [item, setItem] = useState<SupportAiCase | null>(null);
  const [timeline, setTimeline] = useState<SupportAiCaseEvent[]>([]);
  const [correlation, setCorrelation] = useState<SupportAiCorrelation | null>(null);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextCase, nextTimeline, nextCorrelation, nextPlaybooks] = await Promise.all([
        getSupportAiCase(caseId),
        getSupportAiCaseTimeline(caseId),
        getSupportAiCaseCorrelation(caseId),
        recommendSupportCasePlaybooks(caseId),
      ]);
      setItem(nextCase);
      setTimeline(nextTimeline);
      setCorrelation(nextCorrelation);
      setPlaybooks(nextPlaybooks.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the AI Support case.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (status: any) => {
    setBusy(`status:${status}`);
    try {
      const next = await updateSupportAiCase({ caseId, status });
      setItem(next);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update status.");
    } finally { setBusy(""); }
  };

  const assignToMe = async () => {
    setBusy("assign");
    try {
      setItem(await updateSupportAiCase({ caseId, assignToMe: true }));
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to assign case."); }
    finally { setBusy(""); }
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    setBusy("note");
    try {
      setItem(await addSupportAiCaseNote({ caseId, body: note.trim() }));
      setNote("");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to add note."); }
    finally { setBusy(""); }
  };

  const copyReply = async () => {
    if (!item) return;
    await navigator.clipboard.writeText(item.customerFacingMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const startPlaybook = async (playbookId: string) => {
    setBusy(`playbook:${playbookId}`);
    try {
      await startSupportCasePlaybook({ caseId, playbookId });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to start playbook."); }
    finally { setBusy(""); }
  };

  const createDraft = async () => {
    setBusy("knowledge");
    try {
      await createSupportKnowledgeDraft(caseId);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create knowledge draft. A verified resolved outcome is required."); }
    finally { setBusy(""); }
  };

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>;

  if (!item) return <div className="p-6"><div className="mx-auto max-w-xl rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-7 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-rose-600" /><h1 className="mt-3 text-xl font-black">Case unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></div></div>;

  return (
    <main className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1540px] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/dashboard/support-dashboard/ai-cases" className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />AI Cases</Link><button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-black"><RefreshCw className="h-3.5 w-3.5" />Refresh evidence</button></div>

        <section className="rounded-[30px] border border-emerald-500/15 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">{item.caseId}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{item.subjectReference}</h1><p className="mt-2 text-sm font-semibold text-emerald-50/70">{humanizeSupportAi(item.subjectKind)} · {humanizeSupportAi(item.queue)} · updated {formatSupportAiDate(item.updatedAt)}</p><div className="mt-4 flex flex-wrap gap-2"><SupportAiPill tone={item.severity}>{item.severity}</SupportAiPill><SupportAiPill tone={item.priority}>{item.priority}</SupportAiPill><SupportAiPill tone={item.verification}>{item.verification}</SupportAiPill><SupportAiPill tone={item.sla.state}>{item.sla.state}</SupportAiPill></div></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => void assignToMe()} disabled={busy === "assign"} className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-emerald-900"><UserCheck className="h-3.5 w-3.5" />{item.assignedToUserId ? "Re-assign to me" : "Assign to me"}</button><select value={item.status} onChange={(e) => void updateStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white outline-none"><option className="text-slate-900" value="open">Open</option><option className="text-slate-900" value="investigating">Investigating</option><option className="text-slate-900" value="waiting_customer">Waiting customer</option><option className="text-slate-900" value="escalated">Escalated</option><option className="text-slate-900" value="resolved">Resolved</option><option className="text-slate-900" value="closed">Closed</option></select></div>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-800 dark:text-amber-200">{error}</div> : null}

        <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-4">
            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Evidence-based diagnosis</h2></div><div className="mt-4 rounded-2xl bg-muted/35 p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">Confirmed cause</p><p className="mt-2 text-lg font-black">{item.confirmedCause ? humanizeSupportAi(item.confirmedCause.code) : "Exact cause not proven"}</p>{item.confirmedCause ? <p className="mt-1 text-sm text-muted-foreground">{item.confirmedCause.label}</p> : <p className="mt-1 text-sm text-muted-foreground">Coffer AI will not guess an exact cause from contextual signals.</p>}</div><p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{item.agentSummary}</p></div>

            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Customer-safe first response</h2></div><button onClick={() => void copyReply()} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-black"><Copy className="h-3 w-3" />{copied ? "Copied" : "Copy"}</button></div><p className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4 text-sm leading-6">{item.customerFacingMessage}</p></div>

            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Agent checklist</h2></div><div className="mt-4 space-y-2">{item.agentChecklist.map((step, index) => <div key={`${index}-${step}`} className="flex gap-3 rounded-2xl bg-muted/35 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-[10px] font-black text-emerald-700">{index + 1}</span><p className="text-sm leading-6 text-muted-foreground">{step}</p></div>)}</div></div>

            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Approved guided playbooks</h2></div><div className="mt-4 space-y-3">{playbooks.map((recommendation) => <div key={recommendation.playbook.id} className="rounded-2xl border border-border bg-muted/25 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{recommendation.playbook.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{recommendation.playbook.description}</p></div><div className="flex items-center gap-2"><SupportAiPill tone={recommendation.confidence}>{recommendation.confidence}</SupportAiPill><button onClick={() => void startPlaybook(recommendation.playbook.id)} disabled={busy === `playbook:${recommendation.playbook.id}`} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">Start</button></div></div><p className="mt-3 text-[10px] font-bold text-muted-foreground">{recommendation.reasons.join(" · ")}</p></div>)}{playbooks.length === 0 ? <p className="text-sm text-muted-foreground">No matching approved playbook yet.</p> : null}</div></div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-600" /><h2 className="font-black">SLA & routing</h2></div><div className="mt-4 grid grid-cols-2 gap-3"><Info label="SLA state" value={humanizeSupportAi(item.sla.state)} /><Info label="Risk" value={humanizeSupportAi(item.sla.risk)} /><Info label="Remaining" value={`${item.sla.remainingMinutes} min`} /><Info label="Consumed" value={`${item.sla.consumedPercent}%`} /><Info label="Queue" value={humanizeSupportAi(item.queue)} /><Info label="Escalation" value={item.escalation.required ? humanizeSupportAi(item.escalation.team) : "Not required"} /></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{item.sla.explanation}</p></div>

            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><Route className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Correlation</h2></div>{correlation ? <div className="mt-4 space-y-3"><Info label="Potential duplicate" value={correlation.duplicateOfCaseId ?? "None"} /><Info label="Related cases" value={String(correlation.similarCases.length)} /><Info label="Incident" value={correlation.incident?.incidentId ?? "None"} />{correlation.similarCases.slice(0, 4).map((related) => <Link key={related.caseId} href={`/dashboard/support-dashboard/ai-cases/${encodeURIComponent(related.caseId)}`} className="block rounded-2xl border border-border bg-muted/25 p-3 hover:border-emerald-500/25"><div className="flex items-center justify-between"><span className="text-xs font-black">{related.caseId}</span><span className="text-xs font-black text-emerald-700">{related.score}%</span></div><p className="mt-1 text-[10px] text-muted-foreground">{related.reasons.join(" · ")}</p></Link>)}</div> : null}</div>

            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><h2 className="font-black">Signals</h2></div><div className="mt-4 space-y-2">{item.signalSnapshot.map((signal) => <div key={`${signal.code}-${signal.title}`} className="rounded-2xl border border-border bg-muted/25 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-black">{signal.title}</p><SupportAiPill tone={signal.severity}>{signal.severity}</SupportAiPill></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{signal.detail}</p></div>)}{item.signalSnapshot.length === 0 ? <p className="text-sm text-muted-foreground">No additional warning/blocker signal.</p> : null}</div></div>

            <div className="rounded-[26px] border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-emerald-600" /><h2 className="font-black">Knowledge learning</h2></div><button onClick={() => void createDraft()} disabled={busy === "knowledge"} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300">Create draft</button></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Only a human-confirmed resolved case with a verified cause can become a reusable knowledge draft. Admin approval is required before publication.</p></div>

            <div className="rounded-[26px] border border-border bg-card p-5"><h2 className="font-black">Internal note</h2><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Support-only note..." className="mt-3 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-emerald-500/40" /><button onClick={() => void saveNote()} disabled={!note.trim() || busy === "note"} className="mt-3 w-full rounded-xl bg-foreground px-4 py-2.5 text-xs font-black text-background disabled:opacity-50">Save internal note</button></div>
          </div>
        </section>

        <section className="rounded-[26px] border border-border bg-card p-5"><h2 className="font-black">Case timeline</h2><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{timeline.map((event) => <div key={event.id} className="rounded-2xl border border-border bg-muted/25 p-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">{humanizeSupportAi(event.eventType)}</p><p className="mt-1 text-sm font-bold leading-5">{event.summary}</p><p className="mt-2 text-[10px] font-semibold text-muted-foreground">{formatSupportAiDate(event.createdAt)}</p></div>)}</div></section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-muted/35 p-3"><p className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-black">{value}</p></div>;
}
