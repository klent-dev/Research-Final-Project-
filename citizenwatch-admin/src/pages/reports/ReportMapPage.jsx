import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import {
  getReportCoordinates,
  subscribeReportsForModeration
} from '../../services/adminReportService.js';
import { ReportMapMarker } from '../../utils/mapMarkers.js';

const GIS_CENTER = {
  lat: 10.3157,
  lng: 123.8854
};
const MAX_ADMIN_LOCATION_ACCURACY_METERS = 1000;
const TARGET_ADMIN_LOCATION_ACCURACY_METERS = 80;
const ADMIN_LOCATION_WATCH_TIMEOUT_MS = 12000;

const primaryCategories = ['Drainage', 'Street Lighting', 'Flooding', 'Road Maintenance', 'Waste Management'];
const categoryOptions = ['All', ...primaryCategories, 'Others'];
const reportStatusFilters = [
  {
    id: 'actionable',
    label: 'Actionable Reports',
    tone: 'actionable',
    statuses: new Set(['pending', 'submitted', 'under_review', 'under review', 'in_progress', 'in progress'])
  },
  {
    id: 'closed',
    label: 'Completed / Closed Reports',
    tone: 'closed',
    statuses: new Set(['verified', 'resolved', 'rejected', 'completed', 'closed', 'voided', 'voided_by_citizen'])
  }
];

function Icon({ name }) {
  const paths = {
    search: 'M10 4a6 6 0 0 1 4.8 9.6l4.3 4.3-1.4 1.4-4.3-4.3A6 6 0 1 1 10 4Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    bell: 'M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z',
    refresh: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z',
    message: 'M4 5h16v11H8.2L4 19.2V5Zm2 2v8.1l1.5-1.1H18V7H6Z',
    close: 'm6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z',
    image: 'M5 5h14v14H5V5Zm2 2v8.6l3-3 2.2 2.2 3.4-4.2L17 12.4V7H7Zm0 10h10v-1.4l-1.5-2-3.1 3.8-2.4-2.4-3 3V17Z',
    phone: 'M7.4 4h3l1.1 4-1.8 1.2a10.8 10.8 0 0 0 5.1 5.1l1.2-1.8 4 1.1v3a2 2 0 0 1-2.1 2A14.5 14.5 0 0 1 5.4 6.1 2 2 0 0 1 7.4 4Z',
    layers: 'm12 3 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4v2l-8 4-8-4v-2Zm0 5 8 4 8-4v2l-8 4-8-4v-2Z',
    sliders: 'M4 7h7v2H4V7Zm9-.5a2.5 2.5 0 1 1 0 3 2.5 2.5 0 0 1 0-3ZM17 7h3v2h-3V7ZM4 15h3v2H4v-2Zm5-.5a2.5 2.5 0 1 1 0 3 2.5 2.5 0 0 1 0-3Zm7 .5h4v2h-4v-2Z',
    chevronDown: 'm7.4 8.6 4.6 4.6 4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z',
    chevronUp: 'M7.4 15.4 6 14l6-6 6 6-1.4 1.4-4.6-4.6-4.6 4.6Z'
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

function getReportFilterStatus(report = {}) {
  return String(report.status || report.normalizedStatus || report.displayStatus || '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_');
}

function matchesActiveStatusFilters(report, activeStatusFilters) {
  const activeFilters = reportStatusFilters.filter((filter) => activeStatusFilters[filter.id]);

  if (activeFilters.length === 0) {
    return true;
  }

  const status = getReportFilterStatus(report);

  return activeFilters.some((filter) => filter.statuses.has(status));
}

function GisMap({ mapRef, reports, onSelectReport }) {
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const watchIdRef = useRef(null);
  const watchTimeoutRef = useRef(null);
  const bestLocationRef = useRef(null);

  function clearLocationWatch() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (watchTimeoutRef.current) {
      window.clearTimeout(watchTimeoutRef.current);
      watchTimeoutRef.current = null;
    }
  }

  useEffect(() => () => clearLocationWatch(), []);

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function getLocationFromCoords(coords) {
    const latitude = Number(coords.latitude);
    const longitude = Number(coords.longitude);
    const accuracy = Math.round(coords.accuracy || 0);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      accuracy,
      lat: latitude,
      lng: longitude
    };
  }

  function moveToLocation(nextLocation) {
    setUserLocation(nextLocation);
    mapRef.current?.flyTo(
      [nextLocation.lat, nextLocation.lng],
      nextLocation.accuracy > MAX_ADMIN_LOCATION_ACCURACY_METERS ? 15 : 18,
      { duration: 0.8 }
    );
  }

  function getLocationMessage(nextLocation) {
    const coordinateText = `${nextLocation.lat.toFixed(5)}, ${nextLocation.lng.toFixed(5)}`;

    if (nextLocation.accuracy > MAX_ADMIN_LOCATION_ACCURACY_METERS) {
      return `Approximate location returned: ${coordinateText} (+/- ${nextLocation.accuracy}m). Turn on Precise Location.`;
    }

    return `Location found: ${coordinateText} (+/- ${nextLocation.accuracy}m).`;
  }

  function handleCenterMap() {
    if (!navigator.geolocation) {
      setLocationError('Browser location is not supported.');
      return;
    }

    clearLocationWatch();
    setIsLocating(true);
    setLocationError('Getting precise GPS location...');
    bestLocationRef.current = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const nextLocation = getLocationFromCoords(coords);

        if (!nextLocation) {
          setLocationError('Browser returned an invalid location. Please try again.');
          setIsLocating(false);
          clearLocationWatch();
          return;
        }

        const currentBest = bestLocationRef.current;
        const isBetterReading = !currentBest || nextLocation.accuracy < currentBest.accuracy;

        if (isBetterReading) {
          bestLocationRef.current = nextLocation;
          moveToLocation(nextLocation);
          setLocationError(getLocationMessage(nextLocation));
        }

        if (nextLocation.accuracy <= TARGET_ADMIN_LOCATION_ACCURACY_METERS) {
          clearLocationWatch();
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Unable to get admin map location:', error);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission is blocked. Allow precise location for this site.'
            : 'Unable to get your location. Check GPS/location services and try again.'
        );
        setIsLocating(false);
        clearLocationWatch();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: ADMIN_LOCATION_WATCH_TIMEOUT_MS
      }
    );

    watchTimeoutRef.current = window.setTimeout(() => {
      const bestLocation = bestLocationRef.current;

      clearLocationWatch();
      setIsLocating(false);

      if (!bestLocation) {
        setLocationError('No GPS reading received. Check location permission and try again.');
        return;
      }

      moveToLocation(bestLocation);
      setLocationError(getLocationMessage(bestLocation));
    }, ADMIN_LOCATION_WATCH_TIMEOUT_MS);
  }

  return (
    <div className="gis-map-canvas" aria-label="Infrastructure monitoring map">
      <MapContainer
        attributionControl={false}
        center={[GIS_CENTER.lat, GIS_CENTER.lng]}
        className="gis-leaflet-map"
        dragging
        scrollWheelZoom
        zoom={14}
        zoomControl={false}
      >
        <GisMapBridge mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#60a5fa',
                fillOpacity: 0.12,
                weight: 1
              }}
              radius={Math.max(userLocation.accuracy || 25, 20)}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#2563eb',
                fillOpacity: 1,
                weight: 3
              }}
              radius={8}
            >
              <Popup className="report-map-popup" closeButton offset={[0, -8]}>
                <div className="map-popup-card">
                  <div className="map-popup-header">
                    <strong>Your Location</strong>
                  </div>
                  <p>{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</p>
                  <small>Accuracy: +/- {userLocation.accuracy || 0}m</small>
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}
        {reports.map((report) => {
          const position = getReportPosition(report);
          const category = getReportCategory(report);

          if (!position) {
            return null;
          }

          return (
            <Marker
              eventHandlers={{
                click: () => onSelectReport(report)
              }}
              icon={ReportMapMarker(report.normalizedSeverity)}
              key={report.id}
              position={position}
              title={category}
            >
              <Popup className="report-map-popup" closeButton offset={[0, -12]}>
                <div className="map-popup-card">
                  <div className="map-popup-header">
                    <strong>{category}</strong>
                    <span className={`community-status-pill community-status-pill--${report.normalizedStatus}`}>
                      {report.displayStatus}
                    </span>
                  </div>
                  <p>{getReportTitle(report)}</p>
                  <small>{getReportAddress(report)}</small>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="community-map-controls gis-map-controls">
        <button onClick={handleZoomIn} type="button" aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} type="button" aria-label="Zoom out">-</button>
        <button disabled={isLocating} onClick={handleCenterMap} type="button" aria-label="Center map on my location">
          {isLocating ? '...' : 'o'}
        </button>
      </div>
      {locationError && <p className="gis-location-error">{locationError}</p>}
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
        <div className="incident-description-block">
          <h4>Description</h4>
          <p>{report.description || 'No report description provided.'}</p>
        </div>
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeStatusFilters, setActiveStatusFilters] = useState({
    actionable: false,
    closed: false
  });
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [mapMessage, setMapMessage] = useState('Loading reports...');

  useEffect(() => {
    const unsubscribe = subscribeReportsForModeration(
      { maxItems: 200 },
      (nextReports) => {
        setReports(nextReports);
        setMapMessage(nextReports.length > 0 ? '' : 'No Firebase reports with map coordinates found yet.');
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
          !report.isDeleted
      ),
    [reports]
  );
  const filteredReports = useMemo(() => {
    const categoryReports = selectedCategory === 'All'
      ? mapReports
      : mapReports.filter((report) => getVisibleCategory(getReportCategory(report)) === selectedCategory);

    return categoryReports.filter((report) => matchesActiveStatusFilters(report, activeStatusFilters));
  }, [activeStatusFilters, mapReports, selectedCategory]);

  function handleToggleStatusFilter(filterId) {
    setActiveStatusFilters((currentFilters) => (
      reportStatusFilters.reduce((nextFilters, filter) => ({
        ...nextFilters,
        [filter.id]: filter.id === filterId ? !currentFilters[filterId] : false
      }), {})
    ));
  }

  return (
    <main className="gis-tracking-page">
      <section className={selectedReport ? 'gis-shell' : 'gis-shell gis-shell--map-only'}>
        <section className="gis-map-area">
          <GisMap mapRef={mapRef} onSelectReport={setSelectedReport} reports={filteredReports} />

          {mapMessage && filteredReports.length === 0 && <p className="gis-map-status">{mapMessage}</p>}

          <aside className={isFilterPanelOpen ? 'map-categories-panel map-categories-panel--open' : 'map-categories-panel'}>
            <button
              aria-expanded={isFilterPanelOpen}
              className="map-filter-dropdown"
              onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
              type="button"
            >
              <Icon name="sliders" />
              <span>Map Filters</span>
              <Icon name={isFilterPanelOpen ? 'chevronUp' : 'chevronDown'} />
            </button>

            {isFilterPanelOpen && (
              <>
                <section className="map-status-filter-panel" aria-label="Report status map filters">
                <div className="map-status-toggle-list">
                  {reportStatusFilters.map((filter) => (
                    <label className={`map-status-toggle map-status-toggle--${filter.tone}`} key={filter.id}>
                      <input
                        checked={activeStatusFilters[filter.id]}
                        onChange={() => handleToggleStatusFilter(filter.id)}
                        type="checkbox"
                      />
                      <span aria-hidden="true" />
                      <strong>{filter.label}</strong>
                    </label>
                  ))}
                </div>
                </section>

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
                <p>Showing {filteredReports.length} reports</p>
              </>
            )}
          </aside>
        </section>

        {selectedReport && (
          <ReportDetailsPanel
            onClose={() => setSelectedReport(null)}
            report={selectedReport}
          />
        )}
      </section>
    </main>
  );
}
