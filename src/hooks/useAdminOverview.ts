"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOverviewApi } from "@/lib/api/adminOverviewApi";
import type {
  AdminOverviewResponse,
  OverviewRange,
} from "@/types/adminOverview";

export function useAdminOverview(initialRange: OverviewRange = "30d") {
  const [range, setRange] = useState<OverviewRange>(initialRange);
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal, refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const response = await adminOverviewApi.getOverview(range, signal);
      setData(response);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Could not load admin overview.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const exportReport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      await adminOverviewApi.exportOverview(range);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export report.");
    } finally {
      setExporting(false);
    }
  }, [range]);

  return {
    data,
    range,
    loading,
    refreshing,
    exporting,
    error,
    setRange,
    refresh: () => load(undefined, true),
    exportReport,
  };
}

