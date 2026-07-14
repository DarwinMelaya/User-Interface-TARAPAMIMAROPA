export type FeedCategory = "safety" | "utilities" | "other";
export type StatusTone = "danger" | "warning" | "info" | "neutral";

export type ReportTypeMeta = {
  label: string;
  feedCategory: FeedCategory;
  statusTone: StatusTone;
  status: string;
};

const TYPE_META: Record<string, ReportTypeMeta> = {
  accident: {
    label: "Accident",
    feedCategory: "safety",
    statusTone: "danger",
    status: "Critical",
  },
  crime: {
    label: "Crime",
    feedCategory: "safety",
    statusTone: "danger",
    status: "Critical",
  },
  fire: {
    label: "Fire",
    feedCategory: "safety",
    statusTone: "danger",
    status: "Critical",
  },
  flood: {
    label: "Flood",
    feedCategory: "safety",
    statusTone: "warning",
    status: "Elevated",
  },
  power_outage: {
    label: "Power outage",
    feedCategory: "utilities",
    statusTone: "warning",
    status: "Utilities",
  },
  water: {
    label: "Water issue",
    feedCategory: "utilities",
    statusTone: "info",
    status: "Utilities",
  },
};

const TYPE_ACCENT: Record<StatusTone, { border: string; status: string }> = {
  danger: { border: "border-l-red-500/80", status: "text-red-300" },
  warning: { border: "border-l-amber-500/80", status: "text-amber-300" },
  info: { border: "border-l-cyan-500/80", status: "text-cyan-300" },
  neutral: { border: "border-l-slate-500/80", status: "text-slate-300" },
};

export const getReportTypeMeta = (type?: string): ReportTypeMeta =>
  TYPE_META[type ?? ""] ?? {
    label: type ? type.replaceAll("_", " ") : "Report",
    feedCategory: "other",
    statusTone: "neutral",
    status: "Monitor",
  };

export const getReportTypeAccent = (type?: string) =>
  TYPE_ACCENT[getReportTypeMeta(type).statusTone];

export const countReportsByCategory = <
  T extends { report_type?: string },
>(
  reports: T[],
) => {
  let safety = 0;
  let utilities = 0;
  let other = 0;

  for (const report of reports) {
    const cat = getReportTypeMeta(report.report_type).feedCategory;
    if (cat === "safety") safety += 1;
    else if (cat === "utilities") utilities += 1;
    else other += 1;
  }

  return { safety, utilities, other, total: reports.length };
};
