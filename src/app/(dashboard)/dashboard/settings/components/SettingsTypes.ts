export type Role = "user" | "admin";

export type ThemeMode =
  | "light"
  | "dark"
  | "system";

export type Density =
  | "comfortable"
  | "compact";

export type NotificationSettings = {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
};

export type PrivacySettingsState = {
  analytics: boolean;
  discoverability: boolean;
  personalization: boolean;
};

export type UserSettingsState = {
  profile: {
    name: string;
    email: string;
    phone: string;
  };

  appearance: {
    theme: ThemeMode;
    density: Density;
  };

  wallet: {
    defaultCurrency: string;
    hideAmounts: boolean;
    confirmThreshold: number;
  };

  notifications: NotificationSettings;

  privacy: PrivacySettingsState;
};

export type AdminSettingsState = {
  platform: {
    maintenanceMode: boolean;
    allowSignups: boolean;
    defaultCurrency: string;
  };

  risk: {
    dailyTransferLimit: number;
    reviewThreshold: number;
    requireKycForHighValue: boolean;
  };

  security: {
    requireMfa: boolean;
    sessionTimeoutMins: number;
    maxLoginAttempts: number;
  };
};

export type SettingsSection = {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ElementType;
};

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};