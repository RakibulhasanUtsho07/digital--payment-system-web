"use client";

import { apiClient } from "./client";

export type SystemLogsRange = "1h" | "6h" | "24h" | "7d" | "30d";
export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "NOTICE" | "WARN" | "ERROR" | "CRITICAL";
export type LogService =
  | "API" | "Authentication" | "Database" | "Wallet" | "Transactions"
  | "Transfers" | "KYC" | "Notifications" | "Cloudinary" | "AI"
  | "Background Jobs" | "System" | "Security" | "Support" | "Revenue";
export type LogEnvironment = "Development" | "Staging" | "Production";
export type LogResult = "Success" | "Failed" | "Timeout" | "Retried";

export interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: LogService;
  category: string;
  event: string;
  message: string;
  requestId?: string;
  traceId?: string;
  transactionId?: string;
  source: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  environment: LogEnvironment;
  result: LogResult;
}

export interface SystemLogsSummary {
  range: string;
  healthScore: number;
  totalEvents: number;
  errorEvents: number;
  warningEvents: number;
  criticalEvents: number;
  servicesObserved: number;
  servicesNeedingAttention: number;
  lastUpdatedAt: string | null;
}

export interface ServiceHealth {
  id: string;
  name: string;
  category: string;
  status: "Operational" | "Degraded" | "Warning" | "Down" | "Maintenance";
  uptime: string;
  responseTimeMs: number;
  errorRate: string;
  requestCount: string;
  lastError: string;
  observedSuccessRate: number;
  lastSeenAt: string | null;
}

export interface HeatmapCell {
  day: string;
  hour: string;
  events: number;
  errors: number;
  severity: "normal" | "active" | "warning" | "failure";
}

export interface SystemAnomaly {
  service: LogService;
  type: "error_rate" | "latency";
  severity: "high" | "medium";
  changePct: number;
  current: number;
  baseline: number;
  message: string;
}

export interface SystemTraceSpan {
  id: string;
  service: LogService;
  event: string;
  duration: number;
  startOffset: number;
  status: "ok" | "error";
  timestamp: string;
}

export interface SystemTraceData {
  traceId: string;
  totalDurationMs: number;
  spans: SystemTraceSpan[];
}

export interface RootCauseNode {
  id: string;
  order: number;
  service: LogService;
  event: string;
  type: "critical" | "error" | "warn" | "ok";
  detail: string;
  timestamp: string;
  durationMs?: number;
}

export interface RootCauseData {
  requestId: string;
  nodes: RootCauseNode[];
}

export interface LogsResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  logs: SystemLog[];
}

interface SummaryResponse { success: boolean; summary: SystemLogsSummary; }
interface ServicesResponse { success: boolean; range: string; services: ServiceHealth[]; }
interface HeatmapResponse { success: boolean; range: string; timezone: string; cells: HeatmapCell[]; }
interface AnomaliesResponse {
  success: boolean;
  windowMinutes: number;
  currentWindow: { from: string; to: string };
  baselineWindow: { from: string; to: string };
  anomalies: SystemAnomaly[];
}
interface LogDetailResponse { success: boolean; log: SystemLog; }
interface TraceResponse { success: boolean; traceId: string; totalDurationMs: number; spans: SystemTraceSpan[]; }
interface RootCauseResponse { success: boolean; requestId: string; nodes: RootCauseNode[]; }

export interface GetLogsParams {
  search?: string;
  level?: LogLevel | "";
  service?: LogService | "";
  environment?: LogEnvironment | "";
  range?: SystemLogsRange;
  page?: number;
  limit?: number;
}

const createQuery = (
  values: Record<string, string | number | undefined>
) => {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const systemLogsApi = {
  getSummary: async (range: SystemLogsRange) =>
    apiClient<SummaryResponse>(
      `/admin/logs/summary${createQuery({ range })}`
    ),

  getServices: async (range: SystemLogsRange) =>
    apiClient<ServicesResponse>(
      `/admin/logs/services${createQuery({ range })}`
    ),

  getHeatmap: async (range: SystemLogsRange) =>
    apiClient<HeatmapResponse>(
      `/admin/logs/heatmap${createQuery({ range })}`
    ),

  getAnomalies: async (windowMinutes: number) =>
    apiClient<AnomaliesResponse>(
      `/admin/logs/anomalies${createQuery({ windowMinutes })}`
    ),

  getLogs: async (params: GetLogsParams) =>
    apiClient<LogsResponse>(
      `/admin/logs${createQuery({
        search: params.search,
        level: params.level,
        service: params.service,
        environment: params.environment,
        range: params.range,
        page: params.page,
        limit: params.limit,
      })}`
    ),

  getLog: async (id: string) =>
    apiClient<LogDetailResponse>(
      `/admin/logs/${encodeURIComponent(id)}`
    ),

  getTrace: async (traceId: string): Promise<SystemTraceData> => {
    const response = await apiClient<TraceResponse>(
      `/admin/logs/traces/${encodeURIComponent(traceId)}`
    );

    return {
      traceId: response.traceId,
      totalDurationMs: response.totalDurationMs,
      spans: response.spans,
    };
  },

  getRootCause: async (requestId: string): Promise<RootCauseData> => {
    const response = await apiClient<RootCauseResponse>(
      `/admin/logs/root-cause/${encodeURIComponent(requestId)}`
    );

    return {
      requestId: response.requestId,
      nodes: response.nodes,
    };
  },
};

export const downloadSystemLogsExport = async (
  range: SystemLogsRange
) => {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000/api"
  ).replace(/\/$/, "");

  const response = await fetch(
    `${baseUrl}/admin/logs/export${createQuery({ range })}`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    let message = "Failed to export system logs.";

    try {
      const data = (await response.json()) as { message?: string };
      message = data.message || message;
    } catch {
      // Keep fallback.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  const filename =
    match?.[1] ||
    `system-logs-${new Date().toISOString().slice(0, 10)}.json`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
