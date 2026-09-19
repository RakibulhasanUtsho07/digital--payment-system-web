"use client";

import { AdminSecurityOverview } from "@/types/adminSecurity.types";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleGauge,
  Fingerprint,
  KeyRound,
  MonitorSmartphone,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";



function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  note: string;
  tone: "violet" | "blue" | "emerald" | "amber" | "rose" | "cyan";
  index: number;
}) {
  const colors = {
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
  }[tone];

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045 }}
      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-slate-950/55"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${colors}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</span>
      </div>
      <p className="mt-4 text-xs font-extrabold text-slate-800 dark:text-slate-200">{label}</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{note}</p>
    </motion.article>
  );
}

function formatDate(value: string | null) {
  if (!value) return "No telemetry";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function SecurityOverviewPanels({ data }: { data: AdminSecurityOverview }) {
  const metrics = [
    { icon: Users, label: "Active users", value: data.metrics.activeUsers, note: "Enabled platform identities", tone: "blue" as const },
    { icon: MonitorSmartphone, label: "Active sessions", value: data.metrics.activeSessions, note: "Non-expired authenticated sessions", tone: "violet" as const },
    { icon: KeyRound, label: "MFA coverage", value: `${data.metrics.mfaCoverage}%`, note: `${data.metrics.mfaUsers} protected accounts`, tone: "emerald" as const },
    { icon: Fingerprint, label: "Passkey coverage", value: `${data.metrics.passkeyCoverage}%`, note: `${data.metrics.passkeyUsers} passkey users`, tone: "cyan" as const },
    { icon: AlertTriangle, label: "Failed sign-ins", value: data.metrics.failedLogins, note: `Within the selected ${data.range} window`, tone: "amber" as const },
    { icon: ShieldAlert, label: "Suspicious sign-ins", value: data.metrics.suspiciousLogins, note: `${data.metrics.criticalSystemEvents} critical system events`, tone: "rose" as const },
  ];
  const distribution = [
    { name: "Successful", value: data.distribution.successful, color: "#10b981" },
    { name: "Failed", value: data.distribution.failed, color: "#f59e0b" },
    { name: "Suspicious", value: data.distribution.suspicious, color: "#f43f5e" },
    { name: "Warnings", value: data.distribution.warning, color: "#8b5cf6" },
    { name: "Critical", value: data.distribution.critical, color: "#dc2626" },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric, index) => <MetricCard key={metric.label} {...metric} index={index} />)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><Activity className="h-4.5 w-4.5" /></span>
            <div><h2 className="text-sm font-black text-slate-950 dark:text-white">Authentication threat timeline</h2><p className="text-[11px] text-slate-500">Login activity from stored security events</p></div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#94a3b8" opacity={0.18} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={26} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e2e8f0", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 12 }} />
                <Line type="monotone" dataKey="successfulLogins" name="Successful" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="failedLogins" name="Failed" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="suspiciousLogins" name="Suspicious" stroke="#f43f5e" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"><CircleGauge className="h-4.5 w-4.5" /></span>
            <div><h2 className="text-sm font-black text-slate-950 dark:text-white">Event distribution</h2><p className="text-[11px] text-slate-500">Security outcome mix</p></div>
          </div>
          <div className="h-[260px]">
            {distribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={3}>
                    {distribution.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e2e8f0", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="grid h-full place-items-center text-xs text-slate-500">No events in this time range.</div>}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
          <div className="mb-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><div><h2 className="text-sm font-black text-slate-950 dark:text-white">Service health</h2><p className="text-[11px] text-slate-500">Based on the last 24 hours of system telemetry</p></div></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.services.map((service) => (
              <div key={service.service} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2.5 dark:border-white/8 dark:bg-white/[0.025]">
                <div><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{service.service}</p><p className="mt-0.5 text-[9px] text-slate-500">{service.failures}/{service.totalEvents} failures · {formatDate(service.lastEventAt)}</p></div>
                <span className={`h-2.5 w-2.5 rounded-full ${service.status === "healthy" ? "bg-emerald-500" : service.status === "attention" ? "bg-amber-500" : service.status === "critical" ? "bg-rose-500" : "bg-slate-300"}`} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/55">
          <div className="mb-4 flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-violet-600" /><div><h2 className="text-sm font-black text-slate-950 dark:text-white">Recent security events</h2><p className="text-[11px] text-slate-500">Newest monitored identity activity</p></div></div>
          <div className="space-y-2">
            {data.recentEvents.length ? data.recentEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200/70 px-3 py-2.5 dark:border-white/8">
                <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">{event.title}</p><p className="mt-1 truncate text-[10px] text-slate-500">{event.user?.name || "Unknown user"} · {event.location} · {event.maskedIp}</p></div>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${event.status === "success" ? "bg-emerald-500" : event.status === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
              </div>
            )) : <div className="grid min-h-48 place-items-center text-xs text-slate-500">No recent security events.</div>}
          </div>
        </article>
      </section>
    </div>
  );
}
