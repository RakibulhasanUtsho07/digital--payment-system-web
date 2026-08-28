"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { apiClient } from "@/lib/api/client";

import KYCHeader from "./components/KYCHeader";
import KYCStats, {
  KYCStatsData,
} from "./components/KYCStats";
import KYCFilters, {
  DEFAULT_KYC_FILTERS,
  KYCFiltersState,
} from "./components/KYCFilters";
import KYCQueue from "./components/KYCQueue";
import KYCReviewDrawer, {
  type DecisionAction,
} from "./components/KYCReviewDrawer";
import KYCAnalytics from "./components/KYCAnalytics";

import type {
  DocumentType,
  KYCRequest,
  KYCStatus,
  RiskLevel,
} from "./components/KYCManagementTypes";

/* =========================================================
   BACKEND TYPES
========================================================= */

type ApiKYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

type ApiDocumentType =
  | "nid"
  | "passport"
  | "driving_license";

interface AdminKYCUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  kycStatus?: string;
}

interface AdminKYCRecord {
  _id: string;

  userId:
    | string
    | AdminKYCUser;

  documentType?:
    ApiDocumentType;

  documentNumber?:
    string;

  provider?:
    | "manual"
    | "stripe"
    | "other";

  status:
    ApiKYCStatus;

  rejectionReason?:
    string;

  submittedAt?:
    string;

  verifiedAt?:
    string;

  createdAt?:
    string;

  updatedAt?:
    string;

  hasFrontImage?:
    boolean;

  hasBackImage?:
    boolean;

  hasSelfieImage?:
    boolean;

  /*
   * Optional future-compatible fields.
   * The current backend may not return these yet.
   */
  riskLevel?:
    string;

  riskScore?:
    number;

  slaMinutes?:
    number;
}

interface PendingKYCResponse {
  success: boolean;
  count?: number;
  kycs?: AdminKYCRecord[];
  message?: string;
}

interface ReviewKYCResponse {
  success: boolean;
  message?: string;
  kyc?: Partial<AdminKYCRecord>;
}

/* =========================================================
   MAPPERS
========================================================= */

const mapDocumentType = (
  value?: ApiDocumentType
): DocumentType => {
  switch (value) {
    case "passport":
      return "Passport";

    case "driving_license":
      return "Driving License";

    default:
      return "NID";
  }
};

const mapKYCStatus = (
  value: ApiKYCStatus
): KYCStatus => {
  switch (value) {
    case "verified":
      return "Verified";

    case "rejected":
      return "Rejected";

    case "under_review":
      return "Under Review";

    case "pending":
      return "Pending";

    default:
      return "Not Started";
  }
};

const mapRiskLevel = (
  value?: string
): RiskLevel => {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    normalized === "critical"
  ) {
    return "Critical";
  }

  if (
    normalized === "high"
  ) {
    return "High";
  }

  if (
    normalized === "medium"
  ) {
    return "Medium";
  }

  /*
   * Current KYC backend does not persist a risk level yet.
   * Keep a neutral UI fallback until a real risk field exists.
   */
  return "Low";
};

const getUser = (
  value: AdminKYCRecord["userId"]
): AdminKYCUser => {
  if (
    value &&
    typeof value === "object"
  ) {
    return value;
  }

  return {
    _id:
      typeof value === "string"
        ? value
        : undefined,
  };
};

const getAccountAgeDays = (
  createdAt?: string
): number => {
  if (!createdAt) {
    return 0;
  }

  const created =
    Date.parse(createdAt);

  if (
    !Number.isFinite(created)
  ) {
    return 0;
  }

  const diff =
    Date.now() -
    created;

  return Math.max(
    0,
    Math.floor(
      diff /
        (24 *
          60 *
          60 *
          1000)
    )
  );
};

const getSlaMinutes = (
  kyc: AdminKYCRecord
): number => {
  if (
    typeof kyc.slaMinutes ===
      "number" &&
    Number.isFinite(
      kyc.slaMinutes
    )
  ) {
    return Math.max(
      0,
      Math.round(
        kyc.slaMinutes
      )
    );
  }

  /*
   * UI-only fallback because the current API does not
   * provide an SLA field. This assumes a 24-hour review window.
   */
  const source =
    kyc.submittedAt ||
    kyc.createdAt;

  if (!source) {
    return 24 * 60;
  }

  const submitted =
    Date.parse(source);

  if (
    !Number.isFinite(submitted)
  ) {
    return 24 * 60;
  }

  const elapsedMinutes =
    Math.floor(
      (Date.now() -
        submitted) /
        (60 * 1000)
    );

  return Math.max(
    0,
    24 * 60 -
      elapsedMinutes
  );
};

const normalizeRiskScore = (
  value?: number
): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value)
    )
  );
};

const toKYCRequest = (
  kyc: AdminKYCRecord
): KYCRequest => {
  const user =
    getUser(
      kyc.userId
    );

  const id =
    String(
      kyc._id
    );

  const status =
    mapKYCStatus(
      kyc.status
    );

  const submittedAt =
    kyc.submittedAt ||
    kyc.createdAt ||
    new Date().toISOString();

  const riskScore =
    normalizeRiskScore(
      kyc.riskScore
    );

  const riskLevel =
    mapRiskLevel(
      kyc.riskLevel
    );

  const verificationChecks:
    KYCRequest["verificationChecks"] = [
      {
        label:
          "Document front uploaded",
        status:
          kyc.hasFrontImage
            ? "Pass"
            : "Review",
      },
      {
        label:
          "Document back uploaded",
        status:
          kyc.hasBackImage
            ? "Pass"
            : "Review",
        reason:
          kyc.hasBackImage
            ? undefined
            : "Back image may be optional depending on document type.",
      },
      {
        label:
          "Selfie uploaded",
        status:
          kyc.hasSelfieImage
            ? "Pass"
            : "Review",
      },
    ];

  return {
    id,

    caseId:
      `KYC-${id
        .slice(-8)
        .toUpperCase()}`,

    applicantId:
      user._id || "",

    applicantName:
      user.name ||
      "Unknown User",

    email:
      user.email || "",

    phone:
      user.phone || "",

    documentType:
      mapDocumentType(
        kyc.documentType
      ),

    documentNumber:
      kyc.documentNumber ||
      "Not available",

    status,

    verificationResult:
      status === "Verified"
        ? "Passed"
        : status === "Rejected"
          ? "Failed"
          : "Needs Review",

    riskLevel,

    riskScore,

    submittedAt,

    createdAt:
      kyc.createdAt ||
      submittedAt,

    lastReviewedAt:
      kyc.updatedAt,

    reviewer:
      "Unassigned",

    slaMinutes:
      getSlaMinutes(
        kyc
      ),

    reason:
      kyc.rejectionReason ||
      (status ===
      "Under Review"
        ? "The applicant submitted the required KYC information and is awaiting administrative review."
        : "The KYC application is waiting in the review queue."),

    provider:
      kyc.provider ===
        "other"
        ? "other"
        : "manual",

    city:
      "",

    country:
      "",

    walletId:
      "",

    transactionCount:
      0,

    accountAgeDays:
      getAccountAgeDays(
        kyc.createdAt
      ),

    twoFactorEnabled:
      false,

    failedLoginCount:
      0,

    rejectionReason:
      kyc.rejectionReason,

    verificationChecks,

    notes: [],
  };
};

/* =========================================================
   PAGE
========================================================= */

export default function KYCRequestsPage() {
  const [mounted, setMounted] =
    useState(false);

  const [requests, setRequests] =
    useState<KYCRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [reviewingId, setReviewingId] =
    useState<string | null>(
      null
    );

  const [errorMessage, setErrorMessage] =
    useState("");

  const [toast, setToast] =
    useState<string | null>(
      null
    );

  const [search, setSearch] =
    useState("");

  const [filters, setFilters] =
    useState<KYCFiltersState>(
      DEFAULT_KYC_FILTERS
    );

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(
      new Set()
    );

  const [selectedRequest, setSelectedRequest] =
    useState<KYCRequest | null>(
      null
    );

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(25);

  const [sortField, setSortField] =
    useState<
      | "submittedAt"
      | "riskScore"
      | "applicantName"
    >("submittedAt");

  const [sortDirection, setSortDirection] =
    useState<
      "asc" | "desc"
    >("desc");

  /* =======================================================
     LOAD REAL KYC QUEUE
  ======================================================== */

  const loadRequests =
    useCallback(
      async (
        fullLoader = true
      ) => {
        try {
          if (fullLoader) {
            setLoading(
              true
            );
          } else {
            setRefreshing(
              true
            );
          }

          setErrorMessage(
            ""
          );

          const response =
            await apiClient<PendingKYCResponse>(
              "/admin/kyc/pending"
            );

          if (
            !response ||
            response.success !==
              true
          ) {
            throw new Error(
              response?.message ||
                "Failed to load KYC requests."
            );
          }

          const normalized =
            Array.isArray(
              response.kycs
            )
              ? response.kycs.map(
                  toKYCRequest
                )
              : [];

          setRequests(
            normalized
          );

          setSelectedIds(
            new Set()
          );

          setSelectedRequest(
            (current) => {
              if (!current) {
                return null;
              }

              return (
                normalized.find(
                  (item) =>
                    item.id ===
                    current.id
                ) || null
              );
            }
          );
        } catch (error) {
          console.error(
            "Admin KYC loading error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load KYC requests."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    setMounted(
      true
    );

    void loadRequests(
      true
    );
  }, [loadRequests]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setToast(
            null
          );
        },
        3000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);

  /* =======================================================
     FILTER + SORT
  ======================================================== */

  const filteredRequests =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const filtered =
        requests.filter(
          (request) => {
            const matchesSearch =
              !query ||
              request.applicantName
                .toLowerCase()
                .includes(query) ||
              request.email
                .toLowerCase()
                .includes(query) ||
              request.phone
                .toLowerCase()
                .includes(query) ||
              request.caseId
                .toLowerCase()
                .includes(query) ||
              request.documentNumber
                .toLowerCase()
                .includes(query);

            const matchesStatus =
              filters.status ===
                "All" ||
              request.status ===
                filters.status;

            const matchesDocument =
              filters.documentType ===
                "All" ||
              request.documentType ===
                filters.documentType;

            const matchesRisk =
              filters.risk ===
                "All" ||
              request.riskLevel ===
                filters.risk;

            const matchesVerification =
              filters.verification ===
                "All" ||
              request.verificationResult ===
                filters.verification;

            const matchesReviewer =
              filters.reviewer ===
                "All" ||
              (filters.reviewer ===
              "Me"
                ? request.reviewer !==
                  "Unassigned"
                : filters.reviewer ===
                    "Unassigned"
                  ? request.reviewer ===
                    "Unassigned"
                  : true);

            const matchesSla =
              filters.sla ===
                "All" ||
              (filters.sla ===
              "Normal"
                ? request.slaMinutes >
                  15
                : filters.sla ===
                    "Due Soon"
                  ? request.slaMinutes >
                      0 &&
                    request.slaMinutes <=
                      15
                  : request.slaMinutes <=
                    0);

            return (
              matchesSearch &&
              matchesStatus &&
              matchesDocument &&
              matchesRisk &&
              matchesVerification &&
              matchesReviewer &&
              matchesSla
            );
          }
        );

      filtered.sort(
        (a, b) => {
          const direction =
            sortDirection ===
            "asc"
              ? 1
              : -1;

          if (
            sortField ===
            "applicantName"
          ) {
            return (
              a.applicantName.localeCompare(
                b.applicantName
              ) * direction
            );
          }

          if (
            sortField ===
            "riskScore"
          ) {
            return (
              (a.riskScore -
                b.riskScore) *
              direction
            );
          }

          return (
            (Date.parse(
              a.submittedAt
            ) -
              Date.parse(
                b.submittedAt
              )) *
            direction
          );
        }
      );

      return filtered;
    }, [
      requests,
      search,
      filters,
      sortField,
      sortDirection,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRequests.length /
          pageSize
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const paginatedRequests =
    filteredRequests.slice(
      (safePage - 1) *
        pageSize,
      safePage *
        pageSize
    );

  /* =======================================================
     STATS
  ======================================================== */

  const stats: KYCStatsData =
    useMemo(
      () => ({
        pending:
          requests.filter(
            (request) =>
              request.status ===
              "Pending"
          ).length,

        underReview:
          requests.filter(
            (request) =>
              request.status ===
              "Under Review"
          ).length,

        /*
         * This endpoint intentionally returns the active queue.
         * Completed cases are therefore zero in this view.
         */
        approvedToday:
          requests.filter(
            (request) =>
              request.status ===
              "Verified"
          ).length,

        rejectedToday:
          requests.filter(
            (request) =>
              request.status ===
              "Rejected"
          ).length,

        highRisk:
          requests.filter(
            (request) =>
              request.riskLevel ===
                "High" ||
              request.riskLevel ===
                "Critical"
          ).length,

        averageReviewMinutes:
          requests.length > 0
            ? Number(
                (
                  requests.reduce(
                    (
                      total,
                      request
                    ) =>
                      total +
                      request.slaMinutes,
                    0
                  ) /
                  requests.length
                ).toFixed(1)
              )
            : 0,
      }),
      [requests]
    );

  const healthCounts =
    useMemo(
      () => ({
        verified:
          requests.filter(
            (item) =>
              item.status ===
              "Verified"
          ).length,

        pending:
          requests.filter(
            (item) =>
              item.status ===
              "Pending"
          ).length,

        underReview:
          requests.filter(
            (item) =>
              item.status ===
              "Under Review"
          ).length,

        rejected:
          requests.filter(
            (item) =>
              item.status ===
              "Rejected"
          ).length,
      }),
      [requests]
    );

  /* =======================================================
     SELECTION
  ======================================================== */

  const toggleSelection = (
    id: string
  ) => {
    setSelectedIds(
      (current) => {
        const next =
          new Set(
            current
          );

        if (
          next.has(id)
        ) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      }
    );
  };

  const toggleAll = (
    checked: boolean
  ) => {
    if (!checked) {
      setSelectedIds(
        new Set()
      );

      return;
    }

    setSelectedIds(
      new Set(
        paginatedRequests.map(
          (request) =>
            request.id
        )
      )
    );
  };

  /* =======================================================
     SINGLE KYC REVIEW
  ======================================================== */

  const submitDecision =
    useCallback(
      async (
        action: DecisionAction,
        reason: string,
        kycId: string
      ) => {
        if (
          action !== "approve" &&
          action !== "reject"
        ) {
          setToast(
            action ===
              "information"
              ? "Request Information needs a backend workflow before it can be enabled."
              : "Escalation needs a backend workflow before it can be enabled."
          );

          return;
        }

        try {
          setReviewingId(
            kycId
          );

          setErrorMessage(
            ""
          );

          const status =
            action ===
            "approve"
              ? "verified"
              : "rejected";

          const body: {
            status:
              | "verified"
              | "rejected";
            rejectionReason?:
              string;
          } = {
            status,
          };

          if (
            status ===
            "rejected"
          ) {
            body.rejectionReason =
              reason.trim();
          }

          const response =
            await apiClient<ReviewKYCResponse>(
              `/admin/kyc/${kycId}/review`,
              {
                method:
                  "PATCH",

                body:
                  JSON.stringify(
                    body
                  ),
              }
            );

          if (
            !response ||
            response.success !==
              true
          ) {
            throw new Error(
              response?.message ||
                "Failed to review KYC request."
            );
          }

          setToast(
            response.message ||
              (status ===
              "verified"
                ? "KYC request verified successfully."
                : "KYC request rejected successfully.")
          );

          setSelectedRequest(
            null
          );

          await loadRequests(
            false
          );
        } catch (error) {
          console.error(
            "Admin KYC review error:",
            error
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to review KYC request."
          );
        } finally {
          setReviewingId(
            null
          );
        }
      },
      [loadRequests]
    );

  /* =======================================================
     BULK ACTIONS
  ======================================================== */

  const showBulkUnavailable =
    () => {
      setToast(
        "Single-case KYC review is connected. Bulk review needs a batch backend endpoint."
      );
  };

  /* =======================================================
     EXPORT CURRENT REAL QUEUE
  ======================================================== */

  const exportQueue =
    () => {
      if (
        filteredRequests.length ===
        0
      ) {
        setToast(
          "There are no KYC requests to export."
        );

        return;
      }

      const header = [
        "Case ID",
        "Applicant",
        "Email",
        "Phone",
        "Document Type",
        "Document Number",
        "Status",
        "Submitted At",
      ];

      const rows =
        filteredRequests.map(
          (request) => [
            request.caseId,
            request.applicantName,
            request.email,
            request.phone,
            request.documentType,
            request.documentNumber,
            request.status,
            request.submittedAt,
          ]
        );

      const csv = [
        header,
        ...rows,
      ]
        .map((row) =>
          row
            .map((value) =>
              `"${String(
                value ?? ""
              ).replace(
                /"/g,
                '""'
              )}"`
            )
            .join(",")
        )
        .join("\n");

      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        url;

      anchor.download =
        `kyc-queue-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

      document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(
        url
      );

      setToast(
        "KYC queue exported successfully."
      );
    };

  const sortBy = (
    field:
      | "submittedAt"
      | "riskScore"
      | "applicantName"
  ) => {
    setSortDirection(
      (current) =>
        sortField ===
          field &&
        current ===
          "asc"
          ? "desc"
          : "asc"
    );

    setSortField(
      field
    );

    setPage(
      1
    );
  };

  /* =======================================================
     INITIAL RENDER
  ======================================================== */

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#F6F8FB]" />
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FB] p-6">
        <div className="mx-auto flex min-h-[55vh] w-full max-w-[1680px] items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
            <p className="mt-3 text-sm font-black text-slate-900">
              Loading KYC requests
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Fetching the secure admin review queue...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-20">
      <div className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-4 sm:px-6 lg:px-8">
        <KYCHeader
          refreshing={
            refreshing
          }
          onRefresh={() =>
            void loadRequests(
              false
            )
          }
          onExport={
            exportQueue
          }
        />

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-black">
                KYC request failed
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-700">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        <KYCStats
          stats={stats}
        />

        <KYCAnalytics
          counts={
            healthCounts
          }
          onFilterStatus={(
            status
          ) =>
            setFilters(
              (current) => ({
                ...current,
                status,
              })
            )
          }
        />

        <PriorityReviews
          requests={
            requests
              .filter(
                (request) =>
                  request.riskLevel ===
                    "High" ||
                  request.riskLevel ===
                    "Critical" ||
                  request.verificationResult ===
                    "Failed"
              )
              .slice(
                0,
                3
              )
          }
          onOpen={
            setSelectedRequest
          }
        />

        <KYCFilters
          search={search}
          setSearch={(
            value
          ) => {
            setSearch(
              value
            );

            setPage(
              1
            );
          }}
          filters={filters}
          setFilters={(
            value
          ) => {
            setFilters(
              value
            );

            setPage(
              1
            );
          }}
          total={
            filteredRequests.length
          }
        />

        <KYCQueue
          requests={
            paginatedRequests
          }
          selectedIds={
            selectedIds
          }
          page={
            safePage
          }
          pageSize={
            pageSize
          }
          total={
            filteredRequests.length
          }
          totalPages={
            totalPages
          }
          onToggle={
            toggleSelection
          }
          onToggleAll={
            toggleAll
          }
          onOpen={
            setSelectedRequest
          }
          sortField={
            sortField
          }
          sortDirection={
            sortDirection
          }
          onSort={
            sortBy
          }
          onPageChange={
            setPage
          }
          onPageSizeChange={(
            size
          ) => {
            setPageSize(
              size
            );

            setPage(
              1
            );
          }}
        />
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={
            selectedIds.size
          }
          onClear={() =>
            setSelectedIds(
              new Set()
            )
          }
          onReview={
            showBulkUnavailable
          }
          onInfo={
            showBulkUnavailable
          }
          onExport={
            exportQueue
          }
        />
      )}

      <KYCReviewDrawer
        open={
          selectedRequest !==
          null
        }
        applicant={
          selectedRequest
            ? {
                id:
                  selectedRequest.id,

                applicantName:
                  selectedRequest.applicantName,

                email:
                  selectedRequest.email,

                phone:
                  selectedRequest.phone,

                dob:
                  "Not provided",

                nidNumber:
                  selectedRequest.documentNumber,

                address:
                  [
                    selectedRequest.city,
                    selectedRequest.country,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(", ") ||
                  "Not provided",

                submissionDate:
                  selectedRequest.submittedAt,

                status:
                  selectedRequest.status ===
                  "Verified"
                    ? "approved"
                    : selectedRequest.status ===
                        "Rejected"
                      ? "rejected"
                      : "pending",

                riskScore:
                  selectedRequest.riskLevel ===
                    "Critical" ||
                  selectedRequest.riskLevel ===
                    "High"
                    ? "High"
                    : selectedRequest.riskLevel ===
                        "Medium"
                      ? "Medium"
                      : "Low",

                matchScore:
                  selectedRequest.riskScore,

                /*
                 * Private Cloudinary files are deliberately not
                 * exposed by /admin/kyc/pending. A dedicated
                 * admin-only signed-URL endpoint is needed before
                 * these three URLs can be populated safely.
                 */
                documents: {},

                checks: {
                  idDocumentValid:
                    selectedRequest.verificationChecks.some(
                      (check) =>
                        check.label ===
                          "Document front uploaded" &&
                        check.status ===
                          "Pass"
                    ),

                  faceMatchScore:
                    selectedRequest.riskScore,

                  livenessPassed:
                    selectedRequest.verificationChecks.some(
                      (check) =>
                        check.label ===
                          "Selfie uploaded" &&
                        check.status ===
                          "Pass"
                    ),

                  databaseMatch:
                    false,

                  amlCheckPassed:
                    false,
                },
              }
            : null
        }
        onClose={() =>
          setSelectedRequest(
            null
          )
        }
        onDecisionSubmit={(
          action,
          reason,
          kycId
        ) => {
          void submitDecision(
            action,
            reason,
            kycId
          );
        }}
      />

      {reviewingId && (
        <div className="fixed bottom-5 right-5 z-[180] flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-2xl">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <p className="text-xs font-bold text-slate-700">
            Saving KYC decision...
          </p>
        </div>
      )}

      {toast && (
        <div className="fixed right-4 top-4 z-[190] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                Updated
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {toast}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   PRIORITY REVIEWS
========================================================= */

function PriorityReviews({
  requests,
  onOpen,
}: {
  requests: KYCRequest[];
  onOpen: (
    request: KYCRequest
  ) => void;
}) {
  return (
    <section className="rounded-[26px] border border-amber-100 bg-gradient-to-br from-white to-amber-50/50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
            Priority Reviews
          </p>
          <h2 className="mt-1 text-lg font-black text-[#0F2745]">
            Cases needing attention
          </h2>
        </div>

        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-[9px] font-bold text-amber-700">
          Review first
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {requests.length ===
        0 ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-center lg:col-span-3">
            <p className="text-sm font-bold text-emerald-800">
              No high-priority cases
            </p>
            <p className="mt-1 text-[10px] text-emerald-700/70">
              No high-risk result is available in the current review queue.
            </p>
          </div>
        ) : (
          requests.map(
            (request) => (
              <button
                key={
                  request.id
                }
                type="button"
                onClick={() =>
                  onOpen(
                    request
                  )
                }
                className="rounded-2xl border border-amber-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[9px] font-black text-rose-600">
                      {getInitials(
                        request.applicantName
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900">
                        {request.applicantName}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {request.caseId}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-700">
                    {request.riskLevel}
                  </span>
                </div>

                <p className="mt-4 line-clamp-2 text-[10px] leading-5 text-slate-500">
                  {request.reason}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400">
                    SLA
                  </span>
                  <span className="text-[10px] font-black text-amber-700">
                    {formatSLA(
                      request.slaMinutes
                    )}
                  </span>
                </div>
              </button>
            )
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   BULK ACTION BAR
========================================================= */

function BulkActionBar({
  count,
  onClear,
  onReview,
  onInfo,
  onExport,
}: {
  count: number;
  onClear: () => void;
  onReview: () => void;
  onInfo: () => void;
  onExport: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 flex-col gap-3 rounded-3xl border border-slate-700 bg-[#0F2745] p-4 text-white shadow-2xl sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black">
          {count} case
          {count > 1
            ? "s"
            : ""} selected
        </p>
        <p className="mt-0.5 text-[10px] text-slate-300">
          Single-case review is connected. Bulk status changes need a batch API endpoint.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={
            onReview
          }
          className="rounded-xl bg-blue-500 px-3 py-2 text-[10px] font-bold"
        >
          Mark Review
        </button>

        <button
          type="button"
          onClick={
            onInfo
          }
          className="rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-bold"
        >
          Request Info
        </button>

        <button
          type="button"
          onClick={
            onExport
          }
          className="rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold"
        >
          Export
        </button>

        <button
          type="button"
          onClick={
            onClear
          }
          className="rounded-xl px-3 py-2 text-[10px] font-bold text-slate-300"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  value: string
) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .toUpperCase();
}

function formatSLA(
  minutes: number
) {
  if (minutes <= 0) {
    return "Overdue";
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const mins =
    minutes % 60;

  return hours > 0
    ? `${hours}h ${mins}m`
    : `${mins}m`;
}
