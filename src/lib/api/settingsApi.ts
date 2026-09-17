import { apiClient } from "./client";

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

export type Density =
  | "comfortable"
  | "compact";

export type Currency =
  | "BDT"
  | "USD"
  | "EUR";

/* =========================================================
   VALIDATION HELPERS
========================================================= */

export function isThemeMode(
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

export function isDensity(
  value: unknown
): value is Density {
  return (
    value === "comfortable" ||
    value === "compact"
  );
}

export function isCurrency(
  value: unknown
): value is Currency {
  return (
    value === "BDT" ||
    value === "USD" ||
    value === "EUR"
  );
}

/* =========================================================
   USER SETTINGS PREFERENCES
========================================================= */

export interface UserSettingsPreferences {
  appearance: {
    theme: ThemeMode;
    density: Density;
    reduceMotion: boolean;
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

  wallet: {
    defaultCurrency: Currency;
    hideAmounts: boolean;
    requireConfirmation: boolean;
    confirmThreshold: number;
  };
}

/* =========================================================
   PROFILE
========================================================= */

export interface SettingsProfile {
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
}

/* =========================================================
   WALLET
========================================================= */

export interface SettingsWallet {
  status: string;
  balance: number;
}

/* =========================================================
   GET SETTINGS RESPONSE
========================================================= */

export interface UserSettingsResponse {
  success: boolean;

  profile: SettingsProfile;

  preferences: UserSettingsPreferences;

  wallet: SettingsWallet | null;

  message?: string;
}

/* =========================================================
   UPDATE PREFERENCES
========================================================= */

export interface UpdatePreferencesResponse {
  success: boolean;

  message: string;

  preferences: UserSettingsPreferences;
}

/* =========================================================
   UPDATE PROFILE
========================================================= */

export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone: string;

  /*
   * Required by backend only when
   * email or phone is changed.
   */
  password?: string;
}

export interface UpdateProfileResponse {
  success: boolean;

  message: string;

  profile: SettingsProfile;
}

/* =========================================================
   SESSION
========================================================= */

export interface UserSession {
  id: string;

  current: boolean;

  device: string;

  location: string;

  lastActive: string;

  ip?: string;
}

export interface SessionResponse {
  success: boolean;

  sessions: UserSession[];

  note?: string;

  message?: string;
}

/* =========================================================
   EXPORT
========================================================= */

export interface ExportResponse {
  success: boolean;

  export: {
    generatedAt: string;

    profile: SettingsProfile;

    preferences: UserSettingsPreferences;
  };

  message?: string;
}

/* =========================================================
   GENERIC MESSAGE
========================================================= */

export interface MessageResponse {
  success: boolean;

  message: string;
}

/* =========================================================
   API
========================================================= */

export const settingsApi = {
  /* =======================================================
     GET SETTINGS

     GET /api/settings
  ======================================================= */

  get:
    async (): Promise<UserSettingsResponse> => {
      return apiClient<UserSettingsResponse>(
        "/settings",
        {
          method: "GET",
        }
      );
    },

  /* =======================================================
     UPDATE PREFERENCES

     PATCH /api/settings/preferences
  ======================================================= */

  updatePreferences:
    async (
      preferences: UserSettingsPreferences
    ): Promise<UpdatePreferencesResponse> => {
      return apiClient<UpdatePreferencesResponse>(
        "/settings/preferences",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            preferences
          ),
        }
      );
    },

  /* =======================================================
     UPDATE ONLY THEME

     PATCH /api/settings/preferences

     Payload:
     {
       appearance: {
         theme: "dark"
       }
     }

     Useful for ThemeContext.
  ======================================================= */

  updateTheme:
    async (
      theme: ThemeMode
    ): Promise<UpdatePreferencesResponse> => {
      if (
        !isThemeMode(
          theme
        )
      ) {
        throw new Error(
          "Invalid theme."
        );
      }

      return apiClient<UpdatePreferencesResponse>(
        "/settings/preferences",
        {
          method: "PATCH",

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
    },

  /* =======================================================
     UPDATE PROFILE

     PATCH /api/settings/profile
  ======================================================= */

  updateProfile:
    async (
      payload: UpdateProfilePayload
    ): Promise<UpdateProfileResponse> => {
      return apiClient<UpdateProfileResponse>(
        "/settings/profile",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );
    },

  /* =======================================================
     GET ACTIVE SESSION

     GET /api/settings/session
  ======================================================= */

  getSession:
    async (): Promise<SessionResponse> => {
      return apiClient<SessionResponse>(
        "/settings/session",
        {
          method: "GET",
        }
      );
    },

  /* =======================================================
     LOGOUT ALL OTHER DEVICES

     POST /api/settings/logout-all
  ======================================================= */

  logoutAll:
    async (): Promise<MessageResponse> => {
      return apiClient<MessageResponse>(
        "/settings/logout-all",
        {
          method: "POST",
        }
      );
    },

  /* =======================================================
     EXPORT

     GET /api/settings/export
  ======================================================= */

  exportData:
    async (): Promise<ExportResponse> => {
      return apiClient<ExportResponse>(
        "/settings/export",
        {
          method: "GET",
        }
      );
    },

  /* =======================================================
     DELETE ACCOUNT

     DELETE /api/settings/account
  ======================================================= */

  deleteAccount:
    async (
      payload: {
        password: string;
        confirmation: "DELETE";
      }
    ): Promise<MessageResponse> => {
      if (
        payload.confirmation !==
        "DELETE"
      ) {
        throw new Error(
          'Confirmation must be "DELETE".'
        );
      }

      if (
        !payload.password.trim()
      ) {
        throw new Error(
          "Password is required."
        );
      }

      return apiClient<MessageResponse>(
        "/settings/account",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );
    },
};