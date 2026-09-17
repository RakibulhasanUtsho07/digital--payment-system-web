import {
  apiClient,
} from "@/lib/api/client";

export type InsightsTimeRange =
  | "week"
  | "month"
  | "year";

export interface CashflowData {
  name: string;
  income: number;
  expense: number;
}

export interface ExpenseCategoryData {
  name: string;
  value: number;
}

export interface InsightsSummary {
  totalIncome: number;
  totalSpent: number;
  netBalance: number;
}

export interface FinancialInsightsResponse {
  success: boolean;

  range: InsightsTimeRange;

  period: {
    start: string;
    end: string;
  };

  summary: InsightsSummary;

  previousSummary: InsightsSummary;

  trends: {
    income: number | null;
    expense: number | null;
  };

  cashflow: CashflowData[];

  expenseCategories: ExpenseCategoryData[];

  insight: string;

  message?: string;
}

export async function getFinancialInsights(
  range: InsightsTimeRange
): Promise<FinancialInsightsResponse> {
  return apiClient<FinancialInsightsResponse>(
    `/insights?range=${encodeURIComponent(
      range
    )}`,
    {
      method: "GET",
    }
  );
}