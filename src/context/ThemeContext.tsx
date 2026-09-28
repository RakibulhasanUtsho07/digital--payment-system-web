"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

export type ThemeMode =
  | "light"
  | "dark"
  | "system"
  | "eye-care"
  | "ocean"
  | "forest";

export type ResolvedTheme =
  | "light"
  | "dark";

export interface ThemeTokens {
  pageBg: string;
  pageBgSecondary: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  text: string;
  textSoft: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primarySoftText: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  heroFrom: string;
  heroTo: string;
  heroGlow: string;
  heroGlowSecondary: string;
  ring: string;
  shadow: string;
  shadowStrong: string;
}

interface ThemeContextValue {
  theme: ThemeMode;

  resolvedTheme:
    ResolvedTheme;

  tokens:
    ThemeTokens;

  isDark:
    boolean;

  setTheme: (
    theme: ThemeMode
  ) => Promise<void>;
}

/* =========================================================
   CONTEXT
========================================================= */

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null
  );

/* =========================================================
   CONSTANTS
========================================================= */

const THEME_STORAGE_KEY =
  "coffer-dashboard-theme";

const AUTH_STORAGE_KEY =
  "is_authenticated";

const AUTH_CHANGE_EVENT =
  "coffer-auth-state-changed";

const DEFAULT_THEME: ThemeMode =
  "light";

const LIGHT_TOKENS: ThemeTokens = {
  pageBg: "#F6F8FD",
  pageBgSecondary: "#EEF2FF",
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  surfaceElevated:
    "rgba(255,255,255,0.86)",
  text: "#0F172A",
  textSoft: "#475569",
  textMuted: "#64748B",
  border:
    "rgba(99,102,241,0.14)",
  borderStrong:
    "rgba(99,102,241,0.26)",
  primary: "#7C3AED",
  primaryStrong: "#6D28D9",
  primarySoft:
    "rgba(124,58,237,0.12)",
  primarySoftText: "#5B21B6",
  success: "#0F9D7A",
  successSoft:
    "rgba(15,157,122,0.12)",
  warning: "#F59E0B",
  warningSoft:
    "rgba(245,158,11,0.14)",
  danger: "#EF4444",
  dangerSoft:
    "rgba(239,68,68,0.12)",
  inputBg: "#FFFFFF",
  inputText: "#0F172A",
  inputPlaceholder: "#94A3B8",
  heroFrom: "#17052F",
  heroTo: "#5B21B6",
  heroGlow:
    "rgba(139,92,246,0.34)",
  heroGlowSecondary:
    "rgba(168,85,247,0.24)",
  ring:
    "rgba(124,58,237,0.28)",
  shadow:
    "0 16px 40px rgba(15,23,42,0.08)",
  shadowStrong:
    "0 24px 60px rgba(91,33,182,0.18)",
};

const DARK_TOKENS: ThemeTokens = {
  pageBg: "#060814",
  pageBgSecondary: "#0B1020",
  surface: "#0E1426",
  surfaceMuted: "#10192F",
  surfaceElevated:
    "rgba(14,20,38,0.86)",
  text: "#F8FAFC",
  textSoft: "#CBD5E1",
  textMuted: "#94A3B8",
  border:
    "rgba(148,163,184,0.16)",
  borderStrong:
    "rgba(139,92,246,0.35)",
  primary: "#A855F7",
  primaryStrong: "#9333EA",
  primarySoft:
    "rgba(168,85,247,0.14)",
  primarySoftText: "#E9D5FF",
  success: "#34D399",
  successSoft:
    "rgba(52,211,153,0.12)",
  warning: "#FBBF24",
  warningSoft:
    "rgba(251,191,36,0.12)",
  danger: "#FB7185",
  dangerSoft:
    "rgba(251,113,133,0.12)",
  inputBg: "#0B1222",
  inputText: "#F8FAFC",
  inputPlaceholder: "#64748B",
  heroFrom: "#120322",
  heroTo: "#4C1D95",
  heroGlow:
    "rgba(147,51,234,0.36)",
  heroGlowSecondary:
    "rgba(76,29,149,0.28)",
  ring:
    "rgba(168,85,247,0.34)",
  shadow:
    "0 18px 48px rgba(0,0,0,0.34)",
  shadowStrong:
    "0 24px 64px rgba(91,33,182,0.28)",
};

const EYE_CARE_TOKENS: ThemeTokens = {
  ...LIGHT_TOKENS,
  pageBg: "#F4F1E8",
  pageBgSecondary: "#EEE8DA",
  surface: "#FFFDF8",
  surfaceMuted: "#FAF7F0",
  surfaceElevated:
    "rgba(255,253,248,0.90)",
  text: "#292524",
  textSoft: "#57534E",
  textMuted: "#78716C",
  border:
    "rgba(161,98,7,0.12)",
  borderStrong:
    "rgba(124,58,237,0.20)",
  inputBg: "#FFFDF8",
  inputText: "#292524",
};

const OCEAN_TOKENS: ThemeTokens = {
  ...LIGHT_TOKENS,
  pageBg: "#F4FAFF",
  pageBgSecondary: "#E8F6FF",
  surface: "#FFFFFF",
  surfaceMuted: "#F0F9FF",
  border:
    "rgba(8,145,178,0.14)",
  borderStrong:
    "rgba(14,116,144,0.24)",
  primary: "#0891B2",
  primaryStrong: "#0E7490",
  primarySoft:
    "rgba(8,145,178,0.12)",
  primarySoftText: "#0F766E",
  heroFrom: "#08203E",
  heroTo: "#164E63",
  heroGlow:
    "rgba(34,211,238,0.28)",
  heroGlowSecondary:
    "rgba(8,145,178,0.18)",
  ring:
    "rgba(8,145,178,0.28)",
};

const FOREST_TOKENS: ThemeTokens = {
  ...LIGHT_TOKENS,
  pageBg: "#F5FBF7",
  pageBgSecondary: "#ECF8F0",
  surface: "#FFFFFF",
  surfaceMuted: "#F0FDF4",
  border:
    "rgba(22,163,74,0.12)",
  borderStrong:
    "rgba(21,128,61,0.24)",
  primary: "#16A34A",
  primaryStrong: "#15803D",
  primarySoft:
    "rgba(22,163,74,0.12)",
  primarySoftText: "#166534",
  heroFrom: "#052E16",
  heroTo: "#166534",
  heroGlow:
    "rgba(34,197,94,0.24)",
  heroGlowSecondary:
    "rgba(22,101,52,0.18)",
  ring:
    "rgba(34,197,94,0.28)",
};

/* =========================================================
   VALIDATION
========================================================= */

function isThemeMode(
  value: unknown
): value is ThemeMode {
  return (
    value === "light" ||
    value === "dark" ||
    value === "system" ||
    value === "eye-care" ||
    value === "ocean" ||
    value === "forest"
  );
}

/* =========================================================
   AUTH STATE
========================================================= */

function hasLocalAuthenticationFlag(): boolean {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(
        AUTH_STORAGE_KEY
      ) === "true"
    );
  } catch {
    return false;
  }
}

/* =========================================================
   EXPECTED AUTH ERROR
========================================================= */

function isAuthenticationError(
  error: unknown
): boolean {
  if (
    !(error instanceof Error)
  ) {
    return false;
  }

  const message =
    error.message
      .toLowerCase();

  return (
    message.includes(
      "not authorized"
    ) ||
    message.includes(
      "unauthorized"
    ) ||
    message.includes(
      "authentication"
    ) ||
    message.includes(
      "no token"
    ) ||
    message.includes(
      "invalid token"
    ) ||
    message.includes(
      "session has been revoked"
    ) ||
    message.includes(
      "session is no longer active"
    )
  );
}

/* =========================================================
   EFFECTIVE THEME
========================================================= */

function getEffectiveTheme(
  theme: ThemeMode
): ResolvedTheme {
  if (
    theme === "dark"
  ) {
    return "dark";
  }

  if (
    theme !== "system"
  ) {
    return "light";
  }

  if (
    typeof window ===
    "undefined"
  ) {
    return "light";
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}


/* =========================================================
   THEME TOKENS
========================================================= */

function getThemeTokens(
  theme: ThemeMode
): ThemeTokens {
  if (
    theme === "dark"
  ) {
    return DARK_TOKENS;
  }

  if (
    theme === "eye-care"
  ) {
    return EYE_CARE_TOKENS;
  }

  if (
    theme === "ocean"
  ) {
    return OCEAN_TOKENS;
  }

  if (
    theme === "forest"
  ) {
    return FOREST_TOKENS;
  }

  if (
    theme === "system" &&
    getEffectiveTheme(
      theme
    ) === "dark"
  ) {
    return DARK_TOKENS;
  }

  return LIGHT_TOKENS;
}

function applyThemeVariables(
  root: HTMLElement,
  tokens: ThemeTokens
): void {
  const variables:
    Record<string, string> = {
      "--coffer-page-bg":
        tokens.pageBg,
      "--coffer-page-bg-secondary":
        tokens.pageBgSecondary,
      "--coffer-surface":
        tokens.surface,
      "--coffer-surface-muted":
        tokens.surfaceMuted,
      "--coffer-surface-elevated":
        tokens.surfaceElevated,
      "--coffer-text":
        tokens.text,
      "--coffer-text-soft":
        tokens.textSoft,
      "--coffer-text-muted":
        tokens.textMuted,
      "--coffer-border":
        tokens.border,
      "--coffer-border-strong":
        tokens.borderStrong,
      "--coffer-primary":
        tokens.primary,
      "--coffer-primary-strong":
        tokens.primaryStrong,
      "--coffer-primary-soft":
        tokens.primarySoft,
      "--coffer-primary-soft-text":
        tokens.primarySoftText,
      "--coffer-success":
        tokens.success,
      "--coffer-success-soft":
        tokens.successSoft,
      "--coffer-warning":
        tokens.warning,
      "--coffer-warning-soft":
        tokens.warningSoft,
      "--coffer-danger":
        tokens.danger,
      "--coffer-danger-soft":
        tokens.dangerSoft,
      "--coffer-input-bg":
        tokens.inputBg,
      "--coffer-input-text":
        tokens.inputText,
      "--coffer-input-placeholder":
        tokens.inputPlaceholder,
      "--coffer-hero-from":
        tokens.heroFrom,
      "--coffer-hero-to":
        tokens.heroTo,
      "--coffer-hero-glow":
        tokens.heroGlow,
      "--coffer-hero-glow-secondary":
        tokens.heroGlowSecondary,
      "--coffer-ring":
        tokens.ring,
      "--coffer-shadow":
        tokens.shadow,
      "--coffer-shadow-strong":
        tokens.shadowStrong,
    };

  Object.entries(
    variables
  ).forEach(
    ([
      key,
      value,
    ]) => {
      root.style.setProperty(
        key,
        value
      );
    }
  );
}

/* =========================================================
   APPLY THEME
========================================================= */

function applyTheme(
  theme: ThemeMode
): void {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const root =
    document.documentElement;

  const effectiveTheme =
    getEffectiveTheme(
      theme
    );

  root.setAttribute(
    "data-theme-mode",
    theme
  );

  root.setAttribute(
    "data-theme",
    effectiveTheme
  );

  root.classList.toggle(
    "dark",
    effectiveTheme ===
      "dark"
  );

  root.style.colorScheme =
    effectiveTheme;

  applyThemeVariables(
    root,
    getThemeTokens(
      theme
    )
  );
}

/* =========================================================
   READ LOCAL THEME
========================================================= */

function getLocalTheme(): ThemeMode {
  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_THEME;
  }

  try {
    const stored =
      window.localStorage.getItem(
        THEME_STORAGE_KEY
      );

    if (
      isThemeMode(
        stored
      )
    ) {
      return stored;
    }
  } catch (
    error
  ) {
    console.warn(
      "Unable to read cached theme:",
      error
    );
  }

  return DEFAULT_THEME;
}

/* =========================================================
   SAVE LOCAL THEME
========================================================= */

function saveLocalTheme(
  theme: ThemeMode
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      theme
    );
  } catch (
    error
  ) {
    console.warn(
      "Unable to cache theme:",
      error
    );
  }
}

/* =========================================================
   EXTRACT THEME
========================================================= */

function extractTheme(
  response: unknown
): ThemeMode | null {
  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return null;
  }

  const data =
    response as {
      preferences?: {
        appearance?: {
          theme?: unknown;
        };

        theme?: unknown;
      };
    };

  const nested =
    data.preferences
      ?.appearance
      ?.theme;

  if (
    isThemeMode(
      nested
    )
  ) {
    return nested;
  }

  const legacy =
    data.preferences
      ?.theme;

  if (
    isThemeMode(
      legacy
    )
  ) {
    return legacy;
  }

  return null;
}

/* =========================================================
   PROVIDER
========================================================= */

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    theme,
    setThemeState,
  ] =
    useState<ThemeMode>(
      DEFAULT_THEME
    );


  /*
   * The existing "system" listener already updates the DOM.
   * This tiny revision state only forces Context consumers to
   * receive refreshed resolvedTheme/tokens when the OS theme changes.
   */
  const [
    ,
    setSystemThemeRevision,
  ] =
    useState(0);

  const resolvedTheme =
    getEffectiveTheme(
      theme
    );

  const tokens =
    getThemeTokens(
      theme
    );

  const isDark =
    resolvedTheme ===
    "dark";

  /* =======================================================
     LOAD SERVER THEME
  ======================================================= */

  const loadServerTheme =
    useCallback(
      async () => {
        /*
         * Do not call protected endpoint before login.
         *
         * This prevents:
         *
         * GET /settings
         * -> 401
         * -> "Not authorized, no token provided"
         */
        if (
          !hasLocalAuthenticationFlag()
        ) {
          return;
        }

        try {
          const response =
            await apiClient<{
              success:
                boolean;

              preferences?: {
                appearance?: {
                  theme?:
                    ThemeMode;

                  density?:
                    | "comfortable"
                    | "compact";

                  reduceMotion?:
                    boolean;
                };

                theme?:
                  ThemeMode;
              };

              message?:
                string;
            }>(
              "/settings",
              {
                method:
                  "GET",
              }
            );

          if (
            !response?.success
          ) {
            return;
          }

          const serverTheme =
            extractTheme(
              response
            );

          if (
            !serverTheme
          ) {
            return;
          }

          setThemeState(
            serverTheme
          );

          applyTheme(
            serverTheme
          );

          saveLocalTheme(
            serverTheme
          );
        } catch (
          error
        ) {
          /*
           * Authentication errors are expected when:
           *
           * - session expired
           * - logout happened
           * - local auth flag became stale
           *
           * Theme fallback should remain silent.
           */
          if (
            isAuthenticationError(
              error
            )
          ) {
            return;
          }

          console.warn(
            "Unable to load server theme:",
            error
          );
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOCAL THEME
  ======================================================= */

  useEffect(
    () => {
      const localTheme =
        getLocalTheme();

      setThemeState(
        localTheme
      );

      applyTheme(
        localTheme
      );

      void loadServerTheme();
    },
    [
      loadServerTheme,
    ]
  );

  /* =======================================================
     AUTH STATE CHANGE

     Login page can dispatch:
     window.dispatchEvent(
       new Event(
         "coffer-auth-state-changed"
       )
     );
  ======================================================= */

  useEffect(
    () => {
      const handleAuthChange =
        () => {
          if (
            hasLocalAuthenticationFlag()
          ) {
            void loadServerTheme();
          }
        };

      window.addEventListener(
        AUTH_CHANGE_EVENT,
        handleAuthChange
      );

      return () => {
        window.removeEventListener(
          AUTH_CHANGE_EVENT,
          handleAuthChange
        );
      };
    },
    [
      loadServerTheme,
    ]
  );

  /* =======================================================
     STORAGE SYNC
  ======================================================= */

  useEffect(
    () => {
      const handleStorage =
        (
          event:
            StorageEvent
        ) => {
          if (
            event.key ===
            THEME_STORAGE_KEY &&
            isThemeMode(
              event.newValue
            )
          ) {
            setThemeState(
              event.newValue
            );

            applyTheme(
              event.newValue
            );
          }

          if (
            event.key ===
            AUTH_STORAGE_KEY &&
            event.newValue ===
            "true"
          ) {
            void loadServerTheme();
          }
        };

      window.addEventListener(
        "storage",
        handleStorage
      );

      return () => {
        window.removeEventListener(
          "storage",
          handleStorage
        );
      };
    },
    [
      loadServerTheme,
    ]
  );

  /* =======================================================
     SYSTEM THEME LISTENER
  ======================================================= */

  useEffect(
    () => {
      if (
        theme !==
        "system"
      ) {
        return;
      }

      const media =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        );

      const handleChange =
        () => {
          applyTheme(
            "system"
          );

          setSystemThemeRevision(
            (current) =>
              current + 1
          );
        };

      media.addEventListener(
        "change",
        handleChange
      );

      return () => {
        media.removeEventListener(
          "change",
          handleChange
        );
      };
    },
    [
      theme,
    ]
  );

  /* =======================================================
     SET THEME
  ======================================================= */

  const setTheme =
    async (
      nextTheme:
        ThemeMode
    ): Promise<void> => {
      if (
        !isThemeMode(
          nextTheme
        )
      ) {
        return;
      }

      /*
       * Keep the last confirmed value so the Admin Settings page can
       * recover cleanly when the persistence request fails.
       */
      const previousTheme =
        theme;

      /*
       * Immediate UI update.
       */
      setThemeState(
        nextTheme
      );

      applyTheme(
        nextTheme
      );

      saveLocalTheme(
        nextTheme
      );

      /*
       * Anonymous/login pages:
       *
       * keep local theme only.
       */
      if (
        !hasLocalAuthenticationFlag()
      ) {
        return;
      }

      try {
        /*
         * First load current appearance so density /
         * reduceMotion remain unchanged.
         */
        const current =
          await apiClient<{
            success:
              boolean;

            preferences?: {
              appearance?: {
                theme?:
                  ThemeMode;

                density?:
                  | "comfortable"
                  | "compact";

                reduceMotion?:
                  boolean;
              };
            };
          }>(
            "/settings",
            {
              method:
                "GET",
            }
          );

        const appearance =
          current.preferences
            ?.appearance;

        const payload = {
          appearance: {
            theme:
              nextTheme,

            density:
              appearance
                ?.density ??
              "comfortable",

            reduceMotion:
              appearance
                ?.reduceMotion ??
              false,
          },
        };

        const response =
          await apiClient<{
            success:
              boolean;

            preferences?: {
              appearance?: {
                theme?:
                  ThemeMode;
              };
            };

            message?:
              string;
          }>(
            "/settings/preferences",
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        if (
          !response.success
        ) {
          throw new Error(
            response.message ||
              "Unable to save the selected theme."
          );
        }

        const savedTheme =
          extractTheme(
            response
          );

        if (
          savedTheme
        ) {
          setThemeState(
            savedTheme
          );

          applyTheme(
            savedTheme
          );

          saveLocalTheme(
            savedTheme
          );
        }
      } catch (
        error
      ) {
        if (
          isAuthenticationError(
            error
          )
        ) {
          /*
           * Keep local theme.
           */
          return;
        }

        /*
         * Admin Settings uses the rejected promise to show an error toast.
         * Roll back only on a real persistence failure. Anonymous/auth-expired
         * behavior above remains unchanged.
         */
        setThemeState(
          previousTheme
        );

        applyTheme(
          previousTheme
        );

        saveLocalTheme(
          previousTheme
        );

        throw error instanceof Error
          ? error
          : new Error(
              "Unable to save the selected theme."
            );
      }
    };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        tokens,
        isDark,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useTheme() {
  const context =
    useContext(
      ThemeContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}
