"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FolderOpen,
  Hash,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  supportDashboardApi,
  type SupportSavedReply,
} from "@/lib/api/supportDashboardApi";

const PAGE_SIZE = 12;

const HERO_PARTICLES = [
  { left: "7%", top: "24%", size: 4, delay: 0.1, duration: 7.5 },
  { left: "18%", top: "72%", size: 3, delay: 1.2, duration: 8.7 },
  { left: "31%", top: "18%", size: 5, delay: 0.7, duration: 9.4 },
  { left: "44%", top: "76%", size: 4, delay: 2.0, duration: 7.9 },
  { left: "58%", top: "28%", size: 3, delay: 1.6, duration: 8.4 },
  { left: "72%", top: "68%", size: 5, delay: 0.4, duration: 10.1 },
  { left: "83%", top: "22%", size: 3, delay: 2.5, duration: 7.2 },
  { left: "92%", top: "70%", size: 4, delay: 1.4, duration: 9.1 },
] as const;

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

/* =========================================================
   PAGE
========================================================= */

export default function SupportSavedRepliesPage() {
  const [replies, setReplies] = useState<SupportSavedReply[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SupportSavedReply | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* =======================================================
     LOAD REPLIES
  ======================================================= */

  const loadReplies = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await supportDashboardApi.getSavedReplies({
          search: search.trim() || undefined,
          category: category.trim() || undefined,
          page,
          limit: PAGE_SIZE,
        });

        if (!response.success) {
          throw new Error("Failed to load saved replies.");
        }

        setReplies(response.replies ?? []);
        setTotal(response.total ?? 0);
        setTotalPages(Math.max(1, response.totalPages ?? 1));
      } catch (requestError) {
        setError(messageOf(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, page, search]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReplies();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadReplies]);

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  /* =======================================================
     CATEGORY OPTIONS
  ======================================================= */

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          replies
            .map((item) => item.category)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [replies]
  );

  /* =======================================================
     REAL PAGE ANALYTICS
  ======================================================= */

  const categoryChartData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const reply of replies) {
      const key = reply.category || "Uncategorized";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [replies]);

  const uniqueTags = useMemo(
    () =>
      new Set(
        replies.flatMap((reply) => reply.tags ?? [])
      ).size,
    [replies]
  );

  const visibleCategories = categoryChartData.length;

  /* =======================================================
     OPEN REPLY
  ======================================================= */

  const openReply = useCallback(async (id: string) => {
    setSelectedId(id);
    setSelected(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await supportDashboardApi.getSavedReply(id);

      if (!response.success || !response.reply) {
        throw new Error("Failed to load saved reply.");
      }

      setSelected(response.reply);
    } catch (requestError) {
      setSelected(null);
      setDetailError(messageOf(requestError));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  /* =======================================================
     COPY
  ======================================================= */

  const copyReply = useCallback(async (reply: SupportSavedReply) => {
    try {
      await navigator.clipboard.writeText(reply.content);

      setCopiedId(reply.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1400);
    } catch {
      setCopiedId(null);
    }
  }, []);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const paginationText = useMemo(() => {
    if (!total) {
      return "0 saved replies";
    }

    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, total);

    return `${start}-${end} of ${total} replies`;
  }, [page, total]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="support-saved-replies-page bg-transparent pb-8">
      <style jsx global>{`
        .support-saved-replies-page,
        .support-saved-replies-page * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .support-saved-replies-page::-webkit-scrollbar,
        .support-saved-replies-page *::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }
      `}</style>

      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* =================================================
            HERO — ALWAYS ANIMATED EMERALD
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 14,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative isolate overflow-hidden rounded-[30px] border border-emerald-300/25 bg-[linear-gradient(135deg,#10B981_0%,#059669_48%,#047857_100%)] p-6 text-white shadow-[0_28px_80px_-38px_rgba(5,150,105,.70)] md:p-7 lg:p-8"
        >
          {/* animated glow 1 */}
          <motion.div
            aria-hidden
            animate={{
              x: [0, 36, -14, 0],
              y: [0, -18, 12, 0],
              scale: [1, 1.14, 0.96, 1],
              opacity: [0.42, 0.72, 0.48, 0.42],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-emerald-200/30 blur-[95px]"
          />

          {/* animated glow 2 */}
          <motion.div
            aria-hidden
            animate={{
              x: [0, -26, 18, 0],
              y: [0, 20, -10, 0],
              scale: [1, 1.1, 0.97, 1],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -bottom-36 left-[18%] h-80 w-80 rounded-full bg-cyan-200/20 blur-[105px]"
          />

          {/* rotating orbit */}
          <motion.div
            aria-hidden
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "linear",
            }}
            className="pointer-events-none absolute right-[16%] top-1/2 hidden h-44 w-44 -translate-y-1/2 rounded-full border border-dashed border-white/20 xl:block"
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,.85)]" />
          </motion.div>

          {/* sweeping light */}
          <motion.div
            aria-hidden
            animate={{
              x: ["-25%", "125%"],
              opacity: [0, 0.35, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              repeatDelay: 1.4,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-xl"
          />

          {/* background pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* animated particles */}
          {HERO_PARTICLES.map((particle, index) => (
            <motion.span
              key={`${particle.left}-${particle.top}-${index}`}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-emerald-50 shadow-[0_0_14px_rgba(236,253,245,.85)]"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
              }}
              animate={{
                y: [0, -14, 6, 0],
                x: [0, 7, -4, 0],
                opacity: [0.2, 0.9, 0.4, 0.2],
                scale: [0.8, 1.25, 0.95, 0.8],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-emerald-50 backdrop-blur">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Saved Replies
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Support workflow
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-[-0.035em] md:text-3xl lg:text-[36px] lg:leading-[1.08]">
                Fast, consistent replies for every support conversation
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
                Search approved reusable responses, inspect the full reply,
                copy customer-ready content and keep support communication
                consistent without changing the existing backend workflow.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <HeroPill
                  icon={MessageSquareText}
                  label={`${total.toLocaleString("en-BD")} total replies`}
                />

                <HeroPill
                  icon={FolderOpen}
                  label={`${visibleCategories} visible categories`}
                />

                <HeroPill
                  icon={Tag}
                  label={`${uniqueTags} visible tags`}
                />
              </div>
            </div>

            <div className="relative shrink-0">
              <motion.div
                aria-hidden
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="pointer-events-none absolute -left-5 -top-5 hidden h-24 w-24 rounded-full border border-dashed border-white/20 xl:block"
              >
                <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,.95)]" />
              </motion.div>

              <motion.button
                type="button"
                whileHover={{
                  y: -2,
                  scale: 1.01,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                onClick={() => void loadReplies(true)}
                disabled={refreshing || loading}
                className="relative inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-black text-emerald-800 shadow-[0_12px_32px_rgba(0,0,0,.16)] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing || loading ? "animate-spin" : ""
                  }`}
                />

                Refresh replies
              </motion.button>
            </div>
          </div>

          {(refreshing || loading) && (
            <motion.div
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
              }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-white to-transparent"
            />
          )}
        </motion.section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={MessageSquareText}
            label="Visible Replies"
            value={loading ? "…" : replies.length.toLocaleString("en-BD")}
            description="Replies returned by the current API page"
            tone="emerald"
          />

          <SummaryCard
            icon={FolderOpen}
            label="Categories"
            value={loading ? "…" : visibleCategories.toLocaleString("en-BD")}
            description="Categories represented in the visible result set"
            tone="cyan"
          />

          <SummaryCard
            icon={Tag}
            label="Unique Tags"
            value={loading ? "…" : uniqueTags.toLocaleString("en-BD")}
            description="Unique reusable reply tags on this page"
            tone="violet"
          />

          <SummaryCard
            icon={Hash}
            label="Total Results"
            value={loading ? "…" : total.toLocaleString("en-BD")}
            description="Total replies matching the current server filters"
            tone="amber"
          />
        </section>

        {/* =================================================
            ANALYTICS + EMERALD INFO PANEL
        ================================================= */}

        <section className="grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
          <motion.article
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
            }}
            className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-border bg-emerald-500/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <BarChart3 className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-600">
                    Real visible data
                  </p>

                  <h2 className="mt-0.5 text-sm font-black text-foreground">
                    Reply category distribution
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Distribution of the replies returned on the current API page.
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                {replies.length} visible replies
              </span>
            </div>

            <div className="h-[310px] p-4 sm:p-5">
              {categoryChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
                  <div>
                    <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground/50" />

                    <p className="mt-3 text-xs font-black text-foreground">
                      No chart data yet
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Category distribution will appear when replies are loaded.
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    margin={{
                      top: 12,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeDasharray="4 6"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      minTickGap={14}
                      tick={{
                        fontSize: 9,
                        fill: "var(--muted-foreground)",
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 9,
                        fill: "var(--muted-foreground)",
                      }}
                    />

                    <Tooltip
                      cursor={{
                        fill: "rgba(16,185,129,.06)",
                      }}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--card-foreground)",
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: "0 18px 45px rgba(15,23,42,.12)",
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="Replies"
                      fill="#10B981"
                      radius={[9, 9, 3, 3]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.article>

          <motion.article
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.12,
            }}
            className="relative isolate overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(145deg,#10B981_0%,#059669_58%,#047857_100%)] p-5 text-white shadow-[0_22px_65px_-38px_rgba(5,150,105,.65)]"
          >
            <motion.div
              aria-hidden
              animate={{
                scale: [1, 1.12, 1],
                x: [0, 18, 0],
                opacity: [0.26, 0.5, 0.26],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-3xl"
            />

            <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]" />

            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10">
                <Sparkles className="h-5 w-5" />
              </span>

              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.17em] text-emerald-100">
                Reply library pulse
              </p>

              <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {total.toLocaleString("en-BD")}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-50/75">
                Server-side replies currently match your search and category scope.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <EmeraldMetric
                  label="Visible"
                  value={replies.length.toLocaleString("en-BD")}
                />

                <EmeraldMetric
                  label="Categories"
                  value={visibleCategories.toLocaleString("en-BD")}
                />

                <EmeraldMetric
                  label="Tags"
                  value={uniqueTags.toLocaleString("en-BD")}
                />

                <EmeraldMetric
                  label="Page"
                  value={`${page}/${totalPages}`}
                />
              </div>
            </div>
          </motion.article>
        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <motion.section
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.14,
          }}
          className="relative z-30 overflow-visible rounded-[26px] border border-emerald-500/15 bg-emerald-500/[0.055] p-4 shadow-sm"
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                Saved reply filters
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                Search real reply content and narrow the current server scope.
              </p>
            </div>

            {(search || category) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setPage(1);
                }}
                className="w-fit rounded-xl border border-emerald-500/15 bg-card px-3 py-2 text-[9px] font-black text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
            <label className="relative">
              <span className="mb-1.5 block px-1 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Search
              </span>

              <div className="group relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-emerald-600" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, shortcut, content or tag…"
                  className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-xs font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </label>

            <CategorySelect
              value={category}
              options={categories}
              onChange={setCategory}
            />
          </div>
        </motion.section>

        {/* =================================================
            ERROR
        ================================================= */}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-[10px] font-bold text-rose-700 dark:text-rose-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-border bg-card">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />

              <p className="mt-3 text-xs font-black text-foreground">
                Loading saved replies…
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                Reading the current support reply library.
              </p>
            </div>
          </div>
        ) : replies.length === 0 ? (
          <div className="rounded-[28px] border border-border bg-card px-6 py-16 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <MessageSquareText className="h-5 w-5" />
            </div>

            <p className="mt-4 text-sm font-black text-foreground">
              No saved replies found
            </p>

            <p className="mt-1 text-[10px] text-muted-foreground">
              Try changing the search or category filter.
            </p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {replies.map((reply, index) => (
              <motion.article
                key={reply.id}
                initial={{
                  opacity: 0,
                  y: 12,
                  filter: "blur(4px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  delay: index * 0.035,
                  duration: 0.38,
                }}
                whileHover={{
                  y: -4,
                }}
                className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-sm transition hover:border-emerald-500/20 hover:shadow-[0_18px_48px_-35px_rgba(5,150,105,.38)]"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-emerald-500/[0.05] blur-3xl transition group-hover:bg-emerald-500/[0.09]" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                      {reply.category}
                    </span>

                    <span className="rounded-lg bg-muted px-2 py-1 font-mono text-[8px] font-black text-muted-foreground">
                      /{reply.shortcut}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openReply(reply.id)}
                    className="mt-4 block w-full text-left"
                  >
                    <h2 className="line-clamp-2 text-sm font-black leading-5 text-foreground transition group-hover:text-emerald-600">
                      {reply.title}
                    </h2>

                    <p className="mt-2 line-clamp-4 min-h-[72px] whitespace-pre-wrap text-[10px] leading-[18px] text-muted-foreground">
                      {reply.content}
                    </p>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(reply.tags ?? []).slice(0, 4).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[7px] font-bold text-muted-foreground"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-[8px] text-muted-foreground">
                      Updated {formatDate(reply.updatedAt)}
                    </span>

                    <motion.button
                      type="button"
                      whileTap={{
                        scale: 0.95,
                      }}
                      onClick={() => void copyReply(reply)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[8px] font-black transition ${
                        copiedId === reply.id
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {copiedId === reply.id ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}

                      {copiedId === reply.id ? "Copied" : "Copy reply"}
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </section>
        )}

        {/* =================================================
            PAGINATION — EMERALD ACCENT
        ================================================= */}

        <section className="flex flex-col gap-3 rounded-[24px] border border-emerald-500/15 bg-emerald-500/[0.055] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-semibold text-muted-foreground">
            {paginationText}
          </p>

          <div className="flex items-center gap-2">
            <PageButton
              label="Previous page"
              disabled={page <= 1}
              onClick={() => {
                setPage((value) => Math.max(1, value - 1));
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </PageButton>

            <motion.span
              key={`${page}-${totalPages}`}
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="min-w-20 rounded-xl bg-emerald-600 px-3 py-2 text-center text-[9px] font-black text-white shadow-sm"
            >
              {page} / {totalPages}
            </motion.span>

            <PageButton
              label="Next page"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((value) => Math.min(totalPages, value + 1));
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </PageButton>
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
            onMouseDown={() => setSelectedId(null)}
            className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[5px]"
          >
            <motion.aside
              initial={{
                x: "100%",
                opacity: 0.85,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              exit={{
                x: "100%",
                opacity: 0.85,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              onMouseDown={(event) => event.stopPropagation()}
              className="absolute right-0 top-0 flex h-full w-full max-w-[580px] flex-col border-l border-border bg-background shadow-2xl"
            >
              <div className="relative overflow-hidden border-b border-emerald-400/20 bg-[linear-gradient(135deg,#10B981_0%,#059669_55%,#047857_100%)] p-5 text-white sm:p-6">
                <motion.div
                  aria-hidden
                  animate={{
                    scale: [1, 1.15, 1],
                    x: [0, 18, 0],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/15 blur-3xl"
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-emerald-100">
                      Saved Reply
                    </p>

                    <h2 className="mt-1 truncate text-xl font-black">
                      {selected?.title || "Reply details"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    aria-label="Close reply details"
                    onClick={() => setSelectedId(null)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                {detailLoading ? (
                  <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : detailError ? (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] p-4 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    {detailError}
                  </div>
                ) : selected ? (
                  <div className="space-y-4">
                    <section className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[8px] font-black text-emerald-700 dark:text-emerald-300">
                          {selected.category}
                        </span>

                        <span className="rounded-lg bg-muted px-2 py-1 font-mono text-[8px] font-black text-muted-foreground">
                          /{selected.shortcut}
                        </span>
                      </div>

                      <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-border bg-muted/45 p-4 text-[11px] leading-6 text-foreground">
                        {selected.content}
                      </div>

                      {(selected.tags ?? []).length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(selected.tags ?? []).map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[8px] font-bold text-muted-foreground"
                            >
                              <Tag className="h-2.5 w-2.5 text-emerald-600" />
                              {item}
                            </span>
                          ))}
                        </div>
                      )}

                      <motion.button
                        type="button"
                        whileHover={{
                          y: -1,
                        }}
                        whileTap={{
                          scale: 0.97,
                        }}
                        onClick={() => void copyReply(selected)}
                        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-[9px] font-black text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        {copiedId === selected.id ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}

                        {copiedId === selected.id
                          ? "Copied"
                          : "Copy full reply"}
                      </motion.button>
                    </section>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] p-4 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    Unable to load this saved reply.
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

/* =========================================================
   HERO PILL
========================================================= */

function HeroPill({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <motion.span
      whileHover={{
        y: -2,
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-[9px] font-black text-emerald-50 backdrop-blur"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </motion.span>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  tone: "emerald" | "cyan" | "violet" | "amber";
}) {
  const styles = {
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-600",
      glow: "bg-emerald-500/10",
      accent: "bg-emerald-500",
    },

    cyan: {
      icon: "bg-cyan-500/10 text-cyan-600",
      glow: "bg-cyan-500/10",
      accent: "bg-cyan-500",
    },

    violet: {
      icon: "bg-violet-500/10 text-violet-600",
      glow: "bg-violet-500/10",
      accent: "bg-violet-500",
    },

    amber: {
      icon: "bg-amber-500/10 text-amber-600",
      glow: "bg-amber-500/10",
      accent: "bg-amber-500",
    },
  }[tone];

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -4,
      }}
      className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-5 shadow-sm transition hover:shadow-lg"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`} />

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>

        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.article>
  );
}

/* =========================================================
   EMERALD METRIC
========================================================= */

function EmeraldMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="rounded-2xl border border-white/12 bg-white/[0.08] p-3 backdrop-blur"
    >
      <p className="text-[7px] font-black uppercase tracking-[0.14em] text-emerald-100/70">
        {label}
      </p>

      <p className="mt-1 text-base font-black text-white">
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   CUSTOM CATEGORY SELECT
========================================================= */

function CategorySelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const currentLabel = value || "All categories";

  return (
    <div
      ref={rootRef}
      className={`relative ${open ? "z-[90]" : "z-10"}`}
    >
      <span className="mb-1.5 block px-1 text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        Category
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-background px-3.5 text-left shadow-sm outline-none transition ${
          open
            ? "border-emerald-500/60 ring-4 ring-emerald-500/10"
            : "border-border hover:border-emerald-500/35"
        }`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <FolderOpen className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-black text-foreground">
            {currentLabel}
          </span>

          <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
            {value
              ? "Filter replies by this category"
              : "Show every available category"}
          </span>
        </span>

        <motion.span
          animate={{
            rotate: open ? 180 : 0,
          }}
          transition={{
            duration: 0.18,
          }}
          className="text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -6,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -5,
              scale: 0.98,
            }}
            transition={{
              duration: 0.16,
            }}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-64 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-[0_24px_70px_-20px_rgba(5,150,105,.30)]"
          >
            <CategoryOption
              active={!value}
              label="All categories"
              helper="Show replies across every category"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            />

            {options.map((option) => (
              <CategoryOption
                key={option}
                active={value === option}
                label={option}
                helper="Filter the reply library"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryOption({
  active,
  label,
  helper,
  onClick,
}: {
  active: boolean;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        active
          ? "bg-emerald-500/10"
          : "hover:bg-emerald-500/[0.06]"
      }`}
    >
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
          active
            ? "bg-emerald-600 text-white"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {active ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-black text-foreground">
          {label}
        </span>

        <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
          {helper}
        </span>
      </span>
    </button>
  );
}

/* =========================================================
   PAGE BUTTON
========================================================= */

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      whileHover={
        !disabled
          ? {
              y: -1,
              scale: 1.03,
            }
          : undefined
      }
      whileTap={
        !disabled
          ? {
              scale: 0.95,
            }
          : undefined
      }
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </motion.button>
  );
}
