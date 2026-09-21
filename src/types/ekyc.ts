export type EKYCStatus =
  | "QUEUED"
  | "PROCESSING"
  | "VERIFIED"
  | "PENDING_MANUAL_REVIEW"
  | "REJECTED";

export interface EKYCVerification {
  id: string;
  status: EKYCStatus;
  reasonCodes: string[];
  submittedAt?: string;
  decidedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  canResubmit: boolean;
}

export interface AdminEKYCVerification extends EKYCVerification {
  user: {
    id: string;
    name: string;
    role: string;
    kycStatus: string;
  };

  providerName?: string;
  faceScore: number | null;
  faceQualityScore?: number | null;
  nameScore: number | null;
  livenessPassed: boolean | null;
  phoneVerifiedAt?: string;
  deviceBiometricVerified: boolean;
  possibleDuplicateVectorId?: string;
  possibleDuplicateScore: number | null;
  processingStartedAt?: string;
  hasReviewBiometricTemplate: boolean;

  identity?: {
    claimedName: string;
    nid: string;
    dateOfBirth: string;
    verifiedPhone: string;
  };
}

export type PhoneOtpChannel =
  | "sms"
  | "whatsapp";

export interface PhoneOtpChallenge {
  id?: string;
  challengeId: string;
  channel: PhoneOtpChannel;
  provider?: string;
  maskedPhone: string;
  expiresAt: string;
  resendAvailableAt?: string;
  resendAfterSeconds: number;
}

export interface PhoneOtpVerification {
  challengeId: string;
  verified: true;
  phone: string;
  maskedPhone: string;
  channel: PhoneOtpChannel;
  verifiedAt: string;
  validUntil: string;
}

export interface NIDDocumentValidation {
  validationId: string;
  expiresAt: string;
  frontSignals: number;
  backSignals: number;
}

export interface DeviceBiometricProof {
  sessionId: string;
  credentialId: string;
  deviceType: "singleDevice" | "multiDevice";
  backedUp: boolean;
  verifiedAt: string;
}

export interface EKYCOverview {
  queued: number;
  processing: number;
  manualReview: number;
  verified: number;
  rejected: number;
  submittedToday: number;
  total: number;
  averageDecisionMinutes: number | null;
}

export interface EKYCDocuments {
  nidFrontUrl: string;
  nidBackUrl: string;
  selfieUrl: string;
  livenessVideoUrl?: string;
}

export interface EKYCAuditItem {
  _id: string;
  sequence: number;
  eventType: string;
  actorType: "USER" | "SYSTEM" | "ADMIN";
  createdAt: string;
}

export type ActiveLivenessAction =
  | "BLINK"
  | "TURN_LEFT"
  | "TURN_RIGHT";

export interface ActiveLivenessChallengeSession {
  sessionId: string;
  challenges: ActiveLivenessAction[];
  issuedAt: string;
  expiresAt: string;
}

export interface CompletedLivenessCapture {
  session: ActiveLivenessChallengeSession;
  startedAt: string;
  completedAt: string;
  selfie: File;
  video: File;
}
