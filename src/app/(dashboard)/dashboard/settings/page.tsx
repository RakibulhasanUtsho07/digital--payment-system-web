"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  Fingerprint,
  Gauge,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  MonitorSmartphone,
  Moon,
  Palette,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Sun,
  Trash2,
  User,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type SectionId =
  | "overview"
  | "profile"
  | "security"
  | "notifications"
  | "privacy"
  | "appearance"
  | "wallet"
  | "data"
  | "danger";

type ThemeMode =
  | "light"
  | "dark"
  | "system";

type Density =
  | "comfortable"
  | "compact";

type DrawerType =
  | "sessions"
  | "privacy"
  | "export"
  | null;

type DangerAction =
  | "logout-all"
  | "delete-account"
  | null;

type ToastState = {
  type:
    | "success"
    | "info"
    | "error";
  message: string;
};

type UserSettingsState = {
  profile: {
    name: string;
    email: string;
    phone: string;
  };

  appearance: {
    theme: ThemeMode;
    density: Density;
    reduceMotion: boolean;
  };

  wallet: {
    defaultCurrency:
      | "BDT"
      | "USD"
      | "EUR";
    hideAmounts: boolean;
    confirmThreshold: number;
    requireConfirmation: boolean;
  };

  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };

  privacy: {
    analytics: boolean;
    discoverability: boolean;
    personalization: boolean;
    showTransactionNames: boolean;
  };
};

type SectionConfig = {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
};

type SessionItem = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  icon: LucideIcon;
};

/* =========================================================
   CONSTANTS
========================================================= */

const STORAGE_KEY =
  "coffer_user_settings_ui";

const DEFAULT_SETTINGS:
  UserSettingsState = {
  profile: {
    name:
      "Coffer User",
    email:
      "user@example.com",
    phone:
      "+880 1XXXXXXXXX",
  },

  appearance: {
    theme:
      "light",
    density:
      "comfortable",
    reduceMotion:
      false,
  },

  wallet: {
    defaultCurrency:
      "BDT",
    hideAmounts:
      false,
    confirmThreshold:
      10000,
    requireConfirmation:
      true,
  },

  notifications: {
    email:
      true,
    push:
      true,
    sms:
      true,
    marketing:
      false,
  },

  privacy: {
    analytics:
      false,
    discoverability:
      true,
    personalization:
      true,
    showTransactionNames:
      true,
  },
};

const SECTIONS:
  SectionConfig[] = [
    {
      id:
        "overview",
      label:
        "Overview",
      description:
        "Account health and quick controls",
      icon:
        Activity,
      keywords: [
        "overview",
        "health",
        "account",
        "summary",
      ],
    },
    {
      id:
        "profile",
      label:
        "Profile & Identity",
      description:
        "Personal information",
      icon:
        UserRound,
      keywords: [
        "profile",
        "name",
        "email",
        "phone",
        "identity",
      ],
    },
    {
      id:
        "security",
      label:
        "Security",
      description:
        "Sessions and account protection",
      icon:
        ShieldCheck,
      keywords: [
        "security",
        "password",
        "session",
        "2fa",
        "mfa",
      ],
    },
    {
      id:
        "notifications",
      label:
        "Notifications",
      description:
        "Delivery and alert preferences",
      icon:
        BellRing,
      keywords: [
        "notification",
        "email",
        "push",
        "sms",
        "marketing",
      ],
    },
    {
      id:
        "privacy",
      label:
        "Privacy",
      description:
        "Visibility and personalization",
      icon:
        Lock,
      keywords: [
        "privacy",
        "analytics",
        "visibility",
        "personalization",
      ],
    },
    {
      id:
        "appearance",
      label:
        "Appearance",
      description:
        "Theme, density and motion",
      icon:
        Palette,
      keywords: [
        "theme",
        "dark",
        "light",
        "density",
        "appearance",
      ],
    },
    {
      id:
        "wallet",
      label:
        "Wallet Preferences",
      description:
        "Balance and confirmation rules",
      icon:
        WalletCards,
      keywords: [
        "wallet",
        "currency",
        "balance",
        "confirmation",
        "transfer",
      ],
    },
    {
      id:
        "data",
      label:
        "Data & Export",
      description:
        "Download your account data",
      icon:
        Database,
      keywords: [
        "data",
        "export",
        "download",
        "json",
        "csv",
      ],
    },
    {
      id:
        "danger",
      label:
        "Danger Zone",
      description:
        "Sensitive account actions",
      icon:
        AlertTriangle,
      keywords: [
        "danger",
        "logout",
        "delete",
        "account",
      ],
    },
  ];

const SESSIONS:
  SessionItem[] = [
    {
      id:
        "session-1",
      device:
        "Windows · Chrome",
      location:
        "Bangladesh",
      lastActive:
        "Active now",
      current:
        true,
      icon:
        Laptop,
    },
    {
      id:
        "session-2",
      device:
        "Android · Chrome",
      location:
        "Bangladesh",
      lastActive:
        "Yesterday",
      current:
        false,
      icon:
        Smartphone,
    },
    {
      id:
        "session-3",
      device:
        "Desktop Browser",
      location:
        "Bangladesh",
      lastActive:
        "4 days ago",
      current:
        false,
      icon:
        MonitorSmartphone,
    },
  ];

/* =========================================================
   PAGE
========================================================= */

export default function UserSettingsPage() {
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
    useState<UserSettingsState>(
      DEFAULT_SETTINGS
    );

  const [
    draft,
    setDraft,
  ] =
    useState<UserSettingsState>(
      DEFAULT_SETTINGS
    );

  const [
    drawerType,
    setDrawerType,
  ] =
    useState<DrawerType>(
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
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  /* =======================================================
     HYDRATION
  ======================================================= */

  useEffect(() => {
    setMounted(
      true
    );

    try {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!stored) {
        return;
      }

      const parsed =
        JSON.parse(
          stored
        ) as UserSettingsState;

      setSavedSettings(
        parsed
      );

      setDraft(
        parsed
      );
    } catch (
      error
    ) {
      console.error(
        "User settings hydration error:",
        error
      );
    }
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

  /* =======================================================
     DERIVED
  ======================================================= */

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
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return SECTIONS;
      }

      return SECTIONS.filter(
        (
          section
        ) =>
          section.label
            .toLowerCase()
            .includes(
              query
            ) ||
          section.description
            .toLowerCase()
            .includes(
              query
            ) ||
          section.keywords.some(
            (
              keyword
            ) =>
              keyword.includes(
                query
              )
          )
      );
    }, [
      searchQuery,
    ]);

  const accountHealth =
    useMemo(() => {
      let score =
        54;

      if (
        draft.notifications
          .email
      ) {
        score +=
          5;
      }

      if (
        draft.notifications
          .push
      ) {
        score +=
          5;
      }

      if (
        draft.privacy
          .analytics ===
        false
      ) {
        score +=
          5;
      }

      if (
        draft.wallet
          .requireConfirmation
      ) {
        score +=
          10;
      }

      if (
        draft.wallet
          .confirmThreshold <=
        15000
      ) {
        score +=
          6;
      }

      if (
        draft.privacy
          .personalization
      ) {
        score +=
          4;
      }

      if (
        draft.privacy
          .discoverability
      ) {
        score +=
          3;
      }

      if (
        draft.appearance
          .reduceMotion
      ) {
        score +=
          2;
      }

      return Math.min(
        score,
        100
      );
    }, [
      draft,
    ]);

  const privacyScore =
    useMemo(() => {
      let score =
        58;

      if (
        !draft.privacy
          .analytics
      ) {
        score +=
          16;
      }

      if (
        !draft.privacy
          .discoverability
      ) {
        score +=
          10;
      }

      if (
        !draft.privacy
          .showTransactionNames
      ) {
        score +=
          10;
      }

      if (
        !draft.privacy
          .personalization
      ) {
        score +=
          6;
      }

      return Math.min(
        score,
        100
      );
    }, [
      draft.privacy,
    ]);

  /* =======================================================
     SAVE / DISCARD
  ======================================================= */

  const saveChanges =
    async () => {
      setSaving(
        true
      );

      await new Promise(
        (
          resolve
        ) =>
          window.setTimeout(
            resolve,
            420
          )
      );

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            draft
          )
        );

        setSavedSettings(
          draft
        );

        setToast({
          type:
            "success",
          message:
            "Your settings were saved in the frontend demo state.",
        });
      } catch {
        setToast({
          type:
            "error",
          message:
            "Could not save your settings.",
        });
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
          "Unsaved changes were discarded.",
      });
    };

  /* =======================================================
     EXPORT
  ======================================================= */

  const downloadExport =
    (
      format:
        "json" |
        "csv"
    ) => {
      const payload = {
        exportedAt:
          new Date()
            .toISOString(),

        profile: {
          name:
            draft.profile
              .name,

          email:
            draft.profile
              .email,

          phone:
            draft.profile
              .phone,
        },

        settings:
          draft,
      };

      let blob:
        Blob;

      let filename:
        string;

      if (
        format ===
        "json"
      ) {
        blob =
          new Blob(
            [
              JSON.stringify(
                payload,
                null,
                2
              ),
            ],
            {
              type:
                "application/json",
            }
          );

        filename =
          "coffer-account-settings.json";
      } else {
        const rows = [
          [
            "Section",
            "Key",
            "Value",
          ],

          ...Object.entries(
            draft.profile
          ).map(
            (
              [
                key,
                value,
              ]
            ) => [
              "profile",
              key,
              String(
                value
              ),
            ]
          ),

          ...Object.entries(
            draft.wallet
          ).map(
            (
              [
                key,
                value,
              ]
            ) => [
              "wallet",
              key,
              String(
                value
              ),
            ]
          ),

          ...Object.entries(
            draft.notifications
          ).map(
            (
              [
                key,
                value,
              ]
            ) => [
              "notifications",
              key,
              String(
                value
              ),
            ]
          ),
        ];

        const csv =
          rows
            .map(
              (
                row
              ) =>
                row
                  .map(
                    (
                      cell
                    ) =>
                      `"${String(
                        cell
                      ).replaceAll(
                        '"',
                        '""'
                      )}"`
                  )
                  .join(
                    ","
                  )
            )
            .join(
              "\n"
            );

        blob =
          new Blob(
            [
              csv,
            ],
            {
              type:
                "text/csv;charset=utf-8",
            }
          );

        filename =
          "coffer-account-settings.csv";
      }

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        url;

      anchor.download =
        filename;

      anchor.click();

      URL.revokeObjectURL(
        url
      );

      setDrawerType(
        null
      );

      setToast({
        type:
          "success",
        message:
          `${format.toUpperCase()} export created.`,
      });
    };

  /* =======================================================
     DANGER
  ======================================================= */

  const confirmDangerAction =
    () => {
      if (
        dangerAction ===
        "logout-all"
      ) {
        setDangerAction(
          null
        );

        setToast({
          type:
            "info",
          message:
            "Demo confirmation completed. Connect this to the real session API.",
        });

        return;
      }

      if (
        dangerAction ===
        "delete-account"
      ) {
        setDangerAction(
          null
        );

        setToast({
          type:
            "info",
          message:
            "Demo confirmation completed. No account data was deleted.",
        });
      }
    };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F7FB]" />
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] pb-12 text-[#0F2745]">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <UserHero
          name={
            draft.profile
              .name
          }
          accountHealth={
            accountHealth
          }
          onOpenSessions={() =>
            setDrawerType(
              "sessions"
            )
          }
        />

        <div className="mt-4 space-y-5">
          <SettingsNavigation
            activeSection={
              activeSection
            }
            sections={
              filteredSections
            }
            searchQuery={
              searchQuery
            }
            onSearchChange={
              setSearchQuery
            }
            onSectionChange={
              setActiveSection
            }
          />

          <section className="min-w-0">
            <AnimatePresence
              mode="wait"
            >
              <motion.div
                key={
                  activeSection
                }
                initial={{
                  opacity: 0,
                  y: 14,
                  scale:
                    0.992,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
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
                    accountHealth={
                      accountHealth
                    }
                    privacyScore={
                      privacyScore
                    }
                    onOpenSessions={() =>
                      setDrawerType(
                        "sessions"
                      )
                    }
                    onOpenPrivacy={() =>
                      setDrawerType(
                        "privacy"
                      )
                    }
                  />
                )}

                {activeSection ===
                  "profile" && (
                  <ProfileSection
                    draft={
                      draft
                    }
                    setDraft={
                      setDraft
                    }
                  />
                )}

                {activeSection ===
                  "security" && (
                  <SecuritySection
                    accountHealth={
                      accountHealth
                    }
                    onOpenSessions={() =>
                      setDrawerType(
                        "sessions"
                      )
                    }
                  />
                )}

                {activeSection ===
                  "notifications" && (
                  <NotificationSection
                    draft={
                      draft
                    }
                    setDraft={
                      setDraft
                    }
                  />
                )}

                {activeSection ===
                  "privacy" && (
                  <PrivacySection
                    draft={
                      draft
                    }
                    privacyScore={
                      privacyScore
                    }
                    setDraft={
                      setDraft
                    }
                    onOpenDetails={() =>
                      setDrawerType(
                        "privacy"
                      )
                    }
                  />
                )}

                {activeSection ===
                  "appearance" && (
                  <AppearanceSection
                    draft={
                      draft
                    }
                    setDraft={
                      setDraft
                    }
                  />
                )}

                {activeSection ===
                  "wallet" && (
                  <WalletSection
                    draft={
                      draft
                    }
                    setDraft={
                      setDraft
                    }
                  />
                )}

                {activeSection ===
                  "data" && (
                  <DataSection
                    onOpenExport={() =>
                      setDrawerType(
                        "export"
                      )
                    }
                  />
                )}

                {activeSection ===
                  "danger" && (
                  <DangerSection
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
            onSave={() =>
              void saveChanges()
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
            privacyScore={
              privacyScore
            }
            onClose={() =>
              setDrawerType(
                null
              )
            }
            onExport={
              downloadExport
            }
          />
        )}
      </AnimatePresence>

      <DangerModal
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

function UserHero({
  name,
  accountHealth,
  onOpenSessions,
}: {
  name:
    string;
  accountHealth:
    number;
  onOpenSessions:
    () => void;
}) {
  const initial =
    name
      .trim()
      .charAt(
        0
      )
      .toUpperCase() ||
    "U";

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="relative overflow-hidden rounded-[32px] border border-[#17466F]/20 bg-[linear-gradient(135deg,#07182b_0%,#0d3152_48%,#1f6ca6_100%)] px-5 py-6 text-white shadow-[0_25px_70px_rgba(15,39,69,0.18)] sm:px-7 sm:py-8 lg:px-9"
    >
      <motion.div
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-cyan-300/15"
        animate={{
          rotate:
            360,
        }}
        transition={{
          duration:
            24,
          repeat:
            Infinity,
          ease:
            "linear",
        }}
      />

      <motion.div
        className="pointer-events-none absolute right-20 top-14 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl"
        animate={{
          scale: [
            0.85,
            1.15,
            0.85,
          ],
          opacity: [
            0.25,
            0.65,
            0.25,
          ],
        }}
        transition={{
          duration:
            4.5,
          repeat:
            Infinity,
        }}
      />

      <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Settings className="h-5 w-5 text-cyan-200" />
            </div>

            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
              Personal Account
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-[42px]">
            Settings & Preferences
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/75 sm:text-base">
            Customize your Coffer experience, privacy, wallet behaviour, notifications and account preferences from one personal control center.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill
              icon={
                ShieldCheck
              }
              text="Account protected"
              tone="green"
            />

            <StatusPill
              icon={
                UserRound
              }
              text="Personal scope"
              tone="blue"
            />

            <StatusPill
              icon={
                Lock
              }
              text="Privacy controls"
              tone="blue"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={
            onOpenSessions
          }
          className="group flex w-full max-w-sm items-center justify-between rounded-[24px] border border-white/10 bg-white/10 p-4 text-left backdrop-blur-xl transition hover:bg-white/15 xl:w-[360px]"
        >
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border border-emerald-300/30"
                animate={{
                  scale: [
                    0.86,
                    1.08,
                    0.86,
                  ],
                  opacity: [
                    0.35,
                    0.8,
                    0.35,
                  ],
                }}
                transition={{
                  duration:
                    2.6,
                  repeat:
                    Infinity,
                }}
              />

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-300/15 text-sm font-black text-emerald-100">
                {accountHealth}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/55">
                Account health
              </p>

              <p className="mt-1 text-sm font-black">
                Hello,{" "}
                {name ||
                  "User"}
              </p>

              <p className="mt-1 text-[10px] text-blue-100/55">
                Review your active sessions
              </p>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-blue-100/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
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
  sections,
  searchQuery,
  onSearchChange,
  onSectionChange,
}: {
  activeSection: SectionId;
  sections: SectionConfig[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSectionChange: (id: SectionId) => void;
}) {
  return (
    <nav className="sticky top-3 z-30 min-w-0 rounded-[24px] border border-slate-200/90 bg-white/95 p-3 shadow-[0_14px_40px_rgba(15,39,69,0.07)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center">
        <div className="flex shrink-0 items-center justify-between gap-3 2xl:w-[255px]">
          <div className="flex min-w-0 items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, repeatDelay: 2 }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0F2745,#1F5EA8)] text-white shadow-[0_8px_20px_rgba(31,94,168,.2)]"
            >
              <Settings className="h-4 w-4" />
            </motion.div>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#1F5EA8]">Coffer Settings</p>
              <p className="truncate text-xs font-black text-[#0F2745]">Personal Control Center</p>
            </div>
          </div>

          <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-600 sm:inline-flex">
            Personal
          </span>
        </div>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search settings..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-9 text-xs font-semibold text-[#0F2745] outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 2xl:max-w-[260px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear settings search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 2xl:right-auto 2xl:left-[225px]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {sections.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-5 text-center text-xs font-semibold text-slate-400">
            No matching settings.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = section.id === activeSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                  className="group relative min-w-0 overflow-hidden rounded-[14px] px-2 py-2.5 text-center"
                >
                  {active && (
                    <motion.div
                      layoutId="user-settings-active-horizontal"
                      className="absolute inset-0 rounded-[14px] border border-blue-100 bg-[linear-gradient(135deg,#eaf4ff,#f8fbff)] shadow-[0_5px_15px_rgba(31,94,168,.08)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <span
                    className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-[10px] transition-all ${
                      active
                        ? "bg-[#1F5EA8] text-white shadow-[0_6px_14px_rgba(31,94,168,.2)]"
                        : "bg-[#F6F8FB] text-slate-400 group-hover:bg-blue-50 group-hover:text-[#1F5EA8]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>

                  <span
                    className={`relative z-10 mt-1.5 block truncate text-[9px] font-black ${
                      active ? "text-[#1F5EA8]" : "text-slate-600"
                    }`}
                    title={section.label}
                  >
                    {section.label}
                  </span>

                  {active && (
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="absolute bottom-0 left-1/2 z-10 h-0.5 w-8 -translate-x-1/2 rounded-full bg-cyan-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewSection({
  draft,
  accountHealth,
  privacyScore,
  onOpenSessions,
  onOpenPrivacy,
}: {
  draft:
    UserSettingsState;
  accountHealth:
    number;
  privacyScore:
    number;
  onOpenSessions:
    () => void;
  onOpenPrivacy:
    () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Personal Control Center"
        title="Account Overview"
        description="A quick view of your account settings, privacy posture and wallet preferences."
        icon={
          Activity
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={
            ShieldCheck
          }
          title="Account Health"
          value={`${accountHealth}%`}
          note="Settings protection baseline"
          tone="green"
        />

        <MetricCard
          icon={
            Lock
          }
          title="Privacy Score"
          value={`${privacyScore}%`}
          note="Based on your visibility choices"
          tone="blue"
        />

        <MetricCard
          icon={
            WalletCards
          }
          title="Confirm Above"
          value={`৳${Math.round(
            draft.wallet
              .confirmThreshold /
              1000
          )}k`}
          note="Large transfer confirmation"
          tone="amber"
        />

        <MetricCard
          icon={
            BellRing
          }
          title="Alerts"
          value={
            draft.notifications
              .push
              ? "Active"
              : "Limited"
          }
          note="Push notification preference"
          tone={
            draft.notifications
              .push
              ? "green"
              : "amber"
          }
        />
      </div>

      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}
      >
        <AccountHealthCard
          score={
            accountHealth
          }
          draft={
            draft
          }
        />

        <QuickActionsCard
          onSessions={
            onOpenSessions
          }
          onPrivacy={
            onOpenPrivacy
          }
        />
      </div>
    </div>
  );
}

function AccountHealthCard({
  score,
  draft,
}: {
  score: number;
  draft: UserSettingsState;
}) {
  const circumference = 2 * Math.PI * 44;

  const items = [
    {
      label: "Wallet confirmation",
      value: draft.wallet.requireConfirmation ? 95 : 60,
      icon: WalletCards,
    },
    {
      label: "Privacy controls",
      value: draft.privacy.analytics ? 72 : 94,
      icon: Lock,
    },
    {
      label: "Alert coverage",
      value: draft.notifications.push ? 92 : 68,
      icon: BellRing,
    },
  ];

  return (
    <div className="relative self-start overflow-hidden rounded-[30px] bg-[#0F2745] p-5 text-white shadow-[0_18px_55px_rgba(15,39,69,0.16)] sm:p-6">
      <motion.div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-cyan-300/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10">
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[128px_minmax(0,1fr)]">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32">
            <motion.div
              className="absolute inset-[-8px] rounded-full border border-cyan-300/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)]" />
            </motion.div>

            <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
              <circle cx="54" cy="54" r="44" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="8" />
              <motion.circle
                cx="54"
                cy="54"
                r="44"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={score}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-black sm:text-3xl"
              >
                {score}
              </motion.span>
              <span className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-100/45">Health</span>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-100/50">Account Health</p>
            <h3 className="mt-2 text-lg font-black leading-tight sm:text-xl">Your preferences are in good shape</h3>
            <p className="mt-2 text-[11px] leading-5 text-blue-100/60">
              This score reacts to privacy, transfer confirmation and notification choices without squeezing the content into narrow columns.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-200">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] font-black">{item.value}%</span>
                </div>
                <p className="mt-3 truncate text-[9px] font-semibold text-blue-100/55">{item.label}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.08 * index }}
                    className={`h-full rounded-full ${item.value >= 90 ? "bg-emerald-400" : item.value >= 75 ? "bg-amber-400" : "bg-rose-400"}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuickActionsCard({
  onSessions,
  onPrivacy,
}: {
  onSessions:
    () => void;
  onPrivacy:
    () => void;
}) {
  return (
    <div className="self-start rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,39,69,0.05)] sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        Quick Actions
      </p>

      <h3 className="mt-1 text-lg font-black">
        Personal controls
      </h3>

      <div className="mt-6 space-y-3">
        <QuickAction
          icon={
            MonitorSmartphone
          }
          title="Active sessions"
          description="Review signed-in devices"
          onClick={
            onSessions
          }
        />

        <QuickAction
          icon={
            Lock
          }
          title="Privacy summary"
          description="Review visibility choices"
          onClick={
            onPrivacy
          }
        />

        <QuickAction
          icon={
            KeyRound
          }
          title="Security Center"
          description="Password, sessions and 2FA"
          href="/dashboard/security"
        />
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
  href,
}: {
  icon:
    LucideIcon;
  title:
    string;
  description:
    string;
  onClick?:
    () => void;
  href?:
    string;
}) {
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-300" />
    </>
  );

  const className =
    "flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3 text-left transition hover:border-blue-100 hover:bg-white hover:shadow-sm";

  if (href) {
    return (
      <Link
        href={
          href
        }
        className={
          className
        }
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={
        className
      }
    >
      {content}
    </button>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function ProfileSection({
  draft,
  setDraft,
}: {
  draft:
    UserSettingsState;
  setDraft:
    React.Dispatch<
      React.SetStateAction<UserSettingsState>
    >;
}) {
  const initial =
    draft.profile
      .name
      .trim()
      .charAt(
        0
      )
      .toUpperCase() ||
    "U";

  const updateProfile = <
    K extends keyof UserSettingsState["profile"]
  >(
    key:
      K,
    value:
      UserSettingsState["profile"][K]
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,

        profile: {
          ...current.profile,
          [key]:
            value,
        },
      })
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Identity"
        title="Profile & Identity"
        description="Manage your personal information and how it appears across Coffer."
        icon={
          UserRound
        }
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-5 sm:flex-row sm:items-center">
          <motion.div
            animate={{
              boxShadow: [
                "0 10px 25px rgba(31,94,168,.12)",
                "0 12px 35px rgba(34,211,238,.22)",
                "0 10px 25px rgba(31,94,168,.12)",
              ],
            }}
            transition={{
              duration:
                4,
              repeat:
                Infinity,
            }}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1F5EA8] to-cyan-400 text-2xl font-black text-white"
          >
            {initial}
          </motion.div>

          <div>
            <p className="text-sm font-black">
              {
                draft.profile
                  .name
              }
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Personal identity profile
            </p>

            <button
              type="button"
              onClick={() =>
                window.alert(
                  "Connect your real avatar upload endpoint here."
                )
              }
              className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-[#1F5EA8] shadow-sm transition hover:border-blue-200"
            >
              Change Avatar
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <TextField
            label="Full Name"
            value={
              draft.profile
                .name
            }
            icon={
              User
            }
            onChange={(
              value
            ) =>
              updateProfile(
                "name",
                value
              )
            }
          />

          <TextField
            label="Email Address"
            value={
              draft.profile
                .email
            }
            type="email"
            icon={
              Mail
            }
            onChange={(
              value
            ) =>
              updateProfile(
                "email",
                value
              )
            }
          />

          <TextField
            label="Phone Number"
            value={
              draft.profile
                .phone
            }
            type="tel"
            icon={
              Phone
            }
            onChange={(
              value
            ) =>
              updateProfile(
                "phone",
                value
              )
            }
          />
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs leading-5 text-blue-800">
            Changes to legal identity information may require KYC verification before they affect verified account identity.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SECURITY
========================================================= */

function SecuritySection({
  accountHealth,
  onOpenSessions,
}: {
  accountHealth:
    number;
  onOpenSessions:
    () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Protection"
        title="Security Preferences"
        description="Review account protection, active sessions and dedicated security controls."
        icon={
          ShieldCheck
        }
      />

      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}
      >
        <div className="space-y-4">
          <SecurityInfoCard
            icon={
              Fingerprint
            }
            title="Security Score"
            value={`${accountHealth} / 100`}
            description="Your settings provide a strong protection baseline."
            tone="green"
          />

          <SecurityInfoCard
            icon={
              Smartphone
            }
            title="Two-Factor Authentication"
            value="Security Center"
            description="Manage 2FA and sensitive authentication from the dedicated security page."
            tone="blue"
          />

          <button
            type="button"
            onClick={
              onOpenSessions
            }
            className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-100 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                <MonitorSmartphone className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black">
                  Active Sessions
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Review devices where your account is signed in.
                </p>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300" />
          </button>

          <Link
            href="/dashboard/security"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#17466F]"
          >
            <KeyRound className="h-4 w-4" />
            Open Security Center
          </Link>
        </div>

        <SecurityPulse
          score={
            accountHealth
          }
        />
      </div>
    </div>
  );
}

function SecurityInfoCard({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon:
    LucideIcon;
  title:
    string;
  value:
    string;
  description:
    string;
  tone:
    | "green"
    | "blue";
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          tone ===
          "green"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-blue-50 text-[#1F5EA8]"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SecurityPulse({
  score,
}: {
  score:
    number;
}) {
  return (
    <div className="relative self-start overflow-hidden rounded-[28px] bg-[#0F2745] p-5 text-white shadow-[0_18px_50px_rgba(15,39,69,.14)]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/50">
        Security Pulse
      </p>

      <div className="mt-7 flex justify-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {[1, 2, 3].map(
            (
              ring
            ) => (
              <motion.div
                key={
                  ring
                }
                className="absolute rounded-full border border-cyan-300/15"
                style={{
                  width:
                    `${62 + ring * 34}px`,
                  height:
                    `${62 + ring * 34}px`,
                }}
                animate={{
                  rotate:
                    ring %
                    2
                      ? 360
                      : -360,
                  opacity: [
                    0.25,
                    0.65,
                    0.25,
                  ],
                }}
                transition={{
                  rotate: {
                    duration:
                      12 +
                      ring *
                        4,
                    repeat:
                      Infinity,
                    ease:
                      "linear",
                  },

                  opacity: {
                    duration:
                      3 +
                      ring,
                    repeat:
                      Infinity,
                  },
                }}
              >
                <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300" />
              </motion.div>
            )
          )}

          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 rgba(16,185,129,0)",
                "0 0 45px rgba(16,185,129,.2)",
                "0 0 0 rgba(16,185,129,0)",
              ],
            }}
            transition={{
              duration:
                3,
              repeat:
                Infinity,
            }}
            className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-[30px] border border-emerald-300/20 bg-emerald-300/10"
          >
            <Fingerprint className="h-9 w-9 text-emerald-300" />

            <span className="mt-1 text-sm font-black">
              {score}
            </span>
          </motion.div>
        </div>
      </div>

      <p className="text-center text-xs leading-6 text-blue-100/60">
        Account protection visualization based on your current settings.
      </p>
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function NotificationSection({
  draft,
  setDraft,
}: {
  draft:
    UserSettingsState;
  setDraft:
    React.Dispatch<
      React.SetStateAction<UserSettingsState>
    >;
}) {
  const update = (
    key:
      keyof UserSettingsState["notifications"],
    value:
      boolean
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,

        notifications: {
          ...current.notifications,
          [key]:
            value,
        },
      })
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Communication"
        title="Notification Preferences"
        description="Choose how Coffer communicates account, security and product updates."
        icon={
          BellRing
        }
      />

      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}
      >
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <ToggleRow
            label="Email Notifications"
            description="Account summaries and important alerts."
            enabled={
              draft.notifications
                .email
            }
            onChange={(
              value
            ) =>
              update(
                "email",
                value
              )
            }
          />

          <div className="mt-5 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Push Notifications"
              description="Immediate alerts delivered to supported devices."
              enabled={
                draft.notifications
                  .push
              }
              onChange={(
                value
              ) =>
                update(
                  "push",
                  value
                )
              }
            />
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <ToggleRow
              label="SMS Alerts"
              description="Use text messages for critical security alerts."
              enabled={
                draft.notifications
                  .sms
              }
              onChange={(
                value
              ) =>
                update(
                  "sms",
                  value
                )
              }
            />
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Tips & Offers"
              description="Optional product updates and financial tips."
              enabled={
                draft.notifications
                  .marketing
              }
              onChange={(
                value
              ) =>
                update(
                  "marketing",
                  value
                )
              }
            />
          </div>
        </div>

        <NotificationVisualizer
          draft={
            draft
          }
        />
      </div>
    </div>
  );
}

function NotificationVisualizer({
  draft,
}: {
  draft:
    UserSettingsState;
}) {
  const channels = [
    {
      label:
        "Email",
      active:
        draft.notifications
          .email,
      icon:
        Mail,
    },
    {
      label:
        "Push",
      active:
        draft.notifications
          .push,
      icon:
        BellRing,
    },
    {
      label:
        "SMS",
      active:
        draft.notifications
          .sms,
      icon:
        Phone,
    },
  ];

  return (
    <div className="relative self-start overflow-hidden rounded-[28px] bg-[linear-gradient(155deg,#0F2745,#153c63)] p-5 text-white shadow-[0_18px_50px_rgba(15,39,69,.14)]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/50">
        Alert Flow
      </p>

      <h3 className="mt-2 text-lg font-black">
        Notification channels
      </h3>

      <div className="relative mt-6 flex h-[195px] items-center justify-center">
        <motion.div
          className="absolute flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10"
          animate={{
            scale: [
              0.96,
              1.06,
              0.96,
            ],
            boxShadow: [
              "0 0 0 rgba(34,211,238,0)",
              "0 0 38px rgba(34,211,238,.16)",
              "0 0 0 rgba(34,211,238,0)",
            ],
          }}
          transition={{
            duration:
              3.2,
            repeat:
              Infinity,
          }}
        >
          <BellRing className="h-9 w-9 text-cyan-200" />
        </motion.div>

        {channels.map(
          (
            item,
            index
          ) => {
            const Icon =
              item.icon;

            const positions = [
              "left-[8%] top-[20%]",
              "right-[8%] top-[20%]",
              "left-1/2 bottom-[4%] -translate-x-1/2",
            ];

            return (
              <motion.div
                key={
                  item.label
                }
                className={`absolute ${positions[index]} flex h-16 w-16 items-center justify-center rounded-2xl border ${
                  item.active
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-white/10 bg-white/[0.05] text-blue-100/35"
                }`}
                animate={
                  item.active
                    ? {
                        y: [
                          0,
                          -5,
                          0,
                        ],
                      }
                    : undefined
                }
                transition={{
                  duration:
                    2.5 +
                    index *
                      0.4,
                  repeat:
                    Infinity,
                }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
            );
          }
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {channels.map(
          (
            item
          ) => (
            <div
              key={
                item.label
              }
              className="rounded-xl border border-white/10 bg-white/[0.05] p-2 text-center"
            >
              <p className="text-[9px] text-blue-100/45">
                {
                  item.label
                }
              </p>

              <p
                className={`mt-1 text-[9px] font-black ${
                  item.active
                    ? "text-emerald-300"
                    : "text-slate-400"
                }`}
              >
                {item.active
                  ? "ON"
                  : "OFF"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PRIVACY
========================================================= */

function PrivacySection({
  draft,
  privacyScore,
  setDraft,
  onOpenDetails,
}: {
  draft:
    UserSettingsState;
  privacyScore:
    number;
  setDraft:
    React.Dispatch<
      React.SetStateAction<UserSettingsState>
    >;
  onOpenDetails:
    () => void;
}) {
  const update = (
    key:
      keyof UserSettingsState["privacy"],
    value:
      boolean
  ) => {
    setDraft(
      (
        current
      ) => ({
        ...current,

        privacy: {
          ...current.privacy,
          [key]:
            value,
        },
      })
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Privacy"
        title="Privacy Center"
        description="Control visibility, analytics and personalization behaviour for your account."
        icon={
          Lock
        }
      />

      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}
      >
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <ToggleRow
            label="Analytics Participation"
            description="Allow anonymous usage analytics to improve the product."
            enabled={
              draft.privacy
                .analytics
            }
            onChange={(
              value
            ) =>
              update(
                "analytics",
                value
              )
            }
          />

          <div className="mt-5 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Profile Discoverability"
              description="Allow supported transfer flows to find your account."
              enabled={
                draft.privacy
                  .discoverability
              }
              onChange={(
                value
              ) =>
                update(
                  "discoverability",
                  value
                )
              }
            />
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Personalization"
              description="Allow the dashboard to tailor suggestions and layout preferences."
              enabled={
                draft.privacy
                  .personalization
              }
              onChange={(
                value
              ) =>
                update(
                  "personalization",
                  value
                )
              }
            />
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Show transaction counterparty names"
              description="Display saved counterparty names in supported transaction views."
              enabled={
                draft.privacy
                  .showTransactionNames
              }
              onChange={(
                value
              ) =>
                update(
                  "showTransactionNames",
                  value
                )
              }
            />
          </div>

          <button
            type="button"
            onClick={
              onOpenDetails
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-black text-[#1F5EA8]"
          >
            Privacy Summary
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <PreferenceMiniCard icon={EyeOff} label="Analytics" value={draft.privacy.analytics ? "Shared" : "Private"} active={!draft.privacy.analytics} />
            <PreferenceMiniCard icon={Search} label="Discoverability" value={draft.privacy.discoverability ? "Visible" : "Hidden"} active={!draft.privacy.discoverability} />
            <PreferenceMiniCard icon={Sparkles} label="Personalization" value={draft.privacy.personalization ? "On" : "Off"} active={!draft.privacy.personalization} />
          </div>
        </div>

        <PrivacyShield
          score={
            privacyScore
          }
        />
      </div>
    </div>
  );
}

function PrivacyShield({
  score,
}: {
  score:
    number;
}) {
  return (
    <div className="relative self-start overflow-hidden rounded-[28px] bg-[#0F2745] p-5 text-white shadow-[0_18px_50px_rgba(15,39,69,.14)]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/50">
        Privacy Shield
      </p>

      <div className="mt-8 flex justify-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <motion.div
            className="absolute h-44 w-44 rounded-[40%] border border-cyan-300/15"
            animate={{
              rotate:
                360,
            }}
            transition={{
              duration:
                18,
              repeat:
                Infinity,
              ease:
                "linear",
            }}
          />

          <motion.div
            className="absolute h-36 w-36 rounded-[38%] border border-blue-300/15"
            animate={{
              rotate:
                -360,
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

          <motion.div
            animate={{
              scale: [
                0.96,
                1.04,
                0.96,
              ],
              boxShadow: [
                "0 0 0 rgba(16,185,129,0)",
                "0 0 45px rgba(16,185,129,.18)",
                "0 0 0 rgba(16,185,129,0)",
              ],
            }}
            transition={{
              duration:
                3.2,
              repeat:
                Infinity,
            }}
            className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-[30px] border border-emerald-300/20 bg-emerald-300/10"
          >
            <Lock className="h-8 w-8 text-emerald-300" />

            <span className="mt-1 text-sm font-black">
              {score}%
            </span>
          </motion.div>
        </div>
      </div>

      <p className="text-center text-xs leading-6 text-blue-100/60">
        Privacy score reacts to analytics, discoverability and visibility preferences.
      </p>
    </div>
  );
}

/* =========================================================
   APPEARANCE
========================================================= */

function AppearanceSection({
  draft,
  setDraft,
}: {
  draft:
    UserSettingsState;
  setDraft:
    React.Dispatch<
      React.SetStateAction<UserSettingsState>
    >;
}) {
  const themes:
    Array<{
      id:
        ThemeMode;
      label:
        string;
      description:
        string;
      icon:
        LucideIcon;
    }> = [
      {
        id:
          "light",
        label:
          "Light",
        description:
          "Bright and clean",
        icon:
          Sun,
      },
      {
        id:
          "dark",
        label:
          "Dark",
        description:
          "Low-light experience",
        icon:
          Moon,
      },
      {
        id:
          "system",
        label:
          "System",
        description:
          "Follow operating system",
        icon:
          MonitorSmartphone,
      },
    ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Experience"
        title="Appearance"
        description="Customize visual theme, dashboard density and motion preferences."
        icon={
          Palette
        }
      />

      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}
      >
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
            Color Theme
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {themes.map(
              (
                theme
              ) => (
                <ChoiceCard
                  key={
                    theme.id
                  }
                  icon={
                    theme.icon
                  }
                  title={
                    theme.label
                  }
                  description={
                    theme.description
                  }
                  active={
                    draft.appearance
                      .theme ===
                    theme.id
                  }
                  onClick={() =>
                    setDraft(
                      (
                        current
                      ) => ({
                        ...current,

                        appearance: {
                          ...current.appearance,
                          theme:
                            theme.id,
                        },
                      })
                    )
                  }
                />
              )
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
              Dashboard Density
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  "comfortable",
                  "compact",
                ] as Density[]
              ).map(
                (
                  density
                ) => (
                  <button
                    key={
                      density
                    }
                    type="button"
                    onClick={() =>
                      setDraft(
                        (
                          current
                        ) => ({
                          ...current,

                          appearance: {
                            ...current.appearance,
                            density,
                          },
                        })
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      draft.appearance
                        .density ===
                      density
                        ? "border-[#1F5EA8] bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-black capitalize">
                      {density}
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      {density ===
                      "comfortable"
                        ? "More breathing room"
                        : "More information on screen"}
                    </p>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Reduce Motion"
              description="Use calmer interface transitions where supported."
              enabled={
                draft.appearance
                  .reduceMotion
              }
              onChange={(
                value
              ) =>
                setDraft(
                  (
                    current
                  ) => ({
                    ...current,

                    appearance: {
                      ...current.appearance,
                      reduceMotion:
                        value,
                    },
                  })
                )
              }
            />
          </div>
        </div>

        <AppearancePreview
          draft={
            draft
          }
        />
      </div>
    </div>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon:
    LucideIcon;
  title:
    string;
  description:
    string;
  active:
    boolean;
  onClick:
    () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={
        onClick
      }
      whileHover={{
        y: -3,
      }}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#1F5EA8] bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          active
            ? "bg-white text-[#1F5EA8]"
            : "bg-slate-50 text-slate-400"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-4 text-sm font-black">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>
    </motion.button>
  );
}

function AppearancePreview({
  draft,
}: {
  draft:
    UserSettingsState;
}) {
  const dark =
    draft.appearance
      .theme ===
    "dark";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-sm transition ${
        dark
          ? "border-slate-700 bg-[#0F2745] text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.12em] ${
          dark
            ? "text-blue-100/50"
            : "text-slate-400"
        }`}
      >
        Live Preview
      </p>

      <motion.div
        layout
        className={`mt-5 rounded-[24px] border p-4 ${
          dark
            ? "border-white/10 bg-white/[0.05]"
            : "border-slate-200 bg-[#F8FAFC]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1F5EA8] to-cyan-400" />

          <div className="flex-1 space-y-2">
            <div
              className={`h-3 w-1/3 rounded-full ${
                dark
                  ? "bg-white/15"
                  : "bg-slate-200"
              }`}
            />

            <div
              className={`h-3 w-full rounded-full ${
                dark
                  ? "bg-white/10"
                  : "bg-slate-100"
              }`}
            />

            <div
              className={`h-3 w-3/4 rounded-full ${
                dark
                  ? "bg-white/10"
                  : "bg-slate-100"
              }`}
            />
          </div>
        </div>

        <div
          className={`mt-5 grid grid-cols-2 ${
            draft.appearance.density === "compact"
              ? "gap-2"
              : "gap-4"
          }`}
        >
          <div
            className={`rounded-xl ${
              dark
                ? "bg-white/[0.06]"
                : "bg-white"
            } p-3`}
          >
            <div className="h-2 w-1/2 rounded-full bg-blue-200" />
            <div className="mt-2 h-5 w-3/4 rounded-lg bg-blue-500/15" />
          </div>

          <div
            className={`rounded-xl ${
              dark
                ? "bg-white/[0.06]"
                : "bg-white"
            } p-3`}
          >
            <div className="h-2 w-1/2 rounded-full bg-emerald-200" />
            <div className="mt-2 h-5 w-2/3 rounded-lg bg-emerald-500/15" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================
   WALLET
========================================================= */

function WalletSection({
  draft,
  setDraft,
}: {
  draft:
    UserSettingsState;
  setDraft:
    React.Dispatch<
      React.SetStateAction<UserSettingsState>
    >;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Wallet"
        title="Wallet Preferences"
        description="Control balance display, default currency and confirmation behaviour."
        icon={
          WalletCards
        }
      />

      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}
      >
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label className="mb-2 block text-xs font-black text-slate-700">
            Default Currency
          </label>

          <select
            value={
              draft.wallet
                .defaultCurrency
            }
            onChange={(
              event
            ) =>
              setDraft(
                (
                  current
                ) => ({
                  ...current,

                  wallet: {
                    ...current.wallet,
                    defaultCurrency:
                      event.target
                        .value as
                        | "BDT"
                        | "USD"
                        | "EUR",
                  },
                })
              )
            }
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="BDT">
              BDT — Bangladeshi Taka
            </option>

            <option value="USD">
              USD — US Dollar
            </option>

            <option value="EUR">
              EUR — Euro
            </option>
          </select>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Hide balances on launch"
              description="Mask wallet amounts until you explicitly reveal them."
              enabled={
                draft.wallet
                  .hideAmounts
              }
              onChange={(
                value
              ) =>
                setDraft(
                  (
                    current
                  ) => ({
                    ...current,

                    wallet: {
                      ...current.wallet,
                      hideAmounts:
                        value,
                    },
                  })
                )
              }
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <ToggleRow
              label="Require transfer confirmation"
              description="Ask for confirmation before supported wallet transfer actions."
              enabled={
                draft.wallet
                  .requireConfirmation
              }
              onChange={(
                value
              ) =>
                setDraft(
                  (
                    current
                  ) => ({
                    ...current,

                    wallet: {
                      ...current.wallet,
                      requireConfirmation:
                        value,
                    },
                  })
                )
              }
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <RangeField
              label="Large transfer confirmation"
              description="Use an extra confirmation above this amount."
              value={
                draft.wallet
                  .confirmThreshold
              }
              min={
                1000
              }
              max={
                50000
              }
              step={
                1000
              }
              onChange={(
                value
              ) =>
                setDraft(
                  (
                    current
                  ) => ({
                    ...current,

                    wallet: {
                      ...current.wallet,
                      confirmThreshold:
                        value,
                    },
                  })
                )
              }
            />
          </div>
        </div>

        <WalletVisualizer
          draft={
            draft
          }
        />
      </div>
    </div>
  );
}

function WalletVisualizer({
  draft,
}: {
  draft:
    UserSettingsState;
}) {
  const symbol =
    draft.wallet
      .defaultCurrency ===
    "BDT"
      ? "৳"
      : draft.wallet
            .defaultCurrency ===
          "USD"
        ? "$"
        : "€";

  return (
    <div className="relative self-start overflow-hidden rounded-[28px] bg-[linear-gradient(155deg,#0F2745,#154d7a)] p-5 text-white shadow-[0_18px_50px_rgba(15,39,69,.14)]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/50">
        Wallet Guard
      </p>

      <div className="mt-7 flex justify-center">
        <div className="relative flex h-52 w-52 items-center justify-center">
          <motion.div
            className="absolute h-44 w-44 rounded-full border border-cyan-300/15"
            animate={{
              rotate:
                360,
            }}
            transition={{
              duration:
                18,
              repeat:
                Infinity,
              ease:
                "linear",
            }}
          />

          <motion.div
            className="absolute h-36 w-36 rounded-full border border-blue-300/15"
            animate={{
              rotate:
                -360,
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

          <motion.div
            animate={{
              scale: [
                0.97,
                1.04,
                0.97,
              ],
            }}
            transition={{
              duration:
                3,
              repeat:
                Infinity,
            }}
            className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-[30px] border border-cyan-300/20 bg-cyan-300/10"
          >
            <WalletCards className="h-8 w-8 text-cyan-200" />

            <span className="mt-1 text-sm font-black">
              {symbol}
              {Math.round(
                draft.wallet
                  .confirmThreshold /
                  1000
              )}
              k
            </span>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <WalletState
          label="Balance Mask"
          active={
            draft.wallet
              .hideAmounts
          }
        />

        <WalletState
          label="Confirm"
          active={
            draft.wallet
              .requireConfirmation
          }
        />
      </div>
    </div>
  );
}

function WalletState({
  label,
  active,
}: {
  label:
    string;
  active:
    boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-center">
      <p className="text-[9px] text-blue-100/45">
        {label}
      </p>

      <p
        className={`mt-1 text-[9px] font-black ${
          active
            ? "text-emerald-300"
            : "text-slate-400"
        }`}
      >
        {active
          ? "ON"
          : "OFF"}
      </p>
    </div>
  );
}

/* =========================================================
   DATA
========================================================= */

function DataSection({
  onOpenExport,
}: {
  onOpenExport:
    () => void;
}) {
  const cards = [
    {
      title:
        "Account Data",
      description:
        "Profile and personal settings.",
      icon:
        UserRound,
    },
    {
      title:
        "Transaction History",
      description:
        "Wallet transaction records.",
      icon:
        Activity,
    },
    {
      title:
        "Financial Reports",
      description:
        "Budget and cash-flow summaries.",
      icon:
        Gauge,
    },
    {
      title:
        "Receipt Archive",
      description:
        "Saved receipt metadata.",
      icon:
        Database,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Your Data"
        title="Data & Export"
        description="Prepare account information for download or future backend export workflows."
        icon={
          Database
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map(
          (
            card,
            index
          ) => {
            const Icon =
              card.icon;

            return (
              <motion.button
                key={
                  card.title
                }
                type="button"
                onClick={
                  onOpenExport
                }
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.05,
                }}
                whileHover={{
                  y: -4,
                }}
                className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-100"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-sm font-black">
                  {
                    card.title
                  }
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {
                    card.description
                  }
                </p>

                <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#1F5EA8]">
                  Configure Export
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </motion.button>
            );
          }
        )}
      </div>

      <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
        <p className="text-xs leading-5 text-blue-800">
          The JSON/CSV download in this page exports the current frontend demo settings only. Real financial exports should come from authenticated backend endpoints.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DANGER
========================================================= */

function DangerSection({
  onAction,
}: {
  onAction: (action: DangerAction) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Sensitive Actions"
        title="Danger Zone"
        description="Sensitive account actions use a separate verification flow so they never look or behave like ordinary preferences."
        icon={AlertTriangle}
        danger
      />

      <div className="relative overflow-hidden rounded-[30px] border border-[#183d65] bg-[linear-gradient(145deg,#091a2d_0%,#0f2b49_54%,#123d63_100%)] p-5 text-white shadow-[0_24px_70px_rgba(15,39,69,.2)] sm:p-7">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }} />

        <motion.div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-300/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#67e8f9,transparent)]"
          animate={{ y: [0, 365, 0], opacity: [0, 0.75, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="mx-auto flex w-full max-w-[220px] flex-col items-center rounded-[24px] border border-white/10 bg-white/[0.045] p-5 text-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border border-cyan-300/15"
                  style={{ width: `${52 + ring * 27}px`, height: `${52 + ring * 27}px` }}
                  animate={{
                    rotate: ring % 2 ? 360 : -360,
                    opacity: [0.2, 0.62, 0.2],
                  }}
                  transition={{
                    rotate: { duration: 11 + ring * 4, repeat: Infinity, ease: "linear" },
                    opacity: { duration: 3 + ring * 0.35, repeat: Infinity },
                  }}
                >
                  <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]" />
                </motion.div>
              ))}

              <motion.div
                animate={{
                  scale: [0.96, 1.05, 0.96],
                  boxShadow: [
                    "0 0 0 rgba(34,211,238,0)",
                    "0 0 42px rgba(34,211,238,.16)",
                    "0 0 0 rgba(34,211,238,0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-[28px] border border-cyan-300/20 bg-cyan-300/10"
              >
                <ShieldAlert className="h-8 w-8 text-cyan-200" />
              </motion.div>
            </div>

            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/55">Verification Gate</p>
            <p className="mt-1 text-sm font-black">Protected operations</p>
            <p className="mt-2 text-[10px] leading-5 text-blue-100/50">Confirm intent, re-authenticate, then let the server perform and audit the action.</p>
          </div>

          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-200">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-black">Account protection checkpoint</h3>
                <p className="mt-1 max-w-2xl text-xs leading-6 text-blue-100/55">
                  Global sign-out is a security operation; account deletion is permanent. Both are visually separated from normal settings and require explicit confirmation.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DangerActionCard
                icon={LogOut}
                title="Log out all devices"
                description="Revoke other account sessions after identity confirmation."
                status="Security action"
                tone="blue"
                onClick={() => onAction("logout-all")}
              />

              <DangerActionCard
                icon={Trash2}
                title="Delete account"
                description="Begin the permanent account-deletion workflow with typed confirmation."
                status="Permanent action"
                tone="rose"
                onClick={() => onAction("delete-account")}
              />
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                ["01", "Confirm intent", CheckCircle2],
                ["02", "Re-authenticate", Fingerprint],
                ["03", "Server audit", Database],
              ].map(([step, label, Icon], index) => {
                const StepIcon = Icon as LucideIcon;
                return (
                  <motion.div
                    key={String(label)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                      <StepIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-blue-100/35">{String(step)}</p>
                      <p className="truncate text-[9px] font-bold text-blue-100/65">{String(label)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-blue-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1F5EA8]" />
          <p className="text-xs leading-5 text-slate-600">
            The current page demonstrates the confirmation UX only. Real global logout and account deletion should run through authenticated backend endpoints with re-authentication and audit logging.
          </p>
        </div>
      </div>
    </div>
  );
}

function DangerActionCard({
  icon: Icon,
  title,
  description,
  status,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
  tone: "blue" | "rose";
  onClick: () => void;
}) {
  const destructive = tone === "rose";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      className={`group relative overflow-hidden rounded-[20px] border p-4 text-left transition ${
        destructive
          ? "border-rose-300/20 bg-rose-400/[0.07] hover:bg-rose-400/[0.12]"
          : "border-cyan-300/15 bg-cyan-300/[0.055] hover:bg-cyan-300/[0.095]"
      }`}
    >
      <motion.span
        className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full ${destructive ? "bg-rose-400/10" : "bg-cyan-300/10"}`}
        animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: destructive ? 3.2 : 4, repeat: Infinity }}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${destructive ? "bg-rose-400/15 text-rose-200" : "bg-cyan-300/10 text-cyan-200"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ChevronRight className={`mt-1 h-4 w-4 transition group-hover:translate-x-0.5 ${destructive ? "text-rose-200/45" : "text-cyan-100/40"}`} />
      </div>

      <p className="relative z-10 mt-4 text-sm font-black text-white">{title}</p>
      <p className={`relative z-10 mt-1 text-[10px] leading-5 ${destructive ? "text-rose-100/55" : "text-blue-100/55"}`}>{description}</p>

      <div className={`relative z-10 mt-4 border-t pt-3 ${destructive ? "border-rose-300/10" : "border-cyan-300/10"}`}>
        <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${destructive ? "text-rose-200/70" : "text-cyan-100/65"}`}>{status}</span>
      </div>
    </motion.button>
  );
}

/* =========================================================
   DRAWER
========================================================= */

function SettingsDrawer({
  type,
  privacyScore,
  onClose,
  onExport,
}: {
  type:
    Exclude<
      DrawerType,
      null
    >;
  privacyScore:
    number;
  onClose:
    () => void;
  onExport:
    (
      format:
        "json" |
        "csv"
    ) => void;
}) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close drawer"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        onClick={
          onClose
        }
        className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-sm"
      />

      <motion.aside
        initial={{
          x:
            "100%",
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x:
            "100%",
        }}
        transition={{
          type:
            "spring",
          stiffness:
            240,
          damping:
            28,
        }}
        className="fixed bottom-0 right-0 top-0 z-[90] w-full max-w-[520px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Personal Drawer
            </p>

            <h2 className="mt-1 text-lg font-black">
              {type ===
              "sessions"
                ? "Active Sessions"
                : type ===
                    "privacy"
                  ? "Privacy Summary"
                  : "Export Account Data"}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {type ===
            "sessions" && (
            <div className="space-y-3">
              {SESSIONS.map(
                (
                  session
                ) => {
                  const Icon =
                    session.icon;

                  return (
                    <div
                      key={
                        session.id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black">
                              {
                                session.device
                              }
                            </p>

                            {session.current && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-600">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              session.location
                            }
                          </p>

                          <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <Clock3 className="h-3 w-3" />
                            {
                              session.lastActive
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
                Session data here is demo UI. Connect this drawer to your authenticated session backend for real device management.
              </div>
            </div>
          )}

          {type ===
            "privacy" && (
            <div className="space-y-5">
              <div className="rounded-[24px] bg-[#0F2745] p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-100/50">
                  Privacy Score
                </p>

                <p className="mt-2 text-4xl font-black">
                  {
                    privacyScore
                  }
                  %
                </p>

                <p className="mt-2 text-xs leading-6 text-blue-100/60">
                  A frontend estimate based on your current privacy preferences.
                </p>
              </div>

              <DetailList
                rows={[
                  [
                    "Analytics",
                    "Preference controlled",
                  ],
                  [
                    "Discoverability",
                    "Preference controlled",
                  ],
                  [
                    "Personalization",
                    "Preference controlled",
                  ],
                  [
                    "Transaction names",
                    "Preference controlled",
                  ],
                ]}
              />
            </div>
          )}

          {type ===
            "export" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() =>
                  onExport(
                    "json"
                  )
                }
                className="flex w-full items-center gap-4 rounded-[22px] border border-slate-200 p-4 text-left transition hover:border-blue-100 hover:bg-slate-50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
                  <FileJson className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-black">
                    JSON Export
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Download the current frontend settings state.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  onExport(
                    "csv"
                  )
                }
                className="flex w-full items-center gap-4 rounded-[22px] border border-slate-200 p-4 text-left transition hover:border-blue-100 hover:bg-slate-50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-black">
                    CSV Export
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Download a simple settings spreadsheet file.
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}

/* =========================================================
   DANGER MODAL
========================================================= */

function DangerModal({
  action,
  onCancel,
  onConfirm,
}: {
  action: DangerAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");

  if (!action) {
    return null;
  }

  const deleting = action === "delete-account";
  const canConfirm = !deleting || confirmText.trim().toUpperCase() === "DELETE";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
      >
        <button type="button" aria-label="Close confirmation" onClick={onCancel} className="absolute inset-0" />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.94, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-rose-200/70 bg-white shadow-[0_30px_90px_rgba(40,10,22,.35)]"
        >
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#1d1019,#301221_65%,#15243a)] p-6 text-white">
            <motion.div
              className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-rose-300/15"
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex items-start gap-4">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 rgba(244,63,94,0)",
                    "0 0 28px rgba(244,63,94,.2)",
                    "0 0 0 rgba(244,63,94,0)",
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-300/15"
              >
                {deleting ? <Trash2 className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
              </motion.div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-rose-200/50">Protected confirmation</p>
                <h2 className="mt-1 text-lg font-black">{deleting ? "Delete account?" : "Log out all devices?"}</h2>
                <p className="mt-2 text-xs leading-6 text-rose-100/55">
                  {deleting
                    ? "This demo does not delete account data. Production deletion must require fresh authentication and a protected backend workflow."
                    : "This demo does not revoke real sessions. Production logout-all should revoke server-side sessions or refresh tokens."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {deleting && (
              <div className="mb-5">
                <label className="mb-2 block text-xs font-black text-slate-700">
                  Type <span className="text-rose-600">DELETE</span> to confirm
                </label>
                <input
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-rose-200 bg-rose-50/50 px-4 text-sm font-black tracking-[0.08em] text-rose-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
                />
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={!canConfirm}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? "Confirm Demo Delete" : "Confirm Demo Logout"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================
   SAVE BAR + TOAST
========================================================= */

function SaveBar({
  saving,
  onSave,
  onDiscard,
}: {
  saving:
    boolean;
  onSave:
    () => void;
  onDiscard:
    () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: 30,
      }}
      className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-4 rounded-[22px] border border-white/10 bg-[#0F2745]/95 p-4 text-white shadow-[0_24px_70px_rgba(15,39,69,.35)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300"
          animate={{
            rotate: [
              0,
              -4,
              4,
              0,
            ],
          }}
          transition={{
            duration:
              1.8,
            repeat:
              Infinity,
            repeatDelay:
              2,
          }}
        >
          <AlertTriangle className="h-4 w-4" />
        </motion.div>

        <div>
          <p className="text-xs font-black">
            Unsaved personal settings
          </p>

          <p className="mt-0.5 text-[10px] text-blue-100/50">
            Review and save your current preferences.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={
            onDiscard
          }
          disabled={
            saving
          }
          className="rounded-xl px-4 py-2.5 text-xs font-black text-blue-100/70"
        >
          Discard
        </button>

        <button
          type="button"
          onClick={
            onSave
          }
          disabled={
            saving
          }
          className="inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
        >
          {saving && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          )}

          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

function Toast({
  toast,
  onClose,
}: {
  toast:
    ToastState;
  onClose:
    () => void;
}) {
  const tone =
    toast.type ===
    "success"
      ? "text-emerald-600 bg-emerald-50"
      : toast.type ===
          "error"
        ? "text-rose-600 bg-rose-50"
        : "text-[#1F5EA8] bg-blue-50";

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 30,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: 30,
      }}
      className="fixed right-5 top-5 z-[140] flex w-[calc(100%-2.5rem)] max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        {toast.type ===
        "error" ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-black">
          {toast.type ===
          "success"
            ? "Saved"
            : toast.type ===
                "error"
              ? "Error"
              : "Updated"}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {
            toast.message
          }
        </p>
      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        className="text-slate-300 hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
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
  eyebrow:
    string;
  title:
    string;
  description:
    string;
  icon:
    LucideIcon;
  danger?:
    boolean;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_32px_rgba(15,39,69,0.045)] sm:p-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            danger
              ? "bg-rose-50 text-rose-600"
              : "bg-blue-50 text-[#1F5EA8]"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.14em] ${
              danger
                ? "text-rose-500"
                : "text-[#1F5EA8]"
            }`}
          >
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] sm:text-[28px]">
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

function StatusPill({
  icon: Icon,
  text,
  tone,
}: {
  icon:
    LucideIcon;
  text:
    string;
  tone:
    | "green"
    | "blue";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black ${
        tone ===
        "green"
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          : "border-white/10 bg-white/10 text-blue-100"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {text}
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
  icon:
    LucideIcon;
  title:
    string;
  value:
    string;
  note:
    string;
  tone:
    | "green"
    | "blue"
    | "amber";
}) {
  const toneClass =
    tone ===
    "green"
      ? "bg-emerald-50 text-emerald-600"
      : tone ===
          "amber"
        ? "bg-amber-50 text-amber-600"
        : "bg-blue-50 text-[#1F5EA8]";

  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,39,69,0.045)]"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>

      <p
        className={`mt-2 whitespace-normal text-[22px] font-black leading-[1.15] ${
          tone ===
          "green"
            ? "text-emerald-600"
            : tone ===
                "amber"
              ? "text-amber-600"
              : "text-[#0F2745]"
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        {note}
      </p>
    </motion.div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label:
    string;
  description:
    string;
  enabled:
    boolean;
  onChange:
    (
      value: boolean
    ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div>
        <p className="text-sm font-black">
          {label}
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={
          enabled
        }
        onClick={() =>
          onChange(
            !enabled
          )
        }
        className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition ${
          enabled
            ? "bg-[#1F5EA8]"
            : "bg-slate-300"
        }`}
      >
        <motion.span
          className="block h-6 w-6 rounded-full bg-white shadow-sm"
          animate={{
            x:
              enabled
                ? 24
                : 0,
          }}
          transition={{
            type:
              "spring",
            stiffness:
              480,
            damping:
              30,
          }}
        />
      </button>
    </div>
  );
}

function RangeField({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label:
    string;
  description:
    string;
  value:
    number;
  min:
    number;
  max:
    number;
  step:
    number;
  onChange:
    (
      value: number
    ) => void;
}) {
  const percent =
    (
      (
        value -
        min
      ) /
      (
        max -
        min
      )
    ) *
    100;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black">
            {label}
          </p>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <motion.span
          key={
            value
          }
          initial={{
            scale:
              0.9,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          className="w-fit rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#1F5EA8]"
        >
          ৳
          {value.toLocaleString(
            "en-BD"
          )}
        </motion.span>
      </div>

      <div className="relative mt-5">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#1F5EA8,#22d3ee)]"
            animate={{
              width:
                `${percent}%`,
            }}
            transition={{
              type:
                "spring",
              stiffness:
                130,
              damping:
                20,
            }}
          />
        </div>

        <input
          type="range"
          min={
            min
          }
          max={
            max
          }
          step={
            step
          }
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              Number(
                event.target
                  .value
              )
            )
          }
          className="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent accent-[#1F5EA8]"
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
}: {
  label:
    string;
  value:
    string;
  onChange:
    (
      value: string
    ) => void;
  icon:
    LucideIcon;
  type?:
    string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black text-slate-700">
        {label}
      </span>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type={
            type
          }
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
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </div>
    </label>
  );
}

function PreferenceMiniCard({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1F5EA8] shadow-sm">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />
      </div>
      <p className="mt-3 truncate text-[9px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[11px] font-black text-[#0F2745]">{value}</p>
    </div>
  );
}

function DetailList({
  rows,
}: {
  rows:
    Array<
      [
        string,
        string
      ]
    >;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      {rows.map(
        (
          row,
          index
        ) => (
          <div
            key={
              row[0]
            }
            className={`flex items-center justify-between gap-4 px-4 py-3 ${
              index <
              rows.length -
                1
                ? "border-b border-slate-100"
                : ""
            }`}
          >
            <span className="text-xs text-slate-400">
              {row[0]}
            </span>

            <span className="text-right text-xs font-black">
              {row[1]}
            </span>
          </div>
        )
      )}
    </div>
  );
}
