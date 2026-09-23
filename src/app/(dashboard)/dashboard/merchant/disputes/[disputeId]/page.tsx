"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  getMerchantDisputeDetail,
  type MerchantDisputeDetailResponse,
} from "@/lib/api/merchantDisputeApi";

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  amount:
    string,

  currency:
    string
): string {
  const value =
    Number(amount);

  if (
    !Number.isFinite(
      value
    )
  ) {
    return `${currency} 0.00`;
  }

  return `${currency} ${value.toLocaleString(
    "en-BD",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(
  value:
    | string
    | null
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

  return new Intl.DateTimeFormat(
    "en-BD",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function humanize(
  value:
    string
): string {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

function statusMeta(
  status:
    string
) {
  switch (status) {
    case "won":
      return {
        label: "Won",
        icon: CheckCircle2,
        className:
          "bg-emerald-400/15 text-emerald-100",
      };

    case "lost":
      return {
        label: "Lost",
        icon: XCircle,
        className:
          "bg-rose-400/15 text-rose-100",
      };

    case "under_review":
      return {
        label: "Under Review",
        icon: Clock3,
        className:
          "bg-amber-300/15 text-amber-100",
      };

    default:
      return {
        label: "Disputed",
        icon: AlertCircle,
        className:
          "bg-rose-400/15 text-rose-100",
      };
  }
}

/* =========================================================
   AURORA
========================================================= */

function PurpleAuroraBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(132deg,#240B4A 0%,#4C1D95 30%,#6D28D9 60%,#7C3AED 80%,#9333EA 100%)",
        }}
      />

      <motion.div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-28
          h-80
          w-80
          rounded-full
          bg-fuchsia-300/20
          blur-3xl
        "
        animate={{
          x: [
            0,
            22,
            0,
          ],
          y: [
            0,
            -16,
            0,
          ],
          scale: [
            1,
            1.1,
            1,
          ],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MerchantDisputeDetailPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isMerchantRole =
    user.role === "merchant";

  useEffect(() => {
    if (isMerchantRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isMerchantRole,
    router,
    user.role,
  ]);

  const params =
    useParams<{
      disputeId:
        | string
        | string[];
    }>();

  const disputeId =
    useMemo(
      () => {
        const value =
          params.disputeId;

        if (
          typeof value ===
          "string"
        ) {
          return value;
        }

        if (
          Array.isArray(
            value
          )
        ) {
          return (
            value[0] ||
            ""
          );
        }

        return "";
      },
      [
        params,
      ]
    );

  const [
    data,
    setData,
  ] =
    useState<
      MerchantDisputeDetailResponse["data"] | null
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
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const load =
    useCallback(
      async (
        refresh = false
      ) => {
        if (!isMerchantRole) {
          setLoading(false);
          setRefreshing(false);
          setData(null);
          setError(null);

          return;
        }

        if (!disputeId) {
          setError(
            "Dispute ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          if (
            refresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            null
          );

          const response =
            await getMerchantDisputeDetail(
              disputeId
            );

          setData(
            response.data
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Unable to load dispute."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        disputeId,
        isMerchantRole,
      ]
    );

  useEffect(
    () => {
      if (!isMerchantRole) {
        setLoading(false);

        return;
      }

      void load();
    },
    [
      isMerchantRole,
      load,
    ]
  );

  if (!isMerchantRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-background px-4 text-foreground">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-700 shadow-sm dark:text-violet-300">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening your workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Merchant dispute details are available only to merchant accounts.
          </p>
        </div>
      </main>
    );
  }

  if (
    loading &&
    !data
  ) {
    return (
      <main className="merchant-theme min-h-full px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <div className="h-64 animate-pulse rounded-[30px] bg-violet-500/[0.07]" />

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[500px] animate-pulse rounded-[28px] bg-violet-500/[0.04]" />

            <div className="h-[500px] animate-pulse rounded-[28px] bg-violet-500/[0.04]" />
          </div>
        </div>
      </main>
    );
  }

  if (
    !data
  ) {
    return (
      <main className="merchant-theme flex min-h-[560px] items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-[28px] bg-white/75 p-6 text-center dark:bg-slate-950/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-lg font-black merchant-text">
            Unable to load dispute
          </h1>

          <p className="mt-2 text-sm merchant-muted">
            {error ||
              "The dispute could not be found."}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!isMerchantRole) {
                  return;
                }

                void load();
              }}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>

            <Link
              href="/dashboard/merchant/disputes"
              className="rounded-xl bg-violet-500/[0.07] px-4 py-2.5 text-sm font-bold merchant-text"
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const meta =
    statusMeta(
      data.dispute.status
    );

  const CaseStatusIcon =
    meta.icon;

  const publicPaymentId =
    data.payment
      ?.paymentId ||
    data.dispute
      .paymentId;

  return (
    <main className="merchant-theme relative z-0 isolate min-h-full">
      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          {/* TOP */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/dashboard/merchant/disputes"
              className="inline-flex w-fit items-center gap-2 text-sm font-bold merchant-muted hover:text-violet-600"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to disputes
            </Link>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() => {
                if (!isMerchantRole) {
                  return;
                }

                void load(
                  true
                );
              }}
              className="
                inline-flex
                h-10
                w-full
                items-center
                justify-center

                sm:w-auto
                gap-2
                rounded-xl
                bg-violet-500/[0.07]
                px-4
                text-sm
                font-bold
                merchant-text

                hover:bg-violet-500/[0.12]

                disabled:opacity-50
              "
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl bg-rose-500/[0.06] p-4 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          {/* HERO */}

          <motion.section
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              relative
              mb-6
              overflow-hidden
              rounded-[30px]
              px-5
              py-6
              text-white

              sm:px-7
              sm:py-7
            "
          >
            <PurpleAuroraBackground />

            <div className="relative">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold">
                      <ShieldAlert className="h-3.5 w-3.5" />

                      Dispute case
                    </span>

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-full
                        px-3
                        py-1.5
                        text-xs
                        font-black

                        ${meta.className}
                      `}
                    >
                      <CaseStatusIcon className="h-3.5 w-3.5" />

                      {
                        meta.label
                      }
                    </span>
                  </div>

                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/65">
                    Dispute ID
                  </p>

                  <h1 className="mt-2 break-all font-mono text-xl font-black sm:text-2xl">
                    {
                      data.dispute.disputeId
                    }
                  </h1>

                  <p className="mt-3 break-words text-sm leading-6 text-violet-100/80 [overflow-wrap:anywhere]">
                    Related payment{" "}

                    <span className="break-all font-mono font-bold text-white">
                      {
                        publicPaymentId
                      }
                    </span>
                  </p>
                </div>

                <div className="xl:text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-100/65">
                    Disputed amount
                  </p>

                  <p className="mt-2 break-words text-[clamp(1.35rem,3vw,2.5rem)] font-black leading-tight [overflow-wrap:anywhere]">
                    {formatMoney(
                      data.dispute.amount,
                      data.dispute.currency
                    )}
                  </p>

                  <p className="mt-2 text-xs text-violet-100/70">
                    {humanize(
                      data.dispute.reason
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroMetric
                  label="Reason"
                  value={humanize(
                    data.dispute.reason
                  )}
                />

                <HeroMetric
                  label="Opened"
                  value={formatDate(
                    data.dispute.createdAt
                  )}
                />

                <HeroMetric
                  label="Resolved"
                  value={formatDate(
                    data.dispute.resolvedAt
                  )}
                />
              </div>
            </div>
          </motion.section>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            {/* LEFT */}

            <div className="space-y-6">
              <section className="rounded-[28px] bg-white/70 p-5 dark:bg-slate-950/45">
                <SectionTitle
                  icon={
                    FileText
                  }
                  title="Case information"
                  subtitle="Customer claim and dispute details"
                />

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <InfoBox
                    label="Reason"
                    value={humanize(
                      data.dispute.reason
                    )}
                  />

                  <InfoBox
                    label="Currency"
                    value={
                      data.dispute.currency
                    }
                  />

                  <InfoBox
                    label="Created"
                    value={formatDate(
                      data.dispute.createdAt
                    )}
                  />

                  <InfoBox
                    label="Last updated"
                    value={formatDate(
                      data.dispute.updatedAt
                    )}
                  />
                </div>

                <div className="mt-4 rounded-2xl bg-violet-500/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider merchant-muted">
                    Customer description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 merchant-text">
                    {data.dispute.description ||
                      "No description provided."}
                  </p>
                </div>
              </section>

              {/* PURPLE MERCHANT RESPONSE */}

              <section
                className="relative overflow-hidden rounded-[28px] p-5 text-white"
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <div className="relative">
                  <SectionTitle
                    inverse
                    icon={
                      ShieldCheck
                    }
                    title="Merchant response"
                    subtitle="Response and resolution information"
                  />

                  <div className="mt-5 rounded-2xl bg-white/[0.08] p-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-violet-100">
                      {data.dispute.merchantResponse ||
                        "No merchant response has been submitted yet."}
                    </p>
                  </div>

                  {data.dispute.resolutionNote ? (
                    <div className="mt-3 rounded-2xl bg-emerald-400/[0.12] p-4">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                        Resolution note
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white">
                        {
                          data.dispute.resolutionNote
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* EVIDENCE */}

              <section className="rounded-[28px] bg-white/70 p-5 dark:bg-slate-950/45">
                <SectionTitle
                  icon={
                    FileText
                  }
                  title="Evidence"
                  subtitle={`${data.dispute.evidence.length} evidence item(s)`}
                />

                {data.dispute.evidence.length ===
                0 ? (
                  <div className="mt-5 rounded-2xl bg-violet-500/[0.04] p-8 text-center">
                    <p className="text-sm font-black merchant-text">
                      No evidence attached
                    </p>

                    <p className="mt-1 text-xs merchant-muted">
                      Evidence linked to this case will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {data.dispute.evidence.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item.title}-${index}`}
                          className="rounded-2xl bg-violet-500/[0.04] p-4"
                        >
                          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-black leading-tight merchant-text [overflow-wrap:anywhere]">
                                {
                                  item.title
                                }
                              </p>

                              <p className="mt-1 text-[11px] merchant-muted">
                                {formatDate(
                                  item.submittedAt
                                )}
                              </p>
                            </div>

                            {item.url ? (
                              <a
                                href={
                                  item.url
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-black text-violet-600"
                              >
                                Open

                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>

                          {item.description ? (
                            <p className="mt-3 text-sm leading-6 merchant-muted">
                              {
                                item.description
                              }
                            </p>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT */}

            <div className="space-y-6">
              <section className="rounded-[28px] bg-white/70 p-5 dark:bg-slate-950/45">
                <SectionTitle
                  icon={
                    UserRound
                  }
                  title="Customer"
                  subtitle="Customer associated with this dispute"
                />

                {data.customer ? (
                  <div className="mt-5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={
                          data.customer.name
                        }
                        src={
                          data.customer.avatarUrl
                        }
                      />

                      <div className="min-w-0">
                        <p className="break-words text-sm font-black leading-tight merchant-text [overflow-wrap:anywhere]">
                          {
                            data.customer.name
                          }
                        </p>

                        <p className="mt-1 break-all text-[10px] merchant-muted">
                          {
                            data.customer.customerId
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <InfoBox
                        label="Account"
                        value={data.customer.accountStatus ||
                          "—"}
                      />

                      <InfoBox
                        label="KYC"
                        value={data.customer.kycStatus ||
                          "—"}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm merchant-muted">
                    Customer information is unavailable.
                  </p>
                )}
              </section>

              <section className="rounded-[28px] bg-white/70 p-5 dark:bg-slate-950/45">
                <SectionTitle
                  icon={
                    WalletCards
                  }
                  title="Payment"
                  subtitle="Original payment information"
                />

                {data.payment ? (
                  <div className="mt-5 space-y-3">
                    <InfoBox
                      label="Payment ID"
                      value={
                        data.payment.paymentId
                      }
                    />

                    <InfoBox
                      label="Amount"
                      value={formatMoney(
                        data.payment.amount,
                        data.payment.currency
                      )}
                    />

                    <InfoBox
                      label="Status"
                      value={humanize(
                        data.payment.status
                      )}
                    />

                    <InfoBox
                      label="Provider"
                      value={humanize(
                        data.payment.provider
                      )}
                    />

                    <InfoBox
                      label="Source"
                      value={humanize(
                        data.payment.sourceType
                      )}
                    />

                    <InfoBox
                      label="Mode"
                      value={humanize(
                        data.payment.mode
                      )}
                    />

                    <Link
                      href={`/dashboard/merchant/payments/${encodeURIComponent(
                        data.payment.paymentId
                      )}`}
                      className="
                        mt-2
                        inline-flex
                        h-11
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-violet-500/[0.08]
                        text-xs
                        font-black
                        text-violet-600

                        hover:bg-violet-500/[0.13]
                      "
                    >
                      View payment

                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <p className="mt-5 text-sm merchant-muted">
                    Payment information is unavailable.
                  </p>
                )}
              </section>

              {/* PURPLE TIMELINE */}

              <section
                className="relative overflow-hidden rounded-[28px] p-5 text-white"
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 58%,#9333EA 100%)",
                }}
              >
                <SectionTitle
                  inverse
                  icon={
                    Clock3
                  }
                  title="Case timeline"
                  subtitle="Lifecycle of this dispute"
                />

                <div className="mt-6 space-y-5">
                  <TimelineItem
                    title="Dispute opened"
                    value={formatDate(
                      data.dispute.createdAt
                    )}
                    active
                  />

                  <TimelineItem
                    title="Current status"
                    value={humanize(
                      data.dispute.status
                    )}
                    active
                  />

                  <TimelineItem
                    title="Resolved"
                    value={formatDate(
                      data.dispute.resolvedAt
                    )}
                    active={Boolean(
                      data.dispute.resolvedAt
                    )}
                    last
                  />
                </div>
              </section>

              <Link
                href="/dashboard/merchant/disputes"
                className="
                  inline-flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-violet-500/[0.07]
                  text-sm
                  font-black
                  merchant-text

                  hover:bg-violet-500/[0.12]
                  hover:text-violet-600
                "
              >
                <ArrowLeft className="h-4 w-4" />

                Back to disputes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function HeroMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="h-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-violet-100/65">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black leading-tight text-white [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  icon:
    Icon,
  title,
  subtitle,
  inverse = false,
}: {
  icon:
    React.ElementType;

  title:
    string;

  subtitle:
    string;

  inverse?:
    boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-2xl

          ${
            inverse
              ? "bg-white/10 text-white"
              : "bg-violet-500/[0.08] text-violet-600"
          }
        `}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <h2
          className={`break-words text-base font-black leading-tight [overflow-wrap:anywhere] ${
            inverse
              ? "text-white"
              : "merchant-text"
          }`}
        >
          {title}
        </h2>

        <p
          className={`mt-0.5 break-words text-xs leading-5 [overflow-wrap:anywhere] ${
            inverse
              ? "text-violet-100/70"
              : "merchant-muted"
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-violet-500/[0.04] p-3.5">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] merchant-muted">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-5 merchant-text [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  title,
  value,
  active,
  last = false,
}: {
  title:
    string;

  value:
    string;

  active:
    boolean;

  last?:
    boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!last ? (
        <div className="absolute left-[9px] top-6 h-full w-px bg-white/15" />
      ) : null}

      <div
        className={`
          relative
          z-10
          mt-0.5
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-full

          ${
            active
              ? "bg-white"
              : "bg-white/20"
          }
        `}
      >
        {active ? (
          <span className="h-2 w-2 rounded-full bg-violet-600" />
        ) : null}
      </div>

      <div className="min-w-0 pb-4">
        <p className="text-xs font-black text-white">
          {title}
        </p>

        <p className="mt-1 text-[11px] text-violet-100/65">
          {value}
        </p>
      </div>
    </div>
  );
}

function Avatar({
  name,
  src,
}: {
  name:
    string;

  src?:
    string;
}) {
  const initials =
    name
      .trim()
      .split(
        /\s+/
      )
      .slice(
        0,
        2
      )
      .map(
        (
          part
        ) =>
          part[0] ||
          ""
      )
      .join("")
      .toUpperCase() ||
    "C";

  return (
    <div
      className="
        relative
        flex
        h-12
        w-12
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-2xl
        bg-violet-500/[0.08]
        text-sm
        font-black
        text-violet-600
      "
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={
            src
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}