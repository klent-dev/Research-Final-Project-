import { toReportMarker } from '../../services/mapService.js';

export function AdminReportMap({ reports = [] }) {
  const markers = reports.map(toReportMarker).filter((marker) => marker.position);

  return (
    <section className="panel">
      <div className="toolbar">
        <h2>Report Map</h2>
        <span>{markers.length} mapped report(s)</span>
      </div>
      <div className="map-frame">
        <p>Leaflet markers are prepared for rendering by latitude and longitude.</p>
      </div>
    </section>
  );
}

