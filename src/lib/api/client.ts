const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

type ApiOptions = RequestInit;

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { headers, ...rest } = options;

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...rest,

      headers: {
        "Content-Type": "application/json",
        ...headers,
      },

      // Backend HttpOnly access_token cookie পাঠাবে
      credentials: "include",

      cache: "no-store",
    }
  );

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message =
      "Something went wrong.";

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      message = String(
        (
          data as {
            message?: unknown;
          }
        ).message
      );
    }

    throw new Error(message);
  }

  return data as T;
}