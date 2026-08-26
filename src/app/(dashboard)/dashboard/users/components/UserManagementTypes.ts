// =========================================================
//  BASIC TYPES (Exported to fix your image errors)
// =========================================================
export type UserRole = "Admin" | "User";
export type UserStatus = "Active" | "Suspended" | "Pending" | "Inactive" | "Restricted";
export type WalletStatus = "Active" | "Frozen" | "Restricted";
export type KYCStatus = "Verified" | "Pending" | "Under Review" | "Rejected" | "approved" | "pending" | "under_review" | "rejected";
export type RiskLevel = "Low" | "Medium" | "High" | "low" | "medium" | "high";

// =========================================================
//  USER INTERFACE & RECORD ALIAS
// =========================================================
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KYCStatus;
  walletStatus: WalletStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  
  // Additional fields from your mock data
  balance?: number;
  totalReceived?: number;
  totalSent?: number;
  transactionCount?: number;
  lastActive?: string;
  joinedAt?: string;
  city?: string;
  country?: string;
  twoFactorEnabled?: boolean;
  failedLoginCount?: number;
  activeSessions?: number;
  createdAt?: string;
  
  [key: string]: any;
}

// ✅ Fixes: "Module has no exported member 'UserRecord'"
export type UserRecord = User; 

// =========================================================
//  TABLE, SORTING & FILTERING TYPES
// =========================================================
export interface ColumnVisibility {
  [key: string]: boolean;
}

export type SortField = 
  | "name" 
  | "email" 
  | "status" 
  | "createdAt" 
  | "riskScore" 
  | "joinedAt" 
  | "lastActive" 
  | "balance" 
  | "transactionCount";

export type SortOrder = "asc" | "desc";

export interface SortState {
  field: SortField;
  order?: SortOrder;
  direction?: SortOrder; // Added to match your useUsers hook
}

export interface FilterState {
  status?: string | UserStatus;
  kycStatus?: string | KYCStatus;
  riskLevel?: string | RiskLevel;
  role?: string | UserRole;
  activity?: string;
  walletStatus?: string | WalletStatus;
  [key: string]: any;
}

// =========================================================
//  STATS TYPE
// =========================================================
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers?: number;
  suspended?: number;
  pendingKyc: number;
  highRisk?: number;
  newThisWeek?: number;
}