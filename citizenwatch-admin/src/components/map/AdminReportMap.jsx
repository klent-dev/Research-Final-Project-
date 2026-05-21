import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { toReportMarker } from '../../services/mapService.js';
import { ReportMapMarker } from '../../utils/mapMarkers.js';

const DEFAULT_MAP_CENTER = {
  lat: 10.3157,
  lng: 123.8854
};

function AdminReportMapBridge({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);

  return null;
}

export function AdminReportMap({ reports = [] }) {
  const mapRef = useRef(null);
  const markers = reports.map(toReportMarker).filter((marker) => marker.position);

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function handleCenterMap() {
    mapRef.current?.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], 13);
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <h2>Report Map</h2>
        <span>{markers.length} mapped report(s)</span>
      </div>
      <div className="community-map-card admin-report-map-frame">
        <MapContainer
          attributionControl
          center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
          className="community-leaflet-map"
          scrollWheelZoom
          zoom={13}
          zoomControl={false}
        >
          <AdminReportMapBridge mapRef={mapRef} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker) => (
            <Marker icon={ReportMapMarker(marker.status)} key={marker.id} position={marker.position}>
              <Popup className="report-map-popup" closeButton offset={[0, -12]}>
                <div className="map-popup-card">
                  <div className="map-popup-header">
                    <strong>{marker.title || 'Infrastructure Report'}</strong>
                    <span className="community-status-pill community-status-pill--pending">
                      {marker.status || 'Pending'}
                    </span>
                  </div>
                  <p>{marker.position.map((value) => value.toFixed(5)).join(', ')}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        <div className="community-map-controls" aria-label="Map controls">
          <button onClick={handleZoomIn} type="button" aria-label="Zoom in">+</button>
          <button onClick={handleZoomOut} type="button" aria-label="Zoom out">-</button>
          <button onClick={handleCenterMap} type="button" aria-label="Center map">o</button>
        </div>
      </div>
    </section>
  );
}

