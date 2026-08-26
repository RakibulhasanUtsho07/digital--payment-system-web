"use client";

import React, {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import UserSidebar from "@/components/dashboard/layout/UserSidebar";
import AdminSidebar from "@/components/dashboard/layout/AdminSidebar";
import TopNavbar from "@/components/dashboard/layout/TopNavbar";

import { apiClient } from "@/lib/api/client";

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | "admin"
  | "user";

interface StoredUser {
  _id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
}

/* =========================================================
   DASHBOARD LAYOUT
========================================================= */

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
    userEmail,
    setUserEmail,
  ] = useState("");

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /* =========================================================
     LOAD USER UI INFORMATION
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

      if (
        parsedUser.email
      ) {
        setUserEmail(
          parsedUser.email
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
     CLOSE MOBILE SIDEBAR
  ========================================================== */

  const closeMobileMenu =
    () => {
      setMobileMenuOpen(
        false
      );
    };

  /* =========================================================
     TOGGLE MOBILE SIDEBAR
  ========================================================== */

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
        localStorage.removeItem(
          "auth_user"
        );

        localStorage.removeItem(
          "is_authenticated"
        );

        localStorage.removeItem(
          "token"
        );

        closeMobileMenu();

        router.replace(
          "/login"
        );
      }
    };

  /* =========================================================
     RETURN
  ========================================================== */

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-[#162A43]">

      {/* =====================================================
          MOBILE SIDEBAR BACKDROP
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
            bg-[#07182A]/45
            backdrop-blur-[3px]
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
          w-[280px]

          transform

          transition-transform
          duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]

          lg:static
          lg:z-auto
          lg:shrink-0
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

      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* ===================================================
            TOP NAVBAR
        ==================================================== */}

        <TopNavbar
          onMenuClick={
            toggleMobileMenu
          }
          userName={
            userName
          }
          userEmail={
            userEmail
          }
          userRole={
            userRole
          }
        />

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}

        <main
          className="
            flex-1
            overflow-x-hidden
            overflow-y-auto

            p-4
            sm:p-5
            md:p-6
            lg:p-7
            xl:p-8
          "
        >
          <div className="mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}