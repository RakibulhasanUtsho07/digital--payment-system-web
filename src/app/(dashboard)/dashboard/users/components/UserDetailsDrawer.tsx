"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Fingerprint,
  KeyRound,
  Laptop2,
  Lock,
  MapPin,
  Shield,
  ShieldCheck,
  Smartphone,
  UserCheck,
  WalletCards,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  DrawerTab,
  UserRecord,
} from "./UserManagementTypes";

export default function UserDetailsDrawer({
  user,
  onClose,
  onUpdateUser,
}: {
  user: UserRecord | null;
  onClose: () => void;
  onUpdateUser: (
    id: string,
    patch: Partial<UserRecord>
  ) => void;
}) {
  const [
    tab,
    setTab,
  ] = useState<DrawerTab>(
    "overview"
  );

  const tabs: Array<{
    id: DrawerTab;
    label: string;
  }> = [
    {
      id: "overview",
      label: "Overview",
    },
    {
      id: "security",
      label: "Security",
    },
    {
      id: "wallet",
      label: "Wallet",
    },
    {
      id: "kyc",
      label: "KYC",
    },
    {
      id: "transactions",
      label: "Transactions",
    },
    {
      id: "activity",
      label: "Activity",
    },
    {
      id: "risk",
      label: "Risk",
    },
  ];

  return (
    <AnimatePresence>
      {user && (
        <motion.div
          className="fixed inset-0 z-[90] flex justify-end bg-slate-950/35 backdrop-blur-[2px]"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >
          <button
            type="button"
            onClick={
              onClose
            }
            className="absolute inset-0"
            aria-label="Close user details"
          />

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
              stiffness: 280,
              damping: 30,
            }}
            className="relative z-10 flex h-full w-full max-w-[680px] flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-[#0F2745] to-[#1F5EA8] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black">
                    {getInitials(
                      user.name
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black">
                      {user.name}
                    </h2>

                    <p className="truncate text-xs text-blue-100/70">
                      {user.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold capitalize">
                        {user.role}
                      </span>

                      <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[9px] font-bold text-emerald-100">
                        {formatStatus(
                          user.status
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[10px] text-blue-100/60">
                <span>
                  {user.id}
                </span>
                <span>•</span>
                <span>
                  Joined{" "}
                  {new Date(
                    user.joinedAt
                  ).toLocaleDateString(
                    "en-BD"
                  )}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border-b border-slate-100">
              <div className="flex min-w-max gap-1 p-2">
                {tabs.map(
                  (
                    item
                  ) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        setTab(
                          item.id
                        )
                      }
                      className={`rounded-xl px-3 py-2 text-[10px] font-bold ${
                        tab ===
                        item.id
                          ? "bg-blue-50 text-[#1F5EA8]"
                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                    >
                      {
                        item.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {tab ===
                "overview" && (
                <OverviewTab
                  user={
                    user
                  }
                />
              )}

              {tab ===
                "security" && (
                <SecurityTab
                  user={
                    user
                  }
                  onUpdate={
                    onUpdateUser
                  }
                />
              )}

              {tab ===
                "wallet" && (
                <WalletTab
                  user={
                    user
                  }
                  onUpdate={
                    onUpdateUser
                  }
                />
              )}

              {tab ===
                "kyc" && (
                <KYCTab
                  user={
                    user
                  }
                />
              )}

              {tab ===
                "transactions" && (
                <TransactionsTab
                  user={
                    user
                  }
                />
              )}

              {tab ===
                "activity" && (
                <ActivityTab />
              )}

              {tab ===
                "risk" && (
                <RiskTab
                  user={
                    user
                  }
                />
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OverviewTab({
  user,
}: {
  user: UserRecord;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat
          title="Balance"
          value={formatCurrency(
            user.balance
          )}
        />

        <MiniStat
          title="Transactions"
          value={user.transactionCount.toLocaleString()}
        />

        <MiniStat
          title="Received"
          value={formatCurrency(
            user.totalReceived
          )}
        />

        <MiniStat
          title="Sent"
          value={formatCurrency(
            user.totalSent
          )}
        />
      </div>

      <Section title="Account Snapshot">
        <Info
          label="Location"
          value={`${user.city}, ${user.country}`}
          icon={MapPin}
        />

        <Info
          label="Last active"
          value={
            user.lastActive
          }
          icon={Activity}
        />

        <Info
          label="2FA"
          value={
            user.twoFactorEnabled
              ? "Enabled"
              : "Disabled"
          }
          icon={Fingerprint}
        />

        <Info
          label="Sessions"
          value={String(
            user.activeSessions
          )}
          icon={Laptop2}
        />
      </Section>
    </div>
  );
}

function SecurityTab({
  user,
  onUpdate,
}: {
  user: UserRecord;
  onUpdate: (
    id: string,
    patch: Partial<UserRecord>
  ) => void;
}) {
  return (
    <div className="space-y-5">
      <ScoreCard
        label="Security Score"
        score={
          Math.max(
            0,
            100 -
              user.failedLoginCount *
                8 -
              (user.twoFactorEnabled
                ? 0
                : 18)
          )
        }
      />

      <Section title="Security Controls">
        <Info
          label="Two-factor authentication"
          value={
            user.twoFactorEnabled
              ? "Enabled"
              : "Disabled"
          }
          icon={ShieldCheck}
        />

        <Info
          label="Failed login attempts"
          value={String(
            user.failedLoginCount
          )}
          icon={AlertTriangle}
        />

        <Info
          label="Active sessions"
          value={String(
            user.activeSessions
          )}
          icon={Laptop2}
        />
      </Section>

      <ActionCard
        title="Require MFA"
        description="Demo action. Connect the backend policy endpoint before production."
        icon={Shield}
        button={
          user.twoFactorEnabled
            ? "Already Enabled"
            : "Enable MFA"
        }
        disabled={
          user.twoFactorEnabled
        }
        onClick={() =>
          onUpdate(
            user.id,
            {
              twoFactorEnabled:
                true,
            }
          )
        }
      />
    </div>
  );
}

function WalletTab({
  user,
  onUpdate,
}: {
  user: UserRecord;
  onUpdate: (
    id: string,
    patch: Partial<UserRecord>
  ) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-[#0F2745] to-[#1F5EA8] p-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <WalletCards className="h-5 w-5 text-cyan-200" />

          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-bold capitalize">
            {user.walletStatus}
          </span>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.15em] text-blue-100/60">
          Available balance
        </p>

        <p className="mt-1 text-3xl font-black">
          {formatCurrency(
            user.balance
          )}
        </p>

        <p className="mt-3 text-[10px] text-blue-100/60">
          Wallet ID:{" "}
          {user.walletId}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          title={
            user.walletStatus ===
            "frozen"
              ? "Unfreeze Wallet"
              : "Freeze Wallet"
          }
          description="Demo-only wallet state change."
          icon={Lock}
          button={
            user.walletStatus ===
            "frozen"
              ? "Unfreeze"
              : "Freeze"
          }
          onClick={() =>
            onUpdate(
              user.id,
              {
                walletStatus:
                  user.walletStatus ===
                  "frozen"
                    ? "active"
                    : "frozen",
              }
            )
          }
        />

        <ActionCard
          title="View Transactions"
          description="Open the full transaction workflow."
          icon={
            WalletCards
          }
          button="Open"
          onClick={() =>
            window.location.assign(
              "/dashboard/transactions"
            )
          }
        />
      </div>
    </div>
  );
}

function KYCTab({
  user,
}: {
  user: UserRecord;
}) {
  return (
    <div className="space-y-5">
      <Section title="Identity Verification">
        <Info
          label="Status"
          value={formatStatus(
            user.kycStatus
          )}
          icon={UserCheck}
        />

        <Info
          label="Document"
          value={
            user.documentType ??
            "N/A"
          }
          icon={Fingerprint}
        />

        <Info
          label="Document number"
          value={
            user.maskedDocumentNumber ??
            "Not available"
          }
          icon={Shield}
        />

        <Info
          label="Submitted"
          value={
            user.submittedAt ??
            "Not submitted"
          }
          icon={Activity}
        />
      </Section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          "NID Front",
          "NID Back",
          "Selfie",
        ].map(
          (label) => (
            <div
              key={
                label
              }
              className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center"
            >
              <div>
                <ShieldCheck className="mx-auto h-5 w-5 text-slate-300" />

                <p className="mt-2 text-[10px] font-bold text-slate-400">
                  {label}
                </p>

                <p className="mt-1 text-[9px] text-slate-300">
                  Secure preview
                </p>
              </div>
            </div>
          )
        )}
      </div>

      <p className="text-[10px] leading-5 text-slate-400">
        KYC documents should only be displayed through protected,
        access-controlled backend URLs.
      </p>
    </div>
  );
}

function TransactionsTab({
  user,
}: {
  user: UserRecord;
}) {
  const transactions = [
    {
      title: "Transfer received",
      amount: 4500,
      positive: true,
      status: "Completed",
    },
    {
      title: "Wallet transfer",
      amount: 1800,
      positive: false,
      status: "Completed",
    },
    {
      title: "Deposit",
      amount: 7000,
      positive: true,
      status: "Completed",
    },
    {
      title: "Utility payment",
      amount: 1250,
      positive: false,
      status: "Pending",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Transaction volume
        </p>

        <p className="mt-1 text-2xl font-black text-slate-900">
          {user.transactionCount}
        </p>
      </div>

      {transactions.map(
        (transaction) => (
          <div
            key={
              transaction.title
            }
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"
          >
            <div>
              <p className="text-xs font-bold text-slate-900">
                {
                  transaction.title
                }
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {transaction.status}
              </p>
            </div>

            <p
              className={`text-sm font-black ${
                transaction.positive
                  ? "text-emerald-600"
                  : "text-slate-900"
              }`}
            >
              {transaction.positive
                ? "+"
                : "-"}
              {formatCurrency(
                transaction.amount
              )}
            </p>
          </div>
        )
      )}
    </div>
  );
}

function ActivityTab() {
  const events = [
    "Successful login",
    "KYC information updated",
    "Transaction completed",
    "Security settings reviewed",
    "Wallet activity recorded",
  ];

  return (
    <div className="space-y-1">
      {events.map(
        (
          event,
          index
        ) => (
          <div
            key={
              event
            }
            className="flex gap-3 py-4"
          >
            <div className="relative flex flex-col items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1F5EA8] ring-4 ring-blue-50" />

              {index <
                events.length -
                  1 && (
                <span className="mt-1 h-12 w-px bg-slate-200" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">
                {event}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {index +
                  1}{" "}
                hour
                {index ===
                0
                  ? ""
                  : "s"}{" "}
                ago • System event
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function RiskTab({
  user,
}: {
  user: UserRecord;
}) {
  const factors = [
    [
      "Login behavior",
      Math.max(
        20,
        100 -
          user.failedLoginCount *
            12
      ),
    ],
    [
      "Transaction velocity",
      Math.max(
        20,
        100 -
          user.transactionCount *
            2
      ),
    ],
    [
      "KYC status",
      user.kycStatus ===
      "verified"
        ? 100
        : 55,
    ],
    [
      "Account age",
      80,
    ],
    [
      "Device stability",
      Math.max(
        20,
        100 -
          user.activeSessions *
            10
      ),
    ],
  ] as const;

  return (
    <div className="space-y-5">
      <ScoreCard
        label="Rule-based Risk Score"
        score={
          user.riskScore
        }
        danger={
          user.riskLevel ===
          "high"
        }
      />

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-xs font-bold text-amber-900">
          Demo Risk Indicator
        </p>

        <p className="mt-1 text-[10px] leading-5 text-amber-800">
          This is a local rule-based signal and is not a fraud-detection
          decision.
        </p>
      </div>

      <Section title="Risk Factors">
        {factors.map(
          ([
            label,
            value,
          ]) => (
            <div
              key={
                label
              }
              className="py-3"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-500">
                  {label}
                </span>

                <span className="font-black text-slate-800">
                  {value}%
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#1F5EA8]"
                  style={{
                    width: `${value}%`,
                  }}
                />
              </div>
            </div>
          )
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.13em] text-slate-400">
        {title}
      </h3>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white px-4">
        {children}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />

        <span className="text-[10px] font-semibold text-slate-400">
          {label}
        </span>
      </div>

      <span className="text-right text-xs font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function MiniStat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-lg font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  danger = false,
}: {
  label: string;
  score: number;
  danger?: boolean;
}) {
  const radius =
    35;

  const circumference =
    2 *
    Math.PI *
    radius;

  const offset =
    circumference -
    Math.min(
      100,
      Math.max(
        0,
        score
      )
    ) /
      100 *
      circumference;

  return (
    <div className="flex items-center gap-5 rounded-3xl bg-[#0F2745] p-5 text-white">
      <div className="relative h-24 w-24 shrink-0">
        <svg
          viewBox="0 0 90 90"
          className="-rotate-90"
        >
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,.1)"
            strokeWidth="7"
          />

          <motion.circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke={
              danger
                ? "#F43F5E"
                : "#22C55E"
            }
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={
              circumference
            }
            initial={{
              strokeDashoffset:
                circumference,
            }}
            animate={{
              strokeDashoffset:
                offset,
            }}
            transition={{
              duration: 1,
            }}
          />
        </svg>

        <span className="absolute inset-0 flex items-center justify-center text-lg font-black">
          {score}
        </span>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-100/50">
          {label}
        </p>

        <p className="mt-2 text-sm font-bold">
          {danger
            ? "Elevated attention"
            : score >=
              75
            ? "Healthy profile"
            : "Review recommended"}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-blue-100/55">
          Generated from demo security and account signals.
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  button,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  button: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <Icon className="h-4 w-4 text-[#1F5EA8]" />

      <p className="mt-4 text-sm font-extrabold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-5 text-slate-400">
        {description}
      </p>

      <button
        type="button"
        disabled={
          disabled
        }
        onClick={
          onClick
        }
        className="mt-4 rounded-xl bg-[#1F5EA8] px-3 py-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {button}
      </button>
    </div>
  );
}

function getInitials(
  name: string
) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0)
    )
    .join("")
    .toUpperCase();
}

function formatStatus(
  value: string
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatCurrency(
  amount: number
) {
  return `৳ ${amount.toLocaleString(
    "en-BD"
  )}`;
}