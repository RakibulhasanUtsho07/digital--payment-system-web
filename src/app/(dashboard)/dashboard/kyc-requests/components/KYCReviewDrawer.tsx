"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Eye,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

import KYCAIReviewPanel from "./KYCAIReviewPanel";

import KYCDecisionModal, {
  type DecisionAction,
} from "./KYCRequestInfoModal";

import type {
  KYCAIReview,
  KYCPrivateDocuments,
  KYCRequest,
} from "./KYCManagementTypes";

type DrawerTab =
  | "overview"
  | "documents"
  | "ai"
  | "decision";

export default function KYCReviewDrawer({
  request,
  documents,
  documentsLoading,
  documentsError,
  aiReview,
  aiLoading,
  aiRunning,
  aiError,
  submittingDecision,
  onClose,
  onRunAIReview,
  onDecision,
}: {
  request:
    KYCRequest |
    null;

  documents:
    KYCPrivateDocuments;

  documentsLoading:
    boolean;

  documentsError:
    string;

  aiReview:
    KYCAIReview |
    null;

  aiLoading:
    boolean;

  aiRunning:
    boolean;

  aiError:
    string;

  submittingDecision:
    boolean;

  onClose:
    () => void;

  onRunAIReview:
    () => void;

  onDecision:
    (
      action:
        DecisionAction,
      reason:
        string
    ) => void;
}) {
  const [
    tab,
    setTab,
  ] =
    useState<DrawerTab>(
      "overview"
    );

  const [
    preview,
    setPreview,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    decisionAction,
    setDecisionAction,
  ] =
    useState<DecisionAction | null>(
      null
    );

  useEffect(
    () => {
      setTab(
        "overview"
      );

      setPreview(
        null
      );

      setDecisionAction(
        null
      );
    },
    [
      request?.id,
    ]
  );

  useEffect(
    () => {
      if (
        !request
      ) {
        return;
      }

      const handler =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            if (
              preview
            ) {
              setPreview(
                null
              );

              return;
            }

            onClose();
          }
        };

      window.addEventListener(
        "keydown",
        handler
      );

      return () =>
        window.removeEventListener(
          "keydown",
          handler
        );
    },
    [
      request,
      preview,
      onClose,
    ]
  );

  return (
    <>
      <AnimatePresence>
        {request && (
          <motion.div
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            className="fixed inset-0 z-[120] bg-[#071B30]/48 backdrop-blur-[3px]"
            onMouseDown={
              onClose
            }
          >
            <motion.aside
              initial={{
                x:
                  "100%",
              }}
              animate={{
                x:
                  0,
              }}
              exit={{
                x:
                  "100%",
              }}
              transition={{
                type:
                  "spring",
                stiffness:
                  285,
                damping:
                  30,
              }}
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col border-l border-[#DCE7F0] bg-[#F6F9FC] shadow-[-28px_0_80px_rgba(7,27,48,0.24)]"
            >
              <header className="border-b border-[#DCE7F0] bg-white px-5 pb-0 pt-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1F5EA8,#22B8D5)] text-white shadow-sm">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#5B8BB7]">
                        Manual KYC Review
                      </p>

                      <h2 className="mt-1 truncate text-xl font-black text-[#0F2745]">
                        {
                          request.applicantName
                        }
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill
                          value={
                            request.status
                          }
                        />

                        <RiskPill
                          risk={
                            request.riskLevel
                          }
                          score={
                            request.riskScore
                          }
                        />

                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-black text-slate-500">
                          {
                            request.caseId
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      onClose
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <nav className="mt-5 flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <DrawerTabButton
                    active={
                      tab ===
                      "overview"
                    }
                    onClick={() =>
                      setTab(
                        "overview"
                      )
                    }
                  >
                    Overview
                  </DrawerTabButton>

                  <DrawerTabButton
                    active={
                      tab ===
                      "documents"
                    }
                    onClick={() =>
                      setTab(
                        "documents"
                      )
                    }
                  >
                    Documents
                  </DrawerTabButton>

                  <DrawerTabButton
                    active={
                      tab ===
                      "ai"
                    }
                    onClick={() =>
                      setTab(
                        "ai"
                      )
                    }
                  >
                    Automated Review
                  </DrawerTabButton>

                  <DrawerTabButton
                    active={
                      tab ===
                      "decision"
                    }
                    onClick={() =>
                      setTab(
                        "decision"
                      )
                    }
                  >
                    Final Decision
                  </DrawerTabButton>
                </nav>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-6">
                <AnimatePresence
                  mode="wait"
                >
                  <motion.div
                    key={
                      tab
                    }
                    initial={{
                      opacity:
                        0,
                      x:
                        10,
                    }}
                    animate={{
                      opacity:
                        1,
                      x:
                        0,
                    }}
                    exit={{
                      opacity:
                        0,
                      x:
                        -8,
                    }}
                    transition={{
                      duration:
                        0.18,
                    }}
                  >
                    {tab ===
                    "overview" ? (
                      <OverviewTab
                        request={
                          request
                        }
                      />
                    ) : tab ===
                      "documents" ? (
                      <DocumentsTab
                        request={
                          request
                        }
                        documents={
                          documents
                        }
                        loading={
                          documentsLoading
                        }
                        error={
                          documentsError
                        }
                        onPreview={
                          setPreview
                        }
                      />
                    ) : tab ===
                      "ai" ? (
                      <KYCAIReviewPanel
                        review={
                          aiReview
                        }
                        loading={
                          aiLoading
                        }
                        running={
                          aiRunning
                        }
                        error={
                          aiError
                        }
                        onRun={
                          onRunAIReview
                        }
                      />
                    ) : (
                      <DecisionTab
                        request={
                          request
                        }
                        aiReview={
                          aiReview
                        }
                        onApprove={() =>
                          setDecisionAction(
                            "approve"
                          )
                        }
                        onReject={() =>
                          setDecisionAction(
                            "reject"
                          )
                        }
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{
              opacity:
                0,
            }}
            animate={{
              opacity:
                1,
            }}
            exit={{
              opacity:
                0,
            }}
            className="fixed inset-0 z-[180] flex items-center justify-center bg-[#071B30]/80 p-4 backdrop-blur-md"
            onMouseDown={() =>
              setPreview(
                null
              )
            }
          >
            <motion.div
              initial={{
                scale:
                  0.96,
                opacity:
                  0,
              }}
              animate={{
                scale:
                  1,
                opacity:
                  1,
              }}
              exit={{
                scale:
                  0.97,
                opacity:
                  0,
              }}
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-[24px] border border-white/10 bg-white p-2 shadow-2xl"
            >
              <button
                type="button"
                onClick={() =>
                  setPreview(
                    null
                  )
                }
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/65 text-white backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>

              <img
                src={
                  preview
                }
                alt="KYC document preview"
                className="max-h-[86vh] w-auto rounded-[18px] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <KYCDecisionModal
        open={
          decisionAction !==
          null
        }
        action={
          decisionAction
        }
        applicantName={
          request?.applicantName ??
          "Applicant"
        }
        submitting={
          submittingDecision
        }
        onClose={() =>
          setDecisionAction(
            null
          )
        }
        onConfirm={(
          reason
        ) => {
          if (
            !decisionAction
          ) {
            return;
          }

          onDecision(
            decisionAction,
            reason
          );

          setDecisionAction(
            null
          );
        }}
      />
    </>
  );
}

function OverviewTab({
  request,
}: {
  request:
    KYCRequest;
}) {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <OverviewMetric
          label="Document"
          value={
            request.documentType
          }
          helper={
            request.documentNumber
          }
          icon={
            FileText
          }
          tone="blue"
        />

        <OverviewMetric
          label="Verification"
          value={
            request.verificationResult
          }
          helper="Current queue result"
          icon={
            BadgeCheck
          }
          tone={
            request.verificationResult ===
            "Passed"
              ? "emerald"
              : request.verificationResult ===
                  "Failed"
                ? "rose"
                : "amber"
          }
        />

        <OverviewMetric
          label="SLA"
          value={
            formatSLA(
              request.slaMinutes
            )
          }
          helper="Review deadline"
          icon={
            ShieldAlert
          }
          tone={
            request.slaMinutes <=
            0
              ? "rose"
              : request.slaMinutes <=
                  15
                ? "amber"
                : "emerald"
          }
        />
      </section>

      <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
          Applicant
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InfoRow
            icon={
              UserRound
            }
            label="Full Name"
            value={
              request.applicantName
            }
          />

          <InfoRow
            icon={
              Mail
            }
            label="Email"
            value={
              request.email ||
              "Not available"
            }
          />

          <InfoRow
            icon={
              Phone
            }
            label="Phone"
            value={
              request.phone ||
              "Not available"
            }
          />

          <InfoRow
            icon={
              FileText
            }
            label="Applicant ID"
            value={
              request.applicantId ||
              "Not available"
            }
          />
        </div>
      </section>

      <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
          Verification Signals
        </p>

        <div className="mt-4 space-y-2.5">
          {request.verificationChecks.map(
            (
              check,
              index
            ) => (
              <VerificationRow
                key={`${check.label}-${index}`}
                label={
                  check.label
                }
                status={
                  check.status
                }
                reason={
                  check.reason
                }
              />
            )
          )}

          {request.verificationChecks.length ===
            0 && (
            <p className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-4 text-[9px] text-slate-400">
              No verification signals have been recorded yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[22px] border border-blue-100 bg-blue-50/55 p-4">
        <p className="text-[9px] font-black text-[#174A7A]">
          Review context
        </p>

        <p className="mt-1 text-[9px] leading-5 text-slate-500">
          {
            request.reason
          }
        </p>

        <p className="mt-3 text-[8px] font-semibold text-slate-400">
          Submitted{" "}
          {
            formatDate(
              request.submittedAt
            )
          }
        </p>
      </section>
    </div>
  );
}

function DocumentsTab({
  request,
  documents,
  loading,
  error,
  onPreview,
}: {
  request:
    KYCRequest;

  documents:
    KYCPrivateDocuments;

  loading:
    boolean;

  error:
    string;

  onPreview:
    (
      value:
        string
    ) => void;
}) {
  if (
    loading
  ) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[22px] border border-[#DCE7F0] bg-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-600" />

          <p className="mt-3 text-[9px] font-black text-slate-600">
            Loading secure documents...
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label:
        `${request.documentType} Front`,
      value:
        documents.frontUrl,
    },
    {
      label:
        `${request.documentType} Back`,
      value:
        documents.backUrl,
    },
    {
      label:
        "Selfie",
      value:
        documents.selfieUrl,
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[18px] border border-rose-100 bg-rose-50 p-4 text-[9px] font-semibold text-rose-600">
          {
            error
          }
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(
          (
            card
          ) => (
            <article
              key={
                card.label
              }
              className="overflow-hidden rounded-[22px] border border-[#DCE7F0] bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-[9px] font-black text-[#0F2745]">
                  {
                    card.label
                  }
                </p>

                {card.value && (
                  <button
                    type="button"
                    onClick={() =>
                      onPreview(
                        card.value as
                          string
                      )
                    }
                    className="inline-flex items-center gap-1 text-[8px] font-black text-blue-600"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                )}
              </div>

              <div className="flex min-h-[190px] items-center justify-center bg-[#F8FBFD] p-3">
                {card.value ? (
                  <button
                    type="button"
                    onClick={() =>
                      onPreview(
                        card.value as
                          string
                      )
                    }
                    className="group relative h-[170px] w-full overflow-hidden rounded-[16px] border border-slate-200 bg-white"
                  >
                    <img
                      src={
                        card.value
                      }
                      alt={
                        card.label
                      }
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.015]"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/10">
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-[8px] font-black text-[#174A7A] opacity-0 shadow transition group-hover:opacity-100">
                        Open Preview
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="text-center">
                    <FileText className="mx-auto h-5 w-5 text-slate-300" />

                    <p className="mt-2 text-[9px] font-semibold text-slate-400">
                      Document unavailable
                    </p>
                  </div>
                )}
              </div>
            </article>
          )
        )}
      </div>

      <div className="rounded-[18px] border border-amber-100 bg-amber-50/60 p-4">
        <p className="text-[9px] leading-5 text-amber-800/75">
          These are temporary signed document URLs loaded only for the active admin review.
        </p>
      </div>
    </div>
  );
}

function DecisionTab({
  request,
  aiReview,
  onApprove,
  onReject,
}: {
  request:
    KYCRequest;

  aiReview:
    KYCAIReview |
    null;

  onApprove:
    () => void;

  onReject:
    () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[22px] border border-[#DCE7F0] bg-white p-5">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#5B8BB7]">
          Final Manual Decision
        </p>

        <h3 className="mt-1 text-lg font-black text-[#0F2745]">
          Approve or reject this KYC
        </h3>

        <p className="mt-2 text-[9px] leading-5 text-slate-500">
          Inspect the documents and verification signals before making the final decision.
          Automated screening can support the review, but it is not the final authority.
        </p>

        {aiReview && (
          <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50/55 p-4">
            <p className="text-[8px] font-black uppercase tracking-[0.11em] text-blue-500">
              Automated recommendation
            </p>

            <p className="mt-1 text-[11px] font-black text-[#174A7A]">
              {
                formatRecommendation(
                  aiReview.recommendation
                )
              }{" "}
              •{" "}
              {
                aiReview.confidence
              }%
            </p>

            <p className="mt-1 text-[8px] leading-4 text-slate-500">
              {
                aiReview.summary
              }
            </p>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={
            onApprove
          }
          className="group rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_30px_rgba(16,185,129,0.1)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <p className="mt-4 text-[11px] font-black text-emerald-800">
            Approve KYC
          </p>

          <p className="mt-1 text-[8px] leading-4 text-emerald-700/65">
            Mark this applicant as verified after manual evidence review.
          </p>
        </button>

        <button
          type="button"
          onClick={
            onReject
          }
          className="group rounded-[22px] border border-rose-100 bg-rose-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_12px_30px_rgba(244,63,94,0.1)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
            <XCircle className="h-4 w-4" />
          </div>

          <p className="mt-4 text-[11px] font-black text-rose-800">
            Reject KYC
          </p>

          <p className="mt-1 text-[8px] leading-4 text-rose-700/65">
            Reject with a clear reason that can be recorded by the backend.
          </p>
        </button>
      </div>
    </div>
  );
}

function DrawerTabButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`relative whitespace-nowrap px-3 py-3 text-[9px] font-black transition ${
        active
          ? "text-[#1F5EA8]"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {
        children
      }

      {active && (
        <motion.span
          layoutId="kyc-drawer-tab"
          className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#1F5EA8]"
        />
      )}
    </button>
  );
}

function OverviewMetric({
  label,
  value,
  helper,
  icon:
    Icon,
  tone,
}: {
  label:
    string;

  value:
    string;

  helper:
    string;

  icon:
    ElementType;

  tone:
    "blue"
    | "emerald"
    | "amber"
    | "rose";
}) {
  const style = {
    blue:
      "border-blue-100 bg-blue-50 text-blue-700",
    emerald:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-100 bg-amber-50 text-amber-700",
    rose:
      "border-rose-100 bg-rose-50 text-rose-700",
  }[
    tone
  ];

  return (
    <div
      className={`rounded-[20px] border p-4 ${style}`}
    >
      <Icon className="h-4 w-4" />

      <p className="mt-3 text-[7px] font-black uppercase tracking-[0.1em] opacity-60">
        {
          label
        }
      </p>

      <p className="mt-1 truncate text-[11px] font-black">
        {
          value
        }
      </p>

      <p className="mt-1 truncate text-[8px] opacity-60">
        {
          helper
        }
      </p>
    </div>
  );
}

function InfoRow({
  icon:
    Icon,
  label,
  value,
}: {
  icon:
    ElementType;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-slate-100 bg-[#FAFCFE] p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F5EA8] shadow-sm">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0">
        <p className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-400">
          {
            label
          }
        </p>

        <p className="mt-1 break-words text-[9px] font-bold text-slate-700">
          {
            value
          }
        </p>
      </div>
    </div>
  );
}

function VerificationRow({
  label,
  status,
  reason,
}: {
  label:
    string;

  status:
    "Pass"
    | "Fail"
    | "Review";

  reason?:
    string;
}) {
  const config =
    status ===
    "Pass"
      ? {
          icon:
            CheckCircle2,
          className:
            "border-emerald-100 bg-emerald-50 text-emerald-700",
        }
      : status ===
        "Fail"
        ? {
            icon:
              XCircle,
            className:
              "border-rose-100 bg-rose-50 text-rose-700",
          }
        : {
            icon:
              AlertCircle,
            className:
              "border-amber-100 bg-amber-50 text-amber-700",
          };

  const Icon =
    config.icon;

  return (
    <div className={`flex items-start gap-3 rounded-[16px] border p-3 ${config.className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black">
            {
              label
            }
          </p>

          <span className="text-[8px] font-black">
            {
              status
            }
          </span>
        </div>

        {reason && (
          <p className="mt-1 text-[8px] leading-4 opacity-65">
            {
              reason
            }
          </p>
        )}
      </div>
    </div>
  );
}

function StatusPill({
  value,
}: {
  value:
    string;
}) {
  const style =
    value ===
    "Verified"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : value ===
        "Rejected"
        ? "border-rose-100 bg-rose-50 text-rose-700"
        : "border-amber-100 bg-amber-50 text-amber-700";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${style}`}>
      {
        value
      }
    </span>
  );
}

function RiskPill({
  risk,
  score,
}: {
  risk:
    string;

  score:
    number;
}) {
  const style =
    risk ===
      "Critical" ||
    risk ===
      "High"
      ? "border-rose-100 bg-rose-50 text-rose-700"
      : risk ===
        "Medium"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : risk ===
          "Low"
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black ${style}`}>
      {
        risk
      } Risk
      {score >
        0
        ? ` ${score}`
        : ""}
    </span>
  );
}

function formatDate(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}

function formatSLA(
  minutes:
    number
) {
  if (
    minutes <=
    0
  ) {
    return "Overdue";
  }

  const hours =
    Math.floor(
      minutes /
      60
    );

  const mins =
    minutes %
    60;

  return hours >
    0
    ? `${hours}h ${mins}m`
    : `${mins}m`;
}

function formatRecommendation(
  value:
    KYCAIReview["recommendation"]
) {
  if (
    value ===
    "likely_clear"
  ) {
    return "Likely Clear";
  }

  if (
    value ===
    "likely_reject"
  ) {
    return "Likely Reject";
  }

  return "Manual Review Required";
}
