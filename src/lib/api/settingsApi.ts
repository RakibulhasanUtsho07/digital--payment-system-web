import { apiClient } from "./client";

/* =========================================================
   TYPES
========================================================= */

export type ThemeMode =
  | "light"
  | "dark"
  | "system";

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
}

/* =========================================================
   UPDATE PREFERENCES RESPONSE
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
}

/* =========================================================
   GENERIC MESSAGE RESPONSE
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
        "/settings"
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
     GET CURRENT SESSION

     GET /api/settings/session
  ======================================================= */

  getSession:
    async (): Promise<SessionResponse> => {
      return apiClient<SessionResponse>(
        "/settings/session"
      );
    },

  /* =======================================================
     LOG OUT ALL DEVICES

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
     EXPORT ACCOUNT SETTINGS

     GET /api/settings/export
  ======================================================= */

  exportData:
    async (): Promise<ExportResponse> => {
      return apiClient<ExportResponse>(
        "/settings/export"
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