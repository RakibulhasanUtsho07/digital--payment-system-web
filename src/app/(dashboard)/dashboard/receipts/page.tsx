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
  receipt:
    Pick<
      ReceiptData,
      "currency" | "total"
    >
) {
  return `${receipt.currency || "৳"} ${Number(
    receipt.total || 0
  ).toLocaleString(
    "en-BD",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
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
  ] =
    useState<ReceiptData[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("All");

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ActiveTab>(
      "vault"
    );

  const [
    selectedReceipt,
    setSelectedReceipt,
  ] =
    useState<ReceiptData | null>(
      null
    );

  const [
    isAddModalOpen,
    setIsAddModalOpen,
  ] =
    useState(false);

  const [
    modalStartStep,
    setModalStartStep,
  ] =
    useState<ModalStep>(
      "upload"
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastInfo | null>(
      null
    );

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast =
    (
      message: string,
      type:
        ToastInfo["type"] =
        "success"
    ) => {
      setToast({
        message,
        type,
      });

      window.setTimeout(
        () =>
          setToast(null),
        3200
      );
    };

  /* =======================================================
     LOAD RECEIPTS
  ======================================================= */

  const loadReceipts =
    async (
      silent = false
    ) => {
      try {
        if (silent) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        setErrorMessage(
          ""
        );

        const response =
          await getReceipts();

        if (
          !response
            ?.success ||
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
          (
            current
          ) => {
            if (!current) {
              return null;
            }

            return (
              response.receipts.find(
                (
                  receipt
                ) =>
                  receipt.id ===
                  current.id
              ) ||
              null
            );
          }
        );
      } catch (
        error
      ) {
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
        setLoading(
          false
        );

        setRefreshing(
          false
        );
      }
    };

  useEffect(() => {
    void loadReceipts();
  }, []);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const totalSpend =
    useMemo(
      () =>
        receipts.reduce(
          (
            total,
            receipt
          ) =>
            total +
            Number(
              receipt.total ||
                0
            ),
          0
        ),
      [
        receipts,
      ]
    );

  const activeWarranties =
    useMemo(
      () =>
        receipts.filter(
          (
            receipt
          ) =>
            receipt.status ===
              "warranty_active" ||
            receipt.status ===
              "warranty_expiring"
        ),
      [
        receipts,
      ]
    );

  const actionNeeded =
    useMemo(
      () =>
        receipts.filter(
          (
            receipt
          ) =>
            receipt.status ===
              "warranty_expiring" ||
            receipt.status ===
              "return_open"
        ).length,
      [
        receipts,
      ]
    );

  const categories =
    useMemo(
      () => [
        "All",
        ...Array.from(
          new Set(
            receipts
              .map(
                (
                  receipt
                ) =>
                  receipt.category
              )
              .filter(
                Boolean
              )
          )
        ),
      ],
      [
        receipts,
      ]
    );

  const filteredReceipts =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return receipts.filter(
        (
          receipt
        ) => {
          const matchesSearch =
            !query ||
            receipt.merchant
              .toLowerCase()
              .includes(
                query
              ) ||
            receipt.category
              .toLowerCase()
              .includes(
                query
              ) ||
            receipt.receiptNumber
              .toLowerCase()
              .includes(
                query
              ) ||
            String(
              receipt.total
            ).includes(
              query
            );

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
      const now =
        new Date();

      return Array.from(
        {
          length: 6,
        },
        (
          _,
          index
        ) => {
          const date =
            new Date(
              now.getFullYear(),
              now.getMonth() -
                (
                  5 -
                  index
                ),
              1
            );

          const amount =
            receipts
              .filter(
                (
                  receipt
                ) => {
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
                (
                  total,
                  receipt
                ) =>
                  total +
                  receipt.total,
                0
              );

          return {
            name:
              date.toLocaleDateString(
                "en-US",
                {
                  month:
                    "short",
                }
              ),

            amount,
          };
        }
      );
    }, [
      receipts,
    ]);

  const maxAnalytics =
    Math.max(
      ...monthlyAnalytics.map(
        (
          item
        ) =>
          item.amount
      ),
      1
    );

  const organizationScore =
    receipts.length ===
    0
      ? 0
      : Math.round(
          (
            receipts.filter(
              (
                receipt
              ) =>
                receipt.category &&
                receipt.category !==
                  "Uncategorized" &&
                receipt.tags.length >
                  0
            ).length /
            receipts.length
          ) *
            100
        );

  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleReceiptCreated =
    (
      receipt:
        ReceiptData
    ) => {
      setReceipts(
        (
          current
        ) => [
          receipt,
          ...current,
        ]
      );

      setIsAddModalOpen(
        false
      );

      showToast(
        "Receipt saved to your vault."
      );
    };

  const handleFavorite =
    async (
      receipt:
        ReceiptData
    ) => {
      try {
        const response =
          await setReceiptFavorite(
            receipt.id,
            !receipt.isFavorite
          );

        setReceipts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                receipt.id
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
      } catch (
        error
      ) {
        showToast(
          getErrorMessage(
            error,
            "Unable to update favorite."
          ),
          "error"
        );
      }
    };

  const handleDelete =
    async (
      receipt:
        ReceiptData
    ) => {
      try {
        const response =
          await deleteReceipt(
            receipt.id
          );

        setReceipts(
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                receipt.id
            )
        );

        setSelectedReceipt(
          null
        );

        showToast(
          response.message ||
            "Receipt deleted.",
          "info"
        );
      } catch (
        error
      ) {
        showToast(
          getErrorMessage(
            error,
            "Unable to delete receipt."
          ),
          "error"
        );
      }
    };

  const handleAddTag =
    async (
      receipt:
        ReceiptData,
      tag: string
    ) => {
      try {
        const response =
          await addReceiptTag(
            receipt.id,
            tag
          );

        setReceipts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                receipt.id
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
      } catch (
        error
      ) {
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
     LOADING / ERROR
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F6F8FB] px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-[#1F5EA8]" />
          </div>

          <p className="mt-4 text-sm font-black text-[#0F2745]">
            Loading receipt vault
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Syncing your saved purchase records.
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage &&
    receipts.length ===
      0
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F6F8FB] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-rose-100 bg-white p-7 text-center shadow-sm">
          <AlertCircle className="mx-auto h-7 w-7 text-rose-500" />

          <h1 className="mt-4 text-lg font-black text-[#0F2745]">
            Receipts could not be loaded
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadReceipts()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1F5EA8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#173F6D]"
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
    <main className="min-h-screen bg-[#F6F8FB] pb-24 font-sans text-[#0F2745]">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        {errorMessage && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-amber-800">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadReceipts(
                  true
                )
              }
              className="inline-flex items-center gap-2 text-xs font-black text-amber-800"
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

        {/* ===================================================
            HERO
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
          }}
          className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white px-5 py-6 shadow-[0_16px_50px_rgba(15,39,69,0.055)] sm:px-7 sm:py-7 lg:px-9 lg:py-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-100/50 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1F5EA8]">
                <FileDigit className="h-3.5 w-3.5" />
                Purchase Records
              </div>

              <h1 className="text-[30px] font-black leading-[1.08] tracking-[-0.035em] text-[#0F2745] sm:text-4xl lg:text-[42px]">
                Receipts & Purchase Vault
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
                Store receipts, track warranties, organize purchases, and find important records in seconds.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0">
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
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F5EA8] px-6 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(31,94,168,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#173F6D] sm:flex-none"
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
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-[#1F5EA8] shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 sm:flex-none"
              >
                <Camera className="h-[18px] w-[18px]" />
                Scan Receipt
              </button>
            </div>
          </div>
        </motion.section>

        {/* ===================================================
            STATS
        ==================================================== */}

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

        {/* ===================================================
            TABS
        ==================================================== */}

        <div className="flex w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-fit">
          {(
            [
              "vault",
              "warranties",
              "analytics",
            ] as ActiveTab[]
          ).map(
            (
              tab
            ) => (
              <button
                key={
                  tab
                }
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab
                  )
                }
                className={`relative whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-bold capitalize transition ${
                  activeTab ===
                  tab
                    ? "text-[#1F5EA8]"
                    : "text-slate-500 hover:text-[#0F2745]"
                }`}
              >
                {activeTab ===
                  tab && (
                  <motion.span
                    layoutId="receipt-tab"
                    className="absolute inset-0 rounded-xl bg-[#F6F8FB] shadow-sm"
                    transition={{
                      type:
                        "spring",
                      stiffness:
                        420,
                      damping:
                        34,
                    }}
                  />
                )}

                <span className="relative z-10">
                  {tab}
                </span>
              </button>
            )
          )}
        </div>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <AnimatePresence
          mode="wait"
        >
          {activeTab ===
            "vault" && (
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
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={
                      searchQuery
                    }
                    onChange={(
                      event
                    ) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search merchant, category, receipt number, or amount..."
                    className="w-full rounded-2xl border-none bg-[#F6F8FB] py-3 pl-12 pr-4 text-[#0F2745] outline-none transition focus:ring-2 focus:ring-[#1F5EA8]/20"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                  {categories.map(
                    (
                      category
                    ) => (
                      <button
                        key={
                          category
                        }
                        type="button"
                        onClick={() =>
                          setCategoryFilter(
                            category
                          )
                        }
                        className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                          categoryFilter ===
                          category
                            ? "bg-[#1F5EA8] text-white"
                            : "bg-[#F6F8FB] text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {
                          category
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              {filteredReceipts.length >
              0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredReceipts.map(
                    (
                      receipt
                    ) => (
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
                <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-5 text-center">
                  <FileText className="h-8 w-8 text-slate-300" />

                  <h3 className="mt-3 font-black text-[#0F2745]">
                    No receipts found
                  </h3>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                    Add a receipt or change your search/filter to see purchase records here.
                  </p>
                </div>
              )}
            </motion.section>
          )}

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
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#1F5EA8]" />

                <h2 className="text-xl font-black text-[#0F2745]">
                  Active Warranties & Returns
                </h2>
              </div>

              {receipts.filter(
                (
                  receipt
                ) =>
                  receipt.status !==
                  "normal"
              ).length >
              0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {receipts
                    .filter(
                      (
                        receipt
                      ) =>
                        receipt.status !==
                        "normal"
                    )
                    .map(
                      (
                        receipt
                      ) => (
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
                          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#F6F8FB] p-4 text-left transition hover:border-blue-200 hover:bg-white hover:shadow-md"
                        >
                          <div>
                            <p className="font-black text-[#0F2745]">
                              {
                                receipt.merchant
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
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
                                ? "bg-amber-100 text-amber-700"
                                : receipt.status ===
                                    "return_open"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
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
                <p className="text-sm text-slate-400">
                  No active warranty or return records.
                </p>
              )}
            </motion.section>
          )}

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
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-xl font-black text-[#0F2745]">
                  Purchase Insights
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Receipt value tracked over the last six months
                </p>

                <div className="mt-7 flex h-64 items-end gap-3 rounded-2xl border border-slate-100 bg-[#F6F8FB] p-5">
                  {monthlyAnalytics.map(
                    (
                      item
                    ) => {
                      const height =
                        item.amount >
                        0
                          ? Math.max(
                              (
                                item.amount /
                                maxAnalytics
                              ) *
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
                                height:
                                  `${height}%`,
                              }}
                              className="relative w-full max-w-[56px] rounded-t-xl bg-gradient-to-t from-[#1F5EA8] to-cyan-400"
                            >
                              {item.amount >
                                0 && (
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0F2745] px-2 py-1 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100">
                                  ৳{" "}
                                  {item.amount.toLocaleString(
                                    "en-BD"
                                  )}
                                </div>
                              )}
                            </motion.div>
                          </div>

                          <span className="text-[10px] font-bold text-slate-400">
                            {
                              item.name
                            }
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-black text-[#0F2745]">
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
                        stroke="#f1f5f9"
                        strokeWidth="11"
                      />

                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#10b981"
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
                            (
                              1 -
                              organizationScore /
                                100
                            ),
                        }}
                      />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-[#0F2745]">
                        {
                          organizationScore
                        }
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-black text-[#0F2745]">
                    Purchase Story
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    You have tracked{" "}
                    <strong className="text-[#0F2745]">
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
                    <strong className="text-[#0F2745]">
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

      {/* ===================================================
          DRAWER
      ==================================================== */}

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
            onAddTag={(
              tag
            ) =>
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

      {/* ===================================================
          TOAST
      ==================================================== */}

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
            className="fixed bottom-6 right-6 z-[120] flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                toast.type ===
                "error"
                  ? "bg-rose-100 text-rose-600"
                  : toast.type ===
                      "info"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {toast.type ===
              "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>

            <p className="text-sm font-bold text-slate-700">
              {
                toast.message
              }
            </p>

            <button
              type="button"
              onClick={() =>
                setToast(
                  null
                )
              }
              className="text-slate-400 transition hover:text-slate-700"
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
      "bg-blue-50 text-blue-600",

    emerald:
      "bg-emerald-50 text-emerald-600",

    amber:
      "bg-amber-50 text-amber-600",

    slate:
      "bg-slate-50 text-slate-600",
  };

  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      className="flex items-start justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-2xl font-black text-[#0F2745]">
          {value}
        </p>

        {subtitle && (
          <p className="mt-1 text-xs font-semibold text-amber-600">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className={`rounded-2xl p-3 ${colors[color]}`}
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
      onClick={
        onClick
      }
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-[#F6F8FB] text-xl font-black text-[#1F5EA8] shadow-inner">
            {receipt.merchant.charAt(
              0
            ) ||
              "R"}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-black text-[#0F2745] transition group-hover:text-[#1F5EA8]">
              {
                receipt.merchant
              }
            </h3>

            <p className="mt-1 text-xs font-medium text-slate-400">
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
          <p className="mb-1 text-xs text-slate-500">
            {
              receipt.category
            }
          </p>

          <p className="text-lg font-black text-[#0F2745]">
            {formatMoney(
              receipt
            )}
          </p>
        </div>

        {receipt.status.includes(
          "warranty"
        ) && (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
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
  ] =
    useState("");

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

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
        setDeleting(
          true
        );

        await onDelete();
      } finally {
        setDeleting(
          false
        );
      }
    };

  const submitTag =
    () => {
      const tag =
        tagInput.trim();

      if (!tag) {
        return;
      }

      onAddTag(
        tag
      );

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
        onClick={
          onClose
        }
        className="fixed inset-0 z-40 bg-[#0F2745]/20 backdrop-blur-sm"
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
          type:
            "spring",
          damping: 27,
          stiffness:
            220,
        }}
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl md:w-[600px]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F6F8FB] font-black text-[#1F5EA8]">
              {receipt.merchant.charAt(
                0
              ) ||
                "R"}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-[#0F2745]">
                {
                  receipt.merchant
                }
              </h2>

              <p className="truncate text-xs text-slate-500">
                {receipt.receiptNumber ||
                  "No receipt number"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={
                onFavorite
              }
              className="rounded-xl p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-500"
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
              disabled={
                deleting
              }
              className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#0F2745]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-6 pb-24">
          <div className="rounded-3xl border border-slate-100 bg-[#F6F8FB] py-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Total Amount
            </p>

            <h3 className="mt-1 text-4xl font-black text-[#0F2745]">
              {formatMoney(
                receipt
              )}
            </h3>

            <p className="mt-2 flex items-center justify-center gap-1 text-sm text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Saved Purchase Record
            </p>
          </div>

          <section>
            <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#0F2745]">
              Purchase Details
            </h3>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <DetailRow
                label="Date"
                value={
                  formatDate(
                    receipt.date
                  )
                }
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

          {receipt.lineItems.length >
            0 && (
            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#0F2745]">
                Line Items
              </h3>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {receipt.lineItems.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      className={`flex items-center justify-between gap-4 p-4 ${
                        index !==
                        receipt.lineItems.length -
                          1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="font-bold text-[#0F2745]">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
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

                      <p className="font-black text-[#0F2745]">
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

          {(receipt.warrantyExpiry ||
            receipt.returnDeadline) && (
            <section>
              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#0F2745]">
                Warranty / Return
              </h3>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {receipt.warrantyExpiry && (
                  <DetailRow
                    label="Warranty Expiry"
                    value={
                      formatDate(
                        receipt.warrantyExpiry
                      )
                    }
                  />
                )}

                {receipt.returnDeadline && (
                  <DetailRow
                    label="Return Deadline"
                    value={
                      formatDate(
                        receipt.returnDeadline
                      )
                    }
                    isLast
                  />
                )}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-[#0F2745]">
              Tags
            </h3>

            <div className="flex flex-wrap gap-2">
              {receipt.tags.map(
                (
                  tag
                ) => (
                  <span
                    key={
                      tag
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#F6F8FB] px-3 py-1.5 text-sm text-slate-600"
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
                value={
                  tagInput
                }
                maxLength={
                  32
                }
                onChange={(
                  event
                ) =>
                  setTagInput(
                    event.target.value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    submitTag();
                  }
                }}
                placeholder="Add a tag"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#1F5EA8] focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={
                  submitTag
                }
                className="rounded-xl bg-[#1F5EA8] px-4 py-2 text-sm font-black text-white"
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-[#1F5EA8]"
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
          ? "border-b border-slate-100"
          : ""
      }`}
    >
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-[#0F2745]">
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
  initialStep:
    ModalStep;
  onClose: () => void;
  onSaved:
    (
      receipt:
        ReceiptData
    ) => void;
}) {
  const [
    step,
    setStep,
  ] =
    useState<ModalStep>(
      initialStep
    );

  const [
    scanProgress,
    setScanProgress,
  ] =
    useState(0);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    merchant,
    setMerchant,
  ] =
    useState("");

  const [
    total,
    setTotal,
  ] =
    useState("");

  const [
    tax,
    setTax,
  ] =
    useState("0");

  const [
    date,
    setDate,
  ] =
    useState(
      new Date()
        .toISOString()
        .split(
          "T"
        )[0]
    );

  const [
    category,
    setCategory,
  ] =
    useState(
      "Uncategorized"
    );

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState("");

  const [
    receiptNumber,
    setReceiptNumber,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<ReceiptStatus>(
      "normal"
    );

  const [
    warrantyExpiry,
    setWarrantyExpiry,
  ] =
    useState("");

  const [
    returnDeadline,
    setReturnDeadline,
  ] =
    useState("");

  const [
    tags,
    setTags,
  ] =
    useState("");

  const [
    aiParsed,
    setAiParsed,
  ] =
    useState(false);

  const startDemoScan =
    () => {
      setStep(
        "scanning"
      );

      setScanProgress(
        0
      );

      let progress =
        0;

      const timer =
        window.setInterval(
          () => {
            progress +=
              5;

            setScanProgress(
              progress
            );

            if (
              progress >=
              100
            ) {
              window.clearInterval(
                timer
              );

              window.setTimeout(
                () => {
                  setMerchant(
                    "Coffee House"
                  );

                  setTotal(
                    "850"
                  );

                  setTax(
                    "120"
                  );

                  setCategory(
                    "Dining"
                  );

                  setPaymentMethod(
                    "Card"
                  );

                  setReceiptNumber(
                    "SCAN-DEMO"
                  );

                  setAiParsed(
                    true
                  );

                  setStep(
                    "form"
                  );
                },
                350
              );
            }
          },
          80
        );
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

  const handleSave =
    async () => {
      const amount =
        Number(
          total
        );

      const taxAmount =
        Number(
          tax ||
            0
        );

      if (
        !merchant.trim() ||
        !Number.isFinite(
          amount
        ) ||
        amount <= 0 ||
        !date
      ) {
        setErrorMessage(
          "Merchant, amount, and date are required."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setErrorMessage(
          ""
        );

        const response =
          await createReceipt(
            {
              merchant:
                merchant.trim(),

              total:
                amount,

              tax:
                Number.isFinite(
                  taxAmount
                )
                  ? Math.max(
                      taxAmount,
                      0
                    )
                  : 0,

              currency:
                "BDT",

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

              tags:
                tags
                  .split(
                    ","
                  )
                  .map(
                    (
                      tag
                    ) =>
                      tag.trim()
                  )
                  .filter(
                    Boolean
                  ),

              lineItems:
                [],

              isAiParsed:
                aiParsed,
            }
          );

        if (
          !response
            ?.success ||
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
      } catch (
        error
      ) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to save receipt."
          )
        );
      } finally {
        setSaving(
          false
        );
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
          step !==
          "scanning"
            ? onClose
            : undefined
        }
        className="absolute inset-0 bg-[#0F2745]/30 backdrop-blur-sm"
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
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#F6F8FB] px-6 py-4">
          <h2 className="flex items-center gap-2 font-black text-[#0F2745]">
            <Zap className="h-5 w-5 text-[#1F5EA8]" />
            Receipt Capture
          </h2>

          {step !==
            "scanning" && (
            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-full p-2 transition hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {step ===
            "upload" && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={
                  startDemoScan
                }
                className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#1F5EA8]/30 bg-blue-50/50 p-10 text-center transition hover:bg-blue-50"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                  <UploadCloud className="h-8 w-8 text-[#1F5EA8]" />
                </div>

                <h3 className="text-lg font-black text-[#0F2745]">
                  Scan Receipt Demo
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  OCR upload is not connected yet. This demo fills sample fields so you can test the backend save flow.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setStep(
                    "form"
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <Edit3 className="h-5 w-5" />
                Manual Entry
              </button>
            </div>
          )}

          {step ===
            "scanning" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12">
              <div className="relative h-64 w-48 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100 shadow-inner">
                <div
                  className="absolute inset-x-0 h-1 bg-[#1F5EA8] shadow-[0_0_15px_rgba(31,94,168,0.8)]"
                  style={{
                    top:
                      `${scanProgress}%`,
                  }}
                />

                <FileText className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-slate-300" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-black text-[#0F2745]">
                  Processing Demo Scan...
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  This is a UI simulation, not real OCR.
                </p>
              </div>

              <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full bg-[#1F5EA8]"
                  animate={{
                    width:
                      `${scanProgress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {step ===
            "form" && (
            <div className="space-y-5">
              {aiParsed && (
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                  <div>
                    <p className="text-sm font-black text-blue-800">
                      Demo fields prepared
                    </p>

                    <p className="mt-1 text-xs text-blue-600">
                      Review and edit everything before saving.
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                  {
                    errorMessage
                  }
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Merchant"
                >
                  <input
                    type="text"
                    value={
                      merchant
                    }
                    onChange={(
                      event
                    ) =>
                      setMerchant(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                    placeholder="e.g. TechLand"
                  />
                </Field>

                <Field
                  label="Total Amount"
                >
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      total
                    }
                    onChange={(
                      event
                    ) =>
                      setTotal(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                    placeholder="0"
                  />
                </Field>

                <Field
                  label="Tax / VAT"
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      tax
                    }
                    onChange={(
                      event
                    ) =>
                      setTax(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>

                <Field
                  label="Purchase Date"
                >
                  <input
                    type="date"
                    value={
                      date
                    }
                    onChange={(
                      event
                    ) =>
                      setDate(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>

                <Field
                  label="Category"
                >
                  <input
                    type="text"
                    value={
                      category
                    }
                    onChange={(
                      event
                    ) =>
                      setCategory(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                    placeholder="Electronics"
                  />
                </Field>

                <Field
                  label="Payment Method"
                >
                  <input
                    type="text"
                    value={
                      paymentMethod
                    }
                    onChange={(
                      event
                    ) =>
                      setPaymentMethod(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                    placeholder="Card / Cash / Wallet"
                  />
                </Field>

                <Field
                  label="Receipt Number"
                >
                  <input
                    type="text"
                    value={
                      receiptNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setReceiptNumber(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                    placeholder="INV-12345"
                  />
                </Field>

                <Field
                  label="Status"
                >
                  <select
                    value={
                      status
                    }
                    onChange={(
                      event
                    ) =>
                      setStatus(
                        event.target.value as ReceiptStatus
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

                <Field
                  label="Warranty Expiry"
                >
                  <input
                    type="date"
                    value={
                      warrantyExpiry
                    }
                    onChange={(
                      event
                    ) =>
                      setWarrantyExpiry(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>

                <Field
                  label="Return Deadline"
                >
                  <input
                    type="date"
                    value={
                      returnDeadline
                    }
                    onChange={(
                      event
                    ) =>
                      setReturnDeadline(
                        event.target.value
                      )
                    }
                    className="receipt-input"
                  />
                </Field>
              </div>

              <Field
                label="Tags"
              >
                <input
                  type="text"
                  value={
                    tags
                  }
                  onChange={(
                    event
                  ) =>
                    setTags(
                      event.target.value
                    )
                  }
                  className="receipt-input"
                  placeholder="Business, Hardware, Personal"
                />
              </Field>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    onClose
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleSave()
                  }
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F5EA8] px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-[#173F6D] disabled:cursor-not-allowed disabled:opacity-60"
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
      </motion.div>

      <style jsx>{`
        .receipt-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          background: #f6f8fb;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: #0f2745;
          outline: none;
          transition: 0.2s ease;
        }

        .receipt-input:focus {
          border-color: #1f5ea8;
          background: white;
          box-shadow: 0 0 0 3px rgba(31, 94, 168, 0.1);
        }
      `}</style>
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
  children:
    React.ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}
