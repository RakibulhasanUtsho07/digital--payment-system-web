import { apiClient } from "./client";

/* =========================================================
   SHARED
========================================================= */

export type AnalystRange = "24h" | "7d" | "30d" | "90d";
export type AnalystMode = "all" | "test" | "live";
export type AnalystBucket = "hour" | "day";
export type AnalystInsightSeverity = "critical" | "high" | "medium" | "info" | "positive";
export type AnalystPulseStatus = "healthy" | "attention" | "critical";
export type AnalystPulseTrend = "up" | "down" | "stable";

export interface AnalystMetric {
  value: number;
  previousValue: number;
  changePercent: number | null;
}

function normalizeCurrency(value: string): string {
  const currency = value.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Currency must be a three-letter ISO code.");
  }

  return currency;
}

/* =========================================================
   EXECUTIVE OVERVIEW
========================================================= */

export interface AnalystTrendPoint {
  bucket: string;
  paymentCount: number;
  completedCount: number;
  failedCount: number;
  volumeMinor: number;
  feeRevenueMinor: number;
  successRate: number;
}

export interface AnalystBreakdownItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  volumeMinor?: number;
}

export interface AnalystInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: string;
  title: string;
  description: string;
  evidence: string;
  recommendedAction: string;
}

export interface AnalystOverviewData {
  generatedAt: string;
  intelligenceEngine: {
    type: "deterministic_rules";
    paidProviderUsed: false;
    version: string;
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  freshness: {
    liveCollectionsReadAt: string;
    latestDailyFactGeneratedAt: string | null;
    dailyFactDaysCovered: number;
  };
  status: AnalystPulseStatus;
  metrics: {
    paymentVolumeMinor: AnalystMetric;
    netPaymentVolumeMinor: AnalystMetric;
    paymentCount: AnalystMetric;
    completedPaymentCount: AnalystMetric;
    successRate: AnalystMetric;
    paymentFeeRevenueMinor: AnalystMetric;
    refundAmountMinor: AnalystMetric;
    openDisputeExposureMinor: AnalystMetric;
    walletTransactionCount: AnalystMetric;
  };
  accounts: {
    activeUsers: number;
    newUsers: number;
    kycVerifiedUsers: number;
    totalMerchants: number;
    activeMerchants: number;
    verifiedMerchants: number;
    liveEnabledMerchants: number;
  };
  operations: {
    failedPaymentCount: number;
    pendingPaymentCount: number;
    refundCount: number;
    openDisputeCount: number;
    failedTransactionCount: number;
    highRiskTransactionCount: number;
    walletTransactionVolumeMinor: number;
  };
  executive: {
    paymentFailureRate: number;
    pendingPaymentCount: number;
    refundRate: number;
    disputeExposureRate: number;
    highRiskTransactionRate: number;
    walletTransactionFailureRate: number;
    merchantActivationRate: number;
    merchantVerificationRate: number;
    merchantLiveReadinessRate: number;
  };
  merchantHealth: {
    totalMerchants: number;
    activeMerchants: number;
    verifiedMerchants: number;
    liveEnabledMerchants: number;
    activationRate: number;
    verificationRate: number;
    liveReadinessRate: number;
  };
  riskSummary: {
    highRiskTransactionCount: number;
    highRiskTransactionRate: number;
    failedPaymentCount: number;
    paymentFailureRate: number;
    refundAmountMinor: number;
    refundRate: number;
    openDisputeCount: number;
    openDisputeExposureMinor: number;
    disputeExposureRate: number;
  };
  revenueLedger: {
    classifiedNetRevenueMinor: number;
    classifiedEventCount: number;
    unclassifiedEventCount: number;
    note: string;
  };
  trend: AnalystTrendPoint[];
  paymentStatus: AnalystBreakdownItem[];
  providers: AnalystBreakdownItem[];
  transactionRisk: AnalystBreakdownItem[];
  insights: AnalystInsight[];
}

export interface AnalystOverviewFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
}

interface AnalystOverviewResponse {
  success: boolean;
  data: AnalystOverviewData;
  message?: string;
}

export async function getAnalystOverview(
  filters: AnalystOverviewFilters,
  signal?: AbortSignal
): Promise<AnalystOverviewData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
  });

  const response = await apiClient<AnalystOverviewResponse>(
    `/analyst/overview?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load analyst overview.");
  }

  return response.data;
}

/* =========================================================
   LIVE PLATFORM PULSE
========================================================= */

export interface AnalystPulseWindow {
  minutes: 5 | 15 | 60;
  attemptCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  volumeMinor: number;
  successRate: number;
  failureRate: number;
}

export interface AnalystPulseScore {
  key: "growth" | "liquidity" | "transactions" | "security" | "risk";
  label: string;
  score: number;
  status: AnalystPulseStatus;
  trend: AnalystPulseTrend;
  basis: string;
}

export interface AnalystPulseAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  description: string;
  metric: string;
}

export interface AnalystLivePulseData {
  generatedAt: string;
  refreshAfterSeconds: number;
  source: "mongodb_live_collections";
  calculationEngine: {
    type: "deterministic_rules";
    paidProviderUsed: false;
    version: string;
  };
  filters: {
    mode: AnalystMode;
    currency: string;
  };
  scopeNote: string;
  status: AnalystPulseStatus;
  windows: {
    last5Minutes: AnalystPulseWindow;
    last15Minutes: AnalystPulseWindow;
    last60Minutes: AnalystPulseWindow;
    previous60Minutes: AnalystPulseWindow;
  };
  comparison: {
    attemptChangePercent: number | null;
    volumeChangePercent: number | null;
    successRateChangePoints: number;
  };
  transactions: {
    last60Minutes: {
      count: number;
      completedCount: number;
      failedCount: number;
      pendingCount: number;
      highRiskCount: number;
      failureRate: number;
      highRiskRate: number;
    };
    previous60MinutesCount: number;
  };
  payouts: {
    included: boolean;
    pendingCount: number;
    processingCount: number;
    failedCount: number;
    pendingAmountMinor: number;
    processingAmountMinor: number;
    completedLast60Minutes: number;
    failedLast60Minutes: number;
  };
  queues: {
    stalePaymentCount: number;
  };
  modeTraffic: Array<{
    mode: "test" | "live";
    count: number;
    percentage: number;
  }>;
  providers: Array<{
    provider: string;
    attemptCount: number;
    completedCount: number;
    failedCount: number;
    volumeMinor: number;
    successRate: number;
    status: AnalystPulseStatus;
  }>;
  failureReasons: Array<{
    code: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    bucket: string;
    attemptCount: number;
    completedCount: number;
    failedCount: number;
    volumeMinor: number;
  }>;
  scores: AnalystPulseScore[];
  alerts: AnalystPulseAlert[];
}

export interface AnalystLivePulseFilters {
  mode: AnalystMode;
  currency: string;
}

interface AnalystLivePulseResponse {
  success: boolean;
  data: AnalystLivePulseData;
  message?: string;
}

export async function getAnalystLivePulse(
  filters: AnalystLivePulseFilters,
  signal?: AbortSignal
): Promise<AnalystLivePulseData> {
  const params = new URLSearchParams({
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
  });

  const response = await apiClient<AnalystLivePulseResponse>(
    `/analyst/live-pulse?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load the live platform pulse.");
  }

  return response.data;
}

/* =========================================================
   PAYMENT ANALYTICS
========================================================= */

export type AnalystPaymentStatus =
  | "all"
  | "pending"
  | "authorized"
  | "captured"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export type AnalystPaymentSource = "all" | "paypal" | "card" | "local_psp" | "wallet";
export type AnalystPaymentInsightSeverity = "critical" | "warning" | "info" | "positive";
export type AnalystPaymentMetric = AnalystMetric;

export interface AnalystPaymentTrendPoint {
  bucket: string;
  attemptCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  volumeMinor: number;
  successRate: number;
}

export interface AnalystPaymentProviderPerformance {
  provider: string;
  attemptCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  volumeMinor: number;
  feeRevenueMinor: number;
  successRate: number;
  averageCompletionSeconds: number;
  health: AnalystPulseStatus;
}

export interface AnalystPaymentStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
  volumeMinor: number;
}

export interface AnalystPaymentSourceBreakdown {
  source: string;
  count: number;
  percentage: number;
  volumeMinor: number;
}

export interface AnalystPaymentModeBreakdown {
  mode: string;
  count: number;
  percentage: number;
  volumeMinor: number;
}

export interface AnalystPaymentFailureReason {
  code: string;
  count: number;
  percentage: number;
}

export interface AnalystPaymentLatencyBreakdown {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface AnalystPaymentInsight {
  id: string;
  severity: AnalystPaymentInsightSeverity;
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystPaymentAnalyticsData {
  generatedAt: string;
  source: "mongodb_payment_collection";
  intelligenceEngine: {
    type: "deterministic_rules";
    paidProviderUsed: false;
    version: string;
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    provider: string;
    status: AnalystPaymentStatus;
    source: AnalystPaymentSource;
    from: string;
    to: string;
    previousFrom: string;
    bucket: AnalystBucket;
  };
  metrics: {
    attemptCount: AnalystPaymentMetric;
    completedCount: AnalystPaymentMetric;
    failedCount: AnalystPaymentMetric;
    paymentVolumeMinor: AnalystPaymentMetric;
    feeRevenueMinor: AnalystPaymentMetric;
    netVolumeMinor: AnalystPaymentMetric;
    averagePaymentMinor: AnalystPaymentMetric;
    successRate: AnalystPaymentMetric;
    failureRate: AnalystPaymentMetric;
    averageCompletionSeconds: AnalystPaymentMetric;
  };
  operations: {
    pendingCount: number;
    cancelledCount: number;
    expiredCount: number;
    riskBlockedCount: number;
  };
  trend: AnalystPaymentTrendPoint[];
  statuses: AnalystPaymentStatusBreakdown[];
  providers: AnalystPaymentProviderPerformance[];
  sources: AnalystPaymentSourceBreakdown[];
  modes: AnalystPaymentModeBreakdown[];
  failureReasons: AnalystPaymentFailureReason[];
  latency: AnalystPaymentLatencyBreakdown[];
  insights: AnalystPaymentInsight[];
}

export interface AnalystPaymentAnalyticsFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  provider?: string;
  status: AnalystPaymentStatus;
  source: AnalystPaymentSource;
}

interface AnalystPaymentAnalyticsResponse {
  success: boolean;
  data: AnalystPaymentAnalyticsData;
  message?: string;
}

export async function getAnalystPaymentAnalytics(
  filters: AnalystPaymentAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystPaymentAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
    status: filters.status,
    source: filters.source,
  });

  const provider = filters.provider?.trim().toLowerCase();
  if (provider) params.set("provider", provider);

  const response = await apiClient<AnalystPaymentAnalyticsResponse>(
    `/analyst/payments?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load payment analytics.");
  }

  return response.data;
}

/* =========================================================
   ANALYST INTELLIGENCE
========================================================= */

export type AnalystInsightCategoryKey =
  | "payments"
  | "revenue"
  | "refunds"
  | "disputes"
  | "risk"
  | "growth"
  | "data_quality";

export type AnalystIntelligenceSeverity = "all" | AnalystInsightSeverity;
export type AnalystIntelligenceCategory = "all" | AnalystInsightCategoryKey;

export interface AnalystIntelligenceSignal {
  id: string;
  severity: AnalystInsightSeverity;
  category: AnalystInsightCategoryKey;
  title: string;
  description: string;
  evidence: string;
  recommendedAction: string;
}

export interface AnalystIntelligenceCategoryBreakdown {
  category: AnalystInsightCategoryKey;
  count: number;
  percentage: number;
  highestSeverity: AnalystInsightSeverity | null;
}

export interface AnalystIntelligenceTimelinePoint {
  bucket: string;
  paymentCount: number;
  failedCount: number;
  volumeMinor: number;
  successRate: number;
  failureRate: number;
  volumeChangePercent: number | null;
  pressureScore: number;
  status: AnalystPulseStatus;
}

export interface AnalystIntelligenceData {
  generatedAt: string;
  source: "analyst_overview_aggregation";
  engine: {
    type: "deterministic_rules";
    version: string;
    paidProviderUsed: false;
    localModelUsed: false;
    explanation: string;
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    bucket: AnalystBucket;
    from: string;
    to: string;
    severity: AnalystIntelligenceSeverity;
    category: AnalystIntelligenceCategory;
  };
  status: AnalystPulseStatus;
  summary: {
    factsEvaluated: number;
    totalSignals: number;
    matchedSignals: number;
    criticalSignals: number;
    attentionSignals: number;
    positiveSignals: number;
    dataQualitySignals: number;
  };
  baseline: {
    paymentCount: number;
    walletTransactionCount: number;
    paymentVolumeMinor: number;
    feeRevenueMinor: number;
    refundAmountMinor: number;
    openDisputeExposureMinor: number;
    highRiskTransactionCount: number;
    failedPaymentCount: number;
    successRate: number;
  };
  categories: AnalystIntelligenceCategoryBreakdown[];
  timeline: AnalystIntelligenceTimelinePoint[];
  insights: AnalystIntelligenceSignal[];
  anomalies: AnalystIntelligenceSignal[];
}

export interface AnalystIntelligenceFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  severity: AnalystIntelligenceSeverity;
  category: AnalystIntelligenceCategory;
}

interface AnalystIntelligenceResponse {
  success: boolean;
  data: AnalystIntelligenceData;
  message?: string;
}

export async function getAnalystIntelligence(
  filters: AnalystIntelligenceFilters,
  signal?: AbortSignal
): Promise<AnalystIntelligenceData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
    severity: filters.severity,
    category: filters.category,
  });

  const response = await apiClient<AnalystIntelligenceResponse>(
    `/analyst/intelligence?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load analyst intelligence.");
  }

  return response.data;
}

/* =========================================================
   TRANSACTION ANALYTICS
========================================================= */

export type AnalystTransactionStatus = "all" | "PENDING" | "COMPLETED" | "FAILED";
export type AnalystTransactionType = "all" | "TRANSFER" | "DEPOSIT" | "WITHDRAW";
export type AnalystTransactionRisk = "all" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnalystTransactionInsightSeverity = AnalystInsightSeverity;

export interface AnalystTransactionInsight {
  id: string;
  severity: AnalystTransactionInsightSeverity;
  category: "reliability" | "risk" | "backlog" | "mix" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystTransactionAnalyticsData {
  generatedAt: string;
  source: "mongodb_transaction_collection";
  privacy: {
    amountsDecrypted: false;
    referencesExposed: false;
    note: string;
  };
  filters: {
    range: AnalystRange;
    currency: string;
    status: AnalystTransactionStatus;
    type: AnalystTransactionType;
    risk: AnalystTransactionRisk;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
    bucket: AnalystBucket;
  };
  metrics: {
    transactionCount: AnalystMetric;
    completedCount: AnalystMetric;
    failedCount: AnalystMetric;
    pendingCount: AnalystMetric;
    completionRate: AnalystMetric;
    failureRate: AnalystMetric;
    highRiskCount: AnalystMetric;
    highRiskRate: AnalystMetric;
  };
  operations: {
    criticalRiskCount: number;
    highRiskCount: number;
    unknownRiskCount: number;
    transactionsWithFailureCode: number;
  };
  trend: Array<{
    bucket: string;
    transactionCount: number;
    completedCount: number;
    failedCount: number;
    pendingCount: number;
    highRiskCount: number;
    completionRate: number;
    failureRate: number;
  }>;
  statuses: Array<{ status: string; count: number; percentage: number }>;
  types: Array<{ type: string; count: number; percentage: number }>;
  risks: Array<{ risk: string; count: number; percentage: number }>;
  failureReasons: Array<{ code: string; count: number; percentage: number }>;
  insights: AnalystTransactionInsight[];
}

export interface AnalystTransactionAnalyticsFilters {
  range: AnalystRange;
  currency: string;
  status: AnalystTransactionStatus;
  type: AnalystTransactionType;
  risk: AnalystTransactionRisk;
}

interface AnalystTransactionAnalyticsResponse {
  success: boolean;
  data: AnalystTransactionAnalyticsData;
  message?: string;
}

export async function getAnalystTransactionAnalytics(
  filters: AnalystTransactionAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystTransactionAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    currency: normalizeCurrency(filters.currency),
    status: filters.status,
    type: filters.type,
    risk: filters.risk,
  });

  const response = await apiClient<AnalystTransactionAnalyticsResponse>(
    `/analyst/transactions?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load transaction analytics.");
  }

  return response.data;
}

/* =========================================================
   CONVERSION ANALYTICS
========================================================= */

export interface AnalystConversionInsight {
  id: string;
  severity: AnalystInsightSeverity;
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystConversionData {
  generatedAt: string;
  source: "mongodb_payment_collection";
  calculationEngine: {
    type: "deterministic_rules";
    paidProviderUsed: false;
    version: string;
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    provider: string;
    source: AnalystPaymentSource;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
    bucket: AnalystBucket;
  };
  metrics: {
    createdCount: AnalystMetric;
    authorizedCount: AnalystMetric;
    capturedCount: AnalystMetric;
    completedCount: AnalystMetric;
    authorizationRate: AnalystMetric;
    captureRate: AnalystMetric;
    completionRate: AnalystMetric;
    terminalDropoffRate: AnalystMetric;
  };
  operations: {
    pendingCount: number;
    failedCount: number;
    cancelledCount: number;
    expiredCount: number;
  };
  funnel: Array<{
    stage: "created" | "authorized" | "captured" | "completed";
    count: number;
    percentageFromStart: number;
    percentageFromPrevious: number;
    notReachedFromPrevious: number;
  }>;
  trend: Array<{
    bucket: string;
    createdCount: number;
    authorizedCount: number;
    capturedCount: number;
    completedCount: number;
    failedCount: number;
    completionRate: number;
  }>;
  providers: Array<{
    provider: string;
    createdCount: number;
    completedCount: number;
    completionRate: number;
    failedCount: number;
  }>;
  sources: Array<{
    source: string;
    createdCount: number;
    completedCount: number;
    completionRate: number;
  }>;
  dropoffs: Array<{ reason: string; count: number; percentage: number }>;
  insights: AnalystConversionInsight[];
}

export interface AnalystConversionFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  provider?: string;
  source: AnalystPaymentSource;
}

interface AnalystConversionResponse {
  success: boolean;
  data: AnalystConversionData;
  message?: string;
}

export async function getAnalystConversionAnalytics(
  filters: AnalystConversionFilters,
  signal?: AbortSignal
): Promise<AnalystConversionData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
    source: filters.source,
  });

  const provider = filters.provider?.trim().toLowerCase();
  if (provider) params.set("provider", provider);

  const response = await apiClient<AnalystConversionResponse>(
    `/analyst/conversion?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load payment conversion analytics.");
  }

  return response.data;
}

/* =========================================================
   REVENUE ANALYTICS
========================================================= */

export type AnalystRevenueKind =
  | "all"
  | "TRANSFER_FEE"
  | "WITHDRAWAL_FEE"
  | "DEPOSIT_FEE"
  | "SERVICE_FEE"
  | "MERCHANT_FEE"
  | "REFUND"
  | "FEE_WAIVER"
  | "GATEWAY_REVERSAL"
  | "MICRO_FEE_ADJUSTMENT";

export interface AnalystRevenueInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "growth" | "leakage" | "mix" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystRevenueData {
  generatedAt: string;
  source: "mongodb_revenue_event_ledger";
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    kind: AnalystRevenueKind;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  metrics: {
    grossRevenueMinor: AnalystMetric;
    leakageMinor: AnalystMetric;
    netRevenueMinor: AnalystMetric;
    eventCount: AnalystMetric;
    revenueEventCount: AnalystMetric;
    leakageEventCount: AnalystMetric;
    averageRevenuePerEventMinor: AnalystMetric;
    leakageRate: AnalystMetric;
  };
  quality: {
    classifiedEventCount: number;
    unclassifiedEventCount: number;
    metadataCoverage: number;
  };
  trend: Array<{
    bucket: string;
    grossRevenueMinor: number;
    leakageMinor: number;
    netRevenueMinor: number;
    revenueEventCount: number;
    leakageEventCount: number;
  }>;
  kinds: Array<{
    kind: string;
    eventCount: number;
    grossMinor: number;
    leakageMinor: number;
    netMinor: number;
    percentageOfNetRevenue: number;
  }>;
  sources: Array<{
    source: string;
    eventCount: number;
    netRevenueMinor: number;
    percentage: number;
  }>;
  leakage: Array<{
    kind: string;
    count: number;
    amountMinor: number;
    percentage: number;
  }>;
  insights: AnalystRevenueInsight[];
}

export interface AnalystRevenueFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  kind: AnalystRevenueKind;
}

interface AnalystRevenueResponse {
  success: boolean;
  data: AnalystRevenueData;
  message?: string;
}

export async function getAnalystRevenueAnalytics(
  filters: AnalystRevenueFilters,
  signal?: AbortSignal
): Promise<AnalystRevenueData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
    kind: filters.kind,
  });

  const response = await apiClient<AnalystRevenueResponse>(
    `/analyst/revenue?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load analyst revenue intelligence.");
  }

  return response.data;
}

/* =========================================================
   MERCHANT ANALYTICS
========================================================= */

export interface AnalystMerchantInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "growth" | "activation" | "verification" | "payments" | "concentration" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystMerchantAnalyticsData {
  generatedAt: string;
  source: {
    merchants: "mongodb_merchant_collection";
    payments: "mongodb_payment_collection";
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  population: {
    totalMerchants: number;
    activeMerchants: number;
    pendingMerchants: number;
    suspendedMerchants: number;
    disabledMerchants: number;
    verifiedMerchants: number;
    liveEnabledMerchants: number;
    testEnabledMerchants: number;
    verificationCoverage: number;
    liveReadinessRate: number;
  };
  metrics: {
    newMerchants: AnalystMetric;
    transactingMerchants: AnalystMetric;
    paymentAttempts: AnalystMetric;
    completedPayments: AnalystMetric;
    paymentVolumeMinor: AnalystMetric;
    feeRevenueMinor: AnalystMetric;
    successRate: AnalystMetric;
    merchantEngagementRate: AnalystMetric;
  };
  trend: Array<{
    bucket: string;
    newMerchantCount: number;
    transactingMerchantCount: number;
    paymentAttemptCount: number;
    completedPaymentCount: number;
    paymentVolumeMinor: number;
    successRate: number;
  }>;
  statuses: Array<{ status: string; count: number; percentage: number }>;
  verification: Array<{ status: string; count: number; percentage: number }>;
  businessTypes: Array<{ type: string; count: number; percentage: number }>;
  countries: Array<{ country: string; count: number; percentage: number }>;
  topMerchants: Array<{
    merchantId: string;
    businessName: string;
    businessDisplayName: string | null;
    businessType: string;
    country: string;
    status: string;
    verificationStatus: string;
    liveEnabled: boolean;
    paymentAttempts: number;
    completedPayments: number;
    failedPayments: number;
    paymentVolumeMinor: number;
    feeRevenueMinor: number;
    successRate: number;
    volumeShare: number;
  }>;
  insights: AnalystMerchantInsight[];
}

export interface AnalystMerchantAnalyticsFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
}

interface AnalystMerchantAnalyticsResponse {
  success: boolean;
  data: AnalystMerchantAnalyticsData;
  message?: string;
}

export async function getAnalystMerchantAnalytics(
  filters: AnalystMerchantAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystMerchantAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
  });

  const response = await apiClient<AnalystMerchantAnalyticsResponse>(
    `/analyst/merchants?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load merchant analytics.");
  }

  return response.data;
}

/* =========================================================
   RISK ANALYTICS
========================================================= */

export type AnalystRiskSource = "all" | "wallet" | "card" | "paypal" | "local_psp";

export interface AnalystRiskInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "gateway" | "transaction" | "provider" | "velocity" | "reliability" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystRiskAnalyticsData {
  generatedAt: string;
  source: {
    payments: "mongodb_payment_collection";
    transactions: "mongodb_transaction_collection";
  };
  intelligenceEngine: {
    type: "deterministic_rules";
    version: string;
    paidProviderUsed: false;
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    provider: string;
    source: AnalystRiskSource;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  scopeNote: string;
  status: AnalystPulseStatus;
  metrics: {
    riskSignalCount: AnalystMetric;
    riskBlockedPayments: AnalystMetric;
    riskBlockedRate: AnalystMetric;
    highRiskTransactions: AnalystMetric;
    highRiskTransactionRate: AnalystMetric;
    failedPayments: AnalystMetric;
    failedTransactions: AnalystMetric;
  };
  operations: {
    gatewayPaymentAttempts: number;
    transactionAttempts: number;
    lowRiskTransactions: number;
    mediumRiskTransactions: number;
    highRiskTransactions: number;
    failedPayments: number;
    failedTransactions: number;
  };
  trend: Array<{
    bucket: string;
    riskBlockedPayments: number;
    highRiskTransactions: number;
    failedPayments: number;
    failedTransactions: number;
    totalRiskSignals: number;
  }>;
  transactionRisk: Array<{ risk: string; count: number; percentage: number }>;
  transactionTypes: Array<{
    type: string;
    count: number;
    highRiskCount: number;
    failedCount: number;
    highRiskRate: number;
    failureRate: number;
  }>;
  providers: Array<{
    provider: string;
    attemptCount: number;
    failedCount: number;
    riskBlockedCount: number;
    riskBlockedRate: number;
    failureRate: number;
    status: AnalystPulseStatus;
  }>;
  sources: Array<{
    source: string;
    attemptCount: number;
    riskBlockedCount: number;
    riskBlockedRate: number;
  }>;
  paymentFailureReasons: Array<{ code: string; count: number; percentage: number }>;
  insights: AnalystRiskInsight[];
}

export interface AnalystRiskAnalyticsFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  provider?: string;
  source: AnalystRiskSource;
}

interface AnalystRiskAnalyticsResponse {
  success: boolean;
  data: AnalystRiskAnalyticsData;
  message?: string;
}

export async function getAnalystRiskAnalytics(
  filters: AnalystRiskAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystRiskAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
    source: filters.source,
  });

  const provider = filters.provider?.trim().toLowerCase();
  if (provider) params.set("provider", provider);

  const response = await apiClient<AnalystRiskAnalyticsResponse>(
    `/analyst/risk?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load risk analytics.");
  }

  return response.data;
}

/* =========================================================
   REFUND ANALYTICS
========================================================= */

export type AnalystRefundStatus = "all" | "pending" | "completed" | "failed" | "cancelled";

export interface AnalystRefundInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "volume" | "reliability" | "latency" | "merchant" | "provider" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystRefundAnalyticsData {
  generatedAt: string;
  source: {
    refunds: "mongodb_refund_collection";
    payments: "mongodb_payment_collection";
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    status: AnalystRefundStatus;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  metrics: {
    refundCount: AnalystMetric;
    completedRefundCount: AnalystMetric;
    completedRefundAmountMinor: AnalystMetric;
    completionRate: AnalystMetric;
    failureRate: AnalystMetric;
    refundRate: AnalystMetric;
    averageRefundMinor: AnalystMetric;
    averageCompletionSeconds: AnalystMetric;
  };
  operations: {
    pendingCount: number;
    failedCount: number;
    cancelledCount: number;
    settledCount: number;
    completedPaymentVolumeMinor: number;
  };
  trend: Array<{
    bucket: string;
    refundCount: number;
    completedCount: number;
    failedCount: number;
    pendingCount: number;
    cancelledCount: number;
    refundAmountMinor: number;
    completionRate: number;
  }>;
  statuses: Array<{ status: string; count: number; percentage: number; amountMinor: number }>;
  reasons: Array<{ reason: string; count: number; amountMinor: number; percentage: number }>;
  failureReasons: Array<{ code: string; count: number; percentage: number }>;
  providers: Array<{
    provider: string;
    count: number;
    completedCount: number;
    failedCount: number;
    amountMinor: number;
    completionRate: number;
  }>;
  sources: Array<{ source: string; count: number; amountMinor: number; percentage: number }>;
  merchants: Array<{
    merchantId: string;
    businessName: string;
    refundCount: number;
    completedRefundCount: number;
    refundAmountMinor: number;
    refundAmountShare: number;
  }>;
  insights: AnalystRefundInsight[];
}

export interface AnalystRefundAnalyticsFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  status: AnalystRefundStatus;
}

interface AnalystRefundAnalyticsResponse {
  success: boolean;
  data: AnalystRefundAnalyticsData;
  message?: string;
}

export async function getAnalystRefundAnalytics(
  filters: AnalystRefundAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystRefundAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
    status: filters.status,
  });

  const response = await apiClient<AnalystRefundAnalyticsResponse>(
    `/analyst/refunds?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load refund analytics.");
  }

  return response.data;
}

/* =========================================================
   DISPUTE ANALYTICS
========================================================= */

export type AnalystDisputeStatus = "all" | "disputed" | "under_review" | "won" | "lost";

export interface AnalystDisputeInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "exposure" | "outcome" | "aging" | "merchant" | "provider" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystDisputeAnalyticsData {
  generatedAt: string;
  source: {
    disputes: "mongodb_dispute_collection";
    payments: "mongodb_payment_collection";
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    status: AnalystDisputeStatus;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  metrics: {
    disputeCount: AnalystMetric;
    openDisputeCount: AnalystMetric;
    openExposureMinor: AnalystMetric;
    disputeExposureRate: AnalystMetric;
    wonCount: AnalystMetric;
    lostCount: AnalystMetric;
    lossRate: AnalystMetric;
    averageOpenAgeDays: AnalystMetric;
  };
  operations: {
    disputedCount: number;
    underReviewCount: number;
    wonCount: number;
    lostCount: number;
    completedPaymentVolumeMinor: number;
  };
  trend: Array<{
    bucket: string;
    disputeCount: number;
    openCount: number;
    wonCount: number;
    lostCount: number;
    exposureMinor: number;
  }>;
  statuses: Array<{ status: string; count: number; percentage: number; amountMinor: number }>;
  aging: Array<{
    key: "0_1d" | "1_3d" | "3_7d" | "7_14d" | "14d_plus";
    label: string;
    count: number;
    percentage: number;
    exposureMinor: number;
  }>;
  providers: Array<{
    provider: string;
    disputeCount: number;
    openCount: number;
    lostCount: number;
    exposureMinor: number;
    lossRate: number;
  }>;
  sources: Array<{
    source: string;
    disputeCount: number;
    openCount: number;
    exposureMinor: number;
    percentage: number;
  }>;
  merchants: Array<{
    merchantId: string;
    businessName: string;
    disputeCount: number;
    openCount: number;
    lostCount: number;
    exposureMinor: number;
    exposureShare: number;
  }>;
  insights: AnalystDisputeInsight[];
}

export interface AnalystDisputeAnalyticsFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  status: AnalystDisputeStatus;
}

interface AnalystDisputeAnalyticsResponse {
  success: boolean;
  data: AnalystDisputeAnalyticsData;
  message?: string;
}

export async function getAnalystDisputeAnalytics(
  filters: AnalystDisputeAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystDisputeAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
    status: filters.status,
  });

  const response = await apiClient<AnalystDisputeAnalyticsResponse>(
    `/analyst/disputes?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load dispute analytics.");
  }

  return response.data;
}

/* =========================================================
   SETTLEMENT ANALYTICS
========================================================= */

export type AnalystSettlementStatus = "all" | "pending" | "processing" | "settled" | "failed" | "cancelled";

export interface AnalystSettlementInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "volume" | "reliability" | "aging" | "merchant" | "payout" | "reconciliation" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystSettlementAnalyticsData {
  generatedAt: string;
  source: {
    settlements: "mongodb_settlement_collection";
    settlementItems: "mongodb_settlement_item_collection";
    payouts: "mongodb_payout_collection";
  };
  scopeNote: string;
  filters: {
    range: AnalystRange;
    currency: string;
    status: AnalystSettlementStatus;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  metrics: {
    settlementCount: AnalystMetric;
    settledCount: AnalystMetric;
    grossAmountMinor: AnalystMetric;
    feeAmountMinor: AnalystMetric;
    refundAmountMinor: AnalystMetric;
    netAmountMinor: AnalystMetric;
    settlementRate: AnalystMetric;
    averageSettlementSeconds: AnalystMetric;
  };
  operations: {
    pendingCount: number;
    processingCount: number;
    failedCount: number;
    cancelledCount: number;
    paymentCount: number;
    settlementItemCount: number;
    releasedItemCount: number;
    payoutLinkedCount: number;
    payoutLinkRate: number;
  };
  payoutReconciliation: {
    linkedSettlementCount: number;
    unlinkedSettlementCount: number;
    pendingPayoutCount: number;
    processingPayoutCount: number;
    completedPayoutCount: number;
    failedPayoutCount: number;
    cancelledPayoutCount: number;
    linkedSettlementNetMinor: number;
    payoutNetMinor: number;
    differenceMinor: number;
  };
  trend: Array<{
    bucket: string;
    settlementCount: number;
    settledCount: number;
    pendingCount: number;
    processingCount: number;
    failedCount: number;
    netAmountMinor: number;
  }>;
  statuses: Array<{ status: string; count: number; percentage: number; netAmountMinor: number }>;
  aging: Array<{
    key: "0_1d" | "1_3d" | "3_7d" | "7d_plus";
    label: string;
    count: number;
    percentage: number;
    netAmountMinor: number;
  }>;
  payoutMethods: Array<{ method: string; count: number; percentage: number; netAmountMinor: number }>;
  failureReasons: Array<{ reason: string; count: number; percentage: number }>;
  merchants: Array<{
    merchantId: string;
    businessName: string;
    settlementCount: number;
    settledCount: number;
    pendingCount: number;
    failedCount: number;
    grossAmountMinor: number;
    feeAmountMinor: number;
    refundAmountMinor: number;
    netAmountMinor: number;
    netShare: number;
    settlementRate: number;
  }>;
  insights: AnalystSettlementInsight[];
}

export interface AnalystSettlementAnalyticsFilters {
  range: AnalystRange;
  currency: string;
  status: AnalystSettlementStatus;
}

interface AnalystSettlementAnalyticsResponse {
  success: boolean;
  data: AnalystSettlementAnalyticsData;
  message?: string;
}

export async function getAnalystSettlementAnalytics(
  filters: AnalystSettlementAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystSettlementAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    currency: normalizeCurrency(filters.currency),
    status: filters.status,
  });

  const response = await apiClient<AnalystSettlementAnalyticsResponse>(
    `/analyst/settlement?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load settlement analytics.");
  }

  return response.data;
}

/* =========================================================
   PAYOUT ANALYTICS
========================================================= */

export type AnalystPayoutStatus = "all" | "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface AnalystPayoutInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "reliability" | "latency" | "ledger" | "merchant" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystPayoutAnalyticsData {
  generatedAt: string;
  source: {
    payouts: "mongodb_payout_collection";
    ledger: "mongodb_ledger_entry_collection";
  };
  scopeNote: string;
  filters: {
    range: AnalystRange;
    currency: string;
    status: AnalystPayoutStatus;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  metrics: {
    payoutCount: AnalystMetric;
    totalAmountMinor: AnalystMetric;
    completedNetAmountMinor: AnalystMetric;
    pendingAmountMinor: AnalystMetric;
    completionRate: AnalystMetric;
    failureRate: AnalystMetric;
    averageCompletionSeconds: AnalystMetric;
    ledgerCoverageRate: AnalystMetric;
  };
  operations: {
    pendingCount: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
    cancelledCount: number;
  };
  ledger: {
    completedPayoutCount: number;
    withLedgerGroupCount: number;
    missingLedgerGroupCount: number;
    balancedLedgerGroupCount: number;
    unbalancedLedgerGroupCount: number;
    coverageRate: number;
  };
  trend: Array<{
    bucket: string;
    payoutCount: number;
    completedCount: number;
    failedCount: number;
    pendingCount: number;
    processingCount: number;
    netAmountMinor: number;
  }>;
  statuses: Array<{ status: string; count: number; percentage: number; netAmountMinor: number }>;
  methods: Array<{
    method: string;
    count: number;
    percentage: number;
    netAmountMinor: number;
    completionRate: number;
  }>;
  failureReasons: Array<{ reason: string; count: number; percentage: number }>;
  merchants: Array<{
    merchantId: string;
    businessName: string;
    payoutCount: number;
    completedCount: number;
    failedCount: number;
    netAmountMinor: number;
    netShare: number;
    completionRate: number;
  }>;
  insights: AnalystPayoutInsight[];
}

export interface AnalystPayoutAnalyticsFilters {
  range: AnalystRange;
  currency: string;
  status: AnalystPayoutStatus;
}

export async function getAnalystPayoutAnalytics(
  filters: AnalystPayoutAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystPayoutAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    currency: normalizeCurrency(filters.currency),
    status: filters.status,
  });

  const response = await apiClient<{
    success: boolean;
    data: AnalystPayoutAnalyticsData;
    message?: string;
  }>(`/analyst/payouts?${params.toString()}`, { method: "GET", signal });

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load payout analytics.");
  }

  return response.data;
}

/* =========================================================
   COMPLIANCE ANALYTICS
========================================================= */

export interface AnalystComplianceInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "kyc" | "ai_review" | "security" | "audit" | "system" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystComplianceData {
  generatedAt: string;
  filters: {
    range: AnalystRange;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  population: {
    totalKycRecords: number;
    notStarted: number;
    pending: number;
    underReview: number;
    verified: number;
    rejected: number;
    verificationCoverage: number;
  };
  metrics: {
    submittedKycCount: AnalystMetric;
    verifiedKycCount: AnalystMetric;
    aiReviewCount: AnalystMetric;
    highRiskAiReviewCount: AnalystMetric;
    securityWarningCount: AnalystMetric;
    auditEventCount: AnalystMetric;
    criticalSettingsChangeCount: AnalystMetric;
    systemErrorCount: AnalystMetric;
  };
  trend: Array<{
    bucket: string;
    submittedKycCount: number;
    verifiedKycCount: number;
    highRiskAiReviewCount: number;
    securityWarningCount: number;
    systemErrorCount: number;
  }>;
  kycStatuses: Array<{ status: string; count: number; percentage: number }>;
  aiRiskLevels: Array<{ riskLevel: string; count: number; percentage: number }>;
  securityEvents: Array<{ eventType: string; count: number; percentage: number }>;
  auditActions: Array<{ action: string; count: number; percentage: number }>;
  systemServices: Array<{ service: string; errorCount: number; percentage: number }>;
  insights: AnalystComplianceInsight[];
}

export async function getAnalystCompliance(
  range: AnalystRange,
  signal?: AbortSignal
): Promise<AnalystComplianceData> {
  const response = await apiClient<{
    success: boolean;
    data: AnalystComplianceData;
    message?: string;
  }>(`/analyst/compliance?range=${encodeURIComponent(range)}`, { method: "GET", signal });

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load compliance analytics.");
  }

  return response.data;
}

/* =========================================================
   REPORTS
========================================================= */

export type AnalystReportFormat = "executive" | "payments" | "risk" | "revenue";
export type AnalystReportStatus = "processing" | "ready" | "failed";

export interface AnalystReportSummary {
  id: string;
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  format: AnalystReportFormat;
  status: AnalystReportStatus;
  errorMessage: string | null;
  completedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export async function createAnalystReport(input: {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  format: AnalystReportFormat;
}): Promise<AnalystReportSummary> {
  const response = await apiClient<{
    success: boolean;
    report: AnalystReportSummary;
    message?: string;
  }>("/analyst/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, currency: normalizeCurrency(input.currency) }),
  });

  if (!response.success || !response.report) {
    throw new Error(response.message || "Unable to create report.");
  }

  return response.report;
}

export async function getAnalystReports(status?: AnalystReportStatus): Promise<AnalystReportSummary[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiClient<{
    success: boolean;
    reports: AnalystReportSummary[];
    message?: string;
  }>(`/analyst/reports${suffix}`);

  return response.reports ?? [];
}

export async function downloadAnalystReportCsv(reportId: string): Promise<void> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  const response = await fetch(
    `${baseUrl}/analyst/reports/${encodeURIComponent(reportId)}/download`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = "Unable to download analyst report.";

    try {
      const data = (await response.json()) as { message?: string };
      message = data.message || message;
    } catch {
      // Ignore response parse errors and keep the default message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = match?.[1] || `analyst-report-${reportId}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/* =========================================================
   SAVED VIEWS
========================================================= */

export interface AnalystSavedView {
  id: string;
  name: string;
  route: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAnalystSavedViews(): Promise<AnalystSavedView[]> {
  const response = await apiClient<{
    success: boolean;
    views: AnalystSavedView[];
    message?: string;
  }>("/analyst/saved-views");

  return response.views ?? [];
}

export async function createAnalystSavedView(input: {
  name: string;
  route: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
}): Promise<AnalystSavedView> {
  const response = await apiClient<{
    success: boolean;
    view: AnalystSavedView;
    message?: string;
  }>("/analyst/saved-views", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.success || !response.view) {
    throw new Error(response.message || "Unable to create saved view.");
  }

  return response.view;
}

export async function updateAnalystSavedView(
  id: string,
  input: Partial<{
    name: string;
    route: string;
    filters: Record<string, unknown>;
    isDefault: boolean;
  }>
): Promise<AnalystSavedView> {
  const response = await apiClient<{
    success: boolean;
    view: AnalystSavedView;
    message?: string;
  }>(`/analyst/saved-views/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.success || !response.view) {
    throw new Error(response.message || "Unable to update saved view.");
  }

  return response.view;
}

export async function deleteAnalystSavedView(id: string): Promise<void> {
  await apiClient(`/analyst/saved-views/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* =========================================================
   USER ANALYTICS
========================================================= */

export interface AnalystUserMetric {
  value: number;
  previousValue: number;
  changePercent: number | null;
}

export interface AnalystUserTrendPoint {
  bucket: string;
  newUsers: number;
  activeUsers: number;
  transactionCount: number;
  failedTransactionCount: number;
  highRiskTransactionCount: number;
}

export interface AnalystUserKycBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface AnalystUserWalletBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface AnalystUserRiskBreakdown {
  risk: string;
  count: number;
  percentage: number;
}

export interface AnalystUserInsight {
  id: string;
  severity: AnalystInsightSeverity;
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystUserAnalyticsData {
  generatedAt: string;
  source: {
    users: string;
    wallets: string;
    transactions: string;
    sessions: string;
    budgets: string;
    cashFlowPlans: string;
  };
  scopeNote: string;
  privacyNote: string;
  status: AnalystPulseStatus;
  filters: {
    range: AnalystRange;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  population: {
    totalUsers: number;
    totalWallets: number;
    activeWallets: number;
    verifiedUsers: number;
    pendingKycUsers: number;
    rejectedKycUsers: number;
    notStartedKycUsers: number;
    walletCoverage: number;
    activeWalletCoverage: number;
    kycVerificationCoverage: number;
  };
  metrics: {
    newUsers: AnalystUserMetric;
    activeUsers: AnalystUserMetric;
    transactionUsers: AnalystUserMetric;
    highRiskUsers: AnalystUserMetric;
    transactionCount: AnalystUserMetric;
    failedTransactionCount: AnalystUserMetric;
    budgetUsers: AnalystUserMetric;
    cashFlowUsers: AnalystUserMetric;
  };
  engagement: {
    activeRate: number;
    transactionParticipationRate: number;
    budgetAdoptionRate: number;
    cashFlowAdoptionRate: number;
    failedTransactionRate: number;
  };
  trend: AnalystUserTrendPoint[];
  kycBreakdown: AnalystUserKycBreakdown[];
  walletBreakdown: AnalystUserWalletBreakdown[];
  riskBreakdown: AnalystUserRiskBreakdown[];
  insights: AnalystUserInsight[];
}

interface AnalystUserAnalyticsResponse {
  success: boolean;
  data: AnalystUserAnalyticsData;
  message?: string;
}

export async function getAnalystUserAnalytics(
  range: AnalystRange,
  signal?: AbortSignal
): Promise<AnalystUserAnalyticsData> {
  const response = await apiClient<AnalystUserAnalyticsResponse>(
    `/analyst/users?range=${encodeURIComponent(range)}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load user analytics.");
  }

  return response.data;
}

/* =========================================================
   PROVIDER ANALYTICS
========================================================= */

export type AnalystProviderHealth = AnalystPulseStatus;
export type AnalystProviderInsightSeverity = AnalystInsightSeverity;

export interface AnalystProviderInsight {
  id: string;
  severity: AnalystProviderInsightSeverity;
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystProviderSummaryItem {
  provider: string;
  successRate: number;
  attemptCount: number;
}

export interface AnalystProviderAnalyticsData {
  generatedAt: string;
  source: "mongodb_payment_collection";
  intelligenceEngine: {
    type: "deterministic_rules";
    paidProviderUsed: false;
    version: string;
  };
  filters: {
    range: AnalystRange;
    mode: AnalystMode;
    currency: string;
    provider: string;
    from: string;
    to: string;
    previousFrom: string;
    bucket: AnalystBucket;
  };
  scopeNote: string;
  status: AnalystProviderHealth;
  summary: {
    totalProviders: number;
    healthyProviders: number;
    attentionProviders: number;
    criticalProviders: number;
    totalAttempts: number;
    completedPayments: number;
    failedPayments: number;
    overallSuccessRate: number;
    completedVolumeMinor: number;
    feeRevenueMinor: number;
    averageCompletionSeconds: number;
    topProvider: AnalystProviderSummaryItem | null;
    weakestProvider: AnalystProviderSummaryItem | null;
  };
  selected: {
    provider: string;
    performance: AnalystPaymentProviderPerformance | null;
    metrics: AnalystPaymentAnalyticsData["metrics"];
    operations: AnalystPaymentAnalyticsData["operations"];
  };
  providerOptions: string[];
  providers: AnalystPaymentProviderPerformance[];
  trend: AnalystPaymentTrendPoint[];
  failureReasons: AnalystPaymentFailureReason[];
  latency: AnalystPaymentLatencyBreakdown[];
  sources: AnalystPaymentSourceBreakdown[];
  modes: AnalystPaymentModeBreakdown[];
  insights: AnalystProviderInsight[];
}

export interface AnalystProviderAnalyticsFilters {
  range: AnalystRange;
  mode: AnalystMode;
  currency: string;
  provider?: string;
}

interface AnalystProviderAnalyticsResponse {
  success: boolean;
  data: AnalystProviderAnalyticsData;
  message?: string;
}

export async function getAnalystProviderAnalytics(
  filters: AnalystProviderAnalyticsFilters,
  signal?: AbortSignal
): Promise<AnalystProviderAnalyticsData> {
  const params = new URLSearchParams({
    range: filters.range,
    mode: filters.mode,
    currency: normalizeCurrency(filters.currency),
  });

  const provider = filters.provider?.trim().toLowerCase();
  if (provider) params.set("provider", provider);

  const response = await apiClient<AnalystProviderAnalyticsResponse>(
    `/analyst/providers?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load provider analytics.");
  }

  return response.data;
}

/* =========================================================
   WALLET ANALYTICS
========================================================= */

export type AnalystWalletStatus = AnalystPulseStatus;

export interface AnalystWalletInsight {
  id: string;
  severity: AnalystInsightSeverity;
  category: "engagement" | "merchant_payment" | "p2p" | "wallet_status" | "retention" | "data_quality";
  title: string;
  description: string;
  evidence: string;
  recommendedReview: string;
}

export interface AnalystWalletAnalyticsData {
  generatedAt: string;
  source: {
    wallets: string;
    users: string;
    transactions: string;
    merchantPayments: string;
  };
  privacy: {
    transactionAmountsDecrypted: false;
    transactionReferencesExposed: false;
    walletBalancesAggregated: true;
    note: string;
  };
  scopeNote: string;
  status: AnalystWalletStatus;
  filters: {
    range: AnalystRange;
    currency: string;
    bucket: AnalystBucket;
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  population: {
    totalWallets: number;
    activeStatusWallets: number;
    frozenWallets: number;
    blockedWallets: number;
    lockedWallets: number;
    dormantWallets: number;
    activeStatusRate: number;
    dormantWalletRate: number;
  };
  liquidity: {
    totalBalanceMinor: number;
    totalPendingBalanceMinor: number;
    averageBalanceMinor: number;
  };
  metrics: {
    newWallets: AnalystMetric;
    engagedWallets: AnalystMetric;
    transactionWallets: AnalystMetric;
    merchantPayingWallets: AnalystMetric;
    p2pWallets: AnalystMetric;
    repeatEngagedWallets: AnalystMetric;
    walletActivityEvents: AnalystMetric;
    merchantPaymentCount: AnalystMetric;
    p2pTransferCount: AnalystMetric;
  };
  engagement: {
    walletEngagementRate: number;
    merchantPaymentAdoptionRate: number;
    p2pAdoptionRate: number;
    repeatActivityRate: number;
    transactionsPerEngagedWallet: number;
  };
  activity: {
    transactionCount: number;
    p2pTransferCount: number;
    fundingCount: number;
    withdrawalCount: number;
    merchantPaymentCount: number;
    walletActivityEvents: number;
  };
  funnel: Array<{ key: string; label: string; value: number; percentage: number }>;
  walletStatuses: Array<{ status: string; count: number; percentage: number }>;
  usageMix: Array<{ key: string; label: string; count: number; percentage: number }>;
  trend: Array<{
    bucket: string;
    newWallets: number;
    engagedWallets: number;
    transactionCount: number;
    p2pTransferCount: number;
    fundingCount: number;
    withdrawalCount: number;
    merchantPaymentCount: number;
  }>;
  insights: AnalystWalletInsight[];
}

interface AnalystWalletAnalyticsResponse {
  success: boolean;
  data: AnalystWalletAnalyticsData;
  message?: string;
}

export async function getAnalystWalletAnalytics(
  { range, currency }: { range: AnalystRange; currency: string },
  signal?: AbortSignal
): Promise<AnalystWalletAnalyticsData> {
  const params = new URLSearchParams({
    range,
    currency: normalizeCurrency(currency),
  });

  const response = await apiClient<AnalystWalletAnalyticsResponse>(
    `/analyst/wallets?${params.toString()}`,
    { method: "GET", signal }
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || "Unable to load wallet analytics.");
  }

  return response.data;
}
