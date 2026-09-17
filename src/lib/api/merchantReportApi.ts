/* =========================================================
   MERCHANT REPORT API
========================================================= */

import {
  apiClient,
} from "./client";

/* =========================================================
   REPORT TYPES
========================================================= */

export type MerchantReportType =
  | "summary"
  | "payments"
  | "payouts"
  | "settlements";

export type MerchantReportMode =
  | "test"
  | "live";

/* =========================================================
   PARAMS
========================================================= */

export interface MerchantReportParams {
  reportType?:
    MerchantReportType;

  from?: string;

  to?: string;

  status?: string;

  provider?: string;

  sourceType?: string;

  payoutMethod?: string;

  currency?: string;

  mode?:
    MerchantReportMode;
}

/* =========================================================
   PAYMENT REPORT
========================================================= */

export interface MerchantPaymentReportRow {
  paymentId: string;

  orderId:
    | string
    | null;

  customerId:
    | string
    | null;

  amount: number;

  currency: string;

  feeAmount: number;

  netAmount:
    | number
    | null;

  sourceType: string;

  provider: string;

  mode: string;

  status: string;

  merchantReference:
    | string
    | null;

  providerPaymentId:
    | string
    | null;

  createdAt: string;

  completedAt:
    | string
    | null;

  failedAt:
    | string
    | null;
}

export interface MerchantPaymentReportSummary {
  count: number;

  grossAmount: number;

  feeAmount: number;

  completedCount: number;

  completedAmount: number;
}

/* =========================================================
   PAYOUT REPORT
========================================================= */

export interface MerchantPayoutReportRow {
  payoutId: string;

  amount: number;

  currency: string;

  feeAmount: number;

  netAmount: number;

  payoutMethod: string;

  destination:
    | string
    | null;

  status: string;

  merchantReference:
    | string
    | null;

  externalReference:
    | string
    | null;

  requestedAt: string;

  completedAt:
    | string
    | null;
}

export interface MerchantPayoutReportSummary {
  count: number;

  amount: number;

  feeAmount: number;

  netAmount: number;

  completedAmount: number;
}

/* =========================================================
   SETTLEMENT REPORT
========================================================= */

export interface MerchantSettlementReportRow {
  settlementId: string;

  periodStart: string;

  periodEnd: string;

  currency: string;

  paymentCount: number;

  grossAmount: number;

  feeAmount: number;

  refundAmount: number;

  adjustmentAmount: number;

  netAmount: number;

  status: string;

  payoutId:
    | string
    | null;

  settledAt:
    | string
    | null;
}

export interface MerchantSettlementReportSummary {
  count: number;

  grossAmount: number;

  feeAmount: number;

  refundAmount: number;

  adjustmentAmount: number;

  netAmount: number;
}

/* =========================================================
   COMMON
========================================================= */

export interface MerchantReportMerchant {
  id: string;

  businessName: string;

  businessDisplayName:
    | string
    | null;

  defaultCurrency: string;
}

export interface MerchantReportRange {
  from:
    | string
    | null;

  to:
    | string
    | null;
}

interface MerchantReportBase {
  merchant:
    MerchantReportMerchant;

  range:
    MerchantReportRange;

  generatedAt: string;
}

/* =========================================================
   REPORT RESPONSES
========================================================= */

export interface MerchantSummaryReport
  extends MerchantReportBase {
  reportType:
    "summary";

  report: {
    paymentSummary:
      MerchantPaymentReportSummary;

    payoutSummary:
      MerchantPayoutReportSummary;

    settlementSummary:
      MerchantSettlementReportSummary;
  };
}

export interface MerchantPaymentsReport
  extends MerchantReportBase {
  reportType:
    "payments";

  report: {
    summary:
      MerchantPaymentReportSummary;

    rows:
      MerchantPaymentReportRow[];
  };
}

export interface MerchantPayoutsReport
  extends MerchantReportBase {
  reportType:
    "payouts";

  report: {
    summary:
      MerchantPayoutReportSummary;

    rows:
      MerchantPayoutReportRow[];
  };
}

export interface MerchantSettlementsReport
  extends MerchantReportBase {
  reportType:
    "settlements";

  report: {
    summary:
      MerchantSettlementReportSummary;

    rows:
      MerchantSettlementReportRow[];
  };
}

export type MerchantReportResponse =
  | MerchantSummaryReport
  | MerchantPaymentsReport
  | MerchantPayoutsReport
  | MerchantSettlementsReport;

/* =========================================================
   API RESPONSE
========================================================= */

interface MerchantReportApiResponse {
  success: boolean;

  data:
    MerchantReportResponse;

  message?: string;
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
   GET REPORT

   IMPORTANT:

   apiClient base:
   http://localhost:5000/api

   Therefore use:

   /merchants/reports

   NOT:

   /api/merchants/reports
========================================================= */

export async function getMerchantReport(
  params:
    MerchantReportParams = {}
): Promise<MerchantReportResponse> {
  if (
    params.from &&
    params.to &&
    params.from >
      params.to
  ) {
    throw new Error(
      "From date cannot be later than To date."
    );
  }

  const searchParams =
    new URLSearchParams();

  setOptionalParam(
    searchParams,
    "reportType",
    params.reportType
  );

  setOptionalParam(
    searchParams,
    "from",
    params.from
  );

  setOptionalParam(
    searchParams,
    "to",
    params.to
  );

  setOptionalParam(
    searchParams,
    "status",
    params.status?.trim()
  );

  setOptionalParam(
    searchParams,
    "provider",
    params.provider
      ?.trim()
      .toLowerCase()
  );

  setOptionalParam(
    searchParams,
    "sourceType",
    params.sourceType
      ?.trim()
      .toLowerCase()
  );

  setOptionalParam(
    searchParams,
    "payoutMethod",
    params.payoutMethod
      ?.trim()
      .toLowerCase()
  );

  setOptionalParam(
    searchParams,
    "currency",
    params.currency
      ?.trim()
      .toUpperCase()
  );

  setOptionalParam(
    searchParams,
    "mode",
    params.mode
  );

  const query =
    searchParams.toString();

  /*
   * DO NOT put /api here.
   */
  const endpoint =
    `/merchants/reports${
      query
        ? `?${query}`
        : ""
    }`;

  const response =
    await apiClient<MerchantReportApiResponse>(
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
      "Invalid merchant report response."
    );
  }

  if (
    response.success ===
    false
  ) {
    throw new Error(
      response.message ||
        "Unable to load merchant report."
    );
  }

  if (
    !response.data
  ) {
    throw new Error(
      response.message ||
        "Merchant report data was not returned."
    );
  }

  return response.data;
}