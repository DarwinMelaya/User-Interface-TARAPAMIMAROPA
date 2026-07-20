import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowRightOnRectangle,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiCube,
  HiMagnifyingGlass,
  HiMap,
  HiMapPin,
  HiSquares2X2,
  HiSquare3Stack3D,
  HiUserGroup,
  HiBanknotes,
  HiArrowDownTray,
  HiArrowTopRightOnSquare,
  HiPaperAirplane,
  HiXMark,
} from "react-icons/hi2";
import Maps from "../../components/maps/Maps";
import type {
  MapBaseLayer,
  MapViewMode,
  UserLocation,
} from "../../components/maps/mapTypes";
import {
  MOCK_TARA_PROJECTS,
  PROJECT_STATUSES,
  PROVINCES,
  PROGRAM_META,
  STATUS_META,
  describeProject,
  formatCompact,
  formatPeso,
  projectImage,
  projectType,
  projectYear,
  summarizeProjects,
  type ProjectStatus,
  type Province,
  type TaraProject,
} from "../../constants/taraProjects";

/** Light-theme status chips for public list / detail (STATUS_META tuned for dark dashboards). */
const STATUS_PUBLIC: Record<ProjectStatus, string> = {
  planning: "bg-slate-100 text-slate-700 border-slate-300",
  ongoing: "bg-blue-50 text-blue-800 border-blue-300",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-300",
  delayed: "bg-red-50 text-red-800 border-red-300",
  on_hold: "bg-amber-50 text-amber-900 border-amber-300",
  cancelled: "bg-rose-50 text-rose-800 border-rose-300",
};

type SortKey = "name" | "progress" | "budget" | "province";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "name", label: "Name A–Z" },
  { id: "progress", label: "Progress" },
  { id: "budget", label: "Budget" },
  { id: "province", label: "Province" },
];

const sortProjects = (list: TaraProject[], key: SortKey) => {
  const next = [...list];
  next.sort((a, b) => {
    if (key === "progress") return b.progress - a.progress;
    if (key === "budget") return b.budget - a.budget;
    if (key === "province") {
      const byProv = a.province.localeCompare(b.province);
      return byProv !== 0 ? byProv : a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
  return next;
};

const matchesQuery = (project: TaraProject, query: string) => {
  if (!query) return true;
  const haystack = [
    project.name,
    project.description,
    project.beneficiary,
    project.program,
    project.sector,
    project.province,
    project.municipality,
    project.barangay,
    project.partner_agency,
    project.status,
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
};

const BASE_LAYERS: { id: MapBaseLayer; label: string }[] = [
  { id: "street", label: "Map" },
  { id: "satellite", label: "Satellite" },
  { id: "terrain", label: "Terrain" },
];

const QUICK_SEARCHES = ["SETUP", "Water", "Coral", "Solar", "STARBOOKS"];

type ExportScope = {
  province: Province | "all";
  status: ProjectStatus | "all";
  search: string;
};

const EXPORT_COLUMNS: { key: keyof TaraProject; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Project" },
  { key: "program", label: "Program" },
  { key: "sector", label: "Sector" },
  { key: "province", label: "Province" },
  { key: "municipality", label: "Municipality" },
  { key: "barangay", label: "Barangay" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress %" },
  { key: "budget", label: "Budget (PHP)" },
  { key: "funding_source", label: "Funding source" },
  { key: "beneficiaries", label: "Beneficiaries" },
  { key: "beneficiary", label: "Beneficiary" },
  { key: "partner_agency", label: "Partner agency" },
  { key: "start_date", label: "Start" },
  { key: "end_date", label: "End" },
  { key: "latest_accomplishment", label: "Latest accomplishment" },
];

const describeExportScope = (scope: ExportScope): string => {
  const parts: string[] = [];
  if (scope.province !== "all") parts.push(`Province: ${scope.province}`);
  if (scope.status !== "all")
    parts.push(`Status: ${STATUS_META[scope.status].label}`);
  if (scope.search.trim()) parts.push(`Search: "${scope.search.trim()}"`);
  return parts.length ? parts.join(" · ") : "All projects (no filters)";
};

const escapeCsv = (value: string | number): string => {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const slugPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "all";

const openGoogleDirections = (
  project: TaraProject,
  origin: UserLocation | null,
) => {
  const destination = `${project.latitude},${project.longitude}`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");
  if (origin) {
    url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  }
  window.open(url.toString(), "_blank", "noopener,noreferrer");
};

/** Export currently filtered rows (search + province + status). */
const downloadFilteredCsv = (
  projects: TaraProject[],
  scope: ExportScope,
) => {
  const stamp = new Date();
  const meta = [
    "TARAMIMAROPA Public Project Export",
    `Generated: ${stamp.toLocaleString("en-PH")}`,
    `Scope: ${describeExportScope(scope)}`,
    `Projects: ${projects.length}`,
    "",
  ].map((line) => escapeCsv(line));

  const header = EXPORT_COLUMNS.map((c) => escapeCsv(c.label)).join(",");
  const rows = projects.map((p) =>
    EXPORT_COLUMNS.map((c) => escapeCsv(p[c.key] as string | number)).join(","),
  );

  const csv = [...meta, header, ...rows].join("\r\n");
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const provinceSlug =
    scope.province === "all" ? "mimaropa" : slugPart(scope.province);
  link.href = url;
  link.download = `tara-${provinceSlug}-${stamp.toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const LandingPage = () => {
  const [query, setQuery] = useState("");
  const [provinceFilter, setProvinceFilter] = useState<Province | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<TaraProject | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>("satellite");
  const [viewMode, setViewMode] = useState<MapViewMode>("2d");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [flyToUserToken, setFlyToUserToken] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const projects = MOCK_TARA_PROJECTS;

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (provinceFilter === "all" || p.province === provinceFilter) &&
          (statusFilter === "all" || p.status === statusFilter) &&
          matchesQuery(p, query),
      ),
    [projects, provinceFilter, statusFilter, query],
  );

  const sorted = useMemo(
    () => sortProjects(filtered, sortKey),
    [filtered, sortKey],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, sorted.length);
  const pageItems = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [query, provinceFilter, statusFilter, sortKey]);

  const stats = useMemo(() => summarizeProjects(filtered), [filtered]);

  const hasFilters =
    provinceFilter !== "all" ||
    statusFilter !== "all" ||
    query.trim().length > 0;

  const clearFilters = () => {
    setProvinceFilter("all");
    setStatusFilter("all");
    setQuery("");
  };

  const openProject = (project: TaraProject) => {
    setSelectedId(project.id);
    setViewing(project);
    setSearchOpen(false);
  };

  const locateMe = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Geolocation not supported on this browser.");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setFlyToUserToken((t) => t + 1);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocateError("Location permission denied.");
          return;
        }
        setLocateError("Could not get current location.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const kpis = [
    { label: "Projects", value: String(stats.total), icon: HiSquares2X2 },
    {
      label: "Beneficiaries",
      value: formatCompact(stats.beneficiaries),
      icon: HiUserGroup,
    },
    {
      label: "Municipalities",
      value: String(stats.municipalities),
      icon: HiMapPin,
    },
    {
      label: "Funding",
      value: formatCompact(stats.funding),
      icon: HiBanknotes,
    },
  ];

  return (
    <div className="bg-[#f4f6f9] text-slate-800">
      {/* ── Full-screen interactive map (first viewport) ─────────────── */}
      <section className="relative h-[100dvh] w-full overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-[5]">
          <Maps
            projects={filtered}
            selectedId={selectedId}
            baseLayer={baseLayer}
            viewMode={viewMode}
            userLocation={userLocation}
            flyToUserToken={flyToUserToken}
            onViewProject={openProject}
          />
        </div>

        <div
          className={[
            "pointer-events-none absolute inset-0 z-10",
            viewMode === "3d"
              ? "bg-[radial-gradient(circle_at_20%_0%,rgba(0,56,168,0.08),transparent_42%),linear-gradient(to_bottom,rgba(2,6,23,0.02),rgba(2,6,23,0.35))]"
              : "bg-[radial-gradient(circle_at_20%_0%,rgba(0,56,168,0.18),transparent_45%),linear-gradient(to_bottom,rgba(2,6,23,0.15),rgba(2,6,23,0.55))]",
          ].join(" ")}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />

        {/* Top chrome */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
          <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#0038a8] text-sm font-black text-white shadow-[0_2px_12px_rgba(0,56,168,0.45)]">
                  T
                </span>
                <div className="leading-tight">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-slate-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100 backdrop-blur-md">
                    <HiMap className="h-3.5 w-3.5" aria-hidden />
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                    </span>
                    Public project map
                  </div>
                  <h1 className="mt-1.5 text-xl font-black tracking-tight text-white sm:text-2xl">
                    TARAMIMAROPA
                  </h1>
                </div>
              </div>
              <p className="mt-2 hidden max-w-md text-xs leading-relaxed text-blue-100/80 sm:block">
                Tracking of Accomplishments and Results of Activities and
                Programs across MIMAROPA · {filtered.length} on map
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="relative shrink-0">
                <HiMapPin
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300"
                  aria-hidden
                />
                <select
                  value={provinceFilter}
                  onChange={(e) =>
                    setProvinceFilter(e.target.value as Province | "all")
                  }
                  aria-label="Filter by province"
                  className={[
                    "cursor-pointer appearance-none rounded-xl border bg-slate-900/90 py-2 pl-8 pr-8 text-sm font-semibold text-white backdrop-blur-md outline-none transition duration-[180ms]",
                    provinceFilter !== "all"
                      ? "border-blue-400/60 shadow-[0_0_18px_rgba(59,130,246,0.25)]"
                      : "border-slate-600/60 hover:border-blue-500/40",
                  ].join(" ")}
                >
                  <option value="all">All provinces</option>
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className={[
                  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold backdrop-blur-md transition duration-[180ms]",
                  searchOpen
                    ? "border-blue-400/60 bg-blue-500/25 text-blue-50 shadow-[0_0_18px_rgba(59,130,246,0.28)]"
                    : "border-slate-600/60 bg-slate-900/90 text-slate-200 hover:border-blue-500/40",
                ].join(" ")}
                aria-pressed={searchOpen}
              >
                <HiMagnifyingGlass className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Search</span>
              </button>

              <div className="flex shrink-0 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
                {BASE_LAYERS.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setBaseLayer(layer.id)}
                    className={[
                      "rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition duration-[180ms] sm:px-2.5",
                      baseLayer === layer.id
                        ? "bg-blue-500/30 text-blue-50"
                        : "text-slate-400 hover:text-white",
                    ].join(" ")}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewMode((mode) => {
                    const next = mode === "2d" ? "3d" : "2d";
                    if (
                      next === "3d" &&
                      (baseLayer === "street" || baseLayer === "terrain")
                    ) {
                      setBaseLayer("satellite");
                    }
                    return next;
                  });
                }}
                className={[
                  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold backdrop-blur-md transition duration-[180ms]",
                  viewMode === "3d"
                    ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100"
                    : "border-slate-600/60 bg-slate-900/90 text-slate-200 hover:border-fuchsia-500/40",
                ].join(" ")}
                aria-pressed={viewMode === "3d"}
              >
                {viewMode === "3d" ? (
                  <HiCube className="h-4 w-4" aria-hidden />
                ) : (
                  <HiSquare3Stack3D className="h-4 w-4" aria-hidden />
                )}
                <span className="hidden sm:inline">
                  {viewMode === "3d" ? "3D on" : "3D"}
                </span>
              </button>

              <button
                type="button"
                onClick={locateMe}
                disabled={locating}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3 py-2 text-sm font-semibold text-emerald-100 backdrop-blur-md transition duration-[180ms] disabled:opacity-50"
              >
                <HiMapPin
                  className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`}
                  aria-hidden
                />
                <span className="hidden sm:inline">
                  {locating ? "Locating…" : "Near me"}
                </span>
              </button>

              <Link
                to="/login"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#0038a8] bg-[#0038a8] px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,56,168,0.35)] transition duration-[180ms] hover:bg-[#002d87]"
              >
                <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Staff login</span>
              </Link>
            </div>
          </div>

          {locateError ? (
            <div className="pointer-events-auto mt-2 max-w-md rounded-xl border border-red-500/40 bg-slate-900/95 px-3 py-2 text-xs text-red-300 backdrop-blur">
              {locateError}
            </div>
          ) : null}

          {/* Status chips under chrome */}
          <div className="pointer-events-auto mt-3 flex max-w-3xl items-center gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={[
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition duration-[180ms]",
                statusFilter === "all"
                  ? "bg-white text-slate-900"
                  : "border border-slate-600/70 bg-slate-900/80 text-slate-300 hover:border-blue-400/40",
              ].join(" ")}
            >
              All status
            </button>
            {PROJECT_STATUSES.map((status) => {
              const count = projects.filter(
                (p) =>
                  (provinceFilter === "all" || p.province === provinceFilter) &&
                  p.status === status,
              ).length;
              if (count === 0) return null;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(statusFilter === status ? "all" : status)
                  }
                  className={[
                    "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 backdrop-blur-md transition duration-[180ms]",
                    statusFilter === status
                      ? STATUS_META[status].className
                      : "border border-slate-600/70 bg-slate-900/80 text-slate-400 ring-transparent hover:text-slate-200",
                  ].join(" ")}
                >
                  {STATUS_META[status].label}
                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold text-amber-100 backdrop-blur-md"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </header>

        {/* Search overlay (RegionDashboard-style) */}
        {searchOpen ? (
          <div className="pointer-events-auto absolute inset-0 z-40 flex items-start justify-center p-3 pt-28 sm:pt-32">
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
            />
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-blue-400/30 bg-slate-900/95 shadow-[0_16px_60px_rgba(0,0,0,0.55),0_0_28px_rgba(59,130,246,0.12)] backdrop-blur-xl">
              <div className="border-b border-slate-800 p-3">
                <div className="relative">
                  <HiMagnifyingGlass
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-300"
                    aria-hidden
                  />
                  <input
                    type="search"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search project, municipality, program, sector…"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-11 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition duration-[180ms] hover:text-white"
                    aria-label="Close"
                  >
                    <HiXMark className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                  <HiMapPin className="h-3.5 w-3.5 text-blue-400" aria-hidden />
                  Searching in{" "}
                  <span className="font-semibold text-blue-200">
                    {provinceFilter === "all" ? "all MIMAROPA" : provinceFilter}
                  </span>
                  · {filtered.length} result{filtered.length === 1 ? "" : "s"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="rounded-md border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[11px] font-semibold text-slate-300 transition duration-[180ms] hover:border-blue-400/50 hover:text-blue-100"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <ul className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain p-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                {filtered.length === 0 ? (
                  <li className="px-3 py-8 text-center text-sm text-slate-500">
                    No matches. Try another keyword or clear filters.
                  </li>
                ) : null}
                {filtered.slice(0, 40).map((project) => {
                  const meta = PROGRAM_META[project.program];
                  const status = STATUS_META[project.status];
                  return (
                    <li key={project.id} className="mb-1.5 last:mb-0">
                      <button
                        type="button"
                        onClick={() => openProject(project)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-800/40 p-2.5 text-left transition duration-[180ms] hover:border-blue-500/50 hover:bg-slate-800/70"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950/70 text-[9px] font-extrabold uppercase ring-1 ring-slate-700/60 ${meta.accent}`}
                        >
                          {meta.short}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {project.name}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {project.municipality}, {project.province}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}

        {/* Bottom map HUD */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 sm:p-5">
          <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col items-center gap-3">
            <div className="hidden w-full grid-cols-4 gap-2 sm:grid">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className="rounded-xl border border-slate-600/60 bg-slate-900/90 px-3 py-2.5 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {kpi.label}
                      </p>
                      <Icon className="h-3.5 w-3.5 text-blue-300" aria-hidden />
                    </div>
                    <p className="mt-1 truncate text-lg font-bold tabular-nums text-white">
                      {kpi.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <a
              href="#project-results"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition duration-[180ms] hover:-translate-y-0.5 hover:bg-white"
            >
              Browse project list
              <HiChevronDown className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      {/* ── Results list (below fold) ─────────────────────────────────── */}
      <section
        id="project-results"
        className="mx-auto max-w-[96rem] scroll-mt-4 px-2 py-8 sm:px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-[14px] border border-[#c5cdd8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-3 border-b border-[#dce1e8] bg-[#f8fafc] px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">
                  Project results
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  {sorted.length === 0
                    ? "No projects match"
                    : `Showing ${pageStart}–${pageEnd} of ${sorted.length}`}
                  {hasFilters && sorted.length > 0
                    ? ` · export uses ${describeExportScope({
                        province: provinceFilter,
                        status: statusFilter,
                        search: query,
                      })}`
                    : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[6px] border border-[#c5cdd8] bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition duration-[180ms] hover:border-[#0038a8] hover:text-[#0038a8]"
                >
                  <HiMagnifyingGlass className="h-4 w-4" aria-hidden />
                  Search map
                </button>
                <button
                  type="button"
                  disabled={sorted.length === 0}
                  onClick={() =>
                    downloadFilteredCsv(sorted, {
                      province: provinceFilter,
                      status: statusFilter,
                      search: query,
                    })
                  }
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-[6px] border border-[#0038a8] bg-[#0038a8] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-[180ms] hover:bg-[#002d87] disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    sorted.length === 0
                      ? "No rows to export"
                      : `Export ${sorted.length} project${sorted.length === 1 ? "" : "s"} matching current filters`
                  }
                >
                  <HiArrowDownTray className="h-4 w-4" aria-hidden />
                  Export CSV
                  {sorted.length > 0 ? (
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                      {sorted.length}
                    </span>
                  ) : null}
                </button>
                <label className="inline-flex items-center gap-2 text-[12px] text-slate-600">
                  <span className="font-semibold">Sort</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="min-h-9 rounded-[6px] border border-[#c5cdd8] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 outline-none transition duration-[180ms] focus:border-[#0038a8] focus:ring-2 focus:ring-[#0038a8]/20"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {sorted.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No projects match your search or filters.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#dce1e8] bg-white text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Project</th>
                      <th className="px-3 py-2.5 font-semibold">Program</th>
                      <th className="px-3 py-2.5 font-semibold">Location</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((project) => {
                      const status = STATUS_META[project.status];
                      const active = selectedId === project.id;
                      return (
                        <tr
                          key={project.id}
                          onClick={() => openProject(project)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openProject(project);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          className={[
                            "cursor-pointer border-b border-[#eef1f5] transition duration-[180ms] last:border-b-0",
                            active ? "bg-[#e8eef8]" : "hover:bg-[#f4f7fb]",
                          ].join(" ")}
                        >
                          <td className="max-w-[280px] px-4 py-3">
                            <p className="truncate font-semibold text-slate-900">
                              {project.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {project.beneficiary}
                            </p>
                          </td>
                          <td className="px-3 py-3 font-medium text-[#0038a8]">
                            {project.program}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            <span className="block truncate">
                              {project.municipality}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {project.province}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_PUBLIC[project.status]}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                            {formatPeso(project.budget)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-[#eef1f5] md:hidden">
                {pageItems.map((project) => {
                  const status = STATUS_META[project.status];
                  const active = selectedId === project.id;
                  return (
                    <li key={project.id}>
                      <button
                        type="button"
                        onClick={() => openProject(project)}
                        className={[
                          "flex w-full flex-col gap-1.5 px-3 py-3 text-left transition duration-[180ms]",
                          active
                            ? "bg-[#e8eef8]"
                            : "bg-white active:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-[13px] font-semibold leading-snug text-slate-900">
                            {project.name}
                          </p>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_PUBLIC[project.status]}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          <span className="font-medium text-[#0038a8]">
                            {project.program}
                          </span>{" "}
                          · {project.municipality}, {project.province}
                        </p>
                        <p className="text-[11px] tabular-nums text-slate-500">
                          {formatPeso(project.budget)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dce1e8] bg-[#f8fafc] px-3 py-3 sm:px-4">
                  <p className="text-[12px] text-slate-500">
                    Page {safePage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex min-h-9 items-center gap-1 rounded-[6px] border border-[#c5cdd8] bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition duration-[180ms] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <HiChevronLeft className="h-4 w-4" aria-hidden />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="inline-flex min-h-9 items-center gap-1 rounded-[6px] border border-[#c5cdd8] bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition duration-[180ms] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <HiChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="border-t border-[#002d87] bg-[#0038a8]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-white text-sm font-black text-[#0038a8]">
                T
              </span>
              <p className="text-sm font-black text-white">TARAMIMAROPA</p>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-blue-100">
              Tracking of Accomplishments and Results of Activities and Programs
              across MIMAROPA. A transparency initiative of DOST-MIMAROPA.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
              Provinces
            </p>
            <ul className="mt-3 space-y-1.5 text-[12px] text-blue-100">
              {PROVINCES.map((province) => (
                <li key={province}>
                  <button
                    type="button"
                    onClick={() => {
                      setProvinceFilter(province);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="transition duration-[180ms] hover:text-white"
                  >
                    {province}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
              Agency
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-blue-100">
              Department of Science and Technology
              <br />
              MIMAROPA Regional Office
              <br />
              Republic of the Philippines
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-white transition duration-[180ms] hover:text-amber-200"
            >
              <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
              Staff login
            </Link>
          </div>
        </div>
        <div className="border-t border-[#002d87] bg-[#002d87] py-4 text-center text-[11px] text-blue-200">
          © {new Date().getFullYear()} DOST-MIMAROPA · All rights reserved ·
          Powered by TARAMIMAROPA
        </div>
      </footer>

      {viewing && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[14px] border border-[#c5cdd8] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:rounded-[14px] [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0038a8]">
                  {PROGRAM_META[viewing.program].short} · {viewing.province}
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-900">
                  {viewing.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-[6px] border border-[#c5cdd8] p-2 text-slate-500 transition duration-[180ms] hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <img
              src={viewing.photo_url || projectImage(viewing.id)}
              alt={viewing.name}
              loading="lazy"
              className="mt-3 h-44 w-full rounded-[10px] border border-[#dce1e8] object-cover"
            />

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Project description
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {describeProject(viewing)}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Type
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {projectType(viewing)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Year
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {projectYear(viewing)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Beneficiary
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {viewing.beneficiary}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Municipality
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {viewing.municipality}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Status
                </dt>
                <dd className="mt-0.5">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_PUBLIC[viewing.status]}`}
                  >
                    {STATUS_META[viewing.status].label} · {viewing.progress}%
                  </span>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Beneficiaries reached
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {viewing.beneficiaries.toLocaleString()}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => openGoogleDirections(viewing, userLocation)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#0038a8] bg-[#0038a8] px-4 py-3 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,56,168,0.2)] transition duration-[180ms] hover:bg-[#002d87]"
              >
                <HiPaperAirplane className="h-5 w-5" aria-hidden />
                Google Maps directions
                <HiArrowTopRightOnSquare
                  className="h-4 w-4 opacity-80"
                  aria-hidden
                />
              </button>
              {!userLocation ? (
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={locating}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition duration-[180ms] hover:bg-emerald-100 disabled:opacity-50"
                >
                  <HiMapPin className="h-5 w-5" aria-hidden />
                  {locating ? "Locating…" : "Use my location"}
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              {userLocation
                ? "Route starts from your current GPS position."
                : "Opens Google Maps to this project. Tap Use my location first for a full driving route from where you are."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
