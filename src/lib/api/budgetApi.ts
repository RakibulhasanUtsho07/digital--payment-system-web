import {
  apiClient,
} from "@/lib/api/client";

export interface BudgetCategory {
  id: string;
  name: string;
  iconName: string;
  limit: number;
}

export interface BudgetExpense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  date: string;
  method: string;
}

export interface BudgetSettings {
  totalLimit: number;
  savingsGoal: number;
  currentSavings: number;
}

export interface BudgetDashboardResponse {
  success: boolean;
  month: number;
  year: number;
  settings: BudgetSettings;
  categories: BudgetCategory[];
  expenses: BudgetExpense[];
  message?: string;
}

interface SettingsResponse {
  success: boolean;
  message?: string;
  settings: BudgetSettings;
}

interface SavingsResponse {
  success: boolean;
  message?: string;
  savings: {
    savingsGoal: number;
    currentSavings: number;
  };
}

interface CategoryResponse {
  success: boolean;
  message?: string;
  category: BudgetCategory;
}

interface ExpenseResponse {
  success: boolean;
  message?: string;
  expense: BudgetExpense;
}

function jsonRequest(
  method: string,
  body: unknown
): RequestInit {
  return {
    method,
    headers: {
      "Content-Type":
        "application/json",
    },
    body:
      JSON.stringify(
        body
      ),
  };
}

export async function getBudgetDashboard(
  month: number,
  year: number
): Promise<BudgetDashboardResponse> {
  return apiClient<BudgetDashboardResponse>(
    `/budgets/dashboard?month=${encodeURIComponent(
      month
    )}&year=${encodeURIComponent(
      year
    )}`
  );
}

export async function saveBudgetSettings(
  payload: {
    month: number;
    year: number;
    totalLimit: number;
    savingsGoal: number;
  }
): Promise<SettingsResponse> {
  return apiClient<SettingsResponse>(
    "/budgets/settings",
    jsonRequest(
      "PUT",
      payload
    )
  );
}

export async function addBudgetSavings(
  amount: number
): Promise<SavingsResponse> {
  return apiClient<SavingsResponse>(
    "/budgets/savings",
    jsonRequest(
      "POST",
      {
        amount,
      }
    )
  );
}

export async function createBudgetExpense(
  payload: {
    month: number;
    year: number;
    title: string;
    amount: number;
    categoryId: string;
    method?: string;
  }
): Promise<ExpenseResponse> {
  return apiClient<ExpenseResponse>(
    "/budgets/expenses",
    jsonRequest(
      "POST",
      payload
    )
  );
}

export async function createBudgetCategory(
  payload: {
    month: number;
    year: number;
    name: string;
    limit: number;
    iconName?: string;
  }
): Promise<CategoryResponse> {
  return apiClient<CategoryResponse>(
    "/budgets/categories",
    jsonRequest(
      "POST",
      payload
    )
  );
}

export async function saveBudgetCategoryLimit(
  categoryId: string,
  payload: {
    month: number;
    year: number;
    limit: number;
  }
): Promise<CategoryResponse> {
  return apiClient<CategoryResponse>(
    `/budgets/categories/${encodeURIComponent(
      categoryId
    )}`,
    jsonRequest(
      "PATCH",
      payload
    )
  );
}
