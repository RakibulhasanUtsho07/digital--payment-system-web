"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { clearAuth } from "@/lib/auth/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    // Remove token + user data
    clearAuth();

    // Redirect to login
    router.replace("/login");
  };

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="dashboard-drawer"
        type="checkbox"
        className="drawer-toggle"
      />

      <div className="drawer-content flex min-h-screen flex-col bg-base-200">
        {/* =====================================================
            NAVBAR
        ====================================================== */}

        <div className="navbar w-full bg-base-100 shadow-sm">
          {/* Mobile menu button */}
          <div className="flex-none lg:hidden">
            <label
              htmlFor="dashboard-drawer"
              aria-label="open sidebar"
              className="btn btn-square btn-ghost"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-6 w-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>

          {/* Brand */}
          <div className="mx-2 flex-1 px-2 text-xl font-bold">
            Digital Wallet
          </div>

          {/* Desktop logout */}
          <div className="hidden flex-none lg:block">
            <ul className="menu menu-horizontal">
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline btn-error"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <div className="drawer-side">
        <label
          htmlFor="dashboard-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />

        <ul className="menu min-h-full w-64 space-y-2 bg-base-100 p-4 text-base-content">
          <li className="menu-title">
            Menu
          </li>

          <li>
            <Link href="/dashboard">
              Overview
            </Link>
          </li>

          <li>
            <Link href="/dashboard/wallet">
              My Wallet
            </Link>
          </li>

          <li>
            <Link href="/dashboard/send">
              Send Money
            </Link>
          </li>

          <li>
            <Link href="/dashboard/transactions">
              Transactions
            </Link>
          </li>

          <li>
            <Link href="/dashboard/kyc">
              KYC
            </Link>
          </li>

          {/* Mobile logout */}
          <li className="mt-auto lg:hidden">
            <button
              type="button"
              onClick={handleLogout}
              className="font-bold text-error"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}