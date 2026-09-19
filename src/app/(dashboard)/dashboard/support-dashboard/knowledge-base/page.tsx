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
    <main className="min-h-screen bg-[#F6FBF8] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* =================================================
            HERO
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_14px_45px_rgba(16,185,129,0.06)] md:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                  Support
                  Operations
                </p>

                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                  Knowledge Base
                </h1>

                <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500">
                  Search
                  published
                  support
                  documentation,
                  troubleshooting
                  guidance and
                  reusable
                  internal
                  procedures.
                </p>
              </div>
            </div>

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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-[10px] font-black text-white shadow-[0_10px_24px_rgba(16,185,129,0.2)] transition hover:bg-emerald-700 disabled:opacity-60"
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
                : "Refresh"}
            </motion.button>
          </div>
        </motion.section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

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
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[11px] font-semibold text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="relative">
              <FolderOpen className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

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
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[10px] font-black text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-emerald-100 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />

              <p className="mt-3 text-[11px] font-black text-slate-700">
                Loading
                knowledge
                base…
              </p>
            </div>
          </div>
        ) : articles.length ===
          0 ? (
          <div className="rounded-[28px] border border-emerald-100 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-black text-slate-900">
              No articles
              found
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
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
                  className="group rounded-[24px] border border-emerald-100 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-[0_16px_38px_rgba(16,185,129,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                      {
                        article.category
                      }
                    </span>

                    <span className="text-[8px] font-semibold text-slate-400">
                      {formatDate(
                        article.updatedAt
                      )}
                    </span>
                  </div>

                  <h2 className="mt-4 line-clamp-2 text-sm font-black leading-5 text-slate-900 transition group-hover:text-emerald-700">
                    {
                      article.title
                    }
                  </h2>

                  <p className="mt-2 line-clamp-3 min-h-[54px] text-[10px] leading-[18px] text-slate-500">
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
                            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[7px] font-bold text-slate-500"
                          >
                            <Tag className="h-2.5 w-2.5" />

                            {
                              item
                            }
                          </span>
                        )
                      )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="font-mono text-[8px] text-slate-400">
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

        <section className="flex flex-col gap-3 rounded-[22px] border border-emerald-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-semibold text-slate-500">
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-20 rounded-xl bg-slate-50 px-3 py-2 text-center text-[9px] font-black text-slate-700">
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
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
            className="fixed inset-0 z-[120] bg-slate-950/35 backdrop-blur-sm"
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
              className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-emerald-100 bg-[#F9FCFA] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-emerald-100 bg-white p-5 sm:p-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-500">
                    Knowledge
                    Base
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
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
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {detailLoading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : detailError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-bold text-rose-700">
                    {
                      detailError
                    }
                  </div>
                ) : detail ? (
                  <div className="space-y-5">
                    <section className="rounded-[24px] border border-emerald-100 bg-white p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                          {
                            detail.category
                          }
                        </span>

                        <span className="text-[8px] font-semibold text-slate-400">
                          Updated{" "}
                          {formatDate(
                            detail.updatedAt
                          )}
                        </span>
                      </div>

                      {detail.summary && (
                        <p className="mt-4 text-[11px] leading-6 text-slate-600">
                          {
                            detail.summary
                          }
                        </p>
                      )}
                    </section>

                    <section className="rounded-[24px] border border-emerald-100 bg-white p-5">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-500">
                        Article
                        content
                      </p>

                      <div className="mt-4 whitespace-pre-wrap text-[11px] leading-6 text-slate-700">
                        {
                          detail.content
                        }
                      </div>
                    </section>

                    {detail.tags
                      .length >
                      0 && (
                      <section className="rounded-[24px] border border-emerald-100 bg-white p-5">
                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
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
                                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-bold text-slate-600"
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
    </main>
  );
}