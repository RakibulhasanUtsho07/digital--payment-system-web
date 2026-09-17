"use client";

import type {
  ReactNode,
} from "react";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  Bell,
  Building2,
  CreditCard,
  Palette,
  Paintbrush2,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useMerchantSettings,
} from "../MerchantSettingsContext";

/* =========================================================
   NAV
========================================================= */

const NAV_ITEMS = [
  {
    href:
      "/dashboard/merchant/settings/general",

    label:
      "General",

    icon:
      Settings2,
  },

  {
    href:
      "/dashboard/merchant/settings/business",

    label:
      "Business",

    icon:
      Building2,
  },

  {
    href:
      "/dashboard/merchant/settings/checkout",

    label:
      "Checkout",

    icon:
      CreditCard,
  },

  {
    href:
      "/dashboard/merchant/settings/branding",

    label:
      "Branding",

    icon:
      Paintbrush2,
  },

  {
    href:
      "/dashboard/merchant/settings/theme",

    label:
      "Theme",

    icon:
      Palette,
  },

  {
    href:
      "/dashboard/merchant/settings/notifications",

    label:
      "Notifications",

    icon:
      Bell,
  },

  {
    href:
      "/dashboard/merchant/settings/security",

    label:
      "Security",

    icon:
      ShieldCheck,
  },
];

/* =========================================================
   SHELL
========================================================= */

export default function SettingsShell({
  children,
}: {
  children:
    ReactNode;
}) {
  const pathname =
    usePathname();

  const {
    data,
    loading,
  } =
    useMerchantSettings();

  return (
    <main
      className="
        merchant-theme
        min-h-full
        px-4
        py-5

        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          max-w-[1550px]
          space-y-5
        "
      >
        {/* HERO */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[30px]
            p-5
            text-white

            sm:p-7
          "
          style={{
            background:
              "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
          }}
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-72
              w-72
              rounded-full
              bg-fuchsia-300/20
              blur-3xl
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-5

              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/15
                  bg-white/10
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.15em]
                "
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />

                Merchant configuration
              </div>

              <h1
                className="
                  mt-4
                  text-2xl
                  font-black

                  sm:text-3xl
                "
              >
                Merchant Settings
              </h1>

              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-7
                  text-violet-100/80
                "
              >
                Manage your business preferences, checkout experience,
                branding, appearance, notifications and security.
              </p>
            </div>

            {!loading &&
            data ? (
              <div
                className="
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <span
                  className="
                    rounded-full
                    border
                    border-white/15
                    bg-white/10
                    px-3
                    py-2
                    text-[10px]
                    font-black
                  "
                >
                  {
                    data.merchant
                      .businessName
                  }
                </span>

                <span
                  className="
                    rounded-full
                    bg-white
                    px-3
                    py-2
                    text-[10px]
                    font-black
                    capitalize
                    text-violet-700
                  "
                >
                  {
                    data.merchant
                      .verificationStatus
                  }
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {/* NAVIGATION */}

        <section
          className="
            overflow-x-auto
            rounded-[22px]
            merchant-surface
            p-2

            [scrollbar-width:none]
            [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <nav
            className="
              flex
              min-w-max
              gap-1

              xl:min-w-0
            "
          >
            {NAV_ITEMS.map(
              (
                item,
              ) => {
                const Icon =
                  item.icon;

                const active =
                  pathname ===
                  item.href;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    className={`
                      relative
                      flex
                      min-w-[145px]
                      flex-1
                      items-center
                      justify-center
                      gap-2
                      overflow-hidden
                      rounded-xl
                      px-4
                      py-3
                      text-xs
                      font-black
                      transition

                      ${
                        active
                          ? "text-violet-700 dark:text-violet-200"
                          : "merchant-muted hover:bg-violet-500/5 hover:text-violet-600"
                      }
                    `}
                  >
                    {active ? (
                      <motion.span
                        layoutId="merchant-settings-tab"
                        className="
                          absolute
                          inset-0
                          rounded-xl
                          bg-violet-500/10
                        "
                      />
                    ) : null}

                    <Icon
                      className="
                        relative
                        z-10
                        h-4
                        w-4
                      "
                    />

                    <span
                      className="
                        relative
                        z-10
                      "
                    >
                      {
                        item.label
                      }
                    </span>
                  </Link>
                );
              },
            )}
          </nav>
        </section>

        {/* BODY */}

        {loading ? (
          <div
            className="
              flex
              min-h-[400px]
              items-center
              justify-center
              rounded-[28px]
              merchant-surface
            "
          >
            <div className="text-center">
              <Sparkles
                className="
                  mx-auto
                  h-7
                  w-7
                  animate-pulse
                  text-violet-600
                "
              />

              <p
                className="
                  mt-3
                  text-xs
                  merchant-muted
                "
              >
                Loading merchant settings...
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}