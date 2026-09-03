export type UserRole = "user" | "admin" | "support" | "analyst";
export type UserStatus = "active" | "suspended" | "restricted" | "pending";
export type KYCStatus = "not_started" | "pending" | "under_review" | "verified" | "rejected";
export type WalletStatus = "active" | "frozen" | "restricted" | "closed";
export type RiskLevel = "low" | "medium" | "high";

export interface UserActivity {
  id: string;
  type: "login" | "profile" | "security" | "wallet" | "kyc" | "admin";
  title: string;
  description: string;
  createdAt: string;
  ipAddress?: string;
}

export interface UserTransaction {
  id: string;
  type: "send" | "receive" | "cash_in" | "cash_out";
  amount: number;
  status: "pending" | "completed" | "failed";
  counterparty: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KYCStatus;
  walletStatus: WalletStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  balance: number;
  totalReceived: number;
  totalSent: number;
  transactionCount: number;
  lastActive: string;
  joinedAt: string;
  city: string;
  country: string;
  walletId: string;
  twoFactorEnabled: boolean;
  failedLoginCount: number;
  activeSessions: number;
  avatarUrl?: string;
  activities?: UserActivity[];
  transactions?: UserTransaction[];
}

export interface ColumnVisibility {
  phone: boolean;
  role: boolean;
  kyc: boolean;
  wallet: boolean;
  risk: boolean;
  lastActive: boolean;
  joined: boolean;
}

export type ColumnKey = keyof ColumnVisibility;
export type SortField = "name" | "role" | "kycStatus" | "walletStatus" | "riskScore" | "lastActive" | "joinedAt";
export type SortOrder = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortOrder;
}

export interface UserFilters {
  status: "all" | UserStatus;
  kycStatus: "all" | KYCStatus;
  role: "all" | UserRole;
  riskLevel: "all" | RiskLevel;
  walletStatus: "all" | WalletStatus;
  activity: "all" | "today" | "week" | "inactive";
}

export type UserFilterKey = keyof UserFilters;

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspended: number;
  pendingKyc: number;
  highRisk: number;
  newThisWeek: number;
}

export type DrawerTab = "overview" | "security" | "wallet" | "kyc" | "transactions" | "activity" | "risk";

export interface ToastState {
  type: "success" | "error" | "info";
  message: string;
}

export interface UserListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: SortState;
  filters?: UserFilters;
}

export interface UserListResponse {
  users: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateUserInput = Pick<UserRecord, "name" | "email" | "phone" | "role">;
export type UpdateUserInput = Partial<Omit<UserRecord, "id">>;

