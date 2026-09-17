"use client";

import { apiClient } from "./client";

export type RevenueRange =
  | "24H"
  | "7D"
  | "30D"
  | "90D"
  | "6M"
  | "1Y";

export interface RevenueFeePolicy {
  transferFeeMinor: number;
  withdrawalFeeMinor: number;
  monthlyTxnEstimate: number;
  transferShareBps: number;
  withdrawalShareBps: number;
  elasticityBpsPer200Minor: number;
  revision: number;
  updatedAt: string | null;
}

export interface RevenueSimulation {
  projectedRevenueMinor: number;
  baselineRevenueMinor: number;
  differenceMinor: number;
  percentageChange: number;
  transferContributionMinor: number;
  withdrawalContributionMinor: number;
  transferTransactions: number;
  withdrawalTransactions: number;
  requestedMonthlyTransactions: number;
  assumptions: {
    transferShare: number;
    withdrawalShare: number;
    elasticityPercentPerTwoTakaIncrease: number;
    source: "policy";
  };
}

export interface RevenueLeakageSignal {
  id: string;
  category: string;
  amountMinor: number;
  sourceEventCount: number;
  reason: string;
  riskLevel:
    | "High"
    | "Medium"
    | "Low";
  action: string;
  investigationStatus:
    | "none"
    | "investigating"
    | "resolved";
}

export interface RevenueContributor {
  id: string;
  userId: string;
  name: string;
  email: string;
  type:
    | "VIP"
    | "Business"
    | "Premium"
    | "Standard";
  volumeMinor: number;
  feesPaidMinor: number;
  transactionsCount: number;
}

interface FeePolicyResponse {
  success: boolean;
  policy: RevenueFeePolicy;
}

interface SimulationResponse {
  success: boolean;
  simulation: RevenueSimulation;
}

interface LeakageResponse {
  success: boolean;
  range: RevenueRange;
  totalLeakageMinor: number;
  signals: RevenueLeakageSignal[];
}

interface ContributorsResponse {
  success: boolean;
  range: RevenueRange;
  contributors: RevenueContributor[];
}

interface InvestigateResponse {
  success: boolean;
  message: string;
  investigation: {
    id: string;
    category: string;
    status: string;
  };
}

const query = (
  values: Record<
    string,
    string | number | undefined
  >
) => {
  const params =
    new URLSearchParams();

  Object.entries(
    values
  ).forEach(
    ([key, value]) => {
      if (
        value ===
          undefined ||
        value ===
          ""
      ) {
        return;
      }

      params.set(
        key,
        String(
          value
        )
      );
    }
  );

  const value =
    params.toString();

  return value
    ? `?${value}`
    : "";
};

export const revenueApi = {
  getFeePolicy:
    () =>
      apiClient<FeePolicyResponse>(
        "/admin/revenue/fee-policy"
      ),

  simulate:
    (
      payload: {
        transferFeeMinor:
          number;
        withdrawalFeeMinor:
          number;
        monthlyTransactions:
          number;
      }
    ) =>
      apiClient<SimulationResponse>(
        "/admin/revenue/simulate",
        {
          method:
            "POST",
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

  getLeakage:
    (
      range:
        RevenueRange =
          "30D"
    ) =>
      apiClient<LeakageResponse>(
        `/admin/revenue/leakage${query({
          range,
        })}`
      ),

  getContributors:
    (
      range:
        RevenueRange =
          "30D",
      limit =
        4
    ) =>
      apiClient<ContributorsResponse>(
        `/admin/revenue/contributors${query({
          range,
          limit,
        })}`
      ),

  investigateLeakage:
    (
      payload: {
        category:
          string;
        range:
          RevenueRange;
        note?:
          string;
      }
    ) =>
      apiClient<InvestigateResponse>(
        "/admin/revenue/leakage/investigate",
        {
          method:
            "POST",
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
};
