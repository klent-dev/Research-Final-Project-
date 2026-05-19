import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { sampleCitizenReports } from '../../data/sampleReports.js';
import { getReportCoordinates, normalizeAdminReport, subscribeReportsForModeration } from '../../services/adminReportService.js';

const GIS_CENTER = {
  lat: 10.3157,
  lng: 123.8854
};

const primaryCategories = ['Drainage', 'Street Lighting', 'Flooding', 'Road Maintenance', 'Waste Management'];
const categoryOptions = ['All', ...primaryCategories, 'Others'];

const criticalIncidentIcon = L.divIcon({
  className: 'gis-leaflet-marker gis-leaflet-marker--critical',
  html: '<span></span>',
  iconAnchor: [14, 14],
  iconSize: [28, 28]
});

const utilityIncidentIcon = L.divIcon({
  className: 'gis-leaflet-marker gis-leaflet-marker--utility',
  html: '<span></span>',
  iconAnchor: [12, 12],
  iconSize: [24, 24]
});

function Icon({ name }) {
  const paths = {
    search: 'M10 4a6 6 0 0 1 4.8 9.6l4.3 4.3-1.4 1.4-4.3-4.3A6 6 0 1 1 10 4Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    bell: 'M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z',
    refresh: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z',
    message: 'M4 5h16v11H8.2L4 19.2V5Zm2 2v8.1l1.5-1.1H18V7H6Z',
    close: 'm6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z',
    image: 'M5 5h14v14H5V5Zm2 2v8.6l3-3 2.2 2.2 3.4-4.2L17 12.4V7H7Zm0 10h10v-1.4l-1.5-2-3.1 3.8-2.4-2.4-3 3V17Z',
    phone: 'M7.4 4h3l1.1 4-1.8 1.2a10.8 10.8 0 0 0 5.1 5.1l1.2-1.8 4 1.1v3a2 2 0 0 1-2.1 2A14.5 14.5 0 0 1 5.4 6.1 2 2 0 0 1 7.4 4Z',
    layers: 'm12 3 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4v2l-8 4-8-4v-2Zm0 5 8 4 8-4v2l-8 4-8-4v-2Z'
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function GisMapBridge({ mapRef }) {
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

function getVisibleCategory(category = '') {
  const normalized = category.toLowerCase();

  if (normalized.includes('drain') || normalized.includes('sewage') || normalized.includes('water')) {
    return 'Drainage';
  }

  if (normalized.includes('street') || normalized.includes('light')) {
    return 'Street Lighting';
  }

  if (normalized.includes('flood')) {
    return 'Flooding';
  }

  if (normalized.includes('road') || normalized.includes('pothole') || normalized.includes('maintenance')) {
    return 'Road Maintenance';
  }

  if (normalized.includes('waste') || normalized.includes('trash') || normalized.includes('garbage') || normalized.includes('dump')) {
    return 'Waste Management';
  }

  return 'Others';
}

function getReportPosition(report) {
  const coordinates = getReportCoordinates(report);

  return coordinates ? [coordinates.lat, coordinates.lng] : null;
}

function getReportCategory(report) {
  return report.category || 'Infrastructure Report';
}

function getReportTitle(report) {
  return report.title || report.name || `${getReportCategory(report)} Report`;
}

function getReportAddress(report) {
  const position = getReportPosition(report);

  if (report.locationText || report.address || report.location?.address) {
    return report.locationText || report.address || report.location.address;
  }

  return position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Location not provided';
}

function getReportDistrict(report) {
  return report.district || 'District not provided';
}

function getReportImage(report) {
  return report.imageUrl || report.photoUrl || report.evidenceImage || report.photoPreview || '';
}

function formatReportId(report) {
  return report.trackingId || report.reportId || `#INC-${String(report.id || '').slice(0, 6).toUpperCase()}`;
}

function formatDate(value) {
  let date = null;

  if (value?.toDate) {
    date = value.toDate();
  } else if (value) {
    date = new Date(value);
  }

  if (!date || Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function GisMap({ mapRef, reports, onSelectReport }) {
  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function handleCenterMap() {
    mapRef.current?.setView([GIS_CENTER.lat, GIS_CENTER.lng], 14);
  }

  return (
    <div className="gis-map-canvas" aria-label="Infrastructure monitoring map">
      <MapContainer
        attributionControl={false}
        center={[GIS_CENTER.lat, GIS_CENTER.lng]}
        className="gis-leaflet-map"
        dragging
        scrollWheelZoom={false}
        zoom={14}
        zoomControl={false}
      >
        <GisMapBridge mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => {
          const position = getReportPosition(report);
          const category = getReportCategory(report);
          const isCritical = report.normalizedSeverity === 'critical';

          if (!position) {
            return null;
          }

          return (
            <Marker
              eventHandlers={{
                click: () => onSelectReport(report)
              }}
              icon={isCritical ? criticalIncidentIcon : utilityIncidentIcon}
              key={report.id}
              position={position}
              title={category}
            >
              <Popup>
                <strong>{category}</strong>
                <br />
                {getReportTitle(report)}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="gis-map-controls">
        <button onClick={handleZoomIn} type="button" aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} type="button" aria-label="Zoom out">-</button>
        <button onClick={handleCenterMap} type="button" aria-label="Center map">o</button>
      </div>
    </div>
  );
}

function ReportDetailsPanel({ report, onClose }) {
  const imageUrl = getReportImage(report);

  function handleEnlarge() {
    if (imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <aside className="incident-detail-panel">
      <button className="incident-close" onClick={onClose} type="button" aria-label="Close report detail">
        <Icon name="close" />
      </button>
      <span className="incident-id">{formatReportId(report)}</span>
      <h2>{getReportTitle(report)}</h2>
      <p className="incident-location">{getReportDistrict(report)} - {getReportAddress(report)}</p>

      <section className="incident-summary">
        <h3>Report Summary</h3>
        <div className="incident-summary-grid">
          <div>
            <span>Time Reported</span>
            <strong>{formatDate(report.createdAt || report.timestamp || report.submittedAt)}</strong>
          </div>
          <div>
            <span>Source Type</span>
            <strong>{report.sourceType || report.source || 'Citizen App'}</strong>
          </div>
        </div>
        <p>{report.description || 'No report description provided.'}</p>
      </section>

      <section className="evidence-section">
        <h3>Evidence Thumbnail</h3>
        <div className={imageUrl ? 'evidence-image evidence-image--photo' : 'evidence-image'}>
          {imageUrl ? <img src={imageUrl} alt="Report evidence" /> : <span />}
          <button disabled={!imageUrl} onClick={handleEnlarge} type="button">
            <Icon name="image" />
            Enlarge
          </button>
        </div>
      </section>
    </aside>
  );
}

export default function ReportMapPage() {
  const mapRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [mapMessage, setMapMessage] = useState('Loading reports...');

  useEffect(() => {
    const unsubscribe = subscribeReportsForModeration(
      { maxItems: 200 },
      (nextReports) => {
        setReports(nextReports);
        setMapMessage(nextReports.length > 0 ? '' : 'No local reports with map coordinates found yet.');
      }
    );

    return unsubscribe;
  }, []);

  const mapReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          getReportPosition(report) &&
          !report.deleted &&
          !report.isDeleted &&
          !['completed', 'rejected'].includes(report.normalizedStatus)
      ),
    [reports]
  );
  const displayedMapReports = mapReports.length > 0 ? mapReports : sampleCitizenReports.map(normalizeAdminReport);
  const isShowingSampleReports = mapReports.length === 0;
  const mapStatusMessage =
    mapReports.length > 0
      ? ''
      : `Showing sample citizen reports until local reports with coordinates are available.${mapMessage ? ` ${mapMessage}` : ''}`;

  const filteredReports = useMemo(() => {
    if (selectedCategory === 'All') {
      return displayedMapReports;
    }

    return displayedMapReports.filter((report) => getVisibleCategory(getReportCategory(report)) === selectedCategory);
  }, [displayedMapReports, selectedCategory]);

  return (
    <main className="gis-tracking-page">
      <header className="gis-topbar">
        <div>
          <h1>Infrastructure</h1>
          <p>Monitoring</p>
        </div>
        <label className="gis-search">
          <Icon name="search" />
          <input placeholder="Search coordinates, street names, or asset ID..." type="search" />
        </label>
        <button className="gis-icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
        <button className="gis-icon-button" type="button" aria-label="Refresh map"><Icon name="refresh" /></button>
        <button className="gis-icon-button" type="button" aria-label="Messages"><Icon name="message" /></button>
        <button className="gis-emergency-button" type="button">Emergency Alert</button>
        <span className="gis-admin-avatar" aria-hidden="true">AU</span>
      </header>

      <section className={selectedReport ? 'gis-shell' : 'gis-shell gis-shell--map-only'}>
        <section className="gis-map-area">
          <GisMap mapRef={mapRef} onSelectReport={setSelectedReport} reports={filteredReports} />

          {mapStatusMessage && <p className="gis-map-status">{mapStatusMessage}</p>}

          <aside className="map-categories-panel">
            <header>
              <h2>Categories</h2>
            </header>
            <div className="gis-category-list">
              {categoryOptions.map((category) => (
                <button
                  className={selectedCategory === category ? 'active' : ''}
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
            <p>{isShowingSampleReports ? `Showing ${filteredReports.length} sample reports` : `Showing ${filteredReports.length} reports`}</p>
          </aside>
        </section>

        {selectedReport && <ReportDetailsPanel onClose={() => setSelectedReport(null)} report={selectedReport} />}
      </section>
    </main>
  );
}
