"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  Bell,
  Download,
  History,
  Key,
  Lock,
  Palette,
  Server,
  Sliders,
  User,
  Users,
  Wallet,
} from "lucide-react";

import SettingsHeader from "./components/SettingsHeader";
import SettingsShell from "./components/SettingsShell";
import UserSettings from "./components/UserSettings";
import AdminSettings from "./components/AdminSettings";

import type {
  AdminSettingsState,
  Role,
  SettingsSection,
  ToastState,
  UserSettingsState,
} from "./components/SettingsTypes";

const USER_SECTIONS: SettingsSection[] = [
  {
    id: "profile",
    label: "Profile & Identity",
    icon: User,
    keywords: [
      "name",
      "email",
      "phone",
      "avatar",
      "profile",
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Key,
    keywords: [
      "password",
      "2fa",
      "mfa",
      "login",
      "sessions",
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    keywords: [
      "alerts",
      "email",
      "push",
      "sms",
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Lock,
    keywords: [
      "data",
      "sharing",
      "visibility",
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    keywords: [
      "theme",
      "dark",
      "light",
      "density",
    ],
  },
  {
    id: "wallet",
    label: "Wallet Preferences",
    icon: Wallet,
    keywords: [
      "currency",
      "balance",
      "limit",
      "display",
    ],
  },
  {
    id: "data",
    label: "Data & Export",
    icon: Download,
    keywords: [
      "csv",
      "json",
      "export",
      "download",
      "report",
    ],
  },
  {
    id: "danger",
    label: "Danger Zone",
    icon: AlertTriangle,
    keywords: [
      "delete",
      "logout",
      "remove",
      "account",
    ],
  },
];

const ADMIN_SECTIONS: SettingsSection[] = [
  {
    id: "platform",
    label: "Platform Overview",
    icon: Activity,
    keywords: [
      "health",
      "status",
      "metrics",
    ],
  },
  {
    id: "users",
    label: "Users & Roles",
    icon: Users,
    keywords: [
      "rbac",
      "permissions",
      "access",
      "role",
    ],
  },
  {
    id: "risk",
    label: "Risk Controls",
    icon: Sliders,
    keywords: [
      "limits",
      "thresholds",
      "velocity",
    ],
  },
  {
    id: "policies",
    label: "Security Policies",
    icon: Key,
    keywords: [
      "mfa",
      "password",
      "session",
      "authentication",
    ],
  },
  {
    id: "audit",
    label: "Audit Activity",
    icon: History,
    keywords: [
      "logs",
      "changes",
      "history",
    ],
  },
  {
    id: "system",
    label: "System Preferences",
    icon: Server,
    keywords: [
      "maintenance",
      "currency",
      "signup",
    ],
  },
];

const DEFAULT_USER_SETTINGS: UserSettingsState =
  {
    profile: {
      name: "Rakibul Hasan",
      email:
        "rakibulhasan.rhf@gmail.com",
      phone:
        "01677775600",
    },

    appearance: {
      theme: "system",
      density:
        "comfortable",
    },

    wallet: {
      defaultCurrency:
        "BDT",
      hideAmounts:
        false,
      confirmThreshold:
        5000,
    },

    notifications: {
      email:
        true,
      push:
        true,
      sms:
        false,
      marketing:
        false,
    },

    privacy: {
      analytics:
        true,
      discoverability:
        false,
      personalization:
        true,
    },
  };

const DEFAULT_ADMIN_SETTINGS: AdminSettingsState =
  {
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
    },

    security: {
      requireMfa:
        true,
      sessionTimeoutMins:
        30,
      maxLoginAttempts:
        5,
    },
  };

export default function SettingsPage() {
  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    role,
    setRole,
  ] = useState<Role>("admin");

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<string>(
      "profile"
    );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    userSettings,
    setUserSettings,
  ] =
    useState<UserSettingsState>(
      DEFAULT_USER_SETTINGS
    );

  const [
    draftUserSettings,
    setDraftUserSettings,
  ] =
    useState<UserSettingsState>(
      DEFAULT_USER_SETTINGS
    );

  const [
    adminSettings,
    setAdminSettings,
  ] =
    useState<AdminSettingsState>(
      DEFAULT_ADMIN_SETTINGS
    );

  const [
    draftAdminSettings,
    setDraftAdminSettings,
  ] =
    useState<AdminSettingsState>(
      DEFAULT_ADMIN_SETTINGS
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastState | null>(
      null
    );

  const isAdmin =
    role === "admin";

  const sections =
    isAdmin
      ? ADMIN_SECTIONS
      : USER_SECTIONS;

  /* =========================================================
     HYDRATION
  ========================================================== */

  useEffect(() => {
    setMounted(true);

    try {
      const savedRole =
        window.localStorage.getItem(
          "nova_demo_role"
        );

      if (
        savedRole ===
          "user" ||
        savedRole ===
          "admin"
      ) {
        setRole(
          savedRole
        );

        setActiveSection(
          savedRole ===
            "admin"
            ? "platform"
            : "profile"
        );
      }

      const savedUser =
        window.localStorage.getItem(
          "nova_user_settings"
        );

      if (savedUser) {
        const parsed =
          JSON.parse(
            savedUser
          ) as UserSettingsState;

        setUserSettings(
          parsed
        );

        setDraftUserSettings(
          parsed
        );
      }

      const savedAdmin =
        window.localStorage.getItem(
          "nova_admin_settings"
        );

      if (savedAdmin) {
        const parsed =
          JSON.parse(
            savedAdmin
          ) as AdminSettingsState;

        setAdminSettings(
          parsed
        );

        setDraftAdminSettings(
          parsed
        );
      }
    } catch (error) {
      console.error(
        "Settings initialization error:",
        error
      );
    }
  }, []);

  /* =========================================================
     TOAST
  ========================================================== */

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setToast(null);
        },
        2500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);

  /* =========================================================
     UNSAVED DETECTION
  ========================================================== */

  const hasUnsavedChanges =
    useMemo(() => {
      if (isAdmin) {
        return (
          JSON.stringify(
            adminSettings
          ) !==
          JSON.stringify(
            draftAdminSettings
          )
        );
      }

      return (
        JSON.stringify(
          userSettings
        ) !==
        JSON.stringify(
          draftUserSettings
        )
      );
    }, [
      isAdmin,
      adminSettings,
      draftAdminSettings,
      userSettings,
      draftUserSettings,
    ]);

  /* =========================================================
     ROLE SWITCH
  ========================================================== */

  const switchRole = () => {
    if (
      hasUnsavedChanges
    ) {
      const shouldSwitch =
        window.confirm(
          "You have unsaved changes. Switch role and discard them?"
        );

      if (!shouldSwitch) {
        return;
      }
    }

    const nextRole: Role =
      role ===
      "user"
        ? "admin"
        : "user";

    setRole(
      nextRole
    );

    setActiveSection(
      nextRole ===
        "admin"
        ? "platform"
        : "profile"
    );

    setSearchQuery(
      ""
    );

    window.localStorage.setItem(
      "nova_demo_role",
      nextRole
    );

    if (
      nextRole ===
      "admin"
    ) {
      setDraftAdminSettings(
        adminSettings
      );
    } else {
      setDraftUserSettings(
        userSettings
      );
    }

    setToast({
      type: "info",
      message: `Switched to ${nextRole} settings view.`,
    });
  };

  /* =========================================================
     SAVE
  ========================================================== */

  const saveChanges = () => {
    try {
      if (isAdmin) {
        setAdminSettings(
          draftAdminSettings
        );

        window.localStorage.setItem(
          "nova_admin_settings",
          JSON.stringify(
            draftAdminSettings
          )
        );
      } else {
        setUserSettings(
          draftUserSettings
        );

        window.localStorage.setItem(
          "nova_user_settings",
          JSON.stringify(
            draftUserSettings
          )
        );
      }

      setToast({
        type: "success",
        message:
          "Settings saved locally.",
      });
    } catch (error) {
      console.error(
        "Settings save error:",
        error
      );

      setToast({
        type: "error",
        message:
          "Could not save settings.",
      });
    }
  };

  /* =========================================================
     DISCARD
  ========================================================== */

  const discardChanges =
    () => {
      if (isAdmin) {
        setDraftAdminSettings(
          adminSettings
        );
      } else {
        setDraftUserSettings(
          userSettings
        );
      }

      setToast({
        type: "info",
        message:
          "Unsaved changes discarded.",
      });
    };

  /* =========================================================
     RENDER FALLBACK
  ========================================================== */

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]" />
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-32">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <SettingsHeader
          role={role}
          onSwitchRole={
            switchRole
          }
        />

        <div className="mt-6">
          <SettingsShell
            role={role}
            sections={
              sections
            }
            activeSection={
              activeSection
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
            rightRail={
              <RecentChanges
                role={role}
              />
            }
          >
            {isAdmin ? (
              <AdminSettings
                activeSection={
                  activeSection
                }
                draft={
                  draftAdminSettings
                }
                setDraft={
                  setDraftAdminSettings
                }
              />
            ) : (
              <UserSettings
                activeSection={
                  activeSection
                }
                draft={
                  draftUserSettings
                }
                setDraft={
                  setDraftUserSettings
                }
              />
            )}
          </SettingsShell>
        </div>
      </div>

      {hasUnsavedChanges && (
        <SaveBar
          onDiscard={
            discardChanges
          }
          onSave={
            saveChanges
          }
        />
      )}

      {toast && (
        <Toast
          toast={toast}
          onClose={() =>
            setToast(
              null
            )
          }
        />
      )}
    </main>
  );
}

/* =========================================================
   RECENT CHANGES
========================================================= */

function RecentChanges({
  role,
}: {
  role: Role;
}) {
  const changes =
    role ===
    "admin"
      ? [
          {
            title:
              "Risk threshold updated",
            time: "2h ago",
          },
          {
            title:
              "Security policy reviewed",
            time: "Yesterday",
          },
          {
            title:
              "System preference changed",
            time: "3d ago",
          },
        ]
      : [
          {
            title:
              "Password security reviewed",
            time: "3d ago",
          },
          {
            title:
              "Push alerts enabled",
            time: "1w ago",
          },
          {
            title:
              "Wallet preference updated",
            time: "2w ago",
          },
        ];

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Activity
          </p>

          <h3 className="mt-1 text-sm font-black text-[#0F2745]">
            Recent Changes
          </h3>
        </div>

        <History className="h-4 w-4 text-slate-300" />
      </div>

      <div className="mt-6 space-y-4">
        {changes.map(
          (change) => (
            <div
              key={
                change.title
              }
              className="relative flex gap-3"
            >
              <div className="relative flex flex-col items-center">
                <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-full bg-[#1F5EA8] ring-4 ring-blue-50" />

                <span className="absolute left-1/2 top-3 h-full w-px -translate-x-1/2 bg-slate-200" />
              </div>

              <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="break-words text-xs font-bold text-slate-800">
                  {change.title}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {change.time}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SAVE BAR
========================================================= */

function SaveBar({
  onSave,
  onDiscard,
}: {
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col gap-4 rounded-2xl border border-white/10 bg-[#0F2745] p-4 text-white shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-3xl">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold">
            Unsaved changes
          </p>

          <p className="mt-0.5 truncate text-[10px] text-slate-300">
            Your current settings have been modified.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={
            onDiscard
          }
          className="rounded-xl px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
        >
          Discard
        </button>

        <button
          type="button"
          onClick={
            onSave
          }
          className="rounded-xl bg-[#1F5EA8] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#17466F]"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

function Toast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-[120] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs font-bold ${
              toast.type ===
              "success"
                ? "text-emerald-700"
                : toast.type ===
                  "error"
                ? "text-red-700"
                : "text-blue-700"
            }`}
          >
            {toast.type ===
            "success"
              ? "Saved"
              : toast.type ===
                "error"
              ? "Error"
              : "Updated"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={
            onClose
          }
          className="text-slate-300 hover:text-slate-700"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}