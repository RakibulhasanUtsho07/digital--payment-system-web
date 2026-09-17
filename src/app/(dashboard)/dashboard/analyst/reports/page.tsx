"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileBarChart, RefreshCcw } from "lucide-react";
import {
  createAnalystReport,
  downloadAnalystReportCsv,
  getAnalystReports,
  type AnalystMode,
  type AnalystRange,
  type AnalystReportFormat,
  type AnalystReportSummary,
} from "@/lib/api/analystApi";

export default function AnalystReportsPage() {
  const [reports, setReports] = useState<AnalystReportSummary[]>([]);
  const [range, setRange] = useState<AnalystRange>("30d");
  const [mode, setMode] = useState<AnalystMode>("all");
  const [currency, setCurrency] = useState("BDT");
  const [format, setFormat] = useState<AnalystReportFormat>("executive");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setError(""); setReports(await getAnalystReports()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load reports."); }
  }, []);
  useEffect(() => {
    const timerId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timerId);
  }, [load]);

  async function generate() {
    try {
      setLoading(true); setError("");
      await createAnalystReport({ range, mode, currency: currency.trim().toUpperCase(), format });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create report."); }
    finally { setLoading(false); }
  }

  return <main className="space-y-6">
    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm"><div className="flex items-center gap-3"><FileBarChart className="h-6 w-6 text-primary" /><div><h1 className="text-2xl font-black">Report Builder</h1><p className="mt-1 text-sm text-muted-foreground">Generate analyst-owned reports from verified Analyst Overview data.</p></div></div></section>

    <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-5">
      <select value={range} onChange={e => setRange(e.target.value as AnalystRange)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold">{["24h","7d","30d","90d"].map(v => <option key={v}>{v}</option>)}</select>
      <select value={mode} onChange={e => setMode(e.target.value as AnalystMode)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold">{["all","live","test"].map(v => <option key={v}>{v}</option>)}</select>
      <input value={currency} onChange={e => setCurrency(e.target.value.replace(/[^a-z]/gi, "").slice(0,3).toUpperCase())} className="h-11 rounded-xl border border-border bg-background px-3 text-center text-xs font-black" />
      <select value={format} onChange={e => setFormat(e.target.value as AnalystReportFormat)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold">{["executive","payments","risk","revenue"].map(v => <option key={v}>{v}</option>)}</select>
      <button type="button" disabled={loading} onClick={() => void generate()} className="h-11 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground disabled:opacity-50">{loading ? "Generating..." : "Generate report"}</button>
    </section>

    {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-600">{error}</div>}

    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-extrabold">Recent reports</h2><button type="button" onClick={() => void load()} className="rounded-xl border border-border p-2"><RefreshCcw className="h-4 w-4" /></button></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-xs"><thead><tr className="text-left text-[10px] uppercase text-muted-foreground"><th className="border-b border-border px-3 py-3">Format</th><th className="border-b border-border px-3 py-3">Range</th><th className="border-b border-border px-3 py-3">Mode</th><th className="border-b border-border px-3 py-3">Currency</th><th className="border-b border-border px-3 py-3">Status</th><th className="border-b border-border px-3 py-3">Created</th><th className="border-b border-border px-3 py-3 text-right">Export</th></tr></thead><tbody>{reports.map(report => <tr key={report.id}><td className="border-b border-border/60 px-3 py-3 font-bold capitalize">{report.format}</td><td className="border-b border-border/60 px-3 py-3">{report.range}</td><td className="border-b border-border/60 px-3 py-3">{report.mode}</td><td className="border-b border-border/60 px-3 py-3">{report.currency}</td><td className="border-b border-border/60 px-3 py-3 font-bold">{report.status}</td><td className="border-b border-border/60 px-3 py-3">{new Date(report.createdAt).toLocaleString()}</td><td className="border-b border-border/60 px-3 py-3 text-right"><button type="button" disabled={report.status !== "ready"} onClick={() => void downloadAnalystReportCsv(report.id)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-bold disabled:opacity-40"><Download className="h-3.5 w-3.5" />CSV</button></td></tr>)}</tbody></table></div>
    </section>
  </main>;
}
