"use client";

import React, {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Menu,
  Bell,
  CircleUserRound,
} from "lucide-react";

import UserSidebar from "@/components/dashboard/layout/UserSidebar";
import AdminSidebar from "@/components/dashboard/layout/AdminSidebar";

import { apiClient } from "@/lib/api/client";

type UserRole =
  | "admin"
  | "user";

interface StoredUser {
  _id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router =
    useRouter();

  const [
    userRole,
    setUserRole,
  ] =
    useState<UserRole>(
      "user"
    );

  const [
    userName,
    setUserName,
  ] = useState(
    "My Account"
  );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /* =========================================================
     LOAD BASIC USER UI STATE
  ========================================================== */

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem(
          "auth_user"
        );

      if (!savedUser) {
        return;
      }

      const parsedUser =
        JSON.parse(
          savedUser
        ) as StoredUser;

      if (
        parsedUser.role ===
          "admin" ||
        parsedUser.role ===
          "user"
      ) {
        setUserRole(
          parsedUser.role
        );
      }

      if (
        parsedUser.name
      ) {
        setUserName(
          parsedUser.name
        );
      }
    } catch (error) {
      console.error(
        "Unable to read stored user:",
        error
      );
    }
  }, []);

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
        localStorage.removeItem(
          "auth_user"
        );

        localStorage.removeItem(
          "is_authenticated"
        );

        localStorage.removeItem(
          "token"
        );

        router.replace(
          "/login"
        );
      }
    };

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-[#162A43]">

      {/* Mobile backdrop */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-[#0B1F33]/40 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setMobileMenuOpen(
              false
            )
          }
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[280px]
          transition-transform
          duration-300
          lg:static
          lg:translate-x-0

          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
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

      {/* Main area */}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* Navbar */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#E3EAF1] bg-white/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="rounded-xl border border-[#DCE5EE] p-2 text-[#405169] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-sm font-bold text-[#162A43] sm:text-base">
              {userRole ===
              "admin"
                ? "Admin Control Center"
                : "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE5EE] bg-white"
            >
              <Bell className="h-4 w-4" />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-[#DCE5EE] bg-white px-3 py-1.5">
              <CircleUserRound className="h-5 w-5 text-[#1F5EA8]" />

              <div className="hidden text-left sm:block">
                <p className="max-w-[130px] truncate text-[10px] font-bold text-[#334155]">
                  {userName}
                </p>

                <p className="text-[8px] capitalize text-slate-400">
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic page */}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}