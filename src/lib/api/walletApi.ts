import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

export interface WalletData {
  _id: string;

  userId: string;

  balance: number;

  createdAt?: string;

  updatedAt?: string;
}

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