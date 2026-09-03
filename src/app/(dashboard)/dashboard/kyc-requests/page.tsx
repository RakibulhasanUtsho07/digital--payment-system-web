"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  X,
} from "lucide-react";

import {
  apiClient,
} from "@/lib/api/client";

import KYCHeader from "./components/KYCHeader";

import KYCStats from "./components/KYCStats";

import KYCAnalytics from "./components/KYCAnalytics";

import KYCFilters, {
  DEFAULT_KYC_FILTERS,
  type KYCFiltersState,
} from "./components/KYCFilters";

import KYCQueue from "./components/KYCQueue";

import KYCReviewDrawer from "./components/KYCReviewDrawer";

import type {
  DocumentType,
  KYCAIReview,
  KYCOverviewData,
  KYCPrivateDocuments,
  KYCRequest,
  KYCStatus,
  RiskLevel,
} from "./components/KYCManagementTypes";

import type {
  DecisionAction,
} from "./components/KYCRequestInfoModal";

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
  _id?:
    string;

  name?:
    string;

  email?:
    string;

  phone?:
    string;

  role?:
    string;

  kycStatus?:
    string;
}

interface AdminKYCRecord {
  _id:
    string;

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

  riskLevel?:
    string;

  riskScore?:
    number;

  slaMinutes?:
    number;
}

interface PendingKYCResponse {
  success:
    boolean;

  count?:
    number;

  kycs?:
    AdminKYCRecord[];

  message?:
    string;
}

interface ReviewKYCResponse {
  success:
    boolean;

  message?:
    string;
}

interface DocumentsResponse {
  success:
    boolean;

  message?:
    string;

  documents?:
    KYCPrivateDocuments;
}

interface OverviewResponse {
  success:
    boolean;

  overview?:
    KYCOverviewData;

  message?:
    string;
}

interface AIReviewResponse {
  success:
    boolean;

  review?:
    KYCAIReview;

  message?:
    string;
}

/* =========================================================
   MAPPERS
========================================================= */

function mapDocumentType(
  value?:
    ApiDocumentType
):
  DocumentType {
  switch (
    value
  ) {
    case "passport":
      return "Passport";

    case "driving_license":
      return "Driving License";

    default:
      return "NID";
  }
}

function mapKYCStatus(
  value:
    ApiKYCStatus
):
  KYCStatus {
  switch (
    value
  ) {
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
}

function mapRiskLevel(
  value?:
    string
):
  RiskLevel {
  const normalized =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();

  if (
    normalized ===
    "critical"
  ) {
    return "Critical";
  }

  if (
    normalized ===
    "high"
  ) {
    return "High";
  }

  if (
    normalized ===
    "medium"
  ) {
    return "Medium";
  }

  return "Unknown";
}

function getUser(
  value:
    AdminKYCRecord["userId"]
):
  AdminKYCUser {
  if (
    value &&
    typeof value ===
      "object"
  ) {
    return value;
  }

  return {
    _id:
      typeof value ===
      "string"
        ? value
        : undefined,
  };
}

function normalizeRiskScore(
  value?:
    number
) {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        value
      )
    )
  );
}

function getSlaMinutes(
  kyc:
    AdminKYCRecord
) {
  if (
    typeof kyc.slaMinutes ===
      "number" &&
    Number.isFinite(
      kyc.slaMinutes
    )
  ) {
    return Math.round(
      kyc.slaMinutes
    );
  }

  const source =
    kyc.submittedAt ||
    kyc.createdAt;

  if (
    !source
  ) {
    return 24 *
      60;
  }

  const submitted =
    Date.parse(
      source
    );

  if (
    !Number.isFinite(
      submitted
    )
  ) {
    return 24 *
      60;
  }

  const elapsed =
    Math.floor(
      (
        Date.now() -
        submitted
      ) /
      (
        60 *
        1000
      )
    );

  return (
    24 *
      60 -
    elapsed
  );
}

function toKYCRequest(
  kyc:
    AdminKYCRecord
):
  KYCRequest {
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
    new Date()
      .toISOString();

  const riskLevel =
    mapRiskLevel(
      kyc.riskLevel
    );

  const riskScore =
    normalizeRiskScore(
      kyc.riskScore
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
      reason:
        kyc.hasFrontImage
          ? undefined
          : "Front image is not available in the queue record.",
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
          : "Back image may be optional depending on the document type.",
    },

    {
      label:
        "Selfie uploaded",
      status:
        kyc.hasSelfieImage
          ? "Pass"
          : "Review",
      reason:
        kyc.hasSelfieImage
          ? undefined
          : "A selfie verification signal is not available.",
    },
  ];

  return {
    id,

    caseId:
      `KYC-${id
        .slice(
          -8
        )
        .toUpperCase()}`,

    applicantId:
      user._id ||
      "",

    applicantName:
      user.name ||
      "Unknown User",

    email:
      user.email ||
      "",

    phone:
      user.phone ||
      "",

    documentType:
      mapDocumentType(
        kyc.documentType
      ),

    documentNumber:
      kyc.documentNumber ||
      "Masked / unavailable",

    status,

    verificationResult:
      status ===
      "Verified"
        ? "Passed"
        : status ===
            "Rejected"
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
      "The application is waiting for a final administrative KYC review.",

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
      0,

    twoFactorEnabled:
      false,

    failedLoginCount:
      0,

    rejectionReason:
      kyc.rejectionReason,

    verificationChecks,

    notes:
      [],
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function KYCRequestsPage() {
  const [
    requests,
    setRequests,
  ] =
    useState<
      KYCRequest[]
    >(
      []
    );

  const [
    overview,
    setOverview,
  ] =
    useState<KYCOverviewData>({
      pending:
        0,
      underReview:
        0,
      approvedToday:
        0,
      rejectedToday:
        0,
      highRisk:
        0,
      averageReviewMinutes:
        null,
      totalSubmitted:
        0,
      verified:
        0,
      rejected:
        0,
      aiReviewed:
        0,
      needsManualReview:
        0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    filters,
    setFilters,
  ] =
    useState<KYCFiltersState>(
      DEFAULT_KYC_FILTERS
    );

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<
      Set<string>
    >(
      new Set()
    );

  const [
    selectedRequest,
    setSelectedRequest,
  ] =
    useState<KYCRequest | null>(
      null
    );

  const [
    privateDocuments,
    setPrivateDocuments,
  ] =
    useState<KYCPrivateDocuments>(
      {}
    );

  const [
    documentsLoading,
    setDocumentsLoading,
  ] =
    useState(
      false
    );

  const [
    documentsError,
    setDocumentsError,
  ] =
    useState(
      ""
    );

  const [
    aiReview,
    setAIReview,
  ] =
    useState<KYCAIReview | null>(
      null
    );

  const [
    aiLoading,
    setAILoading,
  ] =
    useState(
      false
    );

  const [
    aiRunning,
    setAIRunning,
  ] =
    useState(
      false
    );

  const [
    aiError,
    setAIError,
  ] =
    useState(
      ""
    );

  const [
    submittingDecision,
    setSubmittingDecision,
  ] =
    useState(
      false
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    pageSize,
    setPageSize,
  ] =
    useState(
      25
    );

  const [
    sortField,
    setSortField,
  ] =
    useState<
      | "submittedAt"
      | "riskScore"
      | "applicantName"
    >(
      "submittedAt"
    );

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<
      | "asc"
      | "desc"
    >(
      "desc"
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      ""
    );

  const [
    toast,
    setToast,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState(
      ""
    );

  const loadOverview =
    useCallback(
      async () => {
        try {
          const response =
            await apiClient<OverviewResponse>(
              "/admin/kyc/overview"
            );

          if (
            response?.success &&
            response.overview
          ) {
            setOverview(
              response.overview
            );

            return;
          }
        } catch (
          error
        ) {
          console.warn(
            "KYC overview endpoint unavailable:",
            error
          );
        }

        /*
         * Do not invent completed-review analytics when the overview
         * endpoint is unavailable. Only active-queue values are derived.
         */
        setOverview(
          (
            current
          ) => ({
            ...current,
            approvedToday:
              0,
            rejectedToday:
              0,
            averageReviewMinutes:
              null,
            verified:
              0,
            rejected:
              0,
            aiReviewed:
              0,
            needsManualReview:
              0,
          })
        );
      },
      []
    );

  const loadRequests =
    useCallback(
      async (
        fullLoader =
          true
      ) => {
        try {
          if (
            fullLoader
          ) {
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

          setOverview(
            (
              current
            ) => ({
              ...current,

              pending:
                normalized.filter(
                  (
                    item
                  ) =>
                    item.status ===
                    "Pending"
                ).length,

              underReview:
                normalized.filter(
                  (
                    item
                  ) =>
                    item.status ===
                    "Under Review"
                ).length,

              totalSubmitted:
                Math.max(
                  current.totalSubmitted,
                  normalized.length
                ),

              highRisk:
                normalized.filter(
                  (
                    item
                  ) =>
                    item.riskLevel ===
                      "High" ||
                    item.riskLevel ===
                      "Critical"
                ).length,
            })
          );

          setSelectedIds(
            new Set()
          );

          setLastUpdated(
            new Date()
              .toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                }
              )
          );

          await loadOverview();
        } catch (
          error
        ) {
          console.error(
            "Admin KYC loading error:",
            error
          );

          setErrorMessage(
            error instanceof
            Error
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
      [
        loadOverview,
      ]
    );

  useEffect(
    () => {
      void loadRequests(
        true
      );
    },
    [
      loadRequests,
    ]
  );

  useEffect(
    () => {
      if (
        !toast
      ) {
        return;
      }

      const timer =
        window.setTimeout(
          () =>
            setToast(
              null
            ),
          3000
        );

      return () =>
        window.clearTimeout(
          timer
        );
    },
    [
      toast,
    ]
  );

  /* =======================================================
     LOAD PRIVATE DOCUMENTS + AI REVIEW ON DRAWER OPEN
  ======================================================== */

  useEffect(
    () => {
      let cancelled =
        false;

      const loadSelectedData =
        async () => {
          if (
            !selectedRequest
          ) {
            setPrivateDocuments(
              {}
            );

            setDocumentsError(
              ""
            );

            setDocumentsLoading(
              false
            );

            setAIReview(
              null
            );

            setAIError(
              ""
            );

            setAILoading(
              false
            );

            return;
          }

          setDocumentsLoading(
            true
          );

          setDocumentsError(
            ""
          );

          setPrivateDocuments(
            {}
          );

          setAILoading(
            true
          );

          setAIError(
            ""
          );

          setAIReview(
            null
          );

          const [
            documentsResult,
            aiResult,
          ] =
            await Promise.allSettled([
              apiClient<DocumentsResponse>(
                `/admin/kyc/${selectedRequest.id}/documents`
              ),

              apiClient<AIReviewResponse>(
                `/admin/kyc/${selectedRequest.id}/ai-review`
              ),
            ]);

          if (
            cancelled
          ) {
            return;
          }

          if (
            documentsResult.status ===
              "fulfilled" &&
            documentsResult.value
              ?.success
          ) {
            setPrivateDocuments(
              documentsResult.value
                .documents ||
              {}
            );
          } else {
            setDocumentsError(
              documentsResult.status ===
                "rejected" &&
              documentsResult.reason instanceof
                Error
                ? documentsResult.reason
                    .message
                : "KYC documents could not be loaded."
            );
          }

          if (
            aiResult.status ===
              "fulfilled" &&
            aiResult.value
              ?.success &&
            aiResult.value
              .review
          ) {
            setAIReview(
              aiResult.value
                .review
            );
          } else if (
            aiResult.status ===
              "rejected"
          ) {
            /*
             * A missing AI review is not treated as a page failure.
             * The admin can run it manually from the drawer.
             */
            setAIError(
              aiResult.reason instanceof
                Error
                ? aiResult.reason
                    .message
                : ""
            );
          }

          setDocumentsLoading(
            false
          );

          setAILoading(
            false
          );
        };

      void loadSelectedData();

      return () => {
        cancelled =
          true;
      };
    },
    [
      selectedRequest?.id,
    ]
  );

  /* =======================================================
     FILTER + SORT
  ======================================================== */

  const filteredRequests =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        const filtered =
          requests.filter(
            (
              request
            ) => {
              const matchesSearch =
                !query ||
                request.applicantName
                  .toLowerCase()
                  .includes(
                    query
                  ) ||
                request.email
                  .toLowerCase()
                  .includes(
                    query
                  ) ||
                request.phone
                  .toLowerCase()
                  .includes(
                    query
                  ) ||
                request.caseId
                  .toLowerCase()
                  .includes(
                    query
                  ) ||
                request.documentNumber
                  .toLowerCase()
                  .includes(
                    query
                  );

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
                (
                  filters.reviewer ===
                  "Unassigned"
                    ? request.reviewer ===
                      "Unassigned"
                    : request.reviewer !==
                      "Unassigned"
                );

              const matchesSla =
                filters.sla ===
                  "All" ||
                (
                  filters.sla ===
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
                        0
                );

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

        return [
          ...filtered,
        ].sort(
          (
            a,
            b
          ) => {
            let left:
              string |
              number;

            let right:
              string |
              number;

            if (
              sortField ===
              "riskScore"
            ) {
              left =
                a.riskScore;

              right =
                b.riskScore;
            } else if (
              sortField ===
              "applicantName"
            ) {
              left =
                a.applicantName.toLowerCase();

              right =
                b.applicantName.toLowerCase();
            } else {
              left =
                Date.parse(
                  a.submittedAt
                );

              right =
                Date.parse(
                  b.submittedAt
                );
            }

            if (
              left <
              right
            ) {
              return sortDirection ===
                "asc"
                ? -1
                : 1;
            }

            if (
              left >
              right
            ) {
              return sortDirection ===
                "asc"
                ? 1
                : -1;
            }

            return 0;
          }
        );
      },
      [
        requests,
        search,
        filters,
        sortField,
        sortDirection,
      ]
    );

  useEffect(
    () => {
      setPage(
        1
      );
    },
    [
      search,
      filters,
      pageSize,
    ]
  );

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
      (
        safePage -
        1
      ) *
        pageSize,
      safePage *
        pageSize
    );

  /* =======================================================
     ACTIONS
  ======================================================== */

  const toggleSelection =
    (
      id:
        string
    ) => {
      setSelectedIds(
        (
          current
        ) => {
          const next =
            new Set(
              current
            );

          if (
            next.has(
              id
            )
          ) {
            next.delete(
              id
            );
          } else {
            next.add(
              id
            );
          }

          return next;
        }
      );
    };

  const toggleAll =
    (
      checked:
        boolean
    ) => {
      if (
        !checked
      ) {
        setSelectedIds(
          new Set()
        );

        return;
      }

      setSelectedIds(
        new Set(
          paginatedRequests.map(
            (
              request
            ) =>
              request.id
          )
        )
      );
    };

  const sortBy =
    (
      field:
        | "submittedAt"
        | "riskScore"
        | "applicantName"
    ) => {
      if (
        sortField ===
        field
      ) {
        setSortDirection(
          (
            current
          ) =>
            current ===
            "asc"
              ? "desc"
              : "asc"
        );

        return;
      }

      setSortField(
        field
      );

      setSortDirection(
        "desc"
      );
    };

  const runAIReview =
    async () => {
      if (
        !selectedRequest
      ) {
        return;
      }

      try {
        setAIRunning(
          true
        );

        setAIError(
          ""
        );

        const response =
          await apiClient<AIReviewResponse>(
            `/admin/kyc/${selectedRequest.id}/ai-review`,
            {
              method:
                "POST",
            }
          );

        if (
          !response?.success ||
          !response.review
        ) {
          throw new Error(
            response?.message ||
            "Automated KYC screening failed."
          );
        }

        setAIReview(
          response.review
        );

        setToast(
          "Automated KYC screening completed."
        );

        await loadOverview();
      } catch (
        error
      ) {
        setAIError(
          error instanceof
          Error
            ? error.message
            : "Automated KYC screening failed."
        );
      } finally {
        setAIRunning(
          false
        );
      }
    };

  const submitDecision =
    async (
      action:
        DecisionAction,
      reason:
        string
    ) => {
      if (
        !selectedRequest
      ) {
        return;
      }

      try {
        setSubmittingDecision(
          true
        );

        setErrorMessage(
          ""
        );

        const status =
          action ===
          "approve"
            ? "verified"
            : "rejected";

        const body:
          {
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
            `/admin/kyc/${selectedRequest.id}/review`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  body
                ),
            }
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
            "Failed to save the KYC decision."
          );
        }

        setSelectedRequest(
          null
        );

        setToast(
          action ===
          "approve"
            ? "KYC approved successfully."
            : "KYC rejected successfully."
        );

        await loadRequests(
          false
        );
      } catch (
        error
      ) {
        setErrorMessage(
          error instanceof
          Error
            ? error.message
            : "Failed to save the KYC decision."
        );
      } finally {
        setSubmittingDecision(
          false
        );
      }
    };

  const exportRows =
    () => {
      const source =
        selectedIds.size >
        0
          ? filteredRequests.filter(
              (
                item
              ) =>
                selectedIds.has(
                  item.id
                )
            )
          : filteredRequests;

      const rows = [
        [
          "Case ID",
          "Applicant",
          "Email",
          "Phone",
          "Document Type",
          "Status",
          "Verification",
          "Risk",
          "Risk Score",
          "Submitted At",
        ],

        ...source.map(
          (
            item
          ) => [
            item.caseId,
            item.applicantName,
            item.email,
            item.phone,
            item.documentType,
            item.status,
            item.verificationResult,
            item.riskLevel,
            String(
              item.riskScore
            ),
            item.submittedAt,
          ]
        ),
      ];

      const csv =
        rows
          .map(
            (
              row
            ) =>
              row
                .map(
                  (
                    value
                  ) =>
                    `"${String(
                      value ??
                      ""
                    ).replace(
                      /"/g,
                      '""'
                    )}"`
                )
                .join(
                  ","
                )
          )
          .join(
            "\n"
          );

      const blob =
        new Blob(
          [
            csv,
          ],
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
        `kyc-review-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.csv`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        url
      );
    };

  const applyAnalyticsFilter =
    (
      status:
        KYCStatus
    ) => {
      if (
        status ===
          "Pending" ||
        status ===
          "Under Review"
      ) {
        setFilters(
          (
            current
          ) => ({
            ...current,
            status,
          })
        );
      }
    };

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center bg-[#F3F7FB] px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0F2745,#1F5EA8)] text-white shadow-[0_18px_40px_rgba(15,39,69,0.22)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-[#0F2745]">
            Loading KYC review center
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching the protected admin review queue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F7FB] pb-12">
      <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
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
            exportRows
          }
          lastUpdated={
            lastUpdated
          }
        />

        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{
                opacity:
                  0,
                y:
                  -8,
              }}
              animate={{
                opacity:
                  1,
                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
                y:
                  -8,
              }}
              className="flex flex-col gap-3 rounded-[20px] border border-rose-100 bg-rose-50/75 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                <p className="text-[9px] leading-5 text-rose-700">
                  {
                    errorMessage
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setErrorMessage(
                    ""
                  )
                }
                className="flex h-8 w-8 items-center justify-center self-end rounded-xl text-rose-500 hover:bg-white sm:self-auto"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <KYCStats
          stats={
            overview
          }
        />

        <KYCAnalytics
          overview={
            overview
          }
          onFilterStatus={
            applyAnalyticsFilter
          }
        />

        <KYCFilters
          search={
            search
          }
          setSearch={
            setSearch
          }
          filters={
            filters
          }
          setFilters={
            setFilters
          }
          total={
            filteredRequests.length
          }
        />

        <AnimatePresence>
          {selectedIds.size >
            0 && (
            <motion.div
              initial={{
                opacity:
                  0,
                y:
                  8,
              }}
              animate={{
                opacity:
                  1,
                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
                y:
                  8,
              }}
              className="flex flex-col gap-3 rounded-[20px] border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-[9px] font-black text-[#174A7A]">
                {
                  selectedIds.size
                } review request
                {
                  selectedIds.size ===
                  1
                    ? ""
                    : "s"
                } selected
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    exportRows
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1F5EA8] px-3 text-[9px] font-black text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Selected
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds(
                      new Set()
                    )
                  }
                  className="h-9 rounded-xl border border-blue-100 bg-white px-3 text-[9px] font-black text-blue-700"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

      <KYCReviewDrawer
        request={
          selectedRequest
        }
        documents={
          privateDocuments
        }
        documentsLoading={
          documentsLoading
        }
        documentsError={
          documentsError
        }
        aiReview={
          aiReview
        }
        aiLoading={
          aiLoading
        }
        aiRunning={
          aiRunning
        }
        aiError={
          aiError
        }
        submittingDecision={
          submittingDecision
        }
        onClose={() =>
          setSelectedRequest(
            null
          )
        }
        onRunAIReview={() =>
          void runAIReview()
        }
        onDecision={(
          action,
          reason
        ) =>
          void submitDecision(
            action,
            reason
          )
        }
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity:
                0,
              x:
                18,
            }}
            animate={{
              opacity:
                1,
              x:
                0,
            }}
            exit={{
              opacity:
                0,
              x:
                18,
            }}
            className="fixed right-4 top-4 z-[210] w-[calc(100%-2rem)] max-w-sm rounded-[18px] border border-emerald-100 bg-white p-4 shadow-[0_22px_60px_rgba(15,39,69,0.16)]"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

              <div>
                <p className="text-[9px] font-black text-slate-800">
                  Updated
                </p>

                <p className="mt-1 text-[9px] leading-5 text-slate-500">
                  {
                    toast
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
