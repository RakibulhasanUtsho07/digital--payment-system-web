"use client";

import {
  apiClient,
} from "./client";

export type SupportAiRange =
  | "24h"
  | "7d"
  | "30d";

export type SupportAiCaseStatus =
  | "open"
  | "investigating"
  | "waiting_customer"
  | "escalated"
  | "resolved"
  | "closed";

export type SupportAiSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type SupportAiPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type SupportAiQueue =
  | "support"
  | "payments"
  | "provider"
  | "risk_security"
  | "kyc"
  | "engineering";

export interface SupportAiCommandCenterSnapshot {
  generatedAt: string;
  range: SupportAiRange;
  health: {
    status: "healthy" | "attention" | "critical";
    headline: string;
    summary: string;
  };
  overview: {
    openCases: number;
    investigatingCases: number;
    waitingCustomerCases: number;
    escalatedCases: number;
    resolvedCases: number;
    criticalOpenCases: number;
    urgentOpenCases: number;
    unassignedOpenCases: number;
    openIncidents: number;
    criticalIncidents: number;
  };
  sla: {
    breached: number;
    atRiskHigh: number;
    atRiskMedium: number;
    healthy: number;
    responded: number;
    breachRate: number;
  };
  queues: Array<{
    queue: string;
    openCases: number;
    critical: number;
    urgent: number;
    breached: number;
  }>;
  topFailureCauses: Array<{
    code: string;
    count: number;
  }>;
  providerSignals: Array<{
    code: string;
    count: number;
  }>;
  agentWorkload: Array<{
    userId: string;
    openCases: number;
    urgent: number;
    critical: number;
  }>;
  alerts: {
    open: number;
    critical: number;
    high: number;
    acknowledged: number;
  };
  alertFeed: Array<{
    alertId: string;
    type: string;
    severity: string;
    status: string;
    title: string;
    summary: string;
    lastDetectedAt: string;
  }>;
  incidents: Array<{
    incidentId: string;
    title: string;
    status: string;
    severity: string;
    queue: string;
    causeCode: string | null;
    caseCount: number;
    lastSeenAt: string;
  }>;
  recentEvents: Array<{
    caseId: string;
    eventType: string;
    summary: string;
    createdAt: string;
  }>;
  trend: Array<{
    bucket: string;
    createdCases: number;
    criticalCases: number;
    incidents: number;
  }>;
  resolutionQuality: {
    outcomesInRange: number;
    resolved: number;
    escalated: number;
    reopened: number;
    resolutionRate: number;
    escalationRate: number;
    reopenRate: number;
  };
  knowledgeLearning: {
    draft: number;
    submitted: number;
    approved: number;
    rejected: number;
    published: number;
  };
  dailyOperationsSummary: string;
}

export interface SupportAiCaseSignal {
  code: string;
  title: string;
  detail: string;
  severity: "blocker" | "warning" | "context" | "positive";
  confirmedCause: boolean;
  evidenceRefs: string[];
}

export interface SupportAiCaseTimelineSnapshot {
  at: string;
  category: string;
  label: string;
  reference: string | null;
}

export interface SupportAiCaseSource {
  type: string;
  label: string;
  reference: string;
}

export interface SupportAiCase {
  id: string;
  caseId: string;
  subjectKind: "payment" | "transaction" | "customer";
  subjectReference: string;
  customerIds: string[];
  status: SupportAiCaseStatus;
  severity: SupportAiSeverity;
  priority: SupportAiPriority;
  queue: SupportAiQueue;
  responseTargetMinutes: number;
  verification: "verified" | "partial" | "unknown";
  confidence: "high" | "medium" | "low";
  confirmedCause: {
    code: string;
    label: string;
    evidenceRefs: string[];
  } | null;
  reasonCodes: string[];
  agentSummary: string;
  customerFacingMessage: string;
  agentChecklist: string[];
  escalation: {
    required: boolean;
    team: string;
    reason: string;
  };
  correlationFingerprint: string | null;
  duplicateOfCaseId: string | null;
  relatedCaseIds: string[];
  incidentId: string | null;
  sla: {
    state: "healthy" | "at_risk" | "breached" | "responded";
    risk: "low" | "medium" | "high" | "breached";
    dueAt: string;
    responseTargetMinutes: number;
    elapsedMinutes: number;
    remainingMinutes: number;
    consumedPercent: number;
    firstResponseAt: string | null;
    explanation: string;
  };
  assignedToUserId: string | null;
  createdByUserId: string;
  lastInvestigatedAt: string;
  notes: Array<{
    id: string;
    authorUserId: string;
    body: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  signalSnapshot: SupportAiCaseSignal[];
  sourceSnapshot: SupportAiCaseSource[];
  timelineSnapshot: SupportAiCaseTimelineSnapshot[];
}

export interface SupportAiCaseEvent {
  id: string;
  caseId: string;
  eventType: string;
  actorUserId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SupportAiCorrelation {
  fingerprint: string;
  duplicateOfCaseId: string | null;
  similarCases: Array<{
    caseId: string;
    score: number;
    relation: "duplicate" | "similar";
    reasons: string[];
    status: string;
    priority: string;
    queue: string;
    updatedAt: string;
  }>;
  incident: {
    incidentId: string;
    status: string;
    severity: string;
    caseCount: number;
  } | null;
}

export interface SupportAiAlert {
  id: string;
  alertId: string;
  type: string;
  severity: SupportAiSeverity;
  status: "open" | "acknowledged" | "resolved";
  title: string;
  summary: string;
  source: {
    provider: string | null;
    failureCode: string | null;
    queue: string | null;
  };
  evidence: {
    currentWindowMinutes: number;
    baselineWindowMinutes: number;
    currentTotal: number;
    currentFailures: number;
    currentRate: number;
    baselineTotal: number;
    baselineFailures: number;
    baselineRate: number;
    deltaRatePoints: number;
    multiplier: number | null;
  };
  reasonCodes: string[];
  firstDetectedAt: string;
  lastDetectedAt: string;
  acknowledgedAt: string | null;
  acknowledgedByUserId: string | null;
  resolvedAt: string | null;
}

export interface SupportAiIncident {
  id: string;
  incidentId: string;
  title: string;
  summary: string;
  status: string;
  severity: SupportAiSeverity;
  queue: string;
  causeCode: string | null;
  signalCodes: string[];
  caseIds: string[];
  caseCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  assignedToUserId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

function queryString(
  values: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function getSupportAiCommandCenter(
  range: SupportAiRange = "24h",
  signal?: AbortSignal,
) {
  const response = await apiClient<ApiEnvelope<SupportAiCommandCenterSnapshot>>(
    `/ai/support/command-center?range=${range}`,
    { method: "GET", signal },
  );
  return response.data;
}

export async function getSupportAiHealth(signal?: AbortSignal) {
  const response = await apiClient<ApiEnvelope<{
    generatedAt: string;
    status: "ready" | "degraded";
    database: { mongoReady: boolean; readyState: number };
    ai: {
      enabled: boolean;
      provider: string;
      modelEnabled: boolean;
      knowledgeEnabled: boolean;
      paidApiRequired: boolean;
    };
    monitors: Record<string, unknown>;
    workspace: {
      openCases: number;
      activeAlerts: number;
      activeIncidents: number;
      submittedKnowledgeDrafts: number;
    };
    security: {
      financialMutation: false;
      supportRoleRequired: true;
      adminApprovalRequiredForKnowledgePublish: true;
    };
  }>>(
    "/ai/support/health",
    { method: "GET", signal },
  );
  return response.data;
}

export async function listSupportAiCases(input: {
  page?: number;
  limit?: number;
  status?: string;
  queue?: string;
  priority?: string;
  mine?: boolean;
  signal?: AbortSignal;
} = {}) {
  const response = await apiClient<ApiEnvelope<{
    cases: SupportAiCase[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>>(
    `/ai/support/cases${queryString({
      page: input.page,
      limit: input.limit,
      status: input.status,
      queue: input.queue,
      priority: input.priority,
      mine: input.mine,
    })}`,
    { method: "GET", signal: input.signal },
  );
  return response.data;
}

export async function createOrRefreshSupportAiCase(input: {
  message: string;
  resourceId?: string;
  assignToMe?: boolean;
}) {
  const response = await apiClient<ApiEnvelope<{
    case: SupportAiCase;
    investigation: Record<string, unknown>;
    created: boolean;
  }>>(
    "/ai/support/cases",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function getSupportAiCase(caseId: string, signal?: AbortSignal) {
  const response = await apiClient<ApiEnvelope<SupportAiCase>>(
    `/ai/support/cases/${encodeURIComponent(caseId)}`,
    { method: "GET", signal },
  );
  return response.data;
}

export async function updateSupportAiCase(input: {
  caseId: string;
  status?: SupportAiCaseStatus;
  assignToMe?: boolean;
}) {
  const response = await apiClient<ApiEnvelope<SupportAiCase>>(
    `/ai/support/cases/${encodeURIComponent(input.caseId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
        assignToMe: input.assignToMe,
      }),
    },
  );
  return response.data;
}

export async function addSupportAiCaseNote(input: {
  caseId: string;
  body: string;
}) {
  const response = await apiClient<ApiEnvelope<SupportAiCase>>(
    `/ai/support/cases/${encodeURIComponent(input.caseId)}/notes`,
    {
      method: "POST",
      body: JSON.stringify({ body: input.body }),
    },
  );
  return response.data;
}

export async function getSupportAiCaseTimeline(caseId: string, signal?: AbortSignal) {
  const response = await apiClient<ApiEnvelope<{ timeline: SupportAiCaseEvent[] }>>(
    `/ai/support/cases/${encodeURIComponent(caseId)}/timeline`,
    { method: "GET", signal },
  );
  return response.data.timeline;
}

export async function getSupportAiCaseCorrelation(caseId: string, signal?: AbortSignal) {
  const response = await apiClient<ApiEnvelope<SupportAiCorrelation>>(
    `/ai/support/cases/${encodeURIComponent(caseId)}/correlation`,
    { method: "GET", signal },
  );
  return response.data;
}

export async function listSupportAiAlerts(input: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  type?: string;
  signal?: AbortSignal;
} = {}) {
  const response = await apiClient<ApiEnvelope<{
    alerts: SupportAiAlert[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>>(
    `/ai/support/alerts${queryString({
      page: input.page,
      limit: input.limit,
      status: input.status,
      severity: input.severity,
      type: input.type,
    })}`,
    { method: "GET", signal: input.signal },
  );
  return response.data;
}

export async function evaluateSupportAiAlerts() {
  const response = await apiClient<ApiEnvelope<{
    evaluatedAt: string;
    generated: Array<{
      alertId: string;
      type: string;
      severity: string;
      title: string;
      fingerprint: string;
    }>;
    resolved: string[];
    metrics: Record<string, number>;
  }>>(
    "/ai/support/alerts/evaluate",
    { method: "POST" },
  );
  return response.data;
}

export async function updateSupportAiAlert(input: {
  alertId: string;
  status: "acknowledged" | "resolved";
}) {
  const response = await apiClient<ApiEnvelope<SupportAiAlert>>(
    `/ai/support/alerts/${encodeURIComponent(input.alertId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: input.status }),
    },
  );
  return response.data;
}

export async function listSupportAiIncidents(input: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  signal?: AbortSignal;
} = {}) {
  const response = await apiClient<ApiEnvelope<{
    incidents: SupportAiIncident[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>>(
    `/ai/support/incidents${queryString({
      page: input.page,
      limit: input.limit,
      status: input.status,
      severity: input.severity,
    })}`,
    { method: "GET", signal: input.signal },
  );
  return response.data;
}

export async function updateSupportAiIncident(input: {
  incidentId: string;
  status?: string;
  assignToMe?: boolean;
}) {
  const response = await apiClient<ApiEnvelope<{
    incidentId: string;
    status: string;
    severity: string;
    queue: string;
    caseCount: number;
    assignedToUserId: string | null;
    updatedAt: string;
  }>>(
    `/ai/support/incidents/${encodeURIComponent(input.incidentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
        assignToMe: input.assignToMe,
      }),
    },
  );
  return response.data;
}

export async function getSupportAiQuality(range: "7d" | "30d" | "90d" = "30d", signal?: AbortSignal) {
  const response = await apiClient<ApiEnvelope<any>>(
    `/ai/support/quality?range=${range}`,
    { method: "GET", signal },
  );
  return response.data;
}

export async function listSupportKnowledgeDrafts(input: {
  status?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
} = {}) {
  const response = await apiClient<ApiEnvelope<{
    drafts: Array<{
      id: string;
      draftId: string;
      sourceCaseId: string;
      sourceOutcomeId: string;
      sourcePlaybookRunId: string | null;
      sourcePlaybookId: string | null;
      confirmedCauseCode: string;
      resolutionCode: string;
      queue: string;
      title: string;
      slug: string;
      summary: string;
      content: string;
      category: string;
      tags: string[];
      evidenceRefs: string[];
      status: "draft" | "submitted" | "approved" | "rejected" | "published";
      submittedAt: string | null;
      reviewedAt: string | null;
      reviewNote: string | null;
      publishedArticleId: string | null;
      publishedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>>(
    `/ai/support/knowledge-drafts${queryString({
      status: input.status,
      page: input.page,
      limit: input.limit,
    })}`,
    { method: "GET", signal: input.signal },
  );
  return response.data;
}

export async function createSupportKnowledgeDraft(caseId: string) {
  const response = await apiClient<ApiEnvelope<{
    created: boolean;
    draft: Record<string, unknown>;
  }>>(
    `/ai/support/cases/${encodeURIComponent(caseId)}/knowledge-draft`,
    { method: "POST" },
  );
  return response.data;
}

export async function submitSupportKnowledgeDraft(draftId: string) {
  const response = await apiClient<ApiEnvelope<Record<string, unknown>>>(
    `/ai/support/knowledge-drafts/${encodeURIComponent(draftId)}/submit`,
    { method: "POST" },
  );
  return response.data;
}

export async function recommendSupportCasePlaybooks(caseId: string, signal?: AbortSignal) {
  const response = await apiClient<ApiEnvelope<{
    caseId: string;
    recommendations: Array<{
      playbook: {
        id: string;
        title: string;
        description: string;
        defaultQueue: string;
        customerMessageTemplate: string;
        steps: Array<{
          id: string;
          order: number;
          kind: string;
          title: string;
          instruction: string;
          required: boolean;
          safeCustomerFacing: boolean;
          requiresHumanConfirmation: boolean;
          prohibitedActions?: string[];
        }>;
      };
      score: number;
      confidence: "high" | "medium" | "low";
      reasons: string[];
    }>;
  }>>(
    `/ai/support/cases/${encodeURIComponent(caseId)}/playbooks/recommend`,
    { method: "GET", signal },
  );
  return response.data;
}

export async function startSupportCasePlaybook(input: {
  caseId: string;
  playbookId: string;
}) {
  const response = await apiClient<ApiEnvelope<Record<string, unknown>>>(
    `/ai/support/cases/${encodeURIComponent(input.caseId)}/playbooks/start`,
    {
      method: "POST",
      body: JSON.stringify({ playbookId: input.playbookId }),
    },
  );
  return response.data;
}
