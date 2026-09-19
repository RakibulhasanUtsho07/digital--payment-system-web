"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  CreditCard,
  Eye,
  Fingerprint,
  IdCard,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportCustomerProfile,
  type SupportCustomerRole,
  type SupportCustomerSummary,
} from "@/lib/api/supportDashboardApi";

/* =========================================================
   TYPES
========================================================= */

type RoleFilter =
  | "All"
  | SupportCustomerRole;

type MetricTone =
  | "emerald"
  | "cyan"
  | "violet"
  | "amber";

/* =========================================================
   CONSTANTS
========================================================= */

const ROLE_FILTERS: Array<{
  label: string;
  value: RoleFilter;
  icon: LucideIcon;
}> = [
  {
    label: "All",
    value: "All",
    icon: Users,
  },
  {
    label: "Customers",
    value: "user",
    icon: UserRound,
  },
  {
    label: "Merchants",
    value: "merchant",
    icon: Store,
  },
];

const HERO_PARTICLES = [
  {
    left: "8%",
    top: "24%",
    size: 4,
    delay: 0.2,
    duration: 7.6,
  },
  {
    left: "18%",
    top: "70%",
    size: 3,
    delay: 1.1,
    duration: 8.4,
  },
  {
    left: "31%",
    top: "18%",
    size: 5,
    delay: 0.8,
    duration: 9.6,
  },
  {
    left: "46%",
    top: "74%",
    size: 4,
    delay: 2.0,
    duration: 8.1,
  },
  {
    left: "61%",
    top: "25%",
    size: 3,
    delay: 1.5,
    duration: 7.3,
  },
  {
    left: "73%",
    top: "68%",
    size: 5,
    delay: 0.6,
    duration: 10.1,
  },
  {
    left: "86%",
    top: "24%",
    size: 3,
    delay: 2.4,
    duration: 8.8,
  },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

function formatDateTime(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return date.toLocaleString();
}

function humanize(
  value:
    | string
    | null
    | undefined
): string {
  if (!value) {
    return "Not available";
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function walletBalanceText(
  balance: unknown
): string {
  if (
    typeof balance ===
    "number"
  ) {
    return new Intl.NumberFormat(
      "en-BD",
      {
        maximumFractionDigits:
          2,
      }
    ).format(balance);
  }

  if (
    typeof balance ===
    "string"
  ) {
    const numeric =
      Number(balance);

    if (
      Number.isFinite(
        numeric
      )
    ) {
      return new Intl.NumberFormat(
        "en-BD",
        {
          maximumFractionDigits:
            2,
        }
      ).format(numeric);
    }

    return balance;
  }

  if (
    balance &&
    typeof balance ===
      "object" &&
    "$numberDecimal" in
      balance
  ) {
    const decimal =
      (
        balance as {
          $numberDecimal?: unknown;
        }
      ).$numberDecimal;

    if (
      typeof decimal ===
      "string"
    ) {
      const numeric =
        Number(decimal);

      return Number.isFinite(
        numeric
      )
        ? new Intl.NumberFormat(
            "en-BD",
            {
              maximumFractionDigits:
                2,
            }
          ).format(numeric)
        : decimal;
    }
  }

  return "Not available";
}

function roleLabel(
  role: SupportCustomerRole
): string {
  return role ===
    "merchant"
    ? "Merchant"
    : "Customer";
}

function kycTone(
  status: string
): string {
  const normalized =
    status.toLowerCase();

  if (
    normalized.includes(
      "verified"
    )
  ) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (
    normalized.includes(
      "reject"
    )
  ) {
    return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }

  if (
    normalized.includes(
      "pending"
    ) ||
    normalized.includes(
      "review"
    )
  ) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

/* =========================================================
   MOTION
========================================================= */

const reveal = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(7px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren:
        0.055,
    },
  },
};

/* =========================================================
   METRIC
========================================================= */

function metricTone(
  tone: MetricTone
): {
  shell: string;
  glow: string;
  bar: string;
} {
  if (
    tone ===
    "cyan"
  ) {
    return {
      shell:
        "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      glow:
        "bg-cyan-400/10",
      bar:
        "from-cyan-500 to-sky-400",
    };
  }

  if (
    tone ===
    "violet"
  ) {
    return {
      shell:
        "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-300",
      glow:
        "bg-violet-400/10",
      bar:
        "from-violet-500 to-fuchsia-400",
    };
  }

  if (
    tone ===
    "amber"
  ) {
    return {
      shell:
        "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      glow:
        "bg-amber-400/10",
      bar:
        "from-amber-500 to-orange-400",
    };
  }

  return {
    shell:
      "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    glow:
      "bg-emerald-400/10",
    bar:
      "from-emerald-500 to-teal-400",
  };
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: MetricTone;
}) {
  const styles =
    metricTone(tone);

  return (
    <motion.article
      variants={reveal}
      whileHover={{
        y: -4,
        scale: 1.006,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-emerald-100/90 bg-white p-5 shadow-[0_18px_50px_-40px_rgba(5,150,105,.48)] dark:border-white/10 dark:bg-slate-950/70"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-3 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.08,
          }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${styles.shell}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
        <motion.div
          initial={{
            width: "24%",
          }}
          animate={{
            width: [
              "24%",
              "78%",
              "54%",
            ],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
        />
      </div>
    </motion.article>
  );
}

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{
        once: true,
        amount: 0.08,
      }}
      className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_20px_60px_-45px_rgba(5,150,105,.42)] dark:border-white/10 dark:bg-slate-950/70"
    >
      <div className="flex flex-col gap-3 border-b border-emerald-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div className="flex items-start gap-3">
          <motion.div
            whileHover={{
              rotate: 8,
              scale: 1.06,
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          >
            <Icon className="h-5 w-5" />
          </motion.div>

          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </motion.section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportCustomersPage() {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    role,
    setRole,
  ] =
    useState<RoleFilter>(
      "All"
    );

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(1);

  const [
    customers,
    setCustomers,
  ] =
    useState<
      SupportCustomerSummary[]
    >([]);

  const [
    selectedId,
    setSelectedId,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    profile,
    setProfile,
  ] =
    useState<
      SupportCustomerProfile |
      null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    profileLoading,
    setProfileLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);

  useEffect(() => {
    let active =
      true;

    const timer =
      window.setTimeout(
        () => {
          void (
            async () => {
              if (
                customers.length ===
                0
              ) {
                setLoading(
                  true
                );
              } else {
                setRefreshing(
                  true
                );
              }

              setError("");

              try {
                const result =
                  await supportDashboardApi.searchCustomers(
                    {
                      search:
                        search.trim() ||
                        undefined,
                      role:
                        role ===
                        "All"
                          ? undefined
                          : role,
                      page,
                      limit:
                        20,
                    }
                  );

                if (
                  !active
                ) {
                  return;
                }

                setCustomers(
                  result.customers
                );

                setTotal(
                  result.total
                );

                setTotalPages(
                  Math.max(
                    1,
                    result.totalPages
                  )
                );
              } catch (
                requestError:
                  unknown
              ) {
                if (
                  active
                ) {
                  setError(
                    messageOf(
                      requestError
                    )
                  );
                }
              } finally {
                if (
                  active
                ) {
                  setLoading(
                    false
                  );

                  setRefreshing(
                    false
                  );
                }
              }
            }
          )();
        },
        250
      );

    return () => {
      active =
        false;

      window.clearTimeout(
        timer
      );
    };
  }, [
    search,
    role,
    page,
    refreshKey,
  ]);

  useEffect(() => {
    if (
      !selectedId
    ) {
      setProfile(
        null
      );

      return;
    }

    let active =
      true;

    setProfileLoading(
      true
    );

    setProfile(
      null
    );

    setError("");

    void supportDashboardApi
      .getCustomer(
        selectedId
      )
      .then(
        (
          result
        ) => {
          if (
            active
          ) {
            setProfile(
              result.customer
            );
          }
        }
      )
      .catch(
        (
          requestError:
            unknown
        ) => {
          if (
            active
          ) {
            setError(
              messageOf(
                requestError
              )
            );
          }
        }
      )
      .finally(
        () => {
          if (
            active
          ) {
            setProfileLoading(
              false
            );
          }
        }
      );

    return () => {
      active =
        false;
    };
  }, [
    selectedId,
  ]);

  useEffect(() => {
    if (
      !selectedId
    ) {
      return;
    }

    function onKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setSelectedId(
          null
        );
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [
    selectedId,
  ]);

  const currentPageWallets =
    useMemo(
      () =>
        customers.filter(
          (
            customer
          ) =>
            customer.walletLinked
        ).length,
      [
        customers,
      ]
    );

  const currentPageVerified =
    useMemo(
      () =>
        customers.filter(
          (
            customer
          ) =>
            customer.kycStatus
              .toLowerCase()
              .includes(
                "verified"
              )
        ).length,
      [
        customers,
      ]
    );

  const currentPageMerchants =
    useMemo(
      () =>
        customers.filter(
          (
            customer
          ) =>
            customer.role ===
            "merchant"
        ).length,
      [
        customers,
      ]
    );

  return (
    <main className="space-y-6">
      {/* ===================================================
          HERO
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.55,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
        className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_48%,#065F46_100%)] p-6 text-white shadow-[0_28px_80px_-42px_rgba(5,150,105,.58)] md:p-7 lg:p-8"
      >
        <motion.div
          animate={{
            x: [
              0,
              30,
              -12,
              0,
            ],
            y: [
              0,
              -16,
              11,
              0,
            ],
            scale: [
              1,
              1.12,
              0.96,
              1,
            ],
          }}
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-emerald-300/15 blur-[90px]"
        />

        <motion.div
          animate={{
            x: [
              0,
              -22,
              16,
              0,
            ],
            y: [
              0,
              17,
              -9,
              0,
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[20%] h-72 w-72 rounded-full bg-cyan-300/10 blur-[100px]"
        />

        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:23px_23px]" />

        {HERO_PARTICLES.map(
          (
            particle,
            index
          ) => (
            <motion.span
              key={
                `${particle.left}-${particle.top}-${index}`
              }
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.78)]"
              style={{
                left:
                  particle.left,
                top:
                  particle.top,
                width:
                  particle.size,
                height:
                  particle.size,
              }}
              animate={{
                y: [
                  0,
                  -13,
                  5,
                  0,
                ],
                x: [
                  0,
                  6,
                  -4,
                  0,
                ],
                opacity: [
                  0.18,
                  0.8,
                  0.32,
                  0.18,
                ],
                scale: [
                  0.8,
                  1.25,
                  0.95,
                  0.8,
                ],
              }}
              transition={{
                duration:
                  particle.duration,
                delay:
                  particle.delay,
                repeat:
                  Infinity,
                ease:
                  "easeInOut",
              }}
            />
          )
        )}

        <motion.div
          animate={{
            x: [
              "-30%",
              "130%",
            ],
          }}
          transition={{
            duration: 5.8,
            repeat: Infinity,
            repeatDelay: 2.6,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-emerald-100 to-transparent shadow-[0_0_18px_rgba(209,250,229,.9)]"
        />

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-100 backdrop-blur">
                <Search className="h-3.5 w-3.5" />

                Customer Search
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/15 bg-cyan-100/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />

                Support read-only lookup
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.03em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
              Find customers and merchants
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/75">
              Search by name, email, phone, or account ID, then inspect identity,
              account, verification and wallet context without leaving the support
              console.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-emerald-50/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Users className="h-3.5 w-3.5" />
                {total.toLocaleString("en-BD")} matches
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <Eye className="h-3.5 w-3.5" />
                Profile inspection
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                <WalletCards className="h-3.5 w-3.5" />
                Wallet context
              </span>
            </div>
          </div>

          <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row xl:flex-col">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 19,
                repeat: Infinity,
                ease: "linear",
              }}
              className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-emerald-100/20 xl:block"
            >
              <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-100 shadow-[0_0_12px_rgba(209,250,229,.9)]" />
            </motion.div>

            <button
              type="button"
              disabled={
                refreshing ||
                loading
              }
              onClick={() =>
                setRefreshKey(
                  (
                    value
                  ) =>
                    value +
                    1
                )
              }
              className="relative inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-900 shadow-[0_12px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  refreshing ||
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh results
            </button>
          </div>
        </div>

        {(refreshing ||
          loading) && (
          <motion.div
            initial={{
              scaleX: 0,
            }}
            animate={{
              scaleX: 1,
            }}
            transition={{
              duration: 1.15,
              repeat: Infinity,
            }}
            className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-emerald-100 to-transparent"
          />
        )}
      </motion.section>

      {/* ===================================================
          SEARCH / FILTERS
      ==================================================== */}

      <motion.section
        initial={{
          opacity: 0,
          y: 12,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.08,
          duration: 0.45,
        }}
        className="relative z-20 overflow-hidden rounded-[26px] border border-emerald-100 bg-white p-4 shadow-[0_18px_55px_-42px_rgba(5,150,105,.45)] dark:border-white/10 dark:bg-slate-950/70"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Search account
            </p>

            <label className="flex h-12 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.035]">
              <Search className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
                  );

                  setPage(
                    1
                  );
                }}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                placeholder="Name, email, phone, or account ID"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch(
                      ""
                    );

                    setPage(
                      1
                    );
                  }}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-emerald-100 hover:text-emerald-700"
                  aria-label="Clear customer search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>

          <div>
            <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Account role
            </p>

            <div className="flex flex-wrap gap-2">
              {ROLE_FILTERS.map(
                (
                  item
                ) => {
                  const Icon =
                    item.icon;

                  const active =
                    item.value ===
                    role;

                  return (
                    <motion.button
                      key={
                        item.value
                      }
                      type="button"
                      whileHover={{
                        y:
                          -1,
                      }}
                      whileTap={{
                        scale:
                          0.98,
                      }}
                      onClick={() => {
                        setRole(
                          item.value
                        );

                        setPage(
                          1
                        );
                      }}
                      className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 text-xs font-black transition ${
                        active
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,.18)]"
                          : "border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {
                        item.label
                      }
                    </motion.button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===================================================
          ERROR
      ==================================================== */}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            role="alert"
            className="flex items-start gap-3 rounded-[22px] border border-rose-500/20 bg-rose-500/[0.06] p-4 text-rose-700 dark:text-rose-300"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-black">
                Customer lookup failed
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================
          METRICS
      ==================================================== */}

      <motion.section
        variants={
          stagger
        }
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Matching accounts"
          value={
            total.toLocaleString(
              "en-BD"
            )
          }
          description="Total server-side search matches"
          icon={
            Users
          }
          tone="emerald"
        />

        <MetricCard
          label="Visible merchants"
          value={
            currentPageMerchants.toLocaleString(
              "en-BD"
            )
          }
          description="Merchant accounts on this page"
          icon={
            Store
          }
          tone="violet"
        />

        <MetricCard
          label="Wallet linked"
          value={
            currentPageWallets.toLocaleString(
              "en-BD"
            )
          }
          description="Wallet-linked accounts on this page"
          icon={
            WalletCards
          }
          tone="cyan"
        />

        <MetricCard
          label="KYC verified"
          value={
            currentPageVerified.toLocaleString(
              "en-BD"
            )
          }
          description="Verified KYC accounts on this page"
          icon={
            BadgeCheck
          }
          tone="amber"
        />
      </motion.section>

      {/* ===================================================
          RESULTS
      ==================================================== */}

      <Panel
        title="Customer & Merchant Results"
        description="Real support lookup results from the account service."
        icon={
          CircleUserRound
        }
        action={
          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700 dark:text-emerald-300">
            {customers.length} visible
          </span>
        }
      >
        {loading ? (
          <div className="grid min-h-[330px] place-items-center">
            <div className="text-center">
              <div className="relative mx-auto h-16 w-16">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
                />

                <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-emerald-600" />
              </div>

              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                Searching support accounts
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Reading matching customers and merchants...
              </p>
            </div>
          </div>
        ) : customers.length ===
          0 ? (
          <div className="grid min-h-[330px] place-items-center rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/30 px-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Search className="h-6 w-6" />
              </div>

              <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
                No accounts match this search
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                Try another name, email, phone number, account ID, or role filter.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {customers.map(
                (
                  customer,
                  index
                ) => (
                  <motion.article
                    key={
                      customer.id
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        Math.min(
                          index *
                            0.025,
                          0.18
                        ),
                    }}
                    className="rounded-[20px] border border-emerald-100 bg-emerald-50/20 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {customer.role ===
                          "merchant" ? (
                            <Store className="h-5 w-5" />
                          ) : (
                            <UserRound className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                            {
                              customer.name
                            }
                          </p>

                          <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {
                              customer.email ||
                              customer.id
                            }
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                        {roleLabel(
                          customer.role
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                        <p className="font-bold text-slate-400">
                          KYC
                        </p>
                        <p className="mt-1 truncate font-black text-slate-700 dark:text-slate-200">
                          {humanize(
                            customer.kycStatus
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3 dark:bg-white/5">
                        <p className="font-bold text-slate-400">
                          Wallet
                        </p>
                        <p className="mt-1 font-black text-slate-700 dark:text-slate-200">
                          {customer.walletLinked
                            ? "Linked"
                            : "Not linked"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedId(
                          customer.id
                        )
                      }
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
                    >
                      <Eye className="h-4 w-4" />
                      Open profile
                    </button>
                  </motion.article>
                )
              )}
            </div>

            <div className="support-scroll-hidden hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[920px] text-left">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/60 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400">
                    <th className="px-4 py-3.5">
                      Account
                    </th>

                    <th className="px-4 py-3.5">
                      Role
                    </th>

                    <th className="px-4 py-3.5">
                      Contact
                    </th>

                    <th className="px-4 py-3.5">
                      KYC
                    </th>

                    <th className="px-4 py-3.5">
                      Wallet
                    </th>

                    <th className="px-4 py-3.5">
                      Created
                    </th>

                    <th className="px-4 py-3.5 text-right">
                      Profile
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map(
                    (
                      customer,
                      index
                    ) => (
                      <motion.tr
                        key={
                          customer.id
                        }
                        initial={{
                          opacity: 0,
                          y: 4,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay:
                            Math.min(
                              index *
                                0.02,
                              0.16
                            ),
                        }}
                        className="border-b border-emerald-100/70 text-xs transition hover:bg-emerald-50/60 dark:border-white/5 dark:hover:bg-emerald-500/[0.04]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              {customer.role ===
                              "merchant" ? (
                                <Store className="h-4 w-4" />
                              ) : (
                                <UserRound className="h-4 w-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate font-black text-slate-900 dark:text-white">
                                {
                                  customer.name
                                }
                              </p>

                              <p className="mt-1 max-w-[220px] truncate text-[9px] text-slate-400">
                                {
                                  customer.id
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            {roleLabel(
                              customer.role
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[210px] truncate font-bold text-slate-700 dark:text-slate-200">
                            {customer.email ||
                              "Email unavailable"}
                          </p>

                          <p className="mt-1 max-w-[210px] truncate text-[10px] text-slate-400">
                            {customer.phone ||
                              "Phone unavailable"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${kycTone(
                              customer.kycStatus
                            )}`}
                          >
                            {humanize(
                              customer.kycStatus
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 font-black ${
                              customer.walletLinked
                                ? "text-emerald-600 dark:text-emerald-300"
                                : "text-slate-400"
                            }`}
                          >
                            <WalletCards className="h-3.5 w-3.5" />

                            {customer.walletLinked
                              ? "Linked"
                              : "Not linked"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-[10px] text-slate-500 dark:text-slate-400">
                          {formatDateTime(
                            customer.createdAt
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <motion.button
                            type="button"
                            whileHover={{
                              y: -1,
                            }}
                            whileTap={{
                              scale: 0.98,
                            }}
                            onClick={() =>
                              setSelectedId(
                                customer.id
                              )
                            }
                            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                          >
                            <Eye className="mr-1.5 inline h-3.5 w-3.5" />
                            Open
                          </motion.button>
                        </td>
                      </motion.tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.02]">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Page{" "}
                <span className="font-black text-slate-900 dark:text-white">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-black text-slate-900 dark:text-white">
                  {totalPages}
                </span>{" "}
                ·{" "}
                {total.toLocaleString(
                  "en-BD"
                )}{" "}
                matches
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    page <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (
                        value
                      ) =>
                        value -
                        1
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Previous customer page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      (
                        value
                      ) =>
                        value +
                        1
                    )
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Next customer page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>

      {/* ===================================================
          PROFILE DRAWER
      ==================================================== */}

      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.18,
            }}
            className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-sm"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedId(
                  null
                );
              }
            }}
          >
            <motion.aside
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 30,
              }}
              className="support-scroll-hidden absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white text-slate-900 shadow-[-24px_0_80px_rgba(15,23,42,.32)] dark:bg-slate-950 dark:text-white"
            >
              <div className="sticky top-0 z-20 overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#052E2B_0%,#064E3B_52%,#065F46_100%)] p-5 text-white shadow-lg">
                <motion.div
                  animate={{
                    x: [
                      0,
                      18,
                      -7,
                      0,
                    ],
                    y: [
                      0,
                      -9,
                      6,
                      0,
                    ],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl"
                />

                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100/70">
                      Support customer profile
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black text-white">
                      {profile?.name ||
                        "Loading profile"}
                    </h2>

                    <p className="mt-1 truncate text-[10px] text-emerald-50/55">
                      {selectedId}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        null
                      )
                    }
                    className="rounded-xl border border-white/15 bg-white/10 p-2 text-white transition hover:rotate-3 hover:bg-white/20"
                    aria-label="Close customer profile"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {profileLoading ? (
                <div className="grid min-h-[70vh] place-items-center">
                  <div className="text-center">
                    <div className="relative mx-auto h-16 w-16">
                      <motion.div
                        animate={{
                          rotate:
                            360,
                        }}
                        transition={{
                          duration:
                            4,
                          repeat:
                            Infinity,
                          ease:
                            "linear",
                        }}
                        className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40"
                      />

                      <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-emerald-600" />
                    </div>

                    <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                      Loading account profile...
                    </p>
                  </div>
                </div>
              ) : profile ? (
                <motion.div
                  variants={
                    stagger
                  }
                  initial="hidden"
                  animate="show"
                  className="space-y-5 p-5 sm:p-6"
                >
                  <motion.section
                    variants={
                      reveal
                    }
                    className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50/45 p-5 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

                    <div className="relative flex items-start gap-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-emerald-600 text-white shadow-[0_12px_30px_rgba(5,150,105,.18)]">
                        {profile.role ===
                        "merchant" ? (
                          <Store className="h-6 w-6" />
                        ) : (
                          <UserRound className="h-6 w-6" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">
                            {
                              profile.name
                            }
                          </h3>

                          <span className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.07] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            {roleLabel(
                              profile.role
                            )}
                          </span>
                        </div>

                        <p className="mt-1 break-all text-[10px] text-slate-500 dark:text-slate-400">
                          {
                            profile.id
                          }
                        </p>
                      </div>
                    </div>
                  </motion.section>

                  <Panel
                    title="Identity & Contact"
                    description="Account identity and verified contact context."
                    icon={
                      IdCard
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          label:
                            "Email",
                          value:
                            profile.email ||
                            "Not available",
                          icon:
                            Mail,
                        },
                        {
                          label:
                            "Phone",
                          value:
                            profile.phone ||
                            "Not available",
                          icon:
                            Phone,
                        },
                        {
                          label:
                            "KYC status",
                          value:
                            humanize(
                              profile.kycStatus
                            ),
                          icon:
                            Fingerprint,
                        },
                        {
                          label:
                            "Account status",
                          value:
                            humanize(
                              profile.accountStatus
                            ),
                          icon:
                            ShieldCheck,
                        },
                      ].map(
                        (
                          item
                        ) => {
                          const Icon =
                            item.icon;

                          return (
                            <motion.div
                              key={
                                item.label
                              }
                              whileHover={{
                                y:
                                  -2,
                              }}
                              className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                            >
                              <Icon className="h-4 w-4 text-emerald-600" />

                              <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                                {
                                  item.label
                                }
                              </p>

                              <p className="mt-1 break-words text-xs font-black text-slate-800 dark:text-slate-100">
                                {
                                  item.value
                                }
                              </p>
                            </motion.div>
                          );
                        }
                      )}
                    </div>

                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Email verification
                          </p>

                          <p className="mt-1 text-xs font-black text-slate-800 dark:text-slate-100">
                            {profile.emailVerified
                              ? "Verified"
                              : "Not verified"}
                          </p>
                        </div>

                        <BadgeCheck
                          className={`h-5 w-5 ${
                            profile.emailVerified
                              ? "text-emerald-600"
                              : "text-slate-300"
                          }`}
                        />
                      </div>

                      <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                        {profile.emailVerifiedAt
                          ? formatDateTime(
                              profile.emailVerifiedAt
                            )
                          : "No verification timestamp"}
                      </p>
                    </div>
                  </Panel>

                  <Panel
                    title="Wallet Context"
                    description="Wallet link, balance and current wallet status."
                    icon={
                      WalletCards
                    }
                  >
                    {profile.wallet ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/35 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                          <CreditCard className="h-5 w-5 text-emerald-600" />

                          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Wallet balance
                          </p>

                          <p className="mt-1 break-words text-xl font-black text-slate-950 dark:text-white">
                            {walletBalanceText(
                              profile.wallet.balance
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/35 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                          <WalletCards className="h-5 w-5 text-emerald-600" />

                          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Wallet status
                          </p>

                          <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">
                            {humanize(
                              profile.wallet.status
                            )}
                          </p>

                          <p className="mt-2 break-all text-[9px] text-slate-400">
                            {
                              profile.wallet.id
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/20 text-center dark:border-white/10 dark:bg-white/[0.02]">
                        <div>
                          <WalletCards className="mx-auto h-6 w-6 text-slate-300" />

                          <p className="mt-2 text-xs font-bold text-slate-500">
                            No wallet linked to this account
                          </p>
                        </div>
                      </div>
                    )}
                  </Panel>

                  <Panel
                    title="Account Timeline"
                    description="Account creation and most recent update timestamps."
                    icon={
                      Clock3
                    }
                  >
                    <div className="relative space-y-3 pl-7">
                      <div className="absolute bottom-2 left-[9px] top-2 w-px bg-emerald-100 dark:bg-white/10" />

                      {[
                        {
                          label:
                            "Account created",
                          value:
                            profile.createdAt,
                        },
                        {
                          label:
                            "Last updated",
                          value:
                            profile.updatedAt,
                        },
                      ].map(
                        (
                          item,
                          index
                        ) => (
                          <motion.div
                            key={
                              item.label
                            }
                            initial={{
                              opacity:
                                0,
                              x:
                                8,
                            }}
                            animate={{
                              opacity:
                                1,
                              x:
                                0,
                            }}
                            transition={{
                              delay:
                                index *
                                0.05,
                            }}
                            className="relative rounded-2xl border border-emerald-100 bg-emerald-50/25 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]"
                          >
                            <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.10)] dark:border-slate-950" />

                            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">
                              {
                                item.label
                              }
                            </p>

                            <p className="mt-1 text-xs font-black text-slate-800 dark:text-slate-100">
                              {formatDateTime(
                                item.value
                              )}
                            </p>
                          </motion.div>
                        )
                      )}
                    </div>
                  </Panel>

                  <motion.div
                    variants={
                      reveal
                    }
                    className="rounded-[22px] border border-emerald-100 bg-emerald-50/35 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                          Support lookup boundary
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                          This profile view is read-only. It does not modify the
                          customer, merchant, KYC state, or wallet.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="grid min-h-[60vh] place-items-center px-6 text-center">
                  <div>
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />

                    <p className="mt-3 text-sm font-black">
                      Profile unavailable
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Close the drawer and try the lookup again.
                    </p>
                  </div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .support-scroll-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .support-scroll-hidden::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .support-scroll-hidden::-webkit-scrollbar-thumb,
        .support-scroll-hidden::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </main>
  );
}
