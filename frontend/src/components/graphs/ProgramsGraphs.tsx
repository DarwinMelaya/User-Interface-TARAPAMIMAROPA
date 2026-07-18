import { useMemo } from "react";
import {
  PROVINCES,
  PROJECT_STATUSES,
  SECTORS,
  STATUS_META,
  TARA_TYPES,
  formatCompact,
  formatPeso,
  projectType,
  projectYear,
  type TaraProject,
} from "../../constants/taraProjects";

type Row = { label: string; value: number };

const PALETTE = [
  "#22d3ee",
  "#34d399",
  "#a78bfa",
  "#fbbf24",
  "#f472b6",
  "#38bdf8",
  "#a3e635",
  "#e879f9",
  "#fb923c",
  "#2dd4bf",
];

const Card = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 backdrop-blur">
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <p className="text-sm font-semibold text-white">{title}</p>
      {subtitle ? (
        <span className="text-[11px] text-slate-500">{subtitle}</span>
      ) : null}
    </div>
    {children}
  </div>
);

/* ── Donut chart ────────────────────────────────────────────────── */
const DonutChart = ({
  rows,
  format = (n: number) => String(n),
}: {
  rows: Row[];
  format?: (n: number) => string;
}) => {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#1e293b"
          strokeWidth="16"
        />
        {rows.map((row, i) => {
          const frac = total ? row.value / total : 0;
          const dash = frac * c;
          const seg = (
            <circle
              key={row.label}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return seg;
        })}
        <text
          x="60"
          y="58"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="#e2e8f0"
          transform="rotate(90 60 60)"
        >
          {format(total)}
        </text>
        <text
          x="60"
          y="74"
          textAnchor="middle"
          fontSize="8"
          fill="#64748b"
          transform="rotate(90 60 60)"
        >
          TOTAL
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {rows.map((row, i) => {
          const pct = total ? Math.round((row.value / total) * 100) : 0;
          return (
            <li
              key={row.label}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <span className="truncate text-slate-300">{row.label}</span>
              </span>
              <span className="shrink-0 text-slate-400">
                <span className="font-bold text-slate-100">
                  {format(row.value)}
                </span>{" "}
                <span className="text-slate-500">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/* ── Vertical column chart ──────────────────────────────────────── */
const ColumnChart = ({
  rows,
  format = (n: number) => String(n),
}: {
  rows: Row[];
  format?: (n: number) => string;
}) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex h-52 items-end gap-2 sm:gap-3">
      {rows.map((row, i) => {
        const pct = Math.round((row.value / max) * 100);
        return (
          <div
            key={row.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span className="text-[11px] font-bold tabular-nums text-slate-200">
              {format(row.value)}
            </span>
            <div className="flex h-36 w-full items-end justify-center">
              <div
                className="w-full max-w-[46px] rounded-t-lg transition-all"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(to top, ${
                    PALETTE[i % PALETTE.length]
                  }33, ${PALETTE[i % PALETTE.length]})`,
                }}
              />
            </div>
            <span className="line-clamp-2 text-center text-[10px] leading-tight text-slate-400">
              {row.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Area / line chart ──────────────────────────────────────────── */
const AreaLineChart = ({ rows }: { rows: Row[] }) => {
  const W = 320;
  const H = 150;
  const pad = 26;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const n = rows.length;
  const x = (i: number) =>
    n <= 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1);
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad);
  const pts = rows.map((r, i) => [x(i), y(r.value)] as const);
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`)
    .join(" ");
  const area =
    n > 0 ? `${line} L${x(n - 1)},${H - pad} L${x(0)},${H - pad} Z` : "";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={W - pad}
            y1={H - pad - g * (H - 2 * pad)}
            y2={H - pad - g * (H - 2 * pad)}
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}
        {area ? <path d={area} fill="url(#areaFill)" /> : null}
        {line ? (
          <path
            d={line}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {pts.map((p, i) => (
          <g key={rows[i].label}>
            <circle cx={p[0]} cy={p[1]} r="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="2.5" />
            <text
              x={p[0]}
              y={p[1] - 9}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#e2e8f0"
            >
              {rows[i].value}
            </text>
            <text
              x={p[0]}
              y={H - pad + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
            >
              {rows[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ── Horizontal bars ────────────────────────────────────────────── */
const BarChart = ({
  rows,
  format = (n: number) => String(n),
  badges,
}: {
  rows: Row[];
  format?: (n: number) => string;
  badges?: string[];
}) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">No data.</p>
      ) : null}
      {rows.map((row, i) => {
        const pct = Math.round((row.value / max) * 100);
        return (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              {badges?.[i] ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badges[i]}`}
                >
                  {row.label}
                </span>
              ) : (
                <span className="truncate font-semibold text-slate-200">
                  {row.label}
                </span>
              )}
              <span className="shrink-0 font-bold text-slate-100">
                {format(row.value)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(to right, ${
                    PALETTE[i % PALETTE.length]
                  }, ${PALETTE[(i + 3) % PALETTE.length]})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ProgramsGraphs = ({
  projects,
  scope = "MIMAROPA",
}: {
  projects: TaraProject[];
  scope?: string;
}) => {
  const summary = useMemo(() => {
    const totalCost = projects.reduce((s, p) => s + p.budget, 0);
    const beneficiaries = projects.reduce((s, p) => s + p.beneficiaries, 0);
    const provinces = new Set(projects.map((p) => p.province)).size;
    return { count: projects.length, totalCost, beneficiaries, provinces };
  }, [projects]);

  const perYear = useMemo<Row[]>(() => {
    const map = new Map<number, number>();
    projects.forEach((p) => {
      const y = projectYear(p);
      map.set(y, (map.get(y) ?? 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ label: String(year), value: count }));
  }, [projects]);

  const perStatus = useMemo(() => {
    const rows: Row[] = [];
    const badges: string[] = [];
    PROJECT_STATUSES.forEach((status) => {
      const value = projects.filter((p) => p.status === status).length;
      if (value > 0) {
        rows.push({ label: STATUS_META[status].label, value });
        badges.push(STATUS_META[status].className);
      }
    });
    return { rows, badges };
  }, [projects]);

  const perProvince = useMemo<Row[]>(() => {
    return PROVINCES.map((province) => ({
      label: province,
      value: projects.filter((p) => p.province === province).length,
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const perType = useMemo<Row[]>(() => {
    return TARA_TYPES.map((type) => ({
      label: type,
      value: projects.filter((p) => projectType(p) === type).length,
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const perSector = useMemo<Row[]>(() => {
    return SECTORS.map((sector) => ({
      label: sector,
      value: projects.filter((p) => p.sector === sector).length,
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const costPerProvince = useMemo<Row[]>(() => {
    return PROVINCES.map((province) => ({
      label: province,
      value: projects
        .filter((p) => p.province === province)
        .reduce((s, p) => s + p.budget, 0),
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const costPerSector = useMemo<Row[]>(() => {
    return SECTORS.map((sector) => ({
      label: sector,
      value: projects
        .filter((p) => p.sector === sector)
        .reduce((s, p) => s + p.budget, 0),
    }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const tiles = [
    { label: "Total Number of Projects", value: String(summary.count) },
    { label: "Total Project Cost", value: formatPeso(summary.totalCost) },
    { label: "Total Beneficiaries", value: formatCompact(summary.beneficiaries) },
    { label: "Provinces Covered", value: String(summary.provinces) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3.5 text-center backdrop-blur"
          >
            <p
              className="truncate text-lg font-bold tabular-nums sm:text-xl"
              style={{ color: PALETTE[i % PALETTE.length] }}
            >
              {t.value}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {t.label}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-500">
        Summary graphs for{" "}
        <span className="font-semibold text-slate-300">{scope}</span> — computed
        live from the current project list.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Number of Projects Per Year Approved" subtitle="Trend">
          <AreaLineChart rows={perYear} />
        </Card>

        <Card
          title="Number of Projects Per Project Status"
          subtitle="Share"
        >
          <DonutChart rows={perStatus.rows} />
        </Card>

        <Card title="Number of Projects Per Province" subtitle="Per PSTO">
          <ColumnChart rows={perProvince} />
        </Card>

        <Card title="Project Cost Per Province" subtitle="Share">
          <DonutChart rows={costPerProvince} format={formatCompact} />
        </Card>

        <Card title="Number of Projects Per Project Type" subtitle="Ranked">
          <BarChart rows={perType} />
        </Card>

        <Card title="Number of Projects Per Sector" subtitle="Ranked">
          <BarChart rows={perSector} />
        </Card>

        <Card title="Project Cost Per Sector" subtitle="Ranked (₱)">
          <BarChart rows={costPerSector} format={formatCompact} />
        </Card>

        <Card title="Status Breakdown" subtitle="Counts">
          <BarChart rows={perStatus.rows} badges={perStatus.badges} />
        </Card>
      </div>
    </div>
  );
};

export default ProgramsGraphs;
