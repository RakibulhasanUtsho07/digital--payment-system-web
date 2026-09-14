/* =========================================================
   MERCHANT REPORT API
========================================================= */

import { apiClient } from "./client";

/* =========================================================
   REPORT TYPES
========================================================= */

export type MerchantReportType =
  | "summary"
  | "payments"
  | "payouts"
  | "settlements";

/* =========================================================
   PARAMS
========================================================= */

export interface MerchantReportParams {
  reportType?: MerchantReportType;
  from?: string;
  to?: string;
  status?: string;
  provider?: string;
  sourceType?: string;
  payoutMethod?: string;
  currency?: string;
  mode?: "test" | "live";
}

/* =========================================================
   PAYMENT REPORT
========================================================= */

export interface MerchantPaymentReportRow {
  paymentId: string;
  orderId: string | null;
  customerId: string | null;
  amount: number;
  currency: string;
  feeAmount: number;
  netAmount: number | null;
  sourceType: string;
  provider: string;
  mode: string;
  status: string;
  merchantReference: string | null;
  providerPaymentId: string | null;
  createdAt: string;
  completedAt: string | null;
  failedAt: string | null;
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
  destination: string | null;
  status: string;
  merchantReference: string | null;
  externalReference: string | null;
  requestedAt: string;
  completedAt: string | null;
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
  payoutId: string | null;
  settledAt: string | null;
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
   COMMON MERCHANT DATA
========================================================= */

interface MerchantReportMerchant {
  id: string;
  businessName: string;
  businessDisplayName: string | null;
  defaultCurrency: string;
}

interface MerchantReportRange {
  from: string | null;
  to: string | null;
}

interface MerchantReportBase {
  merchant: MerchantReportMerchant;
  range: MerchantReportRange;
  generatedAt: string;
}

/* =========================================================
   DISCRIMINATED REPORT TYPES
========================================================= */

export interface MerchantSummaryReport
  extends MerchantReportBase {
  reportType: "summary";

  report: {
    paymentSummary: MerchantPaymentReportSummary;
    payoutSummary: MerchantPayoutReportSummary;
    settlementSummary: MerchantSettlementReportSummary;
  };
}

export interface MerchantPaymentsReport
  extends MerchantReportBase {
  reportType: "payments";

  report: {
    summary: MerchantPaymentReportSummary;
    rows: MerchantPaymentReportRow[];
  };
}

export interface MerchantPayoutsReport
  extends MerchantReportBase {
  reportType: "payouts";

  report: {
    summary: MerchantPayoutReportSummary;
    rows: MerchantPayoutReportRow[];
  };
}

export interface MerchantSettlementsReport
  extends MerchantReportBase {
  reportType: "settlements";

  report: {
    summary: MerchantSettlementReportSummary;
    rows: MerchantSettlementReportRow[];
  };
}

/* =========================================================
   MAIN RESPONSE
========================================================= */

export type MerchantReportResponse =
  | MerchantSummaryReport
  | MerchantPaymentsReport
  | MerchantPayoutsReport
  | MerchantSettlementsReport;

/* =========================================================
   API RESPONSE WRAPPER
========================================================= */

interface MerchantReportApiResponse {
  success: boolean;
  data: MerchantReportResponse;
  message?: string;
}

/* =========================================================
   GET MERCHANT REPORT
========================================================= */

export async function getMerchantReport(
  params: MerchantReportParams = {}
): Promise<MerchantReportResponse> {
  const searchParams =
    new URLSearchParams();

  /* -------------------------------------------------------
     REPORT TYPE
  ------------------------------------------------------- */

  if (params.reportType) {
    searchParams.set(
      "reportType",
      params.reportType
    );
  }

  /* -------------------------------------------------------
     DATE RANGE
  ------------------------------------------------------- */

  if (params.from) {
    searchParams.set(
      "from",
      params.from
    );
  }

  if (params.to) {
    searchParams.set(
      "to",
      params.to
    );
  }

  /* -------------------------------------------------------
     STATUS
  ------------------------------------------------------- */

  if (params.status) {
    searchParams.set(
      "status",
      params.status
    );
  }

  /* -------------------------------------------------------
     PROVIDER
  ------------------------------------------------------- */

  if (params.provider) {
    searchParams.set(
      "provider",
      params.provider
    );
  }

  /* -------------------------------------------------------
     SOURCE TYPE
  ------------------------------------------------------- */

  if (params.sourceType) {
    searchParams.set(
      "sourceType",
      params.sourceType
    );
  }

  /* -------------------------------------------------------
     PAYOUT METHOD
  ------------------------------------------------------- */

  if (params.payoutMethod) {
    searchParams.set(
      "payoutMethod",
      params.payoutMethod
    );
  }

  /* -------------------------------------------------------
     CURRENCY
  ------------------------------------------------------- */

  if (params.currency) {
    searchParams.set(
      "currency",
      params.currency
    );
  }

  /* -------------------------------------------------------
     MODE
  ------------------------------------------------------- */

  if (params.mode) {
    searchParams.set(
      "mode",
      params.mode
    );
  }

  /* -------------------------------------------------------
     QUERY STRING
  ------------------------------------------------------- */

  const query =
    searchParams.toString();

  const endpoint =
    `/api/merchants/reports${
      query
        ? `?${query}`
        : ""
    }`;

  /* -------------------------------------------------------
     REQUEST
  ------------------------------------------------------- */

  const response =
    (await apiClient(
      endpoint,
      {
        method: "GET",
      }
    )) as MerchantReportApiResponse;

  /* -------------------------------------------------------
     RESPONSE VALIDATION
  ------------------------------------------------------- */

  if (
    !response ||
    typeof response !== "object"
  ) {
    throw new Error(
      "Invalid report response."
    );
  }

  if (
    response.success === false
  ) {
    throw new Error(
      response.message ||
        "Unable to load merchant report."
    );
  }

  if (!response.data) {
    throw new Error(
      response.message ||
        "Merchant report data was not returned."
    );
  }

  return response.data;
}