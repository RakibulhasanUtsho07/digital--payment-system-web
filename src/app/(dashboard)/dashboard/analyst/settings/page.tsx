"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Bot,
  Check,
  ChevronRight,
  Download,
  FileBarChart,
  Gauge,
  Layers3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  WandSparkles,
} from "lucide-react";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getAnalystSettings,
  getAnalystSettingsLive,
  updateAnalystSettingsSection,
  type AnalystDensity,
  type AnalystInsightSeverity,
  type AnalystReportFormat,
  type AnalystRiskSource,
  type AnalystSettingsLiveSnapshot,
  type AnalystSettingsMode,
  type AnalystSettingsPayload,
  type AnalystSettingsRange,
  type AnalystSettingsSection,
} from "@/lib/api/analystSettingsApi";

const SECTIONS: Array<{
  id: AnalystSettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { id: "general", label: "General", description: "Default live filters, timezone and refresh cadence.", icon: Settings2 },
  { id: "dataScope", label: "Data Scope", description: "Provider and risk-source scope used by live backend analytics.", icon: Layers3 },
  { id: "providerMonitoring", label: "Provider Monitoring", description: "Persist provider review thresholds.", icon: Activity },
  { id: "alerts", label: "Alerts", description: "Choose which real insight severities are visible.", icon: BellRing },
  { id: "risk", label: "Risk Thresholds", description: "Persist analyst warning thresholds.", icon: ShieldAlert },
  { id: "anomalies", label: "Anomaly Detection", description: "Configure anomaly-review preferences.", icon: TrendingUp },
  { id: "reports", label: "Reports", description: "Defaults for existing Analyst report generation.", icon: FileBarChart },
  { id: "aiInsights", label: "AI Insights", description: "Configure deterministic insight visibility.", icon: Bot },
  { id: "export", label: "Export", description: "Configure the currently supported CSV export preference.", icon: Download },
  { id: "appearance", label: "Appearance", description: "Persist Analyst density and motion preferences.", icon: WandSparkles },
];

export default function AnalystSettingsPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isAnalystRole =
    user.role === "analyst";

  /* =======================================================
     ANALYST-ONLY PAGE GUARD
  ======================================================= */

  useEffect(() => {
    if (isAnalystRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isAnalystRole,
    router,
    user.role,
  ]);

  const [section, setSection] =
    useState<AnalystSettingsSection>("general");

  const [saved, setSaved] =
    useState<AnalystSettingsPayload | null>(null);

  const [draft, setDraft] =
    useState<AnalystSettingsPayload | null>(null);

  const [live, setLive] =
    useState<AnalystSettingsLiveSnapshot | null>(null);

  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [auditCount, setAuditCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [liveError, setLiveError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadLive(quiet = false) {
    if (!isAnalystRole) {
      setLiveLoading(false);
      return;
    }

    if (!quiet) setLiveLoading(true);
    setLiveError("");

    try {
      const response =
        await getAnalystSettingsLive();

      if (!response.success) {
        throw new Error(
          "Unable to load live analyst data."
        );
      }

      setLive(response.live);
    } catch (requestError) {
      setLiveError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load live analyst data."
      );
    } finally {
      setLiveLoading(false);
    }
  }

  async function loadSettings(isRefresh = false) {
    if (!isAnalystRole) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    isRefresh
      ? setRefreshing(true)
      : setLoading(true);

    setError("");

    try {
      const response =
        await getAnalystSettings();

      if (!response.success) {
        throw new Error(
          "Unable to load Analyst Settings."
        );
      }

      setSaved(response.settings);
      setDraft(response.settings);
      setRevision(response.meta.revision);
      setUpdatedAt(response.meta.updatedAt);
      setAuditCount(response.auditItems?.length ?? 0);

      await loadLive(isRefresh);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Analyst Settings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isAnalystRole) {
      setLoading(false);
      return;
    }

    void loadSettings();
  }, [isAnalystRole]);

  useEffect(() => {
    if (!isAnalystRole) {
      return;
    }

    if (!draft || loading) return;

    const seconds =
      Math.max(
        15,
        draft.general.autoRefreshSeconds
      );

    const timer =
      window.setInterval(
        () => {
          void loadLive(true);
        },
        seconds * 1000
      );

    return () =>
      window.clearInterval(timer);
  }, [
    isAnalystRole,
    draft?.general.autoRefreshSeconds,
    loading,
  ]);

  const meta =
    useMemo(
      () =>
        SECTIONS.find(
          item =>
            item.id === section
        ) ?? SECTIONS[0],
      [section]
    );

  const dirty =
    useMemo(() => {
      if (!saved || !draft) {
        return false;
      }

      return (
        JSON.stringify(
          saved[section]
        ) !==
        JSON.stringify(
          draft[section]
        )
      );
    }, [
      saved,
      draft,
      section,
    ]);

  function patch<K extends AnalystSettingsSection>(
    target: K,
    value: Partial<AnalystSettingsPayload[K]>
  ) {
    if (!isAnalystRole) {
      return;
    }

    setDraft(current => {
      if (!current) return current;

      return {
        ...current,
        [target]: {
          ...current[target],
          ...value,
        },
      };
    });
  }

  async function saveSection() {
    if (!isAnalystRole) {
      return;
    }

    if (!draft || !dirty || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await updateAnalystSettingsSection(
          section,
          draft[section] as never,
          revision
        );

      if (!response.success) {
        throw new Error(
          response.message ||
          "Unable to save Analyst Settings."
        );
      }

      setSaved(response.settings);
      setDraft(response.settings);
      setRevision(response.meta.revision);
      setUpdatedAt(response.meta.updatedAt);
      setSuccess(
        response.message ||
        "Analyst Settings saved."
      );

      await loadLive(true);

      window.setTimeout(
        () => setSuccess(""),
        3000
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save Analyst Settings."
      );
    } finally {
      setSaving(false);
    }
  }

  function discardSection() {
    if (!isAnalystRole) {
      return;
    }

    if (!saved || !draft) return;

    setDraft({
      ...draft,
      [section]: saved[section],
    });

    setError("");
    setSuccess("");
  }

  if (!isAnalystRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-300">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening analyst workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Analyst Settings is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (!draft || !saved) {
    return (
      <main className="min-h-screen bg-transparent p-4 md:p-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-500/20 bg-card p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />

          <h1 className="mt-4 text-xl font-black text-foreground">
            Unable to load Analyst Settings
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ||
              "The backend did not return Analyst Settings."}
          </p>

          <button
            type="button"
            onClick={() => void loadSettings()}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-cyan-600 px-5 text-xs font-black text-white transition hover:bg-cyan-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const ActiveIcon = meta.icon;

  return (
    <main className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="analyst-settings-hero relative overflow-hidden rounded-[30px] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-cyan-950 to-emerald-950 shadow-[0_22px_65px_rgba(6,182,212,0.16)]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="analyst-settings-grid absolute inset-0 opacity-35" />
            <div className="analyst-settings-orb absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="analyst-settings-orb-delayed absolute -bottom-28 left-[32%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="relative z-10 grid gap-7 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-50 backdrop-blur-md">
                  <span className="analyst-settings-live-dot h-2 w-2 rounded-full bg-emerald-300" />
                  Live Backend Data
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
                  <Settings2 className="h-3.5 w-3.5" />
                  Analyst Settings
                </span>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="analyst-settings-hero-icon relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-md sm:h-16 sm:w-16">
                  <BarChart3 className="h-7 w-7" />
                  <span className="analyst-settings-icon-ring absolute inset-0 rounded-[20px] border border-white/20" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/75">
                    Analytics configuration workspace
                  </p>

                  <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[36px]">
                    Analyst Settings
                  </h1>

                  <p className="mt-3 max-w-3xl text-xs leading-6 text-cyan-50/70">
                    All operational numbers on this page come from
                    your existing Analyst backend services. Failed
                    sources show as unavailable instead of displaying
                    fake or demo values.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-3">
                <HeroMetric
                  label="Settings revision"
                  value={`v${revision}`}
                  icon={RefreshCw}
                />

                <HeroMetric
                  label="Audit events"
                  value={String(auditCount)}
                  icon={Gauge}
                />

                <HeroMetric
                  label="Live generated"
                  value={
                    live?.generatedAt
                      ? formatShortTime(
                          live.generatedAt
                        )
                      : liveLoading
                        ? "Loading…"
                        : "Unavailable"
                  }
                  icon={Activity}
                />
              </div>
            </div>

            <LiveRadar
              live={live}
              loading={liveLoading}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-700 dark:text-cyan-400">
                Live Platform Snapshot
              </p>

              <h2 className="mt-1 text-base font-black text-foreground">
                Current backend analytics
              </h2>

              <p className="mt-1 text-[10px] text-muted-foreground">
                {live
                  ? `${live.filters.range} · ${live.filters.mode} · ${live.filters.currency}`
                  : "Waiting for backend"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isAnalystRole) {
                  return;
                }

                void loadLive();
              }}
              disabled={liveLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-[10px] font-black text-muted-foreground transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-700 disabled:opacity-50 dark:hover:text-cyan-400"
            >
              {liveLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh live data
            </button>
          </div>

          {liveError ? (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-3">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {liveError}
              </p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <LiveMetric
              title="Success rate"
              value={
                live?.overview
                  ? `${live.overview.successRate.toFixed(2)}%`
                  : null
              }
              source={live?.sources.overview}
              loading={liveLoading}
              icon={TrendingUp}
            />

            <LiveMetric
              title="60m attempts"
              value={
                live?.pulse
                  ? formatNumber(
                      live.pulse.last60AttemptCount
                    )
                  : null
              }
              source={live?.sources.pulse}
              loading={liveLoading}
              icon={Activity}
            />

            <LiveMetric
              title="Active users"
              value={
                live?.overview
                  ? formatNumber(
                      live.overview.activeUsers
                    )
                  : null
              }
              source={live?.sources.overview}
              loading={liveLoading}
              icon={Gauge}
            />

            <LiveMetric
              title="High-risk tx"
              value={
                live?.risk
                  ? formatNumber(
                      live.risk.highRiskTransactions
                    )
                  : null
              }
              source={live?.sources.risk}
              loading={liveLoading}
              icon={ShieldAlert}
            />

            <LiveMetric
              title="Recent reports"
              value={
                live?.reports
                  ? formatNumber(
                      live.reports.totalRecent
                    )
                  : null
              }
              source={live?.sources.reports}
              loading={liveLoading}
              icon={FileBarChart}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <LiveGroup
              title="Provider health"
              source={live?.sources.providers}
              loading={liveLoading}
            >
              {live?.providers ? (
                <>
                  <DataRow label="Overall success" value={`${live.providers.overallSuccessRate.toFixed(2)}%`} />
                  <DataRow label="Providers" value={String(live.providers.totalProviders)} />
                  <DataRow label="Critical" value={String(live.providers.criticalProviders)} />
                  <DataRow label="Attention" value={String(live.providers.attentionProviders)} />
                </>
              ) : null}
            </LiveGroup>

            <LiveGroup
              title="Live pulse"
              source={live?.sources.pulse}
              loading={liveLoading}
            >
              {live?.pulse ? (
                <>
                  <DataRow label="Status" value={live.pulse.status} />
                  <DataRow label="60m success" value={`${live.pulse.last60SuccessRate.toFixed(2)}%`} />
                  <DataRow label="Alerts" value={String(live.pulse.alertCount)} />
                  <DataRow label="Stale payments" value={String(live.pulse.stalePaymentCount)} />
                </>
              ) : null}
            </LiveGroup>

            <LiveGroup
              title="Risk analytics"
              source={live?.sources.risk}
              loading={liveLoading}
            >
              {live?.risk ? (
                <>
                  <DataRow label="Status" value={live.risk.status} />
                  <DataRow label="Risk signals" value={String(live.risk.riskSignalCount)} />
                  <DataRow label="High-risk rate" value={`${live.risk.highRiskTransactionRate.toFixed(2)}%`} />
                  <DataRow label="Failed payments" value={String(live.risk.failedPayments)} />
                </>
              ) : null}
            </LiveGroup>
          </div>
        </section>

        {error ? (
          <StatusMessage tone="error" message={error} />
        ) : null}

        {success ? (
          <StatusMessage tone="success" message={success} />
        ) : null}

        <div className="overflow-x-auto pb-1 lg:hidden">
          <div className="flex min-w-max gap-2">
            {SECTIONS.map(item => {
              const Icon = item.icon;
              const active =
                item.id === section;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!isAnalystRole) {
                      return;
                    }

                    setSection(item.id);
                  }}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-black transition ${
                    active
                      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-5 overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400">
                  Analyst Configuration
                </p>

                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  Changes are persisted section-by-section by the backend.
                </p>
              </div>

              <div className="space-y-1 p-2.5">
                {SECTIONS.map(item => {
                  const Icon = item.icon;
                  const active =
                    item.id === section;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!isAnalystRole) {
                          return;
                        }

                        setSection(item.id);
                      }}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/55">
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-black">
                          {item.label}
                        </span>

                        <span className="mt-0.5 block truncate text-[8px] text-muted-foreground">
                          {item.description}
                        </span>
                      </span>

                      <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                    <ActiveIcon className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400">
                      Backend-connected settings
                    </p>

                    <h2 className="mt-1 text-lg font-black text-foreground">
                      {meta.label}
                    </h2>

                    <p className="mt-1 max-w-2xl text-[10px] leading-5 text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAnalystRole) {
                      return;
                    }

                    void loadSettings(true);
                  }}
                  disabled={
                    refreshing ||
                    saving
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-[10px] font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {refreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Refresh settings
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              <SettingsForm
                section={section}
                draft={draft}
                patch={patch}
              />
            </div>

            <div className="sticky bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-xl sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        dirty
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />

                    <p className="text-[10px] font-black text-foreground">
                      {dirty
                        ? "Unsaved changes"
                        : "Section is saved"}
                    </p>
                  </div>

                  <p className="mt-1 text-[8px] text-muted-foreground">
                    Last backend update:{" "}
                    {formatDateTime(updatedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={discardSection}
                    disabled={
                      !dirty ||
                      saving
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-[10px] font-black text-muted-foreground transition hover:bg-muted disabled:opacity-40 sm:flex-none"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Discard
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveSection()
                    }
                    disabled={
                      !dirty ||
                      saving
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-[10px] font-black text-white transition hover:bg-cyan-700 disabled:opacity-50 sm:flex-none"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}

                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .analyst-settings-hero { isolation:isolate; }
        .analyst-settings-grid {
          background-image:
            linear-gradient(rgba(34,211,238,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,.06) 1px, transparent 1px);
          background-size:28px 28px;
          animation:analystSettingsGrid 20s linear infinite;
        }
        .analyst-settings-orb {
          animation:analystSettingsOrb 8s ease-in-out infinite;
        }
        .analyst-settings-orb-delayed {
          animation:analystSettingsOrb 10s ease-in-out 1.2s infinite reverse;
        }
        .analyst-settings-live-dot {
          box-shadow:0 0 0 0 rgba(110,231,183,.58);
          animation:analystSettingsLive 2s ease-out infinite;
        }
        .analyst-settings-hero-icon {
          animation:analystSettingsFloat 5.4s ease-in-out infinite;
        }
        .analyst-settings-icon-ring {
          animation:analystSettingsPulse 3.2s ease-out infinite;
        }
        .analyst-settings-radar {
          animation:analystSettingsRadar 14s linear infinite;
        }
        @keyframes analystSettingsGrid {
          from { transform:translate3d(0,0,0); }
          to { transform:translate3d(28px,28px,0); }
        }
        @keyframes analystSettingsOrb {
          0%,100% { transform:translate3d(0,0,0) scale(1); opacity:.7; }
          50% { transform:translate3d(0,-14px,0) scale(1.08); opacity:1; }
        }
        @keyframes analystSettingsLive {
          0% { box-shadow:0 0 0 0 rgba(110,231,183,.58); }
          75%,100% { box-shadow:0 0 0 8px rgba(110,231,183,0); }
        }
        @keyframes analystSettingsFloat {
          0%,100% { transform:translateY(0); }
          50% { transform:translateY(-6px); }
        }
        @keyframes analystSettingsPulse {
          0% { transform:scale(.92); opacity:.5; }
          75%,100% { transform:scale(1.2); opacity:0; }
        }
        @keyframes analystSettingsRadar {
          from { transform:rotate(0deg); }
          to { transform:rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .analyst-settings-grid,
          .analyst-settings-orb,
          .analyst-settings-orb-delayed,
          .analyst-settings-live-dot,
          .analyst-settings-hero-icon,
          .analyst-settings-icon-ring,
          .analyst-settings-radar {
            animation:none !important;
          }
        }
      `}</style>
    </main>
  );
}

function SettingsForm({
  section,
  draft,
  patch,
}: {
  section: AnalystSettingsSection;
  draft: AnalystSettingsPayload;
  patch: <K extends AnalystSettingsSection>(
    section: K,
    value: Partial<AnalystSettingsPayload[K]>
  ) => void;
}) {
  if (section === "general") {
    return (
      <Grid>
        <SelectField
          label="Default range"
          value={draft.general.defaultRange}
          options={[
            ["24h", "24 hours"],
            ["7d", "7 days"],
            ["30d", "30 days"],
            ["90d", "90 days"],
          ]}
          onChange={value =>
            patch("general", {
              defaultRange:
                value as AnalystSettingsRange,
            })
          }
        />

        <SelectField
          label="Default mode"
          value={draft.general.defaultMode}
          options={[
            ["all", "All traffic"],
            ["test", "Test only"],
            ["live", "Live only"],
          ]}
          onChange={value =>
            patch("general", {
              defaultMode:
                value as AnalystSettingsMode,
            })
          }
        />

        <TextField
          label="Currency"
          hint="Three-letter ISO code used by live analytics."
          value={draft.general.currency}
          onChange={value =>
            patch("general", {
              currency:
                value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 3),
            })
          }
        />

        <TextField
          label="Timezone"
          value={draft.general.timezone}
          onChange={value =>
            patch("general", {
              timezone: value,
            })
          }
        />

        <NumberField
          label="Live refresh interval"
          value={draft.general.autoRefreshSeconds}
          min={15}
          max={300}
          suffix="sec"
          onChange={value =>
            patch("general", {
              autoRefreshSeconds: value,
            })
          }
        />
      </Grid>
    );
  }

  if (section === "dataScope") {
    return (
      <Grid>
        <TextField
          label="Provider filter"
          hint="Leave empty to include all real providers."
          value={draft.dataScope.provider}
          placeholder="all providers"
          onChange={value =>
            patch("dataScope", {
              provider:
                value
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9_-]/g, "")
                  .slice(0, 50),
            })
          }
        />

        <SelectField
          label="Risk source"
          value={draft.dataScope.riskSource}
          options={[
            ["all", "All sources"],
            ["wallet", "Wallet"],
            ["card", "Card"],
            ["paypal", "PayPal"],
            ["local_psp", "Local PSP"],
          ]}
          onChange={value =>
            patch("dataScope", {
              riskSource:
                value as AnalystRiskSource,
            })
          }
        />
      </Grid>
    );
  }

  if (section === "providerMonitoring") {
    return (
      <Grid>
        <NumberField
          label="Warning success rate"
          value={draft.providerMonitoring.warningSuccessRate}
          min={1}
          max={100}
          suffix="%"
          onChange={value =>
            patch("providerMonitoring", {
              warningSuccessRate: value,
            })
          }
        />

        <NumberField
          label="Critical success rate"
          value={draft.providerMonitoring.criticalSuccessRate}
          min={1}
          max={100}
          suffix="%"
          onChange={value =>
            patch("providerMonitoring", {
              criticalSuccessRate: value,
            })
          }
        />

        <NumberField
          label="Max average completion"
          value={draft.providerMonitoring.maxAverageCompletionSeconds}
          min={1}
          max={3600}
          suffix="sec"
          onChange={value =>
            patch("providerMonitoring", {
              maxAverageCompletionSeconds: value,
            })
          }
        />
      </Grid>
    );
  }

  if (section === "alerts") {
    return (
      <Grid>
        <ToggleField
          label="Analyst alerts"
          description="Enable saved alert visibility preferences."
          checked={draft.alerts.enabled}
          onChange={value =>
            patch("alerts", {
              enabled: value,
            })
          }
        />

        {(
          [
            ["critical", "Critical"],
            ["high", "High"],
            ["medium", "Medium"],
            ["info", "Info"],
            ["positive", "Positive"],
          ] as const
        ).map(([key, label]) => (
          <ToggleField
            key={key}
            label={`${label} insights`}
            description={`Show ${label.toLowerCase()} backend insight severity.`}
            checked={draft.alerts[key]}
            onChange={value =>
              patch("alerts", {
                [key]: value,
              })
            }
          />
        ))}
      </Grid>
    );
  }

  if (section === "risk") {
    return (
      <Grid>
        <NumberField
          label="High-risk transaction warning"
          value={draft.risk.highRiskRateWarning}
          min={0}
          max={100}
          suffix="%"
          onChange={value =>
            patch("risk", {
              highRiskRateWarning: value,
            })
          }
        />

        <NumberField
          label="Payment failure warning"
          value={draft.risk.paymentFailureRateWarning}
          min={0}
          max={100}
          suffix="%"
          onChange={value =>
            patch("risk", {
              paymentFailureRateWarning: value,
            })
          }
        />

        <NumberField
          label="Dispute exposure warning"
          value={draft.risk.disputeExposureRateWarning}
          min={0}
          max={100}
          suffix="%"
          onChange={value =>
            patch("risk", {
              disputeExposureRateWarning: value,
            })
          }
        />
      </Grid>
    );
  }

  if (section === "anomalies") {
    return (
      <Grid>
        <ToggleField
          label="Anomaly review"
          description="Persist anomaly review preference."
          checked={draft.anomalies.enabled}
          onChange={value =>
            patch("anomalies", {
              enabled: value,
            })
          }
        />

        <SelectField
          label="Sensitivity"
          value={draft.anomalies.sensitivity}
          options={[
            ["low", "Low"],
            ["medium", "Medium"],
            ["high", "High"],
          ]}
          onChange={value =>
            patch("anomalies", {
              sensitivity:
                value as
                  | "low"
                  | "medium"
                  | "high",
            })
          }
        />

        <NumberField
          label="Baseline window"
          value={draft.anomalies.baselineDays}
          min={1}
          max={180}
          suffix="days"
          onChange={value =>
            patch("anomalies", {
              baselineDays: value,
            })
          }
        />

        <NumberField
          label="Minimum sample"
          value={draft.anomalies.minimumSampleSize}
          min={1}
          max={100000}
          suffix="rows"
          onChange={value =>
            patch("anomalies", {
              minimumSampleSize: value,
            })
          }
        />
      </Grid>
    );
  }

  if (section === "reports") {
    return (
      <Grid>
        <SelectField
          label="Default report format"
          value={draft.reports.defaultFormat}
          options={[
            ["executive", "Executive"],
            ["payments", "Payments"],
            ["risk", "Risk"],
            ["revenue", "Revenue"],
          ]}
          onChange={value =>
            patch("reports", {
              defaultFormat:
                value as AnalystReportFormat,
            })
          }
        />

        <SelectField
          label="Default report range"
          value={draft.reports.defaultRange}
          options={[
            ["24h", "24 hours"],
            ["7d", "7 days"],
            ["30d", "30 days"],
            ["90d", "90 days"],
          ]}
          onChange={value =>
            patch("reports", {
              defaultRange:
                value as AnalystSettingsRange,
            })
          }
        />

        <SelectField
          label="Default report mode"
          value={draft.reports.defaultMode}
          options={[
            ["all", "All"],
            ["test", "Test"],
            ["live", "Live"],
          ]}
          onChange={value =>
            patch("reports", {
              defaultMode:
                value as AnalystSettingsMode,
            })
          }
        />
      </Grid>
    );
  }

  if (section === "aiInsights") {
    return (
      <Grid>
        <ToggleField
          label="Analyst insights"
          description="Enable saved visibility of deterministic Analyst insights."
          checked={draft.aiInsights.enabled}
          onChange={value =>
            patch("aiInsights", {
              enabled: value,
            })
          }
        />

        <SelectField
          label="Minimum severity"
          value={draft.aiInsights.minimumSeverity}
          options={[
            ["critical", "Critical"],
            ["high", "High"],
            ["medium", "Medium"],
            ["info", "Info"],
            ["positive", "Positive"],
          ]}
          onChange={value =>
            patch("aiInsights", {
              minimumSeverity:
                value as AnalystInsightSeverity,
            })
          }
        />

        <ToggleField
          label="Recommended actions"
          description="Show backend-generated recommended review text."
          checked={draft.aiInsights.showRecommendedActions}
          onChange={value =>
            patch("aiInsights", {
              showRecommendedActions: value,
            })
          }
        />
      </Grid>
    );
  }

  if (section === "export") {
    return (
      <Grid>
        <SelectField
          label="Export format"
          hint="CSV is the only format supported by the current Analyst report download controller."
          value={draft.export.defaultFormat}
          options={[
            ["csv", "CSV"],
          ]}
          onChange={() => undefined}
        />

        <TextField
          label="Filename prefix"
          value={draft.export.fileNamePrefix}
          onChange={value =>
            patch("export", {
              fileNamePrefix:
                value
                  .trimStart()
                  .replace(/[^a-zA-Z0-9_-]/g, "-")
                  .slice(0, 40),
            })
          }
        />

        <InfoBox
          icon={Download}
          title="No fake formats"
          description="PDF and JSON are intentionally omitted because your current backend report download route returns CSV."
        />
      </Grid>
    );
  }

  return (
    <Grid>
      <SelectField
        label="Workspace density"
        value={draft.appearance.density}
        options={[
          ["comfortable", "Comfortable"],
          ["compact", "Compact"],
        ]}
        onChange={value =>
          patch("appearance", {
            density:
              value as AnalystDensity,
          })
        }
      />

      <ToggleField
        label="Decorative animations"
        description="Persist Analyst workspace motion preference."
        checked={draft.appearance.animations}
        onChange={value =>
          patch("appearance", {
            animations: value,
          })
        }
      />

      <ToggleField
        label="Chart motion"
        description="Persist chart animation preference."
        checked={draft.appearance.chartMotion}
        onChange={value =>
          patch("appearance", {
            chartMotion: value,
          })
        }
      />

      <InfoBox
        icon={Sparkles}
        title="Global theme remains unchanged"
        description="Light and dark mode remain controlled by your existing ThemeContext."
      />
    </Grid>
  );
}

function LiveRadar({
  live,
  loading,
}: {
  live: AnalystSettingsLiveSnapshot | null;
  loading: boolean;
}) {
  const status =
    live?.pulse?.status ??
    live?.overview?.status ??
    "unavailable";

  return (
    <div className="relative mx-auto hidden h-[250px] w-full max-w-[400px] lg:block">
      <div className="analyst-settings-radar absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15">
        <div className="absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10" />
      </div>

      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[34px] border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-xl">
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <Gauge className="h-7 w-7" />
        )}

        <p className="mt-2 text-[8px] font-black uppercase tracking-[0.13em] text-cyan-100/60">
          Platform
        </p>

        <p className="mt-1 text-[10px] font-black capitalize">
          {loading
            ? "Loading"
            : status}
        </p>
      </div>

      <div className="absolute left-2 top-7 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur">
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/45">
          Payments
        </p>
        <p className="mt-1 text-[10px] font-black text-white">
          {live?.overview
            ? formatNumber(
                live.overview.paymentCount
              )
            : "—"}
        </p>
      </div>

      <div className="absolute bottom-8 right-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur">
        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/45">
          Providers
        </p>
        <p className="mt-1 text-[10px] font-black text-white">
          {live?.providers
            ? formatNumber(
                live.providers.totalProviders
              )
            : "—"}
        </p>
      </div>
    </div>
  );
}

function LiveMetric({
  title,
  value,
  source,
  loading,
  icon: Icon,
}: {
  title: string;
  value: string | null;
  source?: {
    available: boolean;
    error?: string;
  };
  loading: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[22px] border border-border bg-muted/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
          <Icon className="h-4 w-4" />
        </span>

        <SourceDot
          source={source}
          loading={loading}
        />
      </div>

      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.13em] text-muted-foreground">
        {title}
      </p>

      <p className="mt-1 text-xl font-black text-foreground">
        {loading
          ? "…"
          : value ??
            "Unavailable"}
      </p>
    </div>
  );
}

function LiveGroup({
  title,
  source,
  loading,
  children,
}: {
  title: string;
  source?: {
    available: boolean;
    error?: string;
  };
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-border bg-muted/25 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-foreground">
          {title}
        </p>

        <SourceDot
          source={source}
          loading={loading}
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-8 animate-pulse rounded-xl bg-muted" />
          <div className="h-8 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : source?.available ? (
        <div className="mt-3 space-y-2">
          {children}
        </div>
      ) : (
        <p className="mt-4 text-[9px] leading-5 text-muted-foreground">
          {source?.error ||
            "Backend source unavailable."}
        </p>
      )}
    </div>
  );
}

function SourceDot({
  source,
  loading,
}: {
  source?: {
    available: boolean;
    error?: string;
  };
  loading: boolean;
}) {
  return (
    <span
      title={
        loading
          ? "Loading"
          : source?.available
            ? "Live source available"
            : source?.error ||
              "Source unavailable"
      }
      className={`h-2.5 w-2.5 rounded-full ${
        loading
          ? "animate-pulse bg-cyan-400"
          : source?.available
            ? "bg-emerald-500"
            : "bg-rose-500"
      }`}
    />
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2">
      <span className="text-[8px] font-bold text-muted-foreground">
        {label}
      </span>

      <span className="text-[9px] font-black capitalize text-foreground">
        {value}
      </span>
    </div>
  );
}

function Grid({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-[22px] border border-border bg-muted/35 p-4">
      <p className="text-[10px] font-black text-foreground">
        {label}
      </p>

      {hint ? (
        <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
          {hint}
        </p>
      ) : null}

      <div className="mt-3">
        {children}
      </div>
    </label>
  );
}

function TextField({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
      />
    </Field>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={event => {
            const next =
              Number(
                event.target.value
              );

            if (
              Number.isFinite(next)
            ) {
              onChange(next);
            }
          }}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-16 text-xs font-bold text-foreground outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

function SelectField({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        value={value}
        onChange={event =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
      >
        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          )
        )}
      </select>
    </Field>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[22px] border border-border bg-muted/35 p-4">
      <div>
        <p className="text-[10px] font-black text-foreground">
          {label}
        </p>

        <p className="mt-1 max-w-xl text-[9px] leading-4 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition ${
          checked
            ? "border-cyan-500 bg-cyan-500"
            : "border-border bg-background"
        }`}
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-cyan-500/20 bg-cyan-500/[0.06] p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-400" />

        <div>
          <p className="text-xs font-black text-foreground">
            {title}
          </p>

          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>

          <p className="mt-0.5 truncate text-sm font-black text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  const ok =
    tone === "success";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        ok
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-rose-500/20 bg-rose-500/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {ok ? (
          <Check className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600 dark:text-rose-400" />
        )}

        <p
          className={`text-xs font-bold ${
            ok
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-rose-700 dark:text-rose-300"
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-transparent p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="h-[310px] animate-pulse rounded-[30px] bg-cyan-500/10" />
        <div className="h-[330px] animate-pulse rounded-[28px] bg-muted" />

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden h-[650px] animate-pulse rounded-[26px] bg-muted lg:block" />
          <div className="h-[650px] animate-pulse rounded-[28px] bg-muted" />
        </div>
      </div>
    </main>
  );
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat().format(value);
}

function formatDateTime(
  value: string
): string {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function formatShortTime(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}
