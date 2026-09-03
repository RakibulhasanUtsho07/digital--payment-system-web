export interface KYCNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export type KYCStatus =
  | "Not Started"
  | "Pending"
  | "Under Review"
  | "Verified"
  | "Rejected"
  | "Needs Information"
  | "Escalated";

export type VerificationResult =
  | "Passed"
  | "Failed"
  | "Needs Review";

export type RiskLevel =
  | "Unknown"
  | "Low"
  | "Medium"
  | "High"
  | "Critical";

export type DocumentType =
  | "NID"
  | "Passport"
  | "Driving License";

export type SLAStatus =
  | "Normal"
  | "Due Soon"
  | "Overdue";

export interface VerificationCheck {
  label: string;
  status: "Pass" | "Fail" | "Review";
  reason?: string;
}

export type KYCAIRecommendation =
  | "likely_clear"
  | "manual_review"
  | "likely_reject";

export type KYCAIReviewStatus =
  | "not_run"
  | "processing"
  | "completed"
  | "failed";

export interface KYCAIReview {
  id?: string;
  kycId: string;
  status: KYCAIReviewStatus;
  recommendation: KYCAIRecommendation;
  confidence: number;
  riskLevel: RiskLevel;
  summary: string;
  reasons: string[];
  missingSignals: string[];
  provider?: string;
  model?: string;
  triggeredBy?: "automatic_submission" | "admin_rerun";
  reviewedAt?: string;
  errorMessage?: string;
}

export interface KYCRequest {
  id: string;
  caseId: string;
  applicantId: string;
  applicantName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  status: KYCStatus;
  verificationResult: VerificationResult;
  riskLevel: RiskLevel;
  riskScore: number;
  submittedAt: string;
  createdAt: string;
  lastReviewedAt?: string;
  reviewer: string;
  slaMinutes: number;
  reason: string;
  provider: "manual" | "other";
  city: string;
  country: string;
  walletId: string;
  transactionCount: number;
  accountAgeDays: number;
  twoFactorEnabled: boolean;
  failedLoginCount: number;
  frontImageUrl?: string;
  backImageUrl?: string;
  selfieImageUrl?: string;
  rejectionReason?: string;
  verificationChecks: VerificationCheck[];
  notes: KYCNote[];
}

export interface KYCPrivateDocuments {
  frontUrl?: string;
  backUrl?: string;
  selfieUrl?: string;
}

export interface KYCOverviewData {
  pending: number;
  underReview: number;
  approvedToday: number;
  rejectedToday: number;
  highRisk: number;
  averageReviewMinutes: number | null;
  totalSubmitted: number;
  verified: number;
  rejected: number;
  aiReviewed: number;
  needsManualReview: number;
}
