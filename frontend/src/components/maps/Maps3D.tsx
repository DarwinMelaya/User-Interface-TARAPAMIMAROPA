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
const DEFAULT_ZOOM = 7.2;
const PITCH_3D = 68;
const BEARING_3D = -22;
const TERRAIN_EXAGGERATION = 1.55;
const TERRAIN_SOURCE_ID = "terrainSource";
const HILLSHADE_SOURCE_ID = "hillshadeSource";

/** Free DEM — MapLibre official 3D terrain example */
const DEM_TILEJSON = "https://tiles.mapterhorn.com/tilejson.json";

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
    maxzoom: 20,
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

const LABEL_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
];

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
      <em>3D terrain · Click for project intel · ${escapeHtml(program.short)}</em>
    </div>
  `;
};

const demSource = (): maplibregl.RasterDEMSourceSpecification => ({
  type: "raster-dem",
  url: DEM_TILEJSON,
  tileSize: 512,
  encoding: "terrarium",
  maxzoom: 12,
});

const buildStyle = (baseLayer: MapBaseLayer): maplibregl.StyleSpecification => {
  const raster = RASTER_TILES[baseLayer];
  const sources: maplibregl.StyleSpecification["sources"] = {
    "base-raster": {
      type: "raster",
      tiles: raster.tiles,
      tileSize: 256,
      attribution: raster.attribution,
      maxzoom: raster.maxzoom ?? 19,
    },
    [TERRAIN_SOURCE_ID]: demSource(),
    [HILLSHADE_SOURCE_ID]: demSource(),
  };

  const layers: maplibregl.LayerSpecification[] = [
    {
      id: "base-raster-layer",
      type: "raster",
      source: "base-raster",
      paint: {
        "raster-fade-duration": 180,
        "raster-resampling": "linear",
      },
    },
    {
      id: "hills",
      type: "hillshade",
      source: HILLSHADE_SOURCE_ID,
      paint: {
        "hillshade-shadow-color": "#020617",
        "hillshade-highlight-color": "#f8fafc",
        "hillshade-accent-color": "#22d3ee",
        "hillshade-exaggeration":
          baseLayer === "satellite" || baseLayer === "hybrid" ? 0.35 : 0.55,
      },
    },
  ];

  if (baseLayer === "hybrid") {
    sources["labels-raster"] = {
      type: "raster",
      tiles: LABEL_TILES,
      tileSize: 256,
      attribution: "Labels &copy; Esri",
      maxzoom: 19,
    };
    layers.push({
      id: "labels-raster-layer",
      type: "raster",
      source: "labels-raster",
      paint: {
        "raster-opacity": 0.9,
        "raster-fade-duration": 180,
      },
    });
  }

  return {
    version: 8,
    sources,
    layers,
    terrain: {
      source: TERRAIN_SOURCE_ID,
      exaggeration: TERRAIN_EXAGGERATION,
    },
    sky: {},
  };
};

const ensureTerrain = (map: maplibregl.Map) => {
  if (!map.getSource(TERRAIN_SOURCE_ID)) return;
  map.setTerrain({
    source: TERRAIN_SOURCE_ID,
    exaggeration: TERRAIN_EXAGGERATION,
  });
};

const flyCamera = (
  map: maplibregl.Map,
  options: {
    center: [number, number];
    zoom: number;
    duration?: number;
  },
) => {
  map.easeTo({
    center: options.center,
    zoom: options.zoom,
    pitch: PITCH_3D,
    bearing: BEARING_3D,
    duration: options.duration ?? 900,
    essential: true,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
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
  const baseLayerRef = useRef(baseLayer);
  const readyRef = useRef(false);
  const skipBaseLayerEffect = useRef(true);

  onViewProjectRef.current = onViewProject;
  selectedIdRef.current = selectedId;
  baseLayerRef.current = baseLayer;

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const paintMarkers = (map: maplibregl.Map) => {
    clearMarkers();

    const valid = (projects ?? []).filter(
      (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
    );
    const positioned = layoutProjectPositions(valid);

    positioned.forEach(({ project, lat, lng }) => {
      const isActive = selectedIdRef.current === project.id;
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

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("mouseenter", () => {
        if (!marker.getPopup()?.isOpen()) marker.togglePopup();
      });
      el.addEventListener("mouseleave", () => {
        if (marker.getPopup()?.isOpen()) marker.togglePopup();
      });

      markersRef.current.push(marker);
    });

    return { valid, positioned };
  };

  const frameProjects = (
    map: maplibregl.Map,
    positioned: { project: TaraProject; lat: number; lng: number }[],
    valid: TaraProject[],
  ) => {
    const activeId = selectedIdRef.current;

    if (activeId) {
      const hit = positioned.find((p) => p.project.id === activeId);
      if (hit) {
        flyCamera(map, {
          center: [hit.lng, hit.lat],
          zoom: 13.5,
          duration: 1100,
        });
        return;
      }
    }

    if (valid.length === 1) {
      flyCamera(map, {
        center: [positioned[0].lng, positioned[0].lat],
        zoom: 12.5,
        duration: 900,
      });
      return;
    }

    if (valid.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      positioned.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 10.5,
        pitch: PITCH_3D,
        bearing: BEARING_3D,
        duration: 1000,
        essential: true,
      });
      return;
    }

    flyCamera(map, {
      center: MIMAROPA_CENTER,
      zoom: DEFAULT_ZOOM,
      duration: 800,
    });
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
      minZoom: 5,
      maxZoom: 18,
      maxPitch: 85,
      canvasContextAttributes: { antialias: true },
      fadeDuration: 200,
      attributionControl: { compact: true },
      // Keep mesh rendering when map moves — less blank flashes
      renderWorldCopies: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true,
      }),
      "bottom-right",
    );

    map.addControl(
      new maplibregl.TerrainControl({
        source: TERRAIN_SOURCE_ID,
        exaggeration: TERRAIN_EXAGGERATION,
      }),
      "bottom-right",
    );

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();
    map.keyboard.enable();

    // Smoother wheel zoom (less jumpy into blank pitching)
    map.scrollZoom.setWheelZoomRate(1 / 420);
    map.scrollZoom.setZoomRate(1 / 120);

    map.on("load", () => {
      ensureTerrain(map);
      readyRef.current = true;
      const { valid, positioned } = paintMarkers(map);
      frameProjects(map, positioned, valid);
    });

    // If user zooms past raster native max, still keep terrain visible
    map.on("zoomend", () => {
      if (!map.getTerrain()) ensureTerrain(map);
    });

    mapRef.current = map;

    return () => {
      readyRef.current = false;
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
    if (skipBaseLayerEffect.current) {
      skipBaseLayerEffect.current = false;
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    const camera = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    };

    const applyStyle = () => {
      map.setStyle(buildStyle(baseLayer));
      map.once("style.load", () => {
        ensureTerrain(map);
        map.jumpTo(camera);
        if (readyRef.current) {
          paintMarkers(map);
        }
      });
    };

    if (map.isStyleLoaded()) applyStyle();
    else map.once("load", applyStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- markers redeploy after style
  }, [baseLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const run = () => {
      const { valid, positioned } = paintMarkers(map);
      frameProjects(map, positioned, valid);
    };

    if (map.isStyleLoaded()) run();
    else map.once("idle", run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    userMarkerRef.current = new maplibregl.Marker({
      element: el,
      anchor: "center",
      pitchAlignment: "viewport",
      rotationAlignment: "viewport",
    })
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
    flyCamera(map, {
      center: [userLocation.lng, userLocation.lat],
      zoom: 14.5,
      duration: 1100,
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
        3D terrain · drag rotate · right-drag pitch
      </div>
    </div>
  );
};

export default Maps3D;
