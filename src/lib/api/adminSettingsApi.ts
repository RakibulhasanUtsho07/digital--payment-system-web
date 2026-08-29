import {
  apiClient,
} from "./client";

export type AdminSettingsState = {
  platform: {
    maintenanceMode:
      boolean;

    allowSignups:
      boolean;

    defaultCurrency:
      | "BDT"
      | "USD"
      | "EUR";
  };

  risk: {
    dailyTransferLimit:
      number;

    reviewThreshold:
      number;

    requireKycForHighValue:
      boolean;

    velocityWindowMinutes:
      number;

    maxTransfersPerWindow:
      number;
  };

  security: {
    requireMfa:
      boolean;

    sessionTimeoutMins:
      number;

    maxLoginAttempts:
      number;

    requireReauthForSensitiveActions:
      boolean;
  };
};

export type AdminAuditItem = {
  id:
    string;

  actor:
    string;

  action:
    string;

  detail:
    string;

  time:
    string;

  severity:
    | "normal"
    | "warning"
    | "critical";

  ip:
    string;
};

export type AdminSettingsOverview = {
  activeUsers:
    number;

  adminUsers:
    number;

  pendingKyc:
    number;

  systemStatus:
    | "operational"
    | "maintenance";

  configurationHealth:
    number;

  riskIndex:
    number;

  services: {
    database:
      "healthy"
      | "review";

    api:
      "healthy"
      | "review";

    auth:
      "configured"
      | "review";
  };
};

export type AdminSettingsResponse = {
  success:
    boolean;

  settings:
    AdminSettingsState;

  overview:
    AdminSettingsOverview;

  auditItems:
    AdminAuditItem[];

  meta: {
    revision:
      number;

    updatedAt:
      string;
  };
};

export type UpdateAdminSettingsResponse = {
  success:
    boolean;

  message:
    string;

  settings:
    AdminSettingsState;

  meta: {
    revision:
      number;

    updatedAt:
      string;
  };
};

export type AdminAuditResponse = {
  success:
    boolean;

  count:
    number;

  auditItems:
    AdminAuditItem[];
};

export type ResetAdminSettingsResponse = {
  success:
    boolean;

  message:
    string;

  settings:
    AdminSettingsState;
};

export const adminSettingsApi = {
  get:
    async (): Promise<AdminSettingsResponse> => {
      return apiClient<AdminSettingsResponse>(
        "/admin/settings"
      );
    },

  update:
    async (
      settings:
        AdminSettingsState,
      password:
        string
    ): Promise<UpdateAdminSettingsResponse> => {
      return apiClient<UpdateAdminSettingsResponse>(
        "/admin/settings",
        {
          method:
            "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              settings,
              password,
            }),
        }
      );
    },

  audit:
    async (
      severity?:
        | "normal"
        | "warning"
        | "critical"
    ): Promise<AdminAuditResponse> => {
      const query =
        severity
          ? `?severity=${encodeURIComponent(
              severity
            )}`
          : "";

      return apiClient<AdminAuditResponse>(
        `/admin/settings/audit${query}`
      );
    },

  reset:
    async (
      password:
        string
    ): Promise<ResetAdminSettingsResponse> => {
      return apiClient<ResetAdminSettingsResponse>(
        "/admin/settings/reset",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              password,
              confirmation:
                "RESET",
            }),
        }
      );
    },
};
