export function ReportMap({ reports = [] }) {
  return (
    <section className="panel">
      <h2>Nearby Reports Map</h2>
      <div className="map-frame">
        <p>{reports.length} report marker(s) ready for Leaflet rendering.</p>
      </div>
    </section>
  );
}

