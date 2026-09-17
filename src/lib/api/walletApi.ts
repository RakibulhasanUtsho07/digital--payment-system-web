import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   WALLET STATUS
========================================================= */

export type WalletStatus =
  | "ACTIVE"
  | "FROZEN"
  | "BLOCKED";

/* =========================================================
   WALLET DATA
========================================================= */

export interface WalletData {
  _id: string;

  userId: string;

  /*
   * Current available wallet balance.
   */
  balance: number;

  /*
   * Funds currently pending settlement.
   */
  pendingBalance: number;

  /*
   * Current wallet status.
   */
  status: WalletStatus;

  /*
   * Wallet currency.
   */
  currency: string;

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   WALLET RESPONSE
========================================================= */

export interface WalletResponse {
  success: boolean;

  message?: string;

  wallet: WalletData;
}

/* =========================================================
   GET MY WALLET
   GET /api/wallet
========================================================= */

export const getMyWallet =
  async (): Promise<WalletResponse> => {
    return apiClient<WalletResponse>(
      "/wallet",
      {
        method: "GET",
      }
    );
  };