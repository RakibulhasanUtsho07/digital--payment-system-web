"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpenCheck, Loader2, RefreshCw, Send } from "lucide-react";
import {
  listSupportKnowledgeDrafts,
  submitSupportKnowledgeDraft,
} from "@/lib/api/supportAiOperationsApi";
import { SupportAiEmpty, SupportAiPill, formatSupportAiDate, humanizeSupportAi } from "@/components/support-ai/SupportAiUi";

export default function SupportAiKnowledgePage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setDrafts((await listSupportKnowledgeDrafts({ status, limit: 50 })).drafts); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load Support knowledge drafts."); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (draftId: string) => {
    setBusy(draftId);
    try { await submitSupportKnowledgeDraft(draftId); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to submit knowledge draft."); }
    finally { setBusy(""); }
  };

  return <main className="min-h-screen p-3 sm:p-4 md:p-6"><div className="mx-auto max-w-[1450px] space-y-5">
    <section className="rounded-[30px] border border-emerald-500/15 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-5 text-white sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-emerald-200"><BookOpenCheck className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.16em]">Human-reviewed learning loop</span></div><h1 className="mt-3 text-2xl font-black sm:text-3xl">AI Support Knowledge Drafts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Resolved verified cases can become reusable troubleshooting guidance. Support submits; Admin/Super Admin approves before publication.</p></div><button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black"><RefreshCw className="h-4 w-4" />Refresh</button></div></section>
    <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-bold"><option value="">All status</option><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="published">Published</option></select>
    {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
    {loading ? <div className="flex min-h-[320px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div> : drafts.length === 0 ? <SupportAiEmpty title="No knowledge drafts" description="A draft appears here only after a verified, human-confirmed resolved case is converted into reusable guidance." /> : <section className="grid gap-3 xl:grid-cols-2">{drafts.map((draft) => <article key={draft.draftId} className="rounded-[24px] border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">{draft.draftId} · case {draft.sourceCaseId}</p><h2 className="mt-2 text-lg font-black">{draft.title}</h2></div><SupportAiPill tone={draft.status}>{draft.status}</SupportAiPill></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{draft.summary}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black">{humanizeSupportAi(draft.confirmedCauseCode)}</span><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black">{humanizeSupportAi(draft.resolutionCode)}</span><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black">{humanizeSupportAi(draft.queue)}</span></div><div className="mt-4 flex items-center justify-between gap-3"><span className="text-[10px] font-bold text-muted-foreground">Updated {formatSupportAiDate(draft.updatedAt)}</span>{draft.status === "draft" || draft.status === "rejected" ? <button onClick={() => void submit(draft.draftId)} disabled={busy === draft.draftId} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"><Send className="h-3.5 w-3.5" />Submit for admin review</button> : null}</div>{draft.reviewNote ? <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200">Review note: {draft.reviewNote}</div> : null}</article>)}</section>}
  </div></main>;
}
