import { apiClient } from "@/lib/api/client";

import type {
  AdminIdentityRisk,
  AdminSecurityAudit,
  AdminSecurityEvent,
  AdminSecurityOverview,
  AdminSecurityPolicies,
  AdminSecurityRange,
  AdminSecuritySession,
  PaginationMeta,
} from "../../types/adminSecurity.types";

function queryString(
  input: Record<
    string,
    string | number | undefined
  >
): string {
  const query =
    new URLSearchParams();

  Object.entries(input).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        String(value).trim()
      ) {
        query.set(
          key,
          String(value)
        );
      }
    }
  );

  return query.toString();
}

export function getAdminSecurityOverview(
  range: AdminSecurityRange
) {
  return apiClient<{
    success: true;
    security: AdminSecurityOverview;
  }>(
    `/admin/security/overview?range=${range}`,
    {
      method: "GET",
    }
  );
}

export function getAdminSecurityEvents(
  input: {
    page?: number;
    limit?: number;
    status?: string;
    eventType?: string;
    search?: string;
  } = {}
) {
  return apiClient<{
    success: true;
    events: AdminSecurityEvent[];
    pagination: PaginationMeta;
  }>(
    `/admin/security/events?${queryString(
      input
    )}`,
    {
      method: "GET",
    }
  );
}

export function getAdminSecuritySessions(
  input: {
    page?: number;
    limit?: number;
    risk?: string;
    search?: string;
  } = {}
) {
  return apiClient<{
    success: true;
    sessions: AdminSecuritySession[];
    pagination: PaginationMeta;
  }>(
    `/admin/security/sessions?${queryString(
      input
    )}`,
    {
      method: "GET",
    }
  );
}

export function getAdminIdentityRisk(
  input: {
    page?: number;
    limit?: number;
    risk?: string;
    search?: string;
  } = {}
) {
  return apiClient<{
    success: true;
    identities: AdminIdentityRisk[];
    pagination: PaginationMeta;
  }>(
    `/admin/security/identities/risk?${queryString(
      input
    )}`,
    {
      method: "GET",
    }
  );
}

export function getAdminSecurityPolicies() {
  return apiClient<{
    success: true;
    policies: AdminSecurityPolicies;
  }>(
    "/admin/security/policies",
    {
      method: "GET",
    }
  );
}

export function getAdminSecurityAudit(
  input: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) {
  return apiClient<{
    success: true;
    audit: AdminSecurityAudit[];
    pagination: PaginationMeta;
  }>(
    `/admin/security/audit?${queryString(
      input
    )}`,
    {
      method: "GET",
    }
  );
}