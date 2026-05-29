import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaCrosshairs,
  FaFilter,
  FaGavel,
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
import communityImage from '../../assets/images/Community.png';
import { reverseGeocodeLocation } from '../../services/geocodingService.js';
import { formatStatusLabel } from '../../services/localReportService.js';
import {
  DEFAULT_MAP_CENTER,
  filterReports,
  formatDistance,
  formatReportAge,
  hasValidCoordinates,
  getVisibleCategory,
  getReportDistanceKm,
  getStatusTone,
  sortReportsByDistance
} from '../../services/mapService.js';
import { useReports } from '../../hooks/useReports.js';
import { ReportMapMarker } from '../../utils/mapMarkers.js';
import '../../styles/map.css';

const filters = ['All', 'Drainage', 'Street Light', 'Flooding', 'Waste', 'Others'];

const categoryIcons = {
  Drainage: FaTint,
  'Street Light': FaLightbulb,
  Flooding: FaWater,
  Waste: FaTrashAlt,
  Others: FaRoad
};

const userLocationIcon = L.divIcon({
  className: 'community-user-marker',
  html: '',
  iconAnchor: [10, 10],
  iconSize: [20, 20]
});

function hasPlaceholderAddress(address = '') {
  const normalized = String(address).trim().toLowerCase();
  return normalized === '' || normalized === 'photo location detected' || normalized === 'location detected';
}

function MapBridge({ mapRef }) {
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
  const [activeFilter, setActiveFilter] = useState('All');
  const { reports } = useReports();
  const [userLocation, setUserLocation] = useState(null);
  const [mapMessage, setMapMessage] = useState('');
  const [resolvedReportAddresses, setResolvedReportAddresses] = useState({});
  const mapRef = useRef(null);

  const validReports = useMemo(() => reports.filter(hasValidCoordinates), [reports]);
  const filteredReports = useMemo(() => filterReports(validReports, activeFilter), [activeFilter, validReports]);
  const nearbyReports = useMemo(
    () => sortReportsByDistance(filteredReports, userLocation).slice(0, 3),
    [filteredReports, userLocation]
  );
  const mapReports = validReports;

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

  function handleCurrentLocation() {
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
        setMapMessage('Location permission was denied or unavailable.');
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }

  function handleFocusFilters() {
    document.querySelector('.community-map-filters')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <PageContainer className="community-map-page">
      <header className="community-map-topbar">
        <div className="community-map-brand">
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </div>
        <img src={communityImage} alt="Citizen profile" />
      </header>

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
            <MapBridge mapRef={mapRef} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mapReports.map((report) => (
              <Marker
                icon={ReportMapMarker(report.urgency)}
                key={report.id}
                position={[report.location.lat, report.location.lng]}
              >
                <Popup className="report-map-popup" closeButton offset={[0, -12]}>
                  <div className="map-popup-card">
                    <div className="map-popup-header">
                      <strong>{report.issueType || report.category}</strong>
                      <span className={`community-status-pill community-status-pill--${getStatusTone(report.status)}`}>
                        {formatStatusLabel(report.status)}
                      </span>
                    </div>
                    <p>
                      {resolvedReportAddresses[report.id] || report.location?.address || 'Location detected'}
                    </p>
                    {report.description && <small>{report.description}</small>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {userLocation && (
              <Marker icon={userLocationIcon} position={[userLocation.lat, userLocation.lng]}>
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
                    <h3>{report.title}</h3>
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
