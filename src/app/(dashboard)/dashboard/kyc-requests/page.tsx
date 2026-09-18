"use client";
/* eslint-disable @next/next/no-img-element -- private signed KYC URLs are short-lived */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Eye,
  Fingerprint, Image as ImageIcon, Loader2, Phone, RefreshCcw, Search,
  ShieldCheck, UserRoundCheck, Video, X, XCircle,
} from "lucide-react";

import {
  decideAdminEKYC, getAdminEKYCDetails, getAdminEKYCDocuments,
  getAdminEKYCList, getAdminEKYCOverview, rerunAdminEKYC,
} from "@/lib/api/ekycApi";
import type {
  AdminEKYCVerification, EKYCAuditItem, EKYCDocuments, EKYCOverview, EKYCStatus,
} from "@/types/ekyc";

const FILTERS: Array<{ label: string; value?: EKYCStatus }> = [
  { label: "All" },
  { label: "Manual review", value: "PENDING_MANUAL_REVIEW" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
];

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "The request could not be completed.";

function statusStyle(status: EKYCStatus): string {
  if (status === "VERIFIED") return "bg-emerald-100 text-emerald-700";
  if (status === "REJECTED") return "bg-rose-100 text-rose-700";
  if (status === "PENDING_MANUAL_REVIEW") return "bg-amber-100 text-amber-800";
  return "bg-indigo-100 text-indigo-700";
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><ShieldCheck className="h-5 w-5" /></span><p className="mt-5 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p></div>;
}

function Score({ label, value }: { label: string; value: number | null | undefined }) {
  const normalized = typeof value === "number" ? Math.round(value) : null;
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-slate-900">{normalized === null ? "Not available" : `${normalized}%`}</p></div>;
}

export default function AdminEkycPage() {
  const [overview, setOverview] = useState<EKYCOverview | null>(null);
  const [records, setRecords] = useState<AdminEKYCVerification[]>([]);
  const [filter, setFilter] = useState<EKYCStatus | undefined>("PENDING_MANUAL_REVIEW");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<AdminEKYCVerification | null>(null);
  const [audit, setAudit] = useState<EKYCAuditItem[]>([]);
  const [documents, setDocuments] = useState<EKYCDocuments | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [summary, list] = await Promise.all([
        getAdminEKYCOverview(),
        getAdminEKYCList({ status: filter, search, page, limit: 20 }),
      ]);
      setOverview(summary); setRecords(list.verifications); setTotalPages(list.pagination.totalPages);
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setLoading(false); }
  }, [filter, page, search]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);

  async function openRecord(record: AdminEKYCVerification) {
    setSelected(record); setDocuments(null); setAudit([]); setReason(""); setAction(null); setDetailLoading(true); setError("");
    try {
      const [detail, privateDocuments] = await Promise.all([
        getAdminEKYCDetails(record.id), getAdminEKYCDocuments(record.id),
      ]);
      setSelected(detail.verification); setAudit(detail.audit); setDocuments(privateDocuments);
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setDetailLoading(false); }
  }

  async function saveDecision() {
    if (!selected || !action) return;
    if (reason.trim().length < 10) return setError("Enter a review reason with at least 10 characters.");
    setSaving(true); setError("");
    try {
      await decideAdminEKYC(selected.id, action, reason);
      setSelected(null); await load();
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setSaving(false); }
  }

  async function rerun() {
    if (!selected) return;
    setSaving(true); setError("");
    try { await rerunAdminEKYC(selected.id); setSelected(null); await load(); }
    catch (requestError) { setError(messageOf(requestError)); }
    finally { setSaving(false); }
  }

  const metrics = useMemo(() => overview ? [
    ["Manual review", overview.manualReview, "bg-amber-100 text-amber-700"],
    ["Processing", overview.processing + overview.queued, "bg-indigo-100 text-indigo-700"],
    ["Verified", overview.verified, "bg-emerald-100 text-emerald-700"],
    ["Rejected", overview.rejected, "bg-rose-100 text-rose-700"],
  ] as const : [], [overview]);

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-7 sm:px-7">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-indigo-600">Compliance operations</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Advanced e-KYC review</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Every automated result remains pending until an authorized administrator records a manual decision.</p></div>
          <button onClick={() => void load()} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm"><RefreshCcw className="h-4 w-4" /> Refresh queue</button>
        </header>

        {error && <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, tone]) => <Metric key={label} label={label} value={value} tone={tone} />)}
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">{FILTERS.map((item) => <button key={item.label} onClick={() => { setFilter(item.value); setPage(1); }} className={`rounded-full px-4 py-2 text-xs font-black ${filter === item.value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>{item.label}</button>)}</div>
            <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 lg:w-80"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search applicant name" /></label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-black uppercase tracking-widest text-slate-400"><th className="px-6 py-4">Applicant</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Face</th><th className="px-4 py-4">Liveness</th><th className="px-4 py-4">Phone / device</th><th className="px-4 py-4">Submitted</th><th className="px-6 py-4 text-right">Review</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" /></td></tr> : records.length === 0 ? <tr><td colSpan={7} className="py-20 text-center text-sm font-semibold text-slate-500">No e-KYC records match this filter.</td></tr> : records.map((record) => <tr key={record.id} className="border-b border-slate-100 text-sm hover:bg-indigo-50/30"><td className="px-6 py-4"><p className="font-black text-slate-900">{record.user.name}</p><p className="mt-1 text-xs text-slate-500">{record.user.id}</p></td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusStyle(record.status)}`}>{record.status.replaceAll("_", " ")}</span></td><td className="px-4 py-4 font-bold text-slate-700">{record.faceScore === null ? "—" : `${Math.round(record.faceScore)}%`}</td><td className="px-4 py-4">{record.livenessPassed === true ? <span className="font-bold text-emerald-700">Passed</span> : record.livenessPassed === false ? <span className="font-bold text-rose-700">Flagged</span> : "—"}</td><td className="px-4 py-4"><p className="text-xs font-bold text-slate-700">{record.phoneVerifiedAt ? "Phone verified" : "Phone unavailable"}</p><p className="mt-1 text-xs text-slate-500">{record.deviceBiometricVerified ? "WebAuthn verified" : "Biometric skipped"}</p></td><td className="px-4 py-4 text-xs text-slate-500">{record.submittedAt ? new Date(record.submittedAt).toLocaleString() : "—"}</td><td className="px-6 py-4 text-right"><button onClick={() => void openRecord(record)} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white"><Eye className="mr-2 inline h-4 w-4" />Open</button></td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-5"><p className="text-xs font-bold text-slate-500">Page {page} of {totalPages}</p><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-xl border p-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-xl border p-2 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <aside className="absolute inset-y-0 right-0 w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 p-5 backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Manual review</p>
                <h2 className="mt-1 text-xl font-black">{selected.user.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-xl border p-2" aria-label="Close review">
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="grid min-h-[70vh] place-items-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-6 p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-4 py-2 text-xs font-black ${statusStyle(selected.status)}`}>
                    {selected.status.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold">
                    Case {selected.id}
                  </span>
                </div>

                {selected.identity && (
                  <section>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
                      Submitted identity
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        ["NID full name", selected.identity.claimedName],
                        ["NID number", selected.identity.nid],
                        ["Date of birth", selected.identity.dateOfBirth],
                        ["Verified phone", selected.identity.verifiedPhone],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                          <p className="mt-2 break-words text-sm font-black text-slate-900">{value || "Not available"}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Evidence signals</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Score label="Face match" value={selected.faceScore} />
                    <Score label="Face quality" value={selected.faceQualityScore} />
                    <Score label="Name match" value={selected.nameScore} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border p-4">
                      <UserRoundCheck className={`h-5 w-5 ${selected.livenessPassed ? "text-emerald-600" : "text-amber-600"}`} />
                      <p className="mt-3 text-sm font-black">
                        Liveness {selected.livenessPassed ? "passed" : "needs review"}
                      </p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <Phone className="h-5 w-5 text-indigo-600" />
                      <p className="mt-3 text-sm font-black">
                        Phone {selected.phoneVerifiedAt ? "verified" : "not recorded"}
                      </p>
                    </div>
                    <div className="rounded-2xl border p-4">
                      <Fingerprint className="h-5 w-5 text-violet-600" />
                      <p className="mt-3 text-sm font-black">
                        {selected.deviceBiometricVerified ? "WebAuthn verified" : "Biometric optional / skipped"}
                      </p>
                    </div>
                  </div>
                  {selected.reasonCodes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.reasonCodes.map((code) => (
                        <span key={code} className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-800">
                          {code.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Private documents</h3>
                  {documents ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        ["NID front", documents.nidFrontUrl],
                        ["NID back", documents.nidBackUrl],
                        ["Selfie", documents.selfieUrl],
                      ].map(([label, url]) => (
                        <a key={label} href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border">
                          <div className="aspect-video overflow-hidden bg-slate-100">
                            <img src={url} alt={label} className="h-full w-full object-contain transition group-hover:scale-[1.02]" />
                          </div>
                          <p className="flex items-center gap-2 p-3 text-xs font-black">
                            <ImageIcon className="h-4 w-4" />
                            {label}
                          </p>
                        </a>
                      ))}
                      {documents.livenessVideoUrl && (
                        <a
                          href={documents.livenessVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border p-5 text-sm font-black"
                        >
                          <Video className="mb-3 h-6 w-6 text-indigo-600" />
                          Open liveness recording
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Documents unavailable.</p>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Audit trail</h3>
                  <div className="mt-3 space-y-2">
                    {audit.map((item) => (
                      <div key={item._id} className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3 text-xs">
                        <span className="font-black">{item.eventType.replaceAll("_", " ")}</span>
                        <span className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {selected.status === "PENDING_MANUAL_REVIEW" && (
                  <section className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
                    <h3 className="font-black text-indigo-950">Record manual decision</h3>
                    <p className="mt-1 text-xs leading-5 text-indigo-800">
                      Review both NID images, selfie, liveness video, automated signals, and audit events before deciding.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => setAction("VERIFIED")}
                        className={`rounded-2xl border p-4 text-left ${action === "VERIFIED" ? "border-emerald-500 bg-emerald-100" : "bg-white"}`}
                      >
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <b className="mt-2 block">Approve</b>
                      </button>
                      <button
                        onClick={() => setAction("REJECTED")}
                        className={`rounded-2xl border p-4 text-left ${action === "REJECTED" ? "border-rose-500 bg-rose-100" : "bg-white"}`}
                      >
                        <XCircle className="h-5 w-5 text-rose-600" />
                        <b className="mt-2 block">Reject</b>
                      </button>
                    </div>
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className="mt-3 min-h-28 w-full rounded-2xl border bg-white p-4 text-sm outline-none focus:border-indigo-500"
                      placeholder="Required review reason (minimum 10 characters)"
                    />
                    <div className="mt-3 flex flex-wrap justify-between gap-3">
                      <button disabled={saving} onClick={() => void rerun()} className="rounded-xl border bg-white px-4 py-2.5 text-xs font-black">
                        <RefreshCcw className="mr-2 inline h-4 w-4" />
                        Re-run checks
                      </button>
                      <button
                        disabled={saving || !action || reason.trim().length < 10}
                        onClick={() => void saveDecision()}
                        className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black text-white disabled:opacity-40"
                      >
                        {saving && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
                        Save admin decision
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
