"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Loader2,
  RefreshCw,
  Search,
  Tag,
  X,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportKnowledgeBaseArticle,
  type SupportKnowledgeBaseDetail,
} from "@/lib/api/supportDashboardApi";

const PAGE_SIZE = 12;

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportKnowledgeBasePage() {
  const [
    articles,
    setArticles,
  ] = useState<
    SupportKnowledgeBaseArticle[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedId,
    setSelectedId,
  ] =
    useState<string | null>(
      null
    );

  const [
    detail,
    setDetail,
  ] =
    useState<
      SupportKnowledgeBaseDetail | null
    >(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    detailError,
    setDetailError,
  ] = useState("");

  /* =======================================================
     LOAD ARTICLES
  ======================================================= */

  const loadArticles =
    useCallback(
      async (
        isRefresh = false
      ) => {
        if (isRefresh) {
          setRefreshing(
            true
          );
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await supportDashboardApi.getKnowledgeBase(
              {
                search:
                  search.trim() ||
                  undefined,

                category:
                  category.trim() ||
                  undefined,

                page,

                limit:
                  PAGE_SIZE,
              }
            );

          if (
            !response.success
          ) {
            throw new Error(
              "Failed to load knowledge base."
            );
          }

          setArticles(
            response.articles ??
              []
          );

          setTotal(
            response.total ??
              0
          );

          setTotalPages(
            Math.max(
              1,
              response.totalPages ??
                1
            )
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : "Failed to load knowledge base."
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [
        category,
        page,
        search,
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadArticles();
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [loadArticles]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    category,
  ]);

  /* =======================================================
     OPEN ARTICLE
  ======================================================= */

  const openArticle =
    useCallback(
      async (
        articleId: string
      ) => {
        setSelectedId(
          articleId
        );

        setDetail(null);

        setDetailError("");

        setDetailLoading(
          true
        );

        try {
          const response =
            await supportDashboardApi.getKnowledgeBaseArticle(
              articleId
            );

          if (
            !response.success ||
            !response.article
          ) {
            throw new Error(
              "Failed to load article details."
            );
          }

          setDetail(
            response.article
          );
        } catch (
          requestError
        ) {
          setDetailError(
            requestError instanceof
              Error
              ? requestError.message
              : "Failed to load article details."
          );
        } finally {
          setDetailLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  const categories =
    useMemo(
      () =>
        Array.from(
          new Set(
            articles
              .map(
                (item) =>
                  item.category
              )
              .filter(
                Boolean
              )
          )
        ),
      [articles]
    );

  /* =======================================================
     PAGINATION TEXT
  ======================================================= */

  const paginationText =
    useMemo(() => {
      if (!total) {
        return "0 articles";
      }

      const start =
        (page - 1) *
          PAGE_SIZE +
        1;

      const end =
        Math.min(
          page *
            PAGE_SIZE,
          total
        );

      return `${start}-${end} of ${total} articles`;
    }, [
      page,
      total,
    ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-transparent p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* =================================================
            HERO
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: -14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="support-kb-hero relative overflow-hidden rounded-[30px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_20px_60px_rgba(16,185,129,0.22)]"
        >
          {/* Animated background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="support-kb-grid absolute inset-0 opacity-40" />
            <div className="support-kb-noise absolute inset-0 opacity-[0.13]" />

            <div className="support-kb-orb absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
            <div className="support-kb-orb-delayed absolute -bottom-28 left-[28%] h-72 w-72 rounded-full bg-cyan-200/15 blur-3xl" />

            <div className="support-kb-beam absolute -left-36 top-1/2 h-24 w-[420px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

            <div className="support-kb-ring support-kb-ring-one absolute -right-16 top-1/2 hidden h-[340px] w-[340px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
            <div className="support-kb-ring support-kb-ring-two absolute -right-2 top-1/2 hidden h-[230px] w-[230px] -translate-y-1/2 rounded-full border border-white/10 xl:block" />
          </div>

          <div className="relative z-10 grid min-h-[280px] gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:p-7 xl:grid-cols-[minmax(0,1fr)_420px] xl:p-8">
            {/* Hero copy */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-50 backdrop-blur-md sm:text-[10px]">
                <span className="support-kb-live-dot h-2 w-2 rounded-full bg-emerald-200" />
                Support Operations
                <span className="h-1 w-1 rounded-full bg-white/40" />
                Knowledge Workspace
              </div>

              <div className="mt-5 flex items-start gap-4">
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                    rotate: [0, 1.5, 0, -1.5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/15 bg-white/10 text-white shadow-[0_12px_30px_rgba(6,78,59,0.20)] backdrop-blur-md sm:h-16 sm:w-16"
                >
                  <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />

                  <span className="support-kb-icon-pulse absolute inset-0 rounded-[20px] border border-white/20" />
                </motion.div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[34px] lg:leading-[1.08]">
                    Knowledge Base
                  </h1>

                  <p className="mt-3 max-w-2xl text-[11px] leading-5 text-emerald-50/80 sm:text-xs sm:leading-6">
                    Search published support documentation, troubleshooting
                    guidance and reusable internal procedures from one organized
                    workspace.
                  </p>
                </div>
              </div>

              {/* Real-data stats */}
              <div className="mt-6 grid gap-2.5 min-[520px]:grid-cols-3">
                {[
                  {
                    label: "Published articles",
                    value: String(total),
                    icon: FileText,
                  },
                  {
                    label: "Visible categories",
                    value: String(categories.length),
                    icon: FolderOpen,
                  },
                  {
                    label: "Search mode",
                    value: "Live",
                    icon: Search,
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.label}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: 0.14 + index * 0.06,
                      }}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-3 backdrop-blur-md"
                    >
                      <div className="support-kb-card-shine absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <div className="relative flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                          <Icon className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-white/55">
                            {item.label}
                          </p>

                          <p className="mt-0.5 truncate text-sm font-black text-white">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <motion.button
                  type="button"
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() =>
                    void loadArticles(
                      true
                    )
                  }
                  disabled={
                    refreshing
                  }
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[10px] font-black text-emerald-700 shadow-[0_12px_28px_rgba(6,78,59,0.20)] transition hover:bg-emerald-50 disabled:opacity-60 sm:w-auto"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  {refreshing
                    ? "Refreshing…"
                    : "Refresh knowledge base"}
                </motion.button>

                <span className="inline-flex items-center justify-center gap-2 text-[9px] font-bold text-white/65 sm:justify-start">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_12px_rgba(167,243,208,0.85)]" />
                  Live results from the support API
                </span>
              </div>
            </div>

            {/* Animated knowledge visual */}
            <div className="relative mx-auto hidden h-[250px] w-full max-w-[420px] lg:block">
              <div className="support-kb-visual absolute left-1/2 top-1/2 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2">
                <div className="support-kb-core absolute left-1/2 top-1/2 flex h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[30px] border border-white/20 bg-white/10 shadow-[0_25px_60px_rgba(6,78,59,0.28)] backdrop-blur-xl">
                  <div className="flex h-[74px] w-[74px] items-center justify-center rounded-[24px] border border-white/15 bg-white/10 text-white">
                    <BookOpen className="h-8 w-8" />
                  </div>

                  <span className="support-kb-core-ring absolute -inset-3 rounded-[36px] border border-white/15" />
                  <span className="support-kb-core-ring support-kb-core-ring-delay absolute -inset-7 rounded-[44px] border border-white/10" />
                </div>

                <div className="support-kb-orbit support-kb-orbit-one absolute inset-1/2 h-[188px] w-[188px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20">
                  <div className="support-kb-orbit-item support-kb-orbit-item-one absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-kb-orbit support-kb-orbit-two absolute inset-1/2 h-[242px] w-[242px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10">
                  <div className="support-kb-orbit-item support-kb-orbit-item-two absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-emerald-950/25 text-white shadow-lg backdrop-blur">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                </div>

                <div className="support-kb-float-card support-kb-float-card-one absolute -left-12 top-8 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <Search className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Discover
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        Instant search
                      </p>
                    </div>
                  </div>
                </div>

                <div className="support-kb-float-card support-kb-float-card-two absolute -right-14 bottom-8 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <Tag className="h-3.5 w-3.5" />
                    </span>

                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/45">
                        Organized
                      </p>
                      <p className="mt-0.5 text-[9px] font-black text-white">
                        Categories & tags
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="support-kb-scan absolute left-1/2 top-1/2 h-[1px] w-[300px] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-100/65 to-transparent" />
            </div>
          </div>
        </motion.section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="rounded-[24px] border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Search title, summary, content or tags…"
                className="h-11 w-full rounded-2xl border border-border bg-muted/55 pl-11 pr-4 text-[11px] font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:bg-card focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <div className="relative">
              <FolderOpen className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                list="support-kb-categories"
                value={
                  category
                }
                onChange={(
                  event
                ) =>
                  setCategory(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Filter by category"
                className="h-11 w-full rounded-2xl border border-border bg-muted/55 pl-11 pr-4 text-[10px] font-black text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400 focus:bg-card focus:ring-4 focus:ring-emerald-500/10"
              />

              <datalist id="support-kb-categories">
                {categories.map(
                  (item) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    />
                  )
                )}
              </datalist>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");

                setCategory("");

                setPage(1);
              }}
              disabled={
                !search &&
                !category
              }
              className="h-11 rounded-2xl border border-border bg-muted/55 px-4 text-[10px] font-black text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-emerald-400"
            >
              Clear filters
            </button>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[10px] font-bold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-border bg-card">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />

              <p className="mt-3 text-[11px] font-black text-foreground">
                Loading
                knowledge
                base…
              </p>
            </div>
          </div>
        ) : articles.length ===
          0 ? (
          <div className="rounded-[28px] border border-border bg-card px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-black text-foreground">
              No articles
              found
            </p>

            <p className="mt-1 text-[10px] text-muted-foreground">
              Try changing
              your search or
              category
              filter.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map(
              (
                article,
                index
              ) => (
                <motion.button
                  key={
                    article.id
                  }
                  type="button"
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index *
                      0.035,
                  }}
                  whileHover={{
                    y: -4,
                  }}
                  onClick={() =>
                    void openArticle(
                      article.id
                    )
                  }
                  className="group rounded-[24px] border border-border bg-card p-5 text-left shadow-sm transition hover:border-emerald-500/30 hover:shadow-[0_16px_38px_rgba(16,185,129,0.10)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                      {
                        article.category
                      }
                    </span>

                    <span className="text-[8px] font-semibold text-muted-foreground">
                      {formatDate(
                        article.updatedAt
                      )}
                    </span>
                  </div>

                  <h2 className="mt-4 line-clamp-2 text-sm font-black leading-5 text-foreground transition group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {
                      article.title
                    }
                  </h2>

                  <p className="mt-2 line-clamp-3 min-h-[54px] text-[10px] leading-[18px] text-muted-foreground">
                    {article.summary ||
                      "Open this article to read the complete support guidance."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {article.tags
                      .slice(
                        0,
                        4
                      )
                      .map(
                        (
                          item
                        ) => (
                          <span
                            key={
                              item
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[7px] font-bold text-muted-foreground"
                          >
                            <Tag className="h-2.5 w-2.5" />

                            {
                              item
                            }
                          </span>
                        )
                      )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="font-mono text-[8px] text-muted-foreground">
                      /
                      {
                        article.slug
                      }
                    </span>

                    <span className="text-[9px] font-black text-emerald-600">
                      Read article
                    </span>
                  </div>
                </motion.button>
              )
            )}
          </section>
        )}

        {/* =================================================
            PAGINATION
        ================================================= */}

        <section className="flex flex-col gap-3 rounded-[22px] border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-semibold text-muted-foreground">
            {
              paginationText
            }
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={
                page <= 1
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.max(
                      1,
                      value - 1
                    )
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-40 dark:hover:text-emerald-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-20 rounded-xl bg-muted px-3 py-2 text-center text-[9px] font-black text-foreground">
              {page} /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              aria-label="Next page"
              disabled={
                page >=
                totalPages
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.min(
                      totalPages,
                      value + 1
                    )
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-40 dark:hover:text-emerald-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      {/* ===================================================
          DETAIL DRAWER
      ==================================================== */}

      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onMouseDown={() =>
              setSelectedId(
                null
              )
            }
            className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm"
          >
            <motion.aside
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                stiffness:
                  300,
                damping: 30,
              }}
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
              className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-border bg-background shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border bg-card p-5 sm:p-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                    Knowledge
                    Base
                  </p>

                  <h2 className="mt-1 text-xl font-black text-foreground">
                    {detail?.title ||
                      "Article details"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedId(
                      null
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:none] sm:p-6 [&::-webkit-scrollbar]:hidden">
                {detailLoading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : detailError ? (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    {
                      detailError
                    }
                  </div>
                ) : detail ? (
                  <div className="space-y-5">
                    <section className="rounded-[24px] border border-border bg-card p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                          {
                            detail.category
                          }
                        </span>

                        <span className="text-[8px] font-semibold text-muted-foreground">
                          Updated{" "}
                          {formatDate(
                            detail.updatedAt
                          )}
                        </span>
                      </div>

                      {detail.summary && (
                        <p className="mt-4 text-[11px] leading-6 text-muted-foreground">
                          {
                            detail.summary
                          }
                        </p>
                      )}
                    </section>

                    <section className="rounded-[24px] border border-border bg-card p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                        Article
                        content
                      </p>

                      <div className="mt-4 whitespace-pre-wrap text-[11px] leading-6 text-foreground/85">
                        {
                          detail.content
                        }
                      </div>
                    </section>

                    {detail.tags
                      .length >
                      0 && (
                      <section className="rounded-[24px] border border-border bg-card p-5">
                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                          Tags
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {detail.tags.map(
                            (
                              item
                            ) => (
                              <span
                                key={
                                  item
                                }
                                className="rounded-full border border-border bg-muted px-2.5 py-1 text-[8px] font-bold text-muted-foreground"
                              >
                                {
                                  item
                                }
                              </span>
                            )
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .support-kb-hero {
          isolation: isolate;
        }

        .support-kb-grid {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.055) 1px,
              transparent 1px
            );
          background-size: 28px 28px;
          mask-image: radial-gradient(
            circle at 55% 45%,
            rgba(0, 0, 0, 0.98),
            rgba(0, 0, 0, 0.3) 65%,
            transparent 100%
          );
          animation: supportGridMove 20s linear infinite;
        }

        .support-kb-noise {
          background-image:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.16) 0 1px, transparent 1px),
            radial-gradient(circle at 80% 30%, rgba(255,255,255,0.10) 0 1px, transparent 1px),
            radial-gradient(circle at 35% 80%, rgba(255,255,255,0.12) 0 1px, transparent 1px);
          background-size: 78px 78px, 96px 96px, 112px 112px;
          animation: supportNoiseDrift 26s linear infinite;
        }

        .support-kb-orb {
          animation: supportOrb 7.5s ease-in-out infinite;
        }

        .support-kb-orb-delayed {
          animation: supportOrb 9.5s ease-in-out 1.2s infinite reverse;
        }

        .support-kb-beam {
          animation: supportBeam 8s ease-in-out infinite;
        }

        .support-kb-ring {
          transform-origin: center;
        }

        .support-kb-ring-one {
          animation: supportRing 11s linear infinite;
        }

        .support-kb-ring-two {
          animation: supportRing 8s linear infinite reverse;
        }

        .support-kb-live-dot {
          box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.65);
          animation: supportLiveDot 2s ease-out infinite;
        }

        .support-kb-icon-pulse {
          animation: supportIconPulse 3s ease-out infinite;
        }

        .support-kb-card-shine {
          animation: supportCardShine 6.5s ease-in-out infinite;
        }

        .support-kb-core {
          animation: supportCoreFloat 5s ease-in-out infinite;
        }

        .support-kb-core-ring {
          animation: supportCoreRing 3.4s ease-out infinite;
        }

        .support-kb-core-ring-delay {
          animation-delay: 1.7s;
        }

        .support-kb-orbit {
          transform-origin: center;
        }

        .support-kb-orbit-one {
          animation: supportOrbit 13s linear infinite;
        }

        .support-kb-orbit-two {
          animation: supportOrbit 18s linear infinite reverse;
        }

        .support-kb-orbit-item {
          animation: supportOrbitCounter 13s linear infinite reverse;
        }

        .support-kb-orbit-item-two {
          animation-duration: 18s;
          animation-direction: normal;
        }

        .support-kb-float-card-one {
          animation: supportFloatCard 5.2s ease-in-out infinite;
        }

        .support-kb-float-card-two {
          animation: supportFloatCard 6.1s ease-in-out 0.8s infinite reverse;
        }

        .support-kb-scan {
          animation: supportScan 4.2s ease-in-out infinite;
          filter: drop-shadow(0 0 7px rgba(209, 250, 229, 0.6));
        }

        @keyframes supportGridMove {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(28px, 28px, 0);
          }
        }

        @keyframes supportNoiseDrift {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-42px, 26px, 0);
          }
        }

        @keyframes supportOrb {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate3d(0, -14px, 0) scale(1.08);
            opacity: 1;
          }
        }

        @keyframes supportBeam {
          0%,
          100% {
            transform: translate3d(0, -50%, 0);
            opacity: 0.22;
          }
          50% {
            transform: translate3d(90px, -50%, 0);
            opacity: 0.48;
          }
        }

        @keyframes supportRing {
          from {
            transform: translateY(-50%) rotate(0deg);
          }
          to {
            transform: translateY(-50%) rotate(360deg);
          }
        }

        @keyframes supportLiveDot {
          0% {
            box-shadow: 0 0 0 0 rgba(167, 243, 208, 0.55);
          }
          75%,
          100% {
            box-shadow: 0 0 0 8px rgba(167, 243, 208, 0);
          }
        }

        @keyframes supportIconPulse {
          0% {
            transform: scale(0.92);
            opacity: 0.45;
          }
          70%,
          100% {
            transform: scale(1.22);
            opacity: 0;
          }
        }

        @keyframes supportCardShine {
          0%,
          25% {
            transform: translateX(-180%);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          70%,
          100% {
            transform: translateX(460%);
            opacity: 0;
          }
        }

        @keyframes supportCoreFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) translateY(0) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-7px) rotate(1.5deg);
          }
        }

        @keyframes supportCoreRing {
          0% {
            transform: scale(0.88);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @keyframes supportOrbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes supportOrbitCounter {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }

        @keyframes supportFloatCard {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -9px, 0);
          }
        }

        @keyframes supportScan {
          0%,
          100% {
            transform: translate(-50%, -95px) scaleX(0.75);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, 0) scaleX(1);
            opacity: 0.95;
          }
          85% {
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, 95px) scaleX(0.75);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          .support-kb-grid {
            background-size: 24px 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-kb-grid,
          .support-kb-noise,
          .support-kb-orb,
          .support-kb-orb-delayed,
          .support-kb-beam,
          .support-kb-ring,
          .support-kb-live-dot,
          .support-kb-icon-pulse,
          .support-kb-card-shine,
          .support-kb-core,
          .support-kb-core-ring,
          .support-kb-orbit,
          .support-kb-orbit-item,
          .support-kb-float-card-one,
          .support-kb-float-card-two,
          .support-kb-scan {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}