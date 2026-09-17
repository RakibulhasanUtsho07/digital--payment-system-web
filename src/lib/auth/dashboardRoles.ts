/* =========================================================
   DASHBOARD ROLES
========================================================= */

export const DASHBOARD_ROLES = [
  "user",
  "merchant",
  "support",
  "analyst",
  "admin",
  "super_admin",
] as const;

export type DashboardRole =
  (typeof DASHBOARD_ROLES)[number];

/* =========================================================
   ROLE SET
========================================================= */

const DASHBOARD_ROLE_SET =
  new Set<string>(
    DASHBOARD_ROLES
  );

/* =========================================================
   ROLE NORMALIZER

   Backend remains the source of truth.

   This only normalizes harmless formatting differences
   such as:
   - Analyst
   - analyst
   - ANALYST
   - " analyst "
   - super-admin
   - super admin

   Legacy typo "analist" is also mapped to "analyst"
   so an older development account does not break the UI.

   Backend authorization still performs the real security
   checks and should store canonical role values.
========================================================= */

export function normalizeDashboardRole(
  value: unknown
): DashboardRole | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (
    DASHBOARD_ROLE_SET.has(
      normalized
    )
  ) {
    return normalized as DashboardRole;
  }

  /*
   * Small compatibility aliases.
   *
   * They are intentionally limited.
   */
  switch (normalized) {
    case "administrator":
      return "admin";

    case "superadmin":
    case "super_administrator":
      return "super_admin";

    case "analist":
      return "analyst";

    case "support_agent":
      return "support";

    default:
      return null;
  }
}

/* =========================================================
   EXACT ROLE CHECK
========================================================= */

export function isDashboardRole(
  value: unknown
): value is DashboardRole {
  return (
    typeof value ===
      "string" &&
    DASHBOARD_ROLE_SET.has(
      value
    )
  );
}

/* =========================================================
   ROLE HOME
========================================================= */

const DASHBOARD_HOME_BY_ROLE:
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
   GET DASHBOARD HOME
========================================================= */

export function getDashboardHome(
  role: DashboardRole
): string {
  return (
    DASHBOARD_HOME_BY_ROLE[
      role
    ]
  );
}

/* =========================================================
   WORKSPACE RULES
========================================================= */

interface WorkspaceRule {
  prefix:
    string;

  allowedRoles:
    readonly DashboardRole[];
}

const WORKSPACE_RULES:
  WorkspaceRule[] = [
    {
      prefix:
        "/dashboard/merchant",

      allowedRoles: [
        "merchant",
      ],
    },

    {
      prefix:
        "/dashboard/analyst",

      allowedRoles: [
        "analyst",
      ],
    },

    {
      prefix:
        "/dashboard/support-dashboard",

      allowedRoles: [
        "support",
      ],
    },

    {
      prefix:
        "/dashboard/admin",

      allowedRoles: [
        "admin",
        "super_admin",
      ],
    },
  ];

/* =========================================================
   PATH MATCH
========================================================= */

function matchesWorkspace(
  pathname: string,
  prefix: string
): boolean {
  return (
    pathname ===
      prefix ||
    pathname.startsWith(
      `${prefix}/`
    )
  );
}

/* =========================================================
   ROLE REDIRECT

   null:
   current route is allowed.

   string:
   user must be redirected.
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
     ROLE-SPECIFIC ROOT REDIRECT

     These roles have their own dashboard root.
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
     PREVENT CROSS-WORKSPACE ACCESS
  ======================================================= */

  for (
    const rule of
    WORKSPACE_RULES
  ) {
    if (
      !matchesWorkspace(
        pathname,
        rule.prefix
      )
    ) {
      continue;
    }

    if (
      !rule.allowedRoles.includes(
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
   DASHBOARD LABEL
========================================================= */

export function getDashboardLabel(
  role: DashboardRole
): string {
  switch (role) {
    case "merchant":
      return "Merchant Portal";

    case "analyst":
      return "Analyst Dashboard";

    case "support":
      return "Support Console";

    case "admin":
      return "Admin Dashboard";

    case "super_admin":
      return "Admin Dashboard";

    case "user":
    default:
      return "My Wallet";
  }
}

/* =========================================================
   ROLE LABEL
========================================================= */

export function getDashboardRoleLabel(
  role: DashboardRole
): string {
  switch (role) {
    case "merchant":
      return "Merchant";

    case "analyst":
      return "Analyst";

    case "support":
      return "Support Agent";

    case "admin":
      return "Administrator";

    case "super_admin":
      return "Super Administrator";

    case "user":
    default:
      return "User";
  }
}