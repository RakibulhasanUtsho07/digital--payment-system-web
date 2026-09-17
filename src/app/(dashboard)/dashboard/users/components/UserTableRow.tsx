"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import type {
  LucideIcon,
} from "lucide-react";

import {
  ArrowDownRight,
  ArrowUpRight,
  Edit3,
  Eye,
  MoreHorizontal,
  ShieldAlert,
  Trash2,
  WalletCards,
} from "lucide-react";

import type {
  ColumnVisibility,
  UserRecord,
} from "./UserManagementTypes";

import UserAvatar from "./UserAvatar";

/* =========================================================
   TYPES
========================================================= */

interface UserTableRowProps {
  user: UserRecord;
  columns: ColumnVisibility;
  selected: boolean;

  onToggle: (
    id: string
  ) => void;

  onOpen: (
    user: UserRecord
  ) => void;

  onEdit: (
    user: UserRecord
  ) => void;

  onSuspend: (
    user: UserRecord
  ) => void;

  onDelete: (
    user: UserRecord
  ) => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function UserTableRow({
  user,
  columns,
  selected,
  onToggle,
  onOpen,
  onEdit,
  onSuspend,
  onDelete,
}: UserTableRowProps) {
  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const menuRef =
    useRef<HTMLTableCellElement>(
      null
    );

  /* =======================================================
     OUTSIDE CLICK
  ======================================================== */

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleOutsideClick =
      (
        event: MouseEvent
      ) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target as Node
          )
        ) {
          setMenuOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, [menuOpen]);

  /* =======================================================
     DATA
  ======================================================== */

  const safeBalance =
    Number.isFinite(
      Number(
        user.balance
      )
    )
      ? Number(
          user.balance
        )
      : 0;

  return (
    <motion.tr
      layout
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration:
          0.18,
      }}
      className={`
        group
        border-t
        border-border/70
        transition-colors
        ${
          selected
            ? "bg-[var(--dashboard-primary-soft)]"
            : "hover:bg-muted/35"
        }
      `}
    >
      {/* ===================================================
          CHECKBOX
      ==================================================== */}

      <td className="w-12 px-4 py-4">
        <input
          type="checkbox"
          checked={
            selected
          }
          onChange={() =>
            onToggle(
              user.id
            )
          }
          aria-label={`Select ${user.name}`}
          className="
            h-4
            w-4
            rounded
            border-border
            accent-[var(--dashboard-primary)]
            focus:ring-2
            focus:ring-[var(--dashboard-primary)]/20
          "
        />
      </td>

      {/* ===================================================
          USER
      ==================================================== */}

      <td className="px-2 py-4">
        <button
          type="button"
          onClick={() =>
            onOpen(
              user
            )
          }
          className="
            flex
            min-w-0
            items-center
            gap-3
            text-left
            outline-none
          "
        >
          <UserAvatar
            name={
              user.name
            }
            avatarUrl={
              user.avatarUrl
            }
            status={
              user.status
            }
            size="md"
          />

          <span className="min-w-0">
            <strong
              className="
                block
                truncate
                text-sm
                font-black
                text-card-foreground
                transition-colors
                group-hover:text-[var(--dashboard-primary)]
              "
            >
              {
                user.name
              }
            </strong>

            <span className="block max-w-[260px] truncate text-[10px] text-muted-foreground">
              {
                user.email
              }
            </span>

            <span className="mt-0.5 block max-w-[260px] truncate text-[8px] text-muted-foreground/50">
              ID:{" "}
              {
                user.id
              }
            </span>
          </span>
        </button>
      </td>

      {/* ===================================================
          PHONE
      ==================================================== */}

      {columns.phone && (
        <td
          className="
            hidden
            px-2
            py-4
            text-xs
            font-medium
            text-muted-foreground
            lg:table-cell
          "
        >
          {
            user.phone ||
              "—"
          }
        </td>
      )}

      {/* ===================================================
          ROLE
      ==================================================== */}

      {columns.role && (
        <td className="hidden px-2 py-4 md:table-cell">
          <Badge
            value={
              user.role
            }
          />
        </td>
      )}

      {/* ===================================================
          KYC
      ==================================================== */}

      {columns.kyc && (
        <td className="hidden px-2 py-4 xl:table-cell">
          <Badge
            value={
              user.kycStatus
            }
          />
        </td>
      )}

      {/* ===================================================
          WALLET
      ==================================================== */}

      {columns.wallet && (
        <td className="hidden px-2 py-4 xl:table-cell">
          <div className="flex flex-col gap-1.5">
            <Badge
              value={
                user.walletStatus
              }
              icon={
                <WalletCards className="h-3 w-3" />
              }
            />

            <span className="text-[9px] font-bold text-muted-foreground">
              {formatMoney(
                safeBalance
              )}
            </span>
          </div>
        </td>
      )}

      {/* ===================================================
          RISK
      ==================================================== */}

      {columns.risk && (
        <td className="hidden px-2 py-4 md:table-cell">
          <div className="flex flex-col gap-1.5">
            <Badge
              value={
                user.riskLevel
              }
            />

            <span className="text-[8px] font-bold text-muted-foreground">
              {Math.min(
                100,
                Math.max(
                  0,
                  Number(
                    user.riskScore
                  ) || 0
                )
              )}
              /100
            </span>
          </div>
        </td>
      )}

      {/* ===================================================
          LAST ACTIVE
      ==================================================== */}

      {columns.lastActive && (
        <td
          className="
            hidden
            px-2
            py-4
            text-[10px]
            font-semibold
            text-muted-foreground
            2xl:table-cell
          "
        >
          {
            formatDate(
              user.lastActive
            )
          }
        </td>
      )}

      {/* ===================================================
          JOINED
      ==================================================== */}

      {columns.joined && (
        <td
          className="
            hidden
            px-2
            py-4
            text-[10px]
            text-muted-foreground
            2xl:table-cell
          "
        >
          {
            formatDate(
              user.joinedAt
            )
          }
        </td>
      )}

      {/* ===================================================
          MENU
      ==================================================== */}

      <td
        className="
          relative
          w-14
          px-3
          py-4
          text-right
        "
        ref={
          menuRef
        }
      >
        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              (
                previous
              ) =>
                !previous
            )
          }
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-muted-foreground
            transition
            hover:bg-muted
            hover:text-foreground
            focus:outline-none
            focus:ring-2
            focus:ring-[var(--dashboard-primary)]/20
          "
          aria-label={`Actions for ${user.name}`}
          aria-expanded={
            menuOpen
          }
          aria-haspopup="true"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{
                opacity: 0,
                y: 6,
                scale:
                  0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 6,
                scale:
                  0.96,
              }}
              transition={{
                duration:
                  0.15,
              }}
              className="
                absolute
                right-4
                top-12
                z-50
                w-48
                overflow-hidden
                rounded-2xl
                border
                border-border
                bg-card
                p-1.5
                text-left
                shadow-2xl
              "
            >
              <MenuButton
                icon={
                  Eye
                }
                label="View details"
                onClick={() => {
                  onOpen(
                    user
                  );
                  setMenuOpen(
                    false
                  );
                }}
              />

              <MenuButton
                icon={
                  Edit3
                }
                label="Edit user"
                onClick={() => {
                  onEdit(
                    user
                  );
                  setMenuOpen(
                    false
                  );
                }}
              />

              <MenuButton
                icon={
                  ShieldAlert
                }
                label="Suspend"
                onClick={() => {
                  onSuspend(
                    user
                  );
                  setMenuOpen(
                    false
                  );
                }}
              />

              <MenuButton
                icon={
                  Trash2
                }
                label="Delete"
                danger
                onClick={() => {
                  onDelete(
                    user
                  );
                  setMenuOpen(
                    false
                  );
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}

/* =========================================================
   MENU BUTTON
========================================================= */

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: MenuButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{
        x: 2,
      }}
      onClick={
        onClick
      }
      className="
        flex
        w-full
        items-center
        gap-2.5
        rounded-xl
        px-3
        py-2.5
        text-xs
        font-semibold
        transition-colors
        focus:outline-none
      "
      style={{
        color:
          danger
            ? "var(--dashboard-danger)"
            : "var(--muted-foreground)",
        background:
          "transparent",
      }}
      onMouseEnter={(
        event
      ) => {
        event.currentTarget.style.background =
          danger
            ? "color-mix(in srgb, var(--dashboard-danger) 8%, var(--card))"
            : "var(--muted)";
      }}
      onMouseLeave={(
        event
      ) => {
        event.currentTarget.style.background =
          "transparent";
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {
        label
      }
    </motion.button>
  );
}

/* =========================================================
   BADGE
========================================================= */

interface BadgeProps {
  value: string;
  icon?: React.ReactNode;
}

export function Badge({
  value,
  icon,
}: BadgeProps) {
  const normalized =
    String(
      value ?? ""
    ).replaceAll(
      "_",
      " "
    );

  const styles: Record<
    string,
    {
      background: string;
      color: string;
    }
  > = {
    active: {
      background:
        "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))",
      color:
        "var(--dashboard-success)",
    },

    verified: {
      background:
        "color-mix(in srgb, var(--dashboard-success) 10%, var(--card))",
      color:
        "var(--dashboard-success)",
    },

    user: {
      background:
        "var(--dashboard-primary-soft)",
      color:
        "var(--dashboard-primary)",
    },

    admin: {
      background:
        "color-mix(in srgb, #8b5cf6 11%, var(--card))",
      color:
        "#8b5cf6",
    },

    support: {
      background:
        "color-mix(in srgb, #8b5cf6 11%, var(--card))",
      color:
        "#8b5cf6",
    },

    analyst: {
      background:
        "color-mix(in srgb, #06b6d4 10%, var(--card))",
      color:
        "#0891b2",
    },

    pending: {
      background:
        "color-mix(in srgb, var(--dashboard-warning) 11%, var(--card))",
      color:
        "var(--dashboard-warning)",
    },

    under_review: {
      background:
        "color-mix(in srgb, var(--dashboard-warning) 11%, var(--card))",
      color:
        "var(--dashboard-warning)",
    },

    not_started: {
      background:
        "var(--muted)",
      color:
        "var(--muted-foreground)",
    },

    rejected: {
      background:
        "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))",
      color:
        "var(--dashboard-danger)",
    },

    suspended: {
      background:
        "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))",
      color:
        "var(--dashboard-danger)",
    },

    frozen: {
      background:
        "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))",
      color:
        "var(--dashboard-danger)",
    },

    restricted: {
      background:
        "color-mix(in srgb, var(--dashboard-warning) 11%, var(--card))",
      color:
        "var(--dashboard-warning)",
    },

    high: {
      background:
        "color-mix(in srgb, var(--dashboard-danger) 10%, var(--card))",
      color:
        "var(--dashboard-danger)",
    },

    medium: {
      background:
        "color-mix(in srgb, var(--dashboard-warning) 11%, var(--card))",
      color:
        "var(--dashboard-warning)",
    },

    low: {
      background:
        "var(--muted)",
      color:
        "var(--muted-foreground)",
    },

    closed: {
      background:
        "var(--muted)",
      color:
        "var(--muted-foreground)",
    },
  };

  const style =
    styles[
      value
    ] ?? {
      background:
        "var(--muted)",
      color:
        "var(--muted-foreground)",
    };

  return (
    <span
      className="
        inline-flex
        w-fit
        items-center
        gap-1.5
        rounded-full
        px-2.5
        py-1
        text-[8px]
        font-black
        capitalize
      "
      style={{
        background:
          style.background,
        color:
          style.color,
      }}
    >
      {icon}
      {
        normalized
      }
    </span>
  );
}

/* =========================================================
   MONEY
========================================================= */

function formatMoney(
  value: number
) {
  try {
    return new Intl.NumberFormat(
      "en-BD",
      {
        style:
          "currency",
        currency:
          "BDT",
        maximumFractionDigits: 0,
      }
    ).format(
      value
    );
  } catch {
    return `৳${value.toLocaleString(
      "en-BD"
    )}`;
  }
}

/* =========================================================
   INITIALS
========================================================= */

function getInitials(
  name: string
): string {
  if (
    !name
  ) {
    return "U";
  }

  return (
    name
      .trim()
      .split(
        /\s+/
      )
      .slice(
        0,
        2
      )
      .map(
        (
          part
        ) =>
          part.charAt(
            0
          )
      )
      .join("")
      .toUpperCase() ||
    "U"
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string
): string {
  try {
    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "N/A";
    }

    return new Intl.DateTimeFormat(
      "en-BD",
      {
        dateStyle:
          "medium",
        timeStyle:
          "short",
      }
    ).format(
      date
    );
  } catch {
    return "N/A";
  }
}