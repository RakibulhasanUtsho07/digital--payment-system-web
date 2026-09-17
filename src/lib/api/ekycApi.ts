import { apiClient } from "@/lib/api/client";
import type {
  ActiveLivenessChallengeSession,
  AdminEKYCVerification,
  CompletedLivenessCapture,
  EKYCAuditItem,
  EKYCDocuments,
  EKYCOverview,
  EKYCStatus,
  EKYCVerification,
} from "@/types/ekyc";

interface CurrentResponse {
  success: boolean;
  verification: EKYCVerification | null;
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  verification: EKYCVerification;
}

export interface EKYCSubmissionInput {
  claimedName: string;
  dateOfBirth: string;
  nid: string;
  frontImage: File;
  backImage: File;
  selfieImage: File;
  liveness: CompletedLivenessCapture;
}

export async function createLivenessChallenge(): Promise<ActiveLivenessChallengeSession> {
  const response = await apiClient<{
    success: boolean;
    session: ActiveLivenessChallengeSession;
  }>("/ekyc/liveness/challenges", { method: "POST" });

  return response.session;
}

export async function getCurrentEKYC(): Promise<EKYCVerification | null> {
  const response = await apiClient<CurrentResponse>("/ekyc/verifications/current");
  return response.verification;
}

export async function submitEKYC(input: EKYCSubmissionInput): Promise<SubmissionResponse> {
  const body = new FormData();
  body.append("documentType", "nid");
  body.append("claimedName", input.claimedName.trim());
  body.append("dateOfBirth", input.dateOfBirth);
  body.append("nid", input.nid.replace(/[\s-]/g, ""));
  body.append("frontImage", input.frontImage);
  body.append("backImage", input.backImage);
  body.append("selfieImage", input.selfieImage);
  body.append("livenessEvidence", input.liveness.video);
  body.append("livenessSessionId", input.liveness.session.sessionId);
  body.append("livenessChallenges", JSON.stringify(input.liveness.session.challenges));
  body.append("livenessStartedAt", input.liveness.startedAt);
  body.append("livenessCompletedAt", input.liveness.completedAt);

  return apiClient<SubmissionResponse>("/ekyc/verifications", {
    method: "POST",
    body,
  });
}

interface AdminListResponse {
  success: boolean;
  verifications: AdminEKYCVerification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getAdminEKYCOverview(): Promise<EKYCOverview> {
  const response = await apiClient<{ success: boolean; overview: EKYCOverview }>(
    "/admin/ekyc/overview"
  );
  return response.overview;
}

export async function getAdminEKYCList(input: {
  status?: EKYCStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminListResponse> {
  const query = new URLSearchParams();
  if (input.status) query.set("status", input.status);
  if (input.search?.trim()) query.set("search", input.search.trim());
  query.set("page", String(input.page || 1));
  query.set("limit", String(input.limit || 20));
  return apiClient<AdminListResponse>(`/admin/ekyc/verifications?${query.toString()}`);
}

export async function getAdminEKYCDetails(id: string): Promise<{
  verification: AdminEKYCVerification;
  audit: EKYCAuditItem[];
}> {
  const response = await apiClient<{
    success: boolean;
    verification: AdminEKYCVerification;
    audit: EKYCAuditItem[];
  }>(`/admin/ekyc/verifications/${id}`);

  return {
    verification: response.verification,
    audit: response.audit,
  };
}

export async function getAdminEKYCDocuments(id: string): Promise<EKYCDocuments> {
  const response = await apiClient<{
    success: boolean;
    documents: EKYCDocuments;
  }>(`/admin/ekyc/verifications/${id}/documents`);

  return response.documents;
}

export async function decideAdminEKYC(
  id: string,
  decision: "VERIFIED" | "REJECTED",
  reason: string
): Promise<void> {
  await apiClient(`/admin/ekyc/verifications/${id}/decision`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reason: reason.trim() }),
  });
}

export async function rerunAdminEKYC(id: string): Promise<void> {
  await apiClient(`/admin/ekyc/verifications/${id}/rerun`, { method: "POST" });
}
