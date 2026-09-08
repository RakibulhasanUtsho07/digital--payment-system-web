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
    value === "eye-care" ||
    value === "ocean" ||
    value === "forest"
  );
}

/* =========================================================
   APPLY THEME
========================================================= */

function applyTheme(
  theme: ThemeMode
) {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const root =
    document.documentElement;

  root.setAttribute(
    "data-theme",
    theme
  );

  root.classList.toggle(
    "dark",
    theme === "dark"
  );
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
    let cancelled = false;

    const loadTheme =
      async () => {
        /* -----------------------------------------------
           LOCAL CACHE FIRST
        ------------------------------------------------ */

        const localTheme =
          window.localStorage.getItem(
            THEME_STORAGE_KEY
          );

        if (
          isThemeMode(
            localTheme
          )
        ) {
          setThemeState(
            localTheme
          );

          applyTheme(
            localTheme
          );
        } else {
          applyTheme(
            DEFAULT_THEME
          );
        }

        /* -----------------------------------------------
           BACKEND SOURCE OF TRUTH
        ------------------------------------------------ */

        try {
          const response =
            await apiClient<{
              success: boolean;

              preferences?: {
                appearance?: {
                  theme?: ThemeMode;
                };

                theme?: ThemeMode;
              };
            }>(
              "/settings"
            );

          if (
            cancelled ||
            !response.success
          ) {
            return;
          }

          const serverTheme =
            response.preferences
              ?.appearance
              ?.theme ??
            response.preferences
              ?.theme;

          if (
            !isThemeMode(
              serverTheme
            )
          ) {
            return;
          }

          setThemeState(
            serverTheme
          );

          applyTheme(
            serverTheme
          );

          window.localStorage.setItem(
            THEME_STORAGE_KEY,
            serverTheme
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to load theme:",
            error
          );
        }
      };

    void loadTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     CHANGE THEME
  ======================================================= */

  const setTheme =
    async (
      nextTheme: ThemeMode
    ) => {
      if (
        !isThemeMode(
          nextTheme
        )
      ) {
        return;
      }

      /* Immediate UI */
      setThemeState(
        nextTheme
      );

      applyTheme(
        nextTheme
      );

      /* Local cache */
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        nextTheme
      );

      /* Backend */
      try {
        const response =
          await apiClient<{
            success: boolean;

            preferences?: {
              appearance?: {
                theme?: ThemeMode;
              };

              theme?: ThemeMode;
            };

            message?: string;
          }>(
            "/settings/preferences",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                appearance: {
                  theme:
                    nextTheme,
                },
              }),
            }
          );

        if (
          !response.success
        ) {
          return;
        }

        const savedTheme =
          response.preferences
            ?.appearance
            ?.theme ??
          response.preferences
            ?.theme;

        if (
          isThemeMode(
            savedTheme
          )
        ) {
          setThemeState(
            savedTheme
          );

          applyTheme(
            savedTheme
          );

          window.localStorage.setItem(
            THEME_STORAGE_KEY,
            savedTheme
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Failed to save theme:",
          error
        );
      }
    };

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