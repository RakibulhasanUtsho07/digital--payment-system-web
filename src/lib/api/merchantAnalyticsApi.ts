

/* =========================================================
   TYPES
========================================================= */

import { apiClient } from "./client";

export type MerchantAnalyticsPeriod =
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "all";

export interface MerchantAnalyticsTrendItem {
  date: string;
  paymentCount: number;
  completedCount: number;
  failedCount: number;
  volume: number;
}

export interface MerchantAnalyticsBreakdownItem {
  key: string;
  count: number;
  volume: number;
}

export interface MerchantAnalyticsOverview {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  processingPayments: number;
  failedPayments: number;
  cancelledPayments: number;
  expiredPayments: number;

  grossVolume: number;
  totalFees: number;
  netRevenue: number;

  successRate: number;
  averagePaymentValue: number;
  uniqueCustomers: number;
}

export interface MerchantAnalyticsResponse {
  success: boolean;

  data: {
    merchant: {
      id: string;
      businessName: string;
      businessDisplayName:
        | string
        | null;
      slug: string;
      defaultCurrency: string;
    };

    period:
      MerchantAnalyticsPeriod;

    range: {
      start: string | null;
      end: string | null;
    };

    generatedAt: string;

    overview:
      MerchantAnalyticsOverview;

    trend:
      MerchantAnalyticsTrendItem[];

    paymentMethods:
      MerchantAnalyticsBreakdownItem[];

    providers:
      MerchantAnalyticsBreakdownItem[];

    statusBreakdown:
      MerchantAnalyticsBreakdownItem[];

    topDays:
      MerchantAnalyticsTrendItem[];
  };

  message?: string;
}

/* =========================================================
   GET ANALYTICS
========================================================= */

export async function getMerchantAnalytics(
  params: {
    period?: MerchantAnalyticsPeriod;
    from?: string;
    to?: string;
  } = {}
): Promise<MerchantAnalyticsResponse> {
  const query =
    new URLSearchParams();

  if (params.period) {
    query.set(
      "period",
      params.period
    );
  }

  if (params.from) {
    query.set(
      "from",
      params.from
    );
  }

  if (params.to) {
    query.set(
      "to",
      params.to
    );
  }

  const queryString =
    query.toString();

  const url =
    `/api/merchants/analytics${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  return apiClient<MerchantAnalyticsResponse>(
    url,
    {
      method: "GET",
    }
  );
}