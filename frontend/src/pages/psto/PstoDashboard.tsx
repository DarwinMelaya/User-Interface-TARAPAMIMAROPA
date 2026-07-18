import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowTopRightOnSquare,
  HiBuildingOffice2,
  HiClipboardDocumentList,
  HiCube,
  HiMagnifyingGlass,
  HiMap,
  HiMapPin,
  HiPaperAirplane,
  HiXMark,
} from "react-icons/hi2";
import Maps, {
  type MapBaseLayer,
  type MapViewMode,
  type UserLocation,
} from "../../components/maps/Maps";
import type {
  ProjectStatus,
  TaraProgram,
  TaraProject,
} from "../../constants/taraProjects";
import {
  IMPRESSION_STATUSES,
  MARINDUQUE_MUNICIPALITIES,
  MARINDUQUE_PROJECTS,
  PROVINCE_NAME,
  formatPeso,
  type ImpressionProject,
  type ImpressionStatus,
  type ImpressionType,
  type MarinduqueMunicipality,
} from "../../constants/marinduqueProjects";

const BASE_LAYER_OPTIONS: { id: MapBaseLayer; label: string }[] = [
  { id: "street", label: "Street" },
  { id: "satellite", label: "Satellite" },
  { id: "terrain", label: "Terrain" },
  { id: "hybrid", label: "Hybrid" },
];

const STATUS_CLASS: Record<ImpressionStatus, string> = {
  "On-going": "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  New: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
  Graduated: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Completed: "bg-teal-500/15 text-teal-300 ring-teal-400/30",
  Terminated: "bg-red-500/15 text-red-300 ring-red-400/30",
  Withdrawn: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const PROGRAM_FROM_TYPE: Record<ImpressionType, TaraProgram> = {
  SETUP: "SETUP",
  "Roll-out": "STARBOOKS",
  "TAPI-assisted": "R&D",
  "GIA (Community Based)": "GIA",
  "GIA (Region-initiated Projects) Internally Funded": "GIA",
  "GIA (Region-initiated Projects) Externally Funded": "GIA",
  CEST: "CEST",
};

const STATUS_FROM_IMPRESSION: Record<ImpressionStatus, ProjectStatus> = {
  "On-going": "ongoing",
  New: "planning",
  Graduated: "completed",
  Completed: "completed",
  Terminated: "cancelled",
  Withdrawn: "on_hold",
};

const PROGRESS_FROM_STATUS: Record<ProjectStatus, number> = {
  planning: 10,
  ongoing: 55,
  completed: 100,
  delayed: 40,
  on_hold: 25,
  cancelled: 0,
};

const toTaraProject = (p: ImpressionProject): TaraProject => {
  const status = STATUS_FROM_IMPRESSION[p.status];
  return {
    id: p.code,
    name: p.title,
    program: PROGRAM_FROM_TYPE[p.type],
    province: PROVINCE_NAME as TaraProject["province"],
    municipality: p.municipality,
    barangay: "",
    latitude: p.latitude,
    longitude: p.longitude,
    budget: p.cost,
    funding_source: p.type,
    status,
    progress: PROGRESS_FROM_STATUS[status],
    start_date: `${p.year}-01-01`,
    end_date: `${p.year + 1}-12-31`,
    beneficiaries: 0,
    partner_agency: p.beneficiary,
    latest_accomplishment: p.description,
  };
};

const projectImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/320`;

const formatCompactPeso = (n: number) =>
  "₱" +
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

const openGoogleDirections = (
  p: ImpressionProject,
  origin: UserLocation | null,
) => {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${p.latitude},${p.longitude}`);
  url.searchParams.set("travelmode", "driving");
  if (origin) url.searchParams.set("origin", `${origin.lat},${origin.lng}`);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
};

const PstoDashboard = () => {
  const [projects] = useState<ImpressionProject[]>(MARINDUQUE_PROJECTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ImpressionProject | null>(null);
  const [municipalityFilter, setMunicipalityFilter] = useState<
    MarinduqueMunicipality | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<ImpressionStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>("satellite");
  const [viewMode, setViewMode] = useState<MapViewMode>("2d");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locateLoading, setLocateLoading] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [flyToUserToken, setFlyToUserToken] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<"stats" | "feed" | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (municipalityFilter !== "all" && p.municipality !== municipalityFilter)
        return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.beneficiary.toLowerCase().includes(q) ||
        p.municipality.toLowerCase().includes(q)
      );
    });
  }, [projects, municipalityFilter, statusFilter, search]);

  const mapProjects = useMemo(() => filtered.map(toTaraProject), [filtered]);

  const stats = useMemo(() => {
    const totalCost = filtered.reduce((s, p) => s + p.cost, 0);
    const ongoing = filtered.filter((p) => p.status === "On-going").length;
    const completed = filtered.filter(
      (p) => p.status === "Completed" || p.status === "Graduated",
    ).length;
    return {
      total: filtered.length,
      ongoing,
      completed,
      totalCost,
      municipalities: new Set(filtered.map((p) => p.municipality)).size,
    };
  }, [filtered]);

  const handleViewFromMap = (tp: TaraProject) => {
    const match = projects.find((p) => p.code === tp.id) ?? null;
    setSelectedId(tp.id);
    setViewing(match);
  };

  const handleViewProject = (p: ImpressionProject) => {
    setSelectedId(p.code);
    setViewing(p);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError("Geolocation not supported on this browser.");
      return;
    }
    setLocateLoading(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setFlyToUserToken((t) => t + 1);
        setLocateLoading(false);
      },
      () => {
        setLocateLoading(false);
        setLocateError("Could not get current location.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 15_000 },
    );
  };

  const hasFilters =
    municipalityFilter !== "all" ||
    statusFilter !== "all" ||
    search.trim().length > 0;

  const clearFilters = () => {
    setMunicipalityFilter("all");
    setStatusFilter("all");
    setSearch("");
  };

  return (
    <section className="fixed inset-0 z-30 overflow-hidden bg-slate-950 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-slate-100 lg:left-72 lg:pb-0">
      <div className="pointer-events-auto absolute inset-0 z-[5]">
        <Maps
          projects={mapProjects}
          selectedId={selectedId}
          baseLayer={baseLayer}
          viewMode={viewMode}
          userLocation={userLocation}
          flyToUserToken={flyToUserToken}
          onViewProject={handleViewFromMap}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-slate-950/95 via-slate-950/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
        <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-slate-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[11px]">
              <HiMap className="h-3.5 w-3.5" aria-hidden />
              PSTO Marinduque · S&amp;T Map
            </div>
            <h1 className="mt-2 bg-gradient-to-r from-white via-emerald-100 to-teal-300/90 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:mt-3 sm:text-3xl">
              Marinduque Projects
            </h1>
            <p className="mt-1 hidden text-xs text-slate-400 sm:block">
              {stats.municipalities} municipalities · {filtered.length} projects
              on map · {formatCompactPeso(stats.totalCost)} total cost
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className={[
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold backdrop-blur-md transition",
                searchOpen
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.28)]"
                  : "border-slate-600/60 bg-slate-900/90 text-slate-200 hover:border-emerald-500/40",
              ].join(" ")}
              aria-pressed={searchOpen}
            >
              <HiMagnifyingGlass className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Search</span>
            </button>
            <div className="flex shrink-0 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
              {BASE_LAYER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBaseLayer(opt.id)}
                  className={[
                    "rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition sm:px-2.5",
                    baseLayer === opt.id
                      ? "bg-emerald-500/25 text-emerald-100"
                      : "text-slate-400 hover:text-white",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setViewMode((mode) => {
                  const next = mode === "2d" ? "3d" : "2d";
                  if (
                    next === "3d" &&
                    (baseLayer === "street" || baseLayer === "terrain")
                  ) {
                    setBaseLayer("satellite");
                  }
                  return next;
                })
              }
              className={[
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold backdrop-blur-md transition",
                viewMode === "3d"
                  ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,0.25)]"
                  : "border-slate-600/60 bg-slate-900/90 text-slate-200 hover:border-fuchsia-500/40",
              ].join(" ")}
              aria-pressed={viewMode === "3d"}
            >
              <HiCube className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">
                {viewMode === "3d" ? "3D on" : "3D view"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locateLoading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3 py-2 text-sm font-semibold text-emerald-100 backdrop-blur-md disabled:opacity-50"
            >
              <HiMapPin
                className={`h-4 w-4 ${locateLoading ? "animate-pulse" : ""}`}
                aria-hidden
              />
              <span className="hidden sm:inline">
                {locateLoading ? "Locating…" : "My location"}
              </span>
            </button>
            <Link
              to="/psto/programs"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/80 px-3 py-2 text-sm font-medium text-emerald-100 backdrop-blur-md sm:px-4"
            >
              <HiClipboardDocumentList className="h-4 w-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">Project list</span>
            </Link>
          </div>
        </div>

        {locateError ? (
          <div className="pointer-events-auto mt-2 max-w-md rounded-xl border border-red-500/40 bg-slate-900/95 px-3 py-2 text-xs text-red-300 backdrop-blur">
            {locateError}
          </div>
        ) : null}
      </header>

      {searchOpen ? (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-start justify-center p-3 pt-24 sm:pt-28">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-900/95 shadow-[0_16px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(16,185,129,0.12)] backdrop-blur-xl">
            <div className="border-b border-emerald-900/50 p-3">
              <div className="relative">
                <HiMagnifyingGlass
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300"
                  aria-hidden
                />
                <input
                  type="search"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search project, beneficiary, municipality…"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3 pl-11 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-white"
                  aria-label="Close"
                >
                  <HiXMark className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                <HiMapPin className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                {filtered.length} result{filtered.length === 1 ? "" : "s"} in{" "}
                {municipalityFilter === "all"
                  ? "Marinduque"
                  : municipalityFilter}
              </p>
            </div>
            <ul className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain p-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-slate-500">
                  No matches.
                </li>
              ) : null}
              {filtered.map((p) => (
                <li key={p.code} className="mb-1.5 last:mb-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleViewProject(p);
                      setSearchOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-800/40 p-2.5 text-left transition hover:border-emerald-500/50 hover:bg-slate-800/70"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {p.title}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {p.municipality} · {p.latitude.toFixed(4)},{" "}
                        {p.longitude.toFixed(4)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ${STATUS_CLASS[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-25 flex justify-center gap-2 px-3 lg:hidden">
        {(["stats", "feed"] as const).map((sheet) => (
          <button
            key={sheet}
            type="button"
            onClick={() =>
              setMobileSheet((cur) => (cur === sheet ? null : sheet))
            }
            className={[
              "rounded-full border px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition capitalize",
              mobileSheet === sheet
                ? "border-emerald-400/60 bg-emerald-500/25 text-emerald-100"
                : "border-slate-700/80 bg-slate-900/90 text-slate-300",
            ].join(" ")}
          >
            {sheet === "feed" ? `Projects (${filtered.length})` : "Overview"}
          </button>
        ))}
        {mobileSheet ? (
          <button
            type="button"
            onClick={() => setMobileSheet(null)}
            className="rounded-full border border-slate-600/80 bg-slate-900/90 px-4 py-2 text-xs font-bold text-slate-400"
          >
            Map
          </button>
        ) : null}
      </div>

      <div
        className={[
          "pointer-events-none absolute inset-x-0 z-20 flex flex-col gap-3 p-3 sm:p-5",
          "bottom-[calc(7rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:flex-row lg:items-end lg:justify-between lg:gap-3",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-emerald-400/25 bg-slate-900/92 p-3 shadow-[0_8px_40px_rgba(0,0,0,0.45),0_0_30px_rgba(16,185,129,0.08)] backdrop-blur-xl lg:max-w-[min(340px,calc(100%-2rem))]",
            mobileSheet === "stats" ? "" : "hidden",
            "lg:flex",
          ].join(" ")}
        >
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200/85">
            Provincial overview
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-200/70">
                Projects
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-200">
                {stats.total}
              </p>
            </div>
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-cyan-200/70">
                On-going
              </p>
              <p className="mt-1 text-xl font-bold text-cyan-200">
                {stats.ongoing}
              </p>
            </div>
            <div className="rounded-xl border border-teal-400/25 bg-teal-500/10 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-teal-200/70">
                Completed
              </p>
              <p className="mt-1 text-xl font-bold text-teal-200">
                {stats.completed}
              </p>
            </div>
            <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 p-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-yellow-200/70">
                Total cost
              </p>
              <p className="mt-1 text-lg font-bold text-yellow-200">
                {formatCompactPeso(stats.totalCost)}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-2.5">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <HiMapPin className="h-3.5 w-3.5" aria-hidden />
              Municipality
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setMunicipalityFilter("all")}
                className={[
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  municipalityFilter === "all"
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-slate-700 text-slate-400",
                ].join(" ")}
              >
                All
              </button>
              {MARINDUQUE_MUNICIPALITIES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMunicipalityFilter(m)}
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    municipalityFilter === m
                      ? "bg-emerald-400 text-slate-950"
                      : "border border-slate-700 text-slate-400",
                  ].join(" ")}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 w-full rounded-lg border border-slate-700/80 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:text-white"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div
          className={[
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border border-emerald-400/25 bg-slate-900/95 shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_24px_rgba(16,185,129,0.1)] backdrop-blur-xl",
            mobileSheet === "feed" ? "max-h-[min(58vh,460px)]" : "hidden",
            "lg:flex lg:max-h-[min(520px,62vh)] lg:max-w-[min(420px,calc(100%-2rem))]",
          ].join(" ")}
        >
          <div className="border-b border-emerald-900/50 px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200/90">
                Project feed
              </p>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                {filtered.length}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={[
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  statusFilter === "all"
                    ? "bg-emerald-500 text-white"
                    : "border border-slate-700/80 text-slate-400",
                ].join(" ")}
              >
                All status
              </button>
              {IMPRESSION_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    statusFilter === s
                      ? "bg-emerald-500 text-white"
                      : "border border-slate-700/80 text-slate-400",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
            {filtered.length === 0 ? (
              <li className="flex flex-col items-center px-4 py-10 text-center">
                <HiBuildingOffice2
                  className="h-8 w-8 text-emerald-500/60"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-semibold text-white">
                  No projects
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Adjust municipality, status, or search filters.
                </p>
              </li>
            ) : null}
            {filtered.map((p) => {
              const isSelected = selectedId === p.code;
              return (
                <li key={p.code} className="mb-2 last:mb-0">
                  <button
                    type="button"
                    onClick={() => handleViewProject(p)}
                    className={[
                      "flex w-full flex-col gap-1 rounded-xl border p-2.5 text-left transition",
                      isSelected
                        ? "border-emerald-400/60 bg-emerald-400/15 shadow-[0_0_24px_rgba(16,185,129,0.2)]"
                        : "border-slate-800/80 bg-slate-800/40 hover:border-slate-600/80 hover:bg-slate-800/70",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_CLASS[p.status]}`}
                      >
                        {p.status}
                      </span>
                      <span className="text-[11px] font-bold text-cyan-200">
                        {formatCompactPeso(p.cost)}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold text-white">
                      {p.title}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-slate-400">
                      {p.municipality} · {p.type}
                    </p>
                    <p className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                      <HiMapPin className="h-3 w-3" aria-hidden />
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {viewing ? (
        <div
          className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Project detail"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-emerald-800/50 bg-slate-900 p-4 shadow-2xl [-webkit-overflow-scrolling:touch] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300/80">
                  {viewing.type} · {viewing.year}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {viewing.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewing(null);
                  setSelectedId(null);
                }}
                className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <img
              src={projectImage(viewing.code)}
              alt={viewing.title}
              loading="lazy"
              className="mt-3 h-44 w-full rounded-xl object-cover ring-1 ring-slate-700/60"
            />
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/70">
              Project description
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {viewing.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Municipality</p>
                <p className="mt-1 font-semibold text-white">
                  {viewing.municipality}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Status</p>
                <p className="mt-1 font-semibold text-white">{viewing.status}</p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Sector</p>
                <p className="mt-1 font-semibold text-white">{viewing.sector}</p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Project cost</p>
                <p className="mt-1 font-semibold text-cyan-200">
                  {formatPeso(viewing.cost)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Beneficiary</p>
                <p className="mt-1 font-semibold text-white">
                  {viewing.beneficiary}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Coordinates</p>
                <p className="mt-1 font-mono font-semibold text-white">
                  {viewing.latitude.toFixed(5)}, {viewing.longitude.toFixed(5)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openGoogleDirections(viewing, userLocation)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
            >
              <HiPaperAirplane className="h-5 w-5" aria-hidden />
              Google Maps directions
              <HiArrowTopRightOnSquare className="h-4 w-4 opacity-70" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default PstoDashboard;
