"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Users,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  UserRecord,
} from "./UserManagementTypes";

import UserModalShell, {
  ModalButton,
} from "./UserModalShell";

/* =========================================================
   TYPES
========================================================= */

interface ExportUsersModalProps {
  open: boolean;

  users: UserRecord[];

  onClose: () => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ExportUsersModal({
  open,
  users,
  onClose,
}: ExportUsersModalProps) {
  const [
    format,
    setFormat,
  ] = useState<
    "csv" | "json"
  >("csv");

  const safeUsers =
    useMemo(
      () =>
        Array.isArray(
          users
        )
          ? users
          : [],
      [users]
    );

  /* =======================================================
     RESET FORMAT
  ======================================================= */

  useEffect(() => {
    if (open) {
      setFormat("csv");
    }
  }, [open]);

  /* =======================================================
     DOWNLOAD
  ======================================================= */

  const handleDownload =
    () => {
      if (
        safeUsers.length ===
        0
      ) {
        return;
      }

      const payload =
        format === "json"
          ? createJsonExport(
              safeUsers
            )
          : createCsvExport(
              safeUsers
            );

      const mimeType =
        format === "json"
          ? "application/json;charset=utf-8"
          : "text/csv;charset=utf-8";

      const blob =
        new Blob(
          [payload],
          {
            type: mimeType,
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        `users-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.${format}`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        0
      );

      onClose();
    };

  /* =======================================================
     FOOTER
  ======================================================= */

  const footer =
    (
      <>
        <ModalButton
          onClick={onClose}
          tone="secondary"
        >
          Cancel
        </ModalButton>

        <ModalButton
          onClick={
            handleDownload
          }
          disabled={
            safeUsers.length ===
            0
          }
        >
          <span className="inline-flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />

            Download{" "}
            {format.toUpperCase()}
          </span>
        </ModalButton>
      </>
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <UserModalShell
      open={open}
      onClose={onClose}
      icon={Download}
      title="Export users"
      description={`Export ${safeUsers.length.toLocaleString()} currently filtered user records.`}
      footer={footer}
    >
      <div className="space-y-5">
        {/* =================================================
            EXPORT HERO
        ================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            relative
            overflow-hidden
            rounded-[24px]
            border
            border-indigo-200/60
            bg-gradient-to-br
            from-indigo-50
            via-violet-50
            to-fuchsia-50
            p-5
          "
        >
          <div className="relative z-10 flex items-start gap-3">
            <motion.div
              animate={{
                scale: [
                  1,
                  1.05,
                  1,
                ],
                rotate: [
                  0,
                  2,
                  -2,
                  0,
                ],
              }}
              transition={{
                duration: 3,
                repeat:
                  Infinity,
                ease: "easeInOut",
              }}
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-indigo-600
                to-violet-600
                text-white
                shadow-lg
                shadow-indigo-500/20
              "
            >
              <Database className="h-5 w-5" />
            </motion.div>

            <div className="min-w-0">
              <p className="text-sm font-black text-indigo-950">
                Data export center
              </p>

              <p className="mt-1 text-[10px] leading-5 text-indigo-900/65">
                Export the current filtered dataset in a format
                suitable for spreadsheets, reporting or developer workflows.
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-32
              w-32
              rounded-full
              bg-violet-400/20
              blur-3xl
            "
          />
        </motion.div>

        {/* =================================================
            RECORD SUMMARY
        ================================================= */}

        <div
          className="
            grid
            grid-cols-2
            gap-3
          "
        >
          <SummaryCard
            icon={Users}
            label="Selected records"
            value={safeUsers.length.toLocaleString()}
          />

          <SummaryCard
            icon={FileSpreadsheet}
            label="Current format"
            value={format.toUpperCase()}
          />
        </div>

        {/* =================================================
            FORMAT SELECTOR
        ================================================= */}

        <div>
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
              text-muted-foreground
            "
          >
            Export format
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormatOption
              active={
                format ===
                "csv"
              }
              icon={
                FileSpreadsheet
              }
              title="CSV"
              description="Best for Excel, Google Sheets and reporting."
              onClick={() =>
                setFormat(
                  "csv"
                )
              }
            />

            <FormatOption
              active={
                format ===
                "json"
              }
              icon={
                FileJson
              }
              title="JSON"
              description="Best for APIs, development and data pipelines."
              onClick={() =>
                setFormat(
                  "json"
                )
              }
            />
          </div>
        </div>

        {/* =================================================
            DATA NOTICE
        ================================================= */}

        <div
          className="
            rounded-2xl
            border
            border-border
            bg-muted/25
            p-4
          "
        >
          <div className="flex items-start gap-3">
            <Database
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{
                color:
                  "var(--dashboard-primary)",
              }}
            />

            <div>
              <p className="text-xs font-black text-card-foreground">
                Export scope
              </p>

              <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                Only the records currently supplied to this modal are
                exported. Filtering, sorting and pagination are managed
                outside this component.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {safeUsers.length ===
          0 && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="
              rounded-2xl
              border
              border-amber-200
              bg-amber-50
              p-4
            "
          >
            <p className="text-xs font-black text-amber-900">
              Nothing to export
            </p>

            <p className="mt-1 text-[10px] leading-5 text-amber-800">
              No user records match the current filters.
            </p>
          </motion.div>
        )}
      </div>
    </UserModalShell>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="
        rounded-2xl
        border
        border-border
        bg-card
        p-4
      "
    >
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-xl
        "
        style={{
          background:
            "var(--dashboard-primary-soft)",
          color:
            "var(--dashboard-primary)",
        }}
      >
        <Icon className="h-4 w-4" />
      </span>

      <p className="mt-3 text-[9px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-card-foreground">
        {value}
      </p>
    </motion.div>
  );
}

/* =========================================================
   FORMAT OPTION
========================================================= */

function FormatOption({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof FileSpreadsheet;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale:
          0.985,
      }}
      onClick={
        onClick
      }
      aria-pressed={
        active
      }
      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        p-4
        text-left
        transition-all
      "
      style={{
        background:
          active
            ? "var(--dashboard-primary-soft)"
            : "var(--card)",

        borderColor:
          active
            ? "var(--dashboard-primary)"
            : "var(--border)",

        boxShadow:
          active
            ? "0 10px 30px rgba(79,70,229,.10)"
            : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
          "
          style={{
            background:
              active
                ? "var(--dashboard-primary)"
                : "var(--muted)",
            color:
              active
                ? "var(--primary-foreground)"
                : "var(--muted-foreground)",
          }}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-card-foreground">
              {title}
            </p>

            {active && (
              <span
                className="
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  shadow-sm
                "
              >
                <Check
                  className="h-3.5 w-3.5"
                  style={{
                    color:
                      "var(--dashboard-primary)",
                  }}
                />
              </span>
            )}
          </div>

          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {active && (
        <motion.div
          initial={{
            scaleX: 0,
          }}
          animate={{
            scaleX: 1,
          }}
          transition={{
            duration:
              0.25,
          }}
          className="
            absolute
            bottom-0
            left-4
            right-4
            h-[3px]
            origin-center
            rounded-full
          "
          style={{
            background:
              "var(--dashboard-primary)",
          }}
        />
      )}
    </motion.button>
  );
}

/* =========================================================
   JSON EXPORT
========================================================= */

function createJsonExport(
  users: UserRecord[]
): string {
  return JSON.stringify(
    {
      exportedAt:
        new Date().toISOString(),

      count:
        users.length,

      users,
    },
    null,
    2
  );
}

/* =========================================================
   CSV EXPORT
========================================================= */

function createCsvExport(
  users: UserRecord[]
): string {
  const headers = [
    "id",
    "name",
    "email",
    "phone",
    "role",
    "status",
    "kycStatus",
    "walletStatus",
    "riskLevel",
    "riskScore",
    "balance",
    "totalReceived",
    "totalSent",
    "transactionCount",
    "lastActive",
    "joinedAt",
    "city",
    "country",
    "walletId",
    "twoFactorEnabled",
    "failedLoginCount",
    "activeSessions",
  ] as const;

  const rows =
    users.map(
      (user) =>
        headers
          .map(
            (header) =>
              csvCell(
                user[
                  header
                ]
              )
          )
          .join(",")
    );

  return [
    headers.join(","),
    ...rows,
  ].join("\n");
}

/* =========================================================
   CSV CELL
========================================================= */

function csvCell(
  value: unknown
): string {
  return `"${String(
    value ?? ""
  ).replaceAll(
    '"',
    '""'
  )}"`;
}