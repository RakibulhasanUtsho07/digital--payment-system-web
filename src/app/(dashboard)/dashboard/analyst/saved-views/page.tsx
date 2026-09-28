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
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronDown,
  Code2,
  DatabaseZap,
  FileJson2,
  Filter,
  Layers3,
  RefreshCcw,
  Route,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import {
  useDashboardSession,
} from "@/context/DashboardSessionContext";

import {
  getDashboardHome,
} from "@/lib/auth/dashboardRoles";

import {
  createAnalystSavedView,
  deleteAnalystSavedView,
  getAnalystSavedViews,
  updateAnalystSavedView,
  type AnalystSavedView,
} from "@/lib/api/analystApi";

/* =========================================================
   THEME
========================================================= */

const THEME = {
  teal: "#0D9488",
  tealBright: "#14B8A6",
  emerald: "#10B981",
  cyan: "#22C7D6",
  sky: "#38BDF8",
  amber: "#F59E0B",
  red: "#EF4444",
  slate: "#10243A",
} as const;

const DARK_SURFACE =
  "bg-gradient-to-br from-[#10243A] via-[#0B4F52] to-[#10273A] text-white";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* =========================================================
   ROUTES
========================================================= */

const routes = [
  "/dashboard/analyst",
  "/dashboard/analyst/payments",
  "/dashboard/analyst/transactions",
  "/dashboard/analyst/conversion",
  "/dashboard/analyst/revenue",
  "/dashboard/analyst/merchants",
  "/dashboard/analyst/risk",
  "/dashboard/analyst/refunds",
  "/dashboard/analyst/disputes",
  "/dashboard/analyst/settlement",
  "/dashboard/analyst/payouts",
  "/dashboard/analyst/compliance",
] as const;

const ROUTE_LABELS: Record<(typeof routes)[number], string> = {
  "/dashboard/analyst": "Executive Overview",
  "/dashboard/analyst/payments": "Payments",
  "/dashboard/analyst/transactions": "Transactions",
  "/dashboard/analyst/conversion": "Conversion",
  "/dashboard/analyst/revenue": "Revenue",
  "/dashboard/analyst/merchants": "Merchants",
  "/dashboard/analyst/risk": "Risk",
  "/dashboard/analyst/refunds": "Refunds",
  "/dashboard/analyst/disputes": "Disputes",
  "/dashboard/analyst/settlement": "Settlement",
  "/dashboard/analyst/payouts": "Payouts",
  "/dashboard/analyst/compliance": "Compliance",
};

/* =========================================================
   SMALL HELPERS
========================================================= */

function routeLabel(value: string) {
  return ROUTE_LABELS[value as (typeof routes)[number]] ?? value;
}

function routeShort(value: string) {
  return value.replace("/dashboard/analyst", "") || "/overview";
}

function getFilterCount(filters: Record<string, unknown>) {
  return Object.keys(filters ?? {}).length;
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.42, ease: easeOut }}
      className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-foreground">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="p-5">
        {children}
      </div>
    </motion.section>
  );
}

/* =========================================================
   CUSTOM ROUTE DROPDOWN
========================================================= */

function RouteDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-left outline-none transition hover:border-teal-500/50 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
            <Route className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-foreground">
              {routeLabel(value)}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {routeShort(value)}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-auto rounded-2xl border border-border bg-card p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
            role="listbox"
          >
            {routes.map((item) => {
              const selected = item === value;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    selected
                      ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "hover:bg-muted/60"
                  }`}
                  role="option"
                  aria-selected={selected}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold">
                      {routeLabel(item)}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {routeShort(item)}
                    </p>
                  </div>

                  {selected ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  iconClass,
  accentClass,
  index,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Bookmark;
  iconClass: string;
  accentClass: string;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: index * 0.06, ease: easeOut }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClass}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tabular-nums text-foreground">
            {value}
          </p>

          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {helper}
          </p>
        </div>

        <motion.div
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="col-span-full flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-muted/20 px-6 text-center"
    >
      <motion.div
        animate={{
          y: [0, -6, 0],
          rotate: [0, 3, -3, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600"
      >
        <DatabaseZap className="h-7 w-7" />
      </motion.div>

      <h3 className="mt-4 text-sm font-extrabold text-foreground">
        No saved views yet
      </h3>

      <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
        Create a reusable analyst route and filter preset. Saved views only store
        analyst navigation preferences and do not modify financial data.
      </p>
    </motion.div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalystSavedViewsPage() {
  const router =
    useRouter();

  const {
    user,
  } = useDashboardSession();

  const isAnalystRole =
    user.role === "analyst";

  useEffect(() => {
    if (isAnalystRole) {
      return;
    }

    router.replace(
      getDashboardHome(
        user.role
      )
    );
  }, [
    isAnalystRole,
    router,
    user.role,
  ]);

  const [views, setViews] = useState<AnalystSavedView[]>([]);
  const [name, setName] = useState("");
  const [route, setRoute] = useState<string>(routes[0]);
  const [filtersText, setFiltersText] = useState(
    '{\n  "range": "30d",\n  "currency": "BDT"\n}'
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const parsedFilters = useMemo(() => {
    try {
      const parsed = JSON.parse(filtersText) as unknown;

      if (
        parsed === null ||
        Array.isArray(parsed) ||
        typeof parsed !== "object"
      ) {
        return {
          valid: false as const,
          value: null,
          message: "Filters must be a JSON object.",
        };
      }

      return {
        valid: true as const,
        value: parsed as Record<string, unknown>,
        message: "",
      };
    } catch (cause) {
      return {
        valid: false as const,
        value: null,
        message:
          cause instanceof Error
            ? cause.message
            : "Invalid JSON filters.",
      };
    }
  }, [filtersText]);

  const load = useCallback(async (showRefresh = false) => {
    if (!isAnalystRole) {
      setLoading(false);
      setRefreshing(false);

      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      }

      setError("");

      const result = await getAnalystSavedViews();
      setViews(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load saved views."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAnalystRole]);

  useEffect(() => {
    if (!isAnalystRole) {
      setLoading(false);

      return;
    }

    const timerId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [
    isAnalystRole,
    load,
  ]);

  const filteredViews = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return views;
    }

    return views.filter((view) => {
      return (
        view.name.toLowerCase().includes(query) ||
        view.route.toLowerCase().includes(query) ||
        safeStringify(view.filters).toLowerCase().includes(query)
      );
    });
  }, [search, views]);

  const defaultView = useMemo(
    () => views.find((view) => view.isDefault) ?? null,
    [views]
  );

  const uniqueRoutes = useMemo(
    () => new Set(views.map((view) => view.route)).size,
    [views]
  );

  async function save() {
    if (!isAnalystRole) {
      return;
    }

    try {
      setError("");

      if (!name.trim()) {
        setError("View name is required.");
        return;
      }

      if (!parsedFilters.valid || !parsedFilters.value) {
        setError(
          parsedFilters.message ||
            "Filters must contain a valid JSON object."
        );
        return;
      }

      setSaving(true);

      await createAnalystSavedView({
        name: name.trim(),
        route,
        filters: parsedFilters.value,
        isDefault: false,
      });

      setName("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save view."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(view: AnalystSavedView) {
    if (!isAnalystRole) {
      return;
    }

    try {
      setError("");
      setBusyId(view.id);

      await deleteAnalystSavedView(view.id);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete saved view."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function makeDefault(view: AnalystSavedView) {
    if (!isAnalystRole) {
      return;
    }

    try {
      setError("");
      setBusyId(view.id);

      await updateAnalystSavedView(view.id, {
        isDefault: true,
      });

      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update saved view."
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!isAnalystRole) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-700 shadow-sm dark:text-teal-300">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>

          <p className="mt-4 text-sm font-black text-slate-950 dark:text-white">
            Opening analyst workspace
          </p>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
            Saved Views is available only to analyst accounts.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 pb-8">
      {/* =====================================================
          HERO
      ====================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={`relative overflow-hidden rounded-[28px] border border-white/10 p-6 shadow-[0_28px_80px_-42px_rgba(13,148,136,0.62)] sm:p-7 ${DARK_SURFACE}`}
      >
        <motion.div
          aria-hidden
          animate={{
            opacity: [0.35, 0.75, 0.35],
            scale: [1, 1.16, 1],
            x: [0, 28, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl"
        />

        <motion.div
          aria-hidden
          animate={{
            opacity: [0.18, 0.45, 0.18],
            y: [0, -24, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-28 left-[24%] h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
        />

        <motion.div
          aria-hidden
          animate={{
            opacity: [0.16, 0.42, 0.16],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "linear",
          }}
          className="pointer-events-none absolute right-[30%] top-[18%] h-48 w-48 rounded-full border border-cyan-300/10"
        />

        <motion.div
          aria-hidden
          animate={{
            x: ["-20%", "120%"],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1,
          }}
          className="pointer-events-none absolute inset-y-0 w-28 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-teal-200 backdrop-blur">
              <Bookmark className="h-3.5 w-3.5" />
              Analyst Workspace Presets
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Saved Views
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Save analyst routes and filter presets for faster investigation
              workflows without changing payments, balances, settlements or
              other financial records.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-200 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Read-only workflow
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-200 backdrop-blur">
                <FileJson2 className="h-3.5 w-3.5 text-cyan-300" />
                JSON filter presets
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold text-slate-200 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                Reusable analyst context
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            disabled={refreshing}
            onClick={() => void load(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-extrabold text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </motion.button>
        </div>
      </motion.section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-600"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="min-w-0 break-words text-xs leading-5">
              {error}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Saved Views"
          value={String(views.length)}
          helper="Reusable analyst presets"
          icon={Bookmark}
          iconClass="bg-teal-500/10 text-teal-600"
          accentClass="bg-teal-500"
        />

        <StatCard
          index={1}
          label="Default View"
          value={defaultView ? "1" : "0"}
          helper={
            defaultView
              ? defaultView.name
              : "No default preset selected"
          }
          icon={Star}
          iconClass="bg-amber-500/10 text-amber-600"
          accentClass="bg-amber-500"
        />

        <StatCard
          index={2}
          label="Routes Covered"
          value={String(uniqueRoutes)}
          helper={`${routes.length} analyst destinations available`}
          icon={Route}
          iconClass="bg-cyan-500/10 text-cyan-600"
          accentClass="bg-cyan-500"
        />

        <StatCard
          index={3}
          label="Current Draft"
          value={
            parsedFilters.valid && parsedFilters.value
              ? String(getFilterCount(parsedFilters.value))
              : "—"
          }
          helper={
            parsedFilters.valid
              ? "Valid filter keys"
              : "JSON needs attention"
          }
          icon={Filter}
          iconClass={
            parsedFilters.valid
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-600"
          }
          accentClass={
            parsedFilters.valid
              ? "bg-emerald-500"
              : "bg-red-500"
          }
        />
      </section>

      {/* =====================================================
          CREATE
      ====================================================== */}

      <Panel
        title="Create Saved View"
        description="Store a route and JSON filter preset for fast analyst navigation."
        action={
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
              parsedFilters.valid
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                : "border-red-500/20 bg-red-500/10 text-red-600"
            }`}
          >
            {parsedFilters.valid ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}

            {parsedFilters.valid
              ? "Valid JSON"
              : "Invalid JSON"}
          </span>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.13em] text-muted-foreground">
              View name
            </span>

            <div className="relative">
              <Bookmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={name}
                onChange={(event) => {
                  if (!isAnalystRole) {
                    return;
                  }

                  setName(event.target.value);
                }}
                placeholder="e.g. High-risk BDT payments"
                className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-xs font-semibold outline-none transition placeholder:text-muted-foreground/70 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.13em] text-muted-foreground">
              Analyst route
            </span>

            <RouteDropdown
              value={route}
              onChange={(nextRoute) => {
                if (!isAnalystRole) {
                  return;
                }

                setRoute(nextRoute);
              }}
            />
          </label>

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 text-xs font-black text-white shadow-[0_12px_30px_rgba(13,148,136,0.25)] transition hover:shadow-[0_16px_34px_rgba(13,148,136,0.34)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving ? "Saving..." : "Save view"}
          </motion.button>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-muted-foreground">
                Filter JSON
              </p>

              <p className="mt-1 text-[11px] text-muted-foreground">
                Use the same filter keys accepted by the destination analytics page.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground">
              <Code2 className="h-3.5 w-3.5" />
              object only
            </span>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border transition ${
              parsedFilters.valid
                ? "border-border focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10"
                : "border-red-500/35 focus-within:ring-4 focus-within:ring-red-500/10"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border bg-muted/35 px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                filters.json
              </span>

              <span
                className={`text-[10px] font-bold ${
                  parsedFilters.valid
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {parsedFilters.valid
                  ? `${getFilterCount(parsedFilters.value ?? {})} keys`
                  : "Fix JSON"}
              </span>
            </div>

            <textarea
              value={filtersText}
              onChange={(event) => {
                if (!isAnalystRole) {
                  return;
                }

                setFiltersText(event.target.value);
              }}
              spellCheck={false}
              className="min-h-48 w-full resize-y bg-background p-4 font-mono text-xs leading-6 text-foreground outline-none"
            />
          </div>

          {!parsedFilters.valid ? (
            <p className="mt-2 break-words text-[11px] leading-5 text-red-600">
              {parsedFilters.message}
            </p>
          ) : null}
        </div>
      </Panel>

      {/* =====================================================
          SAVED VIEWS
      ====================================================== */}

      <Panel
        title="Saved Presets"
        description="Review, search, promote or remove your analyst workspace presets."
        action={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search saved views"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
        }
      >
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : filteredViews.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredViews.map((view, index) => {
                const busy = busyId === view.id;
                const filterCount = getFilterCount(view.filters);

                return (
                  <motion.article
                    layout
                    key={view.id}
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{
                      duration: 0.32,
                      delay: index * 0.035,
                      ease: easeOut,
                    }}
                    whileHover={{ y: -4 }}
                    className={`group relative flex min-h-[330px] flex-col overflow-hidden rounded-[22px] border bg-card p-5 shadow-sm transition-shadow hover:shadow-lg ${
                      view.isDefault
                        ? "border-amber-400/40"
                        : "border-border"
                    }`}
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-1 ${
                        view.isDefault
                          ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"
                          : "bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-extrabold text-foreground">
                            {view.name}
                          </h3>

                          {view.isDefault ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-600">
                              <Star className="h-3 w-3 fill-current" />
                              Default
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl bg-teal-500/8 px-2.5 py-1.5 text-teal-700 dark:text-teal-300">
                          <Route className="h-3.5 w-3.5 shrink-0" />

                          <span className="truncate text-[10px] font-extrabold">
                            {routeLabel(view.route)}
                          </span>
                        </div>

                        <p className="mt-2 break-all text-[10px] leading-5 text-muted-foreground">
                          {view.route}
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        disabled={busy}
                        onClick={() => void remove(view)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/5 text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
                        aria-label={`Delete ${view.name}`}
                      >
                        {busy ? (
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/25 px-3 py-2">
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <Layers3 className="h-3.5 w-3.5" />
                        Filter keys
                      </span>

                      <span className="text-xs font-black tabular-nums text-foreground">
                        {filterCount}
                      </span>
                    </div>

                    <div className="mt-3 flex-1 overflow-hidden rounded-xl border border-border bg-[#0E1A24]">
                      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          filters
                        </span>

                        <FileJson2 className="h-3.5 w-3.5 text-teal-300" />
                      </div>

                      <pre className="max-h-40 overflow-auto p-3 font-mono text-[10px] leading-5 text-slate-300">
                        {safeStringify(view.filters)}
                      </pre>
                    </div>

                    {!view.isDefault ? (
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={busy}
                        onClick={() => void makeDefault(view)}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-xs font-extrabold text-foreground transition hover:border-amber-500/35 hover:bg-amber-500/5 hover:text-amber-700 disabled:opacity-50 dark:hover:text-amber-300"
                      >
                        {busy ? (
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}

                        Make default
                      </motion.button>
                    ) : (
                      <div className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                        <Star className="h-4 w-4 fill-current" />
                        Current default
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Panel>

      {/* =====================================================
          READ ONLY
      ====================================================== */}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

          <div className="min-w-0">
            <p className="text-xs font-extrabold text-foreground">
              Read-only saved-view workflow
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Saved views store analyst navigation and filter preferences only.
              Creating, deleting or selecting a default saved view does not
              mutate payments, wallet balances, merchant settlements, payouts or
              other financial records.
            </p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
