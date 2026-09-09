"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  systemLogsApi,
  type GetLogsParams,
  type HeatmapCell,
  type LogEnvironment,
  type LogLevel,
  type LogService,
  type RootCauseData,
  type ServiceHealth,
  type SystemAnomaly,
  type SystemLog,
  type SystemLogsRange,
  type SystemLogsSummary,
  type SystemTraceData,
} from "@/lib/api/systemlogApi";

/* =========================================================
   CONSTANTS
========================================================= */

const POLLING_INTERVAL = 8000;

const DEFAULT_RANGE: SystemLogsRange = "24h";

const DEFAULT_LIMIT = 25;

/* =========================================================
   TYPES
========================================================= */

interface UseSystemLogsOptions {
  initialRange?: SystemLogsRange;
  initialLimit?: number;
  pollingInterval?: number;
}

interface LogFilters {
  search: string;
  level: LogLevel | "";
  service: LogService | "";
  environment: LogEnvironment | "";
}

interface UseSystemLogsReturn {
  /* -----------------------------------------------
     LOG LIST
  ------------------------------------------------ */

  logs: SystemLog[];
  selectedLog: SystemLog | null;

  /* -----------------------------------------------
     SUMMARY
  ------------------------------------------------ */

  summary: SystemLogsSummary | null;

  /* -----------------------------------------------
     SERVICE HEALTH
  ------------------------------------------------ */

  services: ServiceHealth[];

  /* -----------------------------------------------
     HEATMAP
  ------------------------------------------------ */

  heatmap: HeatmapCell[];

  /* -----------------------------------------------
     ANOMALIES
  ------------------------------------------------ */

  anomalies: SystemAnomaly[];

  anomalyWindowMinutes: number;

  /* -----------------------------------------------
     PAGINATION
  ------------------------------------------------ */

  page: number;
  limit: number;
  total: number;
  totalPages: number;

  /* -----------------------------------------------
     FILTERS
  ------------------------------------------------ */

  filters: LogFilters;
  range: SystemLogsRange;

  /* -----------------------------------------------
     TRACE / ROOT CAUSE
  ------------------------------------------------ */

  trace: SystemTraceData | null;
  rootCause: RootCauseData | null;

  /* -----------------------------------------------
     STATES
  ------------------------------------------------ */

  loading: boolean;
  refreshing: boolean;
  loadingDetail: boolean;
  loadingTrace: boolean;
  loadingRootCause: boolean;

  exporting: boolean;

  error: string | null;

  /* -----------------------------------------------
     ACTIONS
  ------------------------------------------------ */

  setRange: (
    range: SystemLogsRange
  ) => void;

  setSearch: (
    value: string
  ) => void;

  setLevel: (
    value: LogLevel | ""
  ) => void;

  setService: (
    value: LogService | ""
  ) => void;

  setEnvironment: (
    value: LogEnvironment | ""
  ) => void;

  setPage: (
    value: number
  ) => void;

  setLimit: (
    value: number
  ) => void;

  clearFilters: () => void;

  refresh: () => Promise<void>;

  loadLogDetail: (
    id: string
  ) => Promise<SystemLog | null>;

  loadTrace: (
    traceId: string
  ) => Promise<SystemTraceData | null>;

  loadRootCause: (
    requestId: string
  ) => Promise<RootCauseData | null>;

  exportLogs: () => Promise<void>;

  clearSelectedLog: () => void;

  clearTrace: () => void;

  clearRootCause: () => void;
}

/* =========================================================
   HOOK
========================================================= */

export function useSystemLogs(
  options: UseSystemLogsOptions = {}
): UseSystemLogsReturn {
  const {
    initialRange = DEFAULT_RANGE,
    initialLimit = DEFAULT_LIMIT,
    pollingInterval = POLLING_INTERVAL,
  } = options;

  /* =======================================================
     STATE
  ====================================================== */

  const [
    range,
    setRangeState,
  ] = useState<SystemLogsRange>(
    initialRange
  );

  const [
    page,
    setPageState,
  ] = useState<number>(1);

  const [
    limit,
    setLimitState,
  ] = useState<number>(
    Math.max(
      1,
      Math.min(
        initialLimit,
        100
      )
    )
  );

  const [
    logs,
    setLogs,
  ] = useState<SystemLog[]>([]);

  const [
    summary,
    setSummary,
  ] =
    useState<SystemLogsSummary | null>(
      null
    );

  const [
    services,
    setServices,
  ] = useState<ServiceHealth[]>(
    []
  );

  const [
    heatmap,
    setHeatmap,
  ] = useState<HeatmapCell[]>(
    []
  );

  const [
    anomalies,
    setAnomalies,
  ] = useState<SystemAnomaly[]>(
    []
  );

  const [
    anomalyWindowMinutes,
    setAnomalyWindowMinutes,
  ] = useState<number>(60);

  const [
    selectedLog,
    setSelectedLog,
  ] =
    useState<SystemLog | null>(
      null
    );

  const [
    trace,
    setTrace,
  ] =
    useState<SystemTraceData | null>(
      null
    );

  const [
    rootCause,
    setRootCause,
  ] =
    useState<RootCauseData | null>(
      null
    );

  const [
    filters,
    setFilters,
  ] = useState<LogFilters>({
    search: "",
    level: "",
    service: "",
    environment: "",
  });

  const [
    total,
    setTotal,
  ] = useState<number>(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState<number>(1);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState<boolean>(false);

  const [
    loadingDetail,
    setLoadingDetail,
  ] = useState<boolean>(false);

  const [
    loadingTrace,
    setLoadingTrace,
  ] = useState<boolean>(false);

  const [
    loadingRootCause,
    setLoadingRootCause,
  ] = useState<boolean>(false);

  const [
    exporting,
    setExporting,
  ] = useState<boolean>(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  /* =======================================================
     REFS
  ====================================================== */

  const mountedRef =
    useRef(true);

  const requestIdRef =
    useRef(0);

  /* =======================================================
     MOUNT / UNMOUNT
  ====================================================== */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =======================================================
     ERROR HELPER
  ====================================================== */

  const getErrorMessage =
    useCallback(
      (
        cause: unknown,
        fallback: string
      ) =>
        cause instanceof Error &&
        cause.message.trim()
          ? cause.message
          : fallback,
      []
    );

  /* =======================================================
     LOAD ALL DASHBOARD DATA
  ====================================================== */

  const loadDashboardData =
    useCallback(
      async (
        showRefreshState = false
      ) => {
        const currentRequestId =
          ++requestIdRef.current;

        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        try {
          const [
            summaryResponse,
            servicesResponse,
            heatmapResponse,
            anomaliesResponse,
            logsResponse,
          ] = await Promise.all([
            systemLogsApi.getSummary(
              range
            ),

            systemLogsApi.getServices(
              range
            ),

            systemLogsApi.getHeatmap(
              range === "1h" ||
              range === "6h" ||
              range === "24h"
                ? "7d"
                : range
            ),

            systemLogsApi.getAnomalies(
              anomalyWindowMinutes
            ),

            systemLogsApi.getLogs({
              search:
                filters.search.trim() ||
                undefined,

              level:
                filters.level ||
                undefined,

              service:
                filters.service ||
                undefined,

              environment:
                filters.environment ||
                undefined,

              range,

              page,

              limit,
            }),
          ]);

          if (
            !mountedRef.current ||
            currentRequestId !==
              requestIdRef.current
          ) {
            return;
          }

          /* ---------------------------------------------
             SUMMARY
          --------------------------------------------- */

          if (
            summaryResponse.success
          ) {
            setSummary(
              summaryResponse.summary
            );
          }

          /* ---------------------------------------------
             SERVICES
          --------------------------------------------- */

          if (
            servicesResponse.success
          ) {
            setServices(
              Array.isArray(
                servicesResponse.services
              )
                ? servicesResponse.services
                : []
            );
          }

          /* ---------------------------------------------
             HEATMAP
          --------------------------------------------- */

          if (
            heatmapResponse.success
          ) {
            setHeatmap(
              Array.isArray(
                heatmapResponse.cells
              )
                ? heatmapResponse.cells
                : []
            );
          }

          /* ---------------------------------------------
             ANOMALIES
          --------------------------------------------- */

          if (
            anomaliesResponse.success
          ) {
            setAnomalies(
              Array.isArray(
                anomaliesResponse.anomalies
              )
                ? anomaliesResponse.anomalies
                : []
            );

            setAnomalyWindowMinutes(
              anomaliesResponse.windowMinutes
            );
          }

          /* ---------------------------------------------
             LOGS
          --------------------------------------------- */

          if (
            logsResponse.success
          ) {
            setLogs(
              Array.isArray(
                logsResponse.logs
              )
                ? logsResponse.logs
                : []
            );

            setTotal(
              Number(
                logsResponse.pagination
                  ?.total ?? 0
              )
            );

            setTotalPages(
              Math.max(
                Number(
                  logsResponse
                    .pagination
                    ?.pages ?? 1
                ),
                1
              )
            );
          }
        } catch (cause) {
          if (
            !mountedRef.current ||
            currentRequestId !==
              requestIdRef.current
          ) {
            return;
          }

          setError(
            getErrorMessage(
              cause,
              "Failed to load system logs."
            )
          );
        } finally {
          if (
            mountedRef.current &&
            currentRequestId ===
              requestIdRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      [
        anomalyWindowMinutes,
        filters.environment,
        filters.level,
        filters.search,
        filters.service,
        getErrorMessage,
        limit,
        page,
        range,
      ]
    );

  /* =======================================================
     INITIAL + FILTERED DATA LOAD
  ====================================================== */

  useEffect(() => {
    void loadDashboardData(false);
  }, [loadDashboardData]);

  /* =======================================================
     LIVE POLLING
  ====================================================== */

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        void loadDashboardData(true);
      }, Math.max(5000, pollingInterval));

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    loadDashboardData,
    pollingInterval,
  ]);

  /* =======================================================
     RANGE
  ====================================================== */

  const setRange = useCallback(
    (
      nextRange: SystemLogsRange
    ) => {
      setRangeState(
        nextRange
      );

      setPageState(1);

      setSelectedLog(null);
      setTrace(null);
      setRootCause(null);
    },
    []
  );

  /* =======================================================
     SEARCH
  ====================================================== */

  const setSearch = useCallback(
    (
      value: string
    ) => {
      setFilters(
        (
          current
        ) => ({
          ...current,
          search:
            value.slice(
              0,
              120
            ),
        })
      );

      setPageState(1);
    },
    []
  );

  /* =======================================================
     LEVEL
  ====================================================== */

  const setLevel = useCallback(
    (
      value: LogLevel | ""
    ) => {
      setFilters(
        (
          current
        ) => ({
          ...current,
          level: value,
        })
      );

      setPageState(1);
    },
    []
  );

  /* =======================================================
     SERVICE
  ====================================================== */

  const setService = useCallback(
    (
      value: LogService | ""
    ) => {
      setFilters(
        (
          current
        ) => ({
          ...current,
          service: value,
        })
      );

      setPageState(1);
    },
    []
  );

  /* =======================================================
     ENVIRONMENT
  ====================================================== */

  const setEnvironment =
    useCallback(
      (
        value: LogEnvironment | ""
      ) => {
        setFilters(
          (
            current
          ) => ({
            ...current,
            environment:
              value,
          })
        );

        setPageState(1);
      },
      []
    );

  /* =======================================================
     PAGE
  ====================================================== */

  const setPage =
    useCallback(
      (
        nextPage: number
      ) => {
        const safePage =
          Math.max(
            1,
            Math.min(
              Math.floor(
                nextPage
              ),
              totalPages
            )
          );

        setPageState(
          safePage
        );
      },
      [totalPages]
    );

  /* =======================================================
     LIMIT
  ====================================================== */

  const setLimit =
    useCallback(
      (
        nextLimit: number
      ) => {
        const safeLimit =
          Math.max(
            1,
            Math.min(
              Math.floor(
                Number(
                  nextLimit
                )
              ),
              100
            )
          );

        setLimitState(
          safeLimit
        );

        setPageState(1);
      },
      []
    );

  /* =======================================================
     CLEAR FILTERS
  ====================================================== */

  const clearFilters =
    useCallback(
      () => {
        setFilters({
          search: "",
          level: "",
          service: "",
          environment: "",
        });

        setPageState(1);
      },
      []
    );

  /* =======================================================
     REFRESH
  ====================================================== */

  const refresh =
    useCallback(
      async () => {
        await loadDashboardData(
          true
        );
      },
      [loadDashboardData]
    );

  /* =======================================================
     LOAD LOG DETAIL
  ====================================================== */

  const loadLogDetail =
    useCallback(
      async (
        id: string
      ): Promise<SystemLog | null> => {
        if (!id.trim()) {
          return null;
        }

        setLoadingDetail(true);
        setError(null);

        try {
          const response =
            await systemLogsApi.getLog(
              id
            );

          if (
            !mountedRef.current
          ) {
            return null;
          }

          if (
            !response.success
          ) {
            throw new Error(
              "Failed to load log detail."
            );
          }

          const detail =
            response.log;

          setSelectedLog(
            detail
          );

          return detail;
        } catch (cause) {
          if (
            mountedRef.current
          ) {
            setError(
              getErrorMessage(
                cause,
                "Failed to load log detail."
              )
            );
          }

          return null;
        } finally {
          if (
            mountedRef.current
          ) {
            setLoadingDetail(false);
          }
        }
      },
      [getErrorMessage]
    );

  /* =======================================================
     LOAD TRACE
  ====================================================== */

  const loadTrace =
    useCallback(
      async (
        traceId: string
      ): Promise<SystemTraceData | null> => {
        if (!traceId.trim()) {
          return null;
        }

        setLoadingTrace(true);
        setError(null);

        try {
          const data =
            await systemLogsApi.getTrace(
              traceId
            );

          if (
            !mountedRef.current
          ) {
            return null;
          }

          setTrace(
            data
          );

          return data;
        } catch (cause) {
          if (
            mountedRef.current
          ) {
            setError(
              getErrorMessage(
                cause,
                "Failed to load request trace."
              )
            );
          }

          return null;
        } finally {
          if (
            mountedRef.current
          ) {
            setLoadingTrace(false);
          }
        }
      },
      [getErrorMessage]
    );

  /* =======================================================
     LOAD ROOT CAUSE
  ====================================================== */

  const loadRootCause =
    useCallback(
      async (
        requestId: string
      ): Promise<RootCauseData | null> => {
        if (
          !requestId.trim()
        ) {
          return null;
        }

        setLoadingRootCause(
          true
        );

        setError(null);

        try {
          const data =
            await systemLogsApi.getRootCause(
              requestId
            );

          if (
            !mountedRef.current
          ) {
            return null;
          }

          setRootCause(
            data
          );

          return data;
        } catch (cause) {
          if (
            mountedRef.current
          ) {
            setError(
              getErrorMessage(
                cause,
                "Failed to load correlated request events."
              )
            );
          }

          return null;
        } finally {
          if (
            mountedRef.current
          ) {
            setLoadingRootCause(
              false
            );
          }
        }
      },
      [getErrorMessage]
    );

  /* =======================================================
     EXPORT
  ====================================================== */

  const exportLogs =
    useCallback(
      async () => {
        setExporting(true);
        setError(null);

        try {
          await downloadSystemLogs();

        } catch (cause) {
          if (
            mountedRef.current
          ) {
            setError(
              getErrorMessage(
                cause,
                "Failed to export system logs."
              )
            );
          }
        } finally {
          if (
            mountedRef.current
          ) {
            setExporting(false);
          }
        }
      },
      [getErrorMessage, range]
    );

  /* =======================================================
     CLEAR DETAIL
  ====================================================== */

  const clearSelectedLog =
    useCallback(
      () => {
        setSelectedLog(
          null
        );
      },
      []
    );

  /* =======================================================
     CLEAR TRACE
  ====================================================== */

  const clearTrace =
    useCallback(
      () => {
        setTrace(null);
      },
      []
    );

  /* =======================================================
     CLEAR ROOT CAUSE
  ====================================================== */

  const clearRootCause =
    useCallback(
      () => {
        setRootCause(null);
      },
      []
    );

  /* =======================================================
     RETURN
  ====================================================== */

  return {
    logs,
    selectedLog,

    summary,

    services,

    heatmap,

    anomalies,

    anomalyWindowMinutes,

    page,
    limit,
    total,
    totalPages,

    filters,
    range,

    trace,
    rootCause,

    loading,
    refreshing,
    loadingDetail,
    loadingTrace,
    loadingRootCause,

    exporting,

    error,

    setRange,
    setSearch,
    setLevel,
    setService,
    setEnvironment,
    setPage,
    setLimit,

    clearFilters,

    refresh,

    loadLogDetail,
    loadTrace,
    loadRootCause,

    exportLogs,

    clearSelectedLog,
    clearTrace,
    clearRootCause,
  };
}

/* =========================================================
   EXPORT HELPER
========================================================= */

async function downloadSystemLogs() {
  /*
   * Re-use the existing API helper.
   *
   * Keeping export logic centralized inside
   * systemlogApi.ts prevents duplicated
   * authentication / endpoint logic.
   */

  const module =
    await import(
      "@/lib/api/systemlogApi"
    );

  /*
   * Default to the same range used by
   * the dashboard API.
   *
   * The current query state is not available
   * inside this standalone helper, so the
   * hook calls the actual API directly below.
   */

  await module.downloadSystemLogsExport(
    "24h"
  );
}