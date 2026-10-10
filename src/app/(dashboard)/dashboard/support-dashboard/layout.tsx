"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
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

type AccessState =
  | "checking"
  | "allowed"
  | "denied"
  | "error";

/* =========================================================
   CONSTANTS
========================================================= */

const REQUEST_TIMEOUT_MS =
  12_000;

/* =========================================================
   SUPPORT DASHBOARD LAYOUT

   Security model:
   1. /users/profile verifies the authenticated backend session.
   2. Only the canonical role "support" can render this route group.
   3. Other authenticated roles receive a 404-style screen.
   4. Unauthenticated sessions are sent to /login.
   5. Backend support routes must still enforce requireSupport.
========================================================= */

export default function SupportDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [
    access,
    setAccess,
  ] = useState<AccessState>(
    "checking"
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function verifySupportAccess() {
      setAccess("checking");
      setErrorMessage("");

      try {
        const response =
          await withTimeout(
            apiClient<ProfileResponse>(
              "/users/profile"
            ),
            REQUEST_TIMEOUT_MS,
            "Profile request timed out. Check the backend connection."
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

        if (
          response.user.role !==
          "support"
        ) {
          setAccess("denied");
          return;
        }

        setAccess("allowed");
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (
          isAuthenticationError(
            error
          )
        ) {
          router.replace(
            "/login"
          );
          return;
        }

        console.error(
          "Support dashboard authorization error:",
          error
        );

        setErrorMessage(
          messageOf(error)
        );
        setAccess("error");
      }
    }

    void verifySupportAccess();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (
    access === "checking"
  ) {
    return (
      <SupportAccessLoading />
    );
  }

  if (
    access === "denied"
  ) {
    return (
      <SupportNotFoundState />
    );
  }

  if (
    access === "error"
  ) {
    return (
      <SupportAccessError
        message={
          errorMessage
        }
      />
    );
  }

  return <>{children}</>;
}

/* =========================================================
   LOADING STATE
========================================================= */

function SupportAccessLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-500/15 bg-emerald-600 shadow-[0_18px_45px_rgba(16,185,129,0.24)]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <div className="pointer-events-none absolute -inset-4 rounded-[28px] border border-emerald-500/10" />
        </div>

        <div>
          <p className="text-sm font-black text-foreground">
            Loading Support Console
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Verifying Support Agent permissions...
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   NOT FOUND STATE
========================================================= */

function SupportNotFoundState() {
  return (
    <main className="relative flex min-h-[78vh] items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[120px]" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-border bg-card p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,.10)] sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/[0.08] blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-500/15 bg-emerald-500/10 text-2xl font-black text-emerald-600">
            404
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600">
            Support Console
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Page not found
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            The page you are looking for does not exist or is not available.
          </p>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   ACCESS ERROR
========================================================= */

function SupportAccessError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-rose-500/15 bg-card p-7 text-center shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-rose-500/[0.07] blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-xl font-black text-rose-600">
            !
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-rose-500">
            Support Access Error
          </p>

          <h2 className="mt-2 text-xl font-black text-foreground">
            Unable to open Support Console
          </h2>

          <p className="mt-2 break-words [overflow-wrap:anywhere] text-sm leading-6 text-muted-foreground">
            {message ||
              "Unable to verify Support access."}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 sm:w-auto"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ERROR HELPERS
========================================================= */

function messageOf(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : "Unable to verify Support access.";
}

function isAuthenticationError(
  error: unknown
): boolean {
  const record =
    error &&
    typeof error === "object"
      ? (error as Record<string, unknown>)
      : null;

  const response =
    record?.response &&
    typeof record.response === "object"
      ? (record.response as Record<string, unknown>)
      : null;

  const status = Number(
    record?.status ??
      record?.statusCode ??
      response?.status
  );

  if (status === 401) {
    return true;
  }

  const value =
    messageOf(error)
      .toLowerCase();

  return (
    value.includes("unauthorized") ||
    value.includes("not authorized") ||
    value.includes("authentication") ||
    value.includes("invalid token") ||
    value.includes("token failed") ||
    value.includes("401")
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
          resolve(value);
        },
        (error) => {
          globalThis.clearTimeout(
            timer
          );
          reject(error);
        }
      );
    }
  );
}
