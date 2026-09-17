export type MerchantThemeMode =
  | "light"
  | "dark"
  | "system";

export type MerchantThemeAccent =
  | "purple"
  | "blue"
  | "emerald"
  | "rose"
  | "amber";

export type MerchantThemeDensity =
  | "comfortable"
  | "compact";

export type MerchantThemeRadius =
  | "soft"
  | "rounded"
  | "extra-rounded";

/* =========================================================
   GENERAL
========================================================= */

export interface MerchantGeneralSettings {
  displayName?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  timezone: string;
  locale: string;
}

/* =========================================================
   BUSINESS
========================================================= */

export interface MerchantBusinessAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface MerchantBusinessSettings {
  category?: string;
  publicDescription?: string;
  address: MerchantBusinessAddress;
}

/* =========================================================
   CHECKOUT
========================================================= */

export interface MerchantCheckoutSettings {
  defaultExpiryMinutes: number;
  collectCustomerName: boolean;
  collectCustomerEmail: boolean;
  defaultReturnUrl?: string;
  defaultCancelUrl?: string;
  checkoutNote?: string;
}

/* =========================================================
   BRANDING
========================================================= */

export interface MerchantBrandingSettings {
  checkoutDisplayName?: string;
  checkoutAccentColor: string;
  logoUrl?: string;
}

/* =========================================================
   THEME
========================================================= */

export interface MerchantThemeSettings {
  mode: MerchantThemeMode;
  accent: MerchantThemeAccent;
  density: MerchantThemeDensity;
  radius: MerchantThemeRadius;
  reducedMotion: boolean;
  compactSidebar: boolean;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export interface MerchantNotificationSettings {
  paymentCompleted: boolean;
  paymentFailed: boolean;
  refundCreated: boolean;
  payoutUpdates: boolean;
  securityAlerts: boolean;
}

/* =========================================================
   SECURITY
========================================================= */

export interface MerchantSecuritySettings {
  notifyOnApiKeyCreated: boolean;
  notifyOnApiKeyRotated: boolean;
  notifyOnWebhookSecretRotated: boolean;
  notifyOnPayoutRequest: boolean;
}

/* =========================================================
   MERCHANT
========================================================= */

export interface MerchantSettingsMerchant {
  id: string;
  businessName: string;
  businessDisplayName?: string;
  businessType?: string;
  slug?: string;
  defaultCurrency: string;

  status: string;
  verificationStatus: string;

  testEnabled: boolean;
  liveEnabled: boolean;

  businessEmail?: string;
  businessPhone?: string;
  websiteUrl?: string;
  description?: string;
  country?: string;
  countryCode?: string;
}

/* =========================================================
   SETTINGS
========================================================= */

export interface MerchantSettings {
  general: MerchantGeneralSettings;
  business: MerchantBusinessSettings;
  checkout: MerchantCheckoutSettings;
  branding: MerchantBrandingSettings;
  theme: MerchantThemeSettings;
  notifications: MerchantNotificationSettings;
  security: MerchantSecuritySettings;

  revision: number;
  updatedAt: string;
}

export interface MerchantSettingsData {
  merchant: MerchantSettingsMerchant;
  settings: MerchantSettings;
}