"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getMyWallet,
  type WalletData,
} from "@/lib/api/walletApi";

/* =========================================================
   USE WALLET HOOK
========================================================= */

export function useWallet() {
  const [
    wallet,
    setWallet,
  ] =
    useState<WalletData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD WALLET
  ======================================================== */

  const loadWallet =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await getMyWallet();

          if (
            !response.success ||
            !response.wallet
          ) {
            throw new Error(
              response.message ||
                "Unable to load wallet."
            );
          }

          setWallet(
            response.wallet
          );
        } catch (error) {
          console.error(
            "Wallet loading error:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Failed to load wallet."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    void loadWallet();
  }, [
    loadWallet,
  ]);

  /* =======================================================
     RETURN
  ======================================================== */

  return {
    wallet,
    loading,
    refreshing,
    error,

    refresh: () =>
      loadWallet(true),

    reload: () =>
      loadWallet(false),
  };
}