/* =========================================================
   DASHBOARD ROLES
========================================================= */

export type DashboardRole =
  | "admin"
  | "super_admin"
  | "user"
  | "merchant"
  | "support"
  | "analyst";

/* =========================================================
   VALID ROLES
========================================================= */

const DASHBOARD_ROLES =
  new Set<DashboardRole>([
    "admin",
    "super_admin",
    "user",
    "merchant",
    "support",
    "analyst",
  ]);

/* =========================================================
   ROLE VALIDATION
========================================================= */

export function isDashboardRole(
  value: unknown
): value is DashboardRole {
  return (
    typeof value === "string" &&
    DASHBOARD_ROLES.has(
      value as DashboardRole
    )
  );
}

/* =========================================================
   ROLE HOME ROUTES
========================================================= */

export const DASHBOARD_HOME_BY_ROLE:
  Record<
    DashboardRole,
    string
  > = {
  user:
    "/dashboard",

  admin:
    "/dashboard",

  super_admin:
    "/dashboard",

  merchant:
    "/dashboard/merchant",

  analyst:
    "/dashboard/analyst",

  support:
    "/dashboard/support-dashboard",
};

/* =========================================================
   GET ROLE HOME
========================================================= */

export function getDashboardHome(
  role: DashboardRole
): string {
  return DASHBOARD_HOME_BY_ROLE[
    role
  ];
}

/* =========================================================
   WORKSPACE RULES

   These are role-specific workspaces.

   A merchant cannot enter analyst workspace.
   An analyst cannot enter merchant workspace.
   A normal user cannot enter admin workspace.
========================================================= */

interface WorkspaceRule {
  prefix: string;

  roles:
    DashboardRole[];
}

const WORKSPACE_RULES:
  WorkspaceRule[] = [
    {
      prefix:
        "/dashboard/merchant",

      roles: [
        "merchant",
      ],
    },

    {
      prefix:
        "/dashboard/analyst",

      roles: [
        "analyst",
      ],
    },

    {
      prefix:
        "/dashboard/support-dashboard",

      roles: [
        "support",
      ],
    },

    {
      prefix:
        "/dashboard/admin",

      roles: [
        "admin",
        "super_admin",
      ],
    },
  ];

/* =========================================================
   PATH MATCH
========================================================= */

function matchesPath(
  pathname: string,
  prefix: string
): boolean {
  return (
    pathname === prefix ||
    pathname.startsWith(
      `${prefix}/`
    )
  );
}

/* =========================================================
   ROLE REDIRECT

   Returns:
   - null = current path is okay
   - string = redirect required
========================================================= */

export function getRoleRedirectPath(
  role: DashboardRole,
  pathname: string
): string | null {
  const home =
    getDashboardHome(
      role
    );

  /* =======================================================
     SPECIAL WORKSPACE ROLES

     /dashboard should NOT show personal wallet dashboard.
  ======================================================= */

  if (
    pathname ===
      "/dashboard" &&
    (
      role ===
        "merchant" ||
      role ===
        "analyst" ||
      role ===
        "support"
    )
  ) {
    return home;
  }

  /* =======================================================
     BLOCK OTHER ROLE WORKSPACES
  ======================================================= */

  for (
    const rule of
    WORKSPACE_RULES
  ) {
    if (
      !matchesPath(
        pathname,
        rule.prefix
      )
    ) {
      continue;
    }

    if (
      !rule.roles.includes(
        role
      )
    ) {
      return home;
    }

    return null;
  }

  return null;
}

/* =========================================================
   ROLE LABEL
========================================================= */

export function getDashboardRoleLabel(
  role: DashboardRole
): string {
  switch (role) {
    case "admin":
      return "Administrator";

    case "super_admin":
      return "Super Administrator";

    case "merchant":
      return "Merchant";

    case "analyst":
      return "Analyst";

    case "support":
      return "Support Agent";

    case "user":
    default:
      return "User";
  }
}