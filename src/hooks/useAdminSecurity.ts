"use client";

import { useCallback, useEffect, useState } from "react";

import { getAdminSecurityOverview } from "@/lib/api/adminSecurityApi";
import { isApiAbortError } from "@/lib/api/client";
import type {
  AdminSecurityOverview,
  AdminSecurityRange,
} from "@/types/adminSecurity.types";

export function useAdminSecurity(range: AdminSecurityRange) {
  const [data, setData] = useState<AdminSecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await getAdminSecurityOverview(range);
        if (!controller.signal.aborted) setData(response.security);
      } catch (requestError) {
        if (!isApiAbortError(requestError) && !controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load security data.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [range, refreshKey]);

  return { data, loading, error, refresh };
}
