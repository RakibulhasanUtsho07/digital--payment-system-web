"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "admin"
  | "user"
  | "merchant"
  | "support"
  | "analyst"
  | "super_admin";

type KYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

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

/* =========================================================
   CONSTANTS
========================================================= */

const REQUEST_TIMEOUT_MS = 12_000;

/* =========================================================
   SUPPORT DASHBOARD LAYOUT
========================================================= */

export default function SupportDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const pathname =
    usePathname();

  const [
    authorized,
    setAuthorized,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =======================================================
     VERIFY SUPPORT ROLE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function verifySupportAccess() {
      try {
        setLoading(true);

        setErrorMessage("");

        const response =
          await withTimeout(
            apiClient<ProfileResponse>(
              "/users/profile"
            ),
            REQUEST_TIMEOUT_MS,
            "Profile request timed out. Check that the backend is running on port 5000."
          );

        if (!mounted) {
          return;
        }

        if (
          !response.success ||
          !response.user
        ) {
          throw new Error(
            "Unable to verify your account."
          );
        }

        /* =================================================
           SUPPORT ONLY
        ================================================= */

        if (
          response.user.role !==
          "support"
        ) {
          /*
           * This route group belongs exclusively to
           * Support Agents.
           *
           * Admin/Super Admin should use their own
           * dashboard and existing Admin Support page.
           */
          router.replace(
            "/dashboard"
          );

          return;
        }

        setAuthorized(
          true
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to verify Support access.";

        console.error(
          "Support dashboard authorization error:",
          error
        );

        setErrorMessage(
          message
        );

        if (
          isAuthenticationError(
            message
          )
        ) {
          clearAuthenticationStorage();

          router.replace(
            "/login"
          );

          return;
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void verifySupportAccess();

    return () => {
      mounted = false;
    };
  }, [
    router,
    pathname,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-[0_14px_34px_rgba(16,185,129,0.25)]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>

          <div className="text-center">
            <p className="text-sm font-black text-slate-800">
              Loading Support Console
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Verifying Support Agent permissions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (errorMessage) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-[28px] border border-red-200 bg-white p-7 text-center shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600">
            !
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-red-500">
            Support Access Error
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-900">
            Unable to open Support Console
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     AUTHORIZED
  ======================================================= */

  if (!authorized) {
    return null;
  }

  return (
    <>
      {children}
    </>
  );
}

/* =========================================================
   AUTHENTICATION ERROR
========================================================= */

function isAuthenticationError(
  message: string
): boolean {
  const value =
    message.toLowerCase();

  return (
    value.includes(
      "unauthorized"
    ) ||
    value.includes(
      "not authorized"
    ) ||
    value.includes(
      "authentication"
    ) ||
    value.includes(
      "invalid token"
    ) ||
    value.includes(
      "token failed"
    ) ||
    value.includes(
      "401"
    )
  );
}

/* =========================================================
   AUTH STORAGE CLEANUP
========================================================= */

function clearAuthenticationStorage() {
  localStorage.removeItem(
    "auth_user"
  );

  localStorage.removeItem(
    "is_authenticated"
  );

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "digital_wallet_token"
  );
}

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
        (value) => {
          globalThis.clearTimeout(
            timer
          );

          resolve(
            value
          );
        },
        (error) => {
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