import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useAnalytics } from '../../hooks/useAnalytics.js';

const CEBU_CENTER = {
  lat: 10.3157,
  lng: 123.8854
};

const incidentMarkers = [
  {
    id: 'road-001',
    category: 'Critical Infrastructure',
    position: [10.3157, 123.8854],
    title: 'Main Drainage Blockage'
  },
  {
    id: 'road-002',
    category: 'Utility Maintenance',
    position: [10.3258, 123.8952],
    title: 'Hospital Backup Grid Malfunction'
  },
  {
    id: 'road-003',
    category: 'Public Safety',
    position: [10.3048, 123.8987],
    title: 'Highway Interchange Collision'
  },
  {
    id: 'road-004',
    category: 'Critical Infrastructure',
    position: [10.3312, 123.8721],
    title: 'Bridge Surface Damage'
  }
];

const urgentActions = [
  {
    id: 'urgent-001',
    category: 'Flood Warning',
    title: 'Sector 7 Main Drainage Blockage',
    description: 'Water rising rapidly near residential blocks.',
    time: '2m ago',
    tags: ['Infrastructure', 'Sanitation']
  },
  {
    id: 'urgent-002',
    category: 'Power Failure',
    title: 'Hospital Backup Grid Malfunction',
    description: 'Primary switchboard failed at 10:42AM.',
    time: '14m ago',
    tags: ['Utilities', 'District 1']
  },
  {
    id: 'urgent-003',
    category: 'Traffic Incident',
    title: 'Major Collision: Highway Interchange',
    description: 'Emergency services dispatched; clearing ongoing.',
    time: '28m ago',
    tags: ['Public Safety']
  }
];

const incidentIcon = L.divIcon({
  className: 'admin-leaflet-marker admin-leaflet-marker--critical',
  html: '<span></span>',
  iconAnchor: [13, 13],
  iconSize: [26, 26]
});

function DashboardMapBridge() {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [map]);

  return null;
}

function DashboardIcon({ name }) {
  let path = 'M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z';

  if (name === 'refresh') {
    path = 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z';
  }

  if (name === 'help') {
    path = 'M11 17h2v-2h-2v2Zm1-14a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11Zm0-9.3c-1.6 0-2.8.9-2.8 2.4h1.7c0-.6.4-1 1.1-1 .7 0 1.1.4 1.1 1 0 .5-.3.8-.9 1.2-.9.6-1.2 1.1-1.2 2.2h1.6c0-.6.2-.9.8-1.3.8-.5 1.5-1.1 1.5-2.2 0-1.4-1.1-2.3-2.9-2.3Z';
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default function DashboardPage() {
  const { analytics, isLoading } = useAnalytics();
  const totalReports = analytics?.totalReports || 1284;
  const submittedReports = analytics?.submittedReports || 412;
  const resolvedReports = analytics?.resolvedReports || 812;

  return (
    <main className="command-dashboard">
      <section className="command-content">
        <header className="command-heading">
          <div>
            <h1>Command Overview</h1>
            <p>System status and live report metrics for today.</p>
          </div>
          <div className="dashboard-user-strip">
            <button type="button" aria-label="Notifications"><DashboardIcon name="bell" /></button>
            <button type="button" aria-label="Refresh"><DashboardIcon name="refresh" /></button>
            <button type="button" aria-label="Help"><DashboardIcon name="help" /></button>
            <span aria-hidden="true">AU</span>
            <strong>Admin User</strong>
            {isLoading && <small>Syncing</small>}
          </div>
        </header>

        <section className="command-kpi-grid" aria-label="Command overview metrics">
          <article className="command-kpi-card command-kpi-card--wide">
            <div>
              <span>Total Reports</span>
              <strong>{totalReports.toLocaleString()}</strong>
            </div>
            <small>+12%</small>
            <div className="sparkline" aria-hidden="true">
              <span />
            </div>
          </article>

          <article className="command-kpi-card command-kpi-card--danger">
            <span>Critical Priority</span>
            <strong>24</strong>
            <small>-4%</small>
            <div className="sparkline sparkline--danger" aria-hidden="true">
              <span />
            </div>
          </article>

          <article className="command-kpi-card command-kpi-card--neutral">
            <span>In Progress</span>
            <strong>{submittedReports}</strong>
            <small>Stable</small>
            <div className="mini-progress" aria-hidden="true"><span /></div>
          </article>

          <article className="command-kpi-card">
            <span>Resolved This Month</span>
            <strong>{resolvedReports}</strong>
            <small>Backlog -8%</small>
            <div className="sparkline sparkline--soft" aria-hidden="true">
              <span />
            </div>
          </article>
        </section>

        <section className="dashboard-main-grid">
          <section className="command-map-card">
            <header>
              <h2>Live Incident GIS Clusters</h2>
              <span>Live Tracking</span>
            </header>
            <div className="dashboard-leaflet-shell">
              <MapContainer
                attributionControl={false}
                center={[CEBU_CENTER.lat, CEBU_CENTER.lng]}
                className="dashboard-leaflet-map"
                dragging
                scrollWheelZoom={false}
                zoom={13}
                zoomControl={false}
              >
                <DashboardMapBridge />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {incidentMarkers.map((marker) => (
                  <Marker icon={incidentIcon} key={marker.id} position={marker.position}>
                    <Popup>
                      <strong>{marker.title}</strong>
                      <br />
                      {marker.category}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="map-legend">
                <span><i className="legend-dot legend-dot--red" />Critical Infrastructure</span>
                <span><i className="legend-dot legend-dot--green" />Utility Maintenance</span>
                <span><i className="legend-dot legend-dot--gray" />Public Safety</span>
              </div>
            </div>
          </section>

          <section className="urgent-card">
            <header>
              <h2>Urgent Action Required</h2>
              <span>3 New</span>
            </header>
            <div className="urgent-list">
              {urgentActions.map((action) => (
                <article className="urgent-item" key={action.id}>
                  <div>
                    <span>{action.category}</span>
                    <time>{action.time}</time>
                  </div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                  <footer>
                    {action.tags.map((tag) => <small key={tag}>{tag}</small>)}
                  </footer>
                </article>
              ))}
            </div>
            <button type="button">View All Urgent Tasks</button>
          </section>
        </section>
      </section>
    </main>
  );
}

