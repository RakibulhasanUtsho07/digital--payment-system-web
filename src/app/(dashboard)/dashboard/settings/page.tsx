"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import Link from "next/link";

import {
  useTheme,
  type ThemeMode,
} from "@/context/ThemeContext";

import {
  settingsApi,
  type SettingsProfile,
  type SettingsWallet,
  type UserSession,
  type UserSettingsPreferences,
} from "@/lib/api/settingsApi";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Fingerprint,
  Gauge,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  Menu,
  MonitorSmartphone,
  Moon,
  Palette,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Trees,
  User,
  UserRound,
  WalletCards,
  Waves,
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

    role:
      | "user"
      | "admin";

    kycStatus:
      | "not_started"
      | "pending"
      | "verified"
      | "rejected";

    createdAt?: string;
  };

  appearance: {
    theme: ThemeMode;
    density: Density;
    reduceMotion: boolean;
  };

  wallet:
    UserSettingsPreferences["wallet"];

  notifications:
    UserSettingsPreferences["notifications"];

  privacy:
    UserSettingsPreferences["privacy"];
};

type SectionConfig = {
  id: SectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
};

type SessionView = {
  id: string;
  current: boolean;
  device: string;
  location: string;
  lastActive: string;
  ip?: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_SETTINGS:
  UserSettingsState = {
  profile: {
    name: "Coffer User",
    email: "user@example.com",
    phone: "+880 1XXXXXXXXX",
    role: "user",
    kycStatus:
      "not_started",
  },

  appearance: {
    theme: "light",
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
    requireConfirmation:
      true,
    confirmThreshold:
      10000,
  },

  notifications: {
    email: true,
    push: true,
    sms: true,
    marketing:
      false,
  },

  privacy: {
    analytics: false,
    discoverability:
      true,
    personalization:
      true,
    showTransactionNames:
      true,
  },
};

const THEME_OPTIONS:
  Array<{
    id: ThemeMode;
    label: string;
    description: string;
    icon: LucideIcon;
    previewClass: string;
  }> = [
  {
    id: "light",
    label: "Light",
    description:
      "Clean and bright",
    icon: Sun,
    previewClass:
      "bg-gradient-to-br from-white via-slate-50 to-blue-50",
  },

  {
    id: "dark",
    label: "Dark",
    description:
      "Deep and low-light friendly",
    icon: Moon,
    previewClass:
      "bg-gradient-to-br from-[#05070d] via-[#0b101a] to-[#24133f]",
  },

  {
    id: "eye-care",
    label: "Eye Care",
    description:
      "Soft and easy on eyes",
    icon: Sparkles,
    previewClass:
      "bg-gradient-to-br from-[#f7f1e4] via-[#f0eee3] to-[#e3ede5]",
  },

  {
    id: "ocean",
    label: "Ocean",
    description:
      "Cool and calm",
    icon: Waves,
    previewClass:
      "bg-gradient-to-br from-[#e9f9fb] via-[#dff3f7] to-[#e5efff]",
  },

  {
    id: "forest",
    label: "Forest",
    description:
      "Natural and balanced",
    icon: Trees,
    previewClass:
      "bg-gradient-to-br from-[#eef6f0] via-[#e7f0ea] to-[#dcebe2]",
  },
];

const SECTIONS:
  SectionConfig[] = [
  {
    id: "overview",
    label: "Overview",
    description:
      "Account health and quick controls",
    icon: Activity,
    keywords: [
      "overview",
      "health",
      "account",
      "summary",
    ],
  },

  {
    id: "profile",
    label: "Profile & Identity",
    description:
      "Personal information",
    icon: UserRound,
    keywords: [
      "profile",
      "name",
      "email",
      "phone",
      "identity",
    ],
  },

  {
    id: "security",
    label: "Security",
    description:
      "Sessions and account protection",
    icon: ShieldCheck,
    keywords: [
      "security",
      "password",
      "session",
      "2fa",
      "mfa",
      "login",
      "device",
    ],
  },

  {
    id: "notifications",
    label: "Notifications",
    description:
      "Delivery and alert preferences",
    icon: BellRing,
    keywords: [
      "notification",
      "email",
      "push",
      "sms",
      "marketing",
      "alerts",
    ],
  },

  {
    id: "privacy",
    label: "Privacy",
    description:
      "Visibility and personalization",
    icon: Lock,
    keywords: [
      "privacy",
      "analytics",
      "visibility",
      "personalization",
      "data",
    ],
  },

  {
    id: "appearance",
    label: "Appearance",
    description:
      "Theme, density and motion",
    icon: Palette,
    keywords: [
      "theme",
      "dark",
      "light",
      "eye care",
      "ocean",
      "forest",
      "density",
      "appearance",
    ],
  },

  {
    id: "wallet",
    label: "Wallet Performance",
    description:
      "Balance and confirmation rules",
    icon: WalletCards,
    keywords: [
      "wallet",
      "currency",
      "balance",
      "confirmation",
      "transfer",
      "performance",
    ],
  },

  {
    id: "data",
    label: "Data & Export",
    description:
      "Download your account data",
    icon: Database,
    keywords: [
      "data",
      "export",
      "download",
      "json",
      "csv",
    ],
  },

  {
    id: "danger",
    label: "Danger Zone",
    description:
      "Sensitive account actions",
    icon: AlertTriangle,
    keywords: [
      "danger",
      "logout",
      "delete",
      "account",
    ],
  },
];

/* =========================================================
   HELPERS
========================================================= */

function isThemeMode(
  value: unknown
): value is ThemeMode {
  return (
    value === "light" ||
    value === "dark" ||
    value === "eye-care" ||
    value === "ocean" ||
    value === "forest"
  );
}

function mergeSettings(
  base: UserSettingsState,
  incoming: Partial<UserSettingsState>
): UserSettingsState {
  return {
    ...base,
    ...incoming,

    profile: {
      ...base.profile,
      ...(incoming.profile ??
        {}),
    },

    appearance: {
      ...base.appearance,
      ...(incoming.appearance ??
        {}),
    },

    wallet: {
      ...base.wallet,
      ...(incoming.wallet ??
        {}),
    },

    notifications: {
      ...base.notifications,
      ...(incoming.notifications ??
        {}),
    },

    privacy: {
      ...base.privacy,
      ...(incoming.privacy ??
        {}),
    },
  };
}

function getInitials(
  name: string
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "U";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[
      parts.length - 1
    ][0]
  ).toUpperCase();
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatRelativeTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown";
  }

  const diff =
    Date.now() -
    date.getTime();

  if (diff < 0) {
    return "Recently";
  }

  const seconds =
    Math.floor(
      diff / 1000
    );

  if (
    seconds < 30
  ) {
    return "just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (
    minutes < 60
  ) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (
    hours < 24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (
    days < 30
  ) {
    return `${days}d ago`;
  }

  return formatDate(
    value
  );
}

function getSessionIcon(
  device: string
): LucideIcon {
  const value =
    device.toLowerCase();

  if (
    value.includes(
      "iphone"
    ) ||
    value.includes(
      "ipad"
    ) ||
    value.includes(
      "android"
    ) ||
    value.includes(
      "mobile"
    )
  ) {
    return Smartphone;
  }

  if (
    value.includes(
      "mac"
    ) ||
    value.includes(
      "windows"
    ) ||
    value.includes(
      "linux"
    ) ||
    value.includes(
      "desktop"
    ) ||
    value.includes(
      "laptop"
    ) ||
    value.includes(
      "pc"
    )
  ) {
    return Laptop;
  }

  return MonitorSmartphone;
}

function errorText(
  error: unknown
) {
  return error instanceof
    Error &&
    error.message
    ? error.message
    : "Something went wrong.";
}

/* =========================================================
   PAGE
========================================================= */

export default function UserSettingsPage() {
  const {
    theme,
    setTheme,
  } = useTheme();

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    draft,
    setDraft,
  ] =
    useState<UserSettingsState>(
      DEFAULT_SETTINGS
    );

  const [
    savedSettings,
    setSavedSettings,
  ] =
    useState<UserSettingsState>(
      DEFAULT_SETTINGS
    );

  const [
    wallet,
    setWallet,
  ] =
    useState<SettingsWallet | null>(
      null
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
  ] = useState("");

  const [
    drawerType,
    setDrawerType,
  ] =
    useState<DrawerType>(
      null
    );

  const [
    sessions,
    setSessions,
  ] =
    useState<SessionView[]>([]);

  const [
    sessionsLoading,
    setSessionsLoading,
  ] =
    useState(false);

  const [
    sessionsError,
    setSessionsError,
  ] = useState("");

  const [
    sessionActionLoading,
    setSessionActionLoading,
  ] =
    useState<string | null>(
      null
    );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    dangerAction,
    setDangerAction,
  ] =
    useState<DangerAction>(
      null
    );

  const [
    deletePassword,
    setDeletePassword,
  ] = useState("");

  const [
    toast,
    setToast,
  ] =
    useState<ToastState | null>(
      null
    );

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast =
    (
      message: string,
      type:
        ToastState["type"] =
        "success"
    ) => {
      setToast({
        message,
        type,
      });
    };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          setToast(null);
        },
        3200
      );

    return () =>
      window.clearTimeout(
        timeout
      );
  }, [toast]);

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  const loadSettings =
    async (
      silent = false
    ) => {
      if (silent) {
        setRefreshing(
          true
        );
      } else {
        setLoading(
          true
        );
      }

      try {
        const response =
          await settingsApi.get();

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to load settings."
          );
        }

        const nextSettings:
          UserSettingsState =
          mergeSettings(
            DEFAULT_SETTINGS,
            {
              profile:
                response.profile,

              appearance:
                response
                  .preferences
                  .appearance,

              wallet:
                response
                  .preferences
                  .wallet,

              notifications:
                response
                  .preferences
                  .notifications,

              privacy:
                response
                  .preferences
                  .privacy,
            }
          );

        const serverTheme =
          response
            .preferences
            .appearance
            .theme;

        if (
          isThemeMode(
            serverTheme
          )
        ) {
          nextSettings.appearance.theme =
            serverTheme;
        }

        setSavedSettings(
          nextSettings
        );

        setDraft(
          nextSettings
        );

        setWallet(
          response.wallet ??
            null
        );

        if (
          serverTheme !==
          theme &&
          isThemeMode(
            serverTheme
          )
        ) {
          await setTheme(
            serverTheme
          );
        }
      } catch (
        error
      ) {
        console.error(
          "SETTINGS LOAD ERROR:",
          error
        );

        showToast(
          errorText(
            error
          ),
          "error"
        );
      } finally {
        setMounted(
          true
        );

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     KEEP DRAFT THEME SYNCED
  ======================================================= */

  useEffect(() => {
    setDraft(
      (
        current
      ) => {
        if (
          current.appearance
            .theme ===
          theme
        ) {
          return current;
        }

        return {
          ...current,

          appearance: {
            ...current.appearance,

            theme,
          },
        };
      }
    );
  }, [theme]);

  /* =======================================================
     SESSIONS
  ======================================================= */

  const loadSessions =
    async () => {
      if (
        sessionsLoading
      ) {
        return;
      }

      setSessionsLoading(
        true
      );

      setSessionsError(
        ""
      );

      try {
        const response =
          await settingsApi.getSession();

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to load active sessions."
          );
        }

        const mapped =
          (
            response.sessions ??
            []
          ).map(
            (
              session: UserSession
            ) => ({
              id:
                session.id,

              current:
                session.current,

              device:
                session.device,

              location:
                session.location,

              lastActive:
                session.lastActive,

              ip:
                session.ip,
            })
          );

        setSessions(
          mapped
        );
      } catch (
        error
      ) {
        setSessionsError(
          errorText(
            error
          )
        );
      } finally {
        setSessionsLoading(
          false
        );
      }
    };

  const openSessions =
    async () => {
      setDrawerType(
        "sessions"
      );

      await loadSessions();
    };

  const logoutOtherDevices =
    async () => {
      if (
        sessionActionLoading
      ) {
        return;
      }

      setSessionActionLoading(
        "logout-all"
      );

      try {
        const response =
          await settingsApi.logoutAll();

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to log out other devices."
          );
        }

        setSessions(
          (
            current
          ) =>
            current.filter(
              (
                session
              ) =>
                session.current
            )
        );

        showToast(
          response.message ||
            "Other devices were logged out."
        );
      } catch (
        error
      ) {
        showToast(
          errorText(
            error
          ),
          "error"
        );
      } finally {
        setSessionActionLoading(
          null
        );
      }
    };

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const filteredSections =
    useMemo(
      () => {
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
              .includes(query) ||
            section.description
              .toLowerCase()
              .includes(query) ||
            section.keywords.some(
              (
                keyword
              ) =>
                keyword
                  .toLowerCase()
                  .includes(
                    query
                  )
            )
        );
      },
      [
        searchQuery,
      ]
    );

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

  const accountHealth =
    useMemo(
      () => {
        let score = 55;

        if (
          draft.notifications
            .email
        ) {
          score += 5;
        }

        if (
          draft.notifications
            .push
        ) {
          score += 5;
        }

        if (
          !draft.privacy
            .analytics
        ) {
          score += 7;
        }

        if (
          draft.wallet
            .requireConfirmation
        ) {
          score += 10;
        }

        if (
          draft.wallet
            .confirmThreshold <=
          15000
        ) {
          score += 6;
        }

        if (
          draft.privacy
            .showTransactionNames ===
          false
        ) {
          score += 4;
        }

        if (
          draft.profile
            .kycStatus ===
          "verified"
        ) {
          score += 5;
        }

        return Math.min(
          score,
          100
        );
      },
      [
        draft,
      ]
    );

  const privacyScore =
    useMemo(
      () => {
        let score = 56;

        if (
          !draft.privacy
            .analytics
        ) {
          score += 18;
        }

        if (
          !draft.privacy
            .discoverability
        ) {
          score += 10;
        }

        if (
          !draft.privacy
            .showTransactionNames
        ) {
          score += 10;
        }

        if (
          !draft.privacy
            .personalization
        ) {
          score += 6;
        }

        return Math.min(
          score,
          100
        );
      },
      [
        draft.privacy,
      ]
    );

  /* =======================================================
     THEME
  ======================================================= */

  const changeTheme =
    async (
      nextTheme: ThemeMode
    ) => {
      setDraft(
        (
          current
        ) => ({
          ...current,

          appearance: {
            ...current.appearance,

            theme:
              nextTheme,
          },
        })
      );

      await setTheme(
        nextTheme
      );
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const saveChanges =
    async () => {
      if (saving) {
        return;
      }

      setSaving(
        true
      );

      try {
        const profileChanged =
          JSON.stringify(
            savedSettings.profile
          ) !==
          JSON.stringify(
            draft.profile
          );

        let latestProfile:
          SettingsProfile =
          savedSettings.profile;

        if (
          profileChanged
        ) {
          const profileResponse =
            await settingsApi.updateProfile(
              {
                name:
                  draft.profile.name.trim(),

                email:
                  draft.profile.email.trim(),

                phone:
                  draft.profile.phone.trim(),
              }
            );

          if (
            !profileResponse?.success
          ) {
            throw new Error(
              profileResponse?.message ||
                "Unable to update profile."
            );
          }

          latestProfile =
            profileResponse.profile;
        }

        const preferencesPayload:
          UserSettingsPreferences =
          {
            appearance: {
              ...draft.appearance,

              theme,
            },

            notifications:
              draft
                .notifications,

            privacy:
              draft.privacy,

            wallet:
              draft.wallet,
          };

        const preferencesResponse =
          await settingsApi.updatePreferences(
            preferencesPayload
          );

        if (
          !preferencesResponse?.success
        ) {
          throw new Error(
            preferencesResponse?.message ||
              "Unable to update preferences."
          );
        }

        const normalized:
          UserSettingsState =
          {
            profile:
              latestProfile,

            appearance:
              preferencesResponse
                .preferences
                .appearance,

            notifications:
              preferencesResponse
                .preferences
                .notifications,

            privacy:
              preferencesResponse
                .preferences
                .privacy,

            wallet:
              preferencesResponse
                .preferences
                .wallet,
          };

        setSavedSettings(
          normalized
        );

        setDraft(
          normalized
        );

        showToast(
          profileChanged
            ? "Profile and settings saved successfully."
            : "Settings saved successfully."
        );
      } catch (
        error
      ) {
        console.error(
          "SETTINGS SAVE ERROR:",
          error
        );

        showToast(
          errorText(
            error
          ),
          "error"
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     DISCARD
  ======================================================= */

  const discardChanges =
    async () => {
      setDraft(
        savedSettings
      );

      if (
        savedSettings
          .appearance
          .theme !==
        theme
      ) {
        await setTheme(
          savedSettings
            .appearance
            .theme
        );
      }

      showToast(
        "Unsaved changes were discarded.",
        "info"
      );
    };

  /* =======================================================
     EXPORT
  ======================================================= */

  const exportData =
    async (
      format:
        | "json"
        | "csv"
    ) => {
      try {
        const response =
          await settingsApi.exportData();

        if (
          !response?.success ||
          !response.export
        ) {
          throw new Error(
            response?.message ||
              "Unable to prepare export."
          );
        }

        const payload =
          response.export;

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
                  "application/json;charset=utf-8",
              }
            );

          filename =
            "coffer-account-data.json";
        } else {
          const rows =
            [
              [
                "Section",
                "Key",
                "Value",
              ],

              ...Object.entries(
                payload.profile
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
                    value ??
                      ""
                  ),
                ]
              ),

              ...Object.entries(
                payload
                  .preferences
                  .appearance
              ).map(
                (
                  [
                    key,
                    value,
                  ]
                ) => [
                  "appearance",
                  key,
                  String(
                    value ??
                      ""
                  ),
                ]
              ),

              ...Object.entries(
                payload
                  .preferences
                  .wallet
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
                    value ??
                      ""
                  ),
                ]
              ),

              ...Object.entries(
                payload
                  .preferences
                  .notifications
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
                    value ??
                      ""
                  ),
                ]
              ),

              ...Object.entries(
                payload
                  .preferences
                  .privacy
              ).map(
                (
                  [
                    key,
                    value,
                  ]
                ) => [
                  "privacy",
                  key,
                  String(
                    value ??
                      ""
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
              [csv],
              {
                type:
                  "text/csv;charset=utf-8",
              }
            );

          filename =
            "coffer-account-data.csv";
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

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
          url
        );

        setDrawerType(
          null
        );

        showToast(
          `${format.toUpperCase()} export created successfully.`
        );
      } catch (
        error
      ) {
        showToast(
          errorText(
            error
          ),
          "error"
        );
      }
    };

  /* =======================================================
     DELETE ACCOUNT
  ======================================================= */

  const deleteAccount =
    async () => {
      if (
        !deletePassword.trim()
      ) {
        showToast(
          "Enter your password first.",
          "error"
        );

        return;
      }

      try {
        const response =
          await settingsApi.deleteAccount(
            {
              password:
                deletePassword,

              confirmation:
                "DELETE",
            }
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Account deletion failed."
          );
        }

        setDangerAction(
          null
        );

        setDeletePassword(
          ""
        );

        showToast(
          response.message ||
            "Account deletion request accepted."
        );
      } catch (
        error
      ) {
        showToast(
          errorText(
            error
          ),
          "error"
        );
      }
    };

  /* =======================================================
     PRE MOUNT
  ======================================================= */

  if (
    !mounted ||
    loading
  ) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <RefreshCw className="h-6 w-6 animate-spin text-[var(--dashboard-primary)]" />
          </div>

          <p className="mt-4 text-sm font-black text-card-foreground">
            Loading Settings
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Syncing your account preferences.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground transition-colors duration-300">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">

        {/* =================================================
            HERO
        ================================================== */}

        <SettingsHero
          name={
            draft.profile.name
          }
          role={
            draft.profile.role
          }
          kycStatus={
            draft.profile
              .kycStatus
          }
          accountHealth={
            accountHealth
          }
          onOpenSessions={
            openSessions
          }
        />

        <div className="mt-5 space-y-5">

          {/* =============================================
              REFRESH ERROR
          ============================================== */}

          {refreshing && (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--dashboard-primary)]" />
              Refreshing settings...
            </div>
          )}

          {/* =============================================
              SAVE BAR
          ============================================== */}

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

          {/* =============================================
              NAVIGATION
          ============================================== */}

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

          {/* =============================================
              CONTENT
          ============================================== */}

          <AnimatePresence
            mode="wait"
          >
            <motion.div
              key={
                activeSection
              }
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration:
                  0.25,
              }}
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
                  wallet={
                    wallet
                  }
                  onOpenSessions={
                    openSessions
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
                  onOpenSessions={
                    openSessions
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
                  onThemeChange={
                    changeTheme
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
                  wallet={
                    wallet
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
        </div>
      </div>

      {/* =================================================
          DRAWER
      ================================================== */}

      <AnimatePresence>
        {drawerType && (
          <SettingsDrawer
            type={
              drawerType
            }
            privacyScore={
              privacyScore
            }
            sessions={
              sessions
            }
            sessionsLoading={
              sessionsLoading
            }
            sessionsError={
              sessionsError
            }
            sessionActionLoading={
              sessionActionLoading
            }
            onClose={() =>
              setDrawerType(
                null
              )
            }
            onReloadSessions={
              loadSessions
            }
            onLogoutOthers={
              logoutOtherDevices
            }
            onExport={
              exportData
            }
          />
        )}
      </AnimatePresence>

      {/* =================================================
          DANGER MODAL
      ================================================== */}

      <AnimatePresence>
        {dangerAction && (
          <DangerModal
            action={
              dangerAction
            }
            password={
              deletePassword
            }
            onPasswordChange={
              setDeletePassword
            }
            onCancel={() => {
              setDangerAction(
                null
              );

              setDeletePassword(
                ""
              );
            }}
            onConfirm={() => {
              if (
                dangerAction ===
                "delete-account"
              ) {
                void deleteAccount();
              } else {
                void logoutOtherDevices().then(
                  () =>
                    setDangerAction(
                      null
                    )
                );
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* =================================================
          TOAST
      ================================================== */}

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

function SettingsHero({
  name,
  role,
  kycStatus,
  accountHealth,
  onOpenSessions,
}: {
  name: string;
  role:
    | "user"
    | "admin";

  kycStatus:
    | "not_started"
    | "pending"
    | "verified"
    | "rejected";

  accountHealth: number;

  onOpenSessions:
    () => void;
}) {
  const kycLabel =
    kycStatus ===
    "verified"
      ? "KYC Verified"
      : kycStatus ===
          "pending"
        ? "KYC Pending"
        : kycStatus ===
            "rejected"
          ? "KYC Needs Review"
          : "KYC Not Started";

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
      transition={{
        duration:
          0.45,
      }}
      className="relative overflow-hidden rounded-[34px] border border-violet-300/10 bg-[linear-gradient(135deg,#090612_0%,#160d2b_40%,#291746_68%,#4a267a_100%)] px-5 py-7 text-white shadow-[0_30px_90px_rgba(42,24,82,.24)] sm:px-7 sm:py-8 lg:px-10 lg:py-9"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-28 -top-28 h-[440px] w-[440px] rounded-full bg-violet-500/15 blur-[110px]" />

        <div className="absolute -bottom-36 left-1/4 h-[340px] w-[340px] rounded-full bg-indigo-500/10 blur-[100px]" />

        <motion.div
          animate={{
            rotate: [
              0,
              360,
            ],
          }}
          transition={{
            duration:
              30,
            repeat:
              Infinity,
            ease:
              "linear",
          }}
          className="absolute -right-10 top-5 h-[300px] w-[300px] rounded-full border border-white/10"
        />

        <motion.div
          animate={{
            rotate: [
              360,
              0,
            ],
          }}
          transition={{
            duration:
              22,
            repeat:
              Infinity,
            ease:
              "linear",
          }}
          className="absolute right-24 top-14 h-[180px] w-[180px] rounded-full border border-violet-300/10"
        />
      </div>

      <div className="relative z-10 grid items-center gap-8 xl:grid-cols-[1fr_390px]">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-200">
              <Settings className="h-5 w-5" />
            </div>

            <span className="rounded-full border border-violet-200/10 bg-violet-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-100">
              Personal Control Center
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-[46px]">
            Settings & Preferences
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100/70 sm:text-base">
            Manage your identity, security, wallet behaviour,
            notifications, privacy and dashboard experience
            from one intelligent control center.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Health {accountHealth}%
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black text-violet-100">
              <UserRound className="h-3.5 w-3.5" />
              {role ===
              "admin"
                ? "Administrator"
                : "Personal Account"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black text-white/80">
              <Fingerprint className="h-3.5 w-3.5" />
              {kycLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={
            onOpenSessions
          }
          className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.07] p-5 text-left backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.1]"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-violet-300/15 bg-violet-300/10 text-lg font-black text-violet-100">
              {getInitials(
                name ||
                  "User"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-100/45">
                Welcome Back
              </p>

              <p className="mt-1 truncate text-lg font-black">
                {name ||
                  "User"}
              </p>

              <p className="mt-1 text-xs text-violet-100/50">
                Manage active devices
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-violet-100/45 transition group-hover:translate-x-1 group-hover:text-white" />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-100/45">
              Security
            </span>

            <span className="inline-flex items-center gap-2 text-xs font-black text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
              Protected
            </span>
          </div>
        </button>
      </div>
    </motion.section>
  );
}

/* =========================================================
   SETTINGS NAVIGATION
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
  onSearchChange: (
    value: string
  ) => void;
  onSectionChange: (
    id: SectionId
  ) => void;
}) {
  const [
    commandOpen,
    setCommandOpen,
  ] =
    useState(false);

  useEffect(() => {
    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {
        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key.toLowerCase() ===
            "k"
        ) {
          event.preventDefault();

          setCommandOpen(
            true
          );
        }

        if (
          event.key ===
          "Escape"
        ) {
          setCommandOpen(
            false
          );
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, []);

  return (
    <>
      <nav className="sticky top-3 z-30 overflow-hidden rounded-[26px] border border-border bg-card/95 p-3 shadow-[0_18px_55px_rgba(15,23,42,.07)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex shrink-0 items-center gap-3 xl:w-[245px]">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background:
                  "var(--dashboard-primary-soft)",
                color:
                  "var(--dashboard-primary)",
              }}
            >
              <Settings className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p
                className="text-[9px] font-black uppercase tracking-[0.16em]"
                style={{
                  color:
                    "var(--dashboard-primary)",
                }}
              >
                Coffer Settings
              </p>

              <p className="truncate text-xs font-black text-card-foreground">
                Personal Control Center
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setCommandOpen(
                true
              )
            }
            className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-muted/40 px-3 text-left transition hover:bg-muted"
          >
            <Search
              className="h-4 w-4 shrink-0"
              style={{
                color:
                  "var(--dashboard-primary)",
              }}
            />

            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
              Search settings, privacy, security...
            </span>

            <span className="hidden rounded-lg border border-border bg-card px-2 py-1 text-[9px] font-black text-muted-foreground sm:block">
              Ctrl / ⌘ K
            </span>
          </button>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          {sections.length ===
          0 ? (
            <div className="rounded-xl bg-muted px-4 py-5 text-center text-xs font-semibold text-muted-foreground">
              No matching settings.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9">
              {sections.map(
                (
                  section
                ) => {
                  const Icon =
                    section.icon;

                  const active =
                    section.id ===
                    activeSection;

                  return (
                    <button
                      key={
                        section.id
                      }
                      type="button"
                      onClick={() =>
                        onSectionChange(
                          section.id
                        )
                      }
                      className="group relative min-w-0 overflow-hidden rounded-[14px] px-2 py-2.5 text-center transition hover:bg-muted/40"
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-nav-active"
                          className="absolute inset-0 rounded-[14px]"
                          style={{
                            background:
                              "var(--dashboard-primary-soft)",
                            border:
                              "1px solid var(--border)",
                          }}
                        />
                      )}

                      <span
                        className="relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-[10px]"
                        style={{
                          background:
                            active
                              ? "var(--dashboard-primary)"
                              : "var(--muted)",

                          color:
                            active
                              ? "var(--primary-foreground)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>

                      <span
                        className={`relative z-10 mt-1.5 block truncate text-[9px] font-black ${
                          active
                            ? "text-card-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {
                          section.label
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {commandOpen && (
          <CommandPalette
            query={
              searchQuery
            }
            sections={
              SECTIONS
            }
            activeSection={
              activeSection
            }
            onQueryChange={
              onSearchChange
            }
            onSelect={(
              section
            ) => {
              onSectionChange(
                section
              );

              setCommandOpen(
                false
              );
            }}
            onClose={() =>
              setCommandOpen(
                false
              )
            }
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* =========================================================
   COMMAND PALETTE
========================================================= */

function CommandPalette({
  query,
  sections,
  activeSection,
  onQueryChange,
  onSelect,
  onClose,
}: {
  query: string;
  sections: SectionConfig[];
  activeSection: SectionId;
  onQueryChange: (
    value: string
  ) => void;
  onSelect: (
    id: SectionId
  ) => void;
  onClose: () => void;
}) {
  const normalized =
    query
      .trim()
      .toLowerCase();

  const filtered =
    sections.filter(
      (
        section
      ) =>
        !normalized ||
        section.label
          .toLowerCase()
          .includes(
            normalized
          ) ||
        section.description
          .toLowerCase()
          .includes(
            normalized
          ) ||
        section.keywords.some(
          (
            keyword
          ) =>
            keyword
              .toLowerCase()
              .includes(
                normalized
              )
        )
    );

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      onMouseDown={
        onClose
      }
      className="fixed inset-0 z-[200] flex items-start justify-center bg-slate-950/55 px-4 pt-[9vh] backdrop-blur-md"
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
          scale:
            0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 12,
          scale:
            0.98,
        }}
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
        className="w-full max-w-2xl overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl"
      >
        <div className="h-1 bg-[linear-gradient(90deg,#31205f,#6d46b5,#a78bfa)]" />

        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search
            className="h-5 w-5"
            style={{
              color:
                "var(--dashboard-primary)",
            }}
          />

          <input
            autoFocus
            value={
              query
            }
            onChange={(
              event
            ) =>
              onQueryChange(
                event.target
                  .value
              )
            }
            placeholder="Search settings..."
            className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          />

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filtered.length ===
          0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center">
              <Search className="h-7 w-7 text-muted-foreground/40" />

              <p className="mt-3 text-sm font-black text-card-foreground">
                No settings found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try another keyword.
              </p>
            </div>
          ) : (
            filtered.map(
              (
                section
              ) => {
                const Icon =
                  section.icon;

                const active =
                  section.id ===
                  activeSection;

                return (
                  <button
                    key={
                      section.id
                    }
                    type="button"
                    onClick={() =>
                      onSelect(
                        section.id
                      )
                    }
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-muted"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background:
                          active
                            ? "var(--dashboard-primary-soft)"
                            : "var(--muted)",

                        color:
                          active
                            ? "var(--dashboard-primary)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-card-foreground">
                        {
                          section.label
                        }
                      </span>

                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {
                          section.description
                        }
                      </span>
                    </span>

                    {active && (
                      <span
                        className="rounded-full px-2 py-1 text-[8px] font-black uppercase"
                        style={{
                          background:
                            "var(--dashboard-primary-soft)",
                          color:
                            "var(--dashboard-primary)",
                        }}
                      >
                        Current
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-0.5" />
                  </button>
                );
              }
            )
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewSection({
  draft,
  accountHealth,
  privacyScore,
  wallet,
  onOpenSessions,
  onOpenPrivacy,
}: {
  draft: UserSettingsState;
  accountHealth: number;
  privacyScore: number;
  wallet: SettingsWallet | null;
  onOpenSessions: () => void;
  onOpenPrivacy: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Control Center"
        title="Account Overview"
        description="A quick snapshot of your account health, privacy posture, wallet controls and notification coverage."
        icon={Activity}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={
            ShieldCheck
          }
          title="Account Health"
          value={`${accountHealth}%`}
          note="Protection baseline"
          tone="green"
        />

        <MetricCard
          icon={Lock}
          title="Privacy Score"
          value={`${privacyScore}%`}
          note="Visibility and privacy controls"
          tone="blue"
        />

        <MetricCard
          icon={
            WalletCards
          }
          title="Wallet Balance"
          value={
            wallet
              ? `৳${Number(
                  wallet.balance
                ).toLocaleString(
                  "en-BD"
                )}`
              : "—"
          }
          note={
            wallet?.status ||
            "Wallet snapshot"
          }
          tone="amber"
        />

        <MetricCard
          icon={
            BellRing
          }
          title="Push Alerts"
          value={
            draft
              .notifications
              .push
              ? "Active"
              : "Limited"
          }
          note="Notification coverage"
          tone={
            draft
              .notifications
              .push
              ? "green"
              : "amber"
          }
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
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

/* =========================================================
   ACCOUNT HEALTH
========================================================= */

function AccountHealthCard({
  score,
  draft,
}: {
  score: number;
  draft: UserSettingsState;
}) {
  const circumference =
    2 *
    Math.PI *
    44;

  const checks =
    [
      {
        label:
          "Wallet confirmation",

        value:
          draft.wallet
            .requireConfirmation
            ? 95
            : 58,

        icon:
          WalletCards,
      },

      {
        label:
          "Privacy controls",

        value:
          draft.privacy
            .analytics
            ? 70
            : 94,

        icon:
          Lock,
      },

      {
        label:
          "Alert coverage",

        value:
          draft
            .notifications
            .push
            ? 92
            : 68,

        icon:
          BellRing,
      },
    ];

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-violet-300/10 bg-[linear-gradient(145deg,#0b0716,#18112f_54%,#40206a)] p-5 text-white shadow-[0_22px_65px_rgba(42,24,82,.22)] sm:p-6">
      <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />

      <div className="relative z-10">
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-5 sm:grid-cols-[128px_minmax(0,1fr)]">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32">
            <svg
              viewBox="0 0 108 108"
              className="h-full w-full -rotate-90"
            >
              <circle
                cx="54"
                cy="54"
                r="44"
                fill="none"
                stroke="rgba(255,255,255,.09)"
                strokeWidth="8"
              />

              <motion.circle
                cx="54"
                cy="54"
                r="44"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={
                  circumference
                }
                initial={{
                  strokeDashoffset:
                    circumference,
                }}
                animate={{
                  strokeDashoffset:
                    circumference *
                    (1 -
                      score /
                        100),
                }}
                transition={{
                  duration:
                    1.2,
                  ease:
                    "easeOut",
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black sm:text-3xl">
                {score}
              </span>

              <span className="text-[8px] font-black uppercase tracking-[0.14em] text-violet-100/45">
                Health
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-100/45">
              Account Health
            </p>

            <h3 className="mt-2 text-lg font-black leading-tight sm:text-xl">
              Your preferences are working together
            </h3>

            <p className="mt-2 text-[11px] leading-5 text-violet-100/60">
              The score reacts to privacy,
              confirmation and notification
              choices.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {checks.map(
            (
              item
            ) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={
                    item.label
                  }
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-violet-200">
                      <Icon className="h-3.5 w-3.5" />
                    </span>

                    <span className="text-[10px] font-black">
                      {
                        item.value
                      }%
                    </span>
                  </div>

                  <p className="mt-3 truncate text-[9px] font-semibold text-violet-100/55">
                    {
                      item.label
                    }
                  </p>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width:
                          `${item.value}%`,
                      }}
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8b5cf6,#c4b5fd)]"
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

function QuickActionsCard({
  onSessions,
  onPrivacy,
}: {
  onSessions: () => void;
  onPrivacy: () => void;
}) {
  return (
    <div className="self-start rounded-[30px] border border-border bg-card p-5 shadow-sm sm:p-6">
      <p
        className="text-[10px] font-black uppercase tracking-[0.14em]"
        style={{
          color:
            "var(--dashboard-primary)",
        }}
      >
        Quick Actions
      </p>

      <h3 className="mt-1 text-lg font-black text-card-foreground">
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
          description="Password, 2FA and authentication"
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
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  href?: string;
}) {
  const content =
    (
      <>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background:
              "var(--dashboard-primary-soft)",
            color:
              "var(--dashboard-primary)",
          }}
        >
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black text-card-foreground">
            {
              title
            }
          </span>

          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            {
              description
            }
          </span>
        </span>

        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </>
    );

  const className =
    "flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-left transition hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm";

  if (href) {
    return (
      <Link
        href={href}
        className={
          className
        }
      >
        {
          content
        }
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
      {
        content
      }
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
  draft: UserSettingsState;
  setDraft: Dispatch<
    SetStateAction<UserSettingsState>
  >;
}) {
  const update =
    <
      K extends keyof UserSettingsState["profile"]
    >(
      key: K,
      value: UserSettingsState["profile"][K]
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
        description="Update the information associated with your Coffer account. Changes are submitted through the backend save action."
        icon={
          UserRound
        }
        indigo
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 rounded-[24px] border border-border bg-muted/40 p-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#31205f,#6d46b5)] text-2xl font-black text-white shadow-[0_12px_30px_rgba(59,35,104,.25)]">
              {getInitials(
                draft.profile.name
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black text-card-foreground">
                {
                  draft.profile
                    .name
                }
              </p>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {
                  draft.profile
                    .email
                }
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  text={
                    draft.profile
                      .role
                  }
                />

                <StatusBadge
                  text={
                    draft.profile
                      .kycStatus
                      .replaceAll(
                        "_",
                        " "
                      )
                  }
                />
              </div>
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
                update(
                  "name",
                  value
                )
              }
            />

            <TextField
              label="Email Address"
              type="email"
              value={
                draft.profile
                  .email
              }
              icon={
                Mail
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

            <TextField
              label="Phone Number"
              type="tel"
              value={
                draft.profile
                  .phone
              }
              icon={
                Phone
              }
              onChange={(
                value
              ) =>
                update(
                  "phone",
                  value
                )
              }
            />
          </div>

          <div
            className="mt-6 rounded-2xl border p-4"
            style={{
              background:
                "var(--dashboard-primary-soft)",

              borderColor:
                "var(--border)",
            }}
          >
            <p className="text-xs leading-5 text-foreground">
              Profile updates are saved to
              <strong>
                {" "}
                /settings/profile
              </strong>
              . Email or phone changes may
              require backend verification.
            </p>
          </div>
        </div>

        <div className="self-start rounded-[28px] border border-border bg-card p-6 shadow-sm">
          <p
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{
              color:
                "var(--dashboard-primary)",
            }}
          >
            Account Identity
          </p>

          <h3 className="mt-1 text-lg font-black text-card-foreground">
            Current profile
          </h3>

          <div className="mt-5">
            <DetailList
              rows={[
                [
                  "Email",
                  draft.profile
                    .email,
                ],

                [
                  "Phone",
                  draft.profile
                    .phone,
                ],

                [
                  "Role",
                  draft.profile
                    .role,
                ],

                [
                  "KYC",
                  draft.profile
                    .kycStatus
                    .replaceAll(
                      "_",
                      " "
                    ),
                ],

                [
                  "Created",
                  formatDate(
                    draft.profile
                      .createdAt
                  ),
                ],
              ]}
            />
          </div>
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
  accountHealth: number;
  onOpenSessions: () => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Protection"
        title="Security Center"
        description="Manage active sessions here while password and two-factor authentication remain available in the dedicated Security Center."
        icon={
          ShieldCheck
        }
        indigo
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <div className="space-y-4">
          <SecurityInfoCard
            icon={
              Fingerprint
            }
            title="Security Score"
            value={`${accountHealth} / 100`}
            description="Your current protection baseline."
            tone="green"
          />

          <SecurityInfoCard
            icon={
              KeyRound
            }
            title="Password & 2FA"
            value="Security Center"
            description="Open the dedicated security route for authentication controls."
            tone="blue"
            href="/dashboard/security"
          />

          <button
            type="button"
            onClick={
              onOpenSessions
            }
            className="flex w-full items-center justify-between rounded-[24px] border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background:
                    "var(--dashboard-primary-soft)",

                  color:
                    "var(--dashboard-primary)",
                }}
              >
                <MonitorSmartphone className="h-5 w-5" />
              </span>

              <span>
                <span className="block text-sm font-black text-card-foreground">
                  Active Sessions
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Review signed-in devices.
                </span>
              </span>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </button>
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
  href,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  tone:
    | "green"
    | "blue";
  href?: string;
}) {
  const inner =
    (
      <>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background:
              tone ===
              "green"
                ? "color-mix(in srgb, var(--dashboard-success) 12%, transparent)"
                : "var(--dashboard-primary-soft)",

            color:
              tone ===
              "green"
                ? "var(--dashboard-success)"
                : "var(--dashboard-primary)",
          }}
        >
          <Icon className="h-5 w-5" />
        </span>

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {
            title
          }
        </p>

        <p className="mt-1 text-2xl font-black text-card-foreground">
          {
            value
          }
        </p>

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {
            description
          }
        </p>
      </>
    );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[24px] border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        {
          inner
        }
      </Link>
    );
  }

  return (
    <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
      {
        inner
      }
    </div>
  );
}

function SecurityPulse({
  score,
}: {
  score: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-violet-300/10 bg-[linear-gradient(145deg,#0b0716,#1a1232_60%,#44216d)] p-5 text-white shadow-[0_20px_55px_rgba(42,24,82,.2)]">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />

      <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/50">
        Security Pulse
      </p>

      <div className="relative z-10 mt-7 flex justify-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          {[1, 2, 3].map(
            (
              ring
            ) => (
              <motion.div
                key={
                  ring
                }
                className="absolute rounded-full border border-violet-300/15"
                style={{
                  width:
                    68 +
                    ring *
                      32,

                  height:
                    68 +
                    ring *
                      32,
                }}
                animate={{
                  rotate:
                    ring % 2
                      ? 360
                      : -360,

                  opacity: [
                    0.2,
                    0.55,
                    0.2,
                  ],
                }}
                transition={{
                  duration:
                    10 +
                    ring *
                      4,

                  repeat:
                    Infinity,

                  ease:
                    "linear",
                }}
              />
            )
          )}

          <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-[30px] border border-emerald-300/20 bg-emerald-300/10">
            <Fingerprint className="h-9 w-9 text-emerald-300" />

            <span className="mt-1 text-sm font-black">
              {
                score
              }
            </span>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-center text-xs leading-6 text-violet-100/60">
        Authentication and account protection
        overview.
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
  draft: UserSettingsState;
  setDraft: Dispatch<
    SetStateAction<UserSettingsState>
  >;
}) {
  const update =
    (
      key:
        keyof UserSettingsState["notifications"],
      value: boolean
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
        description="Choose which channels can deliver account, security and product notifications."
        icon={
          BellRing
        }
        indigo
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]">

        <div className="relative overflow-hidden rounded-[28px] border border-violet-300/10 bg-[linear-gradient(145deg,#0b0716,#19102f_55%,#45216f)] p-5 text-white shadow-[0_20px_55px_rgba(42,24,82,.18)] sm:p-6">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-400/15 blur-3xl" />

          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/50">
              Notification Channels
            </p>

            <h3 className="mt-2 text-xl font-black">
              Control every delivery path
            </h3>

            <p className="mt-1 text-xs leading-5 text-violet-100/55">
              Changes are held in the draft state and
              synchronized when you press Save Changes.
            </p>

            <div className="mt-6 space-y-3">
              <DarkToggleRow
                label="Email Notifications"
                description="Account summaries and important alerts."
                enabled={
                  draft
                    .notifications
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

              <DarkToggleRow
                label="Push Notifications"
                description="Immediate alerts on supported devices."
                enabled={
                  draft
                    .notifications
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

              <DarkToggleRow
                label="SMS Alerts"
                description="Text messages for important security events."
                enabled={
                  draft
                    .notifications
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

              <DarkToggleRow
                label="Tips & Offers"
                description="Optional product updates and financial tips."
                enabled={
                  draft
                    .notifications
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
  draft: UserSettingsState;
}) {
  const channels =
    [
      {
        label:
          "Email",
        active:
          draft
            .notifications
            .email,
        icon:
          Mail,
      },

      {
        label:
          "Push",
        active:
          draft
            .notifications
            .push,
        icon:
          BellRing,
      },

      {
        label:
          "SMS",
        active:
          draft
            .notifications
            .sms,
        icon:
          Phone,
      },
    ];

  const positions =
    [
      "left-[8%] top-[18%]",
      "right-[8%] top-[18%]",
      "left-1/2 bottom-[5%] -translate-x-1/2",
    ];

  return (
    <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <p
        className="text-[10px] font-black uppercase tracking-[0.14em]"
        style={{
          color:
            "var(--dashboard-primary)",
        }}
      >
        Alert Flow
      </p>

      <h3 className="mt-2 text-lg font-black text-card-foreground">
        Channel coverage
      </h3>

      <div className="relative mt-6 flex h-[195px] items-center justify-center overflow-hidden rounded-2xl bg-muted/40">
        <motion.div
          animate={{
            scale: [
              0.96,
              1.06,
              0.96,
            ],
          }}
          transition={{
            duration:
              3.2,
            repeat:
              Infinity,
          }}
          className="absolute flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background:
              "var(--dashboard-primary-soft)",
            color:
              "var(--dashboard-primary)",
          }}
        >
          <BellRing className="h-9 w-9" />
        </motion.div>

        {channels.map(
          (
            channel,
            index
          ) => {
            const Icon =
              channel.icon;

            return (
              <motion.div
                key={
                  channel.label
                }
                className={`absolute ${positions[index]} flex h-16 w-16 items-center justify-center rounded-2xl border ${
                  channel.active
                    ? "border-emerald-300/30 bg-emerald-50 text-emerald-600"
                    : "border-border bg-card text-muted-foreground/40"
                }`}
                animate={
                  channel.active
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
  draft: UserSettingsState;
  privacyScore: number;
  setDraft: Dispatch<
    SetStateAction<UserSettingsState>
  >;
  onOpenDetails: () => void;
}) {
  const update =
    (
      key:
        keyof UserSettingsState["privacy"],
      value: boolean
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
        description="Control profile visibility, analytics, personalization and transaction-name display."
        icon={
          Lock
        }
        indigo
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]">
        <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <ToggleRow
            label="Analytics Participation"
            description="Allow anonymous product analytics."
            enabled={
              draft
                .privacy
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

          <Divider />

          <ToggleRow
            label="Profile Discoverability"
            description="Allow supported transfer flows to find your account."
            enabled={
              draft
                .privacy
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

          <Divider />

          <ToggleRow
            label="Personalization"
            description="Tailor suggestions and dashboard preferences."
            enabled={
              draft
                .privacy
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

          <Divider />

          <ToggleRow
            label="Show transaction counterparty names"
            description="Display saved names in supported transaction views."
            enabled={
              draft
                .privacy
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

          <button
            type="button"
            onClick={
              onOpenDetails
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black"
            style={{
              background:
                "var(--dashboard-primary-soft)",

              borderColor:
                "var(--border)",

              color:
                "var(--dashboard-primary)",
            }}
          >
            Privacy Summary
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
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
  score: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-violet-300/10 bg-[linear-gradient(145deg,#0b0716,#18112f_55%,#45216f)] p-5 text-white shadow-[0_20px_55px_rgba(42,24,82,.18)]">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />

      <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/50">
        Privacy Shield
      </p>

      <div className="relative z-10 mt-8 flex justify-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <motion.div
            className="absolute h-44 w-44 rounded-[40%] border border-violet-300/15"
            animate={{
              rotate: 360,
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
            className="absolute h-36 w-36 rounded-[38%] border border-indigo-300/15"
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

          <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-[30px] border border-emerald-300/20 bg-emerald-300/10">
            <Lock className="h-8 w-8 text-emerald-300" />

            <span className="mt-1 text-sm font-black">
              {
                score
              }%
            </span>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-center text-xs leading-6 text-violet-100/60">
        Your score reacts to analytics, discoverability,
        personalization and visibility settings.
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
  onThemeChange,
}: {
  draft: UserSettingsState;
  setDraft: Dispatch<
    SetStateAction<UserSettingsState>
  >;
  onThemeChange: (
    theme: ThemeMode
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Experience"
        title="Appearance"
        description="Switch visual themes instantly and control dashboard density and motion."
        icon={
          Palette
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,.85fr)]">
        <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Color Theme
              </p>

              <h3 className="mt-1 text-lg font-black text-card-foreground">
                Choose your environment
              </h3>

              <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                Theme changes are applied immediately
                through ThemeContext and persisted to the
                backend.
              </p>
            </div>

            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background:
                  "var(--dashboard-primary-soft)",

                color:
                  "var(--dashboard-primary)",
              }}
            >
              <Palette className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {THEME_OPTIONS.map(
              (
                themeOption
              ) => {
                const Icon =
                  themeOption.icon;

                const active =
                  draft
                    .appearance
                    .theme ===
                  themeOption.id;

                return (
                  <motion.button
                    key={
                      themeOption.id
                    }
                    type="button"
                    onClick={() =>
                      onThemeChange(
                        themeOption.id
                      )
                    }
                    whileHover={{
                      y: -3,
                    }}
                    whileTap={{
                      scale:
                        0.985,
                    }}
                    className="group relative overflow-hidden rounded-[20px] border p-3 text-left transition"
                    style={{
                      background:
                        active
                          ? "var(--dashboard-primary-soft)"
                          : "var(--card)",

                      borderColor:
                        active
                          ? "var(--dashboard-primary)"
                          : "var(--border)",
                    }}
                  >
                    <div
                      className={`relative h-24 overflow-hidden rounded-[14px] ${themeOption.previewClass}`}
                    >
                      <div className="absolute inset-x-3 top-3 flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md bg-white/70 shadow-sm" />

                        <div className="h-2.5 w-16 rounded-full bg-white/70" />

                        <div className="ml-auto h-5 w-8 rounded-full bg-white/60" />
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white/65 p-2">
                          <div className="h-1.5 w-8 rounded-full bg-black/10" />
                          <div className="mt-1.5 h-2.5 w-12 rounded-full bg-black/15" />
                          <div className="mt-1.5 h-1.5 w-8 rounded-full bg-black/10" />
                        </div>

                        <div className="rounded-lg bg-white/55 p-2">
                          <div className="h-1.5 w-7 rounded-full bg-black/10" />
                          <div className="mt-1.5 h-2.5 w-10 rounded-full bg-black/15" />
                          <div className="mt-1.5 h-1.5 w-7 rounded-full bg-black/10" />
                        </div>
                      </div>

                      {active && (
                        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
                          <CheckCircle2
                            className="h-4 w-4"
                            style={{
                              color:
                                "var(--dashboard-primary)",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background:
                            active
                              ? "var(--dashboard-primary)"
                              : "var(--muted)",

                          color:
                            active
                              ? "var(--primary-foreground)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-black text-card-foreground">
                          {
                            themeOption.label
                          }
                        </span>

                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                          {
                            themeOption.description
                          }
                        </span>
                      </span>
                    </div>

                    {active && (
                      <span
                        className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full"
                        style={{
                          background:
                            "var(--dashboard-primary)",
                        }}
                      />
                    )}
                  </motion.button>
                );
              }
            )}
          </div>

          <div className="mt-7 border-t border-border pt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
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
                ) => {
                  const active =
                    draft
                      .appearance
                      .density ===
                    density;

                  return (
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

                            appearance:
                              {
                                ...current
                                  .appearance,

                                density,
                              },
                          })
                        )
                      }
                      className="rounded-2xl border p-4 text-left transition"
                      style={{
                        background:
                          active
                            ? "var(--dashboard-primary-soft)"
                            : "var(--card)",

                        borderColor:
                          active
                            ? "var(--dashboard-primary)"
                            : "var(--border)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-card-foreground">
                            {density ===
                            "comfortable"
                              ? "Comfortable"
                              : "Compact"}
                          </p>

                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {density ===
                            "comfortable"
                              ? "More breathing room"
                              : "More information on screen"}
                          </p>
                        </div>

                        {active && (
                          <CheckCircle2
                            className="h-4 w-4"
                            style={{
                              color:
                                "var(--dashboard-primary)",
                            }}
                          />
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <ToggleRow
              label="Reduce Motion"
              description="Use calmer interface transitions where supported."
              enabled={
                draft
                  .appearance
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

                    appearance:
                      {
                        ...current
                          .appearance,

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

function AppearancePreview({
  draft,
}: {
  draft: UserSettingsState;
}) {
  const currentTheme =
    THEME_OPTIONS.find(
      (
        option
      ) =>
        option.id ===
        draft
          .appearance
          .theme
    );

  const ThemeIcon =
    currentTheme?.icon ??
    Palette;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
        style={{
          background:
            "var(--dashboard-primary)",
          opacity:
            0.12,
        }}
      />

      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          Live Preview
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-card-foreground">
              {
                currentTheme?.label ||
                "Light"
              }
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {
                currentTheme?.description
              }
            </p>
          </div>

          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background:
                "var(--dashboard-primary-soft)",
              color:
                "var(--dashboard-primary)",
            }}
          >
            <ThemeIcon className="h-4 w-4" />
          </span>
        </div>

        <div
          className="mt-6 rounded-[24px] border p-3"
          style={{
            background:
              "var(--dashboard-surface-soft)",
            borderColor:
              "var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg"
                style={{
                  background:
                    "var(--dashboard-primary)",
                }}
              />

              <div className="space-y-1.5">
                <div className="h-2 w-20 rounded-full bg-border" />
                <div className="h-1.5 w-12 rounded-full bg-muted" />
              </div>
            </div>

            <div className="h-7 w-7 rounded-full border border-border bg-card" />
          </div>

          <div
            className={`mt-4 grid grid-cols-2 ${
              draft
                .appearance
                .density ===
              "compact"
                ? "gap-2"
                : "gap-3"
            }`}
          >
            {[
              "Balance",
              "Income",
            ].map(
              (
                label
              ) => (
                <div
                  key={
                    label
                  }
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="h-2 w-10 rounded-full bg-[var(--dashboard-primary)] opacity-40" />

                  <div className="mt-2 h-5 w-16 rounded-lg bg-[var(--dashboard-primary)] opacity-10" />

                  <div className="mt-2 h-1.5 w-12 rounded-full bg-muted" />
                </div>
              )
            )}
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border p-3"
          style={{
            background:
              "var(--dashboard-primary-soft)",
            borderColor:
              "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-4 w-4"
              style={{
                color:
                  "var(--dashboard-primary)",
              }}
            />

            <p className="text-[10px] font-black text-card-foreground">
              {
                currentTheme?.label ||
                "Light"
              }{" "}
              theme selected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   WALLET
========================================================= */

function WalletSection({
  draft,
  setDraft,
  wallet,
}: {
  draft: UserSettingsState;
  setDraft: Dispatch<
    SetStateAction<UserSettingsState>
  >;
  wallet: SettingsWallet | null;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Wallet"
        title="Wallet Performance"
        description="Review your live wallet snapshot and control balance display and transfer confirmation behaviour."
        icon={
          WalletCards
        }
        indigo
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)]">
        <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
          {wallet && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <WalletMetric
                title="Live Balance"
                value={`৳${Number(
                  wallet.balance
                ).toLocaleString(
                  "en-BD"
                )}`}
              />

              <WalletMetric
                title="Wallet Status"
                value={
                  wallet.status ||
                  "Active"
                }
              />
            </div>
          )}

          <label className="mb-2 block text-xs font-black text-card-foreground">
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
                      event
                        .target
                        .value as
                        | "BDT"
                        | "USD"
                        | "EUR",
                  },
                })
              )
            }
            className="h-12 w-full rounded-xl border border-border bg-muted/40 px-4 text-sm font-semibold text-foreground outline-none focus:border-[var(--dashboard-primary)]"
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

          <Divider />

          <ToggleRow
            label="Hide balances on launch"
            description="Mask wallet amounts until explicitly revealed."
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

          <Divider />

          <ToggleRow
            label="Require transfer confirmation"
            description="Ask for confirmation before supported transfers."
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

          <Divider />

          <RangeField
            label="Large transfer confirmation"
            description="Require stronger confirmation above this amount."
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

        <WalletVisualizer
          draft={
            draft
          }
        />
      </div>
    </div>
  );
}

function WalletMetric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {
          title
        }
      </p>

      <p className="mt-2 text-xl font-black text-card-foreground">
        {
          value
        }
      </p>
    </div>
  );
}

function WalletVisualizer({
  draft,
}: {
  draft: UserSettingsState;
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
    <div className="relative overflow-hidden rounded-[28px] border border-violet-300/10 bg-[linear-gradient(145deg,#0b0716,#18112f_55%,#45216f)] p-5 text-white shadow-[0_20px_55px_rgba(42,24,82,.18)]">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl" />

      <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/50">
        Wallet Guard
      </p>

      <div className="relative z-10 mt-6 flex justify-center">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <motion.div
            className="absolute h-44 w-44 rounded-full border border-violet-300/15"
            animate={{
              rotate: 360,
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
            className="absolute h-36 w-36 rounded-full border border-indigo-300/15"
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

          <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-[30px] border border-cyan-300/20 bg-cyan-300/10">
            <WalletCards className="h-8 w-8 text-cyan-200" />

            <span className="mt-1 text-sm font-black">
              {
                symbol
              }
              {Math.round(
                draft.wallet
                  .confirmThreshold /
                  1000
              )}
              k
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-2">
        <WalletState
          label="Balance Mask"
          active={
            draft.wallet
              .hideAmounts
          }
        />

        <WalletState
          label="Transfer Confirm"
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
  label: string;
  active: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-center">
      <p className="text-[9px] text-violet-100/45">
        {
          label
        }
      </p>

      <p
        className={`mt-1 text-[9px] font-black ${
          active
            ? "text-emerald-300"
            : "text-slate-400"
        }`}
      >
        {
          active
            ? "ON"
            : "OFF"
        }
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
  onOpenExport: () => void;
}) {
  const cards =
    [
      {
        title:
          "Account Data",
        description:
          "Profile and identity information.",
        icon:
          UserRound,
      },

      {
        title:
          "Transaction History",
        description:
          "Wallet activity and transaction records.",
        icon:
          Activity,
      },

      {
        title:
          "Financial Preferences",
        description:
          "Wallet, privacy and notification settings.",
        icon:
          Gauge,
      },

      {
        title:
          "Receipt Data",
        description:
          "Receipt-related account data where included by the backend.",
        icon:
          Database,
      },
    ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Your Data"
        title="Data & Export"
        description="Request your authenticated account export and download the returned data as JSON or CSV."
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
                  y: 8,
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
                  y: -3,
                }}
                className="rounded-[24px] border border-border bg-card p-5 text-left shadow-sm"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background:
                      "var(--dashboard-primary-soft)",

                    color:
                      "var(--dashboard-primary)",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <h3 className="mt-5 text-sm font-black text-card-foreground">
                  {
                    card.title
                  }
                </h3>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {
                    card.description
                  }
                </p>

                <span
                  className="mt-4 inline-flex items-center gap-2 text-xs font-black"
                  style={{
                    color:
                      "var(--dashboard-primary)",
                  }}
                >
                  Open Export Center
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </motion.button>
            );
          }
        )}
      </div>

      <div className="rounded-[24px] border border-border bg-muted/30 p-4">
        <p className="text-xs leading-5 text-muted-foreground">
          The server endpoint provides the authenticated
          export payload. The browser formats that payload
          into JSON or CSV.
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
  onAction: (
    action: DangerAction
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Sensitive Actions"
        title="Danger Zone"
        description="These controls can affect account authentication or permanently remove account data."
        icon={
          AlertTriangle
        }
        danger
      />

      <div className="relative overflow-hidden rounded-[30px] border border-rose-300/10 bg-[linear-gradient(145deg,#170b16,#27101f_55%,#35172b)] p-5 text-white shadow-[0_24px_70px_rgba(127,29,29,.16)] sm:p-7">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-rose-300/10 text-rose-200">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-rose-100/50">
              Protected Actions
            </p>
          </div>

          <div>
            <h3 className="text-lg font-black">
              Account protection checkpoint
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-6 text-rose-100/55">
              Logging out other devices is reversible.
              Deleting your account is permanent and requires
              your password.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DangerActionCard
                icon={
                  LogOut
                }
                title="Log out other devices"
                description="Revoke all other active sessions."
                status="Security action"
                tone="blue"
                onClick={() =>
                  onAction(
                    "logout-all"
                  )
                }
              />

              <DangerActionCard
                icon={
                  Trash2
                }
                title="Delete account"
                description="Start the permanent deletion workflow."
                status="Permanent action"
                tone="rose"
                onClick={() =>
                  onAction(
                    "delete-account"
                  )
                }
              />
            </div>
          </div>
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
  tone:
    | "blue"
    | "rose";
  onClick: () => void;
}) {
  const destructive =
    tone ===
    "rose";

  return (
    <motion.button
      type="button"
      onClick={
        onClick
      }
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale:
          0.985,
      }}
      className={`rounded-[20px] border p-4 text-left ${
        destructive
          ? "border-rose-300/20 bg-rose-400/[0.07]"
          : "border-violet-300/15 bg-violet-300/[0.055]"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          destructive
            ? "bg-rose-400/15 text-rose-200"
            : "bg-violet-300/10 text-violet-200"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <p className="mt-4 text-sm font-black">
        {
          title
        }
      </p>

      <p className="mt-1 text-[10px] leading-5 text-rose-100/55">
        {
          description
        }
      </p>

      <div className="mt-4 border-t border-white/10 pt-3">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-violet-100/65">
          {
            status
          }
        </span>
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
  sessions,
  sessionsLoading,
  sessionsError,
  sessionActionLoading,
  onClose,
  onExport,
  onReloadSessions,
  onLogoutOthers,
}: {
  type: Exclude<
    DrawerType,
    null
  >;

  privacyScore:
    number;

  sessions:
    SessionView[];

  sessionsLoading:
    boolean;

  sessionsError:
    string;

  sessionActionLoading:
    | string
    | null;

  onClose: () => void;

  onExport: (
    format:
      | "json"
      | "csv"
  ) => void;

  onReloadSessions:
    () => void;

  onLogoutOthers:
    () => void;
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
        className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-sm"
      />

      <motion.aside
        initial={{
          x: "100%",
        }}
        animate={{
          x: 0,
        }}
        exit={{
          x: "100%",
        }}
        transition={{
          type:
            "spring",
          stiffness:
            240,
          damping:
            28,
        }}
        className="fixed bottom-0 right-0 top-0 z-[90] flex w-full max-w-[560px] flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              Personal Drawer
            </p>

            <h2 className="mt-1 text-lg font-black text-card-foreground">
              {type ===
              "sessions"
                ? "Active Sessions"
                : type ===
                    "privacy"
                  ? "Privacy Summary"
                  : "Export Account Data"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {type ===
              "sessions" && (
              <button
                type="button"
                onClick={
                  onReloadSessions
                }
                disabled={
                  sessionsLoading
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/70 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    sessionsLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
            )}

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {type ===
            "sessions" && (
            <div className="space-y-4">

              {sessionsLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item
                        }
                        className="animate-pulse rounded-2xl border border-border p-4"
                      >
                        <div className="flex gap-3">
                          <div className="h-11 w-11 rounded-xl bg-muted" />

                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 rounded bg-muted" />
                            <div className="h-3 w-28 rounded bg-muted" />
                            <div className="h-3 w-48 rounded bg-muted" />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {!sessionsLoading &&
                sessionsError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />

                    <div className="min-w-0">
                      <p className="text-sm font-black text-rose-800">
                        Could not load sessions
                      </p>

                      <p className="mt-1 text-xs leading-5 text-rose-700">
                        {
                          sessionsError
                        }
                      </p>

                      <button
                        type="button"
                        onClick={
                          onReloadSessions
                        }
                        className="mt-3 rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!sessionsLoading &&
                !sessionsError &&
                sessions.length ===
                  0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
                    <MonitorSmartphone className="mx-auto h-10 w-10 text-muted-foreground/40" />

                    <p className="mt-4 text-sm font-black text-card-foreground">
                      No active sessions
                    </p>
                  </div>
                )}

              {!sessionsLoading &&
                !sessionsError &&
                sessions.length >
                  0 && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-card-foreground">
                          Signed-in devices
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {
                            sessions.length
                          }{" "}
                          active session
                          {sessions.length !==
                          1
                            ? "s"
                            : ""}
                        </p>
                      </div>

                      {sessions.some(
                        (
                          session
                        ) =>
                          !session.current
                      ) && (
                        <button
                          type="button"
                          onClick={
                            onLogoutOthers
                          }
                          disabled={
                            sessionActionLoading ===
                            "logout-all"
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-600 disabled:opacity-50"
                        >
                          {
                            sessionActionLoading ===
                            "logout-all"
                              ? "Signing out..."
                              : "Sign out others"}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {sessions.map(
                        (
                          session
                        ) => {
                          const Icon =
                            getSessionIcon(
                              session.device
                            );

                          return (
                            <div
                              key={
                                session.id
                              }
                              className="rounded-2xl border border-border bg-card p-4"
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                                  style={{
                                    background:
                                      "var(--dashboard-primary-soft)",

                                    color:
                                      "var(--dashboard-primary)",
                                  }}
                                >
                                  <Icon className="h-5 w-5" />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-black text-card-foreground">
                                      {
                                        session.device
                                      }
                                    </p>

                                    {session.current && (
                                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-emerald-600">
                                        Current
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {
                                      session.location ||
                                      "Unknown location"
                                    }
                                  </p>

                                  {session.ip && (
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                      {
                                        session.ip
                                      }
                                    </p>
                                  )}

                                  <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
                                    Last active{" "}
                                    {formatRelativeTime(
                                      session.lastActive
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                )}
            </div>
          )}

          {type ===
            "privacy" && (
            <div className="space-y-5">
              <div className="rounded-[24px] bg-[linear-gradient(145deg,#0b0716,#18112f_55%,#45216f)] p-5 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/50">
                  Privacy Score
                </p>

                <p className="mt-2 text-4xl font-black">
                  {
                    privacyScore
                  }%
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
              <ExportCard
                icon={
                  FileJson
                }
                title="JSON Export"
                description="Download the backend-generated account export as JSON."
                onClick={() =>
                  onExport(
                    "json"
                  )
                }
              />

              <ExportCard
                icon={
                  FileSpreadsheet
                }
                title="CSV Export"
                description="Download the same backend data as a spreadsheet-friendly CSV."
                onClick={() =>
                  onExport(
                    "csv"
                  )
                }
                green
              />
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function ExportCard({
  icon: Icon,
  title,
  description,
  onClick,
  green = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  green?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="flex w-full items-center gap-4 rounded-[22px] border border-border bg-card p-4 text-left transition hover:bg-muted/40"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          background:
            green
              ? "color-mix(in srgb, var(--dashboard-success) 12%, transparent)"
              : "var(--dashboard-primary-soft)",

          color:
            green
              ? "var(--dashboard-success)"
              : "var(--dashboard-primary)",
        }}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-card-foreground">
          {
            title
          }
        </span>

        <span className="mt-1 block text-xs text-muted-foreground">
          {
            description
          }
        </span>
      </span>

      <Download className="h-4 w-4 text-muted-foreground/50" />
    </button>
  );
}

/* =========================================================
   DANGER MODAL
========================================================= */

function DangerModal({
  action,
  password,
  onPasswordChange,
  onCancel,
  onConfirm,
}: {
  action: DangerAction;
  password: string;
  onPasswordChange: (
    value: string
  ) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) {
    return null;
  }

  const deleting =
    action ===
    "delete-account";

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
    >
      <button
        type="button"
        aria-label="Close confirmation"
        onClick={
          onCancel
        }
        className="absolute inset-0"
      />

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
          scale:
            0.95,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl"
      >
        <div className="bg-[linear-gradient(145deg,#180b17,#2b1020,#3a172d)] p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
              {deleting ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-rose-100/50">
                Protected confirmation
              </p>

              <h2 className="mt-1 text-lg font-black">
                {deleting
                  ? "Delete account?"
                  : "Log out other devices?"}
              </h2>

              <p className="mt-2 text-xs leading-6 text-rose-100/55">
                {deleting
                  ? "This is a permanent account action."
                  : "Your current session remains active."}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {deleting && (
            <div className="mb-5">
              <label className="mb-2 block text-xs font-black text-card-foreground">
                Current Password
              </label>

              <input
                value={
                  password
                }
                onChange={(
                  event
                ) =>
                  onPasswordChange(
                    event
                      .target
                      .value
                  )
                }
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-12 w-full rounded-xl border border-border bg-muted/40 px-4 text-sm font-semibold text-foreground outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              />

              <p className="mt-2 text-[10px] text-muted-foreground">
                The API receives the required DELETE confirmation.
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                onCancel
              }
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-black text-muted-foreground"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                onConfirm
              }
              disabled={
                deleting &&
                !password.trim()
              }
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting
                ? "Delete Account"
                : "Confirm Logout"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   SAVE BAR
========================================================= */

function SaveBar({
  saving,
  onSave,
  onDiscard,
}: {
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="rounded-[22px] border border-border bg-card p-3 shadow-[0_18px_50px_rgba(15,23,42,.12)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background:
                "color-mix(in srgb, var(--dashboard-warning) 14%, transparent)",

              color:
                "var(--dashboard-warning)",
            }}
          >
            <AlertTriangle className="h-4 w-4" />
          </span>

          <div>
            <p className="text-xs font-black text-card-foreground">
              Unsaved changes
            </p>

            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Save to sync your changes with the backend.
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
            className="rounded-xl px-4 py-2.5 text-xs font-black text-muted-foreground hover:bg-muted disabled:opacity-50"
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
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
            style={{
              background:
                "var(--dashboard-primary)",
            }}
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </motion.div>
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
  const success =
    toast.type ===
    "success";

  const error =
    toast.type ===
    "error";

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 24,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: 24,
      }}
      className="fixed right-5 top-5 z-[200] flex w-[calc(100%-2.5rem)] max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xl"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          background:
            success
              ? "color-mix(in srgb, var(--dashboard-success) 12%, transparent)"
              : error
                ? "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)"
                : "var(--dashboard-primary-soft)",

          color:
            success
              ? "var(--dashboard-success)"
              : error
                ? "var(--dashboard-danger)"
                : "var(--dashboard-primary)",
        }}
      >
        {error ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-card-foreground">
          {
            success
              ? "Saved"
              : error
                ? "Error"
                : "Updated"
          }
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
        className="text-muted-foreground/50 hover:text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/* =========================================================
   SHARED HEADER
========================================================= */

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  danger = false,
  indigo = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  danger?: boolean;
  indigo?: boolean;
}) {
  if (indigo) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-violet-300/10 bg-[linear-gradient(135deg,#0b0716,#18112f_55%,#45216f)] p-5 text-white shadow-[0_20px_55px_rgba(42,24,82,.16)] sm:p-6">
        <div className="absolute -right-20 -top-24 h-60 w-60 rounded-full bg-violet-500/12 blur-3xl" />

        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-violet-200">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-200/70">
              {
                eyebrow
              }
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] sm:text-[30px]">
              {
                title
              }
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-100/60">
              {
                description
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[26px] border p-5 shadow-sm sm:p-6 ${
        danger
          ? "border-rose-200 bg-rose-50/80"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background:
              danger
                ? "color-mix(in srgb, var(--dashboard-danger) 12%, transparent)"
                : "var(--dashboard-primary-soft)",

            color:
              danger
                ? "var(--dashboard-danger)"
                : "var(--dashboard-primary)",
          }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.14em] ${
              danger
                ? "text-rose-600"
                : ""
            }`}
            style={
              danger
                ? undefined
                : {
                    color:
                      "var(--dashboard-primary)",
                  }
            }
          >
            {
              eyebrow
            }
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] text-card-foreground sm:text-[28px]">
            {
              title
            }
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {
              description
            }
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  text,
}: {
  text: string;
}) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide"
      style={{
        background:
          "var(--dashboard-primary-soft)",

        color:
          "var(--dashboard-primary)",
      }}
    >
      {
        text
      }
    </span>
  );
}

/* =========================================================
   METRIC
========================================================= */

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
  tone:
    | "green"
    | "blue"
    | "amber";
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="rounded-[24px] border border-border bg-card p-5 shadow-sm"
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background:
            tone ===
            "green"
              ? "color-mix(in srgb, var(--dashboard-success) 12%, transparent)"
              : tone ===
                  "amber"
                ? "color-mix(in srgb, var(--dashboard-warning) 14%, transparent)"
                : "var(--dashboard-primary-soft)",

          color:
            tone ===
            "green"
              ? "var(--dashboard-success)"
              : tone ===
                  "amber"
                ? "var(--dashboard-warning)"
                : "var(--dashboard-primary)",
        }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {
          title
        }
      </p>

      <p
        className="mt-2 text-[22px] font-black leading-[1.15]"
        style={{
          color:
            tone ===
            "green"
              ? "var(--dashboard-success)"
              : tone ===
                  "amber"
                ? "var(--dashboard-warning)"
                : "var(--card-foreground)",
        }}
      >
        {
          value
        }
      </p>

      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
        {
          note
        }
      </p>
    </motion.div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div className="min-w-0">
        <p className="text-sm font-black text-card-foreground">
          {
            label
          }
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
          {
            description
          }
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
        className="relative h-8 w-14 shrink-0 rounded-full p-1 transition"
        style={{
          backgroundColor:
            enabled
              ? "var(--dashboard-primary)"
              : "var(--border)",
        }}
      >
        <motion.span
          className="block h-6 w-6 rounded-full bg-white shadow-sm"
          animate={{
            x: enabled
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

function DarkToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="min-w-0">
        <p className="text-sm font-black text-white">
          {
            label
          }
        </p>

        <p className="mt-1 text-[10px] leading-5 text-violet-100/55">
          {
            description
          }
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
        className={`relative h-8 w-14 shrink-0 rounded-full p-1 ${
          enabled
            ? "bg-violet-500"
            : "bg-white/10"
        }`}
      >
        <motion.span
          className="block h-6 w-6 rounded-full bg-white shadow-sm"
          animate={{
            x: enabled
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

/* =========================================================
   DIVIDER
========================================================= */

function Divider() {
  return (
    <div className="my-5 border-t border-border" />
  );
}

/* =========================================================
   RANGE
========================================================= */

function RangeField({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (
    value: number
  ) => void;
}) {
  const percent =
    ((value - min) /
      (max - min)) *
    100;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-card-foreground">
            {
              label
            }
          </p>

          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            {
              description
            }
          </p>
        </div>

        <span
          className="w-fit rounded-xl px-3 py-2 text-xs font-black"
          style={{
            background:
              "var(--dashboard-primary-soft)",

            color:
              "var(--dashboard-primary)",
          }}
        >
          ৳
          {value.toLocaleString(
            "en-BD"
          )}
        </span>
      </div>

      <div className="relative mt-5">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--dashboard-primary),#8b5cf6)]"
            animate={{
              width:
                `${percent}%`,
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
                event
                  .target
                  .value
              )
            )
          }
          className="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent"
          style={{
            accentColor:
              "var(--dashboard-primary)",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   TEXT FIELD
========================================================= */

function TextField({
  label,
  value,
  onChange,
  icon: Icon,
  type =
    "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  icon: LucideIcon;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black text-card-foreground">
        {
          label
        }
      </span>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

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
              event
                .target
                .value
            )
          }
          className="h-12 w-full rounded-xl border border-border bg-muted/40 pl-11 pr-4 text-sm font-semibold text-foreground outline-none focus:border-[var(--dashboard-primary)] focus:ring-4 focus:ring-[var(--dashboard-primary)]/10"
        />
      </div>
    </label>
  );
}

/* =========================================================
   DETAIL LIST
========================================================= */

function DetailList({
  rows,
}: {
  rows: Array<
    [
      string,
      string
    ]
  >;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
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
                ? "border-b border-border"
                : ""
            }`}
          >
            <span className="text-xs text-muted-foreground">
              {
                row[0]
              }
            </span>

            <span className="max-w-[60%] truncate text-right text-xs font-black text-card-foreground">
              {
                row[1]
              }
            </span>
          </div>
        )
      )}
    </div>
  );
}