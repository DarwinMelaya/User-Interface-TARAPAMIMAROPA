import { getReportTypeMeta } from "../../constants/reportTypes";

export type MapReport = {
  id: string;
  report_type?: string;
  details?: string;
  created_at?: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toneClass = (type?: string) => {
  const tone = getReportTypeMeta(type).statusTone;
  if (tone === "danger") return "report-pin--danger";
  if (tone === "warning") return "report-pin--warning";
  if (tone === "info") return "report-pin--info";
  return "report-pin--neutral";
};

export const buildReportPinHtml = (
  report: MapReport,
  isActive: boolean,
): string => {
  const meta = getReportTypeMeta(report.report_type);
  const classes = [
    "report-pin",
    toneClass(report.report_type),
    isActive ? "report-pin--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${classes}" data-report-id="${escapeHtml(report.id)}">
      <div class="report-pin__pulse"></div>
      <div class="report-pin__core" title="${escapeHtml(meta.label)}">
        <span class="report-pin__glyph">◈</span>
      </div>
      <div class="report-pin__point"></div>
    </div>
  `;
};
