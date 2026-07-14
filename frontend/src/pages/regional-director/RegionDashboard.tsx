import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiAcademicCap,
  HiArrowPath,
  HiArrowTopRightOnSquare,
  HiBanknotes,
  HiBuildingOffice2,
  HiChartBar,
  HiClock,
  HiExclamationTriangle,
  HiFunnel,
  HiLightBulb,
  HiMagnifyingGlass,
  HiMap,
  HiMapPin,
  HiPaperAirplane,
  HiPauseCircle,
  HiSignal,
  HiSparkles,
  HiSquares2X2,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";
import Maps, {
  type MapBaseLayer,
  type UserLocation,
} from "../../components/maps/Maps";
import {
  AI_INSIGHTS,
  MOCK_TARA_PROJECTS,
  PROGRAM_META,
  PROGRAMS,
  PROVINCES,
  STATUS_META,
  formatCompact,
  formatPeso,
  summarizeProjects,
  type ProjectStatus,
  type Province,
  type TaraProgram,
  type TaraProject,
} from "../../constants/taraProjects";

const BASE_LAYER_OPTIONS: { id: MapBaseLayer; label: string }[] = [
  { id: "street", label: "Street" },
  { id: "satellite", label: "Satellite" },
  { id: "terrain", label: "Terrain" },
  { id: "hybrid", label: "Hybrid" },
];

type StatKey =
  | "total"
  | "active"
  | "completed"
  | "delayed"
  | "onHold"
  | "beneficiaries"
  | "funding"
  | "utilized";

const STAT_CARDS: {
  key: StatKey;
  label: string;
  icon: typeof HiSquares2X2;
  accent: string;
  valueClass: string;
  format: "number" | "peso" | "compact";
  trend: string;
  statusFilter?: ProjectStatus | "all";
}[] = [
  {
    key: "total",
    label: "Total projects",
    icon: HiSquares2X2,
    accent:
      "border-cyan-400/35 bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 text-cyan-100",
    valueClass: "text-cyan-200",
    format: "number",
    trend: "+8% MoM",
    statusFilter: "all",
  },
  {
    key: "active",
    label: "Active",
    icon: HiSignal,
    accent:
      "border-blue-400/35 bg-gradient-to-br from-blue-500/20 to-blue-600/5 text-blue-100",
    valueClass: "text-blue-300",
    format: "number",
    trend: "+3",
    statusFilter: "ongoing",
  },
  {
    key: "completed",
    label: "Completed",
    icon: HiAcademicCap,
    accent:
      "border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 text-emerald-100",
    valueClass: "text-emerald-300",
    format: "number",
    trend: "+12%",
    statusFilter: "completed",
  },
  {
    key: "delayed",
    label: "Delayed",
    icon: HiExclamationTriangle,
    accent:
      "border-red-400/35 bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-100",
    valueClass: "text-red-300",
    format: "number",
    trend: "Watch",
    statusFilter: "delayed",
  },
  {
    key: "onHold",
    label: "On hold",
    icon: HiPauseCircle,
    accent:
      "border-amber-400/35 bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-100",
    valueClass: "text-amber-300",
    format: "number",
    trend: "Stable",
    statusFilter: "on_hold",
  },
  {
    key: "beneficiaries",
    label: "Beneficiaries",
    icon: HiUserGroup,
    accent:
      "border-violet-400/35 bg-gradient-to-br from-violet-500/20 to-violet-600/5 text-violet-100",
    valueClass: "text-violet-300",
    format: "compact",
    trend: "+6.2%",
  },
  {
    key: "funding",
    label: "Funding released",
    icon: HiBanknotes,
    accent:
      "border-yellow-400/35 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 text-yellow-100",
    valueClass: "text-yellow-200",
    format: "peso",
    trend: "+4.1%",
  },
  {
    key: "utilized",
    label: "Funding utilized",
    icon: HiChartBar,
    accent:
      "border-teal-400/35 bg-gradient-to-br from-teal-500/20 to-teal-600/5 text-teal-100",
    valueClass: "text-teal-300",
    format: "peso",
    trend: "+5.8%",
  },
];

const formatStat = (
  value: number,
  format: "number" | "peso" | "compact",
) => {
  if (format === "peso") return formatPeso(value);
  if (format === "compact") return formatCompact(value);
  return String(value);
};

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

const RegionDashboard = () => {
  const [projects] = useState<TaraProject[]>(MOCK_TARA_PROJECTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TaraProject | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<Province | "all">("all");
  const [programFilter, setProgramFilter] = useState<TaraProgram | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [feedExpanded, setFeedExpanded] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );
  const [mobileSheet, setMobileSheet] = useState<"stats" | "feed" | "ai" | null>(
    null,
  );
  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>("street");
  const [insightIndex, setInsightIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locateLoading, setLocateLoading] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [flyToUserToken, setFlyToUserToken] = useState(0);

  const stats = useMemo(() => summarizeProjects(projects), [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (provinceFilter !== "all" && p.province !== provinceFilter) return false;
      if (programFilter !== "all" && p.program !== programFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.program.toLowerCase().includes(q) ||
        p.province.toLowerCase().includes(q) ||
        p.municipality.toLowerCase().includes(q) ||
        p.barangay.toLowerCase().includes(q) ||
        p.partner_agency.toLowerCase().includes(q) ||
        p.funding_source.toLowerCase().includes(q)
      );
    });
  }, [projects, provinceFilter, programFilter, statusFilter, search]);

  const handleViewProject = (project: TaraProject) => {
    setSelectedId(project.id);
    setViewing(project);
  };

  const handleCloseDetail = () => {
    setViewing(null);
    setSelectedId(null);
  };

  const handleStatClick = (card: (typeof STAT_CARDS)[number]) => {
    if (card.statusFilter) {
      setStatusFilter(card.statusFilter);
    }
  };

  const clearFilters = () => {
    setProvinceFilter("all");
    setProgramFilter("all");
    setStatusFilter("all");
    setSearch("");
  };

  const hasFilters =
    provinceFilter !== "all" ||
    programFilter !== "all" ||
    statusFilter !== "all" ||
    search.trim().length > 0;

  const toggleMobileSheet = (sheet: "stats" | "feed" | "ai") => {
    setMobileSheet((current) => (current === sheet ? null : sheet));
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
        const next: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(next);
        setFlyToUserToken((token) => token + 1);
        setLocateLoading(false);
      },
      (error) => {
        setLocateLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocateError("Location permission denied.");
          return;
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
          setLocateError("Location unavailable.");
          return;
        }
        setLocateError("Could not get current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 15_000,
      },
    );
  };

  return (
    <section className="fixed inset-0 z-30 overflow-hidden bg-slate-950 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-slate-100 lg:left-72 lg:pb-0">
      <div className="pointer-events-auto absolute inset-0 z-[5]">
        <Maps
          projects={filteredProjects}
          selectedId={selectedId}
          baseLayer={baseLayer}
          userLocation={userLocation}
          flyToUserToken={flyToUserToken}
          onViewProject={handleViewProject}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.12),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(37,99,235,0.12),transparent_42%),linear-gradient(to_bottom,rgba(2,6,23,0.08),rgba(2,6,23,0.55))]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-slate-950/95 via-slate-950/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
        <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-[11px]">
              <HiMap className="h-3.5 w-3.5" aria-hidden />
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              TARA · STI Command Map
            </div>
            <h1 className="mt-2 bg-gradient-to-r from-white via-cyan-100 to-blue-300/90 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:mt-3 sm:text-3xl">
              TARA PAMIMAROPA
            </h1>
            <p className="mt-1 max-w-xl text-xs text-cyan-200/75 sm:text-sm">
              Tracking of Accomplishments and Results of Activities and Programs
              across MIMAROPA
            </p>
            <p className="mt-1 hidden text-xs text-slate-400 sm:block">
              {stats.municipalities} municipalities · {stats.barangays} barangays
              · {stats.partners} partners · {filteredProjects.length} on map
            </p>
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
            <div className="flex rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
              {BASE_LAYER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBaseLayer(opt.id)}
                  className={[
                    "rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition sm:px-2.5",
                    baseLayer === opt.id
                      ? "bg-cyan-500/25 text-cyan-100"
                      : "text-slate-400 hover:text-white",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locateLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3 py-2 text-sm font-semibold text-emerald-100 backdrop-blur-md disabled:opacity-50"
            >
              <HiMapPin
                className={`h-4 w-4 ${locateLoading ? "animate-pulse" : ""}`}
                aria-hidden
              />
              {locateLoading ? "Locating…" : "My location"}
            </button>
            <button
              type="button"
              onClick={() => setInsightIndex((i) => (i + 1) % AI_INSIGHTS.length)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-slate-900/90 px-3 py-2 text-sm font-semibold text-violet-100 backdrop-blur-md"
            >
              <HiSparkles className="h-4 w-4" aria-hidden />
              AI
            </button>
            <Link
              to="/regional-director/programs"
              className="inline-flex items-center justify-center rounded-xl border border-blue-500/30 bg-blue-950/80 px-3 py-2 text-sm font-medium text-blue-100 backdrop-blur-md sm:px-4"
            >
              Programs
            </Link>
          </div>
        </div>

        {locateError ? (
          <div className="pointer-events-auto mt-2 max-w-md rounded-xl border border-red-500/40 bg-slate-900/95 px-3 py-2 text-xs text-red-300 backdrop-blur">
            {locateError}
          </div>
        ) : null}

        <div className="pointer-events-auto mt-3 hidden max-w-3xl items-start gap-2 rounded-xl border border-violet-500/25 bg-slate-900/85 p-3 backdrop-blur-md lg:flex">
          <HiLightBulb className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200/80">
              AI insight
            </p>
            <p className="mt-1 text-sm text-slate-200">{AI_INSIGHTS[insightIndex]}</p>
          </div>
          <button
            type="button"
            onClick={() => setInsightIndex((i) => (i + 1) % AI_INSIGHTS.length)}
            className="shrink-0 rounded-lg border border-violet-700/50 px-2 py-1 text-[10px] font-semibold text-violet-200"
          >
            Next
          </button>
        </div>
      </header>

      <div className="pointer-events-auto absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-25 flex justify-center gap-2 px-3 lg:hidden">
        {(["stats", "feed", "ai"] as const).map((sheet) => (
          <button
            key={sheet}
            type="button"
            onClick={() => toggleMobileSheet(sheet)}
            className={[
              "rounded-full border px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition capitalize",
              mobileSheet === sheet
                ? "border-cyan-400/60 bg-cyan-500/25 text-cyan-100"
                : "border-slate-700/80 bg-slate-900/90 text-slate-300",
            ].join(" ")}
          >
            {sheet === "feed" ? `Feed (${filteredProjects.length})` : sheet}
          </button>
        ))}
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

      <div
        className={[
          "pointer-events-none absolute inset-x-0 z-20 flex flex-col gap-3 p-3 sm:p-5",
          "bottom-[calc(7rem+env(safe-area-inset-bottom))] lg:bottom-0 lg:flex-row lg:items-end lg:justify-between",
        ].join(" ")}
      >
        <div
          className={[
            "pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-900/92 p-3 shadow-[0_8px_40px_rgba(0,0,0,0.45),0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:max-w-[min(420px,calc(100%-2rem))]",
            mobileSheet === "stats" || mobileSheet === "ai"
              ? "max-h-[min(55vh,420px)] overflow-y-auto"
              : "hidden",
            "lg:flex lg:max-h-[min(520px,62vh)] lg:overflow-y-auto",
          ].join(" ")}
        >
          <p className="mb-2.5 shrink-0 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200/85">
            Executive overview
          </p>
          <div className="grid w-full grid-cols-2 gap-2">
            {STAT_CARDS.map((card) => {
              const Icon = card.icon;
              const isActive =
                card.statusFilter != null && statusFilter === card.statusFilter;
              const value = stats[card.key];

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => handleStatClick(card)}
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
                    className={`mt-1 text-lg font-bold tabular-nums sm:text-xl ${card.valueClass}`}
                  >
                    {formatStat(value, card.format)}
                  </p>
                  <p className="mt-0.5 text-[9px] font-semibold text-white/50">
                    {card.trend}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-2.5">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              <HiMapPin className="h-3.5 w-3.5" aria-hidden />
              Province explorer
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setProvinceFilter("all")}
                className={[
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  provinceFilter === "all"
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-slate-700 text-slate-400",
                ].join(" ")}
              >
                All
              </button>
              {PROVINCES.map((province) => (
                <button
                  key={province}
                  type="button"
                  onClick={() => setProvinceFilter(province)}
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    provinceFilter === province
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-slate-700 text-slate-400",
                  ].join(" ")}
                >
                  {province.replace(" Mindoro", " Min.")}
                </button>
              ))}
            </div>
          </div>

          <div
            className={[
              "mt-3 rounded-xl border border-violet-500/25 bg-violet-950/30 p-2.5",
              mobileSheet === "ai" ? "block" : "hidden lg:block",
            ].join(" ")}
          >
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/80">
              <HiSparkles className="h-3.5 w-3.5" aria-hidden />
              AI analytics
            </p>
            <p className="text-xs leading-relaxed text-slate-200">
              {AI_INSIGHTS[insightIndex]}
            </p>
            <button
              type="button"
              onClick={() =>
                setInsightIndex((i) => (i + 1) % AI_INSIGHTS.length)
              }
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-300"
            >
              <HiArrowPath className="h-3 w-3" aria-hidden />
              Refresh insight
            </button>
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
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-900/95 shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_24px_rgba(34,211,238,0.1)] backdrop-blur-xl transition-all duration-300",
            mobileSheet === "feed" ? "max-h-[min(58vh,460px)]" : "hidden",
            "lg:flex lg:max-h-[min(520px,62vh)] lg:max-w-[min(420px,calc(100%-2rem))]",
            feedExpanded ? "lg:max-h-[min(520px,62vh)]" : "lg:max-h-14",
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
                  Project feed
                </p>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  {filteredProjects.length}
                </span>
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
                    placeholder="Search projects, programs, LGU…"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/25"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="mr-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    <HiFunnel className="h-3 w-3" aria-hidden />
                    Program
                  </span>
                  <button
                    type="button"
                    onClick={() => setProgramFilter("all")}
                    className={[
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      programFilter === "all"
                        ? "bg-cyan-400 text-slate-950"
                        : "border border-slate-700/80 text-slate-400",
                    ].join(" ")}
                  >
                    All
                  </button>
                  {PROGRAMS.slice(0, 8).map((program) => (
                    <button
                      key={program}
                      type="button"
                      onClick={() => setProgramFilter(program)}
                      className={[
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        programFilter === program
                          ? "bg-cyan-400 text-slate-950"
                          : "border border-slate-700/80 text-slate-400",
                      ].join(" ")}
                    >
                      {PROGRAM_META[program].short}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={[
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      statusFilter === "all"
                        ? "bg-blue-500 text-white"
                        : "border border-slate-700/80 text-slate-400",
                    ].join(" ")}
                  >
                    All status
                  </button>
                  {(
                    [
                      "ongoing",
                      "completed",
                      "delayed",
                      "on_hold",
                      "planning",
                    ] as ProjectStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={[
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        statusFilter === status
                          ? "bg-blue-500 text-white"
                          : "border border-slate-700/80 text-slate-400",
                      ].join(" ")}
                    >
                      {STATUS_META[status].label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {feedExpanded ? (
            <ul className="flex-1 overflow-y-auto p-2 sm:p-3 [scrollbar-width:thin]">
              {filteredProjects.length === 0 ? (
                <li className="flex flex-col items-center px-4 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-800/50 bg-cyan-950/50">
                    <HiBuildingOffice2
                      className="h-6 w-6 text-cyan-500/70"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-white">
                    No projects on map
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Adjust province, program, or search filters.
                  </p>
                </li>
              ) : null}

              {filteredProjects.map((project) => {
                const status = STATUS_META[project.status];
                const program = PROGRAM_META[project.program];
                const isSelected = selectedId === project.id;

                return (
                  <li key={project.id} className="mb-2 last:mb-0">
                    <button
                      type="button"
                      onClick={() => handleViewProject(project)}
                      className={[
                        "relative flex w-full gap-3 overflow-hidden rounded-xl border p-2.5 text-left transition",
                        isSelected
                          ? "border-cyan-400/60 bg-cyan-400/15 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                          : "border-slate-800/80 bg-slate-800/40 hover:border-slate-600/80 hover:bg-slate-800/70",
                      ].join(" ")}
                    >
                      {project.status === "delayed" ? (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-orange-500" />
                      ) : null}

                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-950/80 ring-1 ring-slate-700/60">
                        <span
                          className={`text-[10px] font-extrabold uppercase ${program.accent}`}
                        >
                          {program.short}
                        </span>
                        <span className="mt-1 text-[10px] font-bold text-white">
                          {project.progress}%
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${status.className}`}
                          >
                            {status.label}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {project.program}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-sm font-semibold text-white">
                          {project.name}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                          {project.municipality}, {project.province}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <HiBanknotes className="h-3 w-3" aria-hidden />
                            {formatCompact(project.budget)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiUserGroup className="h-3 w-3" aria-hidden />
                            {formatCompact(project.beneficiaries)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HiClock className="h-3 w-3" aria-hidden />
                            {project.end_date.slice(0, 7)}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                            style={{ width: `${project.progress}%` }}
                          />
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

      {viewing ? (
        <div
          className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Project detail"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyan-800/50 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">
                  Project intel · {viewing.program}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {viewing.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Province</p>
                <p className="mt-1 font-semibold text-white">{viewing.province}</p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Municipality</p>
                <p className="mt-1 font-semibold text-white">
                  {viewing.municipality}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Barangay</p>
                <p className="mt-1 font-semibold text-white">{viewing.barangay}</p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Status</p>
                <p className="mt-1 font-semibold text-white">
                  {STATUS_META[viewing.status].label}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Budget</p>
                <p className="mt-1 font-semibold text-cyan-200">
                  {formatPeso(viewing.budget)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Funding source</p>
                <p className="mt-1 font-semibold text-white">
                  {viewing.funding_source}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">Beneficiaries</p>
                <p className="mt-1 font-semibold text-white">
                  {formatCompact(viewing.beneficiaries)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
                <p className="text-slate-500">GPS</p>
                <p className="mt-1 font-semibold text-white">
                  {viewing.latitude.toFixed(4)}, {viewing.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">Progress</span>
                <span className="font-bold text-cyan-300">{viewing.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${viewing.progress}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {viewing.start_date} → {viewing.end_date}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Latest accomplishment
              </p>
              <p className="mt-1.5 text-sm text-slate-200">
                {viewing.latest_accomplishment}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Partner: {viewing.partner_agency}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => openGoogleDirections(viewing, userLocation)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
              >
                <HiPaperAirplane className="h-5 w-5" aria-hidden />
                Google Maps directions
                <HiArrowTopRightOnSquare className="h-4 w-4 opacity-70" aria-hidden />
              </button>
              {!userLocation ? (
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locateLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-50"
                >
                  <HiMapPin className="h-5 w-5" aria-hidden />
                  {locateLoading ? "Locating…" : "Use my location"}
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              {userLocation
                ? "Route starts from your current GPS position."
                : "No origin yet — Google opens with destination only. Tap Use my location for full route."}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default RegionDashboard;
