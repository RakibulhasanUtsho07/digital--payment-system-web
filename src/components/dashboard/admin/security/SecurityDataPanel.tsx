"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AdminIdentityRisk, AdminSecurityAudit, AdminSecurityEvent, AdminSecurityPolicies, AdminSecurityRisk, AdminSecuritySession, PaginationMeta } from "@/types/adminSecurity.types";
import { getAdminIdentityRisk, getAdminSecurityAudit, getAdminSecurityEvents, getAdminSecurityPolicies, getAdminSecuritySessions } from "@/lib/api/adminSecurityApi";
import { isApiAbortError } from "@/lib/api/client";




export type SecurityDataTab = "events" | "sessions" | "identities" | "policies" | "audit";

const emptyPagination: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 1 };

function dateTime(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function RiskBadge({ risk }: { risk: AdminSecurityRisk }) {
  const classes = risk === "high"
    ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20"
    : risk === "medium"
      ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ring-1 ${classes}`}>{risk}</span>;
}

function BooleanState({ value, label }: { value: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${value ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      {value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}{label}
    </span>
  );
}

export default function SecurityDataPanel({ tab, refreshNonce }: { tab: SecurityDataTab; refreshNonce: number }) {
  const [events, setEvents] = useState<AdminSecurityEvent[]>([]);
  const [sessions, setSessions] = useState<AdminSecuritySession[]>([]);
  const [identities, setIdentities] = useState<AdminIdentityRisk[]>([]);
  const [audit, setAudit] = useState<AdminSecurityAudit[]>([]);
  const [policies, setPolicies] = useState<AdminSecurityPolicies | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>(emptyPagination);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        if (tab === "events") {
          const response = await getAdminSecurityEvents({ page, limit: 20, status: filter || undefined, search: search || undefined });
          if (!cancelled) { setEvents(response.events); setPagination(response.pagination); }
        } else if (tab === "sessions") {
          const response = await getAdminSecuritySessions({ page, limit: 20, risk: filter || undefined, search: search || undefined });
          if (!cancelled) { setSessions(response.sessions); setPagination(response.pagination); }
        } else if (tab === "identities") {
          const response = await getAdminIdentityRisk({ page, limit: 20, risk: filter || undefined, search: search || undefined });
          if (!cancelled) { setIdentities(response.identities); setPagination(response.pagination); }
        } else if (tab === "audit") {
          const response = await getAdminSecurityAudit({ page, limit: 20, search: search || undefined });
          if (!cancelled) { setAudit(response.audit); setPagination(response.pagination); }
        } else {
          const response = await getAdminSecurityPolicies();
          if (!cancelled) { setPolicies(response.policies); setPagination(emptyPagination); }
        }
      } catch (requestError) {
        if (!cancelled && !isApiAbortError(requestError)) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load security records.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [tab, page, filter, search, refreshNonce]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const hasFilter = tab === "events" || tab === "sessions" || tab === "identities";

  if (loading) {
    return <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/55"><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-violet-600" />Loading verified platform data…</div></div>;
  }

  if (error) {
    return <div className="flex min-h-48 items-center justify-center rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/20 dark:bg-rose-500/5"><div><AlertCircle className="mx-auto h-6 w-6 text-rose-500" /><p className="mt-3 text-sm font-black text-rose-800 dark:text-rose-300">Could not load security records</p><p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/70">{error}</p></div></div>;
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/55">
      {tab !== "policies" && (
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={submitSearch} className="flex w-full max-w-lg items-center gap-2">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search visible security records…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.03]" /></div>
            <button className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500">Search</button>
          </form>
          {hasFilter && (
            <select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
              <option value="">All {tab === "events" ? "statuses" : "risk levels"}</option>
              {tab === "events" ? <><option value="success">Success</option><option value="warning">Warning</option><option value="info">Info</option></> : <><option value="high">High risk</option><option value="medium">Medium risk</option><option value="low">Low risk</option></>}
            </select>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        {tab === "events" && (
          <table className="w-full min-w-[900px] text-left"><thead><tr className="bg-slate-50/80 text-[9px] uppercase tracking-widest text-slate-500 dark:bg-white/[0.025]"><th className="px-5 py-3">Event</th><th className="px-5 py-3">Identity</th><th className="px-5 py-3">Context</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Time</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">{events.map((event) => <tr key={event.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="text-xs font-extrabold text-slate-900 dark:text-white">{event.title}</p><p className="mt-1 max-w-sm truncate text-[10px] text-slate-500">{event.eventType} · {event.detail}</p></td><td className="px-5 py-4"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{event.user?.name || "Unknown user"}</p><p className="text-[10px] text-slate-500">{event.user?.role || "unavailable"}</p></td><td className="px-5 py-4 text-[10px] text-slate-500">{event.device}<br />{event.location} · {event.maskedIp}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${event.status === "success" ? "bg-emerald-50 text-emerald-700" : event.status === "warning" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{event.status}</span></td><td className="px-5 py-4 text-[10px] text-slate-500">{dateTime(event.createdAt)}</td></tr>)}</tbody></table>
        )}

        {tab === "sessions" && (
          <table className="w-full min-w-[900px] text-left"><thead><tr className="bg-slate-50/80 text-[9px] uppercase tracking-widest text-slate-500 dark:bg-white/[0.025]"><th className="px-5 py-3">Identity</th><th className="px-5 py-3">Device</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Risk</th><th className="px-5 py-3">Last active</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">{sessions.map((session) => <tr key={session.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="text-xs font-extrabold text-slate-900 dark:text-white">{session.user?.name || "Unknown user"}</p><p className="text-[10px] text-slate-500">{session.user?.role || "unavailable"}</p></td><td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">{session.device}<p className="mt-1 text-[10px] font-normal text-slate-500">{session.browser} · {session.os}</p></td><td className="px-5 py-4 text-[10px] text-slate-500">{session.location}<br />{session.maskedIp}</td><td className="px-5 py-4"><RiskBadge risk={session.risk} /></td><td className="px-5 py-4 text-[10px] text-slate-500">{dateTime(session.lastActiveAt)}<br />Expires {dateTime(session.expiresAt)}</td></tr>)}</tbody></table>
        )}

        {tab === "identities" && (
          <table className="w-full min-w-[980px] text-left"><thead><tr className="bg-slate-50/80 text-[9px] uppercase tracking-widest text-slate-500 dark:bg-white/[0.025]"><th className="px-5 py-3">Identity</th><th className="px-5 py-3">Security controls</th><th className="px-5 py-3">Sessions</th><th className="px-5 py-3">Risk</th><th className="px-5 py-3">Risk signals</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">{identities.map((identity) => <tr key={identity.id} className="align-top hover:bg-slate-50/70 dark:hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="text-xs font-extrabold text-slate-900 dark:text-white">{identity.name}</p><p className="text-[10px] text-slate-500">{identity.role}</p></td><td className="px-5 py-4"><div className="flex flex-col gap-1.5"><BooleanState value={identity.emailVerified} label="Email" /><BooleanState value={identity.mfaEnabled} label="MFA" /><BooleanState value={identity.passkeyEnabled} label="Passkey" /></div></td><td className="px-5 py-4 text-xs font-black text-slate-800 dark:text-slate-200">{identity.activeSessions}</td><td className="px-5 py-4"><RiskBadge risk={identity.risk} /></td><td className="max-w-md px-5 py-4 text-[10px] leading-5 text-slate-500">{identity.riskReasons.length ? identity.riskReasons.join(" · ") : "No baseline risks found"}</td></tr>)}</tbody></table>
        )}

        {tab === "audit" && (
          <table className="w-full min-w-[900px] text-left"><thead><tr className="bg-slate-50/80 text-[9px] uppercase tracking-widest text-slate-500 dark:bg-white/[0.025]"><th className="px-5 py-3">Action</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Safe metadata</th><th className="px-5 py-3">Time</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">{audit.map((item) => <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.025]"><td className="px-5 py-4 text-xs font-extrabold text-slate-900 dark:text-white">{item.action}</td><td className="px-5 py-4"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.actor?.name || "Unknown actor"}</p><p className="text-[10px] text-slate-500">{item.actor?.role || "unavailable"} · {item.maskedIp}</p></td><td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{item.resource}</td><td className="px-5 py-4 text-[10px] text-slate-500">{item.metadataSummary}</td><td className="px-5 py-4 text-[10px] text-slate-500">{dateTime(item.createdAt)}</td></tr>)}</tbody></table>
        )}
      </div>

      {tab === "policies" && policies && (
        <div className="p-5">
          <div className="flex flex-col gap-4 rounded-2xl bg-[linear-gradient(135deg,#110d24_0%,#201447_52%,#4b2d83_100%)] p-5 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-200">Read-only policy mirror</p><h2 className="mt-2 text-xl font-black">Platform security policy</h2><p className="mt-1 text-xs text-violet-100/70">Revision {policies.revision} · Updated {dateTime(policies.updatedAt)}</p></div><Link href="/dashboard/admin/settings" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-violet-900 transition hover:bg-violet-50"><Settings className="h-4 w-4" />Open controlled settings</Link></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PolicyCard title="Required MFA" value={policies.security.requireMfa ? "Enabled" : "Disabled"} secure={policies.security.requireMfa} />
            <PolicyCard title="Session timeout" value={`${policies.security.sessionTimeoutMins} minutes`} secure={policies.security.sessionTimeoutMins <= 60} />
            <PolicyCard title="Maximum login attempts" value={String(policies.security.maxLoginAttempts)} secure={policies.security.maxLoginAttempts <= 5} />
            <PolicyCard title="Sensitive-action reauth" value={policies.security.requireReauthForSensitiveActions ? "Required" : "Disabled"} secure={policies.security.requireReauthForSensitiveActions} />
            <PolicyCard title="High-value KYC" value={policies.risk.requireKycForHighValue ? "Required" : "Disabled"} secure={policies.risk.requireKycForHighValue} />
            <PolicyCard title="Daily transfer limit" value={`৳${policies.risk.dailyTransferLimit.toLocaleString()}`} secure />
            <PolicyCard title="Risk review threshold" value={`৳${policies.risk.reviewThreshold.toLocaleString()}`} secure />
            <PolicyCard title="Velocity window" value={`${policies.risk.maxTransfersPerWindow} / ${policies.risk.velocityWindowMinutes}m`} secure={policies.risk.maxTransfersPerWindow <= 10} />
          </div>
        </div>
      )}

      {tab !== "policies" && pagination.total === 0 && <div className="grid min-h-56 place-items-center border-t border-slate-100 text-xs text-slate-500 dark:border-white/[0.06]">No matching security records.</div>}
      {tab !== "policies" && pagination.total > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 dark:border-white/10"><p className="text-[10px] text-slate-500">{pagination.total.toLocaleString()} records · Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30 dark:border-white/10"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} disabled={page >= pagination.totalPages} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30 dark:border-white/10"><ChevronRight className="h-4 w-4" /></button></div></div>
      )}
    </section>
  );
}

function PolicyCard({ title, value, secure }: { title: string; value: string; secure: boolean }) {
  return <article className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p><p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{value}</p></div><span className={`grid h-8 w-8 place-items-center rounded-lg ${secure ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{secure ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}</span></div></article>;
}
