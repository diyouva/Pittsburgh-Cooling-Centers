import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip, useMap, Pane } from 'react-leaflet';
import { PGH_CENTER, MAP_BOUNDS, DISTANCE_COLORS } from '../utils/constants';
import 'leaflet/dist/leaflet.css';

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(MAP_BOUNDS);
    map.fitBounds(MAP_BOUNDS);
  }, [map]);
  return null;
}

function interpolateColor(value, min, max) {
  const stops = DISTANCE_COLORS;
  const t = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const idx = t * (stops.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, stops.length - 1);
  const frac = idx - lo;

  const parse = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const [r1, g1, b1] = parse(stops[lo]);
  const [r2, g2, b2] = parse(stops[hi]);
  const r = Math.round(r1 + (r2 - r1) * frac);
  const g = Math.round(g1 + (g2 - g1) * frac);
  const b = Math.round(b1 + (b2 - b1) * frac);
  return `rgb(${r},${g},${b})`;
}

export default function MapView({ blockGroups, sites, scenario, assignmentMap }) {
  const openSiteIds = useMemo(
    () => new Set(scenario?.open_site_ids || []),
    [scenario]
  );

  const vmax = useMemo(() => {
    if (!assignmentMap || Object.keys(assignmentMap).length === 0) return 20;
    const distances = Object.values(assignmentMap).map(a => a.distance_m / 1000);
    distances.sort((a, b) => a - b);
    return distances[Math.floor(distances.length * 0.95)] || 20;
  }, [assignmentMap]);

  const geoStyle = useMemo(() => {
    return (feature) => {
      const geoid = feature.properties.GEOID;
      const assignment = assignmentMap[geoid];
      const distKm = assignment ? assignment.distance_m / 1000 : vmax;
      return {
        fillColor: interpolateColor(distKm, 0, vmax),
        color: '#94a3b8',
        weight: 0.3,
        fillOpacity: 0.65,
      };
    };
  }, [assignmentMap, vmax]);

  const onEachFeature = useMemo(() => {
    return (feature, layer) => {
      const p = feature.properties;
      const geoid = p.GEOID;
      const assignment = assignmentMap[geoid];
      const distKm = assignment ? (assignment.distance_m / 1000).toFixed(2) : '-';
      const centerName = assignment ? assignment.site_name : '-';
      layer.bindTooltip(
        `<div style="font-size:12px;line-height:1.5">
          <b>Distance:</b> ${distKm} km<br/>
          <b>Population:</b> ${(p.total_pop || 0).toLocaleString()}<br/>
          <b>Nearest Center:</b> ${centerName}
        </div>`,
        { sticky: true, className: 'custom-tooltip' }
      );
    };
  }, [assignmentMap]);

  const geojsonKey = useMemo(() => {
    return scenario ? `${scenario.objective}-${scenario.n_new}` : 'default';
  }, [scenario]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#c8e3d8]">
      <MapContainer
        center={PGH_CENTER}
        zoom={11}
        minZoom={10}
        maxZoom={15}
        maxBounds={MAP_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '520px', width: '100%' }}
        zoomControl={true}
      >
        <FitBounds />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {blockGroups && (
          <GeoJSON
            key={geojsonKey}
            data={blockGroups}
            style={geoStyle}
            onEachFeature={onEachFeature}
          />
        )}

        <Pane name="site-markers" style={{ zIndex: 650 }}>
          {sites?.filter(s => openSiteIds.has(s.site_id)).map(site => (
            <CircleMarker
              key={site.site_id}
              center={[site.lat, site.lon]}
              radius={10}
              pathOptions={{
                color: '#ffffff',
                fillColor: site.is_existing ? '#2563eb' : '#B33951',
                fillOpacity: 1,
                weight: 3,
                opacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span style={{ fontSize: '12px' }}>
                  {site.is_existing ? '📍' : '⭐'} {site.site_name}
                  {site.is_existing ? ' (Existing)' : ' (NEW)'}
                </span>
              </Tooltip>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>
                  <b style={{ color: site.is_existing ? '#2563eb' : '#B33951' }}>
                    {site.site_name}
                  </b><br />
                  <span style={{ color: '#54494B' }}>
                    {site.is_existing ? 'Existing Cooling Center' : 'Recommended New Site'}
                  </span><br />
                  <span style={{ fontSize: '11px' }}>{site.type}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </Pane>
      </MapContainer>

      {/* Color legend */}
      <div className="absolute bottom-4 right-4 bg-[#eef6f2]/95 backdrop-blur rounded-lg p-3 border border-[#c8e3d8] z-[1000]">
        <div className="text-[10px] text-[#54494B] mb-1.5">Walking Distance (km)</div>
        <div className="flex items-center gap-0">
          {DISTANCE_COLORS.map((c, i) => (
            <div key={i} className="w-6 h-3" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
          <span>0</span>
          <span>{Math.round(vmax)}</span>
        </div>
      </div>

      {/* Marker legend */}
      <div className="absolute bottom-4 left-4 bg-[#eef6f2]/95 backdrop-blur rounded-lg px-3 py-2 border border-[#c8e3d8] z-[1000] text-[10px] text-[#54494B] flex gap-3">
        <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: '#2563eb' }} />Existing</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: '#B33951' }} />New</span>
      </div>
    </div>
  );
}

