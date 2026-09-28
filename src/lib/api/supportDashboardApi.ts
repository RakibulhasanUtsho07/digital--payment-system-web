"use client";

import { apiClient } from "./client";

/* =========================================================
   TICKET TYPES
========================================================= */

export type TicketStatus =
  | "Open"
  | "Waiting for Customer"
  | "In Progress"
  | "Escalated"
  | "Resolved";

export type TicketPriority =
  | "Low"
  | "Normal"
  | "High"
  | "Urgent";

export type TicketCategory =
  | "Transfer"
  | "Withdrawal"
  | "Deposit"
  | "KYC"
  | "Security"
  | "Account"
  | "Payment"
  | "Other";

/* =========================================================
   AI COPILOT
========================================================= */

export interface SupportAiAnalysis {
  ticketId: string;
  ticketNumber: string;

  provider: "rule-engine";

  mode: "copilot";

  confidence: number;

  summary: string;

  intent: string;

  suggestedPriority:
    | "Urgent"
    | "High"
    | "Normal"
    | "Low";

  urgency:
    | "Critical"
    | "High"
    | "Moderate"
    | "Low";

  sentiment:
    | "Concerned"
    | "Neutral"
    | "Positive";

  possibleRootCause: string;

  recommendedNextAction: string;

  suggestedReply: string;

  verification: {
    status:
      | "verified"
      | "partially_verified"
      | "unverified";
    label: string;
    evidence: string[];
  };

  safety: {
    humanApprovalRequired: true;
    canExecuteFinancialActions: false;
  };

  context: {
    customerName: string;
    customerEmail: string;
    category: string;
    priority: string;
    status: string;
    slaMinutes: number;
    slaBreached: boolean;
    relatedReference: string | null;
    messageCount: number;
  };
}

/* =========================================================
   OVERVIEW
========================================================= */

export interface SupportMetrics {
  openTickets: number;
  pendingReplies: number;
  slaRisk: number;
  breached: number;
  resolvedToday: number;
  csat: number | null;
  unassigned: number;
  escalated: number;
}

export interface SupportAttention {
  slaDueSoon: number;
  priorityWaiting: number;
  escalated: number;
  unassigned: number;
}

/* =========================================================
   TICKET
========================================================= */

export interface SupportTicketSummary {
  id: string;
  ticketNumber: string;
  customerUserId: string;
  customerName: string;
  customerEmail: string;
  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  assignee: {
    id: string | null;
    name: string;
  };

  slaMinutes: number;

  slaBreached: boolean;

  lastActivityAt: string;

  createdAt: string;
}

export interface SupportMessage {
  id: string;

  visibility:
    | "public"
    | "internal";

  authorType:
    | "admin"
    | "customer"
    | "system";

  authorName: string;

  body: string;

  createdAt: string;
}

export interface SupportActivity {
  id: string;

  eventType: string;

  summary: string;

  actorName: string;

  createdAt: string;
}

export interface SupportTicketDetail
  extends SupportTicketSummary {
  description: string;

  relatedReference: string;

  tags: string[];

  customer: {
    userId: string;

    name: string;

    email: string;

    kycStatus: string;

    walletLinked: boolean;
  };

  messages: SupportMessage[];

  activity: SupportActivity[];

  firstResponseAt:
    | string
    | null;

  resolvedAt:
    | string
    | null;
}

export interface TicketListQuery {
  search?: string;

  status?:
    | TicketStatus
    | "All";

  priority?:
    | TicketPriority
    | "All";

  category?:
    | TicketCategory
    | "All";

  sla?:
    | "All"
    | "Due Soon"
    | "Breached";

  page?: number;

  limit?: number;
}

/* =========================================================
   CUSTOMER
========================================================= */

export type SupportCustomerRole =
  | "user"
  | "merchant";

export interface SupportCustomerSummary {
  id: string;

  name: string;

  email: string;

  phone: string;

  role: SupportCustomerRole;

  kycStatus: string;

  walletLinked: boolean;

  createdAt:
    | string
    | null;
}

export interface SupportCustomerProfile
  extends SupportCustomerSummary {
  accountStatus: string;

  emailVerified: boolean;

  emailVerifiedAt:
    | string
    | null;

  wallet:
    | {
        id: string;

        balance: unknown;

        status: string;
      }
    | null;

  updatedAt:
    | string
    | null;
}

/* =========================================================
   CONVERSATIONS
========================================================= */

export interface SupportConversationSummary {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  customer: {
    id: string;

    name: string;

    email: string;
  };

  assignee:
    | {
        id: string;

        name: string;

        role:
          | "support"
          | "admin"
          | "super_admin";
      }
    | null;

  lastMessage:
    | {
        id: string;

        visibility:
          | "public"
          | "internal";

        authorType:
          | "admin"
          | "customer"
          | "system";

        body: string;

        createdAt: string;
      }
    | null;

  lastActivityAt: string;

  createdAt: string;
}

export interface SupportConversationDetail
  extends Omit<
    SupportConversationSummary,
    "lastMessage"
  > {
  messages: Array<{
    id: string;

    visibility:
      | "public"
      | "internal";

    authorType:
      | "admin"
      | "customer"
      | "system";

    authorId:
      | string
      | null;

    authorName: string;

    authorRole:
      | "user"
      | "merchant"
      | "support"
      | "analyst"
      | "admin"
      | "super_admin"
      | null;

    body: string;

    createdAt: string;

    updatedAt: string;
  }>;
}

/* =========================================================
   ESCALATIONS
========================================================= */

export interface SupportEscalation {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  customer: {
    id: string;

    name: string;

    email: string;
  };

  assignee:
    | {
        id: string;

        name: string;

        role:
          | "support"
          | "admin"
          | "super_admin";
      }
    | null;

  escalation:
    | {
        id: string;

        summary: string;

        actorName: string;

        createdAt: string;
      }
    | null;

  relatedReference:
    | string
    | null;

  lastActivityAt: string;

  createdAt: string;

  slaDueAt: string;
}

export interface SupportEscalationDetail {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  customer: {
    id: string;

    name: string;

    email: string;

    kycStatus: string;

    walletLinked: boolean;
  };

  assignee:
    | {
        id: string;

        name: string;

        role:
          | "support"
          | "admin"
          | "super_admin";
      }
    | null;

  relatedReference:
    | string
    | null;

  slaDueAt: string;

  escalationHistory: Array<{
    id: string;

    summary: string;

    actorName: string;

    createdAt: string;
  }>;

  lastActivityAt: string;

  createdAt: string;
}

/* =========================================================
   SLA
========================================================= */

export type SupportSlaStatus =
  | "Healthy"
  | "Due Soon"
  | "Breached"
  | "Resolved";

export interface SupportSlaTicket {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  customer: {
    id: string;

    name: string;

    email: string;
  };

  assignee:
    | {
        id: string;

        name: string;

        role:
          | "support"
          | "admin"
          | "super_admin";
      }
    | null;

  sla: {
    status: SupportSlaStatus;

    minutesRemaining: number;

    minutesOverdue: number;

    dueAt: string;

    breached: boolean;
  };

  lastActivityAt: string;

  createdAt: string;

  monitoredAt: string;
}

export interface SupportSlaSummary {
  active: number;

  healthy: number;

  dueSoon: number;

  breached: number;

  resolved: number;
}

/* =========================================================
   ANALYTICS
========================================================= */

export interface SupportAnalytics {
  period: {
    days: number;

    startDate: string;

    endDate: string;
  };

  summary: {
    totalTickets: number;

    resolvedTickets: number;

    openTickets: number;

    escalatedTickets: number;

    breachedTickets: number;

    waitingCustomerTickets: number;

    urgentTickets: number;

    resolutionRate: number;

    escalationRate: number;

    breachRate: number;

    csat: number | null;

    csatResponses: number;
  };

  statusBreakdown: Array<{
    status: TicketStatus;

    count: number;
  }>;

  priorityBreakdown: Array<{
    priority: TicketPriority;

    count: number;
  }>;

  categoryBreakdown: Array<{
    category: string;

    count: number;
  }>;

  dailyTickets: Array<{
    date: string;

    count: number;
  }>;

  dailyResolved: Array<{
    date: string;

    count: number;
  }>;

  activityBreakdown: Array<{
    eventType: string;

    count: number;
  }>;
}

/* =========================================================
   KNOWLEDGE BASE
========================================================= */

export interface SupportKnowledgeBaseArticle {
  id: string;

  title: string;

  slug: string;

  summary: string;

  category: string;

  tags: string[];

  status:
    | "published"
    | "draft";

  createdAt: string;

  updatedAt: string;
}

export interface SupportKnowledgeBaseDetail
  extends SupportKnowledgeBaseArticle {
  content: string;
}

/* =========================================================
   SAVED REPLIES
========================================================= */

export interface SupportSavedReply {
  id: string;

  title: string;

  shortcut: string;

  content: string;

  category: string;

  tags: string[];

  status:
    | "published"
    | "draft";

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   ACTIVITY
========================================================= */

export interface SupportActivityLog {
  id: string;

  eventType: string;

  summary: string;

  actor: {
    id: string | null;

    name: string;

    role:
      | "user"
      | "merchant"
      | "support"
      | "analyst"
      | "admin"
      | "super_admin"
      | null;

    accountStatus:
      | "active"
      | "deleted"
      | null;
  };

  ticket: {
    id: string;

    ticketNumber:
      | string
      | null;

    subject:
      | string
      | null;
  };

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   ACCOUNT ISSUES
========================================================= */

export interface SupportAccountIssue {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  relatedReference:
    | string
    | null;

  customer: {
    id: string;

    name: string;

    email: string;

    phone: string;

    role: string;

    kycStatus: string;

    emailVerified: boolean;

    walletLinked: boolean;
  };

  sla: {
    dueAt: string;

    minutesRemaining: number;

    breached: boolean;
  };

  lastActivityAt: string;

  createdAt: string;
}

/* =========================================================
   KYC CASES
========================================================= */

export interface SupportKycCase {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  relatedReference:
    | string
    | null;

  customer: {
    id: string;

    name: string;

    email: string;

    phone: string;

    kycStatus: string;

    emailVerified: boolean;

    emailVerifiedAt:
      | string
      | null;

    walletLinked: boolean;

    role: string;
  };

  sla: {
    dueAt: string;

    minutesRemaining: number;

    breached: boolean;
  };

  lastActivityAt: string;

  createdAt: string;
}

/* =========================================================
   REFUND REQUESTS
========================================================= */

export interface SupportRefundRequest {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  relatedReference:
    | string
    | null;

  customer: {
    id: string;

    name: string;

    email: string;

    phone: string;

    walletLinked: boolean;

    kycStatus: string;
  };

  sla: {
    dueAt: string;

    minutesRemaining: number;

    breached: boolean;
  };

  lastActivityAt: string;

  createdAt: string;
}

/* =========================================================
   DISPUTES
========================================================= */

export interface SupportDisputeCase {
  id: string;

  ticketNumber: string;

  subject: string;

  category: TicketCategory;

  priority: TicketPriority;

  status: TicketStatus;

  waitingOn:
    | "admin"
    | "customer"
    | "none";

  relatedReference:
    | string
    | null;

  customer: {
    id: string;

    name: string;

    email: string;

    phone: string;

    role: string;

    kycStatus: string;

    emailVerified: boolean;

    walletLinked: boolean;
  };

  sla: {
    dueAt: string;

    minutesRemaining: number;

    breached: boolean;
  };

  lastActivityAt: string;

  createdAt: string;
}

/* =========================================================
   PAYMENTS
========================================================= */

export interface SupportPayment {
  id: string;

  paymentId: string;

  merchantId: string;

  customerId:
    | string
    | null;

  orderId:
    | string
    | null;

  amount:
    | string
    | null;

  currency: string;

  feeAmount:
    | string
    | null;

  netAmount:
    | string
    | null;

  sourceType:
    | "paypal"
    | "card"
    | "local_psp"
    | "wallet";

  provider: string;

  mode:
    | "test"
    | "live";

  status:
    | "pending"
    | "authorized"
    | "captured"
    | "completed"
    | "failed"
    | "cancelled"
    | "expired";

  providerPaymentId:
    | string
    | null;

  merchantReference:
    | string
    | null;

  failure:
    | {
        code: string | null;

        message: string | null;
      }
    | null;

  customer:
    | {
        id: string;

        name: string;

        email: string;

        role: string;

        kycStatus: string;

        walletLinked: boolean;
      }
    | null;

  timestamps: {
    createdAt: string;

    updatedAt: string;

    authorizedAt: string | null;

    capturedAt: string | null;

    completedAt: string | null;

    failedAt: string | null;

    cancelledAt: string | null;

    expiredAt: string | null;
  };
}

/* =========================================================
   TRANSACTIONS
========================================================= */

export interface SupportTransactionUser {
  id: string;

  name: string;

  email: string;

  role: string | null;

  kycStatus: string;

  walletLinked: boolean;
}

export interface SupportTransaction {
  id: string;

  idempotencyKey:
    | string
    | null;

  amountMinorUnits: string;

  reference:
    | string
    | null;

  currency: string;

  type:
    | "TRANSFER"
    | "DEPOSIT"
    | "WITHDRAW";

  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED";

  riskScore:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  sender:
    SupportTransactionUser;

  receiver:
    SupportTransactionUser;

  timestamps: {
    createdAt:
      | string
      | null;

    updatedAt:
      | string
      | null;
  };
}

/* =========================================================
   CREATE TICKET
========================================================= */

export interface CreateSupportTicketInput {
  customerEmail: string;

  subject: string;

  description: string;

  category: TicketCategory;

  priority: TicketPriority;

  relatedReference?: string;

  tags?: string[];
}

/* =========================================================
   QUERY BUILDER
========================================================= */

const buildQuery = (
  values: Record<
    string,
    string | number | undefined
  >
): string => {
  const params =
    new URLSearchParams();

  Object.entries(
    values
  ).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === "" ||
        value === "All"
      ) {
        return;
      }

      params.set(
        key,
        String(value)
      );
    }
  );

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
};

/* =========================================================
   RESPONSE TYPE
========================================================= */

type TicketResponse = {
  success: boolean;

  message?: string;

  ticket: SupportTicketDetail;
};

/* =========================================================
   SUPPORT DASHBOARD API
========================================================= */

export const supportDashboardApi = {
  /* =======================================================
     OVERVIEW
  ====================================================== */

  getOverview: () =>
    apiClient<{
      success: boolean;

      metrics: SupportMetrics;

      attention: SupportAttention;
    }>(
      "/admin/support/overview"
    ),

  /* =======================================================
     ADMINS / OWNERS
  ====================================================== */

  getAdmins: () =>
    apiClient<{
      success: boolean;

      admins: Array<{
        id: string;

        name: string;

        role?: string;
      }>;
    }>(
      "/admin/support/admins"
    ),

  /* =======================================================
     TICKETS
  ====================================================== */

  getTickets: (
    query: TicketListQuery = {}
  ) =>
    apiClient<{
      success: boolean;

      tickets:
        SupportTicketSummary[];

      pagination: {
        page: number;

        limit: number;

        total: number;

        pages: number;
      };
    }>(
      `/admin/support/tickets${buildQuery(
        {
          search:
            query.search,

          status:
            query.status,

          priority:
            query.priority,

          category:
            query.category,

          sla:
            query.sla,

          page:
            query.page,

          limit:
            query.limit,
        }
      )}`
    ),

  /* =======================================================
     SINGLE TICKET
  ====================================================== */

  getTicket: (
    ticketId: string
  ) =>
    apiClient<{
      success: boolean;

      ticket:
        SupportTicketDetail;
    }>(
      `/admin/support/tickets/${encodeURIComponent(
        ticketId
      )}`
    ),

  /* =======================================================
     CREATE TICKET
  ====================================================== */

  createTicket: (
    payload: CreateSupportTicketInput
  ) =>
    apiClient<TicketResponse>(
      "/admin/support/tickets",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  /* =======================================================
     UPDATE TICKET
  ====================================================== */

  updateTicket: (
    ticketId: string,

    payload: Partial<{
      status: TicketStatus;

      priority:
        TicketPriority;

      category:
        TicketCategory;

      assigneeAdminId:
        | string
        | null;

      tags: string[];
    }>
  ) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(
        ticketId
      )}`,
      {
        method: "PATCH",

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  /* =======================================================
     PUBLIC REPLY
  ====================================================== */

  addReply: (
    ticketId: string,

    body: string
  ) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(
        ticketId
      )}/messages`,
      {
        method: "POST",

        body:
          JSON.stringify({
            body,
          }),
      }
    ),

  /* =======================================================
     INTERNAL NOTE
  ====================================================== */

  addInternalNote: (
    ticketId: string,

    body: string
  ) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(
        ticketId
      )}/notes`,
      {
        method: "POST",

        body:
          JSON.stringify({
            body,
          }),
      }
    ),

  /* =======================================================
     ESCALATE
  ====================================================== */

  escalate: (
    ticketId: string,

    reason: string
  ) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(
        ticketId
      )}/escalate`,
      {
        method: "POST",

        body:
          JSON.stringify({
            reason,
          }),
      }
    ),

  /* =======================================================
     RESOLVE
  ====================================================== */

  resolve: (
    ticketId: string,

    resolution: string
  ) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(
        ticketId
      )}/resolve`,
      {
        method: "POST",

        body:
          JSON.stringify({
            resolution,
          }),
      }
    ),

  /* =======================================================
     CUSTOMER SEARCH
  ====================================================== */

  searchCustomers: (
    params: {
      search?: string;

      role?:
        | SupportCustomerRole
        | "All";

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      customers:
        SupportCustomerSummary[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/customers${buildQuery(
        {
          search:
            params.search,

          role:
            params.role,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  /* =======================================================
     CUSTOMER DETAIL
  ====================================================== */

  getCustomer: (
    customerId: string
  ) =>
    apiClient<{
      success: boolean;

      customer:
        SupportCustomerProfile;
    }>(
      `/admin/support/customers/${encodeURIComponent(
        customerId
      )}`
    ),

  /* =======================================================
     CONVERSATIONS
  ====================================================== */

  getConversations: (
    params: {
      search?: string;

      status?:
        | TicketStatus
        | "All";

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      conversations:
        SupportConversationSummary[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/conversations${buildQuery(
        {
          search:
            params.search,

          status:
            params.status,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  getConversation: (
    ticketId: string
  ) =>
    apiClient<{
      success: boolean;

      conversation:
        SupportConversationDetail;
    }>(
      `/admin/support/conversations/${encodeURIComponent(
        ticketId
      )}`
    ),

  /* =======================================================
     ESCALATIONS
  ====================================================== */

  getEscalations: (
    params: {
      search?: string;

      priority?:
        | TicketPriority
        | "All";

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      escalations:
        SupportEscalation[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/escalations${buildQuery(
        {
          search:
            params.search,

          priority:
            params.priority,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  getEscalation: (
    ticketId: string
  ) =>
    apiClient<{
      success: boolean;

      escalation:
        SupportEscalationDetail;
    }>(
      `/admin/support/escalations/${encodeURIComponent(
        ticketId
      )}`
    ),

  /* =======================================================
     SLA
  ====================================================== */

  getSla: (
    params: {
      search?: string;

      status?:
        | TicketStatus
        | "All";

      priority?:
        | TicketPriority
        | "All";

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      tickets:
        SupportSlaTicket[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/sla${buildQuery(
        {
          search:
            params.search,

          status:
            params.status,

          priority:
            params.priority,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  getSlaSummary: () =>
    apiClient<{
      success: boolean;

      summary:
        SupportSlaSummary;
    }>(
      "/admin/support/sla/summary"
    ),

  /* =======================================================
     AI COPILOT
  ====================================================== */

  analyzeTicket: (
    ticketId: string
  ) =>
    apiClient<{
      success: boolean;

      analysis:
        SupportAiAnalysis;

      message?: string;
    }>(
      `/admin/support/tickets/${encodeURIComponent(
        ticketId
      )}/ai-analysis`,
      {
        method: "POST",
      }
    ),

  /* =======================================================
     ANALYTICS
  ====================================================== */

  getAnalytics: (
    days = 30
  ) =>
    apiClient<{
      success: boolean;

      analytics:
        SupportAnalytics;
    }>(
      `/admin/support/analytics${buildQuery(
        {
          days,
        }
      )}`
    ),

  /* =======================================================
     ACTIVITY
  ====================================================== */

  getActivity: (
    params: {
      search?: string;

      eventType?: string;

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      activities:
        SupportActivityLog[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/activity${buildQuery(
        {
          search:
            params.search,

          eventType:
            params.eventType,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  /* =======================================================
     KNOWLEDGE BASE
  ====================================================== */

  getKnowledgeBase: (
    params: {
      search?: string;

      category?: string;

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      articles:
        SupportKnowledgeBaseArticle[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/knowledge-base${buildQuery(
        {
          search:
            params.search,

          category:
            params.category,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  getKnowledgeBaseArticle: (
    articleId: string
  ) =>
    apiClient<{
      success: boolean;

      article:
        SupportKnowledgeBaseDetail;
    }>(
      `/admin/support/knowledge-base/${encodeURIComponent(
        articleId
      )}`
    ),

  /* =======================================================
     SAVED REPLIES
  ====================================================== */

  getSavedReplies: (
    params: {
      search?: string;

      category?: string;

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      replies:
        SupportSavedReply[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/saved-replies${buildQuery(
        {
          search:
            params.search,

          category:
            params.category,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  getSavedReply: (
    replyId: string
  ) =>
    apiClient<{
      success: boolean;

      reply:
        SupportSavedReply;
    }>(
      `/admin/support/saved-replies/${encodeURIComponent(
        replyId
      )}`
    ),

  /* =======================================================
     ACCOUNT ISSUES
  ====================================================== */

  getAccountIssues: (
    params: {
      search?: string;

      status?:
        | TicketStatus
        | "All";

      priority?:
        | TicketPriority
        | "All";

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      issues:
        SupportAccountIssue[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/account-issues${buildQuery(
        {
          search:
            params.search,

          status:
            params.status,

          priority:
            params.priority,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  /* =======================================================
     KYC CASES
  ====================================================== */

  getKycCases: (
    params: {
      search?: string;

      status?:
        | TicketStatus
        | "All";

      priority?:
        | TicketPriority
        | "All";

      kycStatus?: string;

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      cases:
        SupportKycCase[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/kyc${buildQuery(
        {
          search:
            params.search,

          status:
            params.status,

          priority:
            params.priority,

          kycStatus:
            params.kycStatus,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  /* =======================================================
     REFUND REQUESTS
  ====================================================== */

  getRefundRequests: (
    params: {
      search?: string;

      status?:
        | TicketStatus
        | "All";

      priority?:
        | TicketPriority
        | "All";

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      requests:
        SupportRefundRequest[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/refunds${buildQuery(
        {
          search:
            params.search,

          status:
            params.status,

          priority:
            params.priority,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  /* =======================================================
     DISPUTES
  ====================================================== */

  getDisputeCases: (
    params: {
      search?: string;

      status?:
        | TicketStatus
        | "All";

      priority?:
        | TicketPriority
        | "All";

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      cases:
        SupportDisputeCase[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/disputes${buildQuery(
        {
          search:
            params.search,

          status:
            params.status,

          priority:
            params.priority,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  /* =======================================================
     PAYMENT LOOKUP
  ====================================================== */

  searchPayments: (
    params: {
      search?: string;

      status?: string;

      provider?: string;

      sourceType?: string;

      mode?: string;

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      payments:
        SupportPayment[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/payments${buildQuery(
        {
          search:
            params.search,

          status:
            params.status,

          provider:
            params.provider,

          sourceType:
            params.sourceType,

          mode:
            params.mode,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  getPayment: (
    paymentId: string
  ) =>
    apiClient<{
      success: boolean;

      payment:
        SupportPayment & {
          support: {
            readOnly: true;

            canExecuteFinancialAction: false;
          };
        };
    }>(
      `/admin/support/payments/${encodeURIComponent(
        paymentId
      )}`
    ),

  /* =======================================================
     TRANSACTION LOOKUP
  ====================================================== */

  searchTransactions: (
    params: {
      search?: string;

      type?: string;

      status?: string;

      riskScore?: string;

      page?: number;

      limit?: number;
    }
  ) =>
    apiClient<{
      success: boolean;

      transactions:
        SupportTransaction[];

      total: number;

      page: number;

      limit: number;

      totalPages: number;
    }>(
      `/admin/support/transactions${buildQuery(
        {
          search:
            params.search,

          type:
            params.type,

          status:
            params.status,

          riskScore:
            params.riskScore,

          page:
            params.page,

          limit:
            params.limit,
        }
      )}`
    ),

  getTransaction: (
    transactionId: string
  ) =>
    apiClient<{
      success: boolean;

      transaction:
        SupportTransaction & {
          support: {
            readOnly: true;

            canExecuteFinancialAction: false;
          };
        };
    }>(
      `/admin/support/transactions/${encodeURIComponent(
        transactionId
      )}`
    ),
};
