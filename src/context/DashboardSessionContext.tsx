"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type {
  DashboardRole,
} from "@/lib/auth/dashboardRoles";

/* =========================================================
   KYC STATUS
========================================================= */

export type DashboardKYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

/* =========================================================
   USER
========================================================= */

export interface DashboardUser {
  _id: string;

  name: string;

  email: string;

  phone?: string;

  role: DashboardRole;

  kycStatus:
    DashboardKYCStatus;

  avatarUrl?: string;
}

/* =========================================================
   CONTEXT
========================================================= */

interface DashboardSessionContextValue {
  user:
    DashboardUser;
}

const DashboardSessionContext =
  createContext<
    DashboardSessionContextValue |
    undefined
  >(
    undefined
  );

/* =========================================================
   PROVIDER
========================================================= */

export function DashboardSessionProvider({
  user,
  children,
}: {
  user: DashboardUser;

  children: ReactNode;
}) {
  return (
    <DashboardSessionContext.Provider
      value={{
        user,
      }}
    >
      {children}
    </DashboardSessionContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useDashboardSession():
  DashboardSessionContextValue {
  const context =
    useContext(
      DashboardSessionContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useDashboardSession must be used inside DashboardSessionProvider."
    );
  }

  return context;
}