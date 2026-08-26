"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
} from "lucide-react";

import KYCHeader from "./components/KYCHeader";
import KYCStats, {
  KYCStatsData,
} from "./components/KYCStats";
import KYCFilters, {
  DEFAULT_KYC_FILTERS,
  KYCFiltersState,
} from "./components/KYCFilters";
import KYCQueue from "./components/KYCQueue";
import KYCReviewDrawer from "./components/KYCReviewDrawer";
import KYCDecisionModal from "./components/KYCRequestInfoModal";
import KYCAnalytics from "./components/KYCAnalytics";

import type {
  KYCRequest,
} from "./components/KYCManagementTypes";

const DEMO_REQUESTS: KYCRequest[] = [
  {
    id: "kyc_req_001",
    caseId: "KYC-00042",
    applicantId: "usr_7f82a1b9",
    applicantName: "Rakibul Hasan",
    email: "rakibul.h@example.com",
    phone: "+8801711223344",
    documentType: "NID",
    documentNumber: "*** *** 7842",
    status: "Under Review",
    verificationResult: "Needs Review",
    riskLevel: "High",
    riskScore: 72,
    submittedAt: "2026-08-23T14:20:00Z",
    createdAt: "2026-08-23T13:40:00Z",
    lastReviewedAt: "2026-08-23T14:38:00Z",
    reviewer: "Rakibul Admin",
    slaMinutes: 12,
    reason:
      "Government ID passed initial checks, but the identity comparison requires manual review.",
    provider: "manual",
    city: "Dhaka",
    country: "Bangladesh",
    walletId: "wal_8001",
    transactionCount: 145,
    accountAgeDays: 953,
    twoFactorEnabled: true,
    failedLoginCount: 0,
    verificationChecks: [
      {
        label: "Valid document",
        status: "Pass",
      },
      {
        label: "Authenticity",
        status: "Pass",
      },
      {
        label: "Expiration",
        status: "Pass",
      },
      {
        label: "Image quality",
        status: "Review",
        reason:
          "Document image quality is below the ideal threshold.",
      },
      {
        label: "Data extraction",
        status: "Pass",
      },
    ],
    notes: [],
  },

  {
    id: "kyc_req_002",
    caseId: "KYC-00043",
    applicantId: "usr_4k99p3n2",
    applicantName: "Farhana Akter",
    email: "farhana.a@example.com",
    phone: "+8801644556677",
    documentType: "NID",
    documentNumber: "*** *** 4421",
    status: "Pending",
    verificationResult: "Needs Review",
    riskLevel: "Medium",
    riskScore: 45,
    submittedAt: "2026-08-23T12:25:00Z",
    createdAt: "2026-08-23T12:00:00Z",
    reviewer: "Unassigned",
    slaMinutes: 27,
    reason:
      "Identity information is complete and waiting for manual review.",
    provider: "manual",
    city: "Rajshahi",
    country: "Bangladesh",
    walletId: "wal_8004",
    transactionCount: 34,
    accountAgeDays: 461,
    twoFactorEnabled: false,
    failedLoginCount: 1,
    verificationChecks: [
      {
        label: "Valid document",
        status: "Pass",
      },
      {
        label: "Authenticity",
        status: "Review",
      },
      {
        label: "Expiration",
        status: "Pass",
      },
    ],
    notes: [],
  },

  {
    id: "kyc_req_003",
    caseId: "KYC-00044",
    applicantId: "usr_2b55y8m4",
    applicantName: "Tanvir Ahmed",
    email: "tanvir.a@example.com",
    phone: "+8801933445566",
    documentType: "NID",
    documentNumber: "*** *** 9920",
    status: "Rejected",
    verificationResult: "Failed",
    riskLevel: "Critical",
    riskScore: 85,
    submittedAt: "2026-08-22T09:15:00Z",
    createdAt: "2026-08-22T08:40:00Z",
    lastReviewedAt: "2026-08-22T11:20:00Z",
    reviewer: "Compliance Officer",
    slaMinutes: 0,
    reason:
      "Identity information did not match the submitted document.",
    provider: "manual",
    city: "Sylhet",
    country: "Bangladesh",
    walletId: "wal_8003",
    transactionCount: 12,
    accountAgeDays: 22,
    twoFactorEnabled: false,
    failedLoginCount: 4,
    rejectionReason:
      "Identity mismatch",
    verificationChecks: [
      {
        label: "Valid document",
        status: "Pass",
      },
      {
        label: "Authenticity",
        status: "Fail",
        reason:
          "Document authenticity could not be confidently established.",
      },
      {
        label: "Face match",
        status: "Fail",
        reason:
          "Selfie similarity below the configured threshold.",
      },
    ],
    notes: [
      {
        id: "note_1",
        author: "Compliance Officer",
        text:
          "Identity information requires additional evidence.",
        createdAt:
          "2026-08-22T11:18:00Z",
      },
    ],
  },

  {
    id: "kyc_req_004",
    caseId: "KYC-00045",
    applicantId: "usr_9c34x2z1",
    applicantName: "Nusrat Jahan",
    email: "nusrat.j@example.com",
    phone: "+8801822334455",
    documentType: "Passport",
    documentNumber: "*** *** 3109",
    status: "Verified",
    verificationResult: "Passed",
    riskLevel: "Low",
    riskScore: 8,
    submittedAt: "2026-08-21T10:10:00Z",
    createdAt: "2026-08-21T09:30:00Z",
    lastReviewedAt: "2026-08-21T12:10:00Z",
    reviewer: "Rakibul Admin",
    slaMinutes: 0,
    reason:
      "All identity and verification checks passed.",
    provider: "manual",
    city: "Chattogram",
    country: "Bangladesh",
    walletId: "wal_8002",
    transactionCount: 320,
    accountAgeDays: 1017,
    twoFactorEnabled: true,
    failedLoginCount: 0,
    verificationChecks: [
      {
        label: "Valid document",
        status: "Pass",
      },
      {
        label: "Authenticity",
        status: "Pass",
      },
      {
        label: "Expiration",
        status: "Pass",
      },
      {
        label: "Image quality",
        status: "Pass",
      },
      {
        label: "Face match",
        status: "Pass",
      },
    ],
    notes: [],
  },
];

export default function KYCRequestsPage() {
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<KYCRequest[]>(DEMO_REQUESTS);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<KYCFiltersState>(DEFAULT_KYC_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);

  const [decisionAction, setDecisionAction] = useState<
    | "approve"
    | "reject"
    | "information"
    | "escalate"
    | null
  >(null);

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [sortField, setSortField] = useState<
    | "submittedAt"
    | "riskScore"
    | "applicantName"
  >("submittedAt");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = requests.filter((request) => {
      const matchesSearch =
        !query ||
        request.applicantName.toLowerCase().includes(query) ||
        request.email.toLowerCase().includes(query) ||
        request.phone.toLowerCase().includes(query) ||
        request.caseId.toLowerCase().includes(query) ||
        request.documentNumber.toLowerCase().includes(query);

      const matchesStatus =
        filters.status === "All" || request.status === filters.status;

      const matchesDocument =
        filters.documentType === "All" ||
        request.documentType === filters.documentType;

      const matchesRisk =
        filters.risk === "All" || request.riskLevel === filters.risk;

      const matchesVerification =
        filters.verification === "All" ||
        request.verificationResult === filters.verification;

      const matchesReviewer =
        filters.reviewer === "All" ||
        (filters.reviewer === "Me"
          ? request.reviewer === "Rakibul Admin"
          : filters.reviewer === "Unassigned"
          ? request.reviewer === "Unassigned"
          : true);

      const matchesSla =
        filters.sla === "All" ||
        (filters.sla === "Normal"
          ? request.slaMinutes > 15
          : filters.sla === "Due Soon"
          ? request.slaMinutes > 0 && request.slaMinutes <= 15
          : request.slaMinutes <= 0);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDocument &&
        matchesRisk &&
        matchesVerification &&
        matchesReviewer &&
        matchesSla
      );
    });

    filtered.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortField === "applicantName") {
        return a.applicantName.localeCompare(b.applicantName) * direction;
      }

      if (sortField === "riskScore") {
        return (a.riskScore - b.riskScore) * direction;
      }

      return (
        (Date.parse(a.submittedAt) - Date.parse(b.submittedAt)) * direction
      );
    });

    return filtered;
  }, [requests, search, filters, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRequests = filteredRequests.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const stats: KYCStatsData = useMemo(
    () => ({
      pending: requests.filter((req) => req.status === "Pending").length,
      underReview: requests.filter((req) => req.status === "Under Review").length,
      approvedToday: requests.filter((req) => req.status === "Verified").length,
      rejectedToday: requests.filter((req) => req.status === "Rejected").length,
      highRisk: requests.filter(
        (req) => req.riskLevel === "High" || req.riskLevel === "Critical"
      ).length,
      averageReviewMinutes: 6.7,
    }),
    [requests]
  );

  const healthCounts = useMemo(
    () => ({
      verified: requests.filter((item) => item.status === "Verified").length,
      pending: requests.filter((item) => item.status === "Pending").length,
      underReview: requests.filter((item) => item.status === "Under Review").length,
      rejected: requests.filter((item) => item.status === "Rejected").length,
    }),
    [requests]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(paginatedRequests.map((req) => req.id)));
  };

  const updateStatus = (
    id: string,
    status: KYCRequest["status"],
    reason?: string
  ) => {
    setRequests((current) =>
      current.map((req) =>
        req.id === id
          ? {
              ...req,
              status,
              verificationResult:
                status === "Verified"
                  ? "Passed"
                  : status === "Rejected"
                  ? "Failed"
                  : req.verificationResult,
              rejectionReason: reason,
            }
          : req
      )
    );

    setToast(`KYC status updated locally to "${status}".`);
  };

  const bulkReview = (
    status: "Under Review" | "Needs Information"
  ) => {
    if (selectedIds.size === 0) return;

    setRequests((current) =>
      current.map((req) =>
        selectedIds.has(req.id)
          ? {
              ...req,
              status,
            }
          : req
      )
    );

    setSelectedIds(new Set());
    setToast(`${selectedIds.size} KYC cases updated locally.`);
  };

  const refreshQueue = async () => {
    setRefreshing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setRefreshing(false);
    setToast("KYC queue refreshed.");
  };

  const sortBy = (field: "submittedAt" | "riskScore" | "applicantName") => {
    setSortDirection((current) =>
      sortField === field && current === "asc" ? "desc" : "asc"
    );
    setSortField(field);
    setPage(1);
  };

  const handleDecision = (
    action: "approve" | "reject" | "information" | "escalate"
  ) => {
    if (selectedRequest) {
      setDecisionAction(action);
    }
  };

  const confirmDecision = (reason: string) => {
    if (!selectedRequest || !decisionAction) return;

    const statusMap = {
      approve: "Verified",
      reject: "Rejected",
      information: "Needs Information",
      escalate: "Escalated",
    } as const;

    updateStatus(
      selectedRequest.id,
      statusMap[decisionAction],
      decisionAction === "reject" ? reason : undefined
    );

    setSelectedRequest((current) =>
      current
        ? {
            ...current,
            status: statusMap[decisionAction],
            rejectionReason:
              decisionAction === "reject" ? reason : undefined,
          }
        : null
    );

    setDecisionAction(null);
  };

  if (!mounted) {
    return <main className="min-h-screen bg-[#F6F8FB]" />;
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] pb-20">
      <div className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-4 sm:px-6 lg:px-8">
        <KYCHeader
          refreshing={refreshing}
          onRefresh={refreshQueue}
          onExport={() =>
            setToast("Demo export is ready for backend integration.")
          }
        />

        <KYCStats stats={stats} />

        <KYCAnalytics
          counts={healthCounts}
          onFilterStatus={(status) =>
            setFilters((current) => ({
              ...current,
              status,
            }))
          }
        />

        <PriorityReviews
          requests={requests
            .filter(
              (req) =>
                req.riskLevel === "High" ||
                req.riskLevel === "Critical" ||
                req.verificationResult === "Failed"
            )
            .slice(0, 3)}
          onOpen={setSelectedRequest}
        />

        <KYCFilters
          search={search}
          setSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          filters={filters}
          setFilters={(value) => {
            setFilters(value);
            setPage(1);
          }}
          total={filteredRequests.length}
        />

        <KYCQueue
          requests={paginatedRequests}
          selectedIds={selectedIds}
          page={safePage}
          pageSize={pageSize}
          total={filteredRequests.length}
          totalPages={totalPages}
          onToggle={toggleSelection}
          onToggleAll={toggleAll}
          onOpen={setSelectedRequest}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={sortBy}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onReview={() => bulkReview("Under Review")}
          onInfo={() => bulkReview("Needs Information")}
          onExport={() =>
            setToast("Selected KYC cases prepared for export.")
          }
        />
      )}

      {/* 🔴 ERROR FIX HERE: 'selectedRequest' (or 'request={selectedRequest as any}') passed instead of 'request' */}
      <KYCReviewDrawer
        selectedRequest={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onDecision={handleDecision}
      />

      <KYCDecisionModal
        open={decisionAction !== null}
        action={decisionAction}
        applicantName={selectedRequest?.applicantName ?? "Applicant"}
        onClose={() => setDecisionAction(null)}
        onConfirm={confirmDecision}
      />

      {toast && (
        <div className="fixed right-4 top-4 z-[150] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-slate-900">Updated</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{toast}</p>
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
  onOpen: (request: KYCRequest) => void;
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
        {requests.length === 0 ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-center lg:col-span-3">
            <p className="text-sm font-bold text-emerald-800">
              No high-priority cases
            </p>
            <p className="mt-1 text-[10px] text-emerald-700/70">
              The current queue looks healthy.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => onOpen(request)}
              className="rounded-2xl border border-amber-100 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[9px] font-black text-rose-600">
                    {getInitials(request.applicantName)}
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
                  {formatSLA(request.slaMinutes)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

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
          {count} case{count > 1 ? "s" : ""} selected
        </p>
        <p className="mt-0.5 text-[10px] text-slate-300">
          Bulk actions use local demo state until the admin KYC APIs exist.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReview}
          className="rounded-xl bg-blue-500 px-3 py-2 text-[10px] font-bold"
        >
          Mark Review
        </button>
        <button
          type="button"
          onClick={onInfo}
          className="rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-bold"
        >
          Request Info
        </button>
        <button
          type="button"
          onClick={onExport}
          className="rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold"
        >
          Export
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl px-3 py-2 text-[10px] font-bold text-slate-300"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatSLA(minutes: number) {
  if (minutes <= 0) {
    return "Overdue";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}