import type {
  HeatmapCell,
  LogEnvironment,
  LogLevel,
  LogResult,
  LogService,
  RootCauseData,
  RootCauseNode,
  ServiceHealth,
  SystemAnomaly,
  SystemLog,
  SystemLogsRange,
  SystemLogsSummary,
  SystemTraceData,
  SystemTraceSpan,
} from "@/lib/api/systemlogApi";

/* =========================================================
   RE-EXPORTED API TYPES
========================================================= */

export type {
  LogEnvironment,
  LogLevel,
  LogResult,
  LogService,
  SystemLogsRange,
};

/* =========================================================
   MAIN SYSTEM LOG
========================================================= */

export type {
  SystemLog,
};

/* =========================================================
   SUMMARY
========================================================= */

export type {
  SystemLogsSummary,
};

/* =========================================================
   SERVICE HEALTH
========================================================= */

export type {
  ServiceHealth,
};

/* =========================================================
   HEATMAP
========================================================= */

export type {
  HeatmapCell,
};

/* =========================================================
   ANOMALY
========================================================= */

export type {
  SystemAnomaly,
};

/* =========================================================
   TRACE
========================================================= */

export type {
  SystemTraceData,
  SystemTraceSpan,
};

/* =========================================================
   ROOT CAUSE
========================================================= */

export type {
  RootCauseData,
  RootCauseNode,
};

/* =========================================================
   COMMON UI TYPES
========================================================= */

export type LogSeverity =
  | "low"
  | "medium"
  | "high";

export type LogStatus =
  | "success"
  | "warning"
  | "error"
  | "critical";

/* =========================================================
   LOG FILTER STATE
========================================================= */

export interface SystemLogFilters {
  search: string;
  level: LogLevel | "";
  service: LogService | "";
  environment: LogEnvironment | "";
  range: SystemLogsRange;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface SystemLogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/* =========================================================
   LOG LIST STATE
========================================================= */

export interface SystemLogListState {
  logs: SystemLog[];
  pagination: SystemLogPagination;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

/* =========================================================
   TRACE SELECTION STATE
========================================================= */

export interface TraceSelectionState {
  trace: SystemTraceData | null;
  loading: boolean;
  error: string | null;
}

/* =========================================================
   ROOT CAUSE STATE
========================================================= */

export interface RootCauseSelectionState {
  rootCause: RootCauseData | null;
  loading: boolean;
  error: string | null;
}

/* =========================================================
   ANOMALY STATE
========================================================= */

export interface AnomalyState {
  anomalies: SystemAnomaly[];
  windowMinutes: number;
  loading: boolean;
  error: string | null;
}

/* =========================================================
   SYSTEM DASHBOARD STATE
========================================================= */

export interface SystemLogsDashboardState {
  summary: SystemLogsSummary | null;
  services: ServiceHealth[];
  heatmap: HeatmapCell[];
  anomalies: SystemAnomaly[];
  logs: SystemLog[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}