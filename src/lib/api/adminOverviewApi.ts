import type {
  AdminOverviewResponse,
  OverviewRange,
} from "@/types/adminOverview";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "digital_wallet_token";

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const adminOverviewApi = {
  getOverview: (range: OverviewRange, signal?: AbortSignal) =>
    apiRequest<AdminOverviewResponse>(
      `/admin/overview?range=${encodeURIComponent(range)}`,
      { signal },
    ),

  async exportOverview(range: OverviewRange) {
    const token = getAccessToken();
    const response = await fetch(
      `${API_BASE}/admin/overview/export?range=${encodeURIComponent(range)}`,
      {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(payload?.message ?? "Could not export overview report.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `admin-overview-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};

