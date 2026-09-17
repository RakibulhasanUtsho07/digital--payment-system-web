import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  BadgeCheck,
  Braces,
  CreditCard,
  ShieldCheck,
  Store,
} from "lucide-react";

interface MerchantAuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const benefits = [
  {
    icon:
      CreditCard,
    title:
      "Accept Coffer payments",
    description:
      "Create payments and send customers to secure hosted checkout.",
  },
  {
    icon:
      Braces,
    title:
      "Test before going live",
    description:
      "Use sandbox keys, test orders and signed webhooks safely.",
  },
  {
    icon:
      BadgeCheck,
    title:
      "Controlled live access",
    description:
      "Live keys unlock only after owner identity and business approval.",
  },
];

export default function MerchantAuthShell({
  eyebrow,
  title,
  description,
  children,
}: MerchantAuthShellProps) {
  return (
    <main className="min-h-dvh bg-slate-950 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100dvh-24px)] max-w-[1450px] overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-2xl shadow-black/25 sm:min-h-[calc(100dvh-40px)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
                <Store className="h-5 w-5" />
              </span>

              <span>
                <span className="block text-base font-black tracking-tight">
                  DAMO
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                  Merchant Gateway
                </span>
              </span>
            </Link>

            <div className="mt-16 max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure merchant access
              </span>

              <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.045em] xl:text-5xl">
                One account for your wallet and payment business.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
                Sign in with a protected Coffer identity, configure your business and integrate payments without creating a second password system.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-3">
            {benefits.map(
              (benefit) => {
                const Icon =
                  benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-4 w-4" />
                    </span>

                    <span>
                      <span className="block text-xs font-extrabold">
                        {benefit.title}
                      </span>
                      <span className="mt-1 block text-[11px] leading-5 text-white/60">
                        {benefit.description}
                      </span>
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <section className="flex min-h-full items-center justify-center bg-slate-50 px-4 py-8 dark:bg-[#070b14] sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-xl">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white lg:hidden"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Store className="h-4 w-4" />
              </span>
              DAMO Merchant
            </Link>

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              {eyebrow}
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
              {title}
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-400">
              {description}
            </p>

            <div className="mt-7">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
