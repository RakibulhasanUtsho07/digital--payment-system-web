import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

export interface TransactionUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export type TransactionParty =
  | TransactionUser
  | string;

export interface TransactionItem {
  _id: string;

  senderId:
    TransactionParty;

  receiverId:
    TransactionParty;

  /*
   * Backend decrypt করে এই amount পাঠাবে।
   * Frontend amountEncrypted কখনো handle করবে না।
   */
  amount: number;

  currency:
    string;

  type:
    | "TRANSFER"
    | "DEPOSIT"
    | "WITHDRAW"
    | string;

  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | string;

  /*
   * Backend referenceEncrypted decrypt করে
   * এই safe value পাঠাবে।
   */
  reference?:
    string;

  riskScore?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | string;

  createdAt?:
    string;

  updatedAt?:
    string;
}

interface TransactionsResponse {
  success:
    boolean;

  count:
    number;

  transactions:
    TransactionItem[];

  message?:
    string;
}

interface TransactionDetailsResponse {
  success:
    boolean;

  transaction:
    TransactionItem;

  message?:
    string;
}

/* =========================================================
   GET MY TRANSACTIONS
========================================================= */

export async function getMyTransactions():
  Promise<TransactionsResponse> {
  return apiClient<TransactionsResponse>(
    "/transactions",
    {
      method:
        "GET",
    }
  );
}

/* =========================================================
   GET TRANSACTION BY ID
========================================================= */

export async function getTransactionById(
  id: string
): Promise<TransactionDetailsResponse> {
  return apiClient<TransactionDetailsResponse>(
    `/transactions/${encodeURIComponent(id)}`,
    {
      method:
        "GET",
    }
  );
}