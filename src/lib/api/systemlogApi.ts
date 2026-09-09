"use client";

import { apiClient } from "./client";

/* =========================================================
   TYPES
========================================================= */

export type SystemLogsRange =
  | "1h"
  | "6h"
  | "24h"
  | "7d"
  | "30d";

export type LogLevel =
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "NOTICE"
  | "WARN"
  | "ERROR"
  | "CRITICAL";

export type LogService =
  | "API"
  | "Authentication"
  | "Database"
  | "Wallet"
  | "Transactions"
  | "Transfers"
  | "KYC"
  | "Notifications"
  | "Cloudinary"
  | "AI"
  | "Background Jobs"
  | "System"
  | "Security"
  | "Support"
  | "Revenue";

export type LogEnvironment =
  | "Development"
  | "Staging"
  | "Production";

export type LogResult =
  | "Success"
  | "Failed"
  | "Timeout"
  | "Retried";

/* =========================================================
   SYSTEM LOG
========================================================= */

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
  userId?: string;
  userName?: string;

  source: string;
  endpoint?: string;
  method?: string;

  statusCode?: number;
  durationMs?: number;

  environment: LogEnvironment;
  result: LogResult;
}

/* =========================================================
   SUMMARY
========================================================= */

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

/* =========================================================
   SERVICE HEALTH
========================================================= */

export interface ServiceHealth {
  id: string;

  name: string;
  category: string;

  status:
    | "Operational"
    | "Degraded"
    | "Warning"
    | "Down"
    | "Maintenance";

  uptime: string;

  responseTimeMs: number;

  errorRate: string;

  requestCount: string;

  lastError: string;

  observedSuccessRate: number;

  lastSeenAt: string | null;
}

/* =========================================================
   HEATMAP
========================================================= */

export interface HeatmapCell {
  day: string;
  hour: string;

  events: number;
  errors: number;

  severity:
    | "normal"
    | "active"
    | "warning"
    | "failure";
}

/* =========================================================
   ANOMALY
========================================================= */

export interface SystemAnomaly {
  service: LogService;

  type:
    | "error_rate"
    | "latency";

  severity:
    | "high"
    | "medium";

  changePct: number;

  current: number;

  baseline: number;

  message: string;
}

/* =========================================================
   TRACE
========================================================= */

export interface SystemTraceSpan {
  id: string;

  service: LogService;

  event: string;

  duration: number;

  startOffset: number;

  status:
    | "ok"
    | "error";

  timestamp: string;
}

export interface SystemTraceData {
  traceId: string;

  totalDurationMs: number;

  spans: SystemTraceSpan[];
}

/* =========================================================
   ROOT CAUSE
========================================================= */

export interface RootCauseNode {
  id: string;

  order: number;

  service: LogService;

  event: string;

  type:
    | "critical"
    | "error"
    | "warn"
    | "ok";

  detail: string;

  timestamp: string;

  durationMs?: number;
}

export interface RootCauseData {
  requestId: string;

  nodes: RootCauseNode[];
}

/* =========================================================
   PAGINATION
========================================================= */

export interface LogsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/* =========================================================
   LOG LIST RESPONSE
========================================================= */

export interface LogsResponse {
  success: boolean;

  pagination: LogsPagination;

  logs: SystemLog[];

  message?: string;
}

/* =========================================================
   API RESPONSES
========================================================= */

interface SummaryResponse {
  success: boolean;
  summary: SystemLogsSummary;
  message?: string;
}

interface ServicesResponse {
  success: boolean;
  range: string;
  services: ServiceHealth[];
  message?: string;
}

interface HeatmapResponse {
  success: boolean;
  range: string;
  timezone: string;
  cells: HeatmapCell[];
  message?: string;
}

interface AnomaliesResponse {
  success: boolean;

  windowMinutes: number;

  currentWindow: {
    from: string;
    to: string;
  };

  baselineWindow: {
    from: string;
    to: string;
  };

  anomalies: SystemAnomaly[];

  message?: string;
}

interface LogDetailResponse {
  success: boolean;
  log: SystemLog;
  message?: string;
}

interface TraceResponse {
  success: boolean;

  traceId: string;

  totalDurationMs: number;

  spans: SystemTraceSpan[];

  message?: string;
}

interface RootCauseResponse {
  success: boolean;

  requestId: string;

  nodes: RootCauseNode[];

  message?: string;
}

/* =========================================================
   GET LOGS PARAMS
========================================================= */

export interface GetLogsParams {
  search?: string;

  level?: LogLevel | "";

  service?: LogService | "";

  environment?: LogEnvironment | "";

  range?: SystemLogsRange;

  page?: number;

  limit?: number;
}

/* =========================================================
   QUERY BUILDER
========================================================= */

function createQuery(
  values: Record<
    string,
    string | number | undefined
  >
): string {
  const params =
    new URLSearchParams();

  Object.entries(values).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === ""
      ) {
        return;
      }

      params.set(
        key,
        String(value)
      );
    }
  );

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

/* =========================================================
   API
========================================================= */

export const systemLogsApi = {
  /* =======================================================
     SUMMARY
     
     GET /api/admin/logs/summary
  ======================================================= */

  getSummary: async (
    range: SystemLogsRange
  ): Promise<SummaryResponse> => {
    return apiClient<SummaryResponse>(
      `/admin/logs/summary${createQuery(
        {
          range,
        }
      )}`
    );
  },

  /* =======================================================
     SERVICES
     
     GET /api/admin/logs/services
  ======================================================= */

  getServices: async (
    range: SystemLogsRange
  ): Promise<ServicesResponse> => {
    return apiClient<ServicesResponse>(
      `/admin/logs/services${createQuery(
        {
          range,
        }
      )}`
    );
  },

  /* =======================================================
     HEATMAP
     
     GET /api/admin/logs/heatmap
  ======================================================= */

  getHeatmap: async (
    range: SystemLogsRange
  ): Promise<HeatmapResponse> => {
    return apiClient<HeatmapResponse>(
      `/admin/logs/heatmap${createQuery(
        {
          range,
        }
      )}`
    );
  },

  /* =======================================================
     ANOMALIES
     
     GET /api/admin/logs/anomalies
  ======================================================= */

  getAnomalies: async (
    windowMinutes: number
  ): Promise<AnomaliesResponse> => {
    return apiClient<AnomaliesResponse>(
      `/admin/logs/anomalies${createQuery(
        {
          windowMinutes,
        }
      )}`
    );
  },

  /* =======================================================
     LOG LIST
     
     GET /api/admin/logs
  ======================================================= */

  getLogs: async (
    params: GetLogsParams
  ): Promise<LogsResponse> => {
    return apiClient<LogsResponse>(
      `/admin/logs${createQuery(
        {
          search:
            params.search,

          level:
            params.level,

          service:
            params.service,

          environment:
            params.environment,

          range:
            params.range,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    );
  },

  /* =======================================================
     SINGLE LOG
     
     GET /api/admin/logs/:id
  ======================================================= */

  getLog: async (
    id: string
  ): Promise<LogDetailResponse> => {
    if (!id.trim()) {
      throw new Error(
        "Log id is required."
      );
    }

    return apiClient<LogDetailResponse>(
      `/admin/logs/${encodeURIComponent(
        id
      )}`
    );
  },

  /* =======================================================
     TRACE
     
     GET /api/admin/logs/traces/:traceId
  ======================================================= */

  getTrace: async (
    traceId: string
  ): Promise<SystemTraceData> => {
    if (!traceId.trim()) {
      throw new Error(
        "Trace id is required."
      );
    }

    const response =
      await apiClient<TraceResponse>(
        `/admin/logs/traces/${encodeURIComponent(
          traceId
        )}`
      );

    if (!response.success) {
      throw new Error(
        response.message ??
          "Failed to load trace."
      );
    }

    return {
      traceId:
        response.traceId,

      totalDurationMs:
        Number(
          response.totalDurationMs ??
            0
        ),

      spans:
        Array.isArray(
          response.spans
        )
          ? response.spans
          : [],
    };
  },

  /* =======================================================
     ROOT CAUSE
     
     GET /api/admin/logs/root-cause/:requestId
  ======================================================= */

  getRootCause: async (
    requestId: string
  ): Promise<RootCauseData> => {
    if (!requestId.trim()) {
      throw new Error(
        "Request id is required."
      );
    }

    const response =
      await apiClient<RootCauseResponse>(
        `/admin/logs/root-cause/${encodeURIComponent(
          requestId
        )}`
      );

    if (!response.success) {
      throw new Error(
        response.message ??
          "Failed to load root cause data."
      );
    }

    return {
      requestId:
        response.requestId,

      nodes:
        Array.isArray(
          response.nodes
        )
          ? response.nodes
          : [],
    };
  },
};

/* =========================================================
   EXPORT LOGS
========================================================= */

export async function downloadSystemLogsExport(
  range: SystemLogsRange,
  options: {
    search?: string;
    level?: LogLevel | "";
    service?: LogService | "";
    environment?: LogEnvironment | "";
  } = {}
): Promise<void> {
  const query =
    createQuery({
      range,

      search:
        options.search,

      level:
        options.level,

      service:
        options.service,

      environment:
        options.environment,
    });

  /*
   * Use the same apiClient authentication
   * layer instead of duplicating the base URL,
   * token handling, and credentials logic.
   *
   * However, the export endpoint returns a file,
   * so native fetch is required here.
   */

  const baseUrl =
    (
      process.env
        .NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api"
    ).replace(
      /\/$/,
      ""
    );

  const token =
    typeof window !==
    "undefined"
      ? window.localStorage.getItem(
          "digital_wallet_token"
        )
      : null;

  const headers =
    new Headers();

  headers.set(
    "Accept",
    "application/json"
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response =
    await fetch(
      `${baseUrl}/admin/logs/export${query}`,
      {
        method: "GET",

        credentials:
          "include",

        cache:
          "no-store",

        headers,
      }
    );

  if (!response.ok) {
    let message =
      "Failed to export system logs.";

    try {
      const payload =
        (await response.json()) as {
          message?: string;
          error?: string;
        };

      message =
        payload.message ??
        payload.error ??
        message;
    } catch {
      // Keep fallback message.
    }

    throw new Error(
      message
    );
  }

  const blob =
    await response.blob();

  const disposition =
    response.headers.get(
      "content-disposition"
    );

  const filename =
    extractFilename(
      disposition
    ) ??
    `system-logs-${new Date()
      .toISOString()
      .slice(
        0,
        10
      )}.json`;

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href = url;
  anchor.download =
    filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(
      url
    );
  }, 1000);
}

/* =========================================================
   FILENAME HELPER
========================================================= */

function extractFilename(
  disposition: string | null
): string | null {
  if (!disposition) {
    return null;
  }

  const utf8Match =
    disposition.match(
      /filename\*=UTF-8''([^;]+)/i
    );

  if (
    utf8Match?.[1]
  ) {
    try {
      return decodeURIComponent(
        utf8Match[1]
      );
    } catch {
      return utf8Match[1];
    }
  }

  const regularMatch =
    disposition.match(
      /filename="?([^"]+)"?/i
    );

  return (
    regularMatch?.[1] ??
    null
  );
}