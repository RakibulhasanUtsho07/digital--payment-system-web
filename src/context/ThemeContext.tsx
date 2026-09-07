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

  /*
   * CSS variables
   * [data-theme="..."]
   */
  root.setAttribute(
    "data-theme",
    theme
  );

  /*
   * Keep Tailwind dark:
   * utilities working.
   */
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
  const [theme, setThemeState] =
    useState<ThemeMode>(
      DEFAULT_THEME
    );

  const [mounted, setMounted] =
    useState(false);

  /* =======================================================
     INITIAL THEME LOAD
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadTheme =
      async () => {
        /*
         * 1. Load cached theme first.
         * This makes the UI feel instant.
         */
        const localTheme =
          window.localStorage.getItem(
            THEME_STORAGE_KEY
          );

        if (
          isThemeMode(localTheme)
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

        setMounted(true);

        /*
         * 2. Ask backend for the
         * real saved user preference.
         */
        try {
          const response =
            await apiClient<{
              success: boolean;
              preferences?: {
                theme?: ThemeMode;
              };
            }>(
              "/users/preferences"
            );

          if (
            cancelled ||
            !response.success
          ) {
            return;
          }

          const serverTheme =
            response.preferences
              ?.theme;

          if (
            !isThemeMode(
              serverTheme
            )
          ) {
            return;
          }

          /*
           * Backend is the source
           * of truth.
           */
          setThemeState(
            serverTheme
          );

          applyTheme(
            serverTheme
          );

          /*
           * Keep local cache
           * synchronized.
           */
          window.localStorage.setItem(
            THEME_STORAGE_KEY,
            serverTheme
          );
        } catch (error) {
          /*
           * If backend is unavailable,
           * keep cached/local theme.
           */
          console.error(
            "Failed to load user theme:",
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

  const setTheme = async (
    nextTheme: ThemeMode
  ) => {
    /*
     * Ignore invalid values.
     */
    if (
      !isThemeMode(
        nextTheme
      )
    ) {
      return;
    }

    /*
     * Optimistic UI:
     * change immediately.
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
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme
    );

    /*
     * Save to database.
     */
    try {
      const response =
        await apiClient<{
          success: boolean;
          preferences?: {
            theme?: ThemeMode;
          };
        }>(
          "/users/preferences",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              theme:
                nextTheme,
            }),
          }
        );

      /*
       * Backend may return
       * the normalized/saved theme.
       */
      const savedTheme =
        response.preferences
          ?.theme;

      if (
        response.success &&
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
    } catch (error) {
      /*
       * UI remains on selected theme.
       * It is already cached locally.
       */
      console.error(
        "Failed to save user theme:",
        error
      );
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