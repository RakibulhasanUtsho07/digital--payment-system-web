"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  Download,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  UserRecord,
  UserRole,
  UserStatus,
} from "./UserManagementTypes";

export function CreateUserModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (
    user: UserRecord
  ) => void;
}) {
  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    role,
    setRole,
  ] = useState<UserRole>(
    "user"
  );

  const submit = () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      return;
    }

    const newUser: UserRecord =
      {
        id: `usr_${Date.now()}`,
        name:
          name.trim(),
        email:
          email
            .trim()
            .toLowerCase(),
        phone:
          phone.trim(),
        role,
        status:
          "active",
        kycStatus:
          "not_started",
        walletStatus:
          "active",
        riskLevel:
          "low",
        riskScore:
          10,
        balance:
          0,
        totalReceived:
          0,
        totalSent:
          0,
        transactionCount:
          0,
        lastActive:
          "Just now",
        joinedAt:
          new Date()
            .toISOString()
            .slice(
              0,
              10
            ),
        city:
          "Dhaka",
        country:
          "Bangladesh",
        walletId:
          `wal_${Date.now()}`,
        twoFactorEnabled:
          false,
        failedLoginCount:
          0,
        activeSessions:
          1,
      };

    onCreate(
      newUser
    );

    setName("");
    setEmail("");
    setPhone("");
    setRole("user");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={
        onClose
      }
    >
      <Header
        icon={
          UserPlus
        }
        title="Add User"
        description="Create a demo user record. Connect your real admin API before production."
        onClose={
          onClose
        }
      />

      <div className="mt-6 space-y-4">
        <Field
          label="Full Name"
          value={
            name
          }
          onChange={
            setName
          }
          placeholder="Enter full name"
        />

        <Field
          label="Email"
          type="email"
          value={
            email
          }
          onChange={
            setEmail
          }
          placeholder="name@example.com"
        />

        <Field
          label="Phone"
          value={
            phone
          }
          onChange={
            setPhone
          }
          placeholder="016XXXXXXXX"
        />

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-slate-700">
            Role
          </span>

          <select
            value={
              role
            }
            onChange={(event) =>
              setRole(
                event
                  .target
                  .value as UserRole
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#1F5EA8]"
          >
            <option value="user">
              User
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="support">
              Support (demo)
            </option>

            <option value="analyst">
              Analyst (demo)
            </option>
          </select>
        </label>
      </div>

      <Footer
        onCancel={
          onClose
        }
        onConfirm={
          submit
        }
        confirmLabel="Create User"
      />
    </Modal>
  );
}

export function SuspendUserModal({
  open,
  user,
  onClose,
  onConfirm,
}: {
  open: boolean;
  user: UserRecord | null;
  onClose: () => void;
  onConfirm: (
    id: string,
    status: UserStatus
  ) => void;
}) {
  const [
    reason,
    setReason,
  ] = useState(
    "Suspicious activity"
  );

  if (!user) {
    return null;
  }

  return (
    <Modal
      open={
        open
      }
      onClose={
        onClose
      }
    >
      <Header
        icon={
          ShieldAlert
        }
        title={`Suspend ${user.name}?`}
        description="This is a demo state change. Production suspension must be enforced by the backend."
        onClose={
          onClose
        }
      />

      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-xs leading-5 text-red-800">
            The user would lose access to protected account functionality.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs font-bold text-slate-700">
          Reason
        </label>

        <select
          value={
            reason
          }
          onChange={(event) =>
            setReason(
              event.target.value
            )
          }
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
        >
          <option>
            Suspicious activity
          </option>

          <option>
            KYC issue
          </option>

          <option>
            Policy violation
          </option>

          <option>
            User request
          </option>

          <option>
            Other
          </option>
        </select>
      </div>

      <Footer
        onCancel={
          onClose
        }
        onConfirm={() =>
          onConfirm(
            user.id,
            "suspended"
          )
        }
        confirmLabel="Suspend User"
        danger
      />
    </Modal>
  );
}

export function ExportUsersModal({
  open,
  onClose,
  users,
}: {
  open: boolean;
  onClose: () => void;
  users: UserRecord[];
}) {
  const downloadCsv =
    () => {
      const header = [
        "Name",
        "Email",
        "Phone",
        "Role",
        "Status",
        "KYC",
        "Wallet",
        "Risk",
        "Balance",
        "Joined",
      ];

      const rows =
        users.map(
          (user) =>
            [
              user.name,
              user.email,
              user.phone,
              user.role,
              user.status,
              user.kycStatus,
              user.walletStatus,
              user.riskLevel,
              user.balance,
              user.joinedAt,
            ]
              .map(
                (value) =>
                  `"${String(
                    value
                  ).replaceAll(
                    '"',
                    '""'
                  )}"`
              )
              .join(",")
        );

      const blob =
        new Blob(
          [
            [
              header.join(
                ","
              ),
              ...rows,
            ].join(
              "\n"
            ),
          ],
          {
            type:
              "text/csv;charset=utf-8;",
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

      anchor.href =
        url;

      anchor.download =
        "novawallet-users.csv";

      anchor.click();

      URL.revokeObjectURL(
        url
      );

      onClose();
    };

  return (
    <Modal
      open={open}
      onClose={
        onClose
      }
    >
      <Header
        icon={
          Download
        }
        title="Export Users"
        description="This generates a local CSV from the current demo dataset."
        onClose={
          onClose
        }
      />

      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-900">
          {users.length.toLocaleString()} records
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Export includes name, contact, role, status, KYC, wallet, risk,
          balance and joined date.
        </p>
      </div>

      <Footer
        onCancel={
          onClose
        }
        onConfirm={
          downloadCsv
        }
        confirmLabel="Download CSV"
      />
    </Modal>
  );
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={
              onClose
            }
            className="absolute inset-0"
            aria-label="Close modal"
          />

          <motion.div
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.97,
            }}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Header({
  icon: Icon,
  title,
  description,
  onClose,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Footer({
  onCancel,
  onConfirm,
  confirmLabel,
  danger = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={
          onCancel
        }
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={
          onConfirm
        }
        className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white ${
          danger
            ? "bg-red-600 hover:bg-red-700"
            : "bg-[#1F5EA8] hover:bg-[#17466F]"
        }`}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#1F5EA8] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
    </label>
  );
}