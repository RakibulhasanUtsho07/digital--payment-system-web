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

export type ReviewTab =
  | "overview"
  | "documents"
  | "verification"
  | "risk"
  | "applicant"
  | "activity"
  | "notes"
  | "decision";

export interface VerificationCheck {
  label: string;
  status: "Pass" | "Fail" | "Review";
  reason?: string;
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
  notes: {
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }[];
}