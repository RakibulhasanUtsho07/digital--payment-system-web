/* =========================================================
   SAME-ORIGIN API BASE

   Browser:
   /api/backend/users/profile

   Next.js BFF internally forwards to:
   BACKEND_API_URL/users/profile
========================================================= */

const API_URL =
  "/api/backend";

/* =========================================================
   API ERROR TYPE
========================================================= */

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string;
}

/* =========================================================
   ABORT ERROR HELPER
========================================================= */

export function isApiAbortError(
  error: unknown
): boolean {
  if (
    typeof DOMException !==
      "undefined" &&
    error instanceof
      DOMException &&
    error.name ===
      "AbortError"
  ) {
    return true;
  }

  if (
    error instanceof Error &&
    error.name ===
      "AbortError"
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   NORMALIZE ENDPOINT
========================================================= */

function normalizeEndpoint(
  endpoint: string
): string {
  const value =
    endpoint.trim();

  if (!value) {
    return "";
  }

  return value.startsWith("/")
    ? value
    : `/${value}`;
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
    new Headers(
      headers
    );

  if (
    !requestHeaders.has(
      "Accept"
    )
  ) {
    requestHeaders.set(
      "Accept",
      "application/json"
    );
  }

  /* =======================================================
     CHECK FORMDATA
  ======================================================== */

  const isFormData =
    typeof FormData !==
      "undefined" &&
    body instanceof
      FormData;

  /* =======================================================
     CONTENT TYPE
  ======================================================== */

  if (
    isFormData
  ) {
    /*
     * Never manually set Content-Type
     * for FormData.
     *
     * Browser must generate the
     * multipart boundary.
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
    requestHeaders.set(
      "Content-Type",
      "application/json"
    );
  }

  /* =======================================================
     REQUEST URL
  ======================================================== */

  const normalizedEndpoint =
    normalizeEndpoint(
      endpoint
    );

  const url =
    `${API_URL}${normalizedEndpoint}`;

  /* =======================================================
     FETCH
  ======================================================== */

  let response:
    Response;

  try {
    response =
      await fetch(
        url,
        {
          ...rest,

          headers:
            requestHeaders,

          body,

          /*
           * IMPORTANT:
           *
           * access_token is now a cookie
           * on the frontend domain.
           *
           * This sends it to:
           *
           * /api/backend/*
           */
          credentials:
            "include",

          cache:
            "no-store",
        }
      );
  } catch (
    error
  ) {
    /* =====================================================
       ABORT IS NOT A NETWORK FAILURE
    ===================================================== */

    if (
      isApiAbortError(
        error
      )
    ) {
      throw error;
    }

    console.error(
      "API NETWORK ERROR:",
      {
        endpoint:
          normalizedEndpoint,

        error,
      }
    );

    throw new Error(
      "Unable to connect to the server."
    );
  }

  /* =======================================================
     READ RESPONSE
  ======================================================== */

  let rawText =
    "";

  try {
    rawText =
      await response.text();
  } catch (
    error
  ) {
    if (
      isApiAbortError(
        error
      )
    ) {
      throw error;
    }

    console.error(
      "API RESPONSE READ ERROR:",
      {
        endpoint:
          normalizedEndpoint,

        status:
          response.status,

        error,
      }
    );
  }

  /* =======================================================
     PARSE RESPONSE SAFELY
  ======================================================== */

  let data:
    unknown =
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
      data = {
        message:
          rawText,
      };
    }
  }

  /* =======================================================
     HANDLE HTTP ERRORS
  ======================================================== */

  if (
    !response.ok
  ) {
    let message =
      `Request failed with status ${response.status}.`;

    let errorCode:
      string |
      undefined;

    if (
      typeof data ===
        "object" &&
      data !== null
    ) {
      const errorData =
        data as
          ApiErrorResponse;

      if (
        typeof errorData
          .message ===
          "string" &&
        errorData
          .message
          .trim()
      ) {
        message =
          errorData.message;
      } else if (
        typeof errorData
          .error ===
          "string" &&
        errorData
          .error
          .trim()
      ) {
        message =
          errorData.error;
      }

      if (
        typeof errorData
          .code ===
          "string"
      ) {
        errorCode =
          errorData.code;
      }
    }

    /*
     * Never dump a huge HTML error page
     * into the UI.
     */
    if (
      message.length >
      500
    ) {
      message =
        `Server error (${response.status}). Please try again.`;
    }

    /*
     * Helpful debug without exposing
     * cookies or sensitive request data.
     */
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.warn(
        "API REQUEST FAILED:",
        {
          endpoint:
            normalizedEndpoint,

          status:
            response.status,

          code:
            errorCode,

          message,
        }
      );
    }

    const apiError =
      new Error(
        message
      );

    /*
     * Optional metadata for callers that
     * need HTTP status/code.
     */
    Object.assign(
      apiError,
      {
        status:
          response.status,

        code:
          errorCode,
      }
    );

    throw apiError;
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