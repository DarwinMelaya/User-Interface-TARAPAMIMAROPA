import { useMemo, useState } from "react";
import {
  HiBriefcase,
  HiDocumentText,
  HiMagnifyingGlass,
  HiMapPin,
  HiUserGroup,
} from "react-icons/hi2";
import {
  EMPLOYEE_OFFICES,
  EMPLOYMENT_META,
  EMPLOYMENT_TYPES,
  MOCK_EMPLOYEES,
  headcountByOffice,
  summarizeEmployees,
  type EmployeeOffice,
  type EmploymentType,
  type TaraEmployee,
} from "../../constants/employees";

const RegionEmployeeRecord = () => {
  const [employees] = useState<TaraEmployee[]>(MOCK_EMPLOYEES);
  const [officeFilter, setOfficeFilter] = useState<EmployeeOffice | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<EmploymentType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (officeFilter !== "all" && e.office !== officeFilter) return false;
      if (typeFilter !== "all" && e.employmentType !== typeFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.office.toLowerCase().includes(q)
      );
    });
  }, [employees, officeFilter, typeFilter, search]);

  const stats = useMemo(() => summarizeEmployees(filtered), [filtered]);
  const byOffice = useMemo(() => headcountByOffice(filtered), [filtered]);
  const maxHeadcount = Math.max(1, ...byOffice.map((r) => r.total));

  const regionTotals = useMemo(() => summarizeEmployees(employees), [employees]);

  const kpis = [
    {
      label: "Total employees",
      value: String(stats.total),
      hint: `${regionTotals.total} region-wide`,
      icon: HiUserGroup,
    },
    {
      label: "Regular",
      value: String(stats.regular),
      hint:
        stats.total > 0
          ? `${Math.round((stats.regular / stats.total) * 100)}% of filtered`
          : "No records",
      icon: HiBriefcase,
      accent: "text-blue-300",
    },
    {
      label: "Contract of Service",
      value: String(stats.cos),
      hint:
        stats.total > 0
          ? `${Math.round((stats.cos / stats.total) * 100)}% of filtered`
          : "No records",
      icon: HiDocumentText,
      accent: "text-amber-300",
    },
  ];

  return (
    <section className="min-h-screen bg-slate-950 px-4 py-5 pb-[calc(5rem+env(safe-area-inset-bottom))] text-slate-200 sm:px-6 sm:py-7 lg:pb-7">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Employee Record
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-slate-400">
            Regular and Contract of Service headcount across Regional Office and
            PSTO provinces in MIMAROPA.
          </p>
        </header>

        {/* Office filter chips */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <HiMapPin className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <button
            type="button"
            onClick={() => setOfficeFilter("all")}
            className={[
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition duration-[180ms]",
              officeFilter === "all"
                ? "bg-blue-600 text-white"
                : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200",
            ].join(" ")}
          >
            All offices
          </button>
          {EMPLOYEE_OFFICES.map((office) => {
            const count = employees.filter((e) => e.office === office).length;
            return (
              <button
                key={office}
                type="button"
                onClick={() => setOfficeFilter(office)}
                className={[
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition duration-[180ms]",
                  officeFilter === office
                    ? "bg-blue-600 text-white"
                    : "border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200",
                ].join(" ")}
              >
                {office}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500">
                    {kpi.label}
                  </p>
                  <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                </div>
                <p
                  className={[
                    "mt-1.5 truncate text-xl font-semibold tabular-nums",
                    kpi.accent ?? "text-white",
                  ].join(" ")}
                >
                  {kpi.value}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">{kpi.hint}</p>
              </div>
            );
          })}
        </div>

        {/* Headcount by office: stacked Regular / COS */}
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Headcount by office
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Regular vs Contract of Service per province / RO
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Regular
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                COS
              </span>
            </div>
          </div>

          {byOffice.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No employees match current filters.
            </p>
          ) : (
            <div className="space-y-3">
              {byOffice.map((row) => {
                const regularPct = Math.round(
                  (row.regular / maxHeadcount) * 100,
                );
                const cosPct = Math.round((row.cos / maxHeadcount) * 100);
                const active = officeFilter === row.office;
                return (
                  <button
                    key={row.office}
                    type="button"
                    onClick={() =>
                      setOfficeFilter(active ? "all" : row.office)
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
                        {row.office}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-500">
                        <span className="font-semibold text-blue-300">
                          {row.regular}
                        </span>{" "}
                        Reg ·{" "}
                        <span className="font-semibold text-amber-300">
                          {row.cos}
                        </span>{" "}
                        COS ·{" "}
                        <span className="font-semibold text-slate-200">
                          {row.total}
                        </span>
                      </span>
                    </div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-blue-500 transition-[width] duration-[320ms]"
                        style={{ width: `${regularPct}%` }}
                        title={`Regular: ${row.regular}`}
                      />
                      <div
                        className="h-full bg-amber-500 transition-[width] duration-[320ms]"
                        style={{ width: `${cosPct}%` }}
                        title={`COS: ${row.cos}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Roster */}
        <div className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Employee roster
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {filtered.length} record{filtered.length === 1 ? "" : "s"}
                {officeFilter !== "all" ? ` · ${officeFilter}` : ""}
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search employees</span>
              <HiMagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, position…"
                className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 outline-none transition duration-[180ms] focus:border-blue-500"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition duration-[180ms]",
                typeFilter === "all"
                  ? "bg-slate-100 text-slate-900"
                  : "border border-slate-700 text-slate-400 hover:text-slate-200",
              ].join(" ")}
            >
              All types
            </button>
            {EMPLOYMENT_TYPES.map((type) => {
              const meta = EMPLOYMENT_META[type];
              const count = (
                officeFilter === "all"
                  ? employees
                  : employees.filter((e) => e.office === officeFilter)
              ).filter((e) => e.employmentType === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setTypeFilter(typeFilter === type ? "all" : type)
                  }
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition duration-[180ms]",
                    typeFilter === type
                      ? meta.className
                      : "border border-slate-700 text-slate-500 ring-transparent hover:text-slate-300",
                  ].join(" ")}
                >
                  {meta.label}
                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Position</th>
                  <th className="px-3 py-3 font-medium">Office</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Date hired</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No employees match these filters.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((employee) => {
                  const meta = EMPLOYMENT_META[employee.employmentType];
                  return (
                    <tr
                      key={employee.id}
                      className="border-b border-slate-800/80 transition duration-[180ms] last:border-b-0 hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-3 font-medium text-white">
                        {employee.name}
                      </td>
                      <td className="max-w-[220px] px-3 py-3 text-slate-400">
                        <span className="line-clamp-1">{employee.position}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-300">
                        {employee.office}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-400">
                        {employee.dateHired}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegionEmployeeRecord;
