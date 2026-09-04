"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import UserSidebar from "@/components/dashboard/layout/UserSidebar";
import AdminSidebar from "@/components/dashboard/layout/AdminSidebar";
import TopNavbar from "@/components/dashboard/layout/TopNavbar";

import {
  apiClient,
} from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "admin"
  | "user";

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

  kycStatus:
    KYCStatus;
}

interface ProfileResponse {
  success: boolean;
  user: CurrentUser;
}

/* =========================================================
   DASHBOARD LAYOUT
========================================================= */

export default function DashboardLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  /* =========================================================
     USER
  ========================================================== */

  const [
    user,
    setUser,
  ] =
    useState<CurrentUser | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    retryKey,
    setRetryKey,
  ] =
    useState(0);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  /* =========================================================
     LOAD AUTHENTICATED USER FROM BACKEND
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser =
      async () => {
        try {
          setLoading(
            true
          );

          setErrorMessage(
            ""
          );

          const response =
            await withTimeout(
              apiClient<ProfileResponse>(
                "/users/profile"
              ),
              12_000,
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
              "Unable to load authenticated user."
            );
          }

          /* ===============================================
             BACKEND IS SOURCE OF TRUTH
          =============================================== */

          setUser(
            response.user
          );

          /* ===============================================
             OPTIONAL:
             Keep localStorage user metadata synced.

             Authentication itself still comes from
             HttpOnly cookie.
          =============================================== */

          localStorage.setItem(
            "auth_user",
            JSON.stringify(
              response.user
            )
          );

          localStorage.setItem(
            "is_authenticated",
            "true"
          );
        } catch (error) {
          console.error(
            "Dashboard user loading error:",
            error
          );

          if (!mounted) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Unable to verify your account.";

          setErrorMessage(
            message
          );

          const normalizedMessage =
            message.toLowerCase();

          const isAuthenticationError =
            normalizedMessage.includes("unauthorized") ||
            normalizedMessage.includes("not authorized") ||
            normalizedMessage.includes("authentication") ||
            normalizedMessage.includes("invalid token") ||
            normalizedMessage.includes("token failed") ||
            normalizedMessage.includes("401");

          /* ===============================================
             CLEAR OLD CLIENT METADATA
          =============================================== */

          if (isAuthenticationError) {
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

            /* ===============================================
               NOT AUTHENTICATED
            =============================================== */

            router.replace(
              "/login"
            );
          }
        } finally {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, [router, retryKey]);

  /* =========================================================
     MOBILE SIDEBAR
  ========================================================== */

  const closeMobileMenu =
    () => {
      setMobileMenuOpen(
        false
      );
    };

  const toggleMobileMenu =
    () => {
      setMobileMenuOpen(
        (current) =>
          !current
      );
    };

  /* =========================================================
     LOGOUT
  ========================================================== */

  const handleLogout =
    async () => {
      try {
        await apiClient(
          "/auth/logout",
          {
            method:
              "POST",
          }
        );
      } catch (error) {
        console.error(
          "Logout API error:",
          error
        );
      } finally {
        /* ===============================================
           CLEAR CLIENT METADATA
        =============================================== */

        localStorage.removeItem(
          "auth_user"
        );

        localStorage.removeItem(
          "is_authenticated"
        );

        localStorage.removeItem(
          "token"
        );

        setUser(
          null
        );

        closeMobileMenu();

        router.replace(
          "/login"
        );

        router.refresh();
      }
    };

  /* =========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-dvh
          w-full

          items-center
          justify-center

          bg-[#F4F7FB]
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >
          {/* ICON */}

          <div
            className="
              flex
              h-14
              w-14

              items-center
              justify-center

              rounded-2xl

              bg-[#1F5EA8]

              shadow-[0_16px_35px_rgba(31,94,168,0.22)]
            "
          >
            <div
              className="
                h-6
                w-6

                animate-spin

                rounded-full

                border-2
                border-white/30
                border-t-white
              "
            />
          </div>

          {/* TEXT */}

          <div
            className="
              text-center
            "
          >
            <p
              className="
                text-sm
                font-bold

                text-[#162A43]
              "
            >
              Loading dashboard
            </p>

            <p
              className="
                mt-1

                text-xs

                text-slate-400
              "
            >
              Checking your account
              and permissions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     AUTH LOAD ERROR
  ========================================================= */

  if (errorMessage) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#F4F7FB] px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600">
            !
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Unable to verify account
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => setRetryKey((current) => current + 1)}
            className="mt-6 rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17466F]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     USER MISSING
  ========================================================== */

  if (!user) {
    return null;
  }

  /* =========================================================
     ROLE FROM BACKEND
  ========================================================== */

  const userRole =
    user.role;

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div
      className="
        flex
        min-h-dvh
        w-full

        bg-[#F4F7FB]

        text-[#162A43]
      "
    >
      {/* =====================================================
          MOBILE BACKDROP
      ====================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"

          aria-label="Close sidebar"

          onClick={
            closeMobileMenu
          }

          className="
            fixed
            inset-0
            z-40

            bg-[#07182A]/50

            backdrop-blur-[4px]

            lg:hidden
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50

          h-dvh
          w-[280px]
          shrink-0

          overflow-hidden

          transform

          transition-transform
          duration-300

          ease-[cubic-bezier(0.22,1,0.36,1)]

          lg:sticky
          lg:top-0
          lg:z-40
          lg:translate-x-0

          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* ===============================================
            ROLE COMES DIRECTLY FROM BACKEND
        =============================================== */}

        {userRole ===
        "admin" ? (
          <AdminSidebar
            onLogout={
              handleLogout
            }
          />
        ) : (
          <UserSidebar
            onLogout={
              handleLogout
            }
          />
        )}
      </aside>

      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}

      <div
        className="
          flex
          min-h-dvh
          min-w-0
          flex-1
          flex-col
        "
      >
        {/* ===================================================
            TOP NAVBAR
        ==================================================== */}

        <TopNavbar
          onMenuClick={
            toggleMobileMenu
          }

          userName={
            user.name ||
            "My Account"
          }

          userEmail={
            user.email ||
            ""
          }

          userRole={
            user.role
          }
        />

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <main
          className="
            min-h-0
            flex-1

            overflow-x-hidden

            bg-[#F4F7FB]

            p-4

            sm:p-5
            md:p-6
            lg:p-7
            xl:p-8
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-[1440px]
            "
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      }
    );
  });
}
