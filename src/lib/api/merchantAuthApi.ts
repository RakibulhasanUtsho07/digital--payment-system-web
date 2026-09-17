import {
  apiClient,
} from "./client";

/* =========================================================
   AUTH TYPES
========================================================= */

export type PlatformRole =
  | "user"
  | "merchant"
  | "support"
  | "analyst"
  | "admin"
  | "super_admin";

export type KYCStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "rejected";

export interface MerchantAuthUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: PlatformRole;
  kycStatus: KYCStatus;
  avatarUrl?: string;
  emailVerified?: boolean;
}

export interface MerchantRecord {
  _id: string;
  businessName: string;
  businessDisplayName?: string | null;
  businessType:
    | "individual"
    | "sole_proprietorship"
    | "partnership"
    | "company"
    | "organization";
  slug: string;
  businessEmail: string;
  businessPhone?: string | null;
  websiteUrl?: string | null;
  country: string;
  countryCode: string;
  defaultCurrency: string;
  status:
    | "pending"
    | "active"
    | "suspended"
    | "disabled";
  verificationStatus:
    | "not_started"
    | "pending"
    | "verified"
    | "rejected";
  testEnabled: boolean;
  liveEnabled: boolean;
}

/* =========================================================
   RESPONSE TYPES
========================================================= */

export interface MerchantLoginSuccess {
  success: true;
  message: string;
  requiresTwoFactor?: false;
  user: MerchantAuthUser;
}

export interface MerchantLoginChallenge {
  success: true;
  message: string;
  requiresTwoFactor: true;
  challengeId: string;
  method:
    | "email"
    | "sms"
    | "app";
  target?: string;
  expiresInSeconds: number;
}

export type MerchantLoginResult =
  | MerchantLoginSuccess
  | MerchantLoginChallenge;

export interface MerchantRegistrationResult {
  success: boolean;
  message: string;
  requiresEmailVerification: boolean;
  email: string;
}

export interface MerchantOtpResult {
  success: boolean;
  message: string;
  user: MerchantAuthUser;
}

export interface MerchantOnboardingStatus {
  user: MerchantAuthUser;
  hasMerchant: boolean;
  nextStep:
    | "create_merchant"
    | "verification"
    | "dashboard"
    | "blocked";
  merchant: MerchantRecord | null;
}

export interface CompleteMerchantInput {
  businessName: string;
  businessDisplayName?: string;
  businessType:
    | "individual"
    | "sole_proprietorship"
    | "partnership"
    | "company"
    | "organization";
  slug: string;
  businessEmail: string;
  businessPhone?: string;
  websiteUrl?: string;
  description?: string;
  country: string;
  countryCode: string;
  defaultCurrency: string;
}

interface SimpleResponse {
  success: boolean;
  message: string;
}

interface OnboardingStatusResponse
  extends MerchantOnboardingStatus {
  success: boolean;
}

interface CompleteMerchantResponse {
  success: boolean;
  duplicate: boolean;
  message: string;
  user: MerchantAuthUser;
  merchant: MerchantRecord;
}

/* =========================================================
   LOCAL AUTH CACHE

   The HttpOnly cookie remains the authentication source.
   This cache is used only for immediate UI rendering.
========================================================= */

export function rememberMerchantUser(
  user: MerchantAuthUser,
): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  let previous:
    | Partial<MerchantAuthUser>
    | undefined;

  try {
    const stored =
      localStorage.getItem(
        "auth_user",
      );

    previous =
      stored
        ? JSON.parse(
            stored,
          ) as Partial<MerchantAuthUser>
        : undefined;
  } catch {
    previous =
      undefined;
  }

  localStorage.setItem(
    "auth_user",
    JSON.stringify({
      ...previous,
      ...user,
    }),
  );

  localStorage.setItem(
    "is_authenticated",
    "true",
  );
}

/* =========================================================
   LOGIN
========================================================= */

export async function signInMerchant(
  email: string,
  password: string,
): Promise<MerchantLoginResult> {
  return apiClient<MerchantLoginResult>(
    "/auth/login",
    {
      method: "POST",
      body:
        JSON.stringify({
          email:
            email
              .trim()
              .toLowerCase(),
          password,
        }),
    },
  );
}

export async function verifyMerchantLoginTwoFactor(
  challengeId: string,
  code: string,
): Promise<MerchantLoginSuccess> {
  return apiClient<MerchantLoginSuccess>(
    "/auth/verify-2fa",
    {
      method: "POST",
      body:
        JSON.stringify({
          challengeId,
          code:
            code.trim(),
        }),
    },
  );
}

/* =========================================================
   REGISTRATION + EMAIL VERIFICATION
========================================================= */

export async function registerMerchantOwner(
  input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    profileImage: File;
  },
): Promise<MerchantRegistrationResult> {
  const formData =
    new FormData();

  formData.append(
    "name",
    input.name.trim(),
  );

  formData.append(
    "email",
    input.email
      .trim()
      .toLowerCase(),
  );

  formData.append(
    "phone",
    input.phone.trim(),
  );

  formData.append(
    "password",
    input.password,
  );

  formData.append(
    "profileImage",
    input.profileImage,
  );

  return apiClient<MerchantRegistrationResult>(
    "/auth/register",
    {
      method: "POST",
      body:
        formData,
    },
  );
}

export async function verifyMerchantEmailOtp(
  email: string,
  otp: string,
): Promise<MerchantOtpResult> {
  return apiClient<MerchantOtpResult>(
    "/auth/verify-otp",
    {
      method: "POST",
      body:
        JSON.stringify({
          email:
            email
              .trim()
              .toLowerCase(),
          otp:
            otp.replace(
              /\D/g,
              "",
            ),
        }),
    },
  );
}

export async function resendMerchantEmailOtp(
  email: string,
): Promise<SimpleResponse> {
  return apiClient<SimpleResponse>(
    "/auth/resend-otp",
    {
      method: "POST",
      body:
        JSON.stringify({
          email:
            email
              .trim()
              .toLowerCase(),
        }),
    },
  );
}

/* =========================================================
   MERCHANT ONBOARDING
========================================================= */

export async function getMerchantOnboardingStatus(): Promise<MerchantOnboardingStatus> {
  const response =
    await apiClient<OnboardingStatusResponse>(
      "/merchants/onboarding-status",
      {
        method: "GET",
      },
    );

  return {
    user:
      response.user,
    hasMerchant:
      response.hasMerchant,
    nextStep:
      response.nextStep,
    merchant:
      response.merchant,
  };
}

export async function completeMerchantOnboarding(
  input: CompleteMerchantInput,
): Promise<CompleteMerchantResponse> {
  return apiClient<CompleteMerchantResponse>(
    "/merchants",
    {
      method: "POST",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}
