import { apiClient } from "./client";

/* =========================================================
   TYPES
========================================================= */

export type ThemeMode =
  | "light"
  | "dark"
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
    async (): Promise<UserSettingsResponse> =>
      apiClient<UserSettingsResponse>(
        "/settings"
      ),

  /* =======================================================
     UPDATE PREFERENCES
     PATCH /api/settings/preferences
  ======================================================= */

  updatePreferences:
    async (
      preferences: UserSettingsPreferences
    ): Promise<UpdatePreferencesResponse> =>
      apiClient<UpdatePreferencesResponse>(
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
      ),

  /* =======================================================
     UPDATE PROFILE
     PATCH /api/settings/profile
  ======================================================= */

  updateProfile:
    async (
      payload: UpdateProfilePayload
    ): Promise<UpdateProfileResponse> =>
      apiClient<UpdateProfileResponse>(
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
      ),

  /* =======================================================
     GET ACTIVE SESSION
     GET /api/settings/session
  ======================================================= */

  getSession:
    async (): Promise<SessionResponse> =>
      apiClient<SessionResponse>(
        "/settings/session"
      ),

  /* =======================================================
     LOGOUT ALL OTHER DEVICES
     POST /api/settings/logout-all
  ======================================================= */

  logoutAll:
    async (): Promise<MessageResponse> =>
      apiClient<MessageResponse>(
        "/settings/logout-all",
        {
          method: "POST",
        }
      ),

  /* =======================================================
     EXPORT
     GET /api/settings/export
  ======================================================= */

  exportData:
    async (): Promise<ExportResponse> =>
      apiClient<ExportResponse>(
        "/settings/export"
      ),

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
    ): Promise<MessageResponse> =>
      apiClient<MessageResponse>(
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
      ),
};