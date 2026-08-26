"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Users,
} from "lucide-react";

const rows = [
  {
    capability:
      "View user profiles",
    admin: true,
    support: true,
    analyst: true,
  },
  {
    capability:
      "Reset passwords",
    admin: true,
    support: true,
    analyst: false,
  },
  {
    capability:
      "Approve KYC",
    admin: true,
    support: true,
    analyst: false,
  },
  {
    capability:
      "View audit logs",
    admin: true,
    support: false,
    analyst: true,
  },
  {
    capability:
      "Change system configuration",
    admin: true,
    support: false,
    analyst: false,
  },
];

export default function RolePermissionMatrix() {
  return (
    <section className="space-y-7">
      <Header
        title="Users & Roles"
        description="Review role capabilities and keep privileged access aligned with least-privilege principles."
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[720px] w-full bg-white text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-xs font-bold text-slate-500">
                Capability
              </th>

              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500">
                Admin
              </th>

              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500">
                Support
              </th>

              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500">
                Analyst
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map(
              (row) => (
                <tr
                  key={
                    row.capability
                  }
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">
                    {row.capability}
                  </td>

                  <PermissionCell
                    allowed={
                      row.admin
                    }
                  />

                  <PermissionCell
                    allowed={
                      row.support
                    }
                  />

                  <PermissionCell
                    allowed={
                      row.analyst
                    }
                  />
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

          <p className="text-xs leading-5 text-amber-800">
            UI permission controls do not replace server-side authorization.
            Backend middleware must enforce every privileged action.
          </p>
        </div>
      </div>
    </section>
  );
}

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1F5EA8]">
          <Users className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#0F2745]">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function PermissionCell({
  allowed,
}: {
  allowed: boolean;
}) {
  return (
    <td className="px-5 py-4 text-center">
      {allowed ? (
        <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
      ) : (
        <Lock className="mx-auto h-4 w-4 text-slate-300" />
      )}
    </td>
  );
}