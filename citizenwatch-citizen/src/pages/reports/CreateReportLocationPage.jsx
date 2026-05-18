import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaGavel,
  FaInfoCircle,
  FaLocationArrow,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { useReportDraft } from '../../context/ReportDraftContext.jsx';

if (L.Icon?.Default?.prototype?._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const LAHUG_CENTER = {
  lat: 10.3403,
  lng: 123.9065
};

const reportLocationIcon = L.divIcon({
  className: 'create-location-marker',
  html: '<span></span>',
  iconAnchor: [24, 24],
  iconSize: [48, 48]
});

function LocationMapBridge({ mapRef }) {
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

export default function CreateReportLocationPage() {
  const navigate = useNavigate();
  const { draft, updateLocation } = useReportDraft();
  // TODO: Connect browser Geolocation API and reverse geocoding
  const [reportLocation, setReportLocation] = useState(() => draft.location || null);
  const [locationError, setLocationError] = useState('');
  const mapRef = useRef(null);
  const hasLocation = Boolean(
    Number.isFinite(Number(reportLocation?.lat)) &&
    Number.isFinite(Number(reportLocation?.lng)) &&
    reportLocation?.address
  );
  const hasAccuracy = Number.isFinite(Number(reportLocation?.accuracy));

  function requestUserLocation() {
    if (!navigator.geolocation) {
      setLocationError('GPS is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          address: 'Location detected',
          source: 'gps',
          // TODO: Add reverse geocoding for human-readable address
          subAddress: `Lat: ${position.coords.latitude.toFixed(5)}, Lng: ${position.coords.longitude.toFixed(5)}`
        };

        setReportLocation(nextLocation);
        updateLocation(nextLocation);
        setLocationError('');
        mapRef.current?.flyTo([nextLocation.lat, nextLocation.lng], 16, {
          animate: true,
          duration: 0.8
        });
      },
      () => {
        setLocationError('Unable to access GPS. You may edit the address manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function handleConfirmLocation() {
    if (!hasLocation) {
      return;
    }

    // TODO: Connect real GPS verification and map coordinates after UI is completed
    updateLocation(reportLocation);
    navigate('/reports/create/details');
  }

  function handleEditAddress() {
    // TODO: Add manual address edit form after UI is completed
    console.log('Edit address manually clicked');
  }

  return (
    <main className="create-location-page">
      <header className="create-location-topbar">
        <Link className="create-location-back" to="/reports/create" aria-label="Back to evidence upload">
          <FaArrowLeft aria-hidden="true" />
        </Link>
        <Link className="create-location-brand" to="/home" aria-label="CitizenWatch home">
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </Link>
        <span aria-hidden="true" />
      </header>

      <section className="create-location-step" aria-label="Report creation progress">
        <div>
          <span>Step 2 of 4</span>
          <strong>Location Verification</strong>
        </div>
        <div className="create-location-progress" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="location-map-preview" aria-label="Live location map preview">
        <MapContainer
          attributionControl={false}
          center={[LAHUG_CENTER.lat, LAHUG_CENTER.lng]}
          className="create-location-leaflet-map"
          scrollWheelZoom
          zoom={14}
          zoomControl={false}
        >
          <LocationMapBridge mapRef={mapRef} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasLocation && (
            <Marker icon={reportLocationIcon} position={[reportLocation.lat, reportLocation.lng]}>
              <Popup>{reportLocation.address}</Popup>
            </Marker>
          )}
        </MapContainer>

        <div className={hasLocation ? 'gps-verified-pill' : 'gps-verified-pill gps-verified-pill--waiting'}>
          {hasLocation && <FaCheckCircle aria-hidden="true" />}
          <span>{hasLocation ? 'GPS Verified' : 'Waiting for GPS'}</span>
          {hasLocation && hasAccuracy && <strong>&plusmn; {reportLocation.accuracy}m</strong>}
        </div>

        {!hasLocation && (
          <div className="location-map-empty-state">
            <FaMapMarkerAlt aria-hidden="true" />
            <h2>Waiting for location access</h2>
            <p>Allow GPS or edit address manually to continue.</p>
            <button onClick={requestUserLocation} type="button">
              Use Current Location
            </button>
            {locationError && <small>{locationError}</small>}
          </div>
        )}
      </section>

      <section className="detected-location-card">
        <p className="detected-eyebrow">Detected Location</p>

        <div className="detected-address">
          <span>
            <FaLocationArrow aria-hidden="true" />
          </span>
          <div>
            <h1>{hasLocation ? reportLocation.address : 'Location not selected yet'}</h1>
            <p>{hasLocation ? reportLocation.subAddress : 'Your detected report location will appear here.'}</p>
          </div>
        </div>

        <div className="location-accuracy-box">
          <FaInfoCircle aria-hidden="true" />
          <p>
            Exact location data helps municipal authorities identify and respond to infrastructure issues 30% faster.
          </p>
        </div>

        <button
          className="confirm-location-button"
          disabled={!hasLocation}
          onClick={handleConfirmLocation}
          type="button"
        >
          Confirm Location
          <FaArrowRight aria-hidden="true" />
        </button>

        <button className="edit-address-button" onClick={handleEditAddress} type="button">
          Edit Address Manually
        </button>
      </section>
    </main>
  );
}
