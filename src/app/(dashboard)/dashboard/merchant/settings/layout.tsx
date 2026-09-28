"use client";

import {
  useEffect,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Loader2,
} from "lucide-react";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  MerchantSettingsProvider,
} from "./MerchantSettingsContext";

import SettingsShell
  from "./components/SettingsShell";

export default function MerchantSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router =
    useRouter();

  const {
    user,
  } =
    useDashboardSession();

  const isMerchantRole =
    user.role ===
    "merchant";

  useEffect(() => {
    if (
      isMerchantRole
    ) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role,
      ),
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  if (
    !isMerchantRole
  ) {
    return (
      <main
        className="
          grid
          min-h-[70vh]
          place-items-center
          bg-background
          px-4
          text-foreground
        "
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              border
              border-violet-500/15
              bg-violet-500/10
              text-violet-700
              shadow-sm

              dark:text-violet-300
            "
          >
            <Loader2
              className="
                h-6
                w-6
                animate-spin
              "
            />
          </div>

          <p
            className="
              mt-4
              text-sm
              font-black
              text-slate-950

              dark:text-white
            "
          >
            Opening your workspace
          </p>

          <p
            className="
              mt-1
              max-w-sm
              text-xs
              leading-5
              text-slate-500

              dark:text-slate-400
            "
          >
            Merchant settings are
            available only to merchant
            accounts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <MerchantSettingsProvider>
      <SettingsShell>
        {children}
      </SettingsShell>
    </MerchantSettingsProvider>
  );
}