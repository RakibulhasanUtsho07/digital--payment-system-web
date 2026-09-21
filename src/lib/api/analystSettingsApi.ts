"use client";

import { apiClient } from "./client";

export type AnalystSettingsSection =
  | "general"
  | "dataScope"
  | "providerMonitoring"
  | "alerts"
  | "risk"
  | "anomalies"
  | "reports"
  | "aiInsights"
  | "export"
  | "appearance";

export type AnalystSettingsRange = "24h" | "7d" | "30d" | "90d";
export type AnalystSettingsMode = "all" | "test" | "live";
export type AnalystRiskSource = "all" | "wallet" | "card" | "paypal" | "local_psp";
export type AnalystReportFormat = "executive" | "payments" | "risk" | "revenue";
export type AnalystInsightSeverity = "critical" | "high" | "medium" | "info" | "positive";
export type AnalystDensity = "comfortable" | "compact";

export interface AnalystSettingsPayload {
  general: {
    defaultRange: AnalystSettingsRange;
    defaultMode: AnalystSettingsMode;
    currency: string;
    timezone: string;
    autoRefreshSeconds: number;
  };
  dataScope: {
    provider: string;
    riskSource: AnalystRiskSource;
  };
  providerMonitoring: {
    warningSuccessRate: number;
    criticalSuccessRate: number;
    maxAverageCompletionSeconds: number;
  };
  alerts: {
    enabled: boolean;
    critical: boolean;
    high: boolean;
    medium: boolean;
    info: boolean;
    positive: boolean;
  };
  risk: {
    highRiskRateWarning: number;
    paymentFailureRateWarning: number;
    disputeExposureRateWarning: number;
  };
  anomalies: {
    enabled: boolean;
    sensitivity: "low" | "medium" | "high";
    baselineDays: number;
    minimumSampleSize: number;
  };
  reports: {
    defaultFormat: AnalystReportFormat;
    defaultRange: AnalystSettingsRange;
    defaultMode: AnalystSettingsMode;
  };
  aiInsights: {
    enabled: boolean;
    minimumSeverity: AnalystInsightSeverity;
    showRecommendedActions: boolean;
  };
  export: {
    defaultFormat: "csv";
    fileNamePrefix: string;
  };
  appearance: {
    density: AnalystDensity;
    animations: boolean;
    chartMotion: boolean;
  };
}

export interface AnalystSettingsAuditItem {
  id: string;
  action: "SECTION_UPDATED";
  section: AnalystSettingsSection;
  changedFields: string[];
  revision: number;
  actorRole: string;
  occurredAt: string;
}

export interface AnalystLiveSourceState {
  available: boolean;
  error?: string;
}

export interface AnalystSettingsLiveSnapshot {
  generatedAt: string;
  filters: {
    range: AnalystSettingsRange;
    mode: AnalystSettingsMode;
    currency: string;
    provider: string;
    riskSource: AnalystRiskSource;
  };
  sources: {
    overview: AnalystLiveSourceState;
    pulse: AnalystLiveSourceState;
    providers: AnalystLiveSourceState;
    risk: AnalystLiveSourceState;
    reports: AnalystLiveSourceState;
  };
  overview: null | {
    status: "healthy" | "attention" | "critical";
    paymentVolumeMinor: number;
    paymentCount: number;
    successRate: number;
    activeUsers: number;
    activeMerchants: number;
    failedPaymentCount: number;
    highRiskTransactionCount: number;
  };
  pulse: null | {
    status: "healthy" | "attention" | "critical";
    last60AttemptCount: number;
    last60CompletedCount: number;
    last60FailedCount: number;
    last60SuccessRate: number;
    highRiskTransactionCount: number;
    stalePaymentCount: number;
    alertCount: number;
    providerCount: number;
    refreshAfterSeconds: number;
  };
  providers: null | {
    status: "healthy" | "attention" | "critical";
    totalProviders: number;
    healthyProviders: number;
    attentionProviders: number;
    criticalProviders: number;
    overallSuccessRate: number;
    averageCompletionSeconds: number;
    topProvider: null | {
      provider: string;
      successRate: number;
      attemptCount: number;
    };
    weakestProvider: null | {
      provider: string;
      successRate: number;
      attemptCount: number;
    };
  };
  risk: null | {
    status: "healthy" | "attention" | "critical";
    riskSignalCount: number;
    highRiskTransactions: number;
    highRiskTransactionRate: number;
    failedPayments: number;
    failedTransactions: number;
  };
  reports: null | {
    totalRecent: number;
    ready: number;
    processing: number;
    failed: number;
    latestCreatedAt: string | null;
  };
}

export interface AnalystSettingsResponse {
  success: boolean;
  settings: AnalystSettingsPayload;
  auditItems: AnalystSettingsAuditItem[];
  meta: { revision: number; updatedAt: string };
}

export interface AnalystSettingsUpdateResponse {
  success: boolean;
  message: string;
  settings: AnalystSettingsPayload;
  meta: { revision: number; updatedAt: string };
}

export interface AnalystSettingsLiveResponse {
  success: boolean;
  live: AnalystSettingsLiveSnapshot;
}

export const getAnalystSettings = () =>
  apiClient<AnalystSettingsResponse>("/analyst/settings");

export const getAnalystSettingsLive = () =>
  apiClient<AnalystSettingsLiveResponse>("/analyst/settings/live");

export function updateAnalystSettingsSection<K extends AnalystSettingsSection>(
  section: K,
  settings: AnalystSettingsPayload[K],
  revision: number
) {
  return apiClient<AnalystSettingsUpdateResponse>(
    `/analyst/settings/${encodeURIComponent(section)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ settings, revision }),
    }
  );
}
