"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  BellRing,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Gauge,
  Languages,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserRoundCog,
  WandSparkles,
  Workflow,
} from "lucide-react";

import {
  getSupportSettings,
  updateSupportSettingsSection,
  type AssignmentStrategy,
  type SupportDensity,
  type SupportPriority,
  type SupportSettingsPayload,
  type SupportSettingsSection,
} from "@/lib/api/supportSettingsApi";

/* =========================================================
   SECTION META
========================================================= */

const SECTION_META: Array<{
  id: SupportSettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    id: "general",
    label: "General",
    description:
      "Workspace identity, language, timezone and business hours.",
    icon: Settings2,
  },
  {
    id: "tickets",
    label: "Tickets",
    description:
      "Default priority, ticket lifecycle and ticket numbering.",
    icon: TicketCheck,
  },
  {
    id: "assignment",
    label: "Assignment",
    description:
      "How tickets are distributed across the support team.",
    icon: UserRoundCog,
  },
  {
    id: "sla",
    label: "SLA Policies",
    description:
      "Response and resolution targets for every priority.",
    icon: Clock3,
  },
  {
    id: "escalation",
    label: "Escalation",
    description:
      "Automatic escalation and intervention rules.",
    icon: Workflow,
  },
  {
    id: "notifications",
    label: "Notifications",
    description:
      "Choose which operational events should alert support agents.",
    icon: BellRing,
  },
  {
    id: "aiCopilot",
    label: "AI Copilot",
    description:
      "Configure safe AI suggestions and human approval requirements.",
    icon: Bot,
  },
  {
    id: "knowledgeBase",
    label: "Knowledge Base",
    description:
      "Control article visibility and contextual suggestions.",
    icon: BookOpen,
  },
  {
    id: "savedReplies",
    label: "Saved Replies",
    description:
      "Shared response templates and approval behavior.",
    icon: MessageSquareText,
  },
  {
    id: "security",
    label: "Security",
    description:
      "Sensitive data masking, auditing and reauthentication.",
    icon: LockKeyhole,
  },
  {
    id: "appearance",
    label: "Appearance",
    description:
      "Support workspace density and motion preferences.",
    icon: LayoutDashboard,
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function SupportSettingsPage() {
  const [
    activeSection,
    setActiveSection,
  ] =
    useState<SupportSettingsSection>(
      "general"
    );

  const [
    saved,
    setSaved,
  ] =
    useState<SupportSettingsPayload | null>(
      null
    );

  const [
    draft,
    setDraft,
  ] =
    useState<SupportSettingsPayload | null>(
      null
    );

  const [
    revision,
    setRevision,
  ] =
    useState(0);

  const [
    updatedAt,
    setUpdatedAt,
  ] =
    useState("");

  const [
    auditCount,
    setAuditCount,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const loadSettings =
    async (
      isRefresh = false
    ) => {
      if (isRefresh) {
        setRefreshing(
          true
        );
      } else {
        setLoading(
          true
        );
      }

      setError("");

      try {
        const response =
          await getSupportSettings();

        if (
          !response.success
        ) {
          throw new Error(
            "Unable to load support settings."
          );
        }

        setSaved(
          response.settings
        );

        setDraft(
          response.settings
        );

        setRevision(
          response.meta.revision
        );

        setUpdatedAt(
          response.meta.updatedAt
        );

        setAuditCount(
          response.auditItems
            ?.length ?? 0
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load support settings."
        );
      } finally {
        setLoading(
          false
        );

        setRefreshing(
          false
        );
      }
    };

  useEffect(() => {
    void loadSettings();
  }, []);

  const currentMeta =
    useMemo(
      () =>
        SECTION_META.find(
          (item) =>
            item.id ===
            activeSection
        ) ??
        SECTION_META[0],
      [
        activeSection,
      ]
    );

  const dirty =
    useMemo(() => {
      if (
        !saved ||
        !draft
      ) {
        return false;
      }

      return (
        JSON.stringify(
          saved[
            activeSection
          ]
        ) !==
        JSON.stringify(
          draft[
            activeSection
          ]
        )
      );
    }, [
      activeSection,
      draft,
      saved,
    ]);

  function patchSection<
    K extends SupportSettingsSection,
  >(
    section: K,
    patch:
      Partial<
        SupportSettingsPayload[K]
      >
  ) {
    setDraft(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          [section]: {
            ...current[
              section
            ],
            ...patch,
          },
        };
      }
    );
  }

  function patchSlaPriority(
    priority:
      | "urgent"
      | "high"
      | "normal"
      | "low",
    patch: Partial<{
      firstResponseMinutes:
        number;
      resolutionMinutes:
        number;
    }>
  ) {
    setDraft(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          sla: {
            ...current.sla,

            [priority]: {
              ...current.sla[
                priority
              ],
              ...patch,
            },
          },
        };
      }
    );
  }

  async function saveActiveSection() {
    if (
      !draft ||
      !dirty ||
      saving
    ) {
      return;
    }

    setSaving(
      true
    );

    setError("");
    setSuccess("");

    try {
      const response =
        await updateSupportSettingsSection(
          activeSection,
          draft[
            activeSection
          ] as never,
          revision
        );

      if (
        !response.success
      ) {
        throw new Error(
          response.message ||
            "Unable to save support settings."
        );
      }

      setSaved(
        response.settings
      );

      setDraft(
        response.settings
      );

      setRevision(
        response.meta.revision
      );

      setUpdatedAt(
        response.meta.updatedAt
      );

      setSuccess(
        response.message ||
          "Support settings saved."
      );

      window.setTimeout(
        () =>
          setSuccess(
            ""
          ),
        3000
      );
    } catch (
      requestError
    ) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save support settings."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  function discardActiveSection() {
    if (
      !saved ||
      !draft
    ) {
      return;
    }

    setDraft({
      ...draft,

      [activeSection]:
        saved[
          activeSection
        ],
    });

    setSuccess("");
    setError("");
  }

  if (
    loading
  ) {
    return (
      <SupportSettingsSkeleton />
    );
  }

  if (
    !draft ||
    !saved
  ) {
    return (
      <main className="min-h-screen bg-transparent p-4 md:p-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-500/20 bg-card p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />

          <h1 className="mt-4 text-xl font-black text-foreground">
            Unable to load Support Settings
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ||
              "The settings response was empty."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadSettings()
            }
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-xs font-black text-white transition hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const CurrentIcon =
    currentMeta.icon;

  return (
    <main className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* =================================================
            HERO
        ================================================== */}

        <section className="support-settings-hero relative overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_22px_65px_rgba(16,185,129,0.20)]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="support-settings-grid absolute inset-0 opacity-35" />

            <div className="support-settings-orb absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-100/20 blur-3xl" />

            <div className="support-settings-orb-delayed absolute -bottom-28 left-[35%] h-72 w-72 rounded-full bg-cyan-200/15 blur-3xl" />

            <div className="support-settings-beam absolute -left-40 top-1/2 h-24 w-[500px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

            <div className="support-settings-ring absolute right-10 top-1/2 hidden h-64 w-64 -translate-y-1/2 rounded-full border border-white/10 xl:block" />
          </div>

          <div className="relative z-10 grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:p-8">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
                  <span className="support-settings-live-dot h-2 w-2 rounded-full bg-emerald-200" />
                  Support Operations
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
                  <Settings2 className="h-3.5 w-3.5" />
                  Workspace Settings
                </span>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="support-settings-hero-icon relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-md sm:h-16 sm:w-16">
                  <Settings2 className="h-7 w-7" />
                  <span className="support-settings-icon-ring absolute inset-0 rounded-[20px] border border-white/20" />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100">
                    Configuration workspace
                  </p>

                  <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[36px]">
                    Support Settings
                  </h1>

                  <p className="mt-3 max-w-3xl text-xs leading-6 text-emerald-50/80">
                    Configure ticket handling, assignment, SLA,
                    escalation, AI assistance, security and workspace
                    preferences from one controlled support console.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-3">
                <HeroMetric
                  label="Revision"
                  value={`v${revision}`}
                  icon={
                    RefreshCw
                  }
                />

                <HeroMetric
                  label="Audit events"
                  value={String(
                    auditCount
                  )}
                  icon={
                    FileText
                  }
                />

                <HeroMetric
                  label="Current section"
                  value={
                    currentMeta.label
                  }
                  icon={
                    CurrentIcon
                  }
                />
              </div>
            </div>

            <div className="relative hidden h-[230px] lg:block">
              <div className="support-settings-radar absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15">
                <div className="support-settings-radar-inner absolute left-1/2 top-1/2 h-[145px] w-[145px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15" />

                <div className="support-settings-core absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[30px] border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-xl">
                  <ShieldCheck className="h-8 w-8" />
                </div>

                <div className="support-settings-node support-settings-node-one absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/20 text-white backdrop-blur">
                  <Gauge className="h-4 w-4" />
                </div>

                <div className="support-settings-node support-settings-node-two absolute bottom-4 right-0 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/20 text-white backdrop-blur">
                  <Bot className="h-4 w-4" />
                </div>

                <div className="support-settings-node support-settings-node-three absolute bottom-4 left-0 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/20 text-white backdrop-blur">
                  <LockKeyhole className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            STATUS MESSAGES
        ================================================== */}

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />

              <p className="text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />

              <p className="text-xs font-bold leading-5 text-emerald-800 dark:text-emerald-300">
                {success}
              </p>
            </div>
          </div>
        ) : null}

        {/* =================================================
            MOBILE NAV
        ================================================== */}

        <div className="overflow-x-auto pb-1 lg:hidden">
          <div className="flex min-w-max gap-2">
            {SECTION_META.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  item.id ===
                  activeSection;

                return (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        item.id
                      )
                    }
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-black transition ${
                      active
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* =================================================
            SETTINGS WORKSPACE
        ================================================== */}

        <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
          {/* DESKTOP SETTINGS NAV */}

          <aside className="hidden lg:block">
            <div className="sticky top-5 overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                  Settings Navigation
                </p>

                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  Operational preferences are saved section by section.
                </p>
              </div>

              <div className="space-y-1 p-2.5">
                {SECTION_META.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    const active =
                      item.id ===
                      activeSection;

                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          setActiveSection(
                            item.id
                          )
                        }
                        className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                            active
                              ? "border-emerald-500/20 bg-background/80"
                              : "border-border bg-muted/55"
                          }`}
                        >
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
                  }
                )}
              </div>
            </div>
          </aside>

          {/* MAIN SETTINGS PANEL */}

          <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <CurrentIcon className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                      Support configuration
                    </p>

                    <h2 className="mt-1 text-lg font-black text-foreground">
                      {currentMeta.label}
                    </h2>

                    <p className="mt-1 max-w-2xl text-[10px] leading-5 text-muted-foreground">
                      {currentMeta.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadSettings(
                      true
                    )
                  }
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
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              <SettingsSectionContent
                activeSection={
                  activeSection
                }
                draft={
                  draft
                }
                patchSection={
                  patchSection
                }
                patchSlaPriority={
                  patchSlaPriority
                }
              />
            </div>

            {/* SAVE BAR */}

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
                    Last update:{" "}
                    {formatDateTime(
                      updatedAt
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      discardActiveSection
                    }
                    disabled={
                      !dirty ||
                      saving
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-[10px] font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Discard
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveActiveSection()
                    }
                    disabled={
                      !dirty ||
                      saving
                    }
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[10px] font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
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
        .support-settings-hero {
          isolation: isolate;
        }

        .support-settings-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(circle at 58% 44%, #000 0%, rgba(0,0,0,.45) 62%, transparent 100%);
          animation: supportSettingsGrid 20s linear infinite;
        }

        .support-settings-orb {
          animation: supportSettingsOrb 8s ease-in-out infinite;
        }

        .support-settings-orb-delayed {
          animation: supportSettingsOrb 10s ease-in-out 1.2s infinite reverse;
        }

        .support-settings-beam {
          animation: supportSettingsBeam 8s ease-in-out infinite;
        }

        .support-settings-ring {
          animation: supportSettingsRotate 14s linear infinite;
        }

        .support-settings-live-dot {
          box-shadow: 0 0 0 0 rgba(167,243,208,.6);
          animation: supportSettingsLive 2s ease-out infinite;
        }

        .support-settings-hero-icon {
          animation: supportSettingsFloat 5.4s ease-in-out infinite;
        }

        .support-settings-icon-ring {
          animation: supportSettingsPulse 3.2s ease-out infinite;
        }

        .support-settings-radar {
          animation: supportSettingsRotate 18s linear infinite;
        }

        .support-settings-radar-inner {
          animation: supportSettingsRotate 11s linear infinite reverse;
        }

        .support-settings-core {
          animation: supportSettingsCounterRotate 18s linear infinite;
        }

        .support-settings-node {
          animation: supportSettingsCounterRotate 18s linear infinite;
        }

        .support-settings-node-one {
          animation-delay: 0s;
        }

        .support-settings-node-two {
          animation-delay: -.8s;
        }

        .support-settings-node-three {
          animation-delay: -1.6s;
        }

        @keyframes supportSettingsGrid {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(28px,28px,0); }
        }

        @keyframes supportSettingsOrb {
          0%, 100% {
            transform: translate3d(0,0,0) scale(1);
            opacity: .7;
          }
          50% {
            transform: translate3d(0,-14px,0) scale(1.08);
            opacity: 1;
          }
        }

        @keyframes supportSettingsBeam {
          0%,100% {
            transform: translate3d(0,-50%,0);
            opacity: .22;
          }
          50% {
            transform: translate3d(115px,-50%,0);
            opacity: .52;
          }
        }

        @keyframes supportSettingsRotate {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }

        @keyframes supportSettingsCounterRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes supportSettingsLive {
          0% {
            box-shadow: 0 0 0 0 rgba(167,243,208,.6);
          }
          75%,100% {
            box-shadow: 0 0 0 8px rgba(167,243,208,0);
          }
        }

        @keyframes supportSettingsFloat {
          0%,100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(1.5deg);
          }
        }

        @keyframes supportSettingsPulse {
          0% {
            transform: scale(.92);
            opacity: .5;
          }
          75%,100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-settings-grid,
          .support-settings-orb,
          .support-settings-orb-delayed,
          .support-settings-beam,
          .support-settings-ring,
          .support-settings-live-dot,
          .support-settings-hero-icon,
          .support-settings-icon-ring,
          .support-settings-radar,
          .support-settings-radar-inner,
          .support-settings-core,
          .support-settings-node {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   SECTION CONTENT
========================================================= */

function SettingsSectionContent({
  activeSection,
  draft,
  patchSection,
  patchSlaPriority,
}: {
  activeSection:
    SupportSettingsSection;

  draft:
    SupportSettingsPayload;

  patchSection:
    <
      K extends SupportSettingsSection,
    >(
      section: K,
      patch:
        Partial<
          SupportSettingsPayload[K]
        >
    ) => void;

  patchSlaPriority:
    (
      priority:
        | "urgent"
        | "high"
        | "normal"
        | "low",
      patch: Partial<{
        firstResponseMinutes:
          number;
        resolutionMinutes:
          number;
      }>
    ) => void;
}) {
  if (
    activeSection ===
    "general"
  ) {
    return (
      <SettingsGrid>
        <TextField
          label="Workspace name"
          hint="Shown inside the Support Console."
          value={
            draft.general
              .workspaceName
          }
          onChange={(
            value
          ) =>
            patchSection(
              "general",
              {
                workspaceName:
                  value,
              }
            )
          }
        />

        <SelectField
          label="Timezone"
          hint="Used for support timestamps and business hours."
          value={
            draft.general
              .timezone
          }
          options={[
            ["Asia/Dhaka", "Asia/Dhaka"],
            ["UTC", "UTC"],
            ["Asia/Kolkata", "Asia/Kolkata"],
            ["Asia/Singapore", "Asia/Singapore"],
            ["Europe/London", "Europe/London"],
            ["America/New_York", "America/New_York"],
          ]}
          onChange={(
            value
          ) =>
            patchSection(
              "general",
              {
                timezone:
                  value,
              }
            )
          }
        />

        <SelectField
          label="Default language"
          hint="Default language for internal support UI preferences."
          value={
            draft.general
              .defaultLanguage
          }
          options={[
            ["en", "English"],
            ["bn", "বাংলা"],
          ]}
          onChange={(
            value
          ) =>
            patchSection(
              "general",
              {
                defaultLanguage:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Business hours"
          description="Enable configured support operating hours."
          checked={
            draft.general
              .businessHoursEnabled
          }
          onChange={(
            value
          ) =>
            patchSection(
              "general",
              {
                businessHoursEnabled:
                  value,
              }
            )
          }
        />

        <TextField
          label="Business start"
          hint="24-hour format, for example 09:00."
          value={
            draft.general
              .businessStart
          }
          onChange={(
            value
          ) =>
            patchSection(
              "general",
              {
                businessStart:
                  value,
              }
            )
          }
        />

        <TextField
          label="Business end"
          hint="24-hour format, for example 18:00."
          value={
            draft.general
              .businessEnd
          }
          onChange={(
            value
          ) =>
            patchSection(
              "general",
              {
                businessEnd:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "tickets"
  ) {
    return (
      <SettingsGrid>
        <SelectField
          label="Default priority"
          hint="Applied when no explicit priority is selected."
          value={
            draft.tickets
              .defaultPriority
          }
          options={[
            ["Urgent", "Urgent"],
            ["High", "High"],
            ["Normal", "Normal"],
            ["Low", "Low"],
          ]}
          onChange={(
            value
          ) =>
            patchSection(
              "tickets",
              {
                defaultPriority:
                  value as
                    SupportPriority,
              }
            )
          }
        />

        <NumberField
          label="Auto-close resolved tickets"
          hint="Hours after resolution before automatic closure."
          value={
            draft.tickets
              .autoCloseResolvedHours
          }
          min={1}
          max={720}
          suffix="hours"
          onChange={(
            value
          ) =>
            patchSection(
              "tickets",
              {
                autoCloseResolvedHours:
                  value,
              }
            )
          }
        />

        <TextField
          label="Ticket prefix"
          hint="Short uppercase prefix used for support ticket numbers."
          value={
            draft.tickets
              .ticketPrefix
          }
          onChange={(
            value
          ) =>
            patchSection(
              "tickets",
              {
                ticketPrefix:
                  value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9]/g,
                      ""
                    )
                    .slice(
                      0,
                      8
                    ),
              }
            )
          }
        />

        <ToggleField
          label="Allow reopen"
          description="Customers or agents may reopen eligible resolved tickets."
          checked={
            draft.tickets
              .allowReopen
          }
          onChange={(
            value
          ) =>
            patchSection(
              "tickets",
              {
                allowReopen:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "assignment"
  ) {
    return (
      <SettingsGrid>
        <ToggleField
          label="Automatic assignment"
          description="Automatically route new tickets to available agents."
          checked={
            draft.assignment
              .autoAssignment
          }
          onChange={(
            value
          ) =>
            patchSection(
              "assignment",
              {
                autoAssignment:
                  value,
              }
            )
          }
        />

        <SelectField
          label="Assignment strategy"
          hint="Controls how an eligible agent is selected."
          value={
            draft.assignment
              .strategy
          }
          options={[
            [
              "round_robin",
              "Round robin",
            ],
            [
              "least_open",
              "Least open tickets",
            ],
            [
              "manual",
              "Manual",
            ],
          ]}
          onChange={(
            value
          ) =>
            patchSection(
              "assignment",
              {
                strategy:
                  value as
                    AssignmentStrategy,
              }
            )
          }
        />

        <NumberField
          label="Maximum open tickets"
          hint="Soft capacity limit per support agent."
          value={
            draft.assignment
              .maxOpenTicketsPerAgent
          }
          min={1}
          max={200}
          suffix="tickets"
          onChange={(
            value
          ) =>
            patchSection(
              "assignment",
              {
                maxOpenTicketsPerAgent:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Fallback to unassigned"
          description="Keep the ticket unassigned if no agent is eligible."
          checked={
            draft.assignment
              .fallbackToUnassigned
          }
          onChange={(
            value
          ) =>
            patchSection(
              "assignment",
              {
                fallbackToUnassigned:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "sla"
  ) {
    return (
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(
            [
              [
                "urgent",
                "Urgent",
              ],
              [
                "high",
                "High",
              ],
              [
                "normal",
                "Normal",
              ],
              [
                "low",
                "Low",
              ],
            ] as const
          ).map(
            ([
              key,
              label,
            ]) => (
              <div
                key={
                  key
                }
                className="rounded-[22px] border border-border bg-muted/35 p-4"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  {label}
                </p>

                <div className="mt-4 space-y-3">
                  <NumberField
                    compact
                    label="First response"
                    hint="Minutes"
                    value={
                      draft.sla[
                        key
                      ]
                        .firstResponseMinutes
                    }
                    min={1}
                    max={10080}
                    suffix="min"
                    onChange={(
                      value
                    ) =>
                      patchSlaPriority(
                        key,
                        {
                          firstResponseMinutes:
                            value,
                        }
                      )
                    }
                  />

                  <NumberField
                    compact
                    label="Resolution"
                    hint="Minutes"
                    value={
                      draft.sla[
                        key
                      ]
                        .resolutionMinutes
                    }
                    min={1}
                    max={43200}
                    suffix="min"
                    onChange={(
                      value
                    ) =>
                      patchSlaPriority(
                        key,
                        {
                          resolutionMinutes:
                            value,
                        }
                      )
                    }
                  />
                </div>
              </div>
            )
          )}
        </div>

        <SettingsGrid>
          <NumberField
            label="SLA warning threshold"
            hint="Notify agents this many minutes before a target is breached."
            value={
              draft.sla
                .warningBeforeMinutes
            }
            min={1}
            max={1440}
            suffix="minutes"
            onChange={(
              value
            ) =>
              patchSection(
                "sla",
                {
                  warningBeforeMinutes:
                    value,
                }
              )
            }
          />

          <ToggleField
            label="Auto-escalate SLA breach"
            description="Escalate tickets automatically when SLA is breached."
            checked={
              draft.sla
                .autoEscalateOnBreach
            }
            onChange={(
              value
            ) =>
              patchSection(
                "sla",
                {
                  autoEscalateOnBreach:
                    value,
                }
              )
            }
          />
        </SettingsGrid>
      </div>
    );
  }

  if (
    activeSection ===
    "escalation"
  ) {
    return (
      <SettingsGrid>
        <ToggleField
          label="Escalation rules"
          description="Enable automatic escalation processing."
          checked={
            draft.escalation
              .enabled
          }
          onChange={(
            value
          ) =>
            patchSection(
              "escalation",
              {
                enabled:
                  value,
              }
            )
          }
        />

        <NumberField
          label="Unresolved escalation threshold"
          hint="Escalate open tickets after this many unresolved minutes."
          value={
            draft.escalation
              .unresolvedAfterMinutes
          }
          min={15}
          max={43200}
          suffix="minutes"
          onChange={(
            value
          ) =>
            patchSection(
              "escalation",
              {
                unresolvedAfterMinutes:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="SLA breach escalation"
          description="Escalate immediately after an SLA breach."
          checked={
            draft.escalation
              .slaBreachEscalation
          }
          onChange={(
            value
          ) =>
            patchSection(
              "escalation",
              {
                slaBreachEscalation:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Notify admin"
          description="Notify administrators when a case is escalated."
          checked={
            draft.escalation
              .notifyAdmin
          }
          onChange={(
            value
          ) =>
            patchSection(
              "escalation",
              {
                notifyAdmin:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "notifications"
  ) {
    return (
      <SettingsGrid>
        <ToggleField
          label="New ticket"
          description="Alert when a new support ticket enters the queue."
          checked={
            draft.notifications
              .newTicket
          }
          onChange={(
            value
          ) =>
            patchSection(
              "notifications",
              {
                newTicket:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Assignment"
          description="Alert when a ticket is assigned to an agent."
          checked={
            draft.notifications
              .assignment
          }
          onChange={(
            value
          ) =>
            patchSection(
              "notifications",
              {
                assignment:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="SLA warning"
          description="Alert before a response or resolution target is breached."
          checked={
            draft.notifications
              .slaWarning
          }
          onChange={(
            value
          ) =>
            patchSection(
              "notifications",
              {
                slaWarning:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Escalation"
          description="Alert when a ticket is escalated."
          checked={
            draft.notifications
              .escalation
          }
          onChange={(
            value
          ) =>
            patchSection(
              "notifications",
              {
                escalation:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Notification sound"
          description="Allow non-sensitive audible notification cues."
          checked={
            draft.notifications
              .sound
          }
          onChange={(
            value
          ) =>
            patchSection(
              "notifications",
              {
                sound:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "aiCopilot"
  ) {
    return (
      <SettingsGrid>
        <ToggleField
          label="AI Copilot"
          description="Enable AI assistance inside support workflows."
          checked={
            draft.aiCopilot
              .enabled
          }
          onChange={(
            value
          ) =>
            patchSection(
              "aiCopilot",
              {
                enabled:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Response suggestions"
          description="Generate response drafts for agent review."
          checked={
            draft.aiCopilot
              .responseSuggestions
          }
          onChange={(
            value
          ) =>
            patchSection(
              "aiCopilot",
              {
                responseSuggestions:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Conversation summaries"
          description="Generate concise internal summaries for long conversations."
          checked={
            draft.aiCopilot
              .summarizeConversations
          }
          onChange={(
            value
          ) =>
            patchSection(
              "aiCopilot",
              {
                summarizeConversations:
                  value,
              }
            )
          }
        />

        <NumberField
          label="Confidence threshold"
          hint="Minimum confidence before a suggestion is surfaced."
          value={
            draft.aiCopilot
              .confidenceThreshold
          }
          min={50}
          max={99}
          suffix="%"
          onChange={(
            value
          ) =>
            patchSection(
              "aiCopilot",
              {
                confidenceThreshold:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Require human approval"
          description="AI suggestions remain advisory and require agent approval."
          checked={
            draft.aiCopilot
              .requireHumanApproval
          }
          onChange={(
            value
          ) =>
            patchSection(
              "aiCopilot",
              {
                requireHumanApproval:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "knowledgeBase"
  ) {
    return (
      <SettingsGrid>
        <ToggleField
          label="Contextual suggestions"
          description="Suggest relevant knowledge-base content while handling a case."
          checked={
            draft.knowledgeBase
              .suggestionsEnabled
          }
          onChange={(
            value
          ) =>
            patchSection(
              "knowledgeBase",
              {
                suggestionsEnabled:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Internal articles"
          description="Allow internal-only articles inside the Support Console."
          checked={
            draft.knowledgeBase
              .internalArticles
          }
          onChange={(
            value
          ) =>
            patchSection(
              "knowledgeBase",
              {
                internalArticles:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Public articles"
          description="Allow public help-center articles in support suggestions."
          checked={
            draft.knowledgeBase
              .publicArticles
          }
          onChange={(
            value
          ) =>
            patchSection(
              "knowledgeBase",
              {
                publicArticles:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "savedReplies"
  ) {
    return (
      <SettingsGrid>
        <ToggleField
          label="Shared saved replies"
          description="Make approved response templates available to support agents."
          checked={
            draft.savedReplies
              .sharedEnabled
          }
          onChange={(
            value
          ) =>
            patchSection(
              "savedReplies",
              {
                sharedEnabled:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Allow agents to create"
          description="Support agents may create reusable reply templates."
          checked={
            draft.savedReplies
              .allowAgentCreate
          }
          onChange={(
            value
          ) =>
            patchSection(
              "savedReplies",
              {
                allowAgentCreate:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Approval required"
          description="New shared replies require approval before team-wide use."
          checked={
            draft.savedReplies
              .approvalRequired
          }
          onChange={(
            value
          ) =>
            patchSection(
              "savedReplies",
              {
                approvalRequired:
                  value,
              }
            )
          }
        />
      </SettingsGrid>
    );
  }

  if (
    activeSection ===
    "security"
  ) {
    return (
      <SettingsGrid>
        <ToggleField
          label="Mask sensitive data"
          description="Mask sensitive customer information in support views where possible."
          checked={
            draft.security
              .maskSensitiveData
          }
          onChange={(
            value
          ) =>
            patchSection(
              "security",
              {
                maskSensitiveData:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Audit agent actions"
          description="Record support actions for operational review."
          checked={
            draft.security
              .auditAgentActions
          }
          onChange={(
            value
          ) =>
            patchSection(
              "security",
              {
                auditAgentActions:
                  value,
              }
            )
          }
        />

        <ToggleField
          label="Reauthenticate sensitive views"
          description="Require fresh authentication before sensitive support workflows."
          checked={
            draft.security
              .requireReauthForSensitiveViews
          }
          onChange={(
            value
          ) =>
            patchSection(
              "security",
              {
                requireReauthForSensitiveViews:
                  value,
              }
            )
          }
        />

        <div className="rounded-[22px] border border-amber-500/20 bg-amber-500/[0.07] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

            <div>
              <p className="text-xs font-black text-foreground">
                Security policy
              </p>

              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                These preferences affect Support Console behavior only.
                Core authentication and platform-wide security remain
                controlled by administrator policy.
              </p>
            </div>
          </div>
        </div>
      </SettingsGrid>
    );
  }

  return (
    <SettingsGrid>
      <SelectField
        label="Workspace density"
        hint="Controls spacing inside support views."
        value={
          draft.appearance
            .density
        }
        options={[
          [
            "comfortable",
            "Comfortable",
          ],
          [
            "compact",
            "Compact",
          ],
        ]}
        onChange={(
          value
        ) =>
          patchSection(
            "appearance",
            {
              density:
                value as
                  SupportDensity,
            }
          )
        }
      />

      <ToggleField
        label="Animations"
        description="Enable decorative Support Console motion effects."
        checked={
          draft.appearance
            .animations
        }
        onChange={(
          value
        ) =>
          patchSection(
            "appearance",
            {
              animations:
                value,
            }
          )
        }
      />

      <ToggleField
        label="Compact sidebar"
        description="Prefer a denser support navigation experience."
        checked={
          draft.appearance
            .compactSidebar
        }
        onChange={(
          value
        ) =>
          patchSection(
            "appearance",
            {
              compactSidebar:
                value,
            }
          )
        }
      />

      <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
        <div className="flex items-start gap-3">
          <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />

          <div>
            <p className="text-xs font-black text-foreground">
              Theme ownership
            </p>

            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              Light and dark theme remain controlled by the existing
              application ThemeContext. This section only stores
              Support Console presentation preferences.
            </p>
          </div>
        </div>
      </div>
    </SettingsGrid>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function SettingsGrid({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {children}
    </div>
  );
}

function FieldShell({
  label,
  hint,
  children,
  compact = false,
}: {
  label: string;
  hint?: string;
  children:
    ReactNode;
  compact?: boolean;
}) {
  return (
    <label
      className={`block rounded-[22px] border border-border bg-muted/35 ${
        compact
          ? "p-3"
          : "p-4"
      }`}
    >
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
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange:
    (
      value:
        string
    ) => void;
}) {
  return (
    <FieldShell
      label={label}
      hint={hint}
    >
      <input
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
      />
    </FieldShell>
  );
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  suffix,
  onChange,
  compact = false,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange:
    (
      value:
        number
    ) => void;
  compact?: boolean;
}) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      compact={
        compact
      }
    >
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          value={
            value
          }
          onChange={(
            event
          ) => {
            const next =
              Number(
                event.target
                  .value
              );

            if (
              Number.isFinite(
                next
              )
            ) {
              onChange(
                next
              );
            }
          }}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-16 text-xs font-bold text-foreground outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
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
  options:
    Array<
      [
        string,
        string,
      ]
    >;
  onChange:
    (
      value:
        string
    ) => void;
}) {
  return (
    <FieldShell
      label={label}
      hint={hint}
    >
      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {optionLabel}
            </option>
          )
        )}
      </select>
    </FieldShell>
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
  onChange:
    (
      value:
        boolean
    ) => void;
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
        aria-checked={
          checked
        }
        onClick={() =>
          onChange(
            !checked
          )
        }
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition ${
          checked
            ? "border-emerald-500 bg-emerald-500"
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

function HeroMetric({
  label,
  value,
  icon:
    Icon,
}: {
  label: string;
  value: string;
  icon:
    React.ElementType;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 backdrop-blur-md">
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

/* =========================================================
   SKELETON
========================================================= */

function SupportSettingsSkeleton() {
  return (
    <main className="min-h-screen bg-transparent p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="h-[290px] animate-pulse rounded-[30px] bg-emerald-500/15" />

        <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
          <div className="hidden h-[620px] animate-pulse rounded-[26px] bg-muted lg:block" />

          <div className="h-[620px] animate-pulse rounded-[28px] bg-muted" />
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDateTime(
  value:
    string
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

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
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  );
}
