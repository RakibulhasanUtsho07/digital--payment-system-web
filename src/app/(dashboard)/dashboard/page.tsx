"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import UserDashboardOverview from "@/components/dashboard/views/UserDashboardOverview";
import AdminDashboardOverview from "@/components/dashboard/views/AdminDashboardOverview";
import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type UserRole = "admin" | "user";

type KYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

type TransactionType = "TRANSFER" | "DEPOSIT" | "WITHDRAW";

type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

type RiskScore = "LOW" | "MEDIUM" | "HIGH";

interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  kycStatus: KYCStatus;
}

interface ProfileResponse {
  success: boolean;
  user: CurrentUser;
}

interface WalletData {
  _id: string;
  userId: string;
  balance: number;
  [key: string]: unknown;
}

interface WalletResponse {
  success: boolean;
  wallet: WalletData;
}

interface PopulatedUser {
  _id: string;
  name?: string;
  email?: string;
}

interface TransactionData {
  _id: string;
  senderId: string | PopulatedUser;
  receiverId: string | PopulatedUser;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  reference?: string;
  riskScore: RiskScore;
  createdAt?: string;
  updatedAt?: string;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  transactions: TransactionData[];
}

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* =========================================================
     LOAD DATA
  ========================================================== */

useEffect(() => {
  let mounted = true;

  const loadDashboard =
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          profileResponse,
          walletResponse,
          transactionsResponse,
        ] =
          await Promise.all([
            apiClient<ProfileResponse>(
              "/users/profile"
            ),

            apiClient<WalletResponse>(
              "/wallet"
            ),

            apiClient<TransactionsResponse>(
              "/transactions"
            ),
          ]);

        if (!mounted) {
          return;
        }

        if (
          !profileResponse.success ||
          !profileResponse.user
        ) {
          throw new Error(
            "Unable to load your profile."
          );
        }

        if (
          !walletResponse.success ||
          !walletResponse.wallet
        ) {
          throw new Error(
            "Unable to load your wallet."
          );
        }

        if (
          !transactionsResponse.success
        ) {
          throw new Error(
            "Unable to load transactions."
          );
        }

        setUser(
          profileResponse.user
        );

        setWallet(
          walletResponse.wallet
        );

        setTransactions(
          transactionsResponse.transactions ??
            []
        );
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );

        if (!mounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load dashboard.";

        setErrorMessage(
          message
        );

        const lowerMessage =
          message.toLowerCase();

        if (
          lowerMessage.includes(
            "unauthorized"
          ) ||
          lowerMessage.includes(
            "not authorized"
          ) ||
          lowerMessage.includes(
            "authentication"
          ) ||
          lowerMessage.includes(
            "token failed"
          )
        ) {
          localStorage.removeItem(
            "auth_user"
          );

          localStorage.removeItem(
            "is_authenticated"
          );

          router.replace(
            "/login"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

  loadDashboard();

  return () => {
    mounted = false;
  };
}, [router]);
  /* =========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F5EA8]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">
              Loading dashboard
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Fetching wallet and transaction data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================== */

  if (errorMessage || !user || !wallet) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600">
            !
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage || "Dashboard information is currently unavailable."}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17466F]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     ADMIN
  ========================================================== */

  if (user.role === "admin") {
    return (
      // Fixed: Removed the `user` prop since AdminDashboardOverview doesn't accept it.
      // If you MUST pass the user prop because you use it in the child component, 
      // you can use: <AdminDashboardOverview {...({ user: { name: user.name } } as any)} />
      <AdminDashboardOverview />
    );
  }

  /* =========================================================
     USER
  ========================================================== */

  return (
    <UserDashboardOverview
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        greeting: getGreeting(),
        kycStatus: user.kycStatus,
      }}
      wallet={wallet}
      transactions={transactions}
    />
  );
}

/* =========================================================
   GREETING
========================================================= */

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}