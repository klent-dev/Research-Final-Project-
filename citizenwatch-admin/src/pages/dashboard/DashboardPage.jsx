import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { getReportCoordinates, subscribeReportsForModeration } from '../../services/adminReportService.js';
import { ReportMapMarker } from '../../utils/mapMarkers.js';

const CEBU_CENTER = {
  lat: 10.3157,
  lng: 123.8854
};

const statusOrder = ['Pending', 'In Progress', 'Completed'];
const severityOrder = {
  critical: 0,
  moderate: 1,
  minor: 2
};

function toDate(value) {
  if (value?.toDate) return value.toDate();
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getReportTitle(report) {
  return report.title || report.name || `${report.category || 'Infrastructure'} Report`;
}

function getReportPosition(report) {
  const coordinates = getReportCoordinates(report);

  return coordinates ? [coordinates.lat, coordinates.lng] : null;
}

function getIncidentCluster(report) {
  const category = String(report.category || '').toLowerCase();

  if (category.includes('light') || category.includes('utility') || category.includes('power')) {
    return 'Utility Maintenance';
  }

  if (category.includes('traffic') || category.includes('safety') || category.includes('flood')) {
    return 'Public Safety';
  }

  return 'Critical Infrastructure';
}

function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) return 'Recently';

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.floor(diffHours / 24)}d ago`;
}

function DashboardMapBridge({ mapRef, selectedReport }) {
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

  useEffect(() => {
    const position = selectedReport ? getReportPosition(selectedReport) : null;
    if (position) {
      map.flyTo(position, 15, { animate: true, duration: 0.75 });
    }
  }, [map, selectedReport]);

  return null;
}

function getStatusClass(status) {
  return status.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

export default function DashboardPage() {
  const mapRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [statusMessage, setStatusMessage] = useState('Loading reports...');

  useEffect(() => {
    return subscribeReportsForModeration(
      { maxItems: 200 },
      (nextReports) => {
        setReports(nextReports);
        setStatusMessage(nextReports.length > 0 ? '' : 'No Firebase reports found yet.');
      }
    );
  }, []);

  const normalizedReports = reports;

  const categories = useMemo(
    () => ['All Categories', ...Array.from(new Set(normalizedReports.map((report) => report.category))).sort()],
    [normalizedReports]
  );
  const districts = useMemo(
    () => ['All Districts', ...Array.from(new Set(normalizedReports.map((report) => report.district))).sort()],
    [normalizedReports]
  );
  const severities = ['All Severities', 'critical', 'moderate', 'minor'];

  const filteredReports = useMemo(
    () =>
      normalizedReports.filter(
        (report) =>
          (categoryFilter === 'All Categories' || report.category === categoryFilter) &&
          (districtFilter === 'All Districts' || report.district === districtFilter) &&
          (severityFilter === 'All Severities' || report.normalizedSeverity === severityFilter)
      ),
    [categoryFilter, districtFilter, normalizedReports, severityFilter]
  );

  const actionableReports = useMemo(
    () =>
      filteredReports.filter((report) => {
        const hasCoordinates = Boolean(getReportPosition(report));
        const isOpen = report.normalizedStatus !== 'completed';
        const isPendingOrSevere =
          report.normalizedStatus === 'pending' || report.normalizedSeverity === 'critical';

        return hasCoordinates && isOpen && isPendingOrSevere;
      }),
    [filteredReports]
  );

  const urgentReports = useMemo(
    () =>
      actionableReports
        .filter((report) => report.normalizedSeverity === 'critical')
        .sort((first, second) => {
          const severityDiff = severityOrder[first.normalizedSeverity] - severityOrder[second.normalizedSeverity];
          if (severityDiff !== 0) return severityDiff;

          return (toDate(second.createdAt)?.getTime() || 0) - (toDate(first.createdAt)?.getTime() || 0);
        }),
    [actionableReports]
  );

  const selectedReport = normalizedReports.find((report) => report.id === selectedReportId) || null;
  const resolvedThisMonth = normalizedReports.filter((report) => {
    if (report.normalizedStatus !== 'completed') return false;

    const date = toDate(report.updatedAt || report.resolvedAt || report.createdAt);
    const now = new Date();
    return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const summary = statusOrder.map((status) => ({
    status,
    count: normalizedReports.filter((report) => report.displayStatus === status).length
  }));
  const totalReports = normalizedReports.length || 1;

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function handleCenterMap() {
    mapRef.current?.setView([CEBU_CENTER.lat, CEBU_CENTER.lng], 13);
  }

  return (
    <main className="command-dashboard">
      <section className="command-content">
        <header className="command-heading">
          <div>
            <h1>Command Overview</h1>
            <p>Actionable report metrics and real-time incident monitoring.</p>
          </div>
          {statusMessage && <p className="command-sync-message">{statusMessage}</p>}
        </header>

        <section className="command-kpi-grid" aria-label="Command overview metrics">
          <article className="command-kpi-card">
            <span>Total Reports</span>
            <strong>{normalizedReports.length.toLocaleString()}</strong>
          </article>

          <article className="command-kpi-card command-kpi-card--danger">
            <span>Critical Priority</span>
            <strong>{normalizedReports.filter((report) => report.normalizedSeverity === 'critical').length}</strong>
          </article>

          <article className="command-kpi-card command-kpi-card--warning">
            <span>In Progress</span>
            <strong>{normalizedReports.filter((report) => report.normalizedStatus === 'in_progress').length}</strong>
          </article>

          <article className="command-kpi-card command-kpi-card--success">
            <span>Resolved This Month</span>
            <strong>{resolvedThisMonth}</strong>
          </article>
        </section>

        <section className="command-filter-row" aria-label="Dashboard filters">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)}>
            {districts.map((district) => <option key={district}>{district}</option>)}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
            {severities.map((severity) => <option key={severity} value={severity}>{severity === 'All Severities' ? severity : severity.toUpperCase()}</option>)}
          </select>
        </section>

        <section className="command-progress-card" aria-label="Workflow progress summary">
          <div className="progress-stacked-bar" aria-hidden="true">
            {summary.map((item) => (
              <span
                className={`progress-stacked-bar__segment progress-stacked-bar__segment--${getStatusClass(item.status)}`}
                key={item.status}
                style={{ width: `${(item.count / totalReports) * 100}%` }}
              />
            ))}
          </div>
          <div className="progress-summary-list">
            {summary.map((item) => (
              <span key={item.status}>
                <i className={`progress-dot progress-dot--${getStatusClass(item.status)}`} />
                {item.status}: <strong>{item.count}</strong>
              </span>
            ))}
          </div>
        </section>

        <section className="dashboard-main-grid">
          <section className="command-map-card">
            <header>
              <h2>Live Incident GIS Clusters</h2>
              <span>{actionableReports.length} Live</span>
            </header>
            <div className="dashboard-leaflet-shell">
              <MapContainer
                attributionControl={false}
                center={[CEBU_CENTER.lat, CEBU_CENTER.lng]}
                className="dashboard-leaflet-map"
                dragging
                scrollWheelZoom
                zoom={13}
                zoomControl={false}
              >
                <DashboardMapBridge mapRef={mapRef} selectedReport={selectedReport} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {actionableReports.map((report) => (
                  <Marker
                    eventHandlers={{ click: () => setSelectedReportId(report.id) }}
                    icon={ReportMapMarker(report.normalizedSeverity, { selected: report.id === selectedReportId })}
                    key={report.id}
                    position={getReportPosition(report)}
                  >
                    <Popup className="report-map-popup" closeButton offset={[0, -12]}>
                      <div className="map-popup-card">
                        <div className="map-popup-header">
                          <strong>{getReportTitle(report)}</strong>
                          <span className={`community-status-pill community-status-pill--${report.normalizedStatus}`}>
                            {report.displayStatus}
                          </span>
                        </div>
                        <p>{getIncidentCluster(report)}</p>
                        {report.description && <small>{report.description}</small>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="community-map-controls admin-map-controls" aria-label="Map controls">
                <button onClick={handleZoomIn} type="button" aria-label="Zoom in">+</button>
                <button onClick={handleZoomOut} type="button" aria-label="Zoom out">-</button>
                <button onClick={handleCenterMap} type="button" aria-label="Center map">o</button>
              </div>
              <div className="map-legend">
                <span><i className="legend-dot legend-dot--red" />Critical Infrastructure</span>
                <span><i className="legend-dot legend-dot--green" />Utility Maintenance</span>
                <span><i className="legend-dot legend-dot--gray" />Public Safety</span>
              </div>
            </div>
          </section>

          <section className="urgent-card">
            <header>
              <h2>Urgent Action List</h2>
              <span>{urgentReports.length} Tasks</span>
            </header>
            <div className="urgent-list">
              {urgentReports.length > 0 ? (
                urgentReports.map((report) => (
                  <button
                    className={selectedReportId === report.id ? 'urgent-item urgent-item--active' : 'urgent-item'}
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    type="button"
                  >
                    <span className="urgent-item__indicator" aria-hidden="true" />
                    <div className="urgent-item__body">
                      <div className="urgent-item__meta">
                        <span>{report.category}</span>
                        <time>{formatRelativeTime(report.createdAt || report.updatedAt)}</time>
                      </div>
                      <h3>{getReportTitle(report)}</h3>
                      <p>{report.description || 'No description provided.'}</p>
                      <footer>
                        <small>{report.normalizedSeverity}</small>
                        <small>{report.district}</small>
                      </footer>
                    </div>
                  </button>
                ))
              ) : (
                <div className="urgent-empty-state">
                  <h3>No urgent incidents</h3>
                  <p>Pending high-severity local reports will appear here.</p>
                </div>
              )}
            </div>
            {selectedReport && (
              <section className="command-selected-report">
                <span>{selectedReport.normalizedSeverity}</span>
                <h3>{getReportTitle(selectedReport)}</h3>
                <p>{selectedReport.description || 'No description provided.'}</p>
                <small>{selectedReport.district}</small>
              </section>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}
