export type AdminSecurityRange = "24h" | "7d" | "30d" | "90d";
export type AdminSecurityRisk = "low" | "medium" | "high";
export type AdminSecurityPosture = "healthy" | "attention" | "critical";

export interface AdminSecurityUserRef {
  id: string;
  name: string;
  role: string;
}

export interface AdminSecurityEvent {
  id: string;
  user: AdminSecurityUserRef | null;
  eventType: string;
  title: string;
  status: "success" | "warning" | "info";
  detail: string;
  device: string;
  location: string;
  maskedIp: string;
  sessionId: null;
  createdAt: string;
}

export interface AdminSecuritySession {
  id: string;
  user: AdminSecurityUserRef | null;
  device: string;
  browser: string;
  os: string;
  location: string;
  maskedIp: string;
  risk: AdminSecurityRisk;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface AdminIdentityRisk {
  id: string;
  name: string;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  passkeyEnabled: boolean;
  activeSessions: number;
  passwordChangedAt: string | null;
  risk: AdminSecurityRisk;
  riskReasons: string[];
  createdAt: string;
}

export interface AdminSecurityAudit {
  id: string;
  actor: AdminSecurityUserRef | null;
  action: string;
  resource: string;
  maskedIp: string;
  metadataSummary: string;
  createdAt: string;
}

export interface AdminSecurityTimelinePoint {
  timestamp: string;
  label: string;
  total: number;
  successfulLogins: number;
  failedLogins: number;
  suspiciousLogins: number;
}

export interface AdminSecurityServiceHealth {
  service: string;
  status: AdminSecurityPosture | "unknown";
  totalEvents: number;
  failures: number;
  criticalEvents: number;
  failureRate: number;
  lastEventAt: string | null;
}

export interface AdminSecurityPolicies {
  security: {
    requireMfa: boolean;
    sessionTimeoutMins: number;
    maxLoginAttempts: number;
    requireReauthForSensitiveActions: boolean;
  };
  risk: {
    dailyTransferLimit: number;
    reviewThreshold: number;
    requireKycForHighValue: boolean;
    velocityWindowMinutes: number;
    maxTransfersPerWindow: number;
  };
  revision: number;
  updatedAt: string;
  mode: "read-only";
}

export interface AdminSecurityOverview {
  generatedAt: string;
  range: AdminSecurityRange;
  posture: {
    score: number;
    status: AdminSecurityPosture;
    label: string;
  };
  metrics: {
    activeUsers: number;
    activeSessions: number;
    failedLogins: number;
    suspiciousLogins: number;
    criticalSystemEvents: number;
    warningEvents: number;
    mfaUsers: number;
    mfaCoverage: number;
    passkeyUsers: number;
    passkeyCoverage: number;
  };
  distribution: {
    successful: number;
    failed: number;
    suspicious: number;
    warning: number;
    critical: number;
  };
  timeline: AdminSecurityTimelinePoint[];
  services: AdminSecurityServiceHealth[];
  recentEvents: AdminSecurityEvent[];
  policies: AdminSecurityPolicies["security"] & {
    revision: number;
    updatedAt: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
