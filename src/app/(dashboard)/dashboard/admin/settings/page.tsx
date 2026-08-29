"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  Clock3,
  Database,
  Fingerprint,
  Gauge,
  History,
  KeyRound,
  Lock,
  Network,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  UserCog,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  adminSettingsApi,
  type AdminSettingsOverview,
} from "@/lib/api/adminSettingsApi";

type SectionId =
  | "overview"
  | "users"
  | "risk"
  | "security"
  | "audit"
  | "system"
  | "danger";

type DrawerType =
  | "changes"
  | "audit"
  | "role"
  | null;

type DangerAction =
  | "maintenance"
  | "lock-signups"
  | "reset"
  | null;

type AdminSettingsState = {
  platform: {
    maintenanceMode:
      boolean;

    allowSignups:
      boolean;

    defaultCurrency:
      | "BDT"
      | "USD"
      | "EUR";
  };

  risk: {
    dailyTransferLimit:
      number;

    reviewThreshold:
      number;

    requireKycForHighValue:
      boolean;

    velocityWindowMinutes:
      number;

    maxTransfersPerWindow:
      number;
  };

  security: {
    requireMfa:
      boolean;

    sessionTimeoutMins:
      number;

    maxLoginAttempts:
      number;

    requireReauthForSensitiveActions:
      boolean;
  };
};

type AuditItem = {
  id:
    string;

  actor:
    string;

  action:
    string;

  detail:
    string;

  time:
    string;

  severity:
    | "normal"
    | "warning"
    | "critical";

  ip:
    string;
};

type ToastState = {
  type:
    | "success"
    | "info"
    | "error";

  message:
    string;
};

const DEFAULT_SETTINGS:
  AdminSettingsState = {
  platform: {
    maintenanceMode:
      false,

    allowSignups:
      true,

    defaultCurrency:
      "BDT",
  },

  risk: {
    dailyTransferLimit:
      50000,

    reviewThreshold:
      25000,

    requireKycForHighValue:
      true,

    velocityWindowMinutes:
      30,

    maxTransfersPerWindow:
      8,
  },

  security: {
    requireMfa:
      true,

    sessionTimeoutMins:
      30,

    maxLoginAttempts:
      5,

    requireReauthForSensitiveActions:
      true,
  },
};

const EMPTY_OVERVIEW:
  AdminSettingsOverview = {
  activeUsers:
    0,

  adminUsers:
    0,

  pendingKyc:
    0,

  systemStatus:
    "operational",

  configurationHealth:
    0,

  riskIndex:
    0,

  services: {
    database:
      "review",

    api:
      "review",

    auth:
      "review",
  },
};

const SECTIONS: Array<{
  id:
    SectionId;

  label:
    string;

  description:
    string;

  icon:
    LucideIcon;

  keywords:
    string[];
}> = [
  {
    id:
      "overview",

    label:
      "Platform Overview",

    description:
      "Health and configuration summary",

    icon:
      Activity,

    keywords: [
      "health",
      "status",
      "metrics",
    ],
  },
  {
    id:
      "users",

    label:
      "Users & Roles",

    description:
      "Backend-supported roles and access",

    icon:
      Users,

    keywords: [
      "users",
      "roles",
      "permissions",
    ],
  },
  {
    id:
      "risk",

    label:
      "Transaction Risk",

    description:
      "Limits, velocity and review controls",

    icon:
      SlidersHorizontal,

    keywords: [
      "risk",
      "transaction",
      "limit",
      "velocity",
    ],
  },
  {
    id:
      "security",

    label:
      "Security Policies",

    description:
      "MFA, sessions and re-authentication",

    icon:
      ShieldCheck,

    keywords: [
      "security",
      "mfa",
      "session",
      "login",
    ],
  },
  {
    id:
      "audit",

    label:
      "Audit Activity",

    description:
      "Administrative change history",

    icon:
      History,

    keywords: [
      "audit",
      "history",
      "changes",
    ],
  },
  {
    id:
      "system",

    label:
      "System Preferences",

    description:
      "Availability and platform defaults",

    icon:
      Server,

    keywords: [
      "system",
      "maintenance",
      "currency",
      "signup",
    ],
  },
  {
    id:
      "danger",

    label:
      "Danger Controls",

    description:
      "Sensitive platform operations",

    icon:
      TriangleAlert,

    keywords: [
      "danger",
      "reset",
      "lock",
      "maintenance",
    ],
  },
];

const ROLE_MATRIX = [
  {
    capability:
      "Use personal wallet features",

    admin:
      true,

    user:
      true,
  },
  {
    capability:
      "Manage own profile and settings",

    admin:
      true,

    user:
      true,
  },
  {
    capability:
      "View own transactions and receipts",

    admin:
      true,

    user:
      true,
  },
  {
    capability:
      "Access platform administration",

    admin:
      true,

    user:
      false,
  },
  {
    capability:
      "Change platform configuration",

    admin:
      true,

    user:
      false,
  },
  {
    capability:
      "View platform settings audit",

    admin:
      true,

    user:
      false,
  },
];

const getErrorMessage = (
  error:
    unknown
): string => {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return "Something went wrong.";
};

export default function AdminSettingsPage() {
  const [
    mounted,
    setMounted,
  ] =
    useState(
      false
    );

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<SectionId>(
      "overview"
    );

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    savedSettings,
    setSavedSettings,
  ] =
    useState<AdminSettingsState>(
      DEFAULT_SETTINGS
    );

  const [
    draft,
    setDraft,
  ] =
    useState<AdminSettingsState>(
      DEFAULT_SETTINGS
    );

  const [
    overview,
    setOverview,
  ] =
    useState<AdminSettingsOverview>(
      EMPTY_OVERVIEW
    );

  const [
    auditItems,
    setAuditItems,
  ] =
    useState<AuditItem[]>(
      []
    );

  const [
    drawerType,
    setDrawerType,
  ] =
    useState<DrawerType>(
      null
    );

  const [
    drawerPayload,
    setDrawerPayload,
  ] =
    useState<
      | AuditItem
      | {
          role:
            string;
        }
      | null
    >(
      null
    );

  const [
    dangerAction,
    setDangerAction,
  ] =
    useState<DangerAction>(
      null
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastState | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    loadError,
    setLoadError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    reauthOpen,
    setReauthOpen,
  ] =
    useState(
      false
    );

  const [
    reauthPassword,
    setReauthPassword,
  ] =
    useState("");

  const [
    reauthError,
    setReauthError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const loadPlatformSettings =
    async (
      silent =
        false
    ) => {
      if (!silent) {
        setLoading(
          true
        );
      }

      setLoadError(
        null
      );

      try {
        const data =
          await adminSettingsApi.get();

        setSavedSettings(
          data.settings
        );

        setDraft(
          data.settings
        );

        setOverview(
          data.overview
        );

        setAuditItems(
          data.auditItems
        );
      } catch (
        error
      ) {
        const message =
          getErrorMessage(
            error
          );

        setLoadError(
          message
        );

        if (silent) {
          setToast({
            type:
              "error",

            message,
          });
        }
      } finally {
        if (!silent) {
          setLoading(
            false
          );
        }
      }
    };

  useEffect(() => {
    setMounted(
      true
    );

    void loadPlatformSettings();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          setToast(
            null
          ),
        2800
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    toast,
  ]);

  const hasUnsavedChanges =
    useMemo(
      () =>
        JSON.stringify(
          savedSettings
        ) !==
        JSON.stringify(
          draft
        ),
      [
        savedSettings,
        draft,
      ]
    );

  const filteredSections =
    useMemo(() => {
      const q =
        searchQuery
          .trim()
          .toLowerCase();

      if (!q) {
        return SECTIONS;
      }

      return SECTIONS.filter(
        (
          section
        ) =>
          section.label
            .toLowerCase()
            .includes(
              q
            ) ||
          section.description
            .toLowerCase()
            .includes(
              q
            ) ||
          section.keywords.some(
            (
              keyword
            ) =>
              keyword.includes(
                q
              )
          )
      );
    }, [
      searchQuery,
    ]);

  /*
   * These two scores remain client-side previews while
   * editing. After save, the backend returns the same
   * configuration health/risk calculation as source of truth.
   */
  const healthScore =
    useMemo(() => {
      let score =
        58;

      if (
        draft.security
          .requireMfa
      ) {
        score +=
          12;
      }

      if (
        draft.security
          .requireReauthForSensitiveActions
      ) {
        score +=
          10;
      }

      if (
        draft.risk
          .requireKycForHighValue
      ) {
        score +=
          8;
      }

      if (
        draft.security
          .maxLoginAttempts <=
        5
      ) {
        score +=
          5;
      }

      if (
        !draft.platform
          .maintenanceMode
      ) {
        score +=
          4;
      }

      if (
        draft.platform
          .allowSignups
      ) {
        score +=
          3;
      }

      return Math.min(
        score,
        100
      );
    }, [
      draft,
    ]);

  const riskLevel =
    useMemo(() => {
      const thresholdRatio =
        draft.risk
          .reviewThreshold /
        Math.max(
          draft.risk
            .dailyTransferLimit,
          1
        );

      const velocityRisk =
        draft.risk
          .maxTransfersPerWindow >
        10
          ? 22
          : draft.risk
                .maxTransfersPerWindow >
              7
            ? 12
            : 6;

      const base =
        Math.round(
          thresholdRatio *
            55
        ) +
        velocityRisk +
        (
          draft.risk
            .requireKycForHighValue
            ? 5
            : 20
        );

      return Math.min(
        Math.max(
          base,
          10
        ),
        95
      );
    }, [
      draft.risk,
    ]);

  const requestSave =
    () => {
      setReauthPassword(
        ""
      );

      setReauthError(
        null
      );

      setReauthOpen(
        true
      );
    };

  const saveChanges =
    async () => {
      if (
        !reauthPassword
      ) {
        setReauthError(
          "Current admin password is required."
        );

        return;
      }

      setSaving(
        true
      );

      setReauthError(
        null
      );

      try {
        const result =
          await adminSettingsApi.update(
            draft,
            reauthPassword
          );

        setSavedSettings(
          result.settings
        );

        setDraft(
          result.settings
        );

        setReauthOpen(
          false
        );

        setReauthPassword(
          ""
        );

        setToast({
          type:
            "success",

          message:
            result.message,
        });

        await loadPlatformSettings(
          true
        );
      } catch (
        error
      ) {
        setReauthError(
          getErrorMessage(
            error
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const discardChanges =
    () => {
      setDraft(
        savedSettings
      );

      setToast({
        type:
          "info",

        message:
          "Unsaved configuration changes were discarded.",
      });
    };

  const confirmDangerAction =
    () => {
      if (
        dangerAction ===
        "reset"
      ) {
        setDraft(
          DEFAULT_SETTINGS
        );

        setDangerAction(
          null
        );

        setToast({
          type:
            "info",

          message:
            "Backend defaults are staged. Save changes to apply them.",
        });

        return;
      }

      if (
        dangerAction ===
        "maintenance"
      ) {
        setDraft(
          (
            current
          ) => ({
            ...current,

            platform: {
              ...current.platform,

              maintenanceMode:
                true,
            },
          })
        );

        setDangerAction(
          null
        );

        setToast({
          type:
            "info",

          message:
            "Maintenance mode is staged. Save changes to apply it.",
        });

        return;
      }

      if (
        dangerAction ===
        "lock-signups"
      ) {
        setDraft(
          (
            current
          ) => ({
            ...current,

            platform: {
              ...current.platform,

              allowSignups:
                false,
            },
          })
        );

        setDangerAction(
          null
        );

        setToast({
          type:
            "info",

          message:
            "Signup lock is staged. Save changes to apply it.",
        });
      }
    };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F7FB]" />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] px-4 py-10">
        <div className="mx-auto flex min-h-[420px] w-full max-w-[1500px] items-center justify-center rounded-[30px] border border-slate-200 bg-white">
          <div className="text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#1F5EA8]" />

            <p className="mt-4 text-sm font-black text-[#0F2745]">
              Loading platform settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] px-4 py-10">
        <div className="mx-auto flex min-h-[420px] w-full max-w-[900px] items-center justify-center rounded-[30px] border border-rose-100 bg-white p-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />

            <h1 className="mt-4 text-xl font-black text-[#0F2745]">
              Could not load platform settings
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadPlatformSettings()
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-black text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-[radial-gradient(circle_at_top_left,#eef7ff_0%,#f5f8fc_36%,#f4f7fb_72%)] pb-10 text-[#0F2745] sm:pb-12">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <AdminHero
          healthScore={
            healthScore
          }
          onOpenChanges={() =>
            setDrawerType(
              "changes"
            )
          }
        />

        <div className="mt-4 space-y-5">
          <SettingsNavigation
            activeSection={
              activeSection
            }
            searchQuery={
              searchQuery
            }
            sections={
              filteredSections
            }
            onSearchChange={
              setSearchQuery
            }
            onSectionChange={
              setActiveSection
            }
          />

          <section className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  activeSection
                }
                initial={{
                  opacity:
                    0,
                  y:
                    14,
                  scale:
                    0.992,
                }}
                animate={{
                  opacity:
                    1,
                  y:
                    0,
                  scale:
                    1,
                }}
                exit={{
                  opacity:
                    0,
                  y:
                    -8,
                }}
                transition={{
                  duration:
                    0.28,
                }}
                className="min-w-0"
              >
                {activeSection ===
                  "overview" && (
                  <OverviewSection
                    draft={
                      draft
                    }
                    overview={
                      overview
                    }
                    healthScore={
                      healthScore
                    }
                    riskLevel={
                      riskLevel
                    }
                    auditItems={
                      auditItems
                    }
                    onOpenChanges={() =>
                      setDrawerType(
                        "changes"
                      )
                    }
                    onOpenAudit={(
                      item
                    ) => {
                      setDrawerPayload(
                        item
                      );

                      setDrawerType(
                        "audit"
                      );
                    }}
                  />
                )}

                {activeSection ===
                  "users" && (
                  <UsersRolesSection
                    activeUsers={
                      overview.activeUsers
                    }
                    adminUsers={
                      overview.adminUsers
                    }
                    onOpenRole={(
                      role
                    ) => {
                      setDrawerPayload({
                        role,
                      });

                      setDrawerType(
                        "role"
                      );
                    }}
                  />
                )}

                {activeSection ===
                  "risk" && (
                  <RiskSection
                    draft={
                      draft
                    }
                    riskLevel={
                      riskLevel
                    }
                    setDraft={
                      setDraft
                    }
                  />
                )}

                {activeSection ===
                  "security" && (
                  <SecuritySection
                    draft={
                      draft
                    }
                    setDraft={
                      setDraft
                    }
                  />
                )}

                {activeSection ===
                  "audit" && (
                  <AuditSection
                    items={
                      auditItems
                    }
                    onOpenAudit={(
                      item
                    ) => {
                      setDrawerPayload(
                        item
                      );

                      setDrawerType(
                        "audit"
                      );
                    }}
                  />
                )}

                {activeSection ===
                  "system" && (
                  <SystemSection
                    draft={
                      draft
                    }
                    setDraft={
                      setDraft
                    }
                  />
                )}

                {activeSection ===
                  "danger" && (
                  <DangerSection
                    maintenanceMode={
                      draft.platform
                        .maintenanceMode
                    }
                    allowSignups={
                      draft.platform
                        .allowSignups
                    }
                    onAction={
                      setDangerAction
                    }
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {hasUnsavedChanges && (
          <SaveBar
            saving={
              saving
            }
            onSave={
              requestSave
            }
            onDiscard={
              discardChanges
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerType && (
          <SettingsDrawer
            type={
              drawerType
            }
            payload={
              drawerPayload
            }
            auditItems={
              auditItems
            }
            onClose={() => {
              setDrawerType(
                null
              );

              setDrawerPayload(
                null
              );
            }}
            onOpenAudit={(
              item
            ) => {
              setDrawerPayload(
                item
              );

              setDrawerType(
                "audit"
              );
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        action={
          dangerAction
        }
        onCancel={() =>
          setDangerAction(
            null
          )
        }
        onConfirm={
          confirmDangerAction
        }
      />

      <AdminReauthModal
        open={
          reauthOpen
        }
        password={
          reauthPassword
        }
        error={
          reauthError
        }
        saving={
          saving
        }
        onPasswordChange={
          setReauthPassword
        }
        onCancel={() => {
          if (saving) {
            return;
          }

          setReauthOpen(
            false
          );

          setReauthPassword(
            ""
          );

          setReauthError(
            null
          );
        }}
        onConfirm={() =>
          void saveChanges()
        }
      />

      <AnimatePresence>
        {toast && (
          <Toast
            toast={
              toast
            }
            onClose={() =>
              setToast(
                null
              )
            }
          />
        )}
      </AnimatePresence>
    </main>
  );
}


/* =========================================================
   HERO
========================================================= */

function AdminHero({ healthScore, onOpenChanges }: { healthScore: number; onOpenChanges: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(118deg,#07182b_0%,#0c3153_46%,#17689c_100%)] px-5 py-6 text-white shadow-[0_28px_85px_rgba(15,39,69,0.22)] sm:px-7 sm:py-8 lg:px-9"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:34px_34px]" />

      <motion.div
        className="pointer-events-none absolute -right-28 -top-40 h-[430px] w-[430px] rounded-full border border-cyan-300/15"
        animate={{ rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl"
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-center">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl">
              <motion.span
                className="absolute inset-1 rounded-xl border border-cyan-300/20"
                animate={{ rotate: [0, 4, 0, -4, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <Settings className="relative h-5 w-5 text-cyan-200" />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/65">
                Coffer Control Center
              </p>
              <p className="mt-0.5 text-xs font-bold text-blue-100/65">
                Secure platform configuration
              </p>
            </div>
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
            Administration Settings
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/70 sm:text-[15px]">
            Manage platform availability, transaction-risk controls, authentication policies and audit-sensitive operations from one protected workspace.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill icon={ShieldCheck} text="Admin protected" tone="green" />
            <StatusPill icon={Gauge} text="Risk controls" tone="blue" />
            <StatusPill icon={History} text="Audited changes" tone="blue" />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenChanges}
          className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.08] p-5 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12]"
        >
          <motion.div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-emerald-300/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative z-10 flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <motion.span
                className="absolute inset-0 rounded-full border border-emerald-300/20"
                animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.35, 0.8, 0.35] }}
                transition={{ duration: 2.8, repeat: Infinity }}
              />
              <motion.span
                className="absolute inset-[8px] rounded-full border-2 border-emerald-300/45 border-r-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              />
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-emerald-300/10">
                <span className="text-xl font-black text-white">{healthScore}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.13em] text-emerald-100/65">Health</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-100/50">
                Configuration Health
              </p>
              <p className="mt-1 text-base font-black text-white">
                Platform controls look healthy
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-blue-100/55">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />
                Open recent configuration changes
              </div>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-blue-100/45 transition group-hover:translate-x-1 group-hover:text-white" />
          </div>
        </button>
      </div>
    </motion.section>
  );
}

/* =========================================================
   NAVIGATION
========================================================= */


function SettingsNavigation({
  activeSection,
  searchQuery,
  sections,
  onSearchChange,
  onSectionChange,
}: {
  activeSection: SectionId;
  searchQuery: string;
  sections: typeof SECTIONS;
  onSearchChange: (value: string) => void;
  onSectionChange: (id: SectionId) => void;
}) {
  const shortLabel: Record<SectionId, string> = {
    overview: "Overview",
    users: "Roles",
    risk: "Risk",
    security: "Security",
    audit: "Audit",
    system: "System",
    danger: "Danger",
  };

  return (
    <aside className="sticky top-3 z-40 min-w-0">
      <div className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/95 shadow-[0_18px_55px_rgba(15,39,69,0.09)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 p-3 2xl:flex-row 2xl:items-center">
          <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl bg-[linear-gradient(135deg,#f8fbff,#ffffff)] px-3 py-2.5 2xl:w-[218px] 2xl:justify-start">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0F2745] text-cyan-200 shadow-[0_8px_22px_rgba(15,39,69,.18)]">
                <SlidersHorizontal className="h-[18px] w-[18px]" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-35" />
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Admin Console
                </p>
                <p className="mt-0.5 truncate text-sm font-black tracking-[-0.01em] text-[#0F2745]">
                  Platform Controls
                </p>
              </div>
            </div>

            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700 2xl:hidden">
              Protected
            </span>
          </div>

          <div className="order-3 grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7 2xl:order-2">
            {sections.length === 0 ? (
              <div className="col-span-full flex min-h-12 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-400">
                No matching settings
              </div>
            ) : (
              sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <motion.button
                    key={section.id}
                    type="button"
                    onClick={() => onSectionChange(section.id)}
                    title={`${section.label} — ${section.description}`}
                    whileTap={{ scale: 0.97 }}
                    className={`group relative flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-2xl border px-2.5 py-3 transition-all duration-200 ${
                      active
                        ? "border-[#143c63] bg-[#0F2745] text-white shadow-[0_10px_28px_rgba(15,39,69,0.18)]"
                        : "border-transparent bg-[#F7F9FC] text-slate-600 hover:border-blue-100 hover:bg-blue-50 hover:text-[#1F5EA8]"
                    }`}
                  >
                    {active && (
                      <>
                        <motion.span
                          layoutId="admin-settings-dock-active"
                          className="absolute inset-x-4 bottom-0 h-[3px] rounded-t-full bg-cyan-300"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                        <motion.span
                          className="pointer-events-none absolute -right-6 -top-8 h-16 w-16 rounded-full bg-cyan-300/10 blur-xl"
                          animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.2, 0.6, 0.2] }}
                          transition={{ duration: 3.4, repeat: Infinity }}
                        />
                      </>
                    )}

                    <Icon className={`relative z-10 h-4 w-4 shrink-0 ${active ? "text-cyan-200" : ""}`} />
                    <span className="relative z-10 truncate text-[10px] font-black tracking-[-0.01em] sm:text-[11px]">
                      {shortLabel[section.id]}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>

          <div className="relative order-2 w-full 2xl:order-3 2xl:w-[260px]">
            <div className="pointer-events-none absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
              <Search className="h-3.5 w-3.5" />
            </div>

            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search controls..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] pl-12 pr-10 text-xs font-semibold text-[#0F2745] outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="hidden border-t border-slate-100 px-4 py-2 2xl:flex 2xl:items-center 2xl:justify-between">
          <p className="text-[9px] font-semibold text-slate-400">
            Search, switch sections, and stage configuration changes from this control strip.
          </p>
          <div className="flex items-center gap-2 text-[9px] font-black text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Backend authorization enforced
          </div>
        </div>
      </div>
    </aside>
  );
}

function OverviewSection({
  draft,
  overview,
  healthScore,
  riskLevel,
  auditItems,
  onOpenChanges,
  onOpenAudit,
}: {
  draft: AdminSettingsState;
  overview: AdminSettingsOverview;
  healthScore: number;
  riskLevel: number;
  auditItems: AuditItem[];
  onOpenChanges: () => void;
  onOpenAudit: (item: AuditItem) => void;
}) {
  const authScore = draft.security.requireMfa ? 95 : 72;
  const riskScore = draft.risk.requireKycForHighValue ? 96 : 78;
  const systemScore = draft.platform.maintenanceMode ? 76 : 99;

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Overview"
        title="Platform Overview"
        description="Live operational health, access, risk and security configuration from the protected backend."
        icon={Activity}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          title="Active Users"
          value={overview.activeUsers.toLocaleString("en-US")}
          note={`${overview.adminUsers.toLocaleString("en-US")} administrator${overview.adminUsers === 1 ? "" : "s"}`}
          tone="green"
        />

        <MetricCard
          icon={UserCog}
          title="Pending KYC"
          value={overview.pendingKyc.toLocaleString("en-US")}
          note={overview.pendingKyc > 0 ? "Requires review" : "Queue is clear"}
          tone={overview.pendingKyc > 0 ? "amber" : "green"}
        />

        <MetricCard
          icon={Activity}
          title="System Status"
          value={overview.systemStatus === "maintenance" ? "Maintenance" : "Operational"}
          note="Backend configuration state"
          tone={overview.systemStatus === "maintenance" ? "amber" : "green"}
        />

        <MetricCard
          icon={ShieldAlert}
          title="Risk Index"
          value={`${riskLevel}%`}
          note={riskLevel > 65 ? "Review policies" : "Within policy"}
          tone={riskLevel > 65 ? "amber" : "blue"}
        />
      </div>

      <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <SystemHealthCard
          healthScore={healthScore}
          authScore={authScore}
          riskScore={riskScore}
          systemScore={systemScore}
        />

        <RecentChangesCard
          items={auditItems}
          onOpenAll={onOpenChanges}
          onOpenAudit={onOpenAudit}
        />
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_12px_36px_rgba(15,39,69,0.045)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              Infrastructure
            </p>
            <h3 className="mt-1 text-base font-black text-[#0F2745]">
              Service readiness
            </h3>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live backend status
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <OperationalCard
            icon={Database}
            title="Data Layer"
            value={overview.services.database === "healthy" ? "Healthy" : "Review"}
            detail="Platform settings are reaching the database successfully."
            pulse={overview.services.database === "healthy"}
          />

          <OperationalCard
            icon={Network}
            title="API Gateway"
            value={overview.services.api === "healthy" ? "Healthy" : "Review"}
            detail="Protected administration endpoints are responding."
            pulse={overview.services.api === "healthy"}
          />

          <OperationalCard
            icon={Fingerprint}
            title="Auth Layer"
            value={overview.services.auth === "configured" ? "Configured" : "Review"}
            detail="Authentication configuration is present; enforcement status stays explicit."
            pulse={overview.services.auth === "configured"}
          />
        </div>
      </div>
    </div>
  );
}

function SystemHealthCard({
  healthScore,
  authScore,
  riskScore,
  systemScore,
}: {
  healthScore: number;
  authScore: number;
  riskScore: number;
  systemScore: number;
}) {
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="relative h-full min-w-0 overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#0b213d_0%,#10385d_58%,#155f88_100%)] p-5 text-white shadow-[0_20px_62px_rgba(15,39,69,0.18)] sm:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:30px_30px]" />

      <motion.div
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border border-cyan-300/15"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="pointer-events-none absolute -bottom-28 left-[25%] h-64 w-64 rounded-full bg-cyan-300/[0.06] blur-3xl"
        animate={{ x: [-12, 24, -12], y: [10, -12, 10] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
        <div className="flex items-center justify-center">
          <div className="relative h-40 w-40 shrink-0">
            <motion.div
              className="absolute inset-[-10px] rounded-full border border-cyan-300/15"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-[-4px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,.9)]" />
              <span className="absolute bottom-[18px] right-[3px] h-2 w-2 rounded-full bg-emerald-300" />
            </motion.div>

            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
              <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="9" />
              <motion.circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="#34d399"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - healthScore / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={healthScore}
                initial={{ opacity: 0, scale: 0.78 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[36px] font-black tracking-tight"
              >
                {healthScore}
              </motion.span>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-100/45">
                Health score
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-cyan-100/55">
            Configuration Health
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.025em] sm:text-[28px]">
            Platform securely configured
          </h3>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-blue-100/65">
            This score summarizes risk policies, authentication requirements and operational configuration without hiding controls that still require deeper enforcement.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <HealthMini label="Risk" value={riskScore} />
            <HealthMini label="Auth" value={authScore} />
            <HealthMini label="System" value={systemScore} />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
        <AnimatedHealthBar label="Risk Policies" value={riskScore} />
        <AnimatedHealthBar label="Auth Policies" value={authScore} />
        <AnimatedHealthBar label="System Config" value={systemScore} />
      </div>
    </div>
  );
}

function HealthMini({ label, value }: { label: string; value: number }) {
  const state = value >= 90 ? "Strong" : value >= 75 ? "Good" : "Review";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-100/45">{label}</p>
        <span className={`h-2 w-2 rounded-full ${value >= 90 ? "bg-emerald-300" : value >= 75 ? "bg-amber-300" : "bg-rose-300"}`} />
      </div>
      <p className="mt-2 text-xl font-black">{value}%</p>
      <p className="mt-0.5 text-[9px] font-bold text-blue-100/45">{state}</p>
    </motion.div>
  );
}

function AnimatedHealthBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5">
      <div className="flex items-center justify-between gap-3 text-[10px]">
        <span className="truncate font-semibold text-blue-100/60">{label}</span>
        <span className="font-black">{value}%</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className={`h-full rounded-full ${value >= 90 ? "bg-emerald-400" : value >= 75 ? "bg-amber-400" : "bg-rose-400"}`}
        />
      </div>
    </div>
  );
}

function RecentChangesCard({
  items,
  onOpenAll,
  onOpenAudit,
}: {
  items: AuditItem[];
  onOpenAll: () => void;
  onOpenAudit: (item: AuditItem) => void;
}) {
  const critical = items.filter((item) => item.severity === "critical").length;
  const warning = items.filter((item) => item.severity === "warning").length;

  return (
    <div className="relative flex h-full min-h-[430px] min-w-0 flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,39,69,0.055)] sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-50" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-cyan-50/60 blur-2xl" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8] ring-1 ring-blue-100">
              <History className="h-4 w-4" />
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0F2745] px-1 text-[8px] font-black text-white">
                  {Math.min(items.length, 99)}
                </span>
              )}
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1F5EA8]">
              Activity
            </p>
          </div>

          <h3 className="mt-3 text-[22px] font-black tracking-[-0.025em] text-[#0F2745]">
            Recent Changes
          </h3>
          <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-500">
            Latest backend-recorded platform configuration activity and audit severity.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAll}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black text-[#1F5EA8] transition hover:border-[#1F5EA8] hover:bg-[#1F5EA8] hover:text-white"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
        <ActivityMini label="Events" value={items.length} tone="blue" />
        <ActivityMini label="Warnings" value={warning} tone="amber" />
        <ActivityMini label="Critical" value={critical} tone="rose" />
      </div>

      <div className="relative z-10 mt-4 flex flex-1 flex-col">
        {items.length === 0 ? (
          <div className="relative flex min-h-[235px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-blue-100 bg-[linear-gradient(145deg,#f9fcff_0%,#f4f8fd_100%)] px-5 py-8 text-center">
            <motion.div
              className="pointer-events-none absolute h-40 w-40 rounded-full border border-blue-100/80"
              animate={{ scale: [0.84, 1.08, 0.84], opacity: [0.15, 0.5, 0.15] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="pointer-events-none absolute h-28 w-28 rounded-full border border-cyan-100"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-400" />
            </motion.div>

            <motion.div
              className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-[#1F5EA8] shadow-[0_8px_24px_rgba(31,94,168,.10)]"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <History className="h-5 w-5" />
            </motion.div>

            <p className="relative z-10 mt-4 text-sm font-black tracking-[-0.01em] text-[#0F2745]">
              No platform setting changes yet
            </p>
            <p className="relative z-10 mx-auto mt-1 max-w-xs text-[10px] leading-5 text-slate-400">
              Your first saved configuration change will appear here with actor, severity and audit metadata.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.slice(0, 4).map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onOpenAudit(item)}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ x: 3 }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3.5 text-left transition hover:border-blue-100 hover:bg-white hover:shadow-sm"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    item.severity === "critical"
                      ? "bg-rose-50 text-rose-600"
                      : item.severity === "warning"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-[#1F5EA8]"
                  }`}
                >
                  {item.severity === "critical" ? <ShieldAlert className="h-4 w-4" /> : <History className="h-4 w-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-slate-800">{item.action}</p>
                  <p className="mt-1 truncate text-[10px] text-slate-400">{item.detail}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-bold text-slate-400">{item.time}</p>
                  <ChevronRight className="ml-auto mt-1 h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "rose";
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-600"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600"
        : "bg-blue-50 text-[#1F5EA8]";

  return (
    <div className={`rounded-xl px-3 py-2.5 ${toneClass}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.12em] opacity-65">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

/* =========================================================
   USERS & ROLES
========================================================= */

function UsersRolesSection({
  activeUsers,
  adminUsers,
  onOpenRole,
}: {
  activeUsers:
    number;
  adminUsers:
    number;
  onOpenRole:
    (
      role:
        string
    ) => void;
}) {
  const roles = [
    {
      title:
        "Administrator",

      members:
        adminUsers,

      permissions:
        ROLE_MATRIX.filter(
          (
            row
          ) =>
            row.admin
        ).length,

      icon:
        ShieldCheck,

      description:
        "Full platform administration and configuration access.",
    },
    {
      title:
        "User",

      members:
        activeUsers,

      permissions:
        ROLE_MATRIX.filter(
          (
            row
          ) =>
            row.user
        ).length,

      icon:
        Users,

      description:
        "Standard authenticated wallet access scoped to the user's own account.",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Access"
        title="Users & Roles"
        description="This view now reflects the roles currently supported by the backend User model: admin and user."
        icon={
          Users
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map(
          (
            role,
            index
          ) => {
            const Icon =
              role.icon;

            return (
              <motion.button
                key={
                  role.title
                }
                type="button"
                onClick={() =>
                  onOpenRole(
                    role.title
                  )
                }
                initial={{
                  opacity:
                    0,
                  y:
                    12,
                }}
                animate={{
                  opacity:
                    1,
                  y:
                    0,
                }}
                transition={{
                  delay:
                    index *
                    0.06,
                }}
                whileHover={{
                  y:
                    -4,
                }}
                className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-100"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-sm font-black">
                  {
                    role.title
                  }
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                  {
                    role.description
                  }
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] font-bold text-slate-500">
                  <span>
                    {
                      role.members
                    }{" "}
                    member
                    {role.members ===
                    1
                      ? ""
                      : "s"}
                  </span>

                  <span>
                    {
                      role.permissions
                    }{" "}
                    capabilities
                  </span>
                </div>
              </motion.button>
            );
          }
        )}
      </div>

      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-black">
            Permission Matrix
          </h3>

          <p className="mt-1 text-[10px] text-slate-400">
            UI summary only. Backend route authorization remains the source of truth.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-left">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-5 py-4 text-xs font-black text-slate-500">
                  Capability
                </th>

                <th className="px-5 py-4 text-center text-xs font-black text-slate-500">
                  Admin
                </th>

                <th className="px-5 py-4 text-center text-xs font-black text-slate-500">
                  User
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {ROLE_MATRIX.map(
                (
                  row
                ) => (
                  <tr
                    key={
                      row.capability
                    }
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">
                      {
                        row.capability
                      }
                    </td>

                    <PermissionCell
                      allowed={
                        row.admin
                      }
                    />

                    <PermissionCell
                      allowed={
                        row.user
                      }
                    />
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-5 py-4 text-center">
      {allowed ? <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" /> : <Lock className="mx-auto h-4 w-4 text-slate-300" />}
    </td>
  );
}

/* =========================================================
   RISK
========================================================= */

function RiskSection({
  draft, riskLevel, setDraft,
}: {
  draft: AdminSettingsState;
  riskLevel: number;
  setDraft: React.Dispatch<React.SetStateAction<AdminSettingsState>>;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Transaction Controls" title="Transaction Risk Engine" description="Tune amount thresholds, velocity controls and KYC requirements for sensitive wallet operations." icon={Gauge} />

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <RangeField
            label="Daily Transfer Limit"
            description="Maximum standard transfer amount per user before additional checks."
            value={draft.risk.dailyTransferLimit}
            min={10000}
            max={500000}
            step={5000}
            onChange={(value) => setDraft((c) => ({ ...c, risk: { ...c.risk, dailyTransferLimit: value } }))}
          />
          <div className="border-t border-slate-100 pt-5">
            <RangeField
              label="Manual Review Threshold"
              description="Transfers above this amount enter enhanced review."
              value={draft.risk.reviewThreshold}
              min={5000}
              max={100000}
              step={5000}
              onChange={(value) => setDraft((c) => ({ ...c, risk: { ...c.risk, reviewThreshold: value } }))}
            />
          </div>
          <div className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
            <NumberField
              label="Velocity window"
              suffix="minutes"
              value={draft.risk.velocityWindowMinutes}
              min={5}
              max={120}
              onChange={(value) => setDraft((c) => ({ ...c, risk: { ...c.risk, velocityWindowMinutes: value } }))}
            />
            <NumberField
              label="Transfers per window"
              suffix="transfers"
              value={draft.risk.maxTransfersPerWindow}
              min={2}
              max={30}
              onChange={(value) => setDraft((c) => ({ ...c, risk: { ...c.risk, maxTransfersPerWindow: value } }))}
            />
          </div>
          <div className="border-t border-slate-100 pt-5">
            <ToggleRow
              label="Require KYC for high-value transfers"
              description="Require verified identity before the high-value transaction path can proceed."
              enabled={draft.risk.requireKycForHighValue}
              onChange={(value) => setDraft((c) => ({ ...c, risk: { ...c.risk, requireKycForHighValue: value } }))}
            />
          </div>
        </div>

        <RiskVisualizer
          riskLevel={riskLevel}
          threshold={draft.risk.reviewThreshold}
          dailyLimit={draft.risk.dailyTransferLimit}
          velocity={draft.risk.maxTransfersPerWindow}
        />
      </div>
    </div>
  );
}


function RiskVisualizer({
  riskLevel,
  threshold,
  dailyLimit,
  velocity,
}: {
  riskLevel: number;
  threshold: number;
  dailyLimit: number;
  velocity: number;
}) {
  const angle =
    (
      riskLevel /
        100
    ) *
      180 -
    90;

  return (
    <div className="relative self-start overflow-hidden rounded-[28px] bg-[#0F2745] p-5 text-white shadow-[0_18px_50px_rgba(15,39,69,.14)] sm:p-6">
      <motion.div
        className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border border-cyan-300/10"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-blue-400/[0.06] blur-3xl"
        animate={{
          scale: [
            0.9,
            1.15,
            0.9,
          ],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />

      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/50">
          Live Policy Simulation
        </p>

        <h3 className="mt-2 text-lg font-black">
          Transaction risk posture
        </h3>

        <div className="relative mx-auto mt-6 w-full max-w-[300px]">
          <svg
            viewBox="0 0 240 150"
            className="h-auto w-full overflow-visible"
          >
            <defs>
              <linearGradient
                id="riskArcGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="#34d399"
                />

                <stop
                  offset="52%"
                  stopColor="#fbbf24"
                />

                <stop
                  offset="100%"
                  stopColor="#fb7185"
                />
              </linearGradient>
            </defs>

            <path
              d="M 30 120 A 90 90 0 0 1 210 120"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="18"
              strokeLinecap="round"
            />

            <motion.path
              d="M 30 120 A 90 90 0 0 1 210 120"
              fill="none"
              stroke="url(#riskArcGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{
                pathLength: 0,
                opacity: 0.4,
              }}
              animate={{
                pathLength: 1,
                opacity: 1,
              }}
              transition={{
                duration: 1.1,
                ease: "easeOut",
              }}
            />

            <motion.g
              animate={{
                rotate:
                  angle,
              }}
              transition={{
                type: "spring",
                stiffness: 110,
                damping: 18,
              }}
              style={{
                transformOrigin:
                  "120px 120px",
              }}
            >
              <line
                x1="120"
                y1="120"
                x2="120"
                y2="50"
                stroke="#ecfeff"
                strokeWidth="4"
                strokeLinecap="round"
              />

              <circle
                cx="120"
                cy="50"
                r="5"
                fill="#a5f3fc"
              />
            </motion.g>

            <circle
              cx="120"
              cy="120"
              r="10"
              fill="#0F2745"
              stroke="#67e8f9"
              strokeWidth="4"
            />
          </svg>

          <div className="-mt-3 text-center">
            <motion.p
              key={
                riskLevel
              }
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="text-3xl font-black"
            >
              {riskLevel}
            </motion.p>

            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-100/45">
              Risk Index
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <RiskStat
            label="Review"
            value={`৳${Math.round(
              threshold /
                1000
            )}k`}
          />

          <RiskStat
            label="Limit"
            value={`৳${Math.round(
              dailyLimit /
                1000
            )}k`}
          />

          <RiskStat
            label="Velocity"
            value={`${velocity}x`}
          />
        </div>
      </div>
    </div>
  );
}

function RiskStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.05] px-2 py-3 text-center">
      <p className="truncate text-[9px] text-blue-100/45">{label}</p>
      <p className="mt-1 truncate text-xs font-black">{value}</p>
    </div>
  );
}

/* =========================================================
   SECURITY
========================================================= */

function SecuritySection({
  draft,
  setDraft,
}: {
  draft: AdminSettingsState;
  setDraft: React.Dispatch<React.SetStateAction<AdminSettingsState>>;
}) {
  const policyScore =
    (draft.security.requireMfa ? 35 : 12) +
    (draft.security.requireReauthForSensitiveActions ? 35 : 10) +
    (draft.security.maxLoginAttempts <= 5 ? 20 : 10) +
    (draft.security.sessionTimeoutMins <= 60 ? 10 : 4);

  const applyPreset = (preset: "balanced" | "strict" | "maximum") => {
    const config =
      preset === "maximum"
        ? { requireMfa: true, requireReauthForSensitiveActions: true, sessionTimeoutMins: 15, maxLoginAttempts: 3 }
        : preset === "strict"
          ? { requireMfa: true, requireReauthForSensitiveActions: true, sessionTimeoutMins: 30, maxLoginAttempts: 5 }
          : { requireMfa: true, requireReauthForSensitiveActions: true, sessionTimeoutMins: 60, maxLoginAttempts: 5 };

    setDraft((current) => ({
      ...current,
      security: {
        ...current.security,
        ...config,
      },
    }));
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Authentication"
        title="Security Policies"
        description="Define privileged authentication, session security and fresh-authentication requirements for high-impact administration."
        icon={ShieldCheck}
      />

      <div className="grid items-stretch gap-5 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,39,69,.055)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#f7fbff,#ffffff)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F2745] text-cyan-200 shadow-sm">
                <KeyRound className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1F5EA8]">
                  Privileged Authentication
                </p>
                <p className="mt-1 text-sm font-black tracking-[-0.01em] text-[#0F2745]">
                  Staff access protection policy
                </p>
              </div>
            </div>
            <span className={`w-fit rounded-full px-3 py-1.5 text-[9px] font-black ${policyScore >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {policyScore >= 90 ? "Strong policy" : "Review policy"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="rounded-2xl px-1 py-2 transition hover:bg-slate-50/70">
              <ToggleRow
                label="Require MFA for staff"
                description="Require a second authentication factor before privileged accounts can enter protected administration flows."
                enabled={draft.security.requireMfa}
                onChange={(value) => setDraft((current) => ({ ...current, security: { ...current.security, requireMfa: value } }))}
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="rounded-2xl px-1 py-2 transition hover:bg-slate-50/70">
              <ToggleRow
                label="Re-authenticate sensitive admin actions"
                description="Ask for the current administrator password again before platform-wide or destructive configuration changes."
                enabled={draft.security.requireReauthForSensitiveActions}
                onChange={(value) => setDraft((current) => ({ ...current, security: { ...current.security, requireReauthForSensitiveActions: value } }))}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#1F5EA8]" />
                <div>
                  <p className="text-xs font-black text-[#0F2745]">Session lifetime</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">Shorter sessions reduce unattended admin exposure.</p>
                </div>
              </div>
              <SelectField
                label="Session timeout"
                value={draft.security.sessionTimeoutMins}
                options={[
                  { label: "15 minutes", value: 15 },
                  { label: "30 minutes", value: 30 },
                  { label: "1 hour", value: 60 },
                  { label: "4 hours", value: 240 },
                ]}
                onChange={(value) => setDraft((current) => ({ ...current, security: { ...current.security, sessionTimeoutMins: value } }))}
              />
            </div>

            <div className="rounded-2xl border border-slate-100 bg-[#FAFBFD] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#1F5EA8]" />
                <div>
                  <p className="text-xs font-black text-[#0F2745]">Login guard</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">Lower limits reduce repeated privileged-login attempts.</p>
                </div>
              </div>
              <NumberField
                label="Maximum login attempts"
                suffix="attempts"
                value={draft.security.maxLoginAttempts}
                min={3}
                max={10}
                onChange={(value) => setDraft((current) => ({ ...current, security: { ...current.security, maxLoginAttempts: value } }))}
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black text-[#0F2745]">Policy presets</p>
                <p className="mt-1 text-[10px] leading-5 text-slate-400">
                  Apply a preset to stage several related security controls at once.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["balanced", "strict", "maximum"] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-black capitalize text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1F5EA8]"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SecurityVisualizer
          score={policyScore}
          mfa={draft.security.requireMfa}
          reauth={draft.security.requireReauthForSensitiveActions}
          sessionTimeout={draft.security.sessionTimeoutMins}
          maxLoginAttempts={draft.security.maxLoginAttempts}
          onApplyPreset={applyPreset}
        />
      </div>
    </div>
  );
}

function SecurityVisualizer({
  score,
  mfa,
  reauth,
  sessionTimeout,
  maxLoginAttempts,
  onApplyPreset,
}: {
  score: number;
  mfa: boolean;
  reauth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  onApplyPreset: (preset: "balanced" | "strict" | "maximum") => void;
}) {
  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[30px] bg-[linear-gradient(155deg,#081b31_0%,#0f3152_58%,#174b73_100%)] p-5 text-white shadow-[0_22px_60px_rgba(15,39,69,.18)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(103,232,249,.22)_1px,transparent_1px)] [background-size:22px_22px]" />

      <motion.div
        className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full border border-cyan-300/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-cyan-100/55">Auth Shield</p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.02em]">Live security posture</h3>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[9px] font-black ${score >= 90 ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>
          {score >= 90 ? "Protected" : "Needs review"}
        </span>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2">
        <SecurityInsight icon={ShieldCheck} label="Staff MFA" value={mfa ? "Required" : "Optional"} good={mfa} />
        <SecurityInsight icon={KeyRound} label="Sensitive re-auth" value={reauth ? "Required" : "Optional"} good={reauth} />
      </div>

      <div className="relative z-10 mt-5 grid items-center gap-5 md:grid-cols-[1fr_180px_1fr]">
        <div className="space-y-3">
          <SecurityMetric label="Session timeout" value={`${sessionTimeout} min`} detail={sessionTimeout <= 60 ? "Recommended range" : "Long session window"} good={sessionTimeout <= 60} />
          <SecurityMetric label="Login attempts" value={`${maxLoginAttempts}`} detail={maxLoginAttempts <= 5 ? "Strict guard" : "Relaxed guard"} good={maxLoginAttempts <= 5} />
        </div>

        <div className="flex justify-center">
          <div className="relative flex h-44 w-44 items-center justify-center">
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute rounded-full border border-cyan-300/15"
                style={{ width: `${64 + ring * 30}px`, height: `${64 + ring * 30}px` }}
                animate={{ rotate: ring % 2 ? 360 : -360, opacity: [0.2, 0.68, 0.2] }}
                transition={{
                  rotate: { duration: 11 + ring * 4, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 3 + ring, repeat: Infinity },
                }}
              >
                <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
              </motion.div>
            ))}

            <motion.div
              animate={{ boxShadow: ["0 0 0 rgba(16,185,129,0)", "0 0 44px rgba(16,185,129,.24)", "0 0 0 rgba(16,185,129,0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative z-10 flex h-20 w-20 items-center justify-center rounded-[26px] border border-emerald-300/20 bg-emerald-300/10"
            >
              <Fingerprint className="h-9 w-9 text-emerald-300" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-center">
            <motion.p
              key={score}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl font-black tracking-[-0.04em]"
            >
              {score}%
            </motion.p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-blue-100/45">Policy strength</p>
          </div>

          <button
            type="button"
            onClick={() => onApplyPreset("maximum")}
            className="group flex w-full items-center justify-between rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-3 text-left transition hover:bg-cyan-300/[0.12]"
          >
            <div>
              <p className="text-[10px] font-black text-cyan-100">Harden policy</p>
              <p className="mt-1 text-[9px] text-blue-100/45">Stage maximum preset</p>
            </div>
            <ChevronRight className="h-4 w-4 text-cyan-200 transition group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid gap-2 sm:grid-cols-3">
        <SecurityStateRow label="Staff MFA" active={mfa} />
        <SecurityStateRow label="Sensitive re-auth" active={reauth} />
        <SecurityStateRow label="Session controls" active={sessionTimeout <= 60} />
      </div>
    </div>
  );
}

function SecurityInsight({
  icon: Icon,
  label,
  value,
  good,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${good ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-blue-100/45">{label}</p>
        <p className="mt-0.5 truncate text-[11px] font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function SecurityMetric({
  label,
  value,
  detail,
  good,
}: {
  label: string;
  value: string;
  detail: string;
  good: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-semibold text-blue-100/45">{label}</p>
        <span className={`h-2 w-2 rounded-full ${good ? "bg-emerald-300" : "bg-amber-300"}`} />
      </div>
      <p className="mt-2 text-base font-black">{value}</p>
      <p className="mt-0.5 text-[9px] text-blue-100/40">{detail}</p>
    </div>
  );
}

function SecurityStateRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
      <span className="truncate text-[9px] font-semibold text-blue-100/60">{label}</span>
      <span className={`ml-2 flex items-center gap-1 text-[9px] font-black ${active ? "text-emerald-300" : "text-amber-300"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-300" : "bg-amber-300"}`} />
        {active ? "Active" : "Review"}
      </span>
    </div>
  );
}

/* =========================================================
   AUDIT

/* =========================================================
   AUDIT
========================================================= */


function AuditSection({
  items,
  onOpenAudit,
}: {
  items: AuditItem[];
  onOpenAudit: (
    item: AuditItem
  ) => void;
}) {
  const [
    filter,
    setFilter,
  ] =
    useState<
      | "all"
      | "warning"
      | "critical"
    >(
      "all"
    );

  const filtered =
    items.filter(
      (
        item
      ) =>
        filter ===
          "all" ||
        item.severity ===
          filter
    );

  const warningCount =
    items.filter(
      (
        item
      ) =>
        item.severity ===
        "warning"
    ).length;

  const criticalCount =
    items.filter(
      (
        item
      ) =>
        item.severity ===
        "critical"
    ).length;

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="History"
        title="Audit Activity"
        description="Review server-recorded platform settings changes. This list no longer uses hard-coded demo events."
        icon={
          History
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AuditMetric
          label="Recorded Events"
          value={
            items.length
          }
          tone="blue"
        />

        <AuditMetric
          label="Warnings"
          value={
            warningCount
          }
          tone="amber"
        />

        <AuditMetric
          label="Critical"
          value={
            criticalCount
          }
          tone="rose"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(
            [
              "all",
              "warning",
              "critical",
            ] as const
          ).map(
            (
              value
            ) => (
              <button
                key={
                  value
                }
                type="button"
                onClick={() =>
                  setFilter(
                    value
                  )
                }
                className={`rounded-xl border px-3.5 py-2 text-[11px] font-black capitalize transition ${
                  filter ===
                  value
                    ? "border-[#1F5EA8] bg-[#1F5EA8] text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                }`}
              >
                {value}
              </button>
            )
          )}
        </div>

        <span className="text-[10px] font-bold text-slate-400">
          {filtered.length} shown
        </span>
      </div>

      <div className="space-y-3">
        {filtered.length ===
        0 ? (
          <div className="relative overflow-hidden rounded-[26px] border border-dashed border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100"
              animate={{
                scale: [
                  0.9,
                  1.08,
                  0.9,
                ],
                opacity: [
                  0.3,
                  0.7,
                  0.3,
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            />

            <div className="relative z-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1F5EA8]">
                <History className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-black text-slate-700">
                No matching audit events
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                Backend configuration changes will appear here after an administrator saves a platform policy update.
              </p>
            </div>
          </div>
        ) : (
          filtered.map(
            (
              item,
              index
            ) => (
              <motion.button
                key={
                  item.id
                }
                type="button"
                onClick={() =>
                  onOpenAudit(
                    item
                  )
                }
                initial={{
                  opacity:
                    0,
                  y:
                    10,
                }}
                animate={{
                  opacity:
                    1,
                  y:
                    0,
                }}
                transition={{
                  delay:
                    index *
                    0.05,
                }}
                className="group flex w-full flex-col gap-4 rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      item.severity ===
                      "critical"
                        ? "bg-rose-50 text-rose-600"
                        : item.severity ===
                            "warning"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-blue-50 text-[#1F5EA8]"
                    }`}
                  >
                    <History className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      {
                        item.action
                      }
                    </p>

                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                      {
                        item.detail
                      }
                    </p>

                    <p className="mt-2 text-[10px] font-semibold text-slate-400">
                      By{" "}
                      {
                        item.actor
                      }
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-[10px] font-bold text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {
                    item.time
                  }
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5EA8]" />
                </div>
              </motion.button>
            )
          )
        )}
      </div>
    </div>
  );
}

function AuditMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "blue"
    | "amber"
    | "rose";
}) {
  const toneClass =
    tone ===
    "amber"
      ? "bg-amber-50 text-amber-600"
      : tone ===
          "rose"
        ? "bg-rose-50 text-rose-600"
        : "bg-blue-50 text-[#1F5EA8]";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <span className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-black ${toneClass}`}>
          {value}
        </span>
      </div>
    </div>
  );
}


function SystemSection({
  draft,
  setDraft,
}: {
  draft: AdminSettingsState;
  setDraft: React.Dispatch<React.SetStateAction<AdminSettingsState>>;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Operations"
        title="System Preferences"
        description="Control platform availability, registration behavior and default operating preferences with clear staged-state feedback."
        icon={Server}
      />

      <div className="grid items-stretch gap-5 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,39,69,.055)] sm:p-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#f7fbff,#ffffff)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F2745] text-cyan-200 shadow-sm">
                <Server className="h-5 w-5" />
                <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${draft.platform.maintenanceMode ? "bg-amber-400" : "bg-emerald-400"}`} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1F5EA8]">Platform State</p>
                <p className="mt-1 text-sm font-black tracking-[-0.01em] text-[#0F2745]">
                  {draft.platform.maintenanceMode ? "Maintenance policy staged" : "Platform operating normally"}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">
                  This card reflects the current settings draft before final authenticated save.
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black ${
                draft.platform.maintenanceMode
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {draft.platform.maintenanceMode ? "Maintenance" : "Operational"}
            </span>
          </div>

          <div className="mt-5 space-y-1">
            <div className="rounded-2xl px-1 py-2 transition hover:bg-slate-50/70">
              <ToggleRow
                label="Maintenance Mode"
                description="Temporarily stage restricted platform operations while administrative maintenance is performed."
                enabled={draft.platform.maintenanceMode}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    platform: { ...current.platform, maintenanceMode: value },
                  }))
                }
              />
            </div>

            <div className="border-t border-slate-100" />

            <div className="rounded-2xl px-1 py-2 transition hover:bg-slate-50/70">
              <ToggleRow
                label="Allow New Signups"
                description="Control whether new public accounts may register while preserving access for existing authenticated users."
                enabled={draft.platform.allowSignups}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    platform: { ...current.platform, allowSignups: value },
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black text-[#0F2745]">Default Currency</p>
                <p className="mt-1 text-[10px] leading-5 text-slate-400">
                  Choose the preferred display and platform-default currency for supported admin experiences.
                </p>
              </div>
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black text-[#1F5EA8]">
                Current: {draft.platform.defaultCurrency}
              </span>
            </div>

            <CurrencySelect
              label=""
              value={draft.platform.defaultCurrency}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  platform: { ...current.platform, defaultCurrency: value },
                }))
              }
            />
          </div>
        </div>

        <SystemPulseCard
          maintenanceMode={draft.platform.maintenanceMode}
          allowSignups={draft.platform.allowSignups}
        />
      </div>
    </div>
  );
}

function SystemPulseCard({
  maintenanceMode,
  allowSignups,
}: {
  maintenanceMode: boolean;
  allowSignups: boolean;
}) {
  const nodes = [
    { x: "50%", y: "18%", label: "API" },
    { x: "20%", y: "58%", label: "DB" },
    { x: "80%", y: "58%", label: "AUTH" },
    { x: "50%", y: "82%", label: "QUEUE" },
  ];

  return (
    <div className="relative h-full min-h-[430px] overflow-hidden rounded-[30px] bg-[linear-gradient(155deg,#081b31_0%,#10385d_62%,#165782_100%)] p-5 text-white shadow-[0_22px_60px_rgba(15,39,69,.18)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(103,232,249,.24)_1px,transparent_1px)] [background-size:24px_24px]" />

      <motion.div
        className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full border border-cyan-300/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/55">System Pulse</p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.02em]">Live configuration map</h3>
          <p className="mt-1 max-w-xs text-[10px] leading-5 text-blue-100/50">
            Visual status of core service layers and staged platform availability controls.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[9px] font-black ${maintenanceMode ? "bg-amber-300/10 text-amber-200" : "bg-emerald-300/10 text-emerald-200"}`}>
          {maintenanceMode ? "Restricted" : "Live"}
        </span>
      </div>

      <div className="absolute inset-x-7 bottom-20 top-28">
        <svg viewBox="0 0 300 240" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
          {[
            [150, 42, 60, 135],
            [150, 42, 240, 135],
            [60, 135, 150, 205],
            [240, 135, 150, 205],
          ].map((line, index) => (
            <motion.line
              key={index}
              x1={line[0]}
              y1={line[1]}
              x2={line[2]}
              y2={line[3]}
              stroke="rgba(103,232,249,.22)"
              strokeWidth="1.5"
              strokeDasharray="5 8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, strokeDashoffset: [0, -30] }}
              transition={{
                pathLength: { duration: 1.2 },
                strokeDashoffset: { duration: 4, repeat: Infinity, ease: "linear" },
              }}
            />
          ))}
        </svg>

        {nodes.map((node, index) => (
          <motion.div
            key={node.label}
            className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-cyan-300/15 bg-white/[0.06] text-[9px] font-black text-cyan-100 sm:h-14 sm:w-14 sm:rounded-2xl"
            style={{ left: node.x, top: node.y }}
            animate={{
              y: [0, index % 2 ? -5 : 5, 0],
              boxShadow: ["0 0 0 rgba(103,232,249,0)", "0 0 24px rgba(103,232,249,.14)", "0 0 0 rgba(103,232,249,0)"],
            }}
            transition={{ duration: 3 + index * 0.35, repeat: Infinity }}
          >
            {node.label}
          </motion.div>
        ))}

        <motion.div
          className={`absolute left-1/2 top-[50%] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border ${maintenanceMode ? "border-amber-300/20 bg-amber-300/10" : "border-emerald-300/20 bg-emerald-300/10"}`}
          animate={{
            scale: [0.95, 1.05, 0.95],
            boxShadow: maintenanceMode
              ? ["0 0 0 rgba(245,158,11,0)", "0 0 34px rgba(245,158,11,.20)", "0 0 0 rgba(245,158,11,0)"]
              : ["0 0 0 rgba(16,185,129,0)", "0 0 34px rgba(16,185,129,.20)", "0 0 0 rgba(16,185,129,0)"],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Server className={`h-8 w-8 ${maintenanceMode ? "text-amber-300" : "text-emerald-300"}`} />
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 grid grid-cols-2 gap-2">
        <SystemStatusPill label="Availability" value={maintenanceMode ? "Maintenance" : "Operational"} good={!maintenanceMode} />
        <SystemStatusPill label="Registration" value={allowSignups ? "Open" : "Locked"} good={allowSignups} />
      </div>
    </div>
  );
}

function SystemStatusPill({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-blue-100/40">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${good ? "bg-emerald-300" : "bg-amber-300"}`} />
        <p className="truncate text-[10px] font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function DangerSection({
  maintenanceMode,
  allowSignups,
  onAction,
}: {
  maintenanceMode: boolean;
  allowSignups: boolean;
  onAction: (action: DangerAction) => void;
}) {
  const stagedCount = Number(maintenanceMode) + Number(!allowSignups);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Sensitive Operations"
        title="Danger Controls"
        description="High-impact platform actions are staged first, explicitly confirmed, re-authenticated and captured by the backend audit trail."
        icon={TriangleAlert}
        danger
      />

      <div className="relative overflow-hidden rounded-[32px] border border-rose-100 bg-white p-4 shadow-[0_18px_55px_rgba(15,39,69,0.07)] sm:p-5">
        <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(120deg,#07182b_0%,#102d4c_52%,#4a1732_125%)] p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:28px_28px]" />

          <motion.div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-rose-300/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(251,113,133,.9),transparent)]"
            animate={{ y: [0, 190, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
            <div className="flex items-start gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <motion.span
                  className="absolute inset-0 rounded-full border border-rose-300/30"
                  animate={{ scale: [0.82, 1.2, 0.82], opacity: [0.2, 0.75, 0.2] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                />
                <motion.span
                  className="absolute inset-[8px] rounded-full border border-cyan-300/20 border-l-transparent"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-400/12 text-rose-200 shadow-[0_0_28px_rgba(251,113,133,.10)]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-200/75">Protected Command Gate</p>
                  <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[8px] font-black text-blue-100/60">Admin only</span>
                </div>
                <h3 className="mt-2 text-xl font-black tracking-[-0.025em] sm:text-2xl">High-impact administration</h3>
                <p className="mt-2 max-w-2xl text-xs leading-6 text-blue-100/65">
                  Nothing here is applied silently. Each action stages a configuration change, opens a confirmation gate, and still requires authenticated saving.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <DangerSignal text={`${stagedCount} staged`} tone={stagedCount > 0 ? "amber" : "green"} />
                  <DangerSignal text="Re-auth required" tone="blue" />
                  <DangerSignal text="Audit recorded" tone="blue" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <DangerStep number="01" label="Confirm" detail="Explicit intent" />
              <DangerStep number="02" label="Re-auth" detail="Fresh password" />
              <DangerStep number="03" label="Audit" detail="Traceable event" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <DangerActionCard
            icon={Server}
            title="Enter Maintenance"
            description="Stage restricted platform operation while maintenance work is performed."
            status={maintenanceMode ? "Already staged" : "Stage maintenance"}
            disabled={maintenanceMode}
            tone="amber"
            onClick={() => onAction("maintenance")}
          />

          <DangerActionCard
            icon={Lock}
            title="Lock New Signups"
            description="Temporarily stop new public registrations without disabling existing accounts."
            status={allowSignups ? "Stage signup lock" : "Already locked"}
            disabled={!allowSignups}
            tone="blue"
            onClick={() => onAction("lock-signups")}
          />

          <DangerActionCard
            icon={RotateCcw}
            title="Reset Platform Settings"
            description="Stage backend defaults. Saving remains protected by administrator re-authentication."
            status="Destructive reset"
            tone="rose"
            onClick={() => onAction("reset")}
          />
        </div>

        <div className="mt-4 grid gap-3 rounded-[22px] border border-rose-100 bg-[linear-gradient(135deg,#fffafb,#ffffff)] p-4 md:grid-cols-3">
          <SafetyItem icon={CheckCircle2} title="Stage first" description="Actions change only the local draft until saved." />
          <SafetyItem icon={KeyRound} title="Verify administrator" description="Sensitive save flow requires current admin credentials." />
          <SafetyItem icon={History} title="Leave an audit trail" description="Successful backend changes are recorded for review." />
        </div>
      </div>
    </div>
  );
}

function DangerSignal({
  text,
  tone,
}: {
  text: string;
  tone: "green" | "amber" | "blue";
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-300/10 text-emerald-200"
      : tone === "amber"
        ? "bg-amber-300/10 text-amber-200"
        : "bg-cyan-300/10 text-cyan-100";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-black ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone === "green" ? "bg-emerald-300" : tone === "amber" ? "bg-amber-300" : "bg-cyan-300"}`} />
      {text}
    </span>
  );
}

function DangerStep({
  number,
  label,
  detail,
}: {
  number: string;
  label: string;
  detail: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-3.5 text-center backdrop-blur-sm"
    >
      <p className="text-[9px] font-black text-cyan-200">{number}</p>
      <p className="mt-1 text-[10px] font-black text-white">{label}</p>
      <p className="mt-1 text-[8px] leading-4 text-blue-100/40">{detail}</p>
    </motion.div>
  );
}

function SafetyItem({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-rose-50">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-black text-[#0F2745]">{title}</p>
        <p className="mt-1 text-[9px] leading-4 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function DangerActionCard({
  icon: Icon,
  title,
  description,
  status,
  disabled = false,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
  disabled?: boolean;
  tone: "amber" | "blue" | "rose";
  onClick: () => void;
}) {
  const toneClass =
    tone === "rose"
      ? {
          accent: "bg-rose-500",
          border: "border-rose-100 hover:border-rose-200",
          icon: "bg-rose-50 text-rose-600",
          status: "text-rose-600",
          glow: "bg-rose-100",
        }
      : tone === "amber"
        ? {
            accent: "bg-amber-500",
            border: "border-amber-100 hover:border-amber-200",
            icon: "bg-amber-50 text-amber-600",
            status: "text-amber-600",
            glow: "bg-amber-100",
          }
        : {
            accent: "bg-[#1F5EA8]",
            border: "border-blue-100 hover:border-blue-200",
            icon: "bg-blue-50 text-[#1F5EA8]",
            status: "text-[#1F5EA8]",
            glow: "bg-blue-100",
          };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -5 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={`group relative min-h-[210px] overflow-hidden rounded-[24px] border bg-white p-5 text-left shadow-[0_10px_28px_rgba(15,39,69,.045)] transition ${toneClass.border} disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <span className={`absolute inset-y-5 left-0 w-1 rounded-r-full ${toneClass.accent}`} />
      <motion.div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${toneClass.glow}`}
        animate={{ scale: [0.82, 1.22, 0.82], opacity: [0.12, 0.32, 0.12] }}
        transition={{ duration: 3.6, repeat: Infinity }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass.icon}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <span className={`rounded-full bg-slate-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${toneClass.status}`}>
            {disabled ? "Staged" : tone === "rose" ? "Critical" : "Protected"}
          </span>
        </div>

        <p className="mt-5 text-[15px] font-black tracking-[-0.015em] text-[#0F2745]">{title}</p>
        <p className="mt-2 flex-1 text-[10px] leading-5 text-slate-500">{description}</p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className={`text-[9px] font-black uppercase tracking-[0.09em] ${toneClass.status}`}>{status}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-300 transition group-hover:bg-[#0F2745] group-hover:text-white">
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function SettingsDrawer({
  type,
  payload,
  auditItems,
  onClose,
  onOpenAudit,
}: {
  type:
    Exclude<
      DrawerType,
      null
    >;
  payload:
    | AuditItem
    | {
        role:
          string;
      }
    | null;
  auditItems:
    AuditItem[];
  onClose:
    () => void;
  onOpenAudit:
    (
      item:
        AuditItem
    ) => void;
}) {
  const auditPayload = payload && "action" in payload ? payload : null;
  const rolePayload = payload && "role" in payload ? payload : null;

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close drawer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 240, damping: 28 }}
        className="fixed bottom-0 right-0 top-0 z-[90] w-full max-w-[520px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Admin Drawer</p>
            <h2 className="mt-1 text-lg font-black">
              {type === "changes" ? "Recent Configuration Changes" : type === "audit" ? "Audit Event Detail" : "Role Detail"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {type === "changes" && (
            <div className="space-y-3">
              {auditItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenAudit(item)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-blue-100 hover:bg-slate-50"
                >
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.severity === "critical" ? "bg-rose-500" : item.severity === "warning" ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                  <div>
                    <p className="font-black">{item.action}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                    <p className="mt-2 text-[10px] text-slate-400">{item.time} · {item.actor}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {type === "audit" && auditPayload && (
            <div className="space-y-5">
              <div className={`rounded-[24px] p-5 ${
                auditPayload.severity === "critical" ? "bg-rose-50" :
                auditPayload.severity === "warning" ? "bg-amber-50" : "bg-blue-50"
              }`}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{auditPayload.severity} event</p>
                <h3 className="mt-2 text-lg font-black">{auditPayload.action}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{auditPayload.detail}</p>
              </div>
              <DetailList rows={[
                ["Actor", auditPayload.actor],
                ["Time", auditPayload.time],
                ["Source", auditPayload.ip],
                ["Event ID", auditPayload.id],
              ]} />
            </div>
          )}

          {type === "role" && rolePayload && <RoleDetail role={rolePayload.role} />}
        </div>
      </motion.aside>
    </>
  );
}

function RoleDetail({
  role,
}: {
  role:
    string;
}) {
  const key =
    role ===
    "Administrator"
      ? "admin"
      : "user";

  const allowed =
    ROLE_MATRIX.filter(
      (
        row
      ) =>
        Boolean(
          row[
            key as
              | "admin"
              | "user"
          ]
        )
    );

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] bg-[linear-gradient(135deg,#0F2745,#17466F)] p-5 text-white">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
          <Users className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-xl font-black">
          {role}
        </h3>

        <p className="mt-1 text-xs text-blue-100/60">
          Capability preview for a role currently supported by the backend User model.
        </p>
      </div>

      <div className="space-y-2">
        {allowed.map(
          (
            item
          ) => (
            <div
              key={
                item.capability
              }
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />

              <span className="text-xs font-bold text-slate-700">
                {
                  item.capability
                }
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DetailList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      {rows.map((row, index) => (
        <div key={row[0]} className={`flex items-center justify-between gap-4 px-4 py-3 ${index < rows.length - 1 ? "border-b border-slate-100" : ""}`}>
          <span className="text-xs text-slate-400">{row[0]}</span>
          <span className="text-right text-xs font-black">{row[1]}</span>
        </div>
      ))}
    </div>
  );
}

function ConfirmationModal({
  action, onCancel, onConfirm,
}: {
  action: DangerAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) return null;

  const content =
    action === "maintenance"
      ? { title: "Stage maintenance mode?", description: "This stages maintenance mode in the draft. Saving the change requires current admin password and a protected backend write.", confirm: "Stage Maintenance" }
      : action === "lock-signups"
        ? { title: "Lock new signups?", description: "This stages public registration as disabled. Saving the change requires current admin password and a protected backend write.", confirm: "Lock Signups" }
        : { title: "Reset platform settings?", description: "This stages the backend default values. The change is not applied until you save and re-authenticate.", confirm: "Stage Reset" };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      >
        <button type="button" aria-label="Close confirmation" onClick={onCancel} className="absolute inset-0" />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-rose-100 bg-white shadow-2xl"
        >
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#fff1f2,#fff)] p-6">
            <motion.div
              className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-rose-200"
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative z-10 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-rose-950">{content.title}</h2>
                <p className="mt-2 text-xs leading-6 text-rose-700">{content.description}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Cancel</button>
            <button type="button" onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white hover:bg-rose-700">{content.confirm}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


function AdminReauthModal({
  open,
  password,
  error,
  saving,
  onPasswordChange,
  onCancel,
  onConfirm,
}: {
  open:
    boolean;
  password:
    string;
  error:
    string | null;
  saving:
    boolean;
  onPasswordChange:
    (
      value:
        string
    ) => void;
  onCancel:
    () => void;
  onConfirm:
    () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity:
              0,
          }}
          animate={{
            opacity:
              1,
          }}
          exit={{
            opacity:
              0,
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Close re-authentication"
            onClick={
              onCancel
            }
            className="absolute inset-0"
          />

          <motion.div
            initial={{
              opacity:
                0,
              y:
                18,
              scale:
                0.96,
            }}
            animate={{
              opacity:
                1,
              y:
                0,
              scale:
                1,
            }}
            exit={{
              opacity:
                0,
              y:
                12,
              scale:
                0.96,
            }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-2xl"
          >
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,#07182b,#12385e)] p-6 text-white">
              <motion.div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-cyan-300/20"
                animate={{
                  rotate:
                    360,
                }}
                transition={{
                  duration:
                    14,
                  repeat:
                    Infinity,
                  ease:
                    "linear",
                }}
              />

              <div className="relative z-10 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <KeyRound className="h-5 w-5 text-cyan-200" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/50">
                    Re-authentication
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Confirm platform configuration
                  </h2>

                  <p className="mt-2 text-xs leading-6 text-blue-100/65">
                    Enter your current admin password. It is sent only for verification and is never stored in the platform settings document or audit log.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black text-slate-700">
                  Current Admin Password
                </span>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="password"
                    autoComplete="current-password"
                    value={
                      password
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      onPasswordChange(
                        event.target
                          .value
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        onConfirm();
                      }
                    }}
                    placeholder="Enter current password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </label>

              {error && (
                <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    onCancel
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    !password
                  }
                  onClick={
                    onConfirm
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : "Verify & Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================
   SAVE + TOAST
========================================================= */

function SaveBar({ saving, onSave, onDiscard }: { saving: boolean; onSave: () => void; onDiscard: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-4 rounded-[22px] border border-white/10 bg-[#0F2745]/95 p-4 text-white shadow-[0_24px_70px_rgba(15,39,69,.35)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300"
          animate={{ rotate: [0, -4, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2 }}
        >
          <AlertTriangle className="h-4 w-4" />
        </motion.div>
        <div>
          <p className="text-xs font-black">Unsaved configuration changes</p>
          <p className="mt-0.5 text-[10px] text-blue-100/50">Review and save your current platform settings.</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDiscard} disabled={saving} className="rounded-xl px-4 py-2.5 text-xs font-black text-blue-100/70">Discard</button>
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">
          {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const tone = toast.type === "success" ? "text-emerald-600 bg-emerald-50" : toast.type === "error" ? "text-rose-600 bg-rose-50" : "text-[#1F5EA8] bg-blue-50";
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="fixed right-5 top-5 z-[140] flex w-[calc(100%-2.5rem)] max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        {toast.type === "error" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black">{toast.type === "success" ? "Saved" : toast.type === "error" ? "Error" : "Updated"}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{toast.message}</p>
      </div>
      <button type="button" onClick={onClose} className="text-slate-300 hover:text-slate-600"><X className="h-4 w-4" /></button>
    </motion.div>
  );
}

/* =========================================================
   SHARED
========================================================= */

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  danger = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  danger?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-[0_10px_34px_rgba(15,39,69,0.045)] sm:p-6 ${danger ? "border-rose-100" : "border-slate-200"}`}>
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-1 ${danger ? "bg-rose-500" : "bg-[linear-gradient(#1F5EA8,#45c7ec)]"}`} />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-blue-50/70" />

      <div className="relative z-10 flex items-start gap-4">
        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-[#1F5EA8]"}`}>
          <Icon className="h-5 w-5" />
          {!danger && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-cyan-400" />}
        </div>

        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${danger ? "text-rose-500" : "text-[#1F5EA8]"}`}>
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#0F2745] sm:text-[29px]">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ icon: Icon, text, tone }: { icon: LucideIcon; text: string; tone: "green" | "blue" }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black ${
      tone === "green" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : "border-white/10 bg-white/10 text-blue-100"
    }`}>
      <Icon className="h-3.5 w-3.5" /> {text}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  note,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  note: string;
  tone: "green" | "blue" | "amber";
}) {
  const iconClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600 ring-amber-100"
        : "bg-blue-50 text-[#1F5EA8] ring-blue-100";

  const valueClass =
    tone === "green"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-[#0F2745]";

  const accentClass =
    tone === "green"
      ? "from-emerald-400 to-emerald-500"
      : tone === "amber"
        ? "from-amber-400 to-orange-400"
        : "from-[#1F5EA8] to-cyan-400";

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,39,69,0.045)] sm:p-5"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClass}`} />
      <div className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full bg-slate-50 transition group-hover:scale-110" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${iconClass}`}>
          <Icon className="h-[19px] w-[19px]" />
        </div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tone === "green" ? "bg-emerald-400" : tone === "amber" ? "bg-amber-400" : "bg-blue-400"}`} />
      </div>

      <div className="relative z-10 mt-5">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{title}</p>
        <p className={`mt-2 break-words text-[26px] font-black leading-none tracking-[-0.03em] ${valueClass}`}>{value}</p>
        <p className="mt-2 min-h-5 text-[10px] font-medium leading-5 text-slate-400">{note}</p>
      </div>
    </motion.div>
  );
}

function OperationalCard({
  icon: Icon,
  title,
  value,
  detail,
  pulse,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  detail: string;
  pulse: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-[#FBFCFE] p-4 transition hover:border-blue-100 hover:bg-white hover:shadow-md"
    >
      {pulse && (
        <motion.div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100"
          animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.1, 0.42, 0.1] }}
          transition={{ duration: 3.4, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 flex items-start gap-3.5">
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${pulse ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
          <Icon className="h-[18px] w-[18px]" />
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${pulse ? "bg-emerald-400" : "bg-amber-400"}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-black text-[#0F2745]">{title}</p>
            <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wide ${pulse ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {value}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-slate-400">{detail}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="group flex items-center justify-between gap-5 py-1">
      <div className="min-w-0 pr-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-black tracking-[-0.01em] text-[#0F2745]">{label}</p>
          <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition-all duration-200 ${
          enabled
            ? "bg-[#1F5EA8] shadow-[0_6px_18px_rgba(31,94,168,.22)]"
            : "bg-slate-300"
        }`}
      >
        <motion.span
          className="block h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(15,39,69,.18)]"
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 480, damping: 30 }}
        />
      </button>
    </div>
  );
}

function RangeField({
  label, description, value, min, max, step, onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black">{label}</p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">{description}</p>
        </div>
        <motion.span key={value} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-fit rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#1F5EA8]">
          ৳{value.toLocaleString("en-BD")}
        </motion.span>
      </div>
      <div className="relative mt-5">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#1F5EA8,#22d3ee)]"
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 130, damping: 20 }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent accent-[#1F5EA8]"
        />
      </div>
    </div>
  );
}


function NumberField({
  label,
  suffix,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black leading-4 text-slate-700">
        {label}
      </span>

      <div className="relative">
        <input
          type="number"
          min={
            min
          }
          max={
            max
          }
          value={
            value
          }
          onChange={(
            event
          ) => {
            const raw =
              Number(
                event
                  .target
                  .value
              );

            if (
              !Number.isFinite(
                raw
              )
            ) {
              return;
            }

            onChange(
              Math.min(
                Math.max(
                  raw,
                  min
                ),
                max
              )
            );
          }}
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-20 text-sm font-bold text-[#0F2745] outline-none transition [appearance:textfield] focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-blue-500/10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2 py-1 text-[9px] font-bold text-slate-400 shadow-sm ring-1 ring-slate-100">
          {suffix}
        </span>
      </div>
    </label>
  );
}


function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: Array<{
    label: string;
    value: number;
  }>;
  onChange: (
    value: number
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const selected =
    options.find(
      (
        option
      ) =>
        option.value ===
        value
    ) ??
    options[0];

  return (
    <div
      className="relative min-w-0"
      onBlur={() =>
        window.setTimeout(
          () =>
            setOpen(
              false
            ),
          120
        )
      }
    >
      <span className="mb-2 block text-xs font-black text-slate-700">
        {label}
      </span>

      <button
        type="button"
        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-4 text-left text-sm font-semibold transition ${
          open
            ? "border-[#1F5EA8] bg-white ring-4 ring-blue-500/10"
            : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
        }`}
        aria-expanded={
          open
        }
      >
        <span className="truncate">
          {selected?.label}
        </span>

        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0,
          }}
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -4,
              scale: 0.98,
            }}
            transition={{
              duration: 0.16,
            }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,39,69,0.14)]"
          >
            {options.map(
              (
                option
              ) => {
                const active =
                  option.value ===
                  value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onMouseDown={(
                      event
                    ) =>
                      event.preventDefault()
                    }
                    onClick={() => {
                      onChange(
                        option.value
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                      active
                        ? "bg-blue-50 text-[#1F5EA8]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>
                      {
                        option.label
                      }
                    </span>

                    {active && (
                      <CheckCircle2 className="h-4 w-4 text-[#1F5EA8]" />
                    )}
                  </button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CurrencySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "BDT" | "USD" | "EUR";
  onChange: (value: "BDT" | "USD" | "EUR") => void;
}) {
  const options: Array<{
    value: "BDT" | "USD" | "EUR";
    label: string;
    symbol: string;
    detail: string;
  }> = [
    { value: "BDT", label: "Bangladeshi Taka", symbol: "৳", detail: "Primary local currency" },
    { value: "USD", label: "US Dollar", symbol: "$", detail: "International display" },
    { value: "EUR", label: "Euro", symbol: "€", detail: "European display" },
  ];

  return (
    <div className="min-w-0">
      {label && <span className="mb-2 block text-xs font-black text-slate-700">{label}</span>}

      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              whileTap={{ scale: 0.98 }}
              className={`group relative overflow-hidden rounded-2xl border p-3.5 text-left transition ${
                active
                  ? "border-blue-200 bg-[linear-gradient(135deg,#edf6ff,#ffffff)] shadow-[0_8px_22px_rgba(31,94,168,.09)] ring-1 ring-blue-100"
                  : "border-slate-200 bg-[#FAFBFD] hover:border-blue-100 hover:bg-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="currency-active"
                  className="absolute inset-x-4 bottom-0 h-[3px] rounded-t-full bg-[#1F5EA8]"
                />
              )}

              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${active ? "bg-[#1F5EA8] text-white" : "bg-white text-slate-500 shadow-sm ring-1 ring-slate-100"}`}>
                  {option.symbol}
                </span>
                {active && <CheckCircle2 className="h-4 w-4 text-[#1F5EA8]" />}
              </div>

              <p className={`mt-3 text-xs font-black ${active ? "text-[#0F2745]" : "text-slate-700"}`}>{option.value}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">{option.label}</p>
              <p className="mt-1 text-[9px] leading-4 text-slate-400">{option.detail}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
