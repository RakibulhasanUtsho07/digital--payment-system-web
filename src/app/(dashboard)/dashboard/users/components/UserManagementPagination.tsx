"use client";

import React from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

/* =========================================================
   TYPES
========================================================= */

interface UserManagementPaginationProps {
  page: number;

  pageSize: number;

  total: number;

  totalPages: number;

  onPageChange: (
    page: number
  ) => void;

  onPageSizeChange: (
    size: number
  ) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserManagementPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: UserManagementPaginationProps) {
  const safeTotalPages =
    Math.max(
      1,
      totalPages
    );

  const safePage =
    Math.min(
      Math.max(
        1,
        page
      ),
      safeTotalPages
    );

  const start =
    total === 0
      ? 0
      : (safePage - 1) *
          pageSize +
        1;

  const end =
    Math.min(
      safePage *
        pageSize,
      total
    );

  /* =======================================================
     PAGE WINDOW
  ======================================================= */

  const pages =
    createPageWindow(
      safePage,
      safeTotalPages
    );

  return (
    <footer
      className="
        flex
        flex-col
        gap-4
        border-t
        border-border
        bg-card
        px-4
        py-4
        transition-colors
        duration-300
        sm:px-5
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
    >
      {/* ===================================================
          RANGE INFO
      ==================================================== */}

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <strong className="font-black text-card-foreground">
            {start.toLocaleString(
              "en-BD"
            )}
            {total > 0 &&
              "–"}
            {total > 0 &&
              end.toLocaleString(
                "en-BD"
              )}
          </strong>{" "}
          of{" "}
          <strong className="font-black text-card-foreground">
            {total.toLocaleString(
              "en-BD"
            )}
          </strong>
        </p>

        <p className="mt-1 text-[9px] text-muted-foreground/70">
          {safeTotalPages ===
          1
            ? "One page"
            : `${safeTotalPages} pages available`}
        </p>
      </div>

      {/* ===================================================
          CONTROLS
      ==================================================== */}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* PAGE SIZE */}

        <label
          className="
            flex
            items-center
            gap-2
            text-[9px]
            font-black
            uppercase
            tracking-wide
            text-muted-foreground
          "
        >
          Rows

          <select
            value={
              pageSize
            }
            onChange={(
              event
            ) =>
              onPageSizeChange(
                Number(
                  event.target
                    .value
                )
              )
            }
            className="
              h-9
              rounded-xl
              border
              border-border
              bg-muted/30
              px-2.5
              text-xs
              font-bold
              normal-case
              tracking-normal
              text-foreground
              outline-none
              transition
              focus:border-[var(--dashboard-primary)]
              focus:ring-4
              focus:ring-[var(--dashboard-primary)]/10
            "
          >
            <option value={10}>
              10
            </option>

            <option value={25}>
              25
            </option>

            <option value={50}>
              50
            </option>
          </select>
        </label>

        {/* DIVIDER */}

        <span className="mx-1 hidden h-6 w-px bg-border sm:block" />

        {/* FIRST */}

        <PageButton
          disabled={
            safePage <= 1
          }
          onClick={() =>
            onPageChange(
              1
            )
          }
          ariaLabel="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </PageButton>

        {/* PREVIOUS */}

        <PageButton
          disabled={
            safePage <= 1
          }
          onClick={() =>
            onPageChange(
              safePage - 1
            )
          }
          ariaLabel="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {/* NUMBERED PAGES */}

        <div className="flex items-center gap-1">
          {pages.map(
            (
              item,
              index
            ) => {
              if (
                item ===
                "ellipsis-left"
              ) {
                return (
                  <span
                    key={`${item}-${index}`}
                    className="
                      flex
                      h-9
                      w-8
                      items-center
                      justify-center
                      text-xs
                      font-black
                      text-muted-foreground/50
                    "
                  >
                    …
                  </span>
                );
              }

              if (
                item ===
                "ellipsis-right"
              ) {
                return (
                  <span
                    key={`${item}-${index}`}
                    className="
                      flex
                      h-9
                      w-8
                      items-center
                      justify-center
                      text-xs
                      font-black
                      text-muted-foreground/50
                    "
                  >
                    …
                  </span>
                );
              }

              const active =
                item ===
                safePage;

              return (
                <motion.button
                  key={
                    item
                  }
                  type="button"
                  whileHover={{
                    y: -1,
                  }}
                  whileTap={{
                    scale:
                      0.96,
                  }}
                  onClick={() =>
                    onPageChange(
                      item
                    )
                  }
                  className="
                    h-9
                    min-w-9
                    rounded-xl
                    px-2
                    text-xs
                    font-black
                    transition-all
                  "
                  style={{
                    background:
                      active
                        ? "var(--dashboard-primary)"
                        : "var(--card)",
                    color:
                      active
                        ? "var(--primary-foreground)"
                        : "var(--muted-foreground)",
                    border:
                      active
                        ? "1px solid transparent"
                        : "1px solid var(--border)",
                    boxShadow:
                      active
                        ? "0 8px 20px color-mix(in srgb, var(--dashboard-primary) 22%, transparent)"
                        : "none",
                  }}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                >
                  {
                    item
                  }
                </motion.button>
              );
            }
          )}
        </div>

        {/* NEXT */}

        <PageButton
          disabled={
            safePage >=
            safeTotalPages
          }
          onClick={() =>
            onPageChange(
              safePage + 1
            )
          }
          ariaLabel="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>

        {/* LAST */}

        <PageButton
          disabled={
            safePage >=
            safeTotalPages
          }
          onClick={() =>
            onPageChange(
              safeTotalPages
            )
          }
          ariaLabel="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </PageButton>
      </div>
    </footer>
  );
}

/* =========================================================
   PAGE BUTTON
========================================================= */

function PageButton({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;

  disabled: boolean;

  onClick: () => void;

  ariaLabel: string;
}) {
  return (
    <motion.button
      type="button"
      whileHover={
        disabled
          ? undefined
          : {
              y: -1,
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scale:
                0.96,
            }
      }
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      aria-label={
        ariaLabel
      }
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-xl
        border
        border-border
        bg-card
        text-muted-foreground
        transition-all
        hover:bg-muted
        hover:text-foreground
        disabled:cursor-not-allowed
        disabled:opacity-30
      "
    >
      {
        children
      }
    </motion.button>
  );
}

/* =========================================================
   PAGE WINDOW
========================================================= */

type PageItem =
  | number
  | "ellipsis-left"
  | "ellipsis-right";

function createPageWindow(
  current: number,
  totalPages: number
): PageItem[] {
  if (
    totalPages <=
    7
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index
      ) =>
        index + 1
    );
  }

  if (
    current <=
    4
  ) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis-right",
      totalPages,
    ];
  }

  if (
    current >=
    totalPages - 3
  ) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    current - 1,
    current,
    current + 1,
    "ellipsis-right",
    totalPages,
  ];
}