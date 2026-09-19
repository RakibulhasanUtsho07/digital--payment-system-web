"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  FileClock,
  Fingerprint,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  ScrollText,
  Shield,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SecurityDataPanel, { SecurityDataTab } from "@/components/dashboard/admin/security/SecurityDataPanel";
import { AdminSecurityRange } from "@/types/adminSecurity.types";
import { useAdminSecurity } from "@/hooks/useAdminSecurity";
import SecurityOverviewPanels from "@/components/dashboard/admin/security/SecurityOverviewPanels";



type SecurityTab = "overview" | SecurityDataTab;

const ranges: AdminSecurityRange[] = ["24h", "7d", "30d", "90d"];
const tabs: { value: SecurityTab; label: string; icon: LucideIcon }[] = [
  { value: "overview", label: "Overview", icon: Activity },
  { value: "events", label: "Events", icon: ShieldCheck },
  { value: "sessions", label: "Sessions", icon: MonitorSmartphone },
  { value: "identities", label: "Identity risk", icon: UsersRound },
  { value: "policies", label: "Policies", icon: ScrollText },
  { value: "audit", label: "Audit trail", icon: FileClock },
];

function formatGeneratedAt(value?: string) {
  if (!value) return "Waiting for live telemetry";
  return `Updated ${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))}`;
}

export default function AdminSecurityPage() {
  const [range, setRange] = useState<AdminSecurityRange>("7d");
  const [tab, setTab] = useState<SecurityTab>("overview");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const { data, loading, error, refresh } = useAdminSecurity(range);

  function refreshAll() {
    refresh();
    setRefreshNonce((value) => value + 1);
  }

  return (
    <main className="min-h-full px-4 py-5 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0d091b_0%,#1a1038_44%,#432674_78%,#5b3194_100%)] p-6 text-white shadow-[0_24px_70px_rgba(47,28,91,0.22)] sm:p-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-100"><Shield className="h-3.5 w-3.5" />Admin security center</span>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] ${data?.posture.status === "healthy" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : data?.posture.status === "critical" ? "border-rose-300/20 bg-rose-400/10 text-rose-200" : "border-amber-300/20 bg-amber-400/10 text-amber-200"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{data?.posture.label || "Loading posture"}</span>
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">System Security Command Center</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100/70">Monitor authentication threats, identity posture, active sessions, security controls and the audit trail from one protected admin workspace.</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-[10px] font-bold text-violet-100/60"><span className="inline-flex items-center gap-1.5"><Fingerprint className="h-3.5 w-3.5 text-emerald-300" />Sensitive credentials are never exposed</span><span>{formatGeneratedAt(data?.generatedAt)}</span></div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex rounded-xl border border-white/12 bg-white/8 p-1">
                {ranges.map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-2 text-[10px] font-black transition ${range === item ? "bg-white text-violet-950 shadow-sm" : "text-violet-100/70 hover:bg-white/8 hover:text-white"}`}>{item}</button>)}
              </div>
              <button onClick={refreshAll} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-violet-950 shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh data</button>
            </div>
          </div>
        </motion.section>

        <nav className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
          <div className="flex min-w-max gap-1">
            {tabs.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setTab(value)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black transition ${tab === value ? "bg-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.22)]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.05] dark:hover:text-white"}`}><Icon className="h-4 w-4" />{label}</button>)}
          </div>
        </nav>

        {tab === "overview" ? (
          loading && !data ? (
            <div className="grid min-h-[420px] place-items-center rounded-[24px] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/55"><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-violet-600" />Loading security telemetry…</div></div>
          ) : error && !data ? (
            <div className="grid min-h-56 place-items-center rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-500/20 dark:bg-rose-500/5"><div><AlertCircle className="mx-auto h-7 w-7 text-rose-500" /><p className="mt-3 text-sm font-black text-rose-800 dark:text-rose-300">Security overview unavailable</p><p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/70">{error}</p><button onClick={refreshAll} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Try again</button></div></div>
          ) : data ? <SecurityOverviewPanels data={data} /> : null
        ) : <SecurityDataPanel key={tab} tab={tab} refreshNonce={refreshNonce} />}
      </div>
    </main>
  );
}
