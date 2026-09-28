"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FlaskConical,
  Globe2,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  Store,
} from "lucide-react";

import {
  completeMerchantOnboarding,
  getMerchantOnboardingStatus,
  rememberMerchantUser,
  type CompleteMerchantInput,
  type MerchantAuthUser,
} from "@/lib/api/merchantAuthApi";

type BusinessType =
  CompleteMerchantInput["businessType"];

const businessTypes: Array<{
  value: BusinessType;
  label: string;
}> = [
  {
    value: "individual",
    label: "Individual business",
  },
  {
    value: "sole_proprietorship",
    label: "Sole proprietorship",
  },
  {
    value: "partnership",
    label: "Partnership",
  },
  {
    value: "company",
    label: "Registered company",
  },
  {
    value: "organization",
    label: "Organization",
  },
];

function createSlug(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    )
    .slice(
      0,
      100,
    );
}

function cachedUser(): MerchantAuthUser | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      localStorage.getItem(
        "auth_user",
      );

    return raw
      ? JSON.parse(
          raw,
        ) as MerchantAuthUser
      : null;
  } catch {
    return null;
  }
}

export default function MerchantOnboardingPage() {
  const router =
    useRouter();

  const [checking, setChecking] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [blocked, setBlocked] =
    useState(false);

  const [error, setError] =
    useState("");

  const [businessName, setBusinessName] =
    useState("");

  const [businessDisplayName, setBusinessDisplayName] =
    useState("");

  const [businessType, setBusinessType] =
    useState<BusinessType>(
      "individual",
    );

  const [slug, setSlug] =
    useState("");

  const [slugEdited, setSlugEdited] =
    useState(false);

  const [businessEmail, setBusinessEmail] =
    useState("");

  const [businessPhone, setBusinessPhone] =
    useState("");

  const [websiteUrl, setWebsiteUrl] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [country, setCountry] =
    useState("Bangladesh");

  const [countryCode, setCountryCode] =
    useState("BD");

  const [defaultCurrency, setDefaultCurrency] =
    useState("BDT");

  useEffect(
    () => {
      const stored =
        cachedUser();

      if (stored?.email) {
        setBusinessEmail(
          stored.email,
        );
      }

      if (stored?.phone) {
        setBusinessPhone(
          stored.phone,
        );
      }

      const load =
        async () => {
          try {
            const status =
              await getMerchantOnboardingStatus();

            rememberMerchantUser(
              status.user,
            );

            if (
              status.nextStep ===
              "blocked"
            ) {
              setBlocked(true);
              return;
            }

            if (
              status.hasMerchant
            ) {
              router.replace(
                status.nextStep ===
                  "verification"
                  ? "/dashboard/merchant/verification"
                  : "/dashboard/merchant",
              );
              router.refresh();
            }
          } catch (
            statusError: unknown
          ) {
            setError(
              statusError instanceof Error
                ? statusError.message
                : "Unable to verify your authenticated account.",
            );
          } finally {
            setChecking(false);
          }
        };

      void load();
    },
    [router],
  );

  const handleBusinessName = (
    value: string,
  ) => {
    setBusinessName(
      value,
    );

    if (!slugEdited) {
      setSlug(
        createSlug(
          value,
        ),
      );
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      submitting ||
      checking
    ) {
      return;
    }

    const normalizedEmail =
      businessEmail
        .trim()
        .toLowerCase();

    if (
      businessName.trim().length <
      2
    ) {
      setError(
        "Business name must contain at least 2 characters.",
      );
      return;
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug,
      )
    ) {
      setError(
        "Business slug can contain lowercase letters, numbers and single hyphens only.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError(
        "Enter a valid business email address.",
      );
      return;
    }

    if (
      !/^[A-Z]{2,3}$/.test(
        countryCode,
      ) ||
      !/^[A-Z]{3}$/.test(
        defaultCurrency,
      )
    ) {
      setError(
        "Enter a valid country code and three-letter currency.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const result =
        await completeMerchantOnboarding({
          businessName:
            businessName.trim(),
          businessDisplayName:
            businessDisplayName.trim() ||
            undefined,
          businessType,
          slug,
          businessEmail:
            normalizedEmail,
          businessPhone:
            businessPhone.trim() ||
            undefined,
          websiteUrl:
            websiteUrl.trim() ||
            undefined,
          description:
            description.trim() ||
            undefined,
          country:
            country.trim(),
          countryCode,
          defaultCurrency,
        });

      rememberMerchantUser(
        result.user,
      );

      router.replace(
        "/dashboard/merchant/verification",
      );
      router.refresh();
    } catch (
      onboardingError: unknown
    ) {
      setError(
        onboardingError instanceof Error
          ? onboardingError.message
          : "Unable to create your merchant business.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
          <Building2 className="h-3.5 w-3.5" />
          Business onboarding
        </div>

        <h1 className="text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl dark:text-white">
          Set up your payment gateway
        </h1>

        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 dark:text-slate-400">
          Tell us about the business that will accept customer payments through Coffer. Test checkout is enabled after this step; live access still requires verification.
        </p>
      </header>
      {checking ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center sm:min-h-72 sm:rounded-3xl sm:p-8 dark:border-white/10 dark:bg-white/[0.04]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="mt-4 text-sm font-extrabold text-slate-800 dark:text-slate-200">
            Checking your account…
          </p>
        </div>
      ) : blocked ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:rounded-3xl sm:p-6 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <LockKeyhole className="h-8 w-8" />
          <h2 className="mt-4 text-lg font-black">
            Gateway access is unavailable
          </h2>
          <p className="mt-2 text-xs leading-6">
            This merchant account is suspended or disabled. Contact platform support before trying again.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
              <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
              <div>
                <p className="text-xs font-black text-violet-800 dark:text-violet-200">
                  Test mode available
                </p>
                <p className="mt-1 text-[10px] leading-5 text-violet-700/80 dark:text-violet-300/80">
                  Create sandbox keys and test checkout after onboarding.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/25">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
              <div>
                <p className="text-xs font-black text-amber-800 dark:text-amber-200">
                  Live mode locked
                </p>
                <p className="mt-1 text-[10px] leading-5 text-amber-700/80 dark:text-amber-300/80">
                  Owner e-KYC and business approval are required.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex flex-col items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold leading-5 text-red-700 min-[380px]:flex-row sm:mb-5 sm:gap-3 sm:p-4 sm:text-xs dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">
                {error}
              </span>
              {error.toLowerCase().includes(
                "authentication",
              ) && (
                <Link
                  href="/merchant/sign-in"
                  className="font-black underline"
                >
                  Sign in
                </Link>
              )}
            </div>
          )}

          <form
            onSubmit={(event) => {
              void handleSubmit(
                event,
              );
            }}
            className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4"
          >
            <label className="block">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Legal business name
              </span>
              <span className="relative mt-2 block">
                <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  minLength={2}
                  maxLength={150}
                  required
                  value={businessName}
                  onChange={(event) => {
                    handleBusinessName(
                      event.target.value,
                    );
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder="Example Trading Ltd"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Display name
              </span>
              <span className="relative mt-2 block">
                <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={150}
                  value={businessDisplayName}
                  onChange={(event) => {
                    setBusinessDisplayName(
                      event.target.value,
                    );
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder="Customer-facing name"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Business type
              </span>
              <select
                value={businessType}
                onChange={(event) => {
                  setBusinessType(
                    event.target.value as BusinessType,
                  );
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#0b1120] dark:text-white"
              >
                {businessTypes.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Business slug
              </span>
              <input
                type="text"
                minLength={2}
                maxLength={100}
                required
                value={slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setSlug(
                    createSlug(
                      event.target.value,
                    ),
                  );
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-mono text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                placeholder="example-trading"
              />
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Business email
              </span>
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  maxLength={254}
                  required
                  value={businessEmail}
                  onChange={(event) => {
                    setBusinessEmail(
                      event.target.value,
                    );
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder="payments@business.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Business phone
              </span>
              <span className="relative mt-2 block">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  maxLength={40}
                  value={businessPhone}
                  onChange={(event) => {
                    setBusinessPhone(
                      event.target.value.replace(
                        /[^\d+\-\s]/g,
                        "",
                      ),
                    );
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder="+8801XXXXXXXXX"
                />
              </span>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Website URL
              </span>
              <span className="relative mt-2 block">
                <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  maxLength={500}
                  value={websiteUrl}
                  onChange={(event) => {
                    setWebsiteUrl(
                      event.target.value,
                    );
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                  placeholder="https://your-business.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Country
              </span>
              <input
                type="text"
                maxLength={100}
                required
                value={country}
                onChange={(event) => {
                  setCountry(
                    event.target.value,
                  );
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              <label className="block">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Code
                </span>
                <input
                  type="text"
                  minLength={2}
                  maxLength={3}
                  required
                  value={countryCode}
                  onChange={(event) => {
                    setCountryCode(
                      event.target.value
                        .toUpperCase()
                        .replace(
                          /[^A-Z]/g,
                          "",
                        ),
                    );
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black uppercase outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Currency
                </span>
                <input
                  type="text"
                  minLength={3}
                  maxLength={3}
                  required
                  value={defaultCurrency}
                  onChange={(event) => {
                    setDefaultCurrency(
                      event.target.value
                        .toUpperCase()
                        .replace(
                          /[^A-Z]/g,
                          "",
                        ),
                    );
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black uppercase outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </label>
            </div>

            <label className="block sm:col-span-2">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Business description
              </span>
              <textarea
                maxLength={2000}
                rows={4}
                value={description}
                onChange={(event) => {
                  setDescription(
                    event.target.value,
                  );
                }}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                placeholder="What does your business sell or provide?"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-50 sm:col-span-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Create gateway profile
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-white/10">
            Wrong account?{" "}
            <Link
              href="/merchant/sign-in"
              className="inline-flex items-center gap-1 font-black text-violet-600 dark:text-violet-300"
            >
              Return to sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
