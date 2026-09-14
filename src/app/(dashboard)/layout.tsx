"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import AdminSidebar from "@/components/dashboard/layout/AdminSidebar";
import AnalystSidebar from "@/components/dashboard/layout/AnalystSidebar";
import MerchantSidebar from "@/components/dashboard/layout/MerchantSidebar";
import SupportSidebar from "@/components/dashboard/layout/SupportSidebar";
import TopNavbar from "@/components/dashboard/layout/TopNavbar";
import UserSidebar from "@/components/dashboard/layout/UserSidebar";

import {
  DashboardSessionProvider,
  type DashboardKYCStatus,
  type DashboardUser,
} from "@/context/DashboardSessionContext";

import {
  apiClient,
} from "@/lib/api/client";

import {
  getDashboardHome,
  getRoleRedirectPath,
  isDashboardRole,
  type DashboardRole,
} from "@/lib/auth/dashboardRoles";

/* =========================================================
   PROFILE RESPONSE
========================================================= */

interface RawProfileUser {
  _id?: unknown;

  name?: unknown;

  email?: unknown;

  phone?: unknown;

  role?: unknown;

  kycStatus?: unknown;

  avatarUrl?: unknown;
}

interface ProfileResponse {
  success:
    boolean;

  user?:
    RawProfileUser;

  message?:
    string;
}

/* =========================================================
   KYC STATUS
========================================================= */

function isKYCStatus(
  value: unknown
): value is DashboardKYCStatus {
  return (
    value ===
      "not_started" ||
    value ===
      "pending" ||
    value ===
      "under_review" ||
    value ===
      "verified" ||
    value ===
      "rejected"
  );
}

/* =========================================================
   NORMALIZE PROFILE

   IMPORTANT:
   Backend profile is the source of truth.

   localStorage role is NOT trusted.
========================================================= */

function normalizeProfileUser(
  raw:
    RawProfileUser
): DashboardUser {
  if (
    !raw._id
  ) {
    throw new Error(
      "Authenticated user ID is missing."
    );
  }

  if (
    !isDashboardRole(
      raw.role
    )
  ) {
    throw new Error(
      "This account has an unsupported dashboard role."
    );
  }

  return {
    _id:
      String(
        raw._id
      ),

    name:
      typeof raw.name ===
        "string" &&
      raw.name.trim()
        ? raw.name.trim()
        : "My Account",

    email:
      typeof raw.email ===
        "string"
        ? raw.email
        : "",

    phone:
      typeof raw.phone ===
        "string"
        ? raw.phone
        : undefined,

    role:
      raw.role,

    kycStatus:
      isKYCStatus(
        raw.kycStatus
      )
        ? raw.kycStatus
        : "not_started",

    avatarUrl:
      typeof raw.avatarUrl ===
        "string" &&
      raw.avatarUrl.trim()
        ? raw.avatarUrl
        : undefined,
  };
}

/* =========================================================
   LOCAL AUTH CACHE

   This is UI cache only.

   It is NOT used for authorization.
========================================================= */

function clearLocalAuth(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

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
   AUTH ERROR
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
      "session has been revoked"
    ) ||
    value.includes(
      "session is no longer active"
    ) ||
    value.includes(
      "401"
    )
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
   LOADING SCREEN
========================================================= */

function LoadingScreen({
  message =
    "Checking your account and permissions...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
          style={{
            background:
              "var(--dashboard-primary)",

            boxShadow:
              "var(--dashboard-shadow)",
          }}
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
   ROLE SIDEBAR
========================================================= */

function RoleSidebar({
  role,
  onLogout,
  onClose,
}: {
  role:
    DashboardRole;

  onLogout:
    () => Promise<void>;

  onClose:
    () => void;
}) {
  switch (role) {
    /* =====================================================
       ADMIN
    ====================================================== */

    case "admin":
    case "super_admin":
      return (
        <AdminSidebar
          onLogout={
            onLogout
          }
        />
      );

    /* =====================================================
       MERCHANT
    ====================================================== */

    case "merchant":
      return (
        <MerchantSidebar
          onLogout={
            onLogout
          }
          onClose={
            onClose
          }
        />
      );

    /* =====================================================
       ANALYST
    ====================================================== */

    case "analyst":
      return (
        <AnalystSidebar
          onLogout={
            onLogout
          }
          onClose={
            onClose
          }
        />
      );

    /* =====================================================
       SUPPORT
    ====================================================== */

    case "support":
      return (
        <SupportSidebar
          onLogout={
            onLogout
          }
          onClose={
            onClose
          }
        />
      );

    /* =====================================================
       NORMAL USER
    ====================================================== */

    case "user":
    default:
      return (
        <UserSidebar
          onLogout={
            onLogout
          }
        />
      );
  }
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

  const pathname =
    usePathname();

  const [
    user,
    setUser,
  ] =
    useState<
      DashboardUser |
      null
    >(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      ""
    );

  const [
    authRedirecting,
    setAuthRedirecting,
  ] =
    useState(
      false
    );

  const [
    retryKey,
    setRetryKey,
  ] =
    useState(
      0
    );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(
      false
    );

  /* =======================================================
     LOAD AUTHENTICATED USER

     Role always comes from backend profile.
  ======================================================= */

  useEffect(
    () => {
      let mounted =
        true;

      async function loadCurrentUser() {
        try {
          setLoading(
            true
          );

          setErrorMessage(
            ""
          );

          setAuthRedirecting(
            false
          );

          const response =
            await withTimeout(
              apiClient<ProfileResponse>(
                "/users/profile"
              ),

              12_000,

              "Profile request timed out. Check that the backend is running."
            );

          if (
            !mounted
          ) {
            return;
          }

          if (
            !response.success ||
            !response.user
          ) {
            throw new Error(
              response.message ||
                "Unable to load authenticated user."
            );
          }

          const authenticatedUser =
            normalizeProfileUser(
              response.user
            );

          /*
           * SERVER ROLE is source of truth.
           */
          setUser(
            authenticatedUser
          );

          /*
           * localStorage is only UI cache.
           */
          localStorage.setItem(
            "auth_user",
            JSON.stringify(
              authenticatedUser
            )
          );

          localStorage.setItem(
            "is_authenticated",
            "true"
          );
        } catch (
          error
        ) {
          if (
            !mounted
          ) {
            return;
          }

          const message =
            error instanceof
              Error
              ? error.message
              : "Unable to verify your account.";

          console.error(
            "Dashboard authentication error:",
            error
          );

          if (
            isAuthenticationError(
              message
            )
          ) {
            setAuthRedirecting(
              true
            );

            clearLocalAuth();

            setUser(
              null
            );

            router.replace(
              "/login"
            );

            return;
          }

          setErrorMessage(
            message
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

      void loadCurrentUser();

      return () => {
        mounted =
          false;
      };
    },
    [
      retryKey,
      router,
    ]
  );

  /* =======================================================
     ROLE ROUTE PROTECTION / REDIRECT
  ======================================================= */

  const roleRedirectPath =
    user
      ? getRoleRedirectPath(
          user.role,
          pathname
        )
      : null;

  useEffect(
    () => {
      if (
        !user ||
        !roleRedirectPath
      ) {
        return;
      }

      closeMobileMenu();

      router.replace(
        roleRedirectPath
      );
    },
    [
      roleRedirectPath,
      router,
      user,
    ]
  );

  /* =======================================================
     MOBILE MENU
  ======================================================= */

  function closeMobileMenu() {
    setMobileMenuOpen(
      false
    );
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout():
    Promise<void> {
    try {
      await apiClient(
        "/auth/logout",
        {
          method:
            "POST",
        }
      );
    } catch (
      error
    ) {
      console.warn(
        "Logout request failed:",
        error
      );
    } finally {
      clearLocalAuth();

      setUser(
        null
      );

      closeMobileMenu();

      window.dispatchEvent(
        new Event(
          "coffer-auth-state-changed"
        )
      );

      router.replace(
        "/login"
      );

      router.refresh();
    }
  }

  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <LoadingScreen />
    );
  }

  /* =======================================================
     AUTH REDIRECT
  ======================================================= */

  if (
    authRedirecting
  ) {
    return (
      <LoadingScreen
        message="Opening login..."
      />
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    errorMessage
  ) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600 dark:bg-red-950/20 dark:text-red-400">
            !
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-card-foreground">
            Unable to verify account
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage}
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

  /* =======================================================
     NO USER
  ======================================================= */

  if (
    !user
  ) {
    return null;
  }

  /* =======================================================
     WAIT WHILE ROLE REDIRECTS
  ======================================================= */

  if (
    roleRedirectPath
  ) {
    return (
      <LoadingScreen
        message={`Opening ${
          user.role
        } workspace...`}
      />
    );
  }

  /* =======================================================
     DASHBOARD UI
  ======================================================= */

  return (
    <DashboardSessionProvider
      user={
        user
      }
    >
      <div className="flex min-h-dvh w-full bg-background text-foreground transition-colors duration-300">
        {/* =================================================
            MOBILE OVERLAY
        ================================================= */}

        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={
              closeMobileMenu
            }
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px] lg:hidden"
          />
        )}

        {/* =================================================
            ROLE SIDEBAR
        ================================================= */}

        <aside
          className={`fixed inset-y-0 left-0 z-50 h-dvh w-[280px] shrink-0 overflow-hidden transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:z-40 lg:translate-x-0 ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <RoleSidebar
            role={
              user.role
            }
            onLogout={
              handleLogout
            }
            onClose={
              closeMobileMenu
            }
          />
        </aside>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col bg-background">
          <TopNavbar
            onMenuClick={() => {
              setMobileMenuOpen(
                (
                  current
                ) =>
                  !current
              );
            }}
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
            avatarUrl={
              user.avatarUrl
            }
          />

          <main className="min-h-0 flex-1 overflow-x-hidden bg-background p-4 transition-colors duration-300 sm:p-5 md:p-6 lg:p-7 xl:p-8">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardSessionProvider>
  );
}