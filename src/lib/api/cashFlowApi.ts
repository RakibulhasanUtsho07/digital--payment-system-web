import {
  apiClient,
} from "@/lib/api/client";

export type CashFlowEventType =
  | "income"
  | "expense";

export interface CashFlowPlan {
  id: string;
  title: string;
  amount: number;
  type: CashFlowEventType;
  category: string;
  date: string;
  isRecurring: boolean;
  status: "pending";
}

export interface CashFlowWallet {
  _id: string;
  userId: string;
  balance: number;
  currency?: string;
}

export interface CashFlowTransactionUser {
  _id: string;
  name?: string;
}

export interface CashFlowTransaction {
  _id: string;
  senderId:
    | string
    | CashFlowTransactionUser;

  receiverId:
    | string
    | CashFlowTransactionUser;

  amount: number;
  currency: string;

  type:
    | "TRANSFER"
    | "DEPOSIT"
    | "WITHDRAW";

  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED";

  direction?:
    | "IN"
    | "OUT";

  reference?: string;
  createdAt?: string;
}

interface PlansResponse {
  success: boolean;
  count: number;
  plans: CashFlowPlan[];
  message?: string;
}

interface PlanResponse {
  success: boolean;
  plan: CashFlowPlan;
  message?: string;
}

interface DeleteResponse {
  success: boolean;
  id: string;
  message?: string;
}

interface WalletResponse {
  success: boolean;
  wallet: CashFlowWallet;
  message?: string;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  transactions:
    CashFlowTransaction[];
  message?: string;
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

export async function getCashFlowPlans() {
  return apiClient<PlansResponse>(
    "/cash-flow/plans"
  );
}

export async function createCashFlowPlan(
  payload: {
    title: string;
    amount: number;
    type: CashFlowEventType;
    category: string;
    date: string;
    isRecurring: boolean;
  }
) {
  return apiClient<PlanResponse>(
    "/cash-flow/plans",
    jsonRequest(
      "POST",
      payload
    )
  );
}

export async function deleteCashFlowPlan(
  id: string
) {
  return apiClient<DeleteResponse>(
    `/cash-flow/plans/${encodeURIComponent(
      id
    )}`,
    {
      method:
        "DELETE",
    }
  );
}

export async function getCashFlowWallet() {
  return apiClient<WalletResponse>(
    "/wallet"
  );
}

export async function getCashFlowTransactions() {
  return apiClient<TransactionsResponse>(
    "/transactions"
  );
}
