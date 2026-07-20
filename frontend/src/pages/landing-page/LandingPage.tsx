import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiArrowRightOnRectangle,
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

/** Light-theme status chips for public gov surface (STATUS_META tuned for dark dashboards). */
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
  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>("street");
  const [viewMode, setViewMode] = useState<MapViewMode>("2d");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [flyToUserToken, setFlyToUserToken] = useState(0);
  const [locating, setLocating] = useState(false);

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

  const legend = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((p) =>
      counts.set(p.program, (counts.get(p.program) ?? 0) + 1),
    );
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([program, count]) => ({ program, count }));
  }, [filtered]);

  const kpis = [
    {
      label: "Projects",
      value: String(stats.total),
      icon: HiSquares2X2,
    },
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

  const openProject = (project: TaraProject) => {
    setSelectedId(project.id);
    setViewing(project);
  };

  const locateMe = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
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
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800">
      {/* Masthead */}
      <header className="sticky top-0 z-40 border-b border-[#c5cdd8] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-[#0038a8] text-base font-black text-white shadow-[0_2px_8px_rgba(0,56,168,0.18)]">
              T
            </span>
            <div className="leading-tight">
              <p className="text-base font-black tracking-tight text-[#0f172a]">
                TARAMIMAROPA
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                DOST-MIMAROPA · S&amp;T Project Tracker
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-[6px] border border-[#0038a8] bg-[#0038a8] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-[180ms] hover:bg-[#002d87] hover:shadow-[0_2px_8px_rgba(0,56,168,0.2)]"
          >
            <HiArrowRightOnRectangle
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              aria-hidden
            />
            Staff login
          </Link>
        </div>
      </header>

      {/* Hero: brand + search + filters */}
      <section className="relative overflow-hidden border-b border-[#c5cdd8] bg-gradient-to-b from-[#e8eef8] to-[#f4f6f9]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,56,168,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,56,168,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 55% at 50% 0%, #000 35%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 55% at 50% 0%, #000 35%, transparent 100%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-14">
          <p className="animate-fade-up text-[11px] font-bold uppercase tracking-[0.16em] text-[#0038a8]">
            Transparency · Science for the People
          </p>
          <h1 className="animate-fade-up mt-3 text-4xl font-black leading-[1.05] tracking-tight text-[#0038a8] [animation-delay:60ms] sm:text-5xl md:text-6xl">
            TARAMIMAROPA
          </h1>
          <p className="animate-fade-up mt-3 max-w-2xl text-base font-semibold text-slate-700 [animation-delay:120ms] sm:text-lg">
            Tracking of Accomplishments and Results of Activities and Programs
            across MIMAROPA
          </p>
          <p className="animate-fade-up mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 [animation-delay:180ms]">
            Public window into DOST science and technology projects across
            Oriental Mindoro, Occidental Mindoro, Marinduque, Romblon, and
            Palawan. Search a project, explore the map, and see impact in your
            community.
          </p>

          <div className="animate-fade-up mt-6 flex flex-col gap-3 [animation-delay:240ms]">
            <div className="relative">
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search project, municipality, program, sector…"
                className="w-full rounded-[10px] border border-[#b8c0cc] bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition duration-[180ms] placeholder:text-slate-400 focus:border-[#0038a8] focus:ring-2 focus:ring-[#0038a8]/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-semibold uppercase tracking-wide">Try:</span>
              {QUICK_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-[6px] border border-[#c5cdd8] bg-white px-2.5 py-0.5 font-semibold text-slate-600 transition duration-[180ms] hover:border-[#0038a8] hover:text-[#0038a8]"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="mt-1 flex items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setProvinceFilter("all")}
                className={[
                  "shrink-0 rounded-[6px] px-3.5 py-1.5 text-xs font-bold transition duration-[180ms]",
                  provinceFilter === "all"
                    ? "bg-[#0038a8] text-white shadow-[0_2px_8px_rgba(0,56,168,0.25)]"
                    : "border border-[#c5cdd8] bg-white text-slate-600 hover:border-[#0038a8] hover:text-[#0038a8]",
                ].join(" ")}
              >
                All provinces
              </button>
              {PROVINCES.map((province) => {
                const count = projects.filter(
                  (p) => p.province === province,
                ).length;
                return (
                  <button
                    key={province}
                    type="button"
                    onClick={() => setProvinceFilter(province)}
                    className={[
                      "shrink-0 rounded-[6px] px-3.5 py-1.5 text-xs font-bold transition duration-[180ms]",
                      provinceFilter === province
                        ? "bg-[#0038a8] text-white shadow-[0_2px_8px_rgba(0,56,168,0.25)]"
                        : "border border-[#c5cdd8] bg-white text-slate-600 hover:border-[#0038a8] hover:text-[#0038a8]",
                    ].join(" ")}
                  >
                    {province}
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="animate-fade-up mt-6 grid grid-cols-2 gap-2.5 pb-6 [animation-delay:320ms] lg:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="rounded-[10px] border border-[#c5cdd8] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {kpi.label}
                    </p>
                    <Icon className="h-4 w-4 text-[#0038a8]" aria-hidden />
                  </div>
                  <p className="mt-2 truncate text-xl font-black tabular-nums text-[#0f172a] sm:text-2xl">
                    {kpi.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Map stage: full-bleed hero of the portal */}
      <section className="mt-4 w-full sm:mt-6">
        <div className="mx-auto max-w-[96rem] px-2 sm:px-4 lg:px-6">
          <div className="overflow-hidden rounded-[14px] border border-[#c5cdd8] bg-white shadow-[0_8px_24px_rgba(0,56,168,0.1),0_2px_8px_rgba(0,0,0,0.05)] ring-1 ring-[#0038a8]/10">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dce1e8] bg-[#f8fafc] px-3 py-3 sm:px-4">
              <div className="inline-flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-[#0038a8] text-white">
                  <HiMap className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Interactive Project Map
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Explore DOST projects across MIMAROPA
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex overflow-hidden rounded-[6px] border border-[#c5cdd8]">
                  {BASE_LAYERS.map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setBaseLayer(layer.id)}
                      className={[
                        "min-h-[36px] px-3 py-1.5 text-[12px] font-semibold transition duration-[180ms]",
                        baseLayer === layer.id
                          ? "bg-[#0038a8] text-white"
                          : "bg-white text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
                <div className="flex overflow-hidden rounded-[6px] border border-[#c5cdd8]">
                  <button
                    type="button"
                    onClick={() => setViewMode("2d")}
                    className={[
                      "inline-flex min-h-[36px] items-center gap-1 px-3 py-1.5 text-[12px] font-semibold transition duration-[180ms]",
                      viewMode === "2d"
                        ? "bg-[#0038a8] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <HiSquare3Stack3D className="h-3.5 w-3.5" aria-hidden />
                    2D
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className={[
                      "inline-flex min-h-[36px] items-center gap-1 px-3 py-1.5 text-[12px] font-semibold transition duration-[180ms]",
                      viewMode === "3d"
                        ? "bg-[#0038a8] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <HiCube className="h-3.5 w-3.5" aria-hidden />
                    3D
                  </button>
                </div>
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={locating}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-[6px] border border-[#c5cdd8] bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition duration-[180ms] hover:bg-slate-50 disabled:opacity-50"
                >
                  <HiMapPin className="h-3.5 w-3.5 text-[#0038a8]" aria-hidden />
                  {locating ? "Locating…" : "Near me"}
                </button>
              </div>
            </div>

            {/* Viewport-tall map canvas */}
            <div className="relative h-[min(72dvh,860px)] min-h-[420px] w-full sm:min-h-[520px] lg:h-[min(78dvh,960px)]">
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

            {legend.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#dce1e8] bg-[#f8fafc] px-3 py-2.5 sm:px-4">
                {legend.map(({ program, count }) => (
                  <span
                    key={program}
                    className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#0038a8]" />
                    <span className="font-medium text-slate-700">{program}</span>
                    <span className="text-slate-400">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results: compact scan list for many projects */}
      <section
        id="project-results"
        className="mx-auto mt-6 max-w-[96rem] px-2 pb-2 sm:mt-8 sm:px-4 lg:px-6"
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
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-[12px] text-slate-600">
                <span className="font-semibold">Sort</span>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="min-h-[36px] rounded-[6px] border border-[#c5cdd8] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 outline-none transition duration-[180ms] focus:border-[#0038a8] focus:ring-2 focus:ring-[#0038a8]/20"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={[
                  "shrink-0 rounded-[6px] px-3 py-1.5 text-[12px] font-bold transition duration-[180ms]",
                  statusFilter === "all"
                    ? "bg-[#0038a8] text-white"
                    : "border border-[#c5cdd8] bg-white text-slate-600 hover:border-[#0038a8] hover:text-[#0038a8]",
                ].join(" ")}
              >
                All status
              </button>
              {PROJECT_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={[
                    "shrink-0 rounded-[6px] px-3 py-1.5 text-[12px] font-bold transition duration-[180ms]",
                    statusFilter === status
                      ? "bg-[#0038a8] text-white"
                      : "border border-[#c5cdd8] bg-white text-slate-600 hover:border-[#0038a8] hover:text-[#0038a8]",
                  ].join(" ")}
                >
                  {STATUS_META[status].label}
                </button>
              ))}
            </div>
          </div>

          {sorted.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No projects match your search or filters.
            </p>
          ) : (
            <>
              {/* Desktop table */}
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
                            active
                              ? "bg-[#e8eef8]"
                              : "hover:bg-[#f4f7fb]",
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

              {/* Mobile compact rows */}
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
                          active ? "bg-[#e8eef8]" : "bg-white active:bg-slate-50",
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
                        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                          <span className="tabular-nums">
                            {formatPeso(project.budget)}
                          </span>
                        </div>
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
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-[6px] border border-[#c5cdd8] bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition duration-[180ms] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-[6px] border border-[#c5cdd8] bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition duration-[180ms] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* Footer */}
      <footer className="mt-14 border-t border-[#002d87] bg-[#0038a8]">
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
                    onClick={() => setProvinceFilter(province)}
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
              className="mt-3 h-44 w-full rounded-[10px] object-cover border border-[#dce1e8]"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
