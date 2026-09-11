"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiClient } from "@/lib/api/client";

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

interface ThemeContextValue {
  theme: ThemeMode;

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

const DEFAULT_THEME: ThemeMode =
  "light";

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
   APPLY THEME
========================================================= */

function getEffectiveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme !== "system") return "light";

  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const effectiveTheme = getEffectiveTheme(theme);

  root.setAttribute("data-theme-mode", theme);
  root.setAttribute("data-theme", effectiveTheme);
  root.classList.toggle("dark", effectiveTheme === "dark");
}

/* =========================================================
   GET THEME FROM RESPONSE
========================================================= */

function extractTheme(
  response: unknown
): ThemeMode | null {
  if (
    !response ||
    typeof response !== "object"
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

  /*
   * Preferred structure:
   *
   * preferences.appearance.theme
   */
  const nestedTheme =
    data.preferences
      ?.appearance
      ?.theme;

  if (
    isThemeMode(
      nestedTheme
    )
  ) {
    return nestedTheme;
  }

  /*
   * Backward compatibility:
   *
   * preferences.theme
   */
  const flatTheme =
    data.preferences
      ?.theme;

  if (
    isThemeMode(
      flatTheme
    )
  ) {
    return flatTheme;
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

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    let cancelled =
      false;

    const loadTheme =
      async () => {
        /*
         * ---------------------------------------------------
         * STEP 1: LOCAL CACHE
         * ---------------------------------------------------
         */

        let localTheme:
          ThemeMode =
          DEFAULT_THEME;

        try {
          const storedTheme =
            window.localStorage.getItem(
              THEME_STORAGE_KEY
            );

          if (
            isThemeMode(
              storedTheme
            )
          ) {
            localTheme =
              storedTheme;
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to read local theme:",
            error
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        setThemeState(
          localTheme
        );

        applyTheme(
          localTheme
        );

        /*
         * ---------------------------------------------------
         * STEP 2: BACKEND
         * ---------------------------------------------------
         *
         * GET /api/settings
         *
         * Expected:
         *
         * {
         *   success: true,
         *   preferences: {
         *     appearance: {
         *       theme: "dark"
         *     }
         *   }
         * }
         */

        try {
          const response =
            await apiClient<{
              success: boolean;

              profile?: unknown;

              preferences?: {
                appearance?: {
                  theme?: ThemeMode;
                  density?:
                    | "comfortable"
                    | "compact";
                  reduceMotion?: boolean;
                };

                theme?: ThemeMode;
              };

              wallet?: unknown;

              message?: string;
            }>(
              "/settings",
              {
                method:
                  "GET",
              }
            );

          if (
            cancelled ||
            !response?.success
          ) {
            return;
          }

          const serverTheme =
            extractTheme(
              response
            );

          /*
           * Invalid/missing server theme should
           * never break the UI.
           */
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

          try {
            window.localStorage.setItem(
              THEME_STORAGE_KEY,
              serverTheme
            );
          } catch (
            storageError
          ) {
            console.error(
              "Failed to cache server theme:",
              storageError
            );
          }
        } catch (
          error
        ) {
          /*
           * Backend failure is non-fatal.
           * Local theme remains active.
           */
          console.error(
            "Failed to load user theme:",
            error
          );
        }
      };

    void loadTheme();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* =======================================================
     CHANGE THEME
  ======================================================= */

  const setTheme =
    async (
      nextTheme: ThemeMode
    ) => {
      /*
       * Validate before doing anything.
       */
      if (
        !isThemeMode(
          nextTheme
        )
      ) {
        console.error(
          "Invalid theme value:",
          nextTheme
        );

        return;
      }

      /*
       * ---------------------------------------------------
       * OPTIMISTIC UI
       * ---------------------------------------------------
       */

      setThemeState(
        nextTheme
      );

      applyTheme(
        nextTheme
      );

      /*
       * Cache immediately.
       */
      try {
        window.localStorage.setItem(
          THEME_STORAGE_KEY,
          nextTheme
        );
      } catch (
        error
      ) {
        console.error(
          "Failed to cache theme:",
          error
        );
      }

      /*
       * ---------------------------------------------------
       * BACKEND
       * ---------------------------------------------------
       *
       * IMPORTANT:
       *
       * Backend settings endpoint expects
       * the complete appearance object.
       *
       * We fetch current settings first so that
       * changing only theme does not accidentally
       * overwrite density/reduceMotion.
       * ---------------------------------------------------
       */

      try {
        const current =
          await apiClient<{
            success: boolean;

            preferences?: {
              appearance?: {
                theme?: ThemeMode;

                density?:
                  | "comfortable"
                  | "compact";

                reduceMotion?: boolean;
              };

              notifications?: {
                email?: boolean;
                push?: boolean;
                sms?: boolean;
                marketing?: boolean;
              };

              privacy?: {
                analytics?: boolean;
                discoverability?: boolean;
                personalization?: boolean;
                showTransactionNames?: boolean;
              };

              wallet?: {
                defaultCurrency?:
                  | "BDT"
                  | "USD"
                  | "EUR";
                hideAmounts?: boolean;
                requireConfirmation?: boolean;
                confirmThreshold?: number;
              };
            };

            message?: string;
          }>(
            "/settings",
            {
              method:
                "GET",
            }
          );

        if (
          !current?.success ||
          !current.preferences
            ?.appearance
        ) {
          /*
           * Fallback:
           * send only appearance.theme.
           *
           * This keeps compatibility with a backend
           * that accepts partial preference updates.
           */
          await saveThemeOnly(
            nextTheme
          );

          return;
        }

        const appearance =
          current
            .preferences
            .appearance;

        /*
         * Keep existing values and replace only theme.
         */
        const payload = {
          appearance: {
            theme:
              nextTheme,

            density:
              appearance.density ??
              "comfortable",

            reduceMotion:
              appearance.reduceMotion ??
              false,
          },
        };

        const response =
          await apiClient<{
            success: boolean;

            message?: string;

            preferences?: {
              appearance?: {
                theme?: ThemeMode;

                density?:
                  | "comfortable"
                  | "compact";

                reduceMotion?: boolean;
              };
            };
          }>(
            "/settings/preferences",
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),
            }
          );

        if (
          !response?.success
        ) {
          console.error(
            "Theme preference save failed:",
            response?.message
          );

          return;
        }

        const savedTheme =
          extractTheme(
            response
          );

        /*
         * Backend returned a valid theme.
         */
        if (
          savedTheme
        ) {
          setThemeState(
            savedTheme
          );

          applyTheme(
            savedTheme
          );

          try {
            window.localStorage.setItem(
              THEME_STORAGE_KEY,
              savedTheme
            );
          } catch (
            error
          ) {
            console.error(
              "Failed to cache saved theme:",
              error
            );
          }
        }
      } catch (
        error
      ) {
        /*
         * If full settings GET/PATCH fails,
         * attempt a small fallback request.
         */
        console.error(
          "Failed to save theme through settings preferences:",
          error
        );

        try {
          await saveThemeOnly(
            nextTheme
          );
        } catch (
          fallbackError
        ) {
          console.error(
            "Theme fallback save failed:",
            fallbackError
          );
        }
      }
    };

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* =========================================================
   FALLBACK THEME SAVE
========================================================= */

async function saveThemeOnly(
  theme: ThemeMode
) {
  const response =
    await apiClient<{
      success: boolean;

      message?: string;

      preferences?: {
        appearance?: {
          theme?: ThemeMode;
        };

        theme?: ThemeMode;
      };
    }>(
      "/settings/preferences",
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          appearance: {
            theme,
          },
        }),
      }
    );

  if (
    !response?.success
  ) {
    throw new Error(
      response?.message ||
        "Unable to save theme preference."
    );
  }

  return response;
}

/* =========================================================
   HOOK
========================================================= */

export function useTheme() {
  const context =
    useContext(
      ThemeContext
    );

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}