"use client";

import {
  apiClient,
} from "./client";

/* =========================================================
   SUPPORT SETTINGS TYPES
========================================================= */

export type SupportSettingsSection =
  | "general"
  | "tickets"
  | "assignment"
  | "sla"
  | "escalation"
  | "notifications"
  | "aiCopilot"
  | "knowledgeBase"
  | "savedReplies"
  | "security"
  | "appearance";

export type SupportPriority =
  | "Urgent"
  | "High"
  | "Normal"
  | "Low";

export type AssignmentStrategy =
  | "round_robin"
  | "least_open"
  | "manual";

export type SupportDensity =
  | "comfortable"
  | "compact";

export interface SupportSettingsPayload {
  general: {
    workspaceName: string;
    timezone: string;
    defaultLanguage: string;
    businessHoursEnabled: boolean;
    businessStart: string;
    businessEnd: string;
  };

  tickets: {
    defaultPriority: SupportPriority;
    autoCloseResolvedHours: number;
    allowReopen: boolean;
    ticketPrefix: string;
  };

  assignment: {
    autoAssignment: boolean;
    strategy: AssignmentStrategy;
    maxOpenTicketsPerAgent: number;
    fallbackToUnassigned: boolean;
  };

  sla: {
    urgent: {
      firstResponseMinutes: number;
      resolutionMinutes: number;
    };

    high: {
      firstResponseMinutes: number;
      resolutionMinutes: number;
    };

    normal: {
      firstResponseMinutes: number;
      resolutionMinutes: number;
    };

    low: {
      firstResponseMinutes: number;
      resolutionMinutes: number;
    };

    warningBeforeMinutes: number;
    autoEscalateOnBreach: boolean;
  };

  escalation: {
    enabled: boolean;
    unresolvedAfterMinutes: number;
    slaBreachEscalation: boolean;
    notifyAdmin: boolean;
  };

  notifications: {
    newTicket: boolean;
    assignment: boolean;
    slaWarning: boolean;
    escalation: boolean;
    sound: boolean;
  };

  aiCopilot: {
    enabled: boolean;
    responseSuggestions: boolean;
    summarizeConversations: boolean;
    confidenceThreshold: number;
    requireHumanApproval: boolean;
  };

  knowledgeBase: {
    suggestionsEnabled: boolean;
    internalArticles: boolean;
    publicArticles: boolean;
  };

  savedReplies: {
    sharedEnabled: boolean;
    allowAgentCreate: boolean;
    approvalRequired: boolean;
  };

  security: {
    maskSensitiveData: boolean;
    auditAgentActions: boolean;
    requireReauthForSensitiveViews: boolean;
  };

  appearance: {
    density: SupportDensity;
    animations: boolean;
    compactSidebar: boolean;
  };
}

export interface SupportSettingsAuditItem {
  id: string;
  action: string;
  section: SupportSettingsSection;
  changedFields: string[];
  revision: number;
  occurredAt: string;
}

export interface SupportSettingsResponse {
  success: boolean;
  settings: SupportSettingsPayload;
  auditItems: SupportSettingsAuditItem[];

  meta: {
    revision: number;
    updatedAt: string;
  };
}

export interface UpdateSupportSettingsResponse {
  success: boolean;
  message: string;
  settings: SupportSettingsPayload;

  meta: {
    revision: number;
    updatedAt: string;
  };
}

/* =========================================================
   API
========================================================= */

export async function getSupportSettings():
  Promise<SupportSettingsResponse> {
  return apiClient<SupportSettingsResponse>(
    "/support/settings"
  );
}

export async function updateSupportSettingsSection<
  K extends SupportSettingsSection,
>(
  section: K,
  settings: SupportSettingsPayload[K],
  revision: number
): Promise<UpdateSupportSettingsResponse> {
  return apiClient<UpdateSupportSettingsResponse>(
    `/support/settings/${encodeURIComponent(
      section
    )}`,
    {
      method: "PATCH",

      body:
        JSON.stringify({
          settings,
          revision,
        }),
    }
  );
}
