"use client";

import {
  useEffect,
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

export default function MerchantSettingsPage() {
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
      !isMerchantRole
    ) {
      router.replace(
        getDashboardHome(
          user.role,
        ),
      );

      return;
    }

    router.replace(
      "/dashboard/merchant/settings/general",
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

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
          "
        >
          Opening merchant settings
        </p>
      </div>
    </main>
  );
}