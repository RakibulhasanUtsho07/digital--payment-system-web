"use client";

import { apiClient } from "./client";

export type TicketStatus =
  | "Open"
  | "Waiting for Customer"
  | "In Progress"
  | "Escalated"
  | "Resolved";

export type TicketPriority = "Low" | "Normal" | "High" | "Urgent";

export type TicketCategory =
  | "Transfer"
  | "Withdrawal"
  | "Deposit"
  | "KYC"
  | "Security"
  | "Account"
  | "Payment"
  | "Other";

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
  waitingOn: "admin" | "customer" | "none";
  assignee: { id: string | null; name: string };
  slaMinutes: number;
  slaBreached: boolean;
  lastActivityAt: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  visibility: "public" | "internal";
  authorType: "admin" | "customer" | "system";
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

export interface SupportTicketDetail extends SupportTicketSummary {
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
  firstResponseAt: string | null;
  resolvedAt: string | null;
}

export interface TicketListQuery {
  search?: string;
  status?: TicketStatus | "All";
  priority?: TicketPriority | "All";
  category?: TicketCategory | "All";
  sla?: "All" | "Due Soon" | "Breached";
  page?: number;
  limit?: number;
}

export interface CreateSupportTicketInput {
  customerEmail: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  relatedReference?: string;
  tags?: string[];
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const buildQuery = (
  values: Record<string, string | number | undefined>
): string => {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === "" || value === "All") return;
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

type TicketResponse = {
  success: boolean;
  message: string;
  ticket: SupportTicketDetail;
};

export const supportApi = {
  getOverview: () =>
    apiClient<{
      success: boolean;
      metrics: SupportMetrics;
      attention: SupportAttention;
    }>("/admin/support/overview"),

  getTickets: (query: TicketListQuery = {}) =>
    apiClient<{
      success: boolean;
      tickets: SupportTicketSummary[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(
      `/admin/support/tickets${buildQuery({
        search: query.search,
        status: query.status,
        priority: query.priority,
        category: query.category,
        sla: query.sla,
        page: query.page,
        limit: query.limit,
      })}`
    ),

  getAdmins: () =>
    apiClient<{
      success: boolean;
      admins: Array<{ id: string; name: string }>;
    }>("/admin/support/admins"),

  getTicket: (ticketId: string) =>
    apiClient<{ success: boolean; ticket: SupportTicketDetail }>(
      `/admin/support/tickets/${encodeURIComponent(ticketId)}`
    ),

  createTicket: (payload: CreateSupportTicketInput) =>
    apiClient<TicketResponse>("/admin/support/tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTicket: (
    ticketId: string,
    payload: Partial<{
      status: TicketStatus;
      priority: TicketPriority;
      category: TicketCategory;
      assigneeAdminId: string | null;
      tags: string[];
    }>
  ) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(ticketId)}`,
      { method: "PATCH", body: JSON.stringify(payload) }
    ),

  addReply: (ticketId: string, body: string) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(ticketId)}/messages`,
      { method: "POST", body: JSON.stringify({ body }) }
    ),

  addInternalNote: (ticketId: string, body: string) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(ticketId)}/notes`,
      { method: "POST", body: JSON.stringify({ body }) }
    ),

  escalate: (ticketId: string, reason: string) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(ticketId)}/escalate`,
      { method: "POST", body: JSON.stringify({ reason }) }
    ),

  resolve: (ticketId: string, resolution: string) =>
    apiClient<TicketResponse>(
      `/admin/support/tickets/${encodeURIComponent(ticketId)}/resolve`,
      { method: "POST", body: JSON.stringify({ resolution }) }
    ),

  async downloadExport(query: TicketListQuery = {}) {
    const response = await fetch(
      `${API_BASE}/admin/support/export${buildQuery({
        search: query.search,
        status: query.status,
        priority: query.priority,
        category: query.category,
        sla: query.sla,
      })}`,
      { credentials: "include", cache: "no-store" }
    );

    if (!response.ok) {
      let message = "Unable to export support tickets.";
      try {
        const data = (await response.json()) as { message?: string };
        if (data.message) message = data.message;
      } catch {
        // Keep the safe fallback message for non-JSON responses.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `support-tickets-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  },
};
