import { useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiMagnifyingGlass,
  HiPrinter,
  HiXMark,
} from "react-icons/hi2";
import {
  IMPLEMENTOR,
  IMPRESSION_SECTORS,
  IMPRESSION_STATUSES,
  IMPRESSION_TYPES,
  MARINDUQUE_MUNICIPALITIES,
  MARINDUQUE_PROJECTS,
  PROVINCE_NAME,
  REGION_NAME,
  formatPeso,
  type ImpressionSector,
  type ImpressionStatus,
  type ImpressionType,
  type MarinduqueMunicipality,
} from "../../constants/marinduqueProjects";

const PAGE_SIZE = 10;

const STATUS_CLASS: Record<ImpressionStatus, string> = {
  "On-going": "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  New: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
  Graduated: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Completed: "bg-teal-500/15 text-teal-300 ring-teal-400/30",
  Terminated: "bg-red-500/15 text-red-300 ring-red-400/30",
  Withdrawn: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const YEARS = [
  ...new Set(MARINDUQUE_PROJECTS.map((p) => p.year)),
].sort((a, b) => b - a);

const selectClass =
  "w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25";

const PstoPrograms = () => {
  const [type, setType] = useState<ImpressionType | "all">("all");
  const [status, setStatus] = useState<ImpressionStatus | "all">("all");
  const [year, setYear] = useState<number | "all">("all");
  const [municipality, setMunicipality] = useState<
    MarinduqueMunicipality | "all"
  >("all");
  const [sector, setSector] = useState<ImpressionSector | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MARINDUQUE_PROJECTS.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (status !== "all" && p.status !== status) return false;
      if (year !== "all" && p.year !== year) return false;
      if (municipality !== "all" && p.municipality !== municipality)
        return false;
      if (sector !== "all" && p.sector !== sector) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.beneficiary.toLowerCase().includes(q) ||
        p.municipality.toLowerCase().includes(q)
      );
    });
  }, [type, status, year, municipality, sector, search]);

  const totalCost = useMemo(
    () => filtered.reduce((s, p) => s + p.cost, 0),
    [filtered],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const resetPage = () => setPage(1);

  const hasFilters =
    type !== "all" ||
    status !== "all" ||
    year !== "all" ||
    municipality !== "all" ||
    sector !== "all" ||
    search.trim().length > 0;

  const clearFilters = () => {
    setType("all");
    setStatus("all");
    setYear("all");
    setMunicipality("all");
    setSector("all");
    setSearch("");
    resetPage();
  };

  const handleDownload = () => {
    const cols = [
      "#",
      "Project",
      "Description",
      "Type",
      "Year Approved",
      "Beneficiary",
      "Sector",
      "Region",
      "Province",
      "Municipality",
      "Latitude",
      "Longitude",
      "Status",
      "Project Cost",
      "Implementor",
    ];
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((p, i) =>
      [
        i + 1,
        p.title,
        p.description,
        p.type,
        p.year,
        p.beneficiary,
        p.sector,
        REGION_NAME,
        PROVINCE_NAME,
        p.municipality,
        p.latitude,
        p.longitude,
        p.status,
        p.cost,
        p.implementor,
      ]
        .map(esc)
        .join(","),
    );
    const csv = [cols.join(","), ...rows].join("\r\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marinduque-projects-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950/30 to-slate-950 px-4 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
              PSTO Marinduque · Impression
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Project Search
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {REGION_NAME} · Province of {PROVINCE_NAME} — Information &amp;
              Monitoring of Projects, Services and S&amp;T Interventions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              <HiPrinter className="h-4 w-4" aria-hidden />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
            >
              <HiArrowDownTray className="h-4 w-4" aria-hidden />
              Download
            </button>
          </div>
        </header>

        <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 backdrop-blur">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Project Type
              </span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as ImpressionType | "all");
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All</option>
                {IMPRESSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ImpressionStatus | "all");
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All</option>
                {IMPRESSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Year Approved
              </span>
              <select
                value={year}
                onChange={(e) => {
                  setYear(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  );
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Municipality
              </span>
              <select
                value={municipality}
                onChange={(e) => {
                  setMunicipality(
                    e.target.value as MarinduqueMunicipality | "all",
                  );
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All</option>
                {MARINDUQUE_MUNICIPALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Sector
              </span>
              <select
                value={sector}
                onChange={(e) => {
                  setSector(e.target.value as ImpressionSector | "all");
                  resetPage();
                }}
                className={selectClass}
              >
                <option value="all">All</option>
                {IMPRESSION_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Search
              </span>
              <div className="relative">
                <HiMagnifyingGlass
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPage();
                  }}
                  placeholder="Project, beneficiary, municipality…"
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
                />
              </div>
            </label>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              <HiXMark className="h-3.5 w-3.5" aria-hidden />
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            Total No. of Records :{" "}
            <span className="font-bold text-emerald-300">
              {filtered.length}
            </span>
          </p>
          <p className="text-sm text-slate-400">
            Total Project Cost :{" "}
            <span className="font-bold text-emerald-300">
              {formatPeso(totalCost)}
            </span>
          </p>
        </div>

        <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-left uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5 font-bold">#</th>
                <th className="px-3 py-2.5 font-bold">Project</th>
                <th className="px-3 py-2.5 font-bold">Type</th>
                <th className="px-3 py-2.5 font-bold">Year</th>
                <th className="px-3 py-2.5 font-bold">Beneficiary</th>
                <th className="px-3 py-2.5 font-bold">Sector</th>
                <th className="px-3 py-2.5 font-bold">Municipality</th>
                <th className="px-3 py-2.5 font-bold">Coordinates</th>
                <th className="px-3 py-2.5 font-bold">Status</th>
                <th className="px-3 py-2.5 text-right font-bold">Project Cost</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No records match the current filters.
                  </td>
                </tr>
              ) : null}
              {pageItems.map((p, idx) => (
                <tr
                  key={p.code}
                  className="border-t border-slate-800/60 align-top transition hover:bg-slate-800/40"
                >
                  <td className="px-3 py-2.5 text-slate-500">
                    {(safePage - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="max-w-[360px] px-3 py-2.5">
                    <p className="font-medium text-white">{p.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                      {p.description}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400">{p.type}</td>
                  <td className="px-3 py-2.5 text-slate-400">{p.year}</td>
                  <td className="max-w-[200px] px-3 py-2.5 text-slate-400">
                    {p.beneficiary}
                  </td>
                  <td className="max-w-[160px] px-3 py-2.5 text-slate-400">
                    {p.sector}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate-300">
                    {p.municipality}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-slate-400">
                    {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_CLASS[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-cyan-200">
                    {formatPeso(p.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Page {safePage} of {pageCount}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((v) => Math.max(1, v - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-emerald-500/50 disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={[
                  "min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-bold transition",
                  n === safePage
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-slate-700/80 text-slate-400 hover:border-emerald-500/50",
                ].join(" ")}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((v) => Math.min(pageCount, v + 1))}
              disabled={safePage >= pageCount}
              className="rounded-lg border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-emerald-500/50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          Implementor: {IMPLEMENTOR} · Powered by DOST-MIMAROPA · Presentation
          build
        </p>
      </div>
    </section>
  );
};

export default PstoPrograms;
