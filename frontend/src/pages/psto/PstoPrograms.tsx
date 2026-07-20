import { useMemo, useRef, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTopRightOnSquare,
  HiArrowUpTray,
  HiMagnifyingGlass,
  HiPaperAirplane,
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
  MUNICIPALITY_COORDS,
  PROVINCE_NAME,
  REGION_NAME,
  formatPeso,
  type ImpressionProject,
  type ImpressionSector,
  type ImpressionStatus,
  type ImpressionType,
  type MarinduqueMunicipality,
} from "../../constants/marinduqueProjects";

const PAGE_SIZE = 10;

const projectImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/320`;

const openGoogleDirections = (p: ImpressionProject) => {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${p.latitude},${p.longitude}`);
  url.searchParams.set("travelmode", "driving");
  window.open(url.toString(), "_blank", "noopener,noreferrer");
};

const STATUS_CLASS: Record<ImpressionStatus, string> = {
  "On-going": "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  New: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
  Graduated: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  Completed: "bg-teal-500/15 text-teal-300 ring-teal-400/30",
  Terminated: "bg-red-500/15 text-red-300 ring-red-400/30",
  Withdrawn: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const selectClass =
  "w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25";

type ImportFeedback = {
  kind: "success" | "error";
  message: string;
};

/** Split one CSV line; respect quoted fields and `""` escapes. */
const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
};

const normalizeHeader = (h: string) =>
  h
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

const HEADER_ALIASES: Record<string, string> = {
  "#": "index",
  project: "title",
  title: "title",
  description: "description",
  type: "type",
  "year approved": "year",
  year: "year",
  beneficiary: "beneficiary",
  sector: "sector",
  region: "region",
  province: "province",
  municipality: "municipality",
  latitude: "latitude",
  longitude: "longitude",
  status: "status",
  "project cost": "cost",
  cost: "cost",
  implementor: "implementor",
  code: "code",
  "project code": "code",
};

const parseCost = (raw: string): number | null => {
  const cleaned = raw.replace(/php/gi, "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const isType = (v: string): v is ImpressionType =>
  (IMPRESSION_TYPES as string[]).includes(v);
const isStatus = (v: string): v is ImpressionStatus =>
  (IMPRESSION_STATUSES as string[]).includes(v);
const isSector = (v: string): v is ImpressionSector =>
  (IMPRESSION_SECTORS as string[]).includes(v);
const isMunicipality = (v: string): v is MarinduqueMunicipality =>
  (MARINDUQUE_MUNICIPALITIES as string[]).includes(v);

type ParseImportResult = {
  projects: ImpressionProject[];
  errors: string[];
};

const parseProjectsCsv = (text: string): ParseImportResult => {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      projects: [],
      errors: ["CSV needs a header row and at least one data row."],
    };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const keys = rawHeaders.map((h) => {
    const norm = normalizeHeader(h);
    return HEADER_ALIASES[norm] ?? HEADER_ALIASES[h.trim().toLowerCase()] ?? "";
  });

  const required = ["title", "type", "year", "municipality", "status", "cost"];
  const missing = required.filter((r) => !keys.includes(r));
  if (missing.length > 0) {
    return {
      projects: [],
      errors: [
        `Missing required columns: ${missing.join(", ")}. Use Download CSV as template.`,
      ],
    };
  }

  const projects: ImpressionProject[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    keys.forEach((key, idx) => {
      if (!key) return;
      row[key] = (cells[idx] ?? "").trim();
    });

    const rowLabel = `Row ${i + 1}`;
    const title = row.title;
    if (!title) {
      errors.push(`${rowLabel}: Project title is required.`);
      continue;
    }

    const typeVal = row.type;
    if (!isType(typeVal)) {
      errors.push(`${rowLabel}: Invalid Type "${typeVal}".`);
      continue;
    }

    const yearNum = Number(row.year);
    if (!Number.isFinite(yearNum) || yearNum < 1990 || yearNum > 2100) {
      errors.push(`${rowLabel}: Invalid Year "${row.year}".`);
      continue;
    }

    const muni = row.municipality;
    if (!isMunicipality(muni)) {
      errors.push(`${rowLabel}: Invalid Municipality "${muni}".`);
      continue;
    }

    const statusVal = row.status;
    if (!isStatus(statusVal)) {
      errors.push(`${rowLabel}: Invalid Status "${statusVal}".`);
      continue;
    }

    const cost = parseCost(row.cost ?? "");
    if (cost === null || cost < 0) {
      errors.push(`${rowLabel}: Invalid Project Cost "${row.cost}".`);
      continue;
    }

    const sectorVal = row.sector || "Other Regional Industry Priorities";
    if (!isSector(sectorVal)) {
      errors.push(`${rowLabel}: Invalid Sector "${sectorVal}".`);
      continue;
    }

    const coords = MUNICIPALITY_COORDS[muni];
    const lat = Number(row.latitude);
    const lng = Number(row.longitude);
    const latitude = Number.isFinite(lat) ? lat : coords.lat;
    const longitude = Number.isFinite(lng) ? lng : coords.lng;

    const code =
      row.code ||
      `IMP-${yearNum}-${muni.slice(0, 3).toUpperCase()}-${String(i).padStart(3, "0")}`;

    projects.push({
      code,
      title,
      description: row.description || title,
      type: typeVal,
      year: yearNum,
      beneficiary: row.beneficiary || "N/A",
      sector: sectorVal,
      municipality: muni,
      status: statusVal,
      cost,
      implementor: row.implementor || IMPLEMENTOR,
      latitude,
      longitude,
    });
  }

  return { projects, errors };
};

const mergeImportedProjects = (
  current: ImpressionProject[],
  incoming: ImpressionProject[],
) => {
  const map = new Map(current.map((p) => [p.code, p]));
  let added = 0;
  let updated = 0;
  for (const p of incoming) {
    if (map.has(p.code)) updated += 1;
    else added += 1;
    map.set(p.code, p);
  }
  return { next: [...map.values()], added, updated };
};

const PstoPrograms = () => {
  const [projects, setProjects] = useState<ImpressionProject[]>(
    () => MARINDUQUE_PROJECTS,
  );
  const [type, setType] = useState<ImpressionType | "all">("all");
  const [status, setStatus] = useState<ImpressionStatus | "all">("all");
  const [year, setYear] = useState<number | "all">("all");
  const [municipality, setMunicipality] = useState<
    MarinduqueMunicipality | "all"
  >("all");
  const [sector, setSector] = useState<ImpressionSector | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<ImpressionProject | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const years = useMemo(
    () => [...new Set(projects.map((p) => p.year))].sort((a, b) => b - a),
    [projects],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
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
        p.municipality.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
      );
    });
  }, [projects, type, status, year, municipality, sector, search]);

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
      "Code",
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
        p.code,
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

  const handleImportFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setImportFeedback({
        kind: "error",
        message: "Please choose a .csv file (same columns as Download).",
      });
      return;
    }

    setImporting(true);
    setImportFeedback(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const { projects: incoming, errors } = parseProjectsCsv(text);

        if (incoming.length === 0) {
          setImportFeedback({
            kind: "error",
            message:
              errors[0] ??
              "No valid rows found. Download CSV first and use it as template.",
          });
          return;
        }

        const { next, added, updated } = mergeImportedProjects(
          projects,
          incoming,
        );
        setProjects(next);
        resetPage();

        const skipNote =
          errors.length > 0
            ? ` ${errors.length} row${errors.length === 1 ? "" : "s"} skipped.`
            : "";
        setImportFeedback({
          kind: "success",
          message: `Imported ${incoming.length}: ${added} new, ${updated} updated.${skipNote}`,
        });
      } catch {
        setImportFeedback({
          kind: "error",
          message: "Could not read that CSV. Check encoding and try again.",
        });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setImporting(false);
      setImportFeedback({
        kind: "error",
        message: "File read failed. Try another CSV.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
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
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Import projects CSV"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition duration-[180ms] hover:border-slate-500"
            >
              <HiPrinter className="h-4 w-4" aria-hidden />
              Print
            </button>
            <button
              type="button"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2.5 text-sm font-semibold text-sky-100 transition duration-[180ms] hover:bg-sky-500/25 disabled:opacity-50"
            >
              <HiArrowUpTray className="h-4 w-4" aria-hidden />
              {importing ? "Importing…" : "Import CSV"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition duration-[180ms] hover:bg-emerald-500/25"
            >
              <HiArrowDownTray className="h-4 w-4" aria-hidden />
              Download
            </button>
          </div>
        </header>

        {importFeedback ? (
          <div
            role="status"
            className={[
              "mt-4 flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm",
              importFeedback.kind === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/40 bg-red-500/10 text-red-200",
            ].join(" ")}
          >
            <p className="min-w-0 leading-relaxed">{importFeedback.message}</p>
            <button
              type="button"
              onClick={() => setImportFeedback(null)}
              className="shrink-0 rounded-lg p-1.5 opacity-70 transition duration-[180ms] hover:opacity-100"
              aria-label="Dismiss"
            >
              <HiXMark className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}

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
                {years.map((y) => (
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
                  onClick={() => setViewing(p)}
                  className="cursor-pointer border-t border-slate-800/60 align-top transition hover:bg-slate-800/40"
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

      {viewing && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-slate-700/70 bg-slate-900 p-5 shadow-2xl sm:rounded-3xl [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/30">
                  {viewing.type}
                </span>
                <h2 className="mt-2 text-lg font-bold leading-snug text-white">
                  {viewing.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" />
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

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Status
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {viewing.status}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Year
                </dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {viewing.year}
                </dd>
              </div>
              <div>
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
                  Project cost
                </dt>
                <dd className="mt-0.5 font-bold text-emerald-300">
                  {formatPeso(viewing.cost)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  Coordinates
                </dt>
                <dd className="mt-0.5 font-mono text-xs text-slate-300">
                  {viewing.latitude.toFixed(5)}, {viewing.longitude.toFixed(5)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => openGoogleDirections(viewing)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              <HiPaperAirplane className="h-4 w-4" />
              Get directions
              <HiArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PstoPrograms;
