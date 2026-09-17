"use client";

import { useEffect, useState } from "react";
import { Bookmark, Star, Trash2 } from "lucide-react";
import { createAnalystSavedView, deleteAnalystSavedView, getAnalystSavedViews, updateAnalystSavedView, type AnalystSavedView } from "@/lib/api/analystApi";

const routes = [
  "/dashboard/analyst",
  "/dashboard/analyst/payments",
  "/dashboard/analyst/transactions",
  "/dashboard/analyst/conversion",
  "/dashboard/analyst/revenue",
  "/dashboard/analyst/merchants",
  "/dashboard/analyst/risk",
  "/dashboard/analyst/refunds",
  "/dashboard/analyst/disputes",
  "/dashboard/analyst/settlement",
  "/dashboard/analyst/payouts",
  "/dashboard/analyst/compliance",
];

export default function AnalystSavedViewsPage() {
  const [views, setViews] = useState<AnalystSavedView[]>([]);
  const [name, setName] = useState("");
  const [route, setRoute] = useState(routes[0]);
  const [filtersText, setFiltersText] = useState('{\n  "range": "30d",\n  "currency": "BDT"\n}');
  const [error, setError] = useState("");

  async function load() { try { setViews(await getAnalystSavedViews()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load saved views."); } }
  useEffect(() => { void load(); }, []);

  async function save() {
    try {
      setError("");
      const parsed = JSON.parse(filtersText) as Record<string, unknown>;
      await createAnalystSavedView({ name, route, filters: parsed, isDefault: false });
      setName("");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save view."); }
  }

  return <main className="space-y-6">
    <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm"><div className="flex items-center gap-3"><Bookmark className="h-6 w-6 text-primary" /><div><h1 className="text-2xl font-black">Saved Views</h1><p className="mt-1 text-sm text-muted-foreground">Save analyst route and filter presets without changing financial data.</p></div></div></section>
    <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 lg:grid-cols-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="View name" className="h-11 rounded-xl border border-border bg-background px-3 text-xs" />
      <select value={route} onChange={e => setRoute(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-xs">{routes.map(v => <option key={v} value={v}>{v}</option>)}</select>
      <button type="button" onClick={() => void save()} className="h-11 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground">Save view</button>
      <textarea value={filtersText} onChange={e => setFiltersText(e.target.value)} className="min-h-36 rounded-xl border border-border bg-background p-3 font-mono text-xs lg:col-span-3" />
    </section>
    {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-600">{error}</div>}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{views.map(view => <article key={view.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-extrabold">{view.name}</h2>{view.isDefault && <Star className="h-4 w-4 fill-current text-amber-500" />}</div><p className="mt-2 break-all text-[11px] text-muted-foreground">{view.route}</p></div><button type="button" onClick={async () => { await deleteAnalystSavedView(view.id); await load(); }} className="rounded-lg p-2 text-red-600 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></div><pre className="mt-4 overflow-auto rounded-xl bg-muted/40 p-3 text-[10px]">{JSON.stringify(view.filters, null, 2)}</pre>{!view.isDefault && <button type="button" onClick={async () => { await updateAnalystSavedView(view.id, { isDefault: true }); await load(); }} className="mt-4 w-full rounded-xl border border-border px-3 py-2 text-xs font-bold">Make default</button>}</article>)}</section>
  </main>;
}
