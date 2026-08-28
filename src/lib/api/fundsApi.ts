import { apiClient } from "@/lib/api/client";

export type FundsAction =
  | "DEPOSIT"
  | "WITHDRAW";

export interface FundsWallet {
  _id: string;
  balance: number;
  status: string;
  currency: string;
}

export interface FundsTransaction {
  _id: string;
  type: FundsAction;
  status: "COMPLETED";
  amount: number;
  currency: string;
  reference?: string;
  createdAt?: string;
}

export interface FundsResponse {
  success: boolean;
  duplicate?: boolean;
  message?: string;
  wallet: FundsWallet;
  transaction: FundsTransaction;
}

interface FundsRequest {
  amount: number;
  reference?: string;
  idempotencyKey: string;
}

async function submitFundsRequest(
  endpoint: "/funds/deposit" | "/funds/withdraw",
  payload: FundsRequest
): Promise<FundsResponse> {
  const body: {
    amount: number;
    reference?: string;
  } = {
    amount: payload.amount,
  };

  const reference =
    payload.reference?.trim();

  if (reference) {
    body.reference = reference;
  }

  return apiClient<FundsResponse>(
    endpoint,
    {
      method: "POST",
      headers: {
        "Idempotency-Key":
          payload.idempotencyKey,
      },
      body: JSON.stringify(body),
    }
  );
}

export function depositFunds(
  payload: FundsRequest
): Promise<FundsResponse> {
  return submitFundsRequest(
    "/funds/deposit",
    payload
  );
}

export function withdrawFunds(
  payload: FundsRequest
): Promise<FundsResponse> {
  return submitFundsRequest(
    "/funds/withdraw",
    payload
  );
}
