// src/types/users.ts

export type UserRole = 'User' | 'Admin' | 'Support' | 'Analyst';
export type UserStatus = 'Active' | 'Restricted' | 'Suspended';
export type KYCStatus = 'Verified' | 'Pending' | 'Under Review' | 'Rejected' | 'Not Started';
export type WalletStatus = 'Active' | 'Frozen' | 'Restricted';
export type RiskLevel = 'Low' | 'Medium' | 'High';

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
}