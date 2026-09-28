"use client";

import React, {
  useCallback,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import type {
  SupportTicketDetail,
} from "@/lib/api/supportDashboardApi";

import {
  supportDashboardApi,
} from "@/lib/api/supportDashboardApi";

/* =========================================================
   TYPES
========================================================= */

export interface SupportAiAnalysis {
  ticketId: string;
  ticketNumber: string;

  provider:
    | "rule-engine";

  mode:
    | "copilot";

  confidence: number;

  summary: string;

  intent: string;

  suggestedPriority:
    | "Urgent"
    | "High"
    | "Normal"
    | "Low";

  urgency:
    | "Critical"
    | "High"
    | "Moderate"
    | "Low";

  sentiment:
    | "Concerned"
    | "Neutral"
    | "Positive";

  possibleRootCause: string;

  recommendedNextAction:
    string;

  suggestedReply:
    string;

  verification: {
    status:
      | "verified"
      | "partially_verified"
      | "unverified";
    label: string;
    evidence: string[];
  };

  safety: {
    humanApprovalRequired: true;
    canExecuteFinancialActions: false;
  };

  context: {
    customerName: string;
    customerEmail: string;
    category: string;
    priority: string;
    status: string;
    slaMinutes: number;
    slaBreached: boolean;
    relatedReference:
      string | null;
    messageCount: number;
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SupportAiCopilot({
  ticket,
  onUseReply,
}: {
  ticket: SupportTicketDetail;

  onUseReply:
    (reply: string) => void;
}) {
  const [
    analysis,
    setAnalysis,
  ] =
    useState<
      SupportAiAnalysis | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     RUN ANALYSIS
  ======================================================= */

  const runAnalysis =
    useCallback(
      async () => {
        if (loading) {
          return;
        }

        setLoading(true);
        setError("");

        try {
          const response =
            await supportDashboardApi.analyzeTicket(
              ticket.id
            );

          if (
            !response.success ||
            !response.analysis
          ) {
            throw new Error(
              response.message ||
                "Unable to generate AI support analysis."
            );
          }

          setAnalysis(
            response.analysis
          );
        } catch (
          analysisError
        ) {
          setError(
            analysisError instanceof
              Error
              ? analysisError.message
              : "Unable to generate AI support analysis."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        loading,
        ticket.id,
      ]
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section
      className="
        rounded-[24px]
        border
        border-violet-200
        bg-[#F7F3FF]
        p-4
        shadow-[0_8px_28px_rgba(124,92,252,0.08)]
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-violet-100
              text-violet-600
            "
          >
            <Sparkles className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-xs font-black text-[#3E2D73]">
              AI Support Copilot
            </h3>

            <p className="text-[9px] text-violet-500">
              Agentic assistance · human approval
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void runAnalysis()
          }
          disabled={loading}
          className="
            inline-flex
            h-8
            items-center
            gap-1.5
            rounded-xl
            bg-violet-600
            px-2.5
            text-[9px]
            font-black
            text-white
            transition
            hover:bg-violet-700
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : analysis ? (
            <RefreshCw className="h-3 w-3" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}

          {analysis
            ? "Re-analyze"
            : "Analyze"}
        </button>
      </div>

      {error ? (
        <div
          className="
            mt-4
            rounded-2xl
            border
            border-rose-200
            bg-rose-50
            p-3
          "
        >
          <p className="text-[10px] font-bold text-rose-700">
            {error}
          </p>
        </div>
      ) : null}

      {!analysis &&
      !loading ? (
        <div
          className="
            mt-4
            rounded-2xl
            border
            border-violet-200
            bg-white
            p-3
          "
        >
          <p className="text-[10px] leading-5 text-slate-500">
            Analyze this ticket to generate
            a case summary, intent, urgency,
            possible root cause, next action,
            and a suggested reply.
          </p>

          <div className="mt-3 flex items-center gap-2 text-[9px] font-bold text-violet-600">
            <ShieldAlert className="h-3.5 w-3.5" />

            AI recommends. Human approves.
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="
                  h-12
                  animate-pulse
                  rounded-2xl
                  bg-white/80
                "
              />
            )
          )}
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-4 space-y-3">
          <CopilotRow
            label="Confidence"
            value={`${analysis.confidence}%`}
            badge
          />

          <CopilotRow
            label="Evidence Status"
            value={`${analysis.verification.status.replace(
              "_",
              " "
            )} · ${analysis.verification.label}`}
          />

          {analysis.verification.evidence.length > 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">
                Verified backend evidence
              </p>

              <ul className="mt-2 space-y-1.5">
                {analysis.verification.evidence.map(
                  (item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-[10px] leading-5 text-emerald-900/80"
                    >
                      <CheckCircle2 className="mt-1 h-3 w-3 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          ) : null}

          <CopilotRow
            label="Ticket Summary"
            value={analysis.summary}
          />

          <CopilotRow
            label="Detected Intent"
            value={analysis.intent}
          />

          <CopilotRow
            label="Urgency"
            value={`${analysis.urgency} · ${analysis.sentiment}`}
          />

          <CopilotRow
            label="Possible Root Cause"
            value={
              analysis.possibleRootCause
            }
          />

          <CopilotRow
            label="Recommended Next Action"
            value={
              analysis.recommendedNextAction
            }
          />

          <div
            className="
              rounded-2xl
              border
              border-violet-200
              bg-white
              p-3
            "
          >
            <p
              className="
                text-[8px]
                font-black
                uppercase
                tracking-[0.12em]
                text-violet-400
              "
            >
              Suggested Reply
            </p>

            <p
              className="
                mt-1.5
                text-[10px]
                leading-5
                text-[#3E2D73]
              "
            >
              {analysis.suggestedReply}
            </p>

            <button
              type="button"
              onClick={() =>
                onUseReply(
                  analysis.suggestedReply
                )
              }
              className="
                mt-3
                inline-flex
                h-8
                items-center
                gap-1.5
                rounded-xl
                bg-[#16A66A]
                px-2.5
                text-[9px]
                font-black
                text-white
                transition
                hover:bg-[#128D59]
              "
            >
              <CheckCircle2 className="h-3 w-3" />
              Use Reply
            </button>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-amber-200
              bg-amber-50
              p-3
            "
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />

              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-amber-700
                "
              >
                Safety rule
              </p>
            </div>

            <p
              className="
                mt-1.5
                text-[10px]
                leading-5
                text-amber-800/80
              "
            >
              AI cannot execute financial
              actions. A support agent must
              review and authorize sensitive
              actions.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* =========================================================
   COPILOT ROW
========================================================= */

function CopilotRow({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p
          className="
            text-[8px]
            font-black
            uppercase
            tracking-[0.12em]
            text-violet-400
          "
        >
          {label}
        </p>

        {badge ? (
          <span
            className="
              rounded-full
              bg-violet-600
              px-2
              py-1
              text-[8px]
              font-black
              text-white
            "
          >
            {value}
          </span>
        ) : null}
      </div>

      {!badge ? (
        <p
          className="
            mt-1
            text-[10px]
            leading-5
            text-[#3E2D73]
          "
        >
          {value}
        </p>
      ) : null}
    </div>
  );
}
