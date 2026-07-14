import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./reportMap.css";
import { getReportTypeMeta } from "../../constants/reportTypes";
import { buildReportPinHtml, type MapReport } from "./reportMapPins";

const BATANGAS_CENTER: L.LatLngExpression = [13.4, 121.95];
const DEFAULT_ZOOM = 10;

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type PositionedReport = {
  report: MapReport;
  lat: number;
  lng: number;
};

type MarkerEntry = PositionedReport & {
  marker: L.Marker;
};

/** Spread markers that share the same coordinates so they remain clickable. */
const layoutReportPositions = (reports: MapReport[]): PositionedReport[] => {
  const groups = new Map<string, MapReport[]>();

  reports.forEach((report) => {
    const key = `${Number(report.latitude).toFixed(4)},${Number(report.longitude).toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(report);
  });

  const laidOut: PositionedReport[] = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      const report = group[0];
      laidOut.push({
        report,
        lat: Number(report.latitude),
        lng: Number(report.longitude),
      });
      return;
    }

    const angleStep = (2 * Math.PI) / group.length;
    const offsetMeters = 28;
    const baseLat = Number(group[0].latitude);
    const latOffset = offsetMeters / 111_320;
    const lngOffsetBase =
      offsetMeters / (111_320 * Math.cos((baseLat * Math.PI) / 180));

    group.forEach((report, index) => {
      const angle = angleStep * index;
      laidOut.push({
        report,
        lat: baseLat + latOffset * Math.sin(angle),
        lng: Number(report.longitude) + lngOffsetBase * Math.cos(angle),
      });
    });
  });

  return laidOut;
};

const createReportPinIcon = (report: MapReport, isActive: boolean) =>
  L.divIcon({
    className: "report-pin-leaflet-icon",
    html: buildReportPinHtml(report, isActive),
    iconSize: [48, 56],
    iconAnchor: [24, 28],
  });

const buildTooltipContent = (report: MapReport) => {
  const typeMeta = getReportTypeMeta(report.report_type);
  const raw =
    (report.details?.length ?? 0) > 80
      ? `${report.details!.slice(0, 80)}…`
      : report.details;
  const preview = escapeHtml(raw);
  const when = escapeHtml(
    report.created_at ? new Date(report.created_at).toLocaleString() : "",
  );

  return `
    <div class="report-map-tooltip__inner report-map-tooltip__inner--${report.report_type ?? "other"}">
      <strong>◈ ${escapeHtml(typeMeta.label)}</strong>
      <span>${when}</span>
      <p>${preview}</p>
      <em>Click to open intel</em>
    </div>
  `;
};

const setPinState = (
  marker: L.Marker,
  { active, hover }: { active?: boolean; hover?: boolean },
) => {
  const pin = marker.getElement()?.querySelector(".report-pin");
  if (!pin) return;
  pin.classList.toggle("report-pin--active", !!active);
  pin.classList.toggle("report-pin--hover", !!hover);
};

const elevateMarker = (marker: L.Marker, offset = 800) => {
  if (marker?.setZIndexOffset) {
    marker.setZIndexOffset(offset);
  }
};

const resetMarkerElevation = (marker: L.Marker) => {
  if (marker?.setZIndexOffset) {
    marker.setZIndexOffset(0);
  }
};

type MapsProps = {
  reports: MapReport[];
  selectedId?: string | null;
  onViewReport?: (report: MapReport) => void;
};

const Maps = ({ reports, selectedId, onViewReport }: MapsProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const onViewReportRef = useRef(onViewReport);
  const selectedIdRef = useRef(selectedId);

  onViewReportRef.current = onViewReport;
  selectedIdRef.current = selectedId;

  const clearMarkers = (map: L.Map | null) => {
    markersRef.current.forEach((entry) => {
      entry.marker.off();
      if (map?.hasLayer(entry.marker)) {
        entry.marker.remove();
      }
    });
    markersRef.current = [];
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: BATANGAS_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      tapTolerance: 18,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      clearMarkers(map);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clearMarkers(map);

    const valid = (reports ?? []).filter(
      (r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude),
    );

    const positioned = layoutReportPositions(valid);

    positioned.forEach(({ report, lat, lng }) => {
      const isActive = selectedId === report.id;

      const marker = L.marker([lat, lng], {
        icon: createReportPinIcon(report, isActive),
        riseOnHover: true,
        riseOffset: 250,
      }).addTo(map);

      marker.bindTooltip(buildTooltipContent(report), {
        direction: "top",
        offset: [0, -22],
        opacity: 1,
        className: "report-map-tooltip",
      });

      const openReport = () => {
        onViewReportRef.current?.(report);
      };

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        openReport();
      });

      marker.on("mouseover", () => {
        const isPinActive = selectedIdRef.current === report.id;
        setPinState(marker, { active: isPinActive, hover: true });
        elevateMarker(marker, isPinActive ? 1000 : 800);
        marker.openTooltip();
      });

      marker.on("mouseout", () => {
        const isPinActive = selectedIdRef.current === report.id;
        setPinState(marker, { active: isPinActive, hover: false });
        if (!isPinActive) resetMarkerElevation(marker);
      });

      markersRef.current.push({ marker, report, lat, lng });
    });

    if (selectedId) {
      const entry = markersRef.current.find((m) => m.report.id === selectedId);
      if (entry) {
        map.flyTo([entry.lat, entry.lng], 16, { duration: 0.6 });
        setPinState(entry.marker, { active: true, hover: false });
        elevateMarker(entry.marker, 1000);
      }
    } else if (valid.length === 1) {
      map.setView([positioned[0].lat, positioned[0].lng], 14);
    } else if (valid.length > 1) {
      const bounds = L.latLngBounds(positioned.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
    } else {
      map.setView(BATANGAS_CENTER, DEFAULT_ZOOM);
    }
  }, [reports, selectedId]);

  return (
    <div
      ref={containerRef}
      className="report-map-container h-full w-full"
      aria-label="Community reports map"
    />
  );
};

export default Maps;
