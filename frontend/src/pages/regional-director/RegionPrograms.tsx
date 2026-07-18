import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiBanknotes,
  HiChartBar,
  HiChartPie,
  HiClipboardDocumentList,
  HiMapPin,
  HiSquares2X2,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";
import {
  MOCK_TARA_PROJECTS,
  PROGRAMS,
  PROGRAM_META,
  PROVINCES,
  STATUS_META,
  describeProject,
  formatCompact,
  formatPeso,
  projectImage,
  projectYear,
  summarizeProjects,
  type ProjectStatus,
  type Province,
  type TaraProgram,
  type TaraProject,
} from "../../constants/taraProjects";

const utilizedOf = (p: TaraProject) => Math.round((p.budget * p.progress) / 100);

type ProgramAggregate = {
  program: TaraProgram;
  count: number;
  budget: number;
  utilized: number;
  beneficiaries: number;
  avgProgress: number;
  atRisk: number;
  statusCounts: Record<ProjectStatus, number>;
};

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

  const programAggregates = useMemo<ProgramAggregate[]>(() => {
    return PROGRAMS.map((program) => {
      const items = scopedProjects.filter((p) => p.program === program);
      const budget = items.reduce((s, p) => s + p.budget, 0);
      const utilized = items.reduce((s, p) => s + utilizedOf(p), 0);
      const beneficiaries = items.reduce((s, p) => s + p.beneficiaries, 0);
      const avgProgress = items.length
        ? Math.round(items.reduce((s, p) => s + p.progress, 0) / items.length)
        : 0;
      const statusCounts = emptyStatusCounts();
      items.forEach((p) => {
        statusCounts[p.status] += 1;
      });
      const atRisk = statusCounts.delayed + statusCounts.on_hold;
      return {
        program,
        count: items.length,
        budget,
        utilized,
        beneficiaries,
        avgProgress,
        atRisk,
        statusCounts,
      };
    })
      .filter((a) => a.count > 0)
      .sort((a, b) => b.budget - a.budget);
  }, [scopedProjects]);

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

  // Graph 3 — projects by program (respects the selected province).
  const byProgram = useMemo(() => {
    const rows = programAggregates.map((a) => ({
      program: a.program,
      count: a.count,
      budget: a.budget,
    }));
    const max = Math.max(1, ...rows.map((r) => r.count));
    return { rows, max };
  }, [programAggregates]);

  const utilizationPct = stats.funding
    ? Math.round((stats.utilized / stats.funding) * 100)
    : 0;

  const kpis = [
    {
      label: "Active programs",
      value: String(programAggregates.length),
      icon: HiClipboardDocumentList,
      accent: "text-cyan-200",
    },
    {
      label: "Projects region-wide",
      value: String(stats.total),
      icon: HiSquares2X2,
      accent: "text-blue-200",
    },
    {
      label: "Funding released",
      value: formatPeso(stats.funding),
      icon: HiBanknotes,
      accent: "text-yellow-200",
    },
    {
      label: "Utilization",
      value: `${utilizationPct}%`,
      icon: HiChartPie,
      accent: "text-teal-200",
    },
    {
      label: "Beneficiaries",
      value: formatCompact(stats.beneficiaries),
      icon: HiUserGroup,
      accent: "text-violet-200",
    },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 px-4 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">
              <HiChartPie className="h-3.5 w-3.5" aria-hidden />
              Regional Director · Portfolio
            </p>
            <h1 className="mt-2 bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              Projects Overview
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              All projects per PSTO (province) across MIMAROPA. Tap a province
              or a bar to focus, then scroll to the project list below.
            </p>
          </div>
          <Link
            to="/regional-director/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
          >
            <HiMapPin className="h-4 w-4" aria-hidden />
            Command map
          </Link>
        </header>

        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <HiMapPin
            className="h-4 w-4 shrink-0 text-blue-300"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => setProvinceFilter("all")}
            className={[
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
              provinceFilter === "all"
                ? "bg-cyan-400 text-slate-950"
                : "border border-slate-700 text-slate-300 hover:border-cyan-500/50",
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
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                  provinceFilter === province
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-slate-700 text-slate-300 hover:border-cyan-500/50",
                ].join(" ")}
              >
                {province}
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3.5 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {kpi.label}
                  </p>
                  <Icon className="h-4 w-4 text-slate-500" aria-hidden />
                </div>
                <p
                  className={`mt-1.5 truncate text-lg font-bold tabular-nums sm:text-xl ${kpi.accent}`}
                >
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-2">
          <HiChartBar className="h-5 w-5 text-cyan-300" aria-hidden />
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">
            Graphs
          </h2>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              Projects per PSTO (province)
            </p>
            <span className="text-[11px] text-slate-500">Tap a bar to focus</span>
          </div>
          <div className="space-y-2.5">
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
                    "w-full rounded-xl border p-2 text-left transition",
                    active
                      ? "border-cyan-400/50 bg-cyan-500/10"
                      : "border-transparent hover:bg-slate-800/40",
                  ].join(" ")}
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {row.province}
                    </span>
                    <span className="text-slate-400">
                      <span className="font-bold text-cyan-200">
                        {row.count}
                      </span>{" "}
                      projects · {formatCompact(row.budget)}
                    </span>
                  </div>
                  <div className="h-3.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 backdrop-blur">
            <p className="mb-3 text-sm font-semibold text-white">
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
                      <span className="font-bold text-slate-200">
                        {row.count}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 backdrop-blur">
            <p className="mb-3 text-sm font-semibold text-white">
              By program
              {provinceFilter === "all" ? "" : ` · ${provinceFilter}`}
            </p>
            <div className="space-y-2.5">
              {byProgram.rows.length === 0 ? (
                <p className="text-xs text-slate-500">No projects.</p>
              ) : null}
              {byProgram.rows.map((row) => {
                const meta = PROGRAM_META[row.program];
                const pct = Math.round((row.count / byProgram.max) * 100);
                return (
                  <div key={row.program}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${meta.accent}`}>
                        {row.program}
                      </span>
                      <span className="text-slate-400">
                        <span className="font-bold text-slate-200">
                          {row.count}
                        </span>{" "}
                        · {formatCompact(row.budget)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <HiClipboardDocumentList className="h-5 w-5 text-cyan-300" aria-hidden />
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-300">
            Projects in{" "}
            {provinceFilter === "all" ? "MIMAROPA" : provinceFilter}
          </h2>
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
            {scopedProjects.length}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            Total No. of Records :{" "}
            <span className="font-bold text-cyan-300">
              {scopedProjects.length}
            </span>
          </p>
          <p className="text-sm text-slate-400">
            Total Project Cost :{" "}
            <span className="font-bold text-cyan-300">
              {formatPeso(scopedProjects.reduce((s, p) => s + p.budget, 0))}
            </span>
          </p>
        </div>

        <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[820px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-left uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-bold">#</th>
                <th className="px-3 py-2.5 font-bold">Project</th>
                <th className="px-3 py-2.5 font-bold">Type</th>
                <th className="px-3 py-2.5 font-bold">Year</th>
                <th className="px-3 py-2.5 font-bold">Beneficiary</th>
                <th className="px-3 py-2.5 font-bold">Sector</th>
                <th className="px-3 py-2.5 font-bold">Municipality</th>
                <th className="px-3 py-2.5 font-bold">Status</th>
                <th className="px-3 py-2.5 text-right font-bold">Project Cost</th>
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
                    className="cursor-pointer border-t border-slate-800/60 align-top transition hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                    <td className="max-w-[360px] px-3 py-2.5">
                      <p className="font-medium text-white">{project.name}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        {project.description}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      {project.program}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      {projectYear(project)}
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5 text-slate-400">
                      {project.beneficiary}
                    </td>
                    <td className="max-w-[160px] px-3 py-2.5 text-slate-400">
                      {project.sector}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-300">
                      {project.municipality}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-cyan-200">
                      {formatPeso(project.budget)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-cyan-800/50 bg-slate-900 p-5 shadow-2xl sm:rounded-3xl [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300/80">
                  {PROGRAM_META[viewing.program].short} · {viewing.province}
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug text-white">
                  {viewing.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <img
              src={viewing.photo_url || projectImage(viewing.id)}
              alt={viewing.name}
              loading="lazy"
              className="mt-3 h-44 w-full rounded-xl object-cover ring-1 ring-slate-700/60"
            />

            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300/70">
              Project description
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              {describeProject(viewing)}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Type
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {viewing.program}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Year
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {projectYear(viewing)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Beneficiary
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {viewing.beneficiary}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Sector
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {viewing.sector}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Municipality
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {viewing.municipality}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Status
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {STATUS_META[viewing.status].label}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Project Cost
                </dt>
                <dd className="mt-0.5 font-bold text-cyan-300">
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
