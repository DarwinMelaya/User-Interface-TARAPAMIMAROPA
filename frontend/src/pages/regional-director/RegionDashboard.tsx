import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import {
  HiArrowPath,
  HiBolt,
  HiClipboardDocumentList,
  HiEyeSlash,
  HiMagnifyingGlass,
  HiMap,
  HiPhoto,
  HiSignal,
  HiShieldExclamation,
  HiXMark,
} from "react-icons/hi2";
import Maps from "../../components/maps/Maps";
import {
  getReportTypeAccent,
  getReportTypeMeta,
} from "../../constants/reportTypes";

type ReportStatus = "pending" | "acknowledged" | "responding" | "resolved";

type RegionReport = {
  id: string;
  created_at: string;
  updated_at?: string;
  report_type: string;
  details: string;
  status?: ReportStatus;
  evidence_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hide_identity?: boolean;
  profiles?: { name?: string } | null;
};

const STATUS_META: Record<
  ReportStatus | "default",
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
  },
  acknowledged: {
    label: "Acknowledged",
    className: "bg-sky-500/20 text-sky-200 ring-sky-400/30",
  },
  responding: {
    label: "Responding",
    className: "bg-blue-500/20 text-blue-200 ring-blue-400/30",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
  },
  default: {
    label: "Unknown",
    className: "bg-slate-500/20 text-slate-300 ring-slate-400/30",
  },
};

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "safety", label: "Safety" },
  { id: "utilities", label: "Utilities" },
  { id: "priority", label: "Priority" },
] as const;

const STATUS_FILTERS = [
  { id: "all", label: "All status" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "responding", label: "Responding" },
  { id: "resolved", label: "Resolved" },
] as const;

const OPEN_STATUSES: ReportStatus[] = [
  "pending",
  "acknowledged",
  "responding",
];

const STAT_CARDS = [
  {
    key: "total",
    label: "Active signals",
    filter: "all",
    icon: HiClipboardDocumentList,
    accent:
      "border-cyan-400/35 bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 text-cyan-100",
    valueClass: "text-cyan-200",
  },
  {
    key: "priority",
    label: "Priority",
    filter: "priority",
    icon: HiShieldExclamation,
    accent:
      "border-red-400/35 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-100",
    valueClass: "text-red-300",
  },
  {
    key: "safety",
    label: "Safety",
    filter: "safety",
    icon: HiShieldExclamation,
    accent:
      "border-amber-400/35 bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-100",
    valueClass: "text-amber-300",
  },
  {
    key: "utilities",
    label: "Utilities",
    filter: "utilities",
    icon: HiBolt,
    accent:
      "border-yellow-400/35 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 text-yellow-100",
    valueClass: "text-yellow-200",
  },
] as const;

const getReportStatusMeta = (status?: string) =>
  STATUS_META[(status as ReportStatus) ?? "default"] ?? STATUS_META.default;

const getReportsSnapshot = (items: RegionReport[]) =>
  items
    .map((report) =>
      [
        report.id,
        report.created_at,
        report.updated_at,
        report.report_type,
        report.details,
        report.status,
        report.evidence_url,
        report.latitude,
        report.longitude,
      ].join("|"),
    )
    .join("||");

const getReporterLabel = (report: RegionReport) =>
  report.hide_identity || !report.profiles?.name
    ? "Anonymous"
    : report.profiles.name;

/** Stub until region reports API exists. */
const fetchRegionReports = async (): Promise<{
  data: RegionReport[];
  error: Error | null;
}> => ({ data: [], error: null });

const RegionDashboard = () => {
  const [reports, setReports] = useState<RegionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<RegionReport | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [feedExpanded, setFeedExpanded] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );
  const [mobileSheet, setMobileSheet] = useState<"stats" | "feed" | null>(null);
  const [showReportWarning, setShowReportWarning] = useState(false);
  const [newReportsCount, setNewReportsCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const hasLoadedReportsRef = useRef(false);
  const knownReportIdsRef = useRef(new Set<string>());
  const lastReportsSnapshotRef = useRef("");

  const loadReports = useCallback(async () => {
    const { data, error: fetchError } = await fetchRegionReports();
    if (fetchError) {
      setError(fetchError.message || "Could not load community reports.");
      setReports([]);
      return;
    }

    const safeData = Array.isArray(data) ? data : [];
    const sortedData = [...safeData].sort((a, b) => {
      const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return String(b?.id ?? "").localeCompare(String(a?.id ?? ""));
    });
    const currentIds = new Set(sortedData.map((report) => report.id));

    if (hasLoadedReportsRef.current) {
      let incomingCount = 0;
      for (const id of currentIds) {
        if (!knownReportIdsRef.current.has(id)) incomingCount += 1;
      }

      if (incomingCount > 0) {
        setNewReportsCount((prev) => prev + incomingCount);
        setShowReportWarning(true);
      }
    } else {
      hasLoadedReportsRef.current = true;
    }

    knownReportIdsRef.current = currentIds;
    setLastSyncedAt(new Date());

    setError("");
    const nextSnapshot = getReportsSnapshot(sortedData);
    if (nextSnapshot === lastReportsSnapshotRef.current) return;

    lastReportsSnapshotRef.current = nextSnapshot;
    setReports(sortedData);
    setViewingReport((current) => {
      if (!current) return current;
      const updated = sortedData.find((report) => report.id === current.id);
      return updated || current;
    });
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      await loadReports();
      if (active) setLoading(false);
    };

    run();
    const interval = setInterval(loadReports, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadReports]);

  const stats = useMemo(() => {
    const safety = reports.filter(
      (r) => getReportTypeMeta(r.report_type).feedCategory === "safety",
    ).length;
    const utilities = reports.filter(
      (r) => getReportTypeMeta(r.report_type).feedCategory === "utilities",
    ).length;
    const priority = reports.filter(
      (r) => getReportTypeMeta(r.report_type).statusTone === "danger",
    ).length;
    const pending = reports.filter((r) => (r.status ?? "pending") === "pending")
      .length;
    const responding = reports.filter((r) => r.status === "responding").length;
    const resolved = reports.filter((r) => r.status === "resolved").length;
    const open = reports.filter((r) =>
      OPEN_STATUSES.includes(r.status ?? "pending"),
    ).length;

    return {
      total: reports.length,
      safety,
      utilities,
      priority,
      pending,
      responding,
      resolved,
      open,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      const meta = getReportTypeMeta(r.report_type);
      const cat = meta.feedCategory;
      const isPriority = meta.statusTone === "danger";
      const reportStatus = r.status ?? "pending";

      if (typeFilter === "safety" && cat !== "safety") return false;
      if (typeFilter === "utilities" && cat !== "utilities") return false;
      if (typeFilter === "priority" && !isPriority) return false;

      if (statusFilter === "open" && !OPEN_STATUSES.includes(reportStatus)) {
        return false;
      }
      if (
        statusFilter !== "all" &&
        statusFilter !== "open" &&
        reportStatus !== statusFilter
      ) {
        return false;
      }

      if (!q) return true;
      const statusMeta = getReportStatusMeta(reportStatus);
      return (
        meta.label.toLowerCase().includes(q) ||
        r.details?.toLowerCase().includes(q) ||
        getReporterLabel(r).toLowerCase().includes(q) ||
        statusMeta.label.toLowerCase().includes(q)
      );
    });
  }, [reports, typeFilter, statusFilter, search]);

  const handleViewReport = (report: RegionReport) => {
    setSelectedId(report.id);
    setViewingReport(report);
  };

  const handleCloseReport = () => {
    setViewingReport(null);
    setSelectedId(null);
  };

  const handleCloseWarning = () => {
    setShowReportWarning(false);
    setNewReportsCount(0);
  };

  const handleStatClick = (filter: string) => {
    setTypeFilter(filter);
  };

  const syncLabel = loading
    ? "Syncing live feed…"
    : lastSyncedAt
      ? `Updated ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`
      : "Awaiting first sync";

  const toggleMobileSheet = (sheet: "stats" | "feed") => {
    setMobileSheet((current) => (current === sheet ? null : sheet));
  };

  return (
    <section className="fixed inset-0 z-30 overflow-hidden bg-slate-950 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-slate-100 lg:left-72 lg:pb-0">
      <div className="pointer-events-auto absolute inset-0 z-[5]">
        <Maps
          reports={filteredReports}
          selectedId={selectedId}
          onViewReport={(report) => {
            const full = filteredReports.find((r) => r.id === report.id);
            if (full) handleViewReport(full);
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(59,130,246,0.12),transparent_42%),linear-gradient(to_bottom,rgba(2,6,23,0.05),rgba(2,6,23,0.65))]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
        <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.16em]">
              <HiMap className="h-3.5 w-3.5" aria-hidden />
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              Live command map
            </div>
            <h1 className="mt-2 bg-gradient-to-r from-white via-cyan-100 to-blue-300/90 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:mt-3 sm:text-3xl">
              Regional Director Command Center
            </h1>
            <p className="mt-1 text-xs text-cyan-200/70 sm:mt-1.5 sm:text-sm">
              {syncLabel}
            </p>
            {!loading && stats.total > 0 ? (
              <p className="mt-1 hidden text-xs text-slate-400 sm:block">
                {stats.total} signal{stats.total === 1 ? "" : "s"} · {stats.open}{" "}
                open · {stats.responding} responding · {stats.resolved} resolved
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3 py-2 backdrop-blur-md sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80">
                System
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                <HiSignal className="h-4 w-4" aria-hidden />
                Online
              </p>
            </div>
            <button
              type="button"
              onClick={loadReports}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-3 py-2 text-sm font-semibold text-cyan-100 backdrop-blur-md transition hover:border-cyan-400/50 sm:flex-none sm:px-4 sm:py-2.5 disabled:opacity-50"
            >
              <HiArrowPath
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
              {loading ? "Syncing…" : "Refresh"}
            </button>
            <Link
              to="/regional-director/programs"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-950/80 px-3 py-2 text-sm font-medium text-blue-100 backdrop-blur-md sm:flex-none sm:px-4 sm:py-2.5 lg:hidden"
            >
              Programs
            </Link>
            <Link
              to="/regional-director/programs"
              className="hidden rounded-xl border border-blue-500/30 bg-blue-950/80 px-4 py-2.5 text-sm font-medium text-blue-100 backdrop-blur-md transition hover:bg-blue-900/60 lg:inline-flex"
            >
              Programs overview
            </Link>
          </div>
        </div>
      </header>

      <div className="pointer-events-auto absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-25 flex justify-center gap-2 px-3 lg:hidden">
        <button
          type="button"
          onClick={() => toggleMobileSheet("stats")}
          className={[
            "rounded-full border px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition",
            mobileSheet === "stats"
              ? "border-cyan-400/60 bg-cyan-500/25 text-cyan-100"
              : "border-slate-700/80 bg-slate-900/90 text-slate-300",
          ].join(" ")}
        >
          Stats
        </button>
        <button
          type="button"
          onClick={() => toggleMobileSheet("feed")}
          className={[
            "rounded-full border px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition",
            mobileSheet === "feed"
              ? "border-cyan-400/60 bg-cyan-500/25 text-cyan-100"
              : "border-slate-700/80 bg-slate-900/90 text-slate-300",
          ].join(" ")}
        >
          Feed ({filteredReports.length})
        </button>
        {mobileSheet ? (
          <button
            type="button"
            onClick={() => setMobileSheet(null)}
            className="rounded-full border border-slate-600/80 bg-slate-900/90 px-3 py-2 text-xs font-bold text-slate-400"
          >
            Map
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="pointer-events-auto absolute left-1/2 top-28 z-30 max-w-md -translate-x-1/2 rounded-xl border border-red-500/40 bg-slate-900/95 px-4 py-2.5 text-center text-sm text-red-300 shadow-lg backdrop-blur">
          {error}
        </div>
      ) : null}

      <div
        className={[
          "pointer-events-none absolute inset-x-0 z-20 flex flex-col gap-3 p-3 sm:p-5",
          "bottom-[calc(7rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:flex-row lg:items-end lg:justify-between",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-auto flex w-full shrink-0 flex-col rounded-2xl border border-cyan-400/25 bg-slate-900/92 p-3 shadow-[0_8px_40px_rgba(0,0,0,0.45),0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:max-w-[min(360px,calc(100%-2rem))]",
            mobileSheet === "stats" ? "max-h-[min(50vh,320px)]" : "hidden",
            "lg:flex lg:max-h-none",
          ].join(" ")}
        >
          <p className="mb-2.5 shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200/85">
            Situation overview
          </p>
          <div className="grid w-full grid-cols-2 gap-2">
            {STAT_CARDS.map((card) => {
              const Icon = card.icon;
              const isActive = typeFilter === card.filter;
              const value = stats[card.key] ?? 0;

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => handleStatClick(card.filter)}
                  className={[
                    "rounded-xl border p-2.5 text-left transition",
                    card.accent,
                    isActive
                      ? "ring-2 ring-cyan-400/50 ring-offset-1 ring-offset-slate-900"
                      : "hover:brightness-110",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wide opacity-80">
                      {card.label}
                    </p>
                    <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  </div>
                  <p
                    className={`mt-1 text-2xl font-bold tabular-nums ${card.valueClass}`}
                  >
                    {loading ? "—" : value}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[10px] text-slate-500">
            Response: {stats.open} open · {stats.pending} pending ·{" "}
            {stats.resolved} resolved
          </p>
          {typeFilter !== "all" || statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="mt-2 w-full rounded-lg border border-slate-700/80 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:text-white"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div
          className={[
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-900/95 shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_24px_rgba(34,211,238,0.1)] backdrop-blur-xl transition-all duration-300",
            mobileSheet === "feed" ? "max-h-[min(55vh,420px)]" : "hidden",
            "lg:flex lg:max-h-[min(480px,58vh)] lg:max-w-[min(400px,calc(100%-2rem))]",
            feedExpanded ? "lg:max-h-[min(480px,58vh)]" : "lg:max-h-14",
          ].join(" ")}
        >
          <div className="border-b border-cyan-900/50 px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setFeedExpanded((v) => !v)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200/90">
                  Incident feed
                </p>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  {filteredReports.length}
                </span>
                {newReportsCount > 0 && showReportWarning ? (
                  <span className="animate-pulse rounded-full bg-red-500/25 px-2 py-0.5 text-[10px] font-bold text-red-300">
                    +{newReportsCount} new
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setFeedExpanded((v) => !v)}
                className="rounded-lg border border-slate-700/80 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-white"
                aria-expanded={feedExpanded}
              >
                {feedExpanded ? "Collapse" : "Expand"}
              </button>
            </div>

            {feedExpanded ? (
              <>
                <div className="relative mt-2.5">
                  <HiMagnifyingGlass
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search incidents…"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/25"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {TYPE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTypeFilter(f.id)}
                      className={[
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                        typeFilter === f.id
                          ? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                          : "border border-slate-700/80 bg-slate-800/80 text-slate-400 hover:border-cyan-700/50 hover:text-white",
                      ].join(" ")}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={[
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold transition",
                        statusFilter === f.id
                          ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.35)]"
                          : "border border-slate-700/80 bg-slate-800/80 text-slate-400 hover:text-white",
                      ].join(" ")}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {feedExpanded ? (
            <ul className="flex-1 overflow-y-auto p-2 sm:p-3 [-ms-overflow-style:none] [scrollbar-width:thin]">
              {loading && reports.length === 0 ? (
                <li className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-[88px] animate-pulse rounded-xl bg-slate-800/50"
                    />
                  ))}
                </li>
              ) : null}

              {!loading && filteredReports.length === 0 ? (
                <li className="flex flex-col items-center px-4 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-800/50 bg-cyan-950/50">
                    <HiMap className="h-6 w-6 text-cyan-500/70" aria-hidden />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    No incidents on map
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {search || typeFilter !== "all"
                      ? "Adjust filters or search."
                      : "Community reports will appear here in real time."}
                  </p>
                </li>
              ) : null}

              {filteredReports.map((report) => {
                const meta = getReportTypeMeta(report.report_type);
                const accent = getReportTypeAccent(report.report_type);
                const statusMeta = getReportStatusMeta(
                  report.status ?? "pending",
                );
                const isSelected = selectedId === report.id;
                const isPriority = meta.statusTone === "danger";
                const reporter = getReporterLabel(report);

                return (
                  <li key={report.id} className="mb-2 last:mb-0">
                    <button
                      type="button"
                      onClick={() => handleViewReport(report)}
                      className={[
                        "relative flex w-full gap-3 overflow-hidden rounded-xl border p-2.5 text-left transition",
                        isSelected
                          ? "border-cyan-400/60 bg-cyan-400/15 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                          : [
                              "border-slate-800/80 bg-slate-800/40 hover:border-slate-600/80 hover:bg-slate-800/70",
                              accent.border,
                            ],
                      ].join(" ")}
                    >
                      {isPriority ? (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-orange-500" />
                      ) : null}

                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-700/60 sm:h-[72px] sm:w-[72px]">
                        {report.evidence_url ? (
                          <img
                            src={report.evidence_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-slate-900/90 text-slate-600">
                            <HiPhoto className="h-5 w-5" aria-hidden />
                            <span className="text-[9px]">No photo</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                            {meta.label}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-sm font-semibold text-white">
                          {meta.label}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">
                          {report.details}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                          <span
                            className={`text-[10px] font-bold ${accent.status}`}
                          >
                            {meta.status}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            {report.hide_identity ? (
                              <HiEyeSlash
                                className="h-3 w-3 text-slate-600"
                                aria-hidden
                              />
                            ) : null}
                            {reporter}
                          </span>
                          <span className="w-full text-right text-[10px] text-slate-500 sm:w-auto sm:text-left">
                            {report.created_at
                              ? formatDistanceToNow(
                                  new Date(report.created_at),
                                  { addSuffix: true },
                                )
                              : ""}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {viewingReport ? (
        <div
          className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Report detail"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyan-800/50 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">
                  Report detail
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {getReportTypeMeta(viewingReport.report_type).label}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseReport}
                className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-300">{viewingReport.details}</p>
            <p className="mt-3 text-xs text-slate-500">
              Status:{" "}
              {getReportStatusMeta(viewingReport.status ?? "pending").label} ·
              Reporter: {getReporterLabel(viewingReport)}
            </p>
          </div>
        </div>
      ) : null}

      {showReportWarning ? (
        <div className="pointer-events-auto absolute left-1/2 top-24 z-40 w-[min(92vw,380px)] -translate-x-1/2 rounded-xl border border-red-500/40 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
          <p className="text-sm font-semibold text-red-200">
            {newReportsCount} new report{newReportsCount === 1 ? "" : "s"}{" "}
            detected
          </p>
          <button
            type="button"
            onClick={handleCloseWarning}
            className="mt-3 w-full rounded-lg border border-red-500/40 bg-red-500/10 py-2 text-sm font-semibold text-red-200"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default RegionDashboard;
