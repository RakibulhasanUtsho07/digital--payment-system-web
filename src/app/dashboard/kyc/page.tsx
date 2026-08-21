"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { apiClient } from "@/lib/api/client";
import { getToken } from "@/lib/auth/auth";

type KYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

interface KYCResponse {
  success: boolean;
  userKycStatus: KYCStatus;
  kyc: {
    status: KYCStatus;
    documentType?: string;
    documentNumber?: string;
  };
}

export default function KYCPage() {
  const [status, setStatus] =
    useState<KYCStatus>("not_started");

  const [documentType, setDocumentType] =
    useState("nid");

  const [documentNumber, setDocumentNumber] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const loadKYC = async () => {
      try {
        const token = getToken();

        if (!token) return;

        const data =
          await apiClient<KYCResponse>(
            "/kyc/status",
            {
              token,
            }
          );

        setStatus(
          data.userKycStatus
        );
      } catch (error) {
        console.error(error);
      }
    };

    loadKYC();
  }, []);

  const startVerification = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = getToken();

      if (!token) {
        setMessage(
          "Please login first."
        );
        return;
      }

      const data =
        await apiClient<KYCResponse>(
          "/kyc/start",
          {
            method: "POST",
            token,
            body: JSON.stringify({
              documentType,
              documentNumber,
            }),
          }
        );

      setStatus(
        data.userKycStatus
      );

      setMessage(
        "KYC information saved successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "KYC submission failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              KYC Verification
            </h1>

            <p className="text-sm text-slate-500">
              Verify your identity to unlock
              secure wallet features.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Status: {status}
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Document Type
            </label>

            <select
              value={documentType}
              onChange={(e) =>
                setDocumentType(
                  e.target.value
                )
              }
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
            >
              <option value="nid">
                National ID
              </option>

              <option value="passport">
                Passport
              </option>

              <option value="driving_license">
                Driving License
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Document Number
            </label>

            <input
              value={documentNumber}
              onChange={(e) =>
                setDocumentNumber(
                  e.target.value
                )
              }
              placeholder="Enter document number"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={startVerification}
            disabled={
              loading ||
              status === "verified"
            }
            className="h-12 w-full rounded-xl bg-[#1F5EA8] font-semibold text-white hover:bg-[#184880] disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Continue Verification"}
          </button>
        </div>
      </div>
    </main>
  );
}