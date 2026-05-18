import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  FaBars,
  FaCrosshairs,
  FaFilter,
  FaGavel,
  FaLightbulb,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaRoad,
  FaTint,
  FaTools,
  FaTrashAlt,
  FaWater
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import {
  DEFAULT_MAP_CENTER,
  filterReports,
  formatDistance,
  formatReportAge,
  getCategoryTone,
  getReportDistanceKm,
  getStatusTone,
  loadMapReports,
  sortReportsByDistance
} from '../../services/mapService.js';
import '../../styles/map.css';

if (L.Icon?.Default?.prototype?._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const filters = ['All', 'Road Damage', 'Drainage', 'Street Light', 'Flooding', 'Resolved'];

const categoryIcons = {
  'Road Damage': FaTools,
  Drainage: FaTint,
  'Street Light': FaLightbulb,
  Flooding: FaWater,
  Waste: FaTrashAlt
};

const userLocationIcon = L.divIcon({
  className: 'community-user-marker',
  html: '',
  iconAnchor: [10, 10],
  iconSize: [20, 20]
});

function createReportIcon(category) {
  return L.divIcon({
    className: `community-leaflet-marker community-leaflet-marker--${getCategoryTone(category)}`,
    html: '<span></span>',
    iconAnchor: [22, 22],
    iconSize: [44, 44]
  });
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
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapMessage, setMapMessage] = useState('');
  const mapRef = useRef(null);

  const filteredReports = useMemo(() => filterReports(reports, activeFilter), [activeFilter, reports]);
  const nearbyReports = useMemo(
    () => sortReportsByDistance(filteredReports, userLocation).slice(0, 3),
    [filteredReports, userLocation]
  );

  useEffect(() => {
    let ignore = false;

    async function fetchReports() {
      const loadedReports = await loadMapReports();

      if (!ignore) {
        setReports(loadedReports);
        setSelectedReport(loadedReports[0] ?? null);
      }
    }

    fetchReports();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (selectedReport && !filteredReports.some((report) => report.id === selectedReport.id)) {
      setSelectedReport(filteredReports[0] ?? null);
    }
  }, [filteredReports, selectedReport]);

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
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function handleFocusFilters() {
    document.querySelector('.community-map-filters')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const selectedTone = getStatusTone(selectedReport?.status);

  return (
    <PageContainer className="community-map-page">
      <header className="community-map-topbar">
        <div className="community-map-brand">
          <FaBars aria-hidden="true" />
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

            {filteredReports.map((report) => (
              <Marker
                eventHandlers={{
                  click: () => setSelectedReport(report)
                }}
                icon={createReportIcon(report.category)}
                key={report.id}
                position={[report.location.lat, report.location.lng]}
              >
                <Popup>
                  <strong>{report.title}</strong>
                  <br />
                  {report.location.address}
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

        {selectedReport && (
          <article className="community-map-popup">
            <div>
              <h2>{selectedReport.category}</h2>
              <span className={`community-status-pill community-status-pill--${selectedTone}`}>
                {selectedReport.status}
              </span>
            </div>
            <strong>{selectedReport.location.address}</strong>
            <p>{selectedReport.description}</p>
            <span>
              <FaMapMarkerAlt aria-hidden="true" />
            </span>
          </article>
        )}

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
          <h2>Nearby Reports</h2>
          <button type="button">See All</button>
        </header>

        <div className="community-nearby-list">
          {nearbyReports.length > 0 ? (
            nearbyReports.map((report) => {
              const Icon = categoryIcons[report.category] || FaRoad;
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
                      {formatDistance(distance)} <span aria-hidden="true">•</span> {formatReportAge(report.createdAt)}
                    </p>
                  </div>
                  <span className={`community-status-pill community-status-pill--${tone}`}>
                    {report.status}
                  </span>
                </article>
              );
            })
          ) : (
            <div className="community-map-empty">
              <FaMapMarkerAlt aria-hidden="true" />
              <h3>No nearby reports available.</h3>
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
