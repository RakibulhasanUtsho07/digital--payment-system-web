const rawApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

/* Accept a host URL with or without the trailing /api segment. */
const API_URL = /\/api$/i.test(rawApiUrl)
  ? rawApiUrl
  : `${rawApiUrl}/api`;

/* =========================================================
   API ERROR TYPE
========================================================= */

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

/* =========================================================
   ABORT ERROR HELPER
========================================================= */

export function isApiAbortError(
  error: unknown
): boolean {
  /*
   * Browser fetch normally throws DOMException:
   *
   * name = "AbortError"
   *
   * Error check is also included because different
   * runtimes may expose the aborted request differently.
   */

  if (
    typeof DOMException !==
      "undefined" &&
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return true;
  }

  if (
    error instanceof Error &&
    error.name === "AbortError"
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   API CLIENT
========================================================= */

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    headers,
    body,
    ...rest
  } = options;

  /* =======================================================
     CREATE HEADERS
  ======================================================== */

  const requestHeaders =
    new Headers(headers);

  /* =======================================================
     CHECK FORMDATA
  ======================================================== */

  const isFormData =
    typeof FormData !==
      "undefined" &&
    body instanceof FormData;

  /* =======================================================
     CONTENT TYPE HANDLING
  ======================================================== */

  if (isFormData) {
    /*
     * IMPORTANT:
     *
     * FormData হলে Content-Type manually set করা যাবে না।
     *
     * Browser automatically set করবে:
     *
     * multipart/form-data;
     * boundary=----WebKitFormBoundary...
     */

    requestHeaders.delete(
      "Content-Type"
    );

    requestHeaders.delete(
      "content-type"
    );
  } else if (
    body !== undefined &&
    body !== null &&
    !requestHeaders.has(
      "Content-Type"
    )
  ) {
    /*
     * Normal JSON request
     */

    requestHeaders.set(
      "Content-Type",
      "application/json"
    );
  }

  /* =======================================================
     REQUEST URL
  ======================================================== */

  const url =
    `${API_URL}${endpoint}`;

  /* =======================================================
     FETCH
  ======================================================== */

  let response: Response;

  try {
    response =
      await fetch(
        url,
        {
          ...rest,

          headers:
            requestHeaders,

          body,

          credentials:
            "include",

          cache:
            "no-store",
        }
      );
  } catch (error) {
    /* =====================================================
       EXPECTED REQUEST CANCELLATION

       These are normal situations:
       - component unmount
       - route change
       - filter change
       - new request replacing old request
       - React development Strict Mode lifecycle

       Abort is NOT a real network error.
       So do NOT console.error it.
    ===================================================== */

    if (
      isApiAbortError(
        error
      )
    ) {
      throw error;
    }

    /* =====================================================
       REAL NETWORK ERROR
    ===================================================== */

    console.error(
      "API NETWORK ERROR:",
      error
    );

    throw new Error(
      "Unable to connect to the server."
    );
  }

  /* =======================================================
     READ RESPONSE AS TEXT FIRST
  ======================================================== */

  let rawText =
    "";

  try {
    rawText =
      await response.text();
  } catch (error) {
    /*
     * response.text() can also be interrupted
     * when the request is aborted.
     */

    if (
      isApiAbortError(
        error
      )
    ) {
      throw error;
    }

    console.error(
      "API RESPONSE READ ERROR:",
      error
    );

    rawText =
      "";
  }

  /* =======================================================
     PARSE RESPONSE SAFELY
  ======================================================== */

  let data: unknown =
    null;

  if (
    rawText
  ) {
    try {
      data =
        JSON.parse(
          rawText
        );
    } catch {
      /*
       * Server may return HTML/text error.
       *
       * Do not crash with JSON.parse error.
       */

      data = {
        message:
          rawText,
      };
    }
  }

  /* =======================================================
     HANDLE HTTP ERROR
  ======================================================== */

  if (
    !response.ok
  ) {
    let message =
      `Request failed with status ${response.status}.`;

    if (
      typeof data ===
        "object" &&
      data !== null
    ) {
      const errorData =
        data as ApiErrorResponse;

      if (
        typeof errorData.message ===
          "string" &&
        errorData.message.trim()
      ) {
        message =
          errorData.message;
      } else if (
        typeof errorData.error ===
          "string" &&
        errorData.error.trim()
      ) {
        message =
          errorData.error;
      }
    }

    /*
     * Prevent huge HTML/server body
     * from being displayed in the UI.
     */

    if (
      message.length >
      500
    ) {
      message =
        `Server error (${response.status}). Please try again.`;
    }

    throw new Error(
      message
    );
  }

  /* =======================================================
     EMPTY SUCCESS RESPONSE
  ======================================================== */

  if (
    !rawText
  ) {
    return {} as T;
  }

  /* =======================================================
     SUCCESS
  ======================================================== */

  return data as T;
}
