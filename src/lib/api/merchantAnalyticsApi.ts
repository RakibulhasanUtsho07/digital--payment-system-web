/* =========================================================
   MERCHANT ANALYTICS API
========================================================= */

import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

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

  /*
   * Kept as netRevenue for API compatibility.
   *
   * Merchant UI displays this as:
   * "Net payment value"
   *
   * gross completed volume - payment fees
   */
  netRevenue: number;

  successRate: number;

  averagePaymentValue: number;

  uniqueCustomers: number;
}

export interface MerchantAnalyticsMerchant {
  id: string;

  businessName: string;

  businessDisplayName:
    | string
    | null;

  slug: string;

  defaultCurrency: string;
}

export interface MerchantAnalyticsResponse {
  success: boolean;

  data: {
    merchant:
      MerchantAnalyticsMerchant;

    period:
      MerchantAnalyticsPeriod;

    range: {
      start:
        | string
        | null;

      end:
        | string
        | null;
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
   PARAMS
========================================================= */

export interface MerchantAnalyticsParams {
  period?:
    MerchantAnalyticsPeriod;

  from?: string;

  to?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function setOptionalParam(
  params:
    URLSearchParams,

  key:
    string,

  value:
    | string
    | undefined
    | null
): void {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return;
  }

  params.set(
    key,
    value
  );
}

/* =========================================================
   GET ANALYTICS

   apiClient base:
   http://localhost:5000/api

   Correct:
   /merchants/analytics

   Wrong:
   /api/merchants/analytics
========================================================= */

export async function getMerchantAnalytics(
  params:
    MerchantAnalyticsParams = {}
): Promise<MerchantAnalyticsResponse> {
  if (
    params.from &&
    params.to &&
    params.from >
      params.to
  ) {
    throw new Error(
      "Analytics start date cannot be later than end date."
    );
  }

  const query =
    new URLSearchParams();

  setOptionalParam(
    query,
    "period",
    params.period
  );

  setOptionalParam(
    query,
    "from",
    params.from
  );

  setOptionalParam(
    query,
    "to",
    params.to
  );

  const queryString =
    query.toString();

  /*
   * IMPORTANT:
   * Do NOT add /api here.
   */
  const endpoint =
    `/merchants/analytics${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  const response =
    await apiClient<MerchantAnalyticsResponse>(
      endpoint,
      {
        method:
          "GET",
      }
    );

  if (
    !response ||
    typeof response !==
      "object"
  ) {
    throw new Error(
      "Invalid merchant analytics response."
    );
  }

  if (
    response.success ===
    false
  ) {
    throw new Error(
      response.message ||
        "Unable to load merchant analytics."
    );
  }

  if (
    !response.data ||
    !response.data.overview
  ) {
    throw new Error(
      response.message ||
        "Merchant analytics data was not returned."
    );
  }

  if (
    !Array.isArray(
      response.data.trend
    )
  ) {
    throw new Error(
      "Invalid merchant analytics trend data."
    );
  }

  return response;
}