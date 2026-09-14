import {
  apiClient,
} from "./client";

/* =========================================================
   TYPES
========================================================= */

export type MerchantVerificationStatus =
  | "not_started"
  | "submitted"
  | "under_review"
  | "verified"
  | "rejected";

export type MerchantRegistrationType =
  | "trade_license"
  | "company_registration"
  | "partnership_deed"
  | "other";

export interface MerchantVerificationView {
  id: string;
  merchantId: string;
  ownerId: string;
  ownerEkycVerificationId: string;
  status:
    MerchantVerificationStatus;
  legalBusinessName: string;
  registrationType:
    MerchantRegistrationType;
  registrationNumberMasked: string;
  businessAddress: string;
  documents: Array<{
    kind: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }>;
  submissionVersion: number;
  submittedAt?: string;
  reviewStartedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantVerificationData {
  ownerIdentity: {
    verified: boolean;
  };

  merchant: {
    id: string;
    businessName: string;
    status: string;
    verificationStatus: string;
    testEnabled: boolean;
    liveEnabled: boolean;
  };

  verification:
    MerchantVerificationView | null;

  apiAccess: {
    test: boolean;
    live: boolean;
  };
}

export interface SubmitMerchantVerificationInput {
  legalBusinessName: string;
  registrationType:
    MerchantRegistrationType;
  registrationNumber: string;
  businessAddress: string;
  registrationDocument: File;
  taxDocument?: File;
  bankDocument?: File;
}

interface VerificationResponse {
  success: boolean;
  message?: string;
  data:
    MerchantVerificationData;
}

/* =========================================================
   GET STATUS
========================================================= */

export async function getMerchantVerification():
  Promise<MerchantVerificationData> {
  const response =
    await apiClient<VerificationResponse>(
      "/merchants/verification",
      {
        method: "GET",
        cache: "no-store",
      }
    );

  return response.data;
}

/* =========================================================
   SUBMIT BUSINESS DOCUMENTS
========================================================= */

export async function submitMerchantVerification(
  input:
    SubmitMerchantVerificationInput
): Promise<VerificationResponse> {
  const body =
    new FormData();

  body.set(
    "legalBusinessName",
    input.legalBusinessName
  );

  body.set(
    "registrationType",
    input.registrationType
  );

  body.set(
    "registrationNumber",
    input.registrationNumber
  );

  body.set(
    "businessAddress",
    input.businessAddress
  );

  body.set(
    "registrationDocument",
    input.registrationDocument
  );

  if (input.taxDocument) {
    body.set(
      "taxDocument",
      input.taxDocument
    );
  }

  if (input.bankDocument) {
    body.set(
      "bankDocument",
      input.bankDocument
    );
  }

  return apiClient<VerificationResponse>(
    "/merchants/verification/submit",
    {
      method: "POST",
      body,
    }
  );
}

