export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "NOTICE" | "WARN" | "ERROR" | "CRITICAL";

export type LogService = 
  | "API" | "Authentication" | "Database" | "Wallet" | "Transactions" 
  | "Transfers" | "KYC" | "Notifications" | "Cloudinary" | "AI" 
  | "Background Jobs" | "System" | "Security" | "Support" | "Revenue";

export interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: LogService;
  category: string;
  event: string;
  message: string;
  requestId?: string;
  traceId?: string;
  transactionId?: string;
  userId?: string;
  userName?: string;
  source: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  environment: "Development" | "Staging" | "Production";
  result: "Success" | "Failed" | "Timeout" | "Retried";
}