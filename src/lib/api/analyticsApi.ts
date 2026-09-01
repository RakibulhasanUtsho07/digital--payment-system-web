"use client";

import { apiClient } from "./client";

export type AnalyticsRange =
  | "Today"
  | "7D"
  | "30D"
  | "90D"
  | "1Y";

export type AnalyticsTrend =
  | "up"
  | "down"
  | "flat";

export type AnalyticsTone =
  | "blue"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "slate";

export interface AnalyticsOverview {
  transactionVolume: number;
  transactionCount: number;
  activeUsers: number;
  walletBalance: number;
  kycCompletion: number;
  platformRevenue: number;
  failedRate: number;
  highRiskExposure: number;
  avgTransactionValue: number;
  merchantShare: number;
  retentionRate: number;
  disputeRate: number;
}

export interface AnalyticsPulseMetric {
  id: string;
  label: string;
  score: number;
  trend: AnalyticsTrend;
}

export interface AnalyticsSeriesPoint {
  label: string;
  volume: number;
  revenue: number;
  failures: number;
}

export interface AnalyticsBreakdownItem {
  label: string;
  value: number;
  helper?: string;
  tone: AnalyticsTone;
}

export interface AnalyticsRiskCell {
  label: string;
  count: number;
  amount: number;
  severity:
    | "Low"
    | "Moderate"
    | "High"
    | "Critical";
}

export interface AnalyticsAlert {
  id: string;
  title: string;
  description: string;
  level:
    | "info"
    | "warning"
    | "critical";
  metric: string;
  action: string;
}

export interface AnalyticsInsight {
  title: string;
  body: string;
  impact: string;
  tone: AnalyticsTone;
}

export interface AnalyticsDashboardData {
  range: AnalyticsRange;
  generatedAt: string;
  overview: AnalyticsOverview;
  pulse: AnalyticsPulseMetric[];
  series: AnalyticsSeriesPoint[];
  channels: AnalyticsBreakdownItem[];
  failureReasons: AnalyticsBreakdownItem[];
  geography: AnalyticsBreakdownItem[];
  riskMatrix: AnalyticsRiskCell[];
  alerts: AnalyticsAlert[];
  insights: AnalyticsInsight[];
}

interface DashboardResponse {
  success: boolean;
  dashboard: AnalyticsDashboardData;
}

interface ReportResponse {
  success: boolean;
  report: {
    id: string;
    status:
      | "queued"
      | "processing"
      | "ready"
      | "failed";
    downloadUrl?: string;
  };
}

const baseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export const analyticsApi = {
  getDashboard: (
    range: AnalyticsRange,
    options?: {
      refresh?: boolean;
    }
  ) => {
    const params =
      new URLSearchParams({
        range,
      });

    if (
      options?.refresh
    ) {
      params.set(
        "refresh",
        "1"
      );
    }

    return apiClient<DashboardResponse>(
      `/admin/analytics/dashboard?${params.toString()}`
    );
  },

  generateReport: (payload: {
    range: AnalyticsRange;
    format:
      | "summary"
      | "executive"
      | "risk";
  }) =>
    apiClient<ReportResponse>(
      "/admin/analytics/reports",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  async downloadExport(
    range:
      AnalyticsRange
  ) {
    const response =
      await fetch(
        `${baseUrl()}/admin/analytics/export?range=${encodeURIComponent(
          range
        )}&format=csv`,
        {
          credentials:
            "include",
          cache:
            "no-store",
        }
      );

    if (
      !response.ok
    ) {
      let message =
        "Unable to export analytics.";

      try {
        const data =
          await response.json();

        if (
          typeof data?.message ===
          "string"
        ) {
          message =
            data.message;
        }
      } catch {
        // Keep default message.
      }

      throw new Error(
        message
      );
    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      `analytics-${range.toLowerCase()}-${new Date()
        .toISOString()
        .slice(
          0,
          10
        )}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    window.URL.revokeObjectURL(
      url
    );
  },
};
