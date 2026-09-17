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

const AUTH_STORAGE_KEY =
  "is_authenticated";

const AUTH_CHANGE_EVENT =
  "coffer-auth-state-changed";

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
): "light" | "dark" {
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
          return;
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

        console.warn(
          "Unable to persist theme:",
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

  if (
    !context
  ) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}