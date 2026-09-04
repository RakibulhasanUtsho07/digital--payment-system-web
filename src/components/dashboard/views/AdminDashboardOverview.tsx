"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Headphones,
  LayoutDashboard,
  Minus,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminOverview } from "@/hooks/useAdminOverview";
import type {
  AdminOverviewResponse,
  AttentionQueueItem,
  OverviewMetric,
  OverviewRange,
  OverviewTransaction,
  ServiceHealthItem,
  TransactionStatusBreakdown,
} from "@/types/adminOverview";

const ranges: Array<{ value: OverviewRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
];

const statusColors: Record<TransactionStatusBreakdown["status"], string> = {
  completed: "#10b981",
  pending: "#f59e0b",
  failed: "#f43f5e",
  reversed: "#64748b",
};

export default function AdminDashboardOverview() {
  const {
    data,
    range,
    loading,
    refreshing,
    exporting,
    error,
    setRange,
    refresh,
    exportReport,
  } = useAdminOverview();

  if (loading && !data) return <OverviewSkeleton />;

  if (!data) {
    return <OverviewError message={error ?? "Overview data is unavailable."} onRetry={refresh} />;
  }

  // The API can temporarily omit optional dashboard arrays while the backend
  // is being upgraded. Normalize them here as a final UI safety boundary.
  const safeData: AdminOverviewResponse = {
    ...data,
    generatedAt:
      typeof data.generatedAt === "string" && data.generatedAt
        ? data.generatedAt
        : new Date().toISOString(),
    currency:
      typeof data.currency === "string" && data.currency
        ? data.currency
        : "BDT",
    kpis: {
      totalUsers: safeMetric(data.kpis?.totalUsers),
      activeWallets: safeMetric(data.kpis?.activeWallets),
      transactionVolume: safeMetric(data.kpis?.transactionVolume),
      platformRevenue: safeMetric(data.kpis?.platformRevenue),
      pendingKyc: safeMetric(data.kpis?.pendingKyc),
      riskAlerts: safeMetric(data.kpis?.riskAlerts),
    },
    series: Array.isArray(data.series) ? data.series : [],
    transactionStatuses: Array.isArray(data.transactionStatuses)
      ? data.transactionStatuses
      : [],
    recentTransactions: Array.isArray(data.recentTransactions)
      ? data.recentTransactions
      : [],
    attentionQueue: Array.isArray(data.attentionQueue)
      ? data.attentionQueue
      : [],
    serviceHealth: Array.isArray(data.serviceHealth)
      ? data.serviceHealth
      : [],
  };

  const unhealthyServices = safeData.serviceHealth.filter(
    (service) => service.status !== "operational"
  ).length;
  const overallStatus = unhealthyServices === 0 ? "Operational" : `${unhealthyServices} service issue${unhealthyServices > 1 ? "s" : ""}`;

  return (
    <main className="space-y-5 pb-10 sm:space-y-6">
      <OverviewHeader
        generatedAt={safeData.generatedAt}
        range={range}
        refreshing={refreshing}
        exporting={exporting}
        operational={unhealthyServices === 0}
        overallStatus={overallStatus}
        onRangeChange={setRange}
        onRefresh={refresh}
        onExport={exportReport}
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="alert"
            className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span className="inline-flex items-center gap-2">
              <CircleAlert className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button type="button" onClick={refresh} className="shrink-0 font-bold hover:underline">
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <KpiGrid data={safeData} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]">
        <VolumeChart data={safeData} />
        <StatusBreakdown data={safeData} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.8fr)]">
        <RecentTransactions transactions={safeData.recentTransactions} />
        <AttentionQueue items={safeData.attentionQueue} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <ServiceHealth services={safeData.serviceHealth} />
        <QuickActions />
      </section>
    </main>
  );
}

function OverviewHeader({
  generatedAt,
  range,
  refreshing,
  exporting,
  operational,
  overallStatus,
  onRangeChange,
  onRefresh,
  onExport,
}: {
  generatedAt: string;
  range: OverviewRange;
  refreshing: boolean;
  exporting: boolean;
  operational: boolean;
  overallStatus: string;
  onRangeChange: (range: OverviewRange) => void;
  onRefresh: () => void;
  onExport: () => void;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#081d34] via-[#103b63] to-[#1e64ad] p-5 text-white shadow-[0_24px_65px_rgba(15,39,69,.18)] sm:p-7"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <motion.div
        animate={{ scale: [1, 1.16, 1], opacity: [.08, .2, .08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-300 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] text-cyan-50">
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin command center
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold ${operational ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-amber-300/25 bg-amber-300/10 text-amber-100"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${operational ? "bg-emerald-300" : "animate-pulse bg-amber-300"}`} />
              {overallStatus}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Platform overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/75">
            Monitor money movement, customer activity, verification queues and operational health from one focused workspace.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-[11px] text-blue-100/60">
            <CalendarDays className="h-3.5 w-3.5" /> Updated {formatDateTime(generatedAt)}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
          <div className="grid grid-cols-4 rounded-xl border border-white/10 bg-slate-950/15 p-1 backdrop-blur-sm">
            {ranges.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={range === item.value}
                onClick={() => onRangeChange(item.value)}
                className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${range === item.value ? "bg-white text-[#174a7e] shadow-md" : "text-blue-100 hover:bg-white/10"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <HeaderButton icon={Download} label="Export report" busy={exporting} onClick={onExport} />
            <HeaderButton icon={RefreshCw} label="Refresh data" busy={refreshing} onClick={onRefresh} primary />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function HeaderButton({ icon: Icon, label, busy, primary, onClick }: {
  icon: LucideIcon;
  label: string;
  busy: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: .98 }}
      disabled={busy}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${primary ? "border-white bg-white text-[#164a7e] hover:bg-blue-50" : "border-white/15 bg-white/10 text-white hover:bg-white/15"}`}
    >
      <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> {busy ? "Working..." : label}
    </motion.button>
  );
}

function KpiGrid({ data }: { data: AdminOverviewResponse }) {
  const cards: Array<{
    label: string;
    metric: OverviewMetric;
    icon: LucideIcon;
    tone: string;
    formatter: (value: number) => string;
  }> = [
    { label: "Total users", metric: data.kpis.totalUsers, icon: Users, tone: "bg-blue-50 text-blue-600", formatter: formatCompact },
    { label: "Active wallets", metric: data.kpis.activeWallets, icon: WalletCards, tone: "bg-emerald-50 text-emerald-600", formatter: formatCompact },
    { label: "Transaction volume", metric: data.kpis.transactionVolume, icon: ArrowLeftRight, tone: "bg-cyan-50 text-cyan-600", formatter: (value) => formatCompactCurrency(value, data.currency) },
    { label: "Platform revenue", metric: data.kpis.platformRevenue, icon: BadgeDollarSign, tone: "bg-violet-50 text-violet-600", formatter: (value) => formatCompactCurrency(value, data.currency) },
    { label: "Pending KYC", metric: data.kpis.pendingKyc, icon: ShieldCheck, tone: "bg-amber-50 text-amber-600", formatter: formatCompact },
    { label: "Risk alerts", metric: data.kpis.riskAlerts, icon: ShieldAlert, tone: "bg-rose-50 text-rose-600", formatter: formatCompact },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card, index) => (
        <motion.article
          key={card.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * .045 }}
          whileHover={{ y: -3 }}
          className="min-w-0 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,39,69,.055)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{card.label}</p>
              <p className="mt-2 truncate text-2xl font-black tracking-tight text-[#0f2745]">{card.formatter(card.metric.value)}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </span>
          </div>
          <MetricChange value={card.metric.changePercent} />
        </motion.article>
      ))}
    </section>
  );
}

function MetricChange({ value }: { value: number }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  return (
    <p className={`mt-3 inline-flex items-center gap-1 text-[11px] font-bold ${positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-slate-400"}`}>
      <Icon className="h-3.5 w-3.5" /> {Math.abs(value).toFixed(1)}% <span className="font-medium text-slate-400">vs previous period</span>
    </p>
  );
}

function VolumeChart({ data }: { data: AdminOverviewResponse }) {
  return (
    <DashboardCard title="Money movement" subtitle="Processed volume and platform revenue" icon={Activity}>
      {data.series.length ? (
        <div className="h-[300px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={.32} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={.24} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={formatChartDate} minTickGap={28} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={formatCompact} width={62} />
              <Tooltip
                contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 16px 40px rgba(15,39,69,.12)", fontSize: 12 }}
                labelFormatter={(label) => formatDateTime(String(label))}
                formatter={(value, name) => [formatCompactCurrency(Number(value), data.currency), name === "volume" ? "Volume" : "Revenue"]}
              />
              <Area type="monotone" dataKey="volume" stroke="#2563eb" strokeWidth={3} fill="url(#volumeFill)" animationDuration={900} />
              <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#revenueFill)" animationDuration={1100} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : <EmptyChart />}
    </DashboardCard>
  );
}

function StatusBreakdown({ data }: { data: AdminOverviewResponse }) {
  const total = data.transactionStatuses.reduce((sum, item) => sum + item.count, 0);
  return (
    <DashboardCard title="Transaction health" subtitle="Status distribution" icon={ShieldCheck}>
      {data.transactionStatuses.length ? (
        <div className="grid min-h-[300px] items-center gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.transactionStatuses} dataKey="count" nameKey="status" innerRadius={55} outerRadius={78} paddingAngle={3} animationDuration={900}>
                  {data.transactionStatuses.map((entry) => <Cell key={entry.status} fill={statusColors[entry.status]} stroke="transparent" />)}
                </Pie>
                <Tooltip formatter={(value) => formatCompact(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-2xl font-black text-[#0f2745]">{formatCompact(total)}</strong>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">transactions</span>
            </div>
          </div>
          <div className="space-y-2">
            {data.transactionStatuses.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="inline-flex items-center gap-2 text-xs font-semibold capitalize text-slate-600">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[item.status] }} /> {item.status}
                </span>
                <span className="text-xs font-black text-slate-800">{item.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : <EmptyChart />}
    </DashboardCard>
  );
}

function RecentTransactions({ transactions }: { transactions: OverviewTransaction[] }) {
  return (
    <DashboardCard title="Recent transactions" subtitle="Latest platform activity" icon={ArrowLeftRight} actionHref="/dashboard/all-transactions" actionLabel="View all">
      {transactions.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-[.1em] text-slate-400">
                <th className="py-3 pr-4">Reference</th><th className="py-3 pr-4">Parties</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Status</th><th className="py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-slate-100/80 text-xs last:border-0 hover:bg-slate-50/70">
                  <td className="py-3.5 pr-4 font-bold text-slate-700">{transaction.reference}</td>
                  <td className="py-3.5 pr-4"><p className="font-bold text-slate-700">{transaction.senderName}</p><p className="mt-0.5 text-[10px] text-slate-400">to {transaction.receiverName}</p></td>
                  <td className="py-3.5 pr-4 font-black text-[#0f2745]">{formatCurrency(transaction.amount, transaction.currency)}</td>
                  <td className="py-3.5 pr-4"><StatusBadge status={transaction.status} /></td>
                  <td className="py-3.5 text-slate-400">{formatRelativeTime(transaction.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState message="No recent transactions for this period." />}
    </DashboardCard>
  );
}

function AttentionQueue({ items }: { items: AttentionQueueItem[] }) {
  return (
    <DashboardCard title="Needs attention" subtitle="Priority operational queues" icon={AlertTriangle}>
      {items.length ? (
        <div className="mt-3 space-y-2.5">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-blue-200 hover:bg-blue-50/60">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${queueTone(item.severity)}`}><QueueIcon type={item.type} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-slate-800">{item.title}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{item.description}</span></span>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-700 shadow-sm">{item.count}</span>
              <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
            </Link>
          ))}
        </div>
      ) : <EmptyState message="No priority items need attention." success />}
    </DashboardCard>
  );
}

function ServiceHealth({ services }: { services: ServiceHealthItem[] }) {
  return (
    <DashboardCard title="Service health" subtitle="Live operational telemetry" icon={Server} actionHref="/dashboard/logs" actionLabel="Open logs">
      {services.length ? (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {services.map((service) => {
            const Icon = service.status === "operational" ? CheckCircle2 : service.status === "degraded" ? AlertTriangle : XCircle;
            return (
              <div key={service.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <Icon className={`h-5 w-5 shrink-0 ${service.status === "operational" ? "text-emerald-500" : service.status === "degraded" ? "text-amber-500" : "text-rose-500"}`} />
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-slate-800">{service.name}</p><p className="mt-1 text-[10px] capitalize text-slate-400">{service.status} · {service.latencyMs}ms</p></div>
                <span className="text-[11px] font-black text-slate-600">{service.uptimePercent.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      ) : <EmptyState message="Health telemetry is unavailable." />}
    </DashboardCard>
  );
}

function QuickActions() {
  const actions = [
    { label: "Review KYC requests", href: "/dashboard/kyc-requests", icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Manage system users", href: "/dashboard/users", icon: UserCheck, tone: "bg-blue-50 text-blue-600" },
    { label: "Investigate risk alerts", href: "/dashboard/security", icon: ShieldAlert, tone: "bg-rose-50 text-rose-600" },
    { label: "Open support queue", href: "/dashboard/support", icon: Headphones, tone: "bg-violet-50 text-violet-600" },
  ];
  return (
    <DashboardCard title="Quick actions" subtitle="Jump to common admin tasks" icon={LayoutDashboard}>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${action.tone}`}><action.icon className="h-4 w-4" /></span>
            <span className="flex-1 text-xs font-bold text-slate-700">{action.label}</span><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}

function DashboardCard({ title, subtitle, icon: Icon, children, actionHref, actionLabel }: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_8px_35px_rgba(15,39,69,.055)] sm:p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span><div className="min-w-0"><h2 className="text-sm font-black text-[#0f2745]">{title}</h2><p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p></div></div>
        {actionHref && actionLabel && <Link href={actionHref} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">{actionLabel}<ChevronRight className="h-3.5 w-3.5" /></Link>}
      </header>
      {children}
    </motion.article>
  );
}

function StatusBadge({ status }: { status: OverviewTransaction["status"] }) {
  const styles: Record<OverviewTransaction["status"], string> = {
    completed: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    failed: "bg-rose-50 text-rose-700",
    reversed: "bg-slate-100 text-slate-600",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize ${styles[status]}`}>{status}</span>;
}

function QueueIcon({ type }: { type: AttentionQueueItem["type"] }) {
  const icons = { kyc: ShieldCheck, risk: ShieldAlert, support: Headphones, transaction: ArrowLeftRight };
  const Icon = icons[type];
  return <Icon className="h-5 w-5" />;
}

function queueTone(severity: AttentionQueueItem["severity"]) {
  if (severity === "high") return "bg-rose-50 text-rose-600";
  if (severity === "medium") return "bg-amber-50 text-amber-600";
  return "bg-blue-50 text-blue-600";
}

function EmptyChart() { return <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">No analytics data for this period.</div>; }

function EmptyState({ message, success = false }: { message: string; success?: boolean }) {
  const Icon = success ? CheckCircle2 : Clock3;
  return <div className="mt-4 flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center"><Icon className={`h-6 w-6 ${success ? "text-emerald-500" : "text-slate-300"}`} /><p className="mt-2 text-xs font-semibold text-slate-400">{message}</p></div>;
}

function OverviewSkeleton() {
  return <div className="space-y-5 pb-10"><div className="h-56 animate-pulse rounded-[28px] bg-slate-200" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-[20px] bg-slate-200" />)}</div><div className="grid gap-5 xl:grid-cols-[1.65fr_.75fr]"><div className="h-[390px] animate-pulse rounded-[24px] bg-slate-200" /><div className="h-[390px] animate-pulse rounded-[24px] bg-slate-200" /></div></div>;
}

function OverviewError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-rose-100 bg-white p-8 text-center shadow-sm"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><CircleAlert className="h-7 w-7" /></span><h1 className="mt-4 text-xl font-black text-[#0f2745]">Could not load overview</h1><p className="mt-2 max-w-md text-sm text-slate-500">{message}</p><button type="button" onClick={onRetry} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"><RefreshCw className="h-4 w-4" />Try again</button></div>;
}

function safeMetric(metric: OverviewMetric | null | undefined): OverviewMetric {
  return {
    value: finiteNumber(metric?.value),
    previousValue: finiteNumber(metric?.previousValue),
    changePercent: finiteNumber(metric?.changePercent),
  };
}

function finiteNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatCompact(value: number) { return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatCurrency(value: number, currency: string) { return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
function formatCompactCurrency(value: number, currency: string) { return new Intl.NumberFormat("en-BD", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatChartDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date); }
function formatDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "just now" : new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function formatRelativeTime(value: string) { const milliseconds = Date.now() - new Date(value).getTime(); if (!Number.isFinite(milliseconds)) return "—"; const minutes = Math.floor(milliseconds / 60_000); if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; }
