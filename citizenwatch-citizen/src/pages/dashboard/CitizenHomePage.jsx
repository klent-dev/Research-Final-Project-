import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaBullhorn,
  FaChartLine,
  FaCircle,
  FaExpandAlt,
  FaLightbulb,
  FaMapMarkerAlt,
  FaPlus,
  FaPlusCircle,
  FaRoad,
  FaTint,
  FaTrash
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import { useReports } from '../../hooks/useReports.js';
import { filterReports, hasValidCoordinates } from '../../services/mapService.js';
import { HomeReportPreviewMarker, HomeUserLocationMarker } from '../../utils/mapMarkers.js';
import { toDisplayText } from '../../utils/displayText.js';

const LAHUG_CENTER = {
  lat: 10.3403,
  lng: 123.9065
};

const categories = [
  { label: 'Drainage', icon: FaTint },
  { label: 'Street Light', icon: FaLightbulb },
  { label: 'Flooding', icon: FaTint },
  { label: 'Waste', icon: FaTrash },
  { label: 'Others', icon: FaRoad }
];

function HomeMapBridge({ mapRef }) {
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

export default function CitizenHomePage() {
  const [activeCategory, setActiveCategory] = useState('Drainage');
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const { reports } = useReports();
  // Only reports with real coordinates can appear on the home map preview.
  const validReports = useMemo(() => reports.filter(hasValidCoordinates), [reports]);
  // Category chips update this filtered list so the preview reacts to the selected issue type.
  const nearbyReports = useMemo(
    () => filterReports(validReports, activeCategory).slice(0, 3),
    [activeCategory, validReports]
  );
  const impactStats = [
    { label: 'Submitted', value: reports.length.toString() },
    {
      label: 'Verified',
      value: reports.filter((report) => String(report?.status || '').toUpperCase().includes('VERIFIED')).length.toString()
    },
    {
      label: 'Resolved',
      value: reports.filter((report) => String(report?.status || '').toUpperCase().includes('RESOLVED')).length.toString()
    }
  ];

  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) {
          return;
        }

        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setUserLocation(nextLocation);
        mapRef.current?.setView([nextLocation.lat, nextLocation.lng], 14);
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      mapRef.current?.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation]);

  return (
    <PageContainer className="citizen-home">
      <section className="citizen-greeting">
        <span className="citizen-greeting__chip">Community Dashboard</span>
        <h1>
          Good morning,<span className="citizen-greeting__name">Citizen</span>
        </h1>
        <p>Your contribution keeps our neighborhood safe and functional.</p>
      </section>

      <section className="citizen-report-card">
        <div>
          <h2>Report Infrastructure Issue</h2>
          <p>Spot a problem? Help us fix it by submitting a detailed report with photos and location data.</p>
          <Link className="citizen-report-button" to="/reports/create">
            <FaPlusCircle aria-hidden="true" />
            Create Report
          </Link>
        </div>
        <FaBullhorn className="citizen-report-card__watermark" aria-hidden="true" />
      </section>

      <section className="citizen-impact-card">
        <header>
          <p>Your Impact</p>
          <FaChartLine aria-hidden="true" />
        </header>
        <div className="citizen-impact-list">
          {impactStats.map((item) => (
            <div className="citizen-impact-row" key={item.label}>
              <span>
                <FaCircle aria-hidden="true" />
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="citizen-category-strip" aria-label="Report categories">
        {categories.map((category) => (
          <button
            aria-pressed={activeCategory === category.label}
            className={activeCategory === category.label ? 'citizen-category-chip active' : 'citizen-category-chip'}
            key={category.label}
            // Makes the dashboard category chip functional instead of only visually active.
            onClick={() => setActiveCategory(category.label)}
            type="button"
          >
            <category.icon aria-hidden="true" />
            {category.label}
          </button>
        ))}
      </section>

      <section className="citizen-nearby-card">
        <header className="nearby-header">
          <div className="nearby-title-group">
            <h2>Map Reports</h2>
            <p>Live activity in your current district</p>
          </div>
          <Link className="expand-map-button" to="/map">
            <span className="expand-map-text">
              <span>Expand</span>
              <span>Map</span>
            </span>
            <FaExpandAlt aria-hidden="true" />
          </Link>
        </header>

        <div className="citizen-map-preview">
          <div className="citizen-map-board citizen-map-board--live">
            <MapContainer
              attributionControl={false}
              center={[LAHUG_CENTER.lat, LAHUG_CENTER.lng]}
              className="home-leaflet-preview"
              dragging
              scrollWheelZoom={false}
              zoom={14}
              zoomControl={false}
            >
              <HomeMapBridge mapRef={mapRef} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {userLocation && (
                <Marker icon={HomeUserLocationMarker} position={[userLocation.lat, userLocation.lng]} />
              )}
              {nearbyReports.map((report) => (
                <Marker
                  icon={HomeReportPreviewMarker(report.urgency || report.severity)}
                  key={report.id}
                  position={[report.location.lat, report.location.lng]}
                />
              ))}
            </MapContainer>

            {nearbyReports.length === 0 && (
              <div className="citizen-map-empty-state">
                <FaMapMarkerAlt aria-hidden="true" />
                <h3>No {activeCategory.toLowerCase()} reports available.</h3>
                <p>Live district activity will appear here.</p>
              </div>
            )}

            {nearbyReports.slice(0, 2).map((report, index) => (
              <span
                className="citizen-map-label"
                key={report.id}
                style={{
                  left: index === 0 ? '26%' : '44%',
                  top: index === 0 ? '34%' : '58%'
                }}
              >
                <FaMapMarkerAlt aria-hidden="true" />
                {toDisplayText(report.issueType || report.category, 'Report')}
              </span>
            ))}
          </div>
          <Link className="citizen-map-add" to="/reports/create" aria-label="Create report">
            <FaPlus aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
