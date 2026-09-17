import type {
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
  UserListResponse,
  UserRecord,
} from "@/app/(dashboard)/dashboard/users/components/UserManagementTypes";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? ""
).replace(/\/$/, "");

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(
    init?.headers
  );

  if (
    init?.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...init,
      credentials: "include",
      headers,
    }
  );

  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      payload?.message ??
        `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function toQueryString(
  query: UserListQuery
) {
  const params =
    new URLSearchParams();

  if (query.search) {
    params.set(
      "search",
      query.search
    );
  }

  if (query.page) {
    params.set(
      "page",
      String(query.page)
    );
  }

  if (query.pageSize) {
    params.set(
      "pageSize",
      String(query.pageSize)
    );
  }

  if (query.sort) {
    params.set(
      "sortField",
      query.sort.field
    );

    params.set(
      "sortDirection",
      query.sort.direction
    );
  }

  if (query.filters) {
    Object.entries(
      query.filters
    ).forEach(
      ([key, value]) => {
        if (value !== "all") {
          params.set(
            key,
            value
          );
        }
      }
    );
  }

  const queryString =
    params.toString();

  return queryString
    ? `?${queryString}`
    : "";
}

export const usersApi = {
  list: (
    query: UserListQuery = {}
  ) =>
    request<UserListResponse>(
      `/admin/users${toQueryString(query)}`
    ),

  create: (
    input: CreateUserInput
  ) =>
    request<UserRecord>(
      "/admin/users",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    ),

  update: (
    id: string,
    input: UpdateUserInput
  ) =>
    request<UserRecord>(
      `/admin/users/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    ),

  remove: (id: string) =>
    request<void>(
      `/admin/users/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    ),

  bulkUpdate: (
    ids: string[],
    input: UpdateUserInput
  ) =>
    request<{
      updated: number;
    }>("/admin/users/bulk", {
      method: "PATCH",
      body: JSON.stringify({
        ids,
        input,
      }),
    }),

  currentProfile: () =>
    request<{
      role: "Admin" | "User";
    }>("/auth/me"),
};