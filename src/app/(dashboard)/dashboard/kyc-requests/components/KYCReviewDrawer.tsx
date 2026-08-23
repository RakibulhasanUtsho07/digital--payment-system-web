"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Eye,
  ScanLine,
} from "lucide-react";
import KYCDecisionModal from "./KYCRequestInfoModal";

export type DecisionAction = "approve" | "reject" | "information" | "escalate";

export interface KYCApplicant {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  dob: string;
  nidNumber: string;
  address: string;
  submissionDate: string;
  status: "pending" | "approved" | "rejected" | "info_requested" | "escalated";
  riskScore: "Low" | "Medium" | "High";
  matchScore: number;
  documents: {
    frontUrl?: string;
    backUrl?: string;
    selfieUrl?: string;
  };
  checks: {
    idDocumentValid: boolean;
    faceMatchScore: number;
    livenessPassed: boolean;
    databaseMatch: boolean;
    amlCheckPassed: boolean;
  };
}

interface KYCReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  applicant?: KYCApplicant | null;
  onDecisionSubmit?: (
    action: DecisionAction,
    reason: string,
    applicantId: string
  ) => void;
}

// ডিফল্ট টেস্ট ডাটা (যদি কোনো ডাটা পাস না করা হয়)
const defaultApplicant: KYCApplicant = {
  id: "KYC-98421",
  applicantName: "Tanvir Ahmed",
  email: "tanvir.ahmed@example.com",
  phone: "+880 1712-345678",
  dob: "1994-08-15",
  nidNumber: "19942691234567890",
  address: "House 42, Road 11, Block D, Banani, Dhaka-1213",
  submissionDate: "2025-02-22 14:30",
  status: "pending",
  riskScore: "Low",
  matchScore: 94,
  documents: {
    frontUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60",
    backUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=60",
    selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=60",
  },
  checks: {
    idDocumentValid: true,
    faceMatchScore: 94,
    livenessPassed: true,
    databaseMatch: true,
    amlCheckPassed: true,
  },
};

export default function KYCReviewDrawer({
  open,
  onClose,
  applicant = defaultApplicant,
  onDecisionSubmit,
}: KYCReviewDrawerProps) {
  const currentApplicant = applicant || defaultApplicant;
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "checks">("overview");
  const [decisionAction, setDecisionAction] = useState<DecisionAction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ESC কী চাপলে ইমেজ প্রিভিউ বন্ধ হওয়া
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage]);

  const handleOpenDecision = (action: DecisionAction) => {
    setDecisionAction(action);
    setIsModalOpen(true);
  };

  const handleConfirmDecision = (reason: string) => {
    if (decisionAction && currentApplicant) {
      if (onDecisionSubmit) {
        onDecisionSubmit(decisionAction, reason, currentApplicant.id);
      }
    }
    setIsModalOpen(false);
    setDecisionAction(null);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            />

            {/* DRAWER PANEL */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-screen max-w-2xl bg-white shadow-2xl flex flex-col"
              >
                {/* HEADER */}
                <div className="border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                        <ScanLine className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-white">
                            {currentApplicant.applicantName}
                          </h2>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              currentApplicant.riskScore === "Low"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : currentApplicant.riskScore === "Medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {currentApplicant.riskScore} Risk
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ID: {currentApplicant.id} • Submitted: {currentApplicant.submissionDate}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* TABS */}
                  <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
                        activeTab === "overview"
                          ? "border-blue-500 text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("documents")}
                      className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
                        activeTab === "documents"
                          ? "border-blue-500 text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Documents & Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("checks")}
                      className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
                        activeTab === "checks"
                          ? "border-blue-500 text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Automated Checks
                    </button>
                  </div>
                </div>

                {/* DRAWER BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* STATS HIGHLIGHT */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <span className="text-[11px] font-semibold text-slate-500">Face Match Score</span>
                          <p className="mt-1 text-2xl font-black text-slate-900">
                            {currentApplicant.matchScore}%
                          </p>
                          <span className="text-[10px] text-emerald-600 font-semibold">High confidence match</span>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <span className="text-[11px] font-semibold text-slate-500">Document Type</span>
                          <p className="mt-1 text-lg font-bold text-slate-900 truncate">
                            National ID
                          </p>
                          <span className="text-[10px] text-slate-500">NID Smart Card</span>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 col-span-2 sm:col-span-1">
                          <span className="text-[11px] font-semibold text-slate-500">Status</span>
                          <p className="mt-1 text-lg font-bold capitalize text-amber-600">
                            {currentApplicant.status}
                          </p>
                          <span className="text-[10px] text-slate-500">Awaiting Decision</span>
                        </div>
                      </div>

                      {/* APPLICANT DETAILS */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Personal Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-xs text-slate-400 block">Full Name</span>
                            <span className="font-semibold text-slate-800">{currentApplicant.applicantName}</span>
                          </div>

                          <div>
                            <span className="text-xs text-slate-400 block">National ID (NID)</span>
                            <span className="font-mono font-semibold text-slate-800">{currentApplicant.nidNumber}</span>
                          </div>

                          <div>
                            <span className="text-xs text-slate-400 block">Date of Birth</span>
                            <span className="font-semibold text-slate-800">{currentApplicant.dob}</span>
                          </div>

                          <div>
                            <span className="text-xs text-slate-400 block">Email Address</span>
                            <span className="font-semibold text-slate-800">{currentApplicant.email}</span>
                          </div>

                          <div>
                            <span className="text-xs text-slate-400 block">Phone Number</span>
                            <span className="font-semibold text-slate-800">{currentApplicant.phone}</span>
                          </div>

                          <div className="sm:col-span-2">
                            <span className="text-xs text-slate-400 block">Residential Address</span>
                            <span className="font-semibold text-slate-800">{currentApplicant.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* QUICK CHECK SUMMARY */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                          Verification Summary
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-600 font-medium">NID OCR & Expiry Check</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-600 font-medium">Biometric Liveness Verification</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-1.5">
                            <span className="text-slate-600 font-medium">AML & Sanctions Screening</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Clear
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DOCUMENTS */}
                  {activeTab === "documents" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* FRONT ID */}
                        <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-700">NID Front</span>
                            {currentApplicant.documents.frontUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(currentApplicant.documents.frontUrl || null)}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                <Eye className="h-3.5 w-3.5" /> Preview
                              </button>
                            )}
                          </div>
                          <div className="relative aspect-[1.588] w-full rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                            {currentApplicant.documents.frontUrl ? (
                              <img
                                src={currentApplicant.documents.frontUrl}
                                alt="NID Front"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                No Document
                              </div>
                            )}
                          </div>
                        </div>

                        {/* BACK ID */}
                        <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-700">NID Back</span>
                            {currentApplicant.documents.backUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(currentApplicant.documents.backUrl || null)}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                <Eye className="h-3.5 w-3.5" /> Preview
                              </button>
                            )}
                          </div>
                          <div className="relative aspect-[1.588] w-full rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                            {currentApplicant.documents.backUrl ? (
                              <img
                                src={currentApplicant.documents.backUrl}
                                alt="NID Back"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                No Document
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SELFIE */}
                      <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-700">Live Selfie / Face Verification</span>
                          <span className="text-xs font-bold text-emerald-600">
                            Match Score: {currentApplicant.matchScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative h-28 w-28 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            {currentApplicant.documents.selfieUrl ? (
                              <img
                                src={currentApplicant.documents.selfieUrl}
                                alt="Selfie"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                No Photo
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">Biometric Analysis</p>
                            <p className="text-slate-500">• Live face captured via web client.</p>
                            <p className="text-slate-500">• Facial geometry matches NID photo with high confidence.</p>
                            <p className="text-slate-500">• Liveness test successfully verified.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: AUTOMATED CHECKS */}
                  {activeTab === "checks" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-xs font-medium text-slate-700">Document Authenticity</span>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> PASSED
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-xs font-medium text-slate-700">Face Recognition Match</span>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> {currentApplicant.checks.faceMatchScore}% MATCH
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-xs font-medium text-slate-700">Liveness Detection</span>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> PASSED
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-xs font-medium text-slate-700">Government Registry Match</span>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> MATCHED
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                          <span className="text-xs font-medium text-slate-700">AML / PEP Sanction List</span>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> NO MATCH
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS (FOOTER) */}
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleOpenDecision("approve")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDecision("information")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-amber-600 shadow-sm"
                    >
                      <Info className="h-4 w-4" />
                      Req. Info
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDecision("escalate")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Escalate
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDecision("reject")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-rose-700 shadow-sm"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL IMAGE PREVIEW MODAL */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-black transition"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={previewImage}
                alt="Document Full Preview"
                className="max-h-[85vh] w-auto rounded-xl object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DECISION MODAL INTEGRATION */}
      <KYCDecisionModal
        open={isModalOpen}
        action={decisionAction}
        applicantName={currentApplicant.applicantName}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDecision}
      />
    </>
  );
}