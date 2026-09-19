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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FolderOpen,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Tag,
  X,
} from "lucide-react";

import {
  supportDashboardApi,
  type SupportSavedReply,
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

export default function SupportSavedRepliesPage() {
  const [
    replies,
    setReplies,
  ] =
    useState<
      SupportSavedReply[]
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
    selected,
    setSelected,
  ] =
    useState<
      SupportSavedReply | null
    >(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    copiedId,
    setCopiedId,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     LOAD REPLIES
  ======================================================= */

  const loadReplies =
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
            await supportDashboardApi.getSavedReplies(
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
              "Failed to load saved replies."
            );
          }

          setReplies(
            response.replies ??
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
              : "Failed to load saved replies."
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
        () =>
          void loadReplies(),
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [loadReplies]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    category,
  ]);

  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  const categories =
    useMemo(
      () =>
        Array.from(
          new Set(
            replies
              .map(
                (item) =>
                  item.category
              )
              .filter(
                Boolean
              )
          )
        ),
      [replies]
    );

  /* =======================================================
     OPEN REPLY
  ======================================================= */

  const openReply =
    useCallback(
      async (
        id: string
      ) => {
        setSelectedId(id);

        setSelected(null);

        setDetailLoading(
          true
        );

        try {
          const response =
            await supportDashboardApi.getSavedReply(
              id
            );

          if (
            !response.success ||
            !response.reply
          ) {
            throw new Error(
              "Failed to load saved reply."
            );
          }

          setSelected(
            response.reply
          );
        } catch {
          setSelected(null);
        } finally {
          setDetailLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     COPY REPLY
  ======================================================= */

  const copyReply =
    useCallback(
      async (
        reply: SupportSavedReply
      ) => {
        try {
          await navigator.clipboard.writeText(
            reply.content
          );

          setCopiedId(
            reply.id
          );

          window.setTimeout(
            () =>
              setCopiedId(
                null
              ),
            1400
          );
        } catch {
          setCopiedId(
            null
          );
        }
      },
      []
    );

  /* =======================================================
     PAGINATION
  ======================================================= */

  const paginationText =
    useMemo(() => {
      if (!total) {
        return "0 saved replies";
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

      return `${start}-${end} of ${total} replies`;
    }, [
      page,
      total,
    ]);

  return (
    <main className="min-h-screen bg-[#F6FBF8] p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* =================================================
            HEADER
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MessageSquareText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                  Support
                  Operations
                </p>

                <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                  Saved Replies
                </h1>

                <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500">
                  Find approved
                  reusable
                  responses and
                  copy them into
                  active support
                  conversations.
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
                void loadReplies(
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
                placeholder="Search title, shortcut, content or tag…"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[11px] font-semibold outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="relative">
              <FolderOpen className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                list="saved-reply-categories"
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
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-[10px] font-black outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />

              <datalist id="saved-reply-categories">
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
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </section>

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
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : replies.length ===
          0 ? (
          <div className="rounded-[28px] border border-emerald-100 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MessageSquareText className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-black text-slate-900">
              No saved
              replies found
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Try changing
              the search or
              category filter.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {replies.map(
              (
                reply,
                index
              ) => (
                <motion.article
                  key={
                    reply.id
                  }
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
                  className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-[0_16px_38px_rgba(16,185,129,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                      {
                        reply.category
                      }
                    </span>

                    <span className="font-mono text-[8px] font-black text-slate-400">
                      /
                      {
                        reply.shortcut
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void openReply(
                        reply.id
                      )
                    }
                    className="mt-4 block w-full text-left"
                  >
                    <h2 className="line-clamp-2 text-sm font-black leading-5 text-slate-900 hover:text-emerald-700">
                      {
                        reply.title
                      }
                    </h2>

                    <p className="mt-2 line-clamp-4 min-h-[72px] whitespace-pre-wrap text-[10px] leading-[18px] text-slate-500">
                      {
                        reply.content
                      }
                    </p>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {reply.tags
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
                    <span className="text-[8px] text-slate-400">
                      Updated{" "}
                      {formatDate(
                        reply.updatedAt
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        void copyReply(
                          reply
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[8px] font-black transition ${
                        copiedId ===
                        reply.id
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {copiedId ===
                      reply.id ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}

                      {copiedId ===
                      reply.id
                        ? "Copied"
                        : "Copy reply"}
                    </button>
                  </div>
                </motion.article>
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
              className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-emerald-100 bg-[#F9FCFA] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-emerald-100 bg-white p-5 sm:p-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-500">
                    Saved Reply
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    {selected?.title ||
                      "Reply details"}
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
                ) : selected ? (
                  <div className="space-y-4">
                    <section className="rounded-[24px] border border-emerald-100 bg-white p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black text-emerald-700">
                          {
                            selected.category
                          }
                        </span>

                        <span className="font-mono text-[8px] font-black text-slate-400">
                          /
                          {
                            selected.shortcut
                          }
                        </span>
                      </div>

                      <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-[11px] leading-6 text-slate-700">
                        {
                          selected.content
                        }
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void copyReply(
                            selected
                          )
                        }
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-[9px] font-black text-white hover:bg-emerald-700"
                      >
                        <Copy className="h-3.5 w-3.5" />

                        Copy full
                        reply
                      </button>
                    </section>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] font-bold text-rose-700">
                    Unable to
                    load this
                    saved reply.
                  </div>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}