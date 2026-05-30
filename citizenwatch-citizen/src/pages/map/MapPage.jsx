import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaCrosshairs,
  FaFilter,
  FaLightbulb,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaRoad,
  FaTint,
  FaTrashAlt,
  FaWater
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import { reverseGeocodeLocation } from '../../services/geocodingService.js';
import { formatStatusLabel } from '../../services/localReportService.js';
import { getReportById as getLocalReportById } from '../../services/localReportService.js';
import { getReportById as getFirebaseReportById } from '../../services/reportService.js';
import {
  DEFAULT_MAP_CENTER,
  filterReports,
  formatDistance,
  formatReportAge,
  hasValidCoordinates,
  getVisibleCategory,
  getReportDistanceKm,
  normalizeReport,
  getStatusTone,
  sortReportsByDistance
} from '../../services/mapService.js';
import { useReports } from '../../hooks/useReports.js';
import { ReportMapMarker, UserLocationMarker } from '../../utils/mapMarkers.js';
import { toDisplayText } from '../../utils/displayText.js';
import '../../styles/map.css';

const filters = ['All', 'Drainage', 'Street Light', 'Flooding', 'Waste', 'Others'];

const categoryIcons = {
  Drainage: FaTint,
  'Street Light': FaLightbulb,
  Flooding: FaWater,
  Waste: FaTrashAlt,
  Others: FaRoad
};

function hasPlaceholderAddress(address = '') {
  const normalized = String(address).trim().toLowerCase();
  return normalized === '' || normalized === 'photo location detected' || normalized === 'location detected';
}

function MapBridge({ mapRef, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    onMapReady?.();
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef, onMapReady]);

  return null;
}

class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Map failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="community-map-fallback">
          <FaMapMarkerAlt aria-hidden="true" />
          <p>Map failed to load. Please refresh.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const selectedReportId = searchParams.get('reportId') || '';
  const [activeFilter, setActiveFilter] = useState('All');
  const { reports } = useReports();
  const [userLocation, setUserLocation] = useState(null);
  const [mapMessage, setMapMessage] = useState('');
  const [resolvedReportAddresses, setResolvedReportAddresses] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const hasRequestedInitialLocationRef = useRef(false);
  const handleMapReady = useCallback(() => setIsMapReady(true), []);

  const validReports = useMemo(() => reports.filter(hasValidCoordinates), [reports]);
  const selectedReportKey = selectedReport?.id || selectedReport?.reportId || selectedReport?.trackingId || '';
  const mapReports = useMemo(() => {
    if (!selectedReport || !hasValidCoordinates(selectedReport)) {
      return validReports;
    }

    const selectedKeys = [
      selectedReport.id,
      selectedReport.reportId,
      selectedReport.firestoreReportId,
      selectedReport.trackingId
    ].filter(Boolean);
    const alreadyExists = validReports.some((report) => [
      report.id,
      report.reportId,
      report.firestoreReportId,
      report.trackingId
    ].some((key) => selectedKeys.includes(key)));

    return alreadyExists ? validReports : [selectedReport, ...validReports];
  }, [selectedReport, validReports]);
  const filteredReports = useMemo(() => filterReports(validReports, activeFilter), [activeFilter, validReports]);
  const nearbyReports = useMemo(
    () => sortReportsByDistance(filteredReports, userLocation).slice(0, 3),
    [filteredReports, userLocation]
  );

  useEffect(() => {
    let ignore = false;

    async function loadSelectedReport() {
      if (!selectedReportId) {
        setSelectedReport(null);
        return;
      }

      const matchingReport = reports.find((report) => [
        report.id,
        report.reportId,
        report.firestoreReportId,
        report.trackingId
      ].filter(Boolean).includes(selectedReportId));

      if (matchingReport) {
        setSelectedReport(hasValidCoordinates(matchingReport) ? normalizeReport(matchingReport) : matchingReport);
        return;
      }

      const localReport = getLocalReportById(selectedReportId);
      if (localReport) {
        setSelectedReport(hasValidCoordinates(localReport) ? normalizeReport(localReport) : localReport);
        return;
      }

      try {
        const firebaseReport = await getFirebaseReportById(selectedReportId);

        if (!ignore) {
          setSelectedReport(firebaseReport && hasValidCoordinates(firebaseReport) ? normalizeReport(firebaseReport) : firebaseReport);
        }
      } catch (error) {
        console.warn('Unable to load selected map report.', error);

        if (!ignore) {
          setSelectedReport(null);
          setMapMessage('Unable to load the selected report location.');
        }
      }
    }

    void loadSelectedReport();

    return () => {
      ignore = true;
    };
  }, [reports, selectedReportId]);

  useEffect(() => {
    if (!selectedReportId || !isMapReady) {
      return;
    }

    if (!selectedReport) {
      return;
    }

    if (!hasValidCoordinates(selectedReport)) {
      setMapMessage('Location not available for this report.');
      return;
    }

    const position = [Number(selectedReport.location.lat), Number(selectedReport.location.lng)];
    setMapMessage('');
    mapRef.current?.flyTo(position, 17, {
      animate: true,
      duration: 0.9
    });

    window.setTimeout(() => {
      markerRefs.current[selectedReportKey]?.openPopup?.();
    }, 700);
  }, [isMapReady, selectedReport, selectedReportId, selectedReportKey]);

  useEffect(() => {
    let cancelled = false;
    const reportsNeedingAddress = mapReports.filter((report) => (
      report?.id &&
      hasPlaceholderAddress(report.location?.address) &&
      !resolvedReportAddresses[report.id]
    ));

    if (reportsNeedingAddress.length === 0) {
      return undefined;
    }

    async function resolveAddresses() {
      const entries = await Promise.all(reportsNeedingAddress.map(async (report) => {
        try {
          const resolvedLocation = await reverseGeocodeLocation(report.location);
          return [report.id, resolvedLocation?.address || 'Location detected'];
        } catch (error) {
          console.warn('Unable to reverse geocode report marker.', error);
          return [report.id, report.location?.subAddress || 'Location detected'];
        }
      }));

      if (!cancelled) {
        setResolvedReportAddresses((currentAddresses) => ({
          ...currentAddresses,
          ...Object.fromEntries(entries)
        }));
      }
    }

    void resolveAddresses();

    return () => {
      cancelled = true;
    };
  }, [mapReports, resolvedReportAddresses]);

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setMapMessage('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setUserLocation(nextLocation);
        setMapMessage('');
        mapRef.current?.flyTo([nextLocation.lat, nextLocation.lng], 15, {
          animate: true,
          duration: 0.8
        });
      },
      () => {
        setMapMessage('Location permission is required to show your current location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    if (!isMapReady || selectedReportId || hasRequestedInitialLocationRef.current) {
      return;
    }

    hasRequestedInitialLocationRef.current = true;
    handleCurrentLocation();
  }, [handleCurrentLocation, isMapReady, selectedReportId]);

  function handleFocusFilters() {
    document.querySelector('.community-map-filters')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <PageContainer className="community-map-page">
      <section className="community-map-title">
        <span className="community-map-title__chip">Community Map</span>
        <h1>Community Map</h1>
        <p>View nearby infrastructure reports and hazard locations</p>
      </section>

      <section className="community-map-filters" aria-label="Map report filters">
        {filters.map((filter) => (
          <button
            className={activeFilter === filter ? 'community-filter-chip active' : 'community-filter-chip'}
            key={filter}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </section>

      <section className="community-map-card" aria-label="Community map">
        <MapErrorBoundary>
          <MapContainer
            attributionControl
            center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
            className="community-leaflet-map"
            scrollWheelZoom
            zoom={13}
            zoomControl={false}
          >
            <MapBridge mapRef={mapRef} onMapReady={handleMapReady} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mapReports.map((report) => (
              <Marker
                icon={ReportMapMarker(report.urgency)}
                key={report.id}
                position={[report.location.lat, report.location.lng]}
                ref={(marker) => {
                  [
                    report.id,
                    report.reportId,
                    report.firestoreReportId,
                    report.trackingId
                  ].filter(Boolean).forEach((key) => {
                    if (marker) {
                      markerRefs.current[key] = marker;
                    } else {
                      delete markerRefs.current[key];
                    }
                  });
                }}
              >
                <Popup className="report-map-popup" closeButton offset={[0, -12]}>
                  <div className="map-popup-card">
                    <div className="map-popup-header">
                      <strong>{toDisplayText(report.issueType || report.category, 'Infrastructure Report')}</strong>
                      <span className={`community-status-pill community-status-pill--${getStatusTone(report.status)}`}>
                        {formatStatusLabel(report.status)}
                      </span>
                    </div>
                    <p>
                      {resolvedReportAddresses[report.id] || report.location?.address || 'Location detected'}
                    </p>
                    {report.description && <small>{toDisplayText(report.description)}</small>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {userLocation && (
              <Marker icon={UserLocationMarker} position={[userLocation.lat, userLocation.lng]}>
                <Popup>Your current location</Popup>
              </Marker>
            )}
          </MapContainer>
        </MapErrorBoundary>

        {mapMessage && <p className="community-map-message">{mapMessage}</p>}

        <div className="community-map-controls" aria-label="Map controls">
          <button onClick={handleZoomIn} type="button" aria-label="Zoom in">
            <FaPlus aria-hidden="true" />
          </button>
          <button onClick={handleZoomOut} type="button" aria-label="Zoom out">
            <FaMinus aria-hidden="true" />
          </button>
          <button onClick={handleCurrentLocation} type="button" aria-label="Use current location">
            <FaCrosshairs aria-hidden="true" />
          </button>
          <button onClick={handleFocusFilters} type="button" aria-label="Filter map reports">
            <FaFilter aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="community-nearby-section">
        <header>
          <h2>Map Reports</h2>
          <button type="button">See All</button>
        </header>

        <div className="community-nearby-list">
          {nearbyReports.length > 0 ? (
            nearbyReports.map((report) => {
              const Icon = categoryIcons[getVisibleCategory(report.category)] || FaRoad;
              const tone = getStatusTone(report.status);
              const distance = getReportDistanceKm(userLocation, report);

              return (
                <article className="community-report-card" key={report.id}>
                  <span className={`community-report-icon community-report-icon--${tone}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{toDisplayText(report.title || report.issueType, 'Infrastructure Report')}</h3>
                    <p>
                      <FaMapMarkerAlt aria-hidden="true" />
                      {formatDistance(distance)} <span aria-hidden="true">&bull;</span> {formatReportAge(report.createdAt)}
                    </p>
                  </div>
                  <span className={`community-status-pill community-status-pill--${tone}`}>
                    {formatStatusLabel(report.status)}
                  </span>
                </article>
              );
            })
          ) : (
            <div className="community-map-empty">
              <FaMapMarkerAlt aria-hidden="true" />
              <h3>No map reports available.</h3>
              <p>Reported infrastructure issues will appear here.</p>
            </div>
          )}
        </div>
      </section>

      <Link className="community-map-add-button" to="/reports/create" aria-label="Create new report">
        <FaPlus aria-hidden="true" />
      </Link>
    </PageContainer>
  );
}
