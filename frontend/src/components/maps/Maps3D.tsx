import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./projectMap.css";
import {
  PROGRAM_META,
  STATUS_META,
  type TaraProject,
} from "../../constants/taraProjects";
import { buildProjectPinHtml } from "./projectMapPins";
import type { MapBaseLayer, UserLocation } from "./mapTypes";

const MIMAROPA_CENTER: [number, number] = [121.0, 12.0]; // lng, lat
const DEFAULT_ZOOM = 7;
const PITCH_3D = 62;
const BEARING_3D = -18;

const RASTER_TILES: Record<
  MapBaseLayer,
  { tiles: string[]; attribution: string; maxzoom?: number }
> = {
  street: {
    tiles: [
      "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    ],
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Tiles &copy; Esri",
    maxzoom: 19,
  },
  terrain: {
    tiles: [
      "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
    ],
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxzoom: 17,
  },
  hybrid: {
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Tiles &copy; Esri",
    maxzoom: 19,
  },
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const layoutProjectPositions = (projects: TaraProject[]) => {
  const groups = new Map<string, TaraProject[]>();

  projects.forEach((project) => {
    const key = `${Number(project.latitude).toFixed(4)},${Number(project.longitude).toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(project);
  });

  const laidOut: { project: TaraProject; lat: number; lng: number }[] = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      laidOut.push({
        project: group[0],
        lat: group[0].latitude,
        lng: group[0].longitude,
      });
      return;
    }

    const angleStep = (2 * Math.PI) / group.length;
    const offsetMeters = 32;
    const baseLat = group[0].latitude;
    const latOffset = offsetMeters / 111_320;
    const lngOffsetBase =
      offsetMeters / (111_320 * Math.cos((baseLat * Math.PI) / 180));

    group.forEach((project, index) => {
      const angle = angleStep * index;
      laidOut.push({
        project,
        lat: baseLat + latOffset * Math.sin(angle),
        lng: project.longitude + lngOffsetBase * Math.cos(angle),
      });
    });
  });

  return laidOut;
};

const buildTooltipContent = (project: TaraProject) => {
  const status = STATUS_META[project.status];
  const program = PROGRAM_META[project.program];

  return `
    <div class="project-map-tooltip__inner">
      <strong>◈ ${escapeHtml(project.name)}</strong>
      <span>${escapeHtml(project.program)} · ${escapeHtml(status.label)} · ${project.progress}%</span>
      <p>${escapeHtml(project.municipality)}, ${escapeHtml(project.province)}</p>
      <em>3D view · Click for project intel · ${escapeHtml(program.short)}</em>
    </div>
  `;
};

const buildStyle = (baseLayer: MapBaseLayer): maplibregl.StyleSpecification => {
  const raster = RASTER_TILES[baseLayer];
  return {
    version: 8,
    sources: {
      "base-raster": {
        type: "raster",
        tiles: raster.tiles,
        tileSize: 256,
        attribution: raster.attribution,
        maxzoom: raster.maxzoom ?? 19,
      },
    },
    layers: [
      {
        id: "base-raster-layer",
        type: "raster",
        source: "base-raster",
      },
    ],
  };
};

type Maps3DProps = {
  projects: TaraProject[];
  selectedId?: string | null;
  baseLayer?: MapBaseLayer;
  userLocation?: UserLocation | null;
  flyToUserToken?: number;
  onViewProject?: (project: TaraProject) => void;
};

const Maps3D = ({
  projects,
  selectedId,
  baseLayer = "satellite",
  userLocation = null,
  flyToUserToken = 0,
  onViewProject,
}: Maps3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onViewProjectRef = useRef(onViewProject);
  const selectedIdRef = useRef(selectedId);

  onViewProjectRef.current = onViewProject;
  selectedIdRef.current = selectedId;

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(baseLayer),
      center: MIMAROPA_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: PITCH_3D,
      bearing: BEARING_3D,
      attributionControl: { compact: true },
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true,
      }),
      "bottom-right",
    );

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    mapRef.current = map;

    return () => {
      clearMarkers();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyStyle = () => {
      map.setStyle(buildStyle(baseLayer));
      map.once("style.load", () => {
        map.setPitch(PITCH_3D);
        map.setBearing(BEARING_3D);
      });
    };

    if (map.isStyleLoaded()) applyStyle();
    else map.once("load", applyStyle);
  }, [baseLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const paintMarkers = () => {
      clearMarkers();

      const valid = (projects ?? []).filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
      );
      const positioned = layoutProjectPositions(valid);

      positioned.forEach(({ project, lat, lng }) => {
        const isActive = selectedId === project.id;
        const el = document.createElement("div");
        el.className = "project-pin-leaflet-icon";
        el.innerHTML = buildProjectPinHtml(project, isActive);
        el.style.cursor = "pointer";
        el.title = project.name;

        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onViewProjectRef.current?.(project);
        });

        const popup = new maplibregl.Popup({
          offset: 28,
          closeButton: false,
          className: "project-maplibre-popup",
        }).setHTML(buildTooltipContent(project));

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("mouseenter", () => {
          if (!marker.getPopup()?.isOpen()) marker.togglePopup();
        });

        markersRef.current.push(marker);
      });

      if (selectedId) {
        const hit = positioned.find((p) => p.project.id === selectedId);
        if (hit) {
          map.flyTo({
            center: [hit.lng, hit.lat],
            zoom: 13,
            pitch: PITCH_3D,
            bearing: BEARING_3D,
            duration: 900,
          });
        }
      } else if (valid.length === 1) {
        map.flyTo({
          center: [positioned[0].lng, positioned[0].lat],
          zoom: 12,
          pitch: PITCH_3D,
          bearing: BEARING_3D,
          duration: 700,
        });
      } else if (valid.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        positioned.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, {
          padding: 72,
          maxZoom: 10,
          pitch: PITCH_3D,
          bearing: BEARING_3D,
          duration: 800,
        });
      } else {
        map.flyTo({
          center: MIMAROPA_CENTER,
          zoom: DEFAULT_ZOOM,
          pitch: PITCH_3D,
          bearing: BEARING_3D,
          duration: 600,
        });
      }
    };

    if (map.isStyleLoaded()) paintMarkers();
    else map.once("load", paintMarkers);
  }, [projects, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userLocation) return;

    const el = document.createElement("div");
    el.className = "user-location-leaflet-icon";
    el.innerHTML = `
      <div class="user-location-pin">
        <span class="user-location-pin__pulse"></span>
        <span class="user-location-pin__dot"></span>
      </div>
    `;

    userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 12, closeButton: false }).setText(
          "Your location",
        ),
      )
      .addTo(map);
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation || flyToUserToken <= 0) return;
    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      pitch: PITCH_3D,
      bearing: BEARING_3D,
      duration: 900,
    });
  }, [flyToUserToken, userLocation]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="project-map-container maplibre-3d h-full w-full"
        aria-label="TARA PAMIMAROPA 3D GIS project map"
      />
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-cyan-400/30 bg-slate-950/75 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200 backdrop-blur">
        3D View · drag rotate · ctrl+drag pitch
      </div>
    </div>
  );
};

export default Maps3D;
