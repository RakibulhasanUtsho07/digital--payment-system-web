"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getMerchantSettings,
} from "@/lib/api/merchantSettingsApi";

import type {
  MerchantSettings,
  MerchantSettingsData,
} from "@/types/merchant-settings";

/* =========================================================
   CONTEXT
========================================================= */

interface MerchantSettingsContextValue {
  data:
    MerchantSettingsData | null;

  loading:
    boolean;

  error:
    string;

  reload:
    () => Promise<void>;

  updateLocalSection:
    <K extends keyof MerchantSettings>(
      section: K,
      value:
        MerchantSettings[K],
      revision?: number,
      updatedAt?: string,
    ) => void;
}

const MerchantSettingsContext =
  createContext<
    MerchantSettingsContextValue | null
  >(null);

/* =========================================================
   ERROR
========================================================= */

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Unable to load merchant settings.";
}

/* =========================================================
   PROVIDER
========================================================= */

export function MerchantSettingsProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const [
    data,
    setData,
  ] =
    useState<MerchantSettingsData | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const reload =
    useCallback(
      async () => {
        try {
          setLoading(
            true,
          );

          setError("");

          const result =
            await getMerchantSettings();

          setData(
            result,
          );
        } catch (
          requestError
        ) {
          setError(
            errorMessage(
              requestError,
            ),
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      void reload();
    },
    [
      reload,
    ],
  );

  const updateLocalSection =
    useCallback(
      <
        K extends keyof MerchantSettings,
      >(
        section:
          K,

        value:
          MerchantSettings[K],

        revision?:
          number,

        updatedAt?:
          string,
      ) => {
        setData(
          (
            current,
          ) => {
            if (
              !current
            ) {
              return current;
            }

            return {
              ...current,

              settings: {
                ...current.settings,

                [section]:
                  value,

                revision:
                  revision ??
                  current.settings
                    .revision,

                updatedAt:
                  updatedAt ??
                  current.settings
                    .updatedAt,
              },
            };
          },
        );
      },
      [],
    );

  const contextValue =
    useMemo(
      () => ({
        data,
        loading,
        error,
        reload,
        updateLocalSection,
      }),
      [
        data,
        loading,
        error,
        reload,
        updateLocalSection,
      ],
    );

  return (
    <MerchantSettingsContext.Provider
      value={
        contextValue
      }
    >
      {children}
    </MerchantSettingsContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useMerchantSettings() {
  const context =
    useContext(
      MerchantSettingsContext,
    );

  if (
    !context
  ) {
    throw new Error(
      "useMerchantSettings must be used inside MerchantSettingsProvider.",
    );
  }

  return context;
}