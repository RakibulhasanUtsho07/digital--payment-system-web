"use client";

import { useEffect, useState } from "react";
import { Download, FileDown, RefreshCcw } from "lucide-react";
import { downloadAnalystReportCsv, getAnalystReports, type AnalystReportSummary } from "@/lib/api/analystApi";

export default function AnalystExportsPage() {
  const [reports, setReports] = useState<AnalystReportSummary[]>([]);
  const [error, setError] = useState("");
  async function load() { try { setError(""); setReports(await getAnalystReports()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load export history."); } }
  useEffect(() => { void load(); }, []);
  return <main className="space-y-6">
    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><FileDown className="h-6 w-6 text-primary" /><div><h1 className="text-2xl font-black">Export History</h1><p className="mt-1 text-sm text-muted-foreground">Download analyst-owned report CSV files until expiry.</p></div></div><button type="button" onClick={() => void load()} className="rounded-xl border border-border p-3"><RefreshCcw className="h-4 w-4" /></button></div></section>
    {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-600">{error}</div>}
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-xs"><thead><tr className="text-left text-[10px] uppercase text-muted-foreground"><th className="border-b border-border px-3 py-3">Report</th><th className="border-b border-border px-3 py-3">Status</th><th className="border-b border-border px-3 py-3">Created</th><th className="border-b border-border px-3 py-3">Expires</th><th className="border-b border-border px-3 py-3 text-right">Download</th></tr></thead><tbody>{reports.map(report => <tr key={report.id}><td className="border-b border-border/60 px-3 py-3 font-bold">{report.format} · {report.range} · {report.currency}</td><td className="border-b border-border/60 px-3 py-3">{report.status}</td><td className="border-b border-border/60 px-3 py-3">{new Date(report.createdAt).toLocaleString()}</td><td className="border-b border-border/60 px-3 py-3">{new Date(report.expiresAt).toLocaleString()}</td><td className="border-b border-border/60 px-3 py-3 text-right"><button type="button" disabled={report.status !== "ready"} onClick={() => void downloadAnalystReportCsv(report.id)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-bold disabled:opacity-40"><Download className="h-3.5 w-3.5" />CSV</button></td></tr>)}</tbody></table></div></section>
  </main>;
}
