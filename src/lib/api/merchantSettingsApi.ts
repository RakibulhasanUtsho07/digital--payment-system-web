import {
  apiClient,
} from "./client";

import type {
  MerchantBrandingSettings,
  MerchantBusinessSettings,
  MerchantCheckoutSettings,
  MerchantGeneralSettings,
  MerchantNotificationSettings,
  MerchantSecuritySettings,
  MerchantSettingsData,
  MerchantThemeSettings,
} from "@/types/merchant-settings";

/* =========================================================
   RESPONSE TYPES
========================================================= */

interface SettingsResponse {
  success: boolean;
  data: MerchantSettingsData;
}

interface SectionResponse<T> {
  success: boolean;
  message: string;
  settings: T;
  revision: number;
  updatedAt: string;
}

interface ThemeResponse {
  success: boolean;
  message?: string;
  theme: MerchantThemeSettings;
  revision: number;
  updatedAt: string;
}

/* =========================================================
   GET ALL SETTINGS

   Browser:
   GET /api/merchants/settings
========================================================= */

export async function getMerchantSettings():
  Promise<MerchantSettingsData> {
  const response =
    await apiClient<SettingsResponse>(
      "/merchants/settings",
      {
        method: "GET",
        credentials: "include",
      },
    );

  return response.data;
}

/* =========================================================
   GENERAL
========================================================= */

export async function updateMerchantGeneralSettings(
  input: Partial<MerchantGeneralSettings>,
) {
  return apiClient<
    SectionResponse<MerchantGeneralSettings>
  >(
    "/merchants/settings/general",
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

/* =========================================================
   BUSINESS
========================================================= */

export async function updateMerchantBusinessSettings(
  input: Partial<MerchantBusinessSettings>,
) {
  return apiClient<
    SectionResponse<MerchantBusinessSettings>
  >(
    "/merchants/settings/business",
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

/* =========================================================
   CHECKOUT
========================================================= */

export async function updateMerchantCheckoutSettings(
  input: Partial<MerchantCheckoutSettings>,
) {
  return apiClient<
    SectionResponse<MerchantCheckoutSettings>
  >(
    "/merchants/settings/checkout",
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

/* =========================================================
   BRANDING
========================================================= */

export async function updateMerchantBrandingSettings(
  input: Partial<MerchantBrandingSettings>,
) {
  return apiClient<
    SectionResponse<MerchantBrandingSettings>
  >(
    "/merchants/settings/branding",
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export async function updateMerchantNotificationSettings(
  input: Partial<MerchantNotificationSettings>,
) {
  return apiClient<
    SectionResponse<MerchantNotificationSettings>
  >(
    "/merchants/settings/notifications",
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

/* =========================================================
   SECURITY
========================================================= */

export async function updateMerchantSecuritySettings(
  input: Partial<MerchantSecuritySettings>,
) {
  return apiClient<
    SectionResponse<MerchantSecuritySettings>
  >(
    "/merchants/settings/security",
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

/* =========================================================
   THEME GET

   Browser:
   GET /api/merchants/settings/theme
========================================================= */

export async function getMerchantTheme():
  Promise<ThemeResponse> {
  return apiClient<ThemeResponse>(
    "/merchants/settings/theme",
    {
      method: "GET",
      credentials: "include",
    },
  );
}

/* =========================================================
   THEME UPDATE
========================================================= */

export async function updateMerchantTheme(
  input: Partial<MerchantThemeSettings>,
): Promise<ThemeResponse> {
  return apiClient<ThemeResponse>(
    "/merchants/settings/theme",
    {
      method: "PATCH",
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

/* =========================================================
   THEME RESET
========================================================= */

export async function resetMerchantTheme():
  Promise<ThemeResponse> {
  return apiClient<ThemeResponse>(
    "/merchants/settings/theme/reset",
    {
      method: "POST",
      credentials: "include",
    },
  );
}