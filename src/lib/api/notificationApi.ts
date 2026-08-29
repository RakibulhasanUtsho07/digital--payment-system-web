import {
  apiClient,
} from "@/lib/api/client";

export type NotificationType =
  | "security"
  | "transaction"
  | "budget"
  | "kyc"
  | "receipt"
  | "system";

export type NotificationPriority =
  | "critical"
  | "high"
  | "normal"
  | "low";

export interface NotificationData {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  isArchived: boolean;
  actionLink?: string;
  actionText?: string;
  amount?: number;
  currency?: string;
  merchant?: string;
}

export interface NotificationPreferences {
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };

  categories: Record<
    NotificationType,
    boolean
  >;

  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };

  digest:
    | "off"
    | "daily"
    | "weekly";
}

interface NotificationsResponse {
  success: boolean;
  unreadCount: number;
  count: number;
  notifications:
    NotificationData[];
  message?: string;
}

interface NotificationResponse {
  success: boolean;
  notification:
    NotificationData;
  message?: string;
}

interface PreferencesResponse {
  success: boolean;
  preferences:
    NotificationPreferences;
  message?: string;
}

interface ActionResponse {
  success: boolean;
  message?: string;
  modifiedCount?: number;
  id?: string;
}

function jsonRequest(
  method: string,
  body: unknown
): RequestInit {
  return {
    method,
    headers: {
      "Content-Type":
        "application/json",
    },
    body:
      JSON.stringify(
        body
      ),
  };
}

export async function fetchNotifications() {
  return apiClient<NotificationsResponse>(
    "/notifications"
  );
}

export async function markNotificationRead(
  id: string
) {
  return apiClient<NotificationResponse>(
    `/notifications/${encodeURIComponent(
      id
    )}/read`,
    {
      method: "PATCH",
    }
  );
}

export async function markAllNotificationsRead() {
  return apiClient<ActionResponse>(
    "/notifications/read-all",
    {
      method: "PATCH",
    }
  );
}

export async function archiveNotificationApi(
  id: string
) {
  return apiClient<NotificationResponse>(
    `/notifications/${encodeURIComponent(
      id
    )}/archive`,
    {
      method: "PATCH",
    }
  );
}

export async function deleteNotificationApi(
  id: string
) {
  return apiClient<ActionResponse>(
    `/notifications/${encodeURIComponent(
      id
    )}`,
    {
      method: "DELETE",
    }
  );
}

export async function runBulkNotificationAction(
  ids: string[],
  action:
    | "read"
    | "archive"
    | "delete"
) {
  return apiClient<ActionResponse>(
    "/notifications/bulk",
    jsonRequest(
      "POST",
      {
        ids,
        action,
      }
    )
  );
}

export async function fetchNotificationPreferences() {
  return apiClient<PreferencesResponse>(
    "/notifications/preferences"
  );
}

export async function saveNotificationPreferences(
  preferences:
    NotificationPreferences
) {
  return apiClient<PreferencesResponse>(
    "/notifications/preferences",
    jsonRequest(
      "PUT",
      preferences
    )
  );
}
