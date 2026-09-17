"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import AdminDashboardOverview from "@/components/dashboard/views/AdminDashboardOverview";
import UserDashboardOverview from "@/components/dashboard/views/UserDashboardOverview";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  apiClient,
} from "@/lib/api/client";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

/* =========================================================
   TYPES
========================================================= */

interface WalletData {
  _id:
    string;

  userId:
    string;

  balance:
    number;

  [key: string]:
    unknown;
}

interface WalletResponse {
  success:
    boolean;

  wallet:
    WalletData;

  message?:
    string;
}

type TransactionType =
  | "TRANSFER"
  | "DEPOSIT"
  | "WITHDRAW";

type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

type RiskScore =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

interface PopulatedUser {
  _id:
    string;

  name?:
    string;

  email?:
    string;
}

interface TransactionData {
  _id:
    string;

  senderId:
    | string
    | PopulatedUser;

  receiverId:
    | string
    | PopulatedUser;

  amount:
    number;

  currency:
    string;

  type:
    TransactionType;

  status:
    TransactionStatus;

  reference?:
    string;

  riskScore:
    RiskScore;

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
    TransactionData[];

  message?:
    string;
}

const REQUEST_TIMEOUT_MS =
  12_000;

/* =========================================================
   TIMEOUT
========================================================= */

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise<T>(
    (
      resolve,
      reject
    ) => {
      const timer =
        globalThis.setTimeout(
          () => {
            reject(
              new Error(
                message
              )
            );
          },
          timeoutMs
        );

      promise.then(
        (
          value
        ) => {
          globalThis.clearTimeout(
            timer
          );

          resolve(
            value
          );
        },
        (
          error
        ) => {
          globalThis.clearTimeout(
            timer
          );

          reject(
            error
          );
        }
      );
    }
  );
}

/* =========================================================
   GREETING
========================================================= */

function getGreeting():
  string {
  const hour =
    new Date()
      .getHours();

  if (
    hour < 12
  ) {
    return "Good morning";
  }

  if (
    hour < 18
  ) {
    return "Good afternoon";
  }

  return "Good evening";
}

/* =========================================================
   LOADING
========================================================= */

function DashboardLoading({
  message =
    "Loading dashboard...",
}: {
  message?:
    string;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background:
              "var(--dashboard-primary)",
          }}
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        </div>

        <div className="text-center">
          <p className="text-sm font-bold text-foreground">
            Loading dashboard
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
  const router =
    useRouter();

  const {
    user,
  } =
    useDashboardSession();

  const [
    wallet,
    setWallet,
  ] =
    useState<
      WalletData |
      null
    >(
      null
    );

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      TransactionData[]
    >(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      user.role ===
        "user"
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      ""
    );

  const [
    retryKey,
    setRetryKey,
  ] =
    useState(
      0
    );

  /* =======================================================
     ROLE DASHBOARD REDIRECT

     merchant → merchant
     analyst  → analyst
     support  → support
  ======================================================= */

  useEffect(
    () => {
      if (
        user.role ===
          "merchant" ||
        user.role ===
          "analyst" ||
        user.role ===
          "support"
      ) {
        router.replace(
          getDashboardHome(
            user.role
          )
        );
      }
    },
    [
      router,
      user.role,
    ]
  );

  /* =======================================================
     USER WALLET DATA ONLY
  ======================================================= */

  useEffect(
    () => {
      if (
        user.role !==
        "user"
      ) {
        return;
      }

      let mounted =
        true;

      async function loadUserDashboard() {
        try {
          setLoading(
            true
          );

          setErrorMessage(
            ""
          );

          const [
            walletResponse,
            transactionsResponse,
          ] =
            await Promise.all([
              withTimeout(
                apiClient<WalletResponse>(
                  "/wallet"
                ),
                REQUEST_TIMEOUT_MS,
                "Wallet request timed out."
              ),

              withTimeout(
                apiClient<TransactionsResponse>(
                  "/transactions"
                ),
                REQUEST_TIMEOUT_MS,
                "Transaction request timed out."
              ),
            ]);

          if (
            !mounted
          ) {
            return;
          }

          if (
            !walletResponse.success ||
            !walletResponse.wallet
          ) {
            throw new Error(
              walletResponse.message ||
                "Unable to load your wallet."
            );
          }

          if (
            !transactionsResponse.success
          ) {
            throw new Error(
              transactionsResponse.message ||
                "Unable to load transactions."
            );
          }

          setWallet(
            walletResponse.wallet
          );

          setTransactions(
            Array.isArray(
              transactionsResponse.transactions
            )
              ? transactionsResponse.transactions
              : []
          );
        } catch (
          error
        ) {
          if (
            !mounted
          ) {
            return;
          }

          console.error(
            "User dashboard data error:",
            error
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "Failed to load dashboard."
          );
        } finally {
          if (
            mounted
          ) {
            setLoading(
              false
            );
          }
        }
      }

      void loadUserDashboard();

      return () => {
        mounted =
          false;
      };
    },
    [
      retryKey,
      user.role,
    ]
  );

  /* =======================================================
     ADMIN DASHBOARD
  ======================================================= */

  if (
    user.role ===
      "admin" ||
    user.role ===
      "super_admin"
  ) {
    return (
      <AdminDashboardOverview />
    );
  }

  /* =======================================================
     DEDICATED DASHBOARDS
  ======================================================= */

  if (
    user.role ===
      "merchant" ||
    user.role ===
      "analyst" ||
    user.role ===
      "support"
  ) {
    return (
      <DashboardLoading
        message={`Opening ${user.role} workspace...`}
      />
    );
  }

  /* =======================================================
     NORMAL USER
  ======================================================= */

  if (
    loading
  ) {
    return (
      <DashboardLoading
        message="Loading your wallet and transactions..."
      />
    );
  }

  if (
    errorMessage ||
    !wallet
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600 dark:bg-red-950/20 dark:text-red-400">
            !
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-card-foreground">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage ||
              "Dashboard information is currently unavailable."}
          </p>

          <button
            type="button"
            onClick={() => {
              setRetryKey(
                (
                  current
                ) =>
                  current +
                  1
              );
            }}
            className="mt-6 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{
              background:
                "var(--dashboard-primary)",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserDashboardOverview
      user={{
        name:
          user.name,

        email:
          user.email,

        greeting:
          getGreeting(),

        kycStatus:
          user.kycStatus,
      }}
      wallet={
        wallet
      }
      transactions={
        transactions
      }
    />
  );
}