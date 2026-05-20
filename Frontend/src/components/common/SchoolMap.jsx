import {
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const tileSources = {
  street: {
    label: "Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

const defaultCenter = [20.5937, 78.9629];

function MapUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (!center) {
      return;
    }
    map.setView(center, zoom, {
      animate: true,
    });
  }, [center, map, zoom]);

  return null;
}

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click: (event) => {
      onLocationChange?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function SchoolMap({
  latitude,
  longitude,
  address,
  onLocationChange,
}) {
  const [mapMode, setMapMode] = useState("street");
  const hasCoords =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const center = useMemo(
    () =>
      hasCoords
        ? [latitude, longitude]
        : defaultCenter,
    [hasCoords, latitude, longitude]
  );
  const zoom = hasCoords ? 16 : 5;
  const tileSource =
    tileSources[mapMode] || tileSources.street;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        <MapContainer
          center={center}
          zoom={zoom}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            url={tileSource.url}
            attribution={tileSource.attribution}
          />
          {hasCoords && <Marker position={center} />}
          <ZoomControl position="bottomright" />
          <MapUpdater center={center} zoom={zoom} />
          <MapClickHandler
            onLocationChange={onLocationChange}
          />
        </MapContainer>

        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-xl bg-white/90 p-1 text-xs font-bold text-slate-700 shadow">
          {Object.entries(tileSources).map(
            ([key, source]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMapMode(key)}
                className={`h-8 rounded-lg px-3 transition ${
                  mapMode === key
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {source.label}
              </button>
            )
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="line-clamp-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
            {address ||
              "Tap the map to set the school location"}
          </p>
        </div>

        {!hasCoords && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-600 shadow">
              No location set. Fetch or tap on the map.
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {hasCoords
            ? `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`
            : "Latitude/Longitude not set"}
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
          <MapPin size={14} />
          Tap map to set location
        </span>
      </div>
    </div>
  );
}
