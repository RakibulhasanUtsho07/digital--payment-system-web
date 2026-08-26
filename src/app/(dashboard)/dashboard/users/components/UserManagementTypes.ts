import type {
  User,
  UserRole,
  UserStatus,
  KYCStatus,
  WalletStatus,
  RiskLevel,
} from "@/types/users";

export type {
  User,
  UserRole,
  UserStatus,
  KYCStatus,
  WalletStatus,
  RiskLevel,
};

export type UserRecord = User;

export interface ColumnVisibility {
  phone: boolean;
  role: boolean;
  kyc: boolean;
  wallet: boolean;
  risk: boolean;
  lastActive: boolean;
  joined: boolean;
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

export type SortOrder =
  | "asc"
  | "desc";

export interface SortState {
  field: SortField;
  direction: SortOrder;
}

export interface UserFilters {
  status:
    | "all"
    | UserStatus;

  kycStatus:
    | "all"
    | KYCStatus;

  role:
    | "all"
    | UserRole;

  riskLevel:
    | "all"
    | RiskLevel;

  walletStatus:
    | "all"
    | WalletStatus;

  activity:
    | "all"
    | "today"
    | "week"
    | "inactive";
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspended: number;
  pendingKyc: number;
  highRisk: number;
  newThisWeek: number;
}

export type DrawerTab =
  | "overview"
  | "security"
  | "wallet"
  | "kyc"
  | "transactions"
  | "activity"
  | "risk";

export interface ToastState {
  show: boolean;
  message: string;
  type:
    | "success"
    | "error"
    | "info";
}