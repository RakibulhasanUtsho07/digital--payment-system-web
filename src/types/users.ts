export type UserRole =
  | "user"
  | "admin"
  | "support"
  | "analyst";

export type UserStatus =
  | "active"
  | "restricted"
  | "suspended";

export type KYCStatus =
  | "verified"
  | "pending"
  | "under_review"
  | "rejected"
  | "not_started";

export type WalletStatus =
  | "active"
  | "frozen"
  | "restricted";

export type RiskLevel =
  | "low"
  | "medium"
  | "high";

export interface User {
  id: string;

  name: string;
  email: string;
  phone: string;

  avatar?: string;

  role: UserRole;
  status: UserStatus;
  kycStatus: KYCStatus;
  walletStatus: WalletStatus;

  riskScore: number;
  riskLevel: RiskLevel;

  balance: number;
  totalReceived: number;
  totalSent: number;
  transactionCount: number;

  lastActive: string;
  joinedAt: string;

  city: string;
  country: string;

  twoFactorEnabled: boolean;
  failedLoginCount: number;
  activeSessions: number;

  walletId?: string;

  documentType?: string;
  maskedDocumentNumber?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;

  createdAt?: string;
  notes?: string;
}