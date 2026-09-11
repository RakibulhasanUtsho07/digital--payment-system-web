import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { apiClient } from "@/lib/api/client";

export interface PasskeySummary {
  _id: string;
  label: string;
  deviceType: "singleDevice" | "multiDevice";
  backedUp: boolean;
  transports: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface TransferAuthorizationPayload {
  recipient: string;
  amount: number;
  reference?: string;
  idempotencyKey: string;
}

export async function getPasskeys(): Promise<PasskeySummary[]> {
  const response = await apiClient<{ success: boolean; passkeys: PasskeySummary[] }>("/passkeys");
  return response.passkeys;
}

export async function registerDevicePasskey(label = "Windows Hello"): Promise<void> {
  const start = await apiClient<{
    success: boolean;
    flowId: string;
    options: PublicKeyCredentialCreationOptionsJSON;
  }>("/passkeys/registration/options", { method: "POST" });

  const credential: RegistrationResponseJSON = await startRegistration({
    optionsJSON: start.options,
  });

  await apiClient("/passkeys/registration/verify", {
    method: "POST",
    body: JSON.stringify({ flowId: start.flowId, label, response: credential }),
  });
}

export async function authorizeTransferWithPasskey(
  input: TransferAuthorizationPayload
): Promise<string> {
  const transferBody = {
    recipient: input.recipient.trim(),
    amount: input.amount,
    reference: input.reference?.trim() || undefined,
  };
  const start = await apiClient<{
    success: boolean;
    flowId: string;
    options: PublicKeyCredentialRequestOptionsJSON;
  }>("/passkeys/payment/options", {
    method: "POST",
    headers: { "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify(transferBody),
  });

  const credential: AuthenticationResponseJSON = await startAuthentication({
    optionsJSON: start.options,
  });
  const verified = await apiClient<{
    success: boolean;
    authorization: { token: string; expiresAt: string };
  }>("/passkeys/payment/verify", {
    method: "POST",
    body: JSON.stringify({ flowId: start.flowId, response: credential }),
  });

  return verified.authorization.token;
}
