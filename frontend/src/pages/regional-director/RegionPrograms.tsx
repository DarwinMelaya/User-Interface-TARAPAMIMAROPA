import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiBanknotes,
  HiChartBar,
  HiChartPie,
  HiClipboardDocumentList,
  HiMapPin,
  HiPresentationChartLine,
  HiSquares2X2,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";
import ProgramsGraphs from "../../components/graphs/ProgramsGraphs";
import {
  MOCK_TARA_PROJECTS,
  PROGRAM_META,
  PROVINCES,
  STATUS_META,
  TARA_TYPES,
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

const emptyStatusCounts = (): Record<ProjectStatus, number> => ({
  planning: 0,
  ongoing: 0,
  completed: 0,
  delayed: 0,
  on_hold: 0,
  cancelled: 0,
});

const RegionPrograms = () => {
  const [projects] = useState<TaraProject[]>(MOCK_TARA_PROJECTS);
  const [provinceFilter, setProvinceFilter] = useState<Province | "all">("all");
  const [viewing, setViewing] = useState<TaraProject | null>(null);
  const [graphsOpen, setGraphsOpen] = useState(false);

  const scopedProjects = useMemo(
    () =>
      provinceFilter === "all"
        ? projects
        : projects.filter((p) => p.province === provinceFilter),
    [projects, provinceFilter],
  );

  const stats = useMemo(
    () => summarizeProjects(scopedProjects),
    [scopedProjects],
  );

  const totalCost = useMemo(
    () => scopedProjects.reduce((s, p) => s + p.budget, 0),
    [scopedProjects],
  );

  // Graph 1 — projects per PSTO (province). Always all provinces so the
  // Director can compare offices at a glance; a bar can be clicked to focus.
  const byProvince = useMemo(() => {
    const rows = PROVINCES.map((province) => {
      const items = projects.filter((p) => p.province === province);
      return {
        province,
        count: items.length,
        budget: items.reduce((s, p) => s + p.budget, 0),
      };
    });
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [projects]);

  // Graph 2 — projects by status (respects the selected province).
  const byStatus = useMemo(() => {
    const counts = emptyStatusCounts();
    scopedProjects.forEach((p) => {
      counts[p.status] += 1;
    });
    const rows = (Object.keys(counts) as ProjectStatus[])
      .map((status) => ({ status, count: counts[status] }))
      .filter((r) => r.count > 0);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [scopedProjects]);

  // Graph 3 — projects by TYPE (respects the selected province).
  const byType = useMemo(() => {
    const rows = TARA_TYPES.map((type) => {
      const items = scopedProjects.filter((p) => projectType(p) === type);
      return {
        type,
        count: items.length,
        budget: items.reduce((s, p) => s + p.budget, 0),
      };
    }).filter((r) => r.count > 0);
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [scopedProjects]);

  const utilizationPct = stats.funding
    ? Math.round((stats.utilized / stats.funding) * 100)
    : 0;

  const kpis = [
    {
      label: "Project types",
      value: String(byType.rows.length),
      icon: HiClipboardDocumentList,
    },
    {
      label: "Projects",
      value: String(stats.total),
      icon: HiSquares2X2,
    },
    {
      label: "Funding released",
      value: formatPeso(stats.funding),
      icon: HiBanknotes,
    },
    {
      label: "Utilization",
      value: `${utilizationPct}%`,
      icon: HiChartPie,
    },
    {
      label: "Beneficiaries",
      value: formatCompact(stats.beneficiaries),
      icon: HiUserGroup,
    },
  ];

  const scopeLabel = provinceFilter === "all" ? "MIMAROPA" : provinceFilter;

  return (
    <section className="min-h-screen bg-slate-950 px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom))] text-slate-200 sm:px-6 sm:py-7 lg:pb-7">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Projects Overview
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
              All projects per PSTO across MIMAROPA. Select a province to focus
              the graphs and list below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGraphsOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition duration-[180ms] hover:bg-blue-500"
            >
              <HiPresentationChartLine className="h-4 w-4" aria-hidden />
              Summary graphs
            </button>
            <Link
              to="/regional-director/dashboard"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition duration-[180ms] hover:border-slate-600 hover:bg-slate-900 hover:text-white"
            >
              <HiMapPin className="h-4 w-4" aria-hidden />
              Command map
            </Link>
          </div>
        </header>

        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <HiMapPin className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <button
            type="button"
            onClick={() => setProvinceFilter("all")}
            className={[
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition duration-[180ms]",
              provinceFilter === "all"
                ? "bg-blue-600 text-white"
                : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200",
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
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition duration-[180ms]",
                  provinceFilter === province
                    ? "bg-blue-600 text-white"
                    : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200",
                ].join(" ")}
              >
                {province}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500">
                    {kpi.label}
                  </p>
                  <Icon
                    className="h-4 w-4 shrink-0 text-slate-500"
                    aria-hidden
                  />
                </div>
                <p className="mt-1.5 truncate text-lg font-semibold tabular-nums text-white sm:text-xl">
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2">
            <HiChartBar className="h-4 w-4 text-slate-500" aria-hidden />
            <h2 className="text-sm font-semibold text-white">Graphs</h2>
          </div>

          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">
                Projects per PSTO
              </p>
              <span className="text-xs text-slate-500">Tap a bar to focus</span>
            </div>
            <div className="space-y-2">
              {byProvince.rows.map((row) => {
                const active = provinceFilter === row.province;
                const pct = Math.round((row.count / byProvince.max) * 100);
                return (
                  <button
                    key={row.province}
                    type="button"
                    onClick={() =>
                      setProvinceFilter(active ? "all" : row.province)
                    }
                    className={[
                      "w-full rounded-lg border p-2.5 text-left transition duration-[180ms]",
                      active
                        ? "border-blue-500/50 bg-blue-600/10"
                        : "border-transparent hover:bg-slate-800/50",
                    ].join(" ")}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-200">
                        {row.province}
                      </span>
                      <span className="shrink-0 text-slate-500">
                        <span className="font-semibold text-slate-200">
                          {row.count}
                        </span>{" "}
                        · {formatCompact(row.budget)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-[width] duration-[320ms]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="mb-3 text-sm font-medium text-white">
                By status
                {provinceFilter === "all" ? "" : ` · ${provinceFilter}`}
              </p>
              <div className="space-y-2.5">
                {byStatus.rows.length === 0 ? (
                  <p className="text-xs text-slate-500">No projects.</p>
                ) : null}
                {byStatus.rows.map((row) => {
                  const meta = STATUS_META[row.status];
                  const pct = Math.round((row.count / byStatus.max) * 100);
                  return (
                    <div key={row.status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500/80"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="mb-3 text-sm font-medium text-white">
                By type
                {provinceFilter === "all" ? "" : ` · ${provinceFilter}`}
              </p>
              <div className="space-y-2.5">
                {byType.rows.length === 0 ? (
                  <p className="text-xs text-slate-500">No projects.</p>
                ) : null}
                {byType.rows.map((row) => {
                  const pct = Math.round((row.count / byType.max) * 100);
                  return (
                    <div key={row.type}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate font-medium text-slate-300">
                          {row.type}
                        </span>
                        <span className="shrink-0 text-slate-500">
                          <span className="font-semibold text-slate-200">
                            {row.count}
                          </span>{" "}
                          · {formatCompact(row.budget)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500/80"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <HiClipboardDocumentList
                  className="h-4 w-4 text-slate-500"
                  aria-hidden
                />
                <h2 className="text-sm font-semibold text-white">
                  Projects in {scopeLabel}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {scopedProjects.length} records · {formatPeso(totalCost)} total
                cost
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500">
                  <th className="px-3 py-3 font-medium">#</th>
                  <th className="px-3 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Year</th>
                  <th className="px-3 py-3 font-medium">Beneficiary</th>
                  <th className="px-3 py-3 font-medium">Sector</th>
                  <th className="px-3 py-3 font-medium">Municipality</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 text-right font-medium">
                    Project cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {scopedProjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No projects in this province yet.
                    </td>
                  </tr>
                ) : null}
                {scopedProjects.map((project, idx) => {
                  const status = STATUS_META[project.status];
                  return (
                    <tr
                      key={project.id}
                      onClick={() => setViewing(project)}
                      className="cursor-pointer border-b border-slate-800/80 align-top transition duration-[180ms] last:border-b-0 hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                      <td className="max-w-[360px] px-3 py-3">
                        <p className="font-medium text-white">{project.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {project.description}
                        </p>
                      </td>
                      <td className="max-w-[160px] px-3 py-3 text-slate-400">
                        {projectType(project)}
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {projectYear(project)}
                      </td>
                      <td className="max-w-[200px] px-3 py-3 text-slate-400">
                        {project.beneficiary}
                      </td>
                      <td className="max-w-[160px] px-3 py-3 text-slate-400">
                        {project.sector}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-300">
                        {project.municipality}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums text-slate-200">
                        {formatPeso(project.budget)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {graphsOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/70 p-0 sm:p-4"
          onClick={() => setGraphsOpen(false)}
        >
          <div
            className="max-h-[100vh] w-full max-w-5xl overflow-y-auto rounded-none border border-slate-800 bg-slate-950 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:max-h-[92vh] sm:rounded-xl sm:p-6 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Project summaries
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                  Summary graphs · {scopeLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGraphsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition duration-[180ms] hover:bg-slate-900 hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <ProgramsGraphs
              projects={scopedProjects}
              scope={
                provinceFilter === "all"
                  ? "MIMAROPA (all provinces)"
                  : provinceFilter
              }
            />

            <p className="mt-4 text-center text-xs text-slate-600">
              Information &amp; Monitoring of Projects, Services and S&amp;T
              Interventions · DOST-MIMAROPA
            </p>
          </div>
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-slate-800 bg-slate-900 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:rounded-xl [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  {PROGRAM_META[viewing.program].short} · {viewing.province}
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug text-white">
                  {viewing.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition duration-[180ms] hover:bg-slate-800 hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <img
              src={viewing.photo_url || projectImage(viewing.id)}
              alt={viewing.name}
              loading="lazy"
              className="mt-4 h-44 w-full rounded-lg object-cover border border-slate-800"
            />

            <p className="mt-4 text-xs font-medium text-slate-500">
              Project description
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {describeProject(viewing)}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Type</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {viewing.program}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Year</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {projectYear(viewing)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Beneficiary</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {viewing.beneficiary}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Sector</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {viewing.sector}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Municipality</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {viewing.municipality}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {STATUS_META[viewing.status].label}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Project cost</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">
                  {formatPeso(viewing.budget)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
};

export default RegionPrograms;
