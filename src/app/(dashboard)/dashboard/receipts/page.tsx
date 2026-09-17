"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertCircle,
  BarChart3,
  Camera,
  CheckCircle2,
  Download,
  Edit3,
  FileDigit,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";

import {
  addReceiptTag,
  createReceipt,
  deleteReceipt,
  getReceipts,
  setReceiptFavorite,
  type ReceiptData,
  type ReceiptStatus,
} from "@/lib/api/receiptApi";

/* =========================================================
   TYPES
========================================================= */

type ActiveTab =
  | "vault"
  | "warranties"
  | "analytics";

type ModalStep =
  | "upload"
  | "scanning"
  | "form";

interface ToastInfo {
  message: string;
  type:
    | "success"
    | "error"
    | "info";
}

/* =========================================================
   HELPERS
========================================================= */

function formatMoney(
  receipt: Pick<
    ReceiptData,
    "currency" | "total"
  >
) {
  return `${receipt.currency || "৳"} ${Number(
    receipt.total || 0
  ).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value}T12:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  return error instanceof Error &&
    error.message
    ? error.message
    : fallback;
}

/* =========================================================
   PAGE
========================================================= */

export default function ReceiptsPage() {
  const [
    receipts,
    setReceipts,
  ] = useState<ReceiptData[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    activeTab,
    setActiveTab,
  ] = useState<ActiveTab>("vault");

  const [
    selectedReceipt,
    setSelectedReceipt,
  ] = useState<ReceiptData | null>(
    null
  );

  const [
    isAddModalOpen,
    setIsAddModalOpen,
  ] = useState(false);

  const [
    modalStartStep,
    setModalStartStep,
  ] = useState<ModalStep>("upload");

  const [
    toast,
    setToast,
  ] = useState<ToastInfo | null>(
    null
  );

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (
    message: string,
    type: ToastInfo["type"] = "success"
  ) => {
    setToast({
      message,
      type,
    });

    window.setTimeout(
      () => setToast(null),
      3200
    );
  };

  /* =======================================================
     LOAD RECEIPTS
  ======================================================= */

  const loadReceipts = async (
    silent = false
  ) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const response =
        await getReceipts();

      if (
        !response?.success ||
        !Array.isArray(
          response.receipts
        )
      ) {
        throw new Error(
          response?.message ||
            "Unable to load receipts."
        );
      }

      setReceipts(
        response.receipts
      );

      setSelectedReceipt(
        (current) => {
          if (!current) {
            return null;
          }

          return (
            response.receipts.find(
              (receipt) =>
                receipt.id ===
                current.id
            ) || null
          );
        }
      );
    } catch (error) {
      console.error(
        "Receipt loading error:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load receipts."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadReceipts();
  }, []);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const totalSpend = useMemo(
    () =>
      receipts.reduce(
        (total, receipt) =>
          total +
          Number(
            receipt.total || 0
          ),
        0
      ),
    [receipts]
  );

  const activeWarranties = useMemo(
    () =>
      receipts.filter(
        (receipt) =>
          receipt.status ===
            "warranty_active" ||
          receipt.status ===
            "warranty_expiring"
      ),
    [receipts]
  );

  const actionNeeded = useMemo(
    () =>
      receipts.filter(
        (receipt) =>
          receipt.status ===
            "warranty_expiring" ||
          receipt.status ===
            "return_open"
      ).length,
    [receipts]
  );

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          receipts
            .map(
              (receipt) =>
                receipt.category
            )
            .filter(Boolean)
        )
      ),
    ],
    [receipts]
  );

  const filteredReceipts =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return receipts.filter(
        (receipt) => {
          const matchesSearch =
            !query ||
            receipt.merchant
              .toLowerCase()
              .includes(query) ||
            receipt.category
              .toLowerCase()
              .includes(query) ||
            receipt.receiptNumber
              .toLowerCase()
              .includes(query) ||
            String(
              receipt.total
            ).includes(query);

          const matchesCategory =
            categoryFilter ===
              "All" ||
            receipt.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      receipts,
      searchQuery,
      categoryFilter,
    ]);

  const monthlyAnalytics =
    useMemo(() => {
      const now = new Date();

      return Array.from(
        {
          length: 6,
        },
        (_, index) => {
          const date =
            new Date(
              now.getFullYear(),
              now.getMonth() -
                (5 - index),
              1
            );

          const amount =
            receipts
              .filter(
                (receipt) => {
                  const receiptDate =
                    new Date(
                      `${receipt.date}T12:00:00`
                    );

                  return (
                    receiptDate.getFullYear() ===
                      date.getFullYear() &&
                    receiptDate.getMonth() ===
                      date.getMonth()
                  );
                }
              )
              .reduce(
                (total, receipt) =>
                  total +
                  receipt.total,
                0
              );

          return {
            name:
              date.toLocaleDateString(
                "en-US",
                {
                  month: "short",
                }
              ),
            amount,
          };
        }
      );
    }, [receipts]);

  const maxAnalytics =
    Math.max(
      ...monthlyAnalytics.map(
        (item) => item.amount
      ),
      1
    );

  const organizationScore =
    receipts.length === 0
      ? 0
      : Math.round(
          (receipts.filter(
            (receipt) =>
              receipt.category &&
              receipt.category !==
                "Uncategorized" &&
              receipt.tags.length > 0
          ).length /
            receipts.length) *
            100
        );

  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleReceiptCreated = (
    receipt: ReceiptData
  ) => {
    setReceipts((current) => [
      receipt,
      ...current,
    ]);

    setIsAddModalOpen(false);

    showToast(
      "Receipt saved to your vault."
    );
  };

  const handleFavorite = async (
    receipt: ReceiptData
  ) => {
    try {
      const response =
        await setReceiptFavorite(
          receipt.id,
          !receipt.isFavorite
        );

      setReceipts((current) =>
        current.map((item) =>
          item.id === receipt.id
            ? response.receipt
            : item
        )
      );

      setSelectedReceipt(
        response.receipt
      );

      showToast(
        response.message ||
          "Favorite updated.",
        "info"
      );
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          "Unable to update favorite."
        ),
        "error"
      );
    }
  };

  const handleDelete = async (
    receipt: ReceiptData
  ) => {
    try {
      const response =
        await deleteReceipt(
          receipt.id
        );

      setReceipts((current) =>
        current.filter(
          (item) =>
            item.id !== receipt.id
        )
      );

      setSelectedReceipt(null);

      showToast(
        response.message ||
          "Receipt deleted.",
        "info"
      );
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          "Unable to delete receipt."
        ),
        "error"
      );
    }
  };

  const handleAddTag = async (
    receipt: ReceiptData,
    tag: string
  ) => {
    try {
      const response =
        await addReceiptTag(
          receipt.id,
          tag
        );

      setReceipts((current) =>
        current.map((item) =>
          item.id === receipt.id
            ? response.receipt
            : item
        )
      );

      setSelectedReceipt(
        response.receipt
      );

      showToast(
        response.message ||
          "Tag added."
      );
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          "Unable to add tag."
        ),
        "error"
      );
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 text-foreground">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-violet-400" />
          </div>

          <p className="mt-4 text-sm font-black text-foreground">
            Loading receipt vault
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Syncing your saved purchase records.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    errorMessage &&
    receipts.length === 0
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-[28px] border border-rose-200 bg-card p-7 text-center shadow-sm dark:border-rose-900/60">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
          </div>

          <h1 className="mt-4 text-lg font-black text-foreground">
            Receipts could not be loaded
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadReceipts()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-background pb-24 font-sans text-foreground">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">

        {/* =================================================
            ERROR ALERT
        ================================================== */}

        {errorMessage && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/25 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadReceipts(true)
              }
              className="inline-flex items-center gap-2 text-xs font-black text-amber-800 transition hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>
          </div>
        )}

        {/* =================================================
            HERO
        ================================================== */}

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
            duration: 0.5,
          }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 px-5 py-7 text-white shadow-[0_24px_70px_rgba(79,70,229,0.25)] sm:px-7 sm:py-8 lg:px-9 lg:py-9"
        >
          {/* decorative glows */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />

          <div className="pointer-events-none absolute right-[18%] top-8 hidden h-40 w-40 rounded-full border border-white/10 lg:block" />

          <div className="pointer-events-none absolute right-[12%] top-14 hidden h-28 w-28 rounded-full border border-white/10 lg:block" />

          <div className="pointer-events-none absolute left-[46%] top-1/2 hidden h-px w-[40%] bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0 max-w-3xl">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-100 backdrop-blur-md">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10">
                  <FileDigit className="h-3 w-3" />
                </span>

                Purchase Records
              </div>

              <h1 className="max-w-3xl text-[30px] font-black leading-[1.06] tracking-[-0.04em] text-white sm:text-4xl lg:text-[46px]">
                Receipts & Purchase Vault
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-indigo-100/75 sm:text-base">
                Store receipts, track
                warranties, organize
                purchases, and find
                important records in
                seconds.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-[10px] font-bold text-indigo-100 backdrop-blur">
                  <FileText className="h-3.5 w-3.5 text-violet-300" />
                  {receipts.length} records
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-[10px] font-bold text-indigo-100 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  {activeWarranties.length} warranties
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-[10px] font-bold text-indigo-100 backdrop-blur">
                  <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
                  ৳{" "}
                  {totalSpend.toLocaleString(
                    "en-BD"
                  )} tracked
                </div>

              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0 lg:flex-col">

              <button
                type="button"
                onClick={() => {
                  setModalStartStep(
                    "form"
                  );

                  setIsAddModalOpen(
                    true
                  );
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-extrabold text-indigo-900 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:bg-indigo-50 active:translate-y-0"
              >
                <Plus className="h-[18px] w-[18px]" />
                Add Receipt
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalStartStep(
                    "scanning"
                  );

                  setIsAddModalOpen(
                    true
                  );
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-extrabold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0"
              >
                <Camera className="h-[18px] w-[18px]" />
                Scan Receipt
              </button>

            </div>
          </div>
        </motion.section>

        {/* =================================================
            STATS
        ================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Tracked"
            value={`৳ ${totalSpend.toLocaleString(
              "en-BD"
            )}`}
            icon={
              <BarChart3 className="h-5 w-5" />
            }
            color="blue"
          />

          <StatCard
            title="Total Receipts"
            value={String(
              receipts.length
            )}
            icon={
              <FileText className="h-5 w-5" />
            }
            color="slate"
          />

          <StatCard
            title="Active Warranties"
            value={String(
              activeWarranties.length
            )}
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            color="emerald"
          />

          <StatCard
            title="Action Needed"
            value={String(
              actionNeeded
            )}
            icon={
              <AlertCircle className="h-5 w-5" />
            }
            color="amber"
            subtitle="Warranty / returns"
          />

        </section>

        {/* =================================================
            TABS
        ================================================== */}

        <div className="flex w-full overflow-x-auto rounded-2xl border border-border bg-card p-1 shadow-sm sm:w-fit">

          {(
            [
              "vault",
              "warranties",
              "analytics",
            ] as ActiveTab[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() =>
                setActiveTab(tab)
              }
              className={`relative whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-bold capitalize transition ${
                activeTab === tab
                  ? "text-indigo-600 dark:text-violet-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === tab && (
                <motion.span
                  layoutId="receipt-tab"
                  className="absolute inset-0 rounded-xl bg-muted shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 34,
                  }}
                />
              )}

              <span className="relative z-10">
                {tab}
              </span>
            </button>
          ))}

        </div>

        {/* =================================================
            CONTENT
        ================================================== */}

        <AnimatePresence mode="wait">

          {/* =================================================
              VAULT
          ================================================== */}

          {activeTab === "vault" && (
            <motion.section
              key="vault"
              initial={{
                opacity: 0,
                x: -14,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 14,
              }}
              className="space-y-6"
            >

              <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center">

                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search merchant, category, receipt number, or amount..."
                    className="w-full rounded-2xl border border-border bg-muted py-3 pl-12 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-indigo-400 focus:bg-background focus:ring-2 focus:ring-indigo-500/15 dark:focus:border-violet-400 dark:focus:ring-violet-500/15"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">

                  {categories.map(
                    (category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setCategoryFilter(
                            category
                          )
                        }
                        className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                          categoryFilter ===
                          category
                            ? "bg-indigo-600 text-white dark:bg-violet-600"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {category}
                      </button>
                    )
                  )}

                </div>
              </div>

              {filteredReceipts.length >
              0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                  {filteredReceipts.map(
                    (receipt) => (
                      <ReceiptCard
                        key={
                          receipt.id
                        }
                        receipt={
                          receipt
                        }
                        onClick={() =>
                          setSelectedReceipt(
                            receipt
                          )
                        }
                      />
                    )
                  )}

                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-5 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <FileText className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 font-black text-foreground">
                    No receipts found
                  </h3>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    Add a receipt or change
                    your search/filter to
                    see purchase records
                    here.
                  </p>

                </div>
              )}

            </motion.section>
          )}

          {/* =================================================
              WARRANTIES
          ================================================== */}

          {activeTab ===
            "warranties" && (
            <motion.section
              key="warranties"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
            >

              <div className="mb-6 flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-violet-950/50 dark:text-violet-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-black text-foreground">
                  Active Warranties &
                  Returns
                </h2>

              </div>

              {receipts.filter(
                (receipt) =>
                  receipt.status !==
                  "normal"
              ).length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">

                  {receipts
                    .filter(
                      (receipt) =>
                        receipt.status !==
                        "normal"
                    )
                    .map(
                      (receipt) => (
                        <button
                          key={
                            receipt.id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedReceipt(
                              receipt
                            )
                          }
                          className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted p-4 text-left transition hover:border-indigo-300 hover:bg-accent hover:shadow-md dark:hover:border-violet-800"
                        >

                          <div>
                            <p className="font-black text-foreground">
                              {
                                receipt.merchant
                              }
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {receipt.status ===
                              "return_open"
                                ? `Return deadline: ${formatDate(
                                    receipt.returnDeadline
                                  )}`
                                : `Warranty: ${formatDate(
                                    receipt.warrantyExpiry
                                  )}`}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                              receipt.status ===
                              "warranty_expiring"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : receipt.status ===
                                    "return_open"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            }`}
                          >
                            {receipt.status.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                        </button>
                      )
                    )}

                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active warranty or
                  return records.
                </p>
              )}

            </motion.section>
          )}

          {/* =================================================
              ANALYTICS
          ================================================== */}

          {activeTab ===
            "analytics" && (
            <motion.section
              key="analytics"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="grid gap-6 lg:grid-cols-3"
            >

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm lg:col-span-2">

                <h2 className="text-xl font-black text-foreground">
                  Purchase Insights
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Receipt value tracked
                  over the last six
                  months
                </p>

                <div className="mt-7 flex h-64 items-end gap-3 rounded-2xl border border-border bg-muted p-5">

                  {monthlyAnalytics.map(
                    (item) => {
                      const height =
                        item.amount >
                        0
                          ? Math.max(
                              (item.amount /
                                maxAnalytics) *
                                100,
                              7
                            )
                          : 3;

                      return (
                        <div
                          key={
                            item.name
                          }
                          className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                        >

                          <div className="relative flex h-full w-full items-end justify-center">

                            <motion.div
                              initial={{
                                height: 0,
                              }}
                              animate={{
                                height: `${height}%`,
                              }}
                              className="relative w-full max-w-[56px] rounded-t-xl bg-gradient-to-t from-indigo-600 to-violet-400 dark:from-violet-700 dark:to-fuchsia-400"
                            >
                              {item.amount >
                                0 && (
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-indigo-950 px-2 py-1 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100 dark:bg-violet-950">
                                  ৳{" "}
                                  {item.amount.toLocaleString(
                                    "en-BD"
                                  )}
                                </div>
                              )}
                            </motion.div>

                          </div>

                          <span className="text-[10px] font-bold text-muted-foreground">
                            {item.name}
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>
              </div>

              <div className="space-y-6">

                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">

                  <h3 className="font-black text-foreground">
                    Organization Score
                  </h3>

                  <div className="relative mx-auto mt-5 h-32 w-32">

                    <svg
                      className="h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="currentColor"
                        className="text-muted"
                        strokeWidth="11"
                      />

                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeDasharray={
                          2 *
                          Math.PI *
                          42
                        }
                        initial={{
                          strokeDashoffset:
                            2 *
                            Math.PI *
                            42,
                        }}
                        animate={{
                          strokeDashoffset:
                            2 *
                            Math.PI *
                            42 *
                            (1 -
                              organizationScore /
                                100),
                        }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-foreground">
                        {
                          organizationScore
                        }
                        %
                      </span>
                    </div>

                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">

                  <h3 className="font-black text-foreground">
                    Purchase Story
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    You have tracked{" "}
                    <strong className="text-indigo-600 dark:text-violet-400">
                      {
                        receipts.length
                      }{" "}
                      receipt
                      {receipts.length ===
                      1
                        ? ""
                        : "s"}
                    </strong>{" "}
                    worth{" "}
                    <strong className="text-indigo-600 dark:text-violet-400">
                      ৳{" "}
                      {totalSpend.toLocaleString(
                        "en-BD"
                      )}
                    </strong>
                    .
                  </p>

                </div>

              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </div>

      {/* =================================================
          DRAWER + ADD MODAL
      ================================================== */}

      <AnimatePresence>

        {selectedReceipt && (
          <ReceiptDetailDrawer
            receipt={
              selectedReceipt
            }
            onClose={() =>
              setSelectedReceipt(
                null
              )
            }
            onFavorite={() =>
              void handleFavorite(
                selectedReceipt
              )
            }
            onDelete={() =>
              void handleDelete(
                selectedReceipt
              )
            }
            onAddTag={(tag) =>
              void handleAddTag(
                selectedReceipt,
                tag
              )
            }
          />
        )}

        {isAddModalOpen && (
          <AddReceiptModal
            initialStep={
              modalStartStep
            }
            onClose={() =>
              setIsAddModalOpen(
                false
              )
            }
            onSaved={
              handleReceiptCreated
            }
          />
        )}

      </AnimatePresence>

      {/* =================================================
          TOAST
      ================================================== */}

      <AnimatePresence>

        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 24,
              scale: 0.96,
            }}
            className="fixed bottom-6 right-6 z-[120] flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
          >

            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                toast.type ===
                "error"
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                  : toast.type ===
                      "info"
                    ? "bg-indigo-100 text-indigo-600 dark:bg-violet-950/50 dark:text-violet-400"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              }`}
            >
              {toast.type ===
              "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>

            <p className="text-sm font-bold text-foreground">
              {
                toast.message
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              className="text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color:
    | "blue"
    | "emerald"
    | "amber"
    | "slate";
  subtitle?: string;
}) {
  const colors = {
    blue:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",

    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",

    amber:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",

    slate:
      "bg-muted text-muted-foreground",
  };

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="flex items-start justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="min-w-0">

        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>

        <p className="mt-1 truncate text-2xl font-black text-foreground">
          {value}
        </p>

        {subtitle && (
          <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {subtitle}
          </p>
        )}

      </div>

      <div
        className={`shrink-0 rounded-2xl p-3 ${colors[color]}`}
      >
        {icon}
      </div>
    </motion.div>
  );
}

/* =========================================================
   RECEIPT CARD
========================================================= */

function ReceiptCard({
  receipt,
  onClick,
}: {
  receipt: ReceiptData;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -4,
        scale: 1.01,
      }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-lg"
    >

      <div className="mb-4 flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-xl font-black text-indigo-600 dark:text-violet-400">
            {receipt.merchant.charAt(
              0
            ) || "R"}
          </div>

          <div className="min-w-0">

            <h3 className="truncate font-black text-foreground transition group-hover:text-indigo-600 dark:group-hover:text-violet-400">
              {
                receipt.merchant
              }
            </h3>

            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {formatDate(
                receipt.date
              )}
            </p>

          </div>
        </div>

        {receipt.isFavorite && (
          <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />
        )}

      </div>

      <div className="flex items-end justify-between gap-3">

        <div>

          <p className="mb-1 text-xs text-muted-foreground">
            {receipt.category}
          </p>

          <p className="text-lg font-black text-foreground">
            {formatMoney(
              receipt
            )}
          </p>

        </div>

        {receipt.status.includes(
          "warranty"
        ) && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck
              className={`h-3.5 w-3.5 ${
                receipt.status ===
                "warranty_expiring"
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            />
            Warranty
          </div>
        )}

      </div>

    </motion.button>
  );
}

/* =========================================================
   RECEIPT DRAWER
========================================================= */

function ReceiptDetailDrawer({
  receipt,
  onClose,
  onFavorite,
  onDelete,
  onAddTag,
}: {
  receipt: ReceiptData;
  onClose: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
}) {
  const [
    tagInput,
    setTagInput,
  ] = useState("");

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const confirmDelete =
    async () => {
      if (
        !window.confirm(
          "Delete this receipt from your vault?"
        )
      ) {
        return;
      }

      try {
        setDeleting(true);

        await onDelete();
      } finally {
        setDeleting(false);
      }
    };

  const submitTag = () => {
    const tag =
      tagInput.trim();

    if (!tag) {
      return;
    }

    onAddTag(tag);
    setTagInput("");
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close receipt"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
      />

      <motion.aside
        initial={{
          x: "100%",
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        exit={{
          x: "100%",
          opacity: 0,
        }}
        transition={{
          type: "spring",
          damping: 27,
          stiffness: 220,
        }}
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl md:w-[600px]"
      >

        {/* HEADER */}

        <div className="flex items-center justify-between gap-4 border-b border-border bg-card/95 px-6 py-5 backdrop-blur">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted font-black text-indigo-600 dark:text-violet-400">
              {receipt.merchant.charAt(
                0
              ) || "R"}
            </div>

            <div className="min-w-0">

              <h2 className="truncate text-lg font-black text-foreground">
                {
                  receipt.merchant
                }
              </h2>

              <p className="truncate text-xs text-muted-foreground">
                {receipt.receiptNumber ||
                  "No receipt number"}
              </p>

            </div>

          </div>

          <div className="flex items-center gap-1">

            <button
              type="button"
              onClick={onFavorite}
              className="rounded-xl p-2 text-muted-foreground transition hover:bg-amber-100 hover:text-amber-500 dark:hover:bg-amber-950/40"
            >
              <Star
                className={`h-5 w-5 ${
                  receipt.isFavorite
                    ? "fill-amber-400 text-amber-400"
                    : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                void confirmDelete()
              }
              disabled={deleting}
              className="rounded-xl p-2 text-muted-foreground transition hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-950/40 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

          </div>

        </div>

        {/* CONTENT */}

        <div className="flex-1 space-y-8 overflow-y-auto p-6 pb-24 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

          <div className="rounded-3xl border border-border bg-muted py-6 text-center">

            <p className="text-sm font-medium text-muted-foreground">
              Total Amount
            </p>

            <h3 className="mt-1 text-4xl font-black text-foreground">
              {formatMoney(
                receipt
              )}
            </h3>

            <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Saved Purchase Record
            </p>

          </div>

          {/* PURCHASE DETAILS */}

          <section>

            <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-violet-400">
              Purchase Details
            </h3>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

              <DetailRow
                label="Date"
                value={formatDate(
                  receipt.date
                )}
              />

              <DetailRow
                label="Payment Method"
                value={
                  receipt.paymentMethod ||
                  "—"
                }
              />

              <DetailRow
                label="Category"
                value={
                  receipt.category
                }
              />

              <DetailRow
                label="Tax / VAT"
                value={`${receipt.currency || "৳"} ${receipt.tax.toLocaleString(
                  "en-BD"
                )}`}
                isLast
              />

            </div>

          </section>

          {/* LINE ITEMS */}

          {receipt.lineItems.length >
            0 && (
            <section>

              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-violet-400">
                Line Items
              </h3>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

                {receipt.lineItems.map(
                  (item, index) => (
                    <div
                      key={
                        item.id
                      }
                      className={`flex items-center justify-between gap-4 p-4 ${
                        index !==
                        receipt.lineItems.length -
                          1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >

                      <div>

                        <p className="font-bold text-foreground">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            item.quantity
                          }{" "}
                          ×{" "}
                          {
                            receipt.currency
                          }{" "}
                          {item.unitPrice.toLocaleString(
                            "en-BD"
                          )}
                        </p>

                      </div>

                      <p className="font-black text-foreground">
                        {
                          receipt.currency
                        }{" "}
                        {item.total.toLocaleString(
                          "en-BD"
                        )}
                      </p>

                    </div>
                  )
                )}

              </div>

            </section>
          )}

          {/* WARRANTY */}

          {(receipt.warrantyExpiry ||
            receipt.returnDeadline) && (
            <section>

              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-violet-400">
                Warranty / Return
              </h3>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

                {receipt.warrantyExpiry && (
                  <DetailRow
                    label="Warranty Expiry"
                    value={formatDate(
                      receipt.warrantyExpiry
                    )}
                  />
                )}

                {receipt.returnDeadline && (
                  <DetailRow
                    label="Return Deadline"
                    value={formatDate(
                      receipt.returnDeadline
                    )}
                    isLast
                  />
                )}

              </div>

            </section>
          )}

          {/* TAGS */}

          <section>

            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-violet-400">
              Tags
            </h3>

            <div className="flex flex-wrap gap-2">

              {receipt.tags.map(
                (tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {tag}
                  </span>
                )
              )}

            </div>

            <div className="mt-3 flex gap-2">

              <input
                type="text"
                value={tagInput}
                maxLength={32}
                onChange={(event) =>
                  setTagInput(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    submitTag();
                  }
                }}
                placeholder="Add a tag"
                className="min-w-0 flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:focus:border-violet-500 dark:focus:ring-violet-500/15"
              />

              <button
                type="button"
                onClick={submitTag}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
              >
                Add
              </button>

            </div>

          </section>

          {receipt.imageUrl && (
            <a
              href={
                receipt.imageUrl
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-accent dark:text-violet-400"
            >
              <Download className="h-4 w-4" />
              Open Receipt File
            </a>
          )}

        </div>

      </motion.aside>
    </>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 ${
        !isLast
          ? "border-b border-border"
          : ""
      }`}
    >
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-foreground">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   ADD RECEIPT MODAL
========================================================= */

function AddReceiptModal({
  initialStep,
  onClose,
  onSaved,
}: {
  initialStep: ModalStep;
  onClose: () => void;
  onSaved: (
    receipt: ReceiptData
  ) => void;
}) {
  const [
    step,
    setStep,
  ] = useState<ModalStep>(
    initialStep
  );

  const [
    scanProgress,
    setScanProgress,
  ] = useState(0);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    merchant,
    setMerchant,
  ] = useState("");

  const [
    total,
    setTotal,
  ] = useState("");

  const [
    tax,
    setTax,
  ] = useState("0");

  const [
    date,
    setDate,
  ] = useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );

  const [
    category,
    setCategory,
  ] = useState(
    "Uncategorized"
  );

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("");

  const [
    receiptNumber,
    setReceiptNumber,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<ReceiptStatus>(
    "normal"
  );

  const [
    warrantyExpiry,
    setWarrantyExpiry,
  ] = useState("");

  const [
    returnDeadline,
    setReturnDeadline,
  ] = useState("");

  const [
    tags,
    setTags,
  ] = useState("");

  const [
    aiParsed,
    setAiParsed,
  ] = useState(false);

  /* =====================================================
     DEMO SCAN
  ====================================================== */

  const startDemoScan = () => {
    setStep("scanning");
    setScanProgress(0);

    let progress = 0;

    const timer =
      window.setInterval(() => {
        progress += 5;

        setScanProgress(
          progress
        );

        if (progress >= 100) {
          window.clearInterval(
            timer
          );

          window.setTimeout(
            () => {
              setMerchant(
                "Coffee House"
              );

              setTotal("850");

              setTax("120");

              setCategory(
                "Dining"
              );

              setPaymentMethod(
                "Card"
              );

              setReceiptNumber(
                "SCAN-DEMO"
              );

              setAiParsed(true);

              setStep("form");
            },
            350
          );
        }
      }, 80);
  };

  useEffect(() => {
    if (
      initialStep ===
      "scanning"
    ) {
      startDemoScan();
    }

    // Opening mode should run only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     SAVE
  ====================================================== */

  const handleSave = async () => {
    const amount =
      Number(total);

    const taxAmount =
      Number(tax || 0);

    if (
      !merchant.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !date
    ) {
      setErrorMessage(
        "Merchant, amount, and date are required."
      );

      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const response =
        await createReceipt({
          merchant:
            merchant.trim(),

          total: amount,

          tax: Number.isFinite(
            taxAmount
          )
            ? Math.max(
                taxAmount,
                0
              )
            : 0,

          currency: "BDT",

          category:
            category.trim() ||
            "Uncategorized",

          paymentMethod:
            paymentMethod.trim(),

          receiptNumber:
            receiptNumber.trim(),

          date,

          status,

          warrantyExpiry:
            warrantyExpiry ||
            undefined,

          returnDeadline:
            returnDeadline ||
            undefined,

          tags: tags
            .split(",")
            .map((tag) =>
              tag.trim()
            )
            .filter(Boolean),

          lineItems: [],

          isAiParsed: aiParsed,
        });

      if (
        !response?.success ||
        !response.receipt
      ) {
        throw new Error(
          response?.message ||
            "Unable to save receipt."
        );
      }

      onSaved(
        response.receipt
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to save receipt."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">

      <motion.button
        type="button"
        aria-label="Close modal"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        onClick={
          step !== "scanning"
            ? onClose
            : undefined
        }
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />

      <motion.div
        initial={{
          scale: 0.95,
          opacity: 0,
          y: 20,
        }}
        animate={{
          scale: 1,
          opacity: 1,
          y: 0,
        }}
        exit={{
          scale: 0.95,
          opacity: 0,
          y: 20,
        }}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl"
      >

        {/* =================================================
            MODAL HEADER
        ================================================== */}

        <div className="flex items-center justify-between border-b border-border bg-muted px-6 py-4">

          <h2 className="flex items-center gap-2 font-black text-foreground">
            <Zap className="h-5 w-5 text-indigo-600 dark:text-violet-400" />
            Receipt Capture
          </h2>

          {step !==
            "scanning" && (
            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}

        </div>

        {/* =================================================
            MODAL CONTENT
        ================================================== */}

        <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:p-8">

          {/* =================================================
              UPLOAD
          ================================================== */}

          {step ===
            "upload" && (
            <div className="space-y-6">

              <button
                type="button"
                onClick={
                  startDemoScan
                }
                className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-300 bg-indigo-50/70 p-10 text-center transition hover:bg-indigo-100 dark:border-violet-800 dark:bg-violet-950/20 dark:hover:bg-violet-950/35"
              >

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card text-indigo-600 shadow-sm dark:text-violet-400">
                  <UploadCloud className="h-8 w-8" />
                </div>

                <h3 className="text-lg font-black text-foreground">
                  Scan Receipt Demo
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  OCR upload is not
                  connected yet. This
                  demo fills sample
                  fields so you can
                  test the backend
                  save flow.
                </p>

              </button>

              <button
                type="button"
                onClick={() =>
                  setStep("form")
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-4 text-sm font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Edit3 className="h-5 w-5" />
                Manual Entry
              </button>

            </div>
          )}

          {/* =================================================
              SCANNING
          ================================================== */}

          {step ===
            "scanning" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12">

              <div className="relative h-64 w-48 overflow-hidden rounded-xl border border-border bg-muted shadow-inner">

                <div
                  className="absolute inset-x-0 h-1 bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.8)] dark:bg-violet-500 dark:shadow-[0_0_15px_rgba(139,92,246,0.8)]"
                  style={{
                    top: `${scanProgress}%`,
                  }}
                />

                <FileText className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40" />

              </div>

              <div className="text-center">

                <h3 className="text-lg font-black text-foreground">
                  Processing Demo
                  Scan...
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  This is a UI
                  simulation, not
                  real OCR.
                </p>

              </div>

              <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">

                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-500"
                  animate={{
                    width: `${scanProgress}%`,
                  }}
                />

              </div>

            </div>
          )}

          {/* =================================================
              FORM
          ================================================== */}

          {step === "form" && (
            <div className="space-y-5">

              {aiParsed && (
                <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-violet-900/60 dark:bg-violet-950/25">

                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-violet-400" />

                  <div>

                    <p className="text-sm font-black text-indigo-800 dark:text-violet-300">
                      Demo fields
                      prepared
                    </p>

                    <p className="mt-1 text-xs text-indigo-600 dark:text-violet-400">
                      Review and edit
                      everything before
                      saving.
                    </p>

                  </div>

                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">

                <Field label="Merchant">
                  <input
                    type="text"
                    value={merchant}
                    onChange={(event) =>
                      setMerchant(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                    placeholder="e.g. TechLand"
                  />
                </Field>

                <Field label="Total Amount">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={total}
                    onChange={(event) =>
                      setTotal(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                    placeholder="0"
                  />
                </Field>

                <Field label="Tax / VAT">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(event) =>
                      setTax(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>

                <Field label="Purchase Date">
                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>

                <Field label="Category">
                  <input
                    type="text"
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                    placeholder="Electronics"
                  />
                </Field>

                <Field label="Payment Method">
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                    placeholder="Card / Cash / Wallet"
                  />
                </Field>

                <Field label="Receipt Number">
                  <input
                    type="text"
                    value={
                      receiptNumber
                    }
                    onChange={(event) =>
                      setReceiptNumber(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                    placeholder="INV-12345"
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={
                      status
                    }
                    onChange={(event) =>
                      setStatus(
                        event.target
                          .value as ReceiptStatus
                      )
                    }
                    className="receipt-input"
                  >
                    <option value="normal">
                      Normal
                    </option>

                    <option value="warranty_active">
                      Warranty Active
                    </option>

                    <option value="warranty_expiring">
                      Warranty Expiring
                    </option>

                    <option value="return_open">
                      Return Open
                    </option>
                  </select>
                </Field>

                <Field label="Warranty Expiry">
                  <input
                    type="date"
                    value={
                      warrantyExpiry
                    }
                    onChange={(event) =>
                      setWarrantyExpiry(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>

                <Field label="Return Deadline">
                  <input
                    type="date"
                    value={
                      returnDeadline
                    }
                    onChange={(event) =>
                      setReturnDeadline(
                        event.target
                          .value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>

              </div>

              <Field label="Tags">
                <input
                  type="text"
                  value={tags}
                  onChange={(event) =>
                    setTags(
                      event.target.value
                    )
                  }
                  className="receipt-input"
                  placeholder="Business, Hardware, Personal"
                />
              </Field>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleSave()
                  }
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save to Vault"}
                </button>

              </div>
            </div>
          )}

        </div>

        <style jsx>{`
          .receipt-input {
            width: 100%;
            border: 1px solid hsl(var(--border));
            border-radius: 0.75rem;
            background: hsl(var(--muted));
            padding: 0.625rem 1rem;
            font-size: 0.875rem;
            color: hsl(var(--foreground));
            outline: none;
            transition:
              border-color 0.2s ease,
              background-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .receipt-input::placeholder {
            color: hsl(var(--muted-foreground));
          }

          .receipt-input:focus {
            border-color: #6366f1;
            background: hsl(var(--background));
            box-shadow:
              0 0 0 3px
              rgba(99, 102, 241, 0.12);
          }

          @media (prefers-color-scheme: dark) {
            .receipt-input {
              background: hsl(var(--muted));
              color: hsl(var(--foreground));
            }

            .receipt-input:focus {
              border-color: #8b5cf6;
              background: hsl(var(--background));
              box-shadow:
                0 0 0 3px
                rgba(139, 92, 246, 0.15);
            }
          }
        `}</style>

      </motion.div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}