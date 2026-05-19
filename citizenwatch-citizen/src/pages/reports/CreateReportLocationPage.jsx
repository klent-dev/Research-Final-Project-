import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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
import { getMarkerBySeverity } from '../../utils/mapMarkers.js';

const LAHUG_CENTER = {
  lat: 10.3403,
  lng: 123.9065
};

function createTestLocation() {
  return {
    lat: LAHUG_CENTER.lat,
    lng: LAHUG_CENTER.lng,
    accuracy: null,
    address: 'Test location - Lahug, Cebu City',
    source: 'test',
    subAddress: 'Temporary testing location'
  };
}

function LocationMapBridge({ location, mapRef }) {
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
    if (hasValidLocation(location)) {
      map.flyTo([location.lat, location.lng], 16, {
        animate: true,
        duration: 0.8
      });
    }
  }, [location, map]);

  return null;
}

function hasValidLocation(location) {
  return (
    Number.isFinite(Number(location?.lat)) &&
    Number.isFinite(Number(location?.lng))
  );
}

function normalizeSelectedLocation(location) {
  if (!hasValidLocation(location)) {
    return null;
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);
  const source = location.source || 'gps';

  return {
    ...location,
    lat,
    lng,
    accuracy: Number.isFinite(Number(location.accuracy)) ? Math.round(Number(location.accuracy)) : null,
    address:
      location.address ||
      (source === 'exif'
        ? 'Photo location detected'
        : source === 'manual'
          ? 'Manual location selected'
          : 'Location detected'),
    source,
    subAddress: location.subAddress || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
  };
}

function createExifLocation(draft) {
  const exifLat = Number(draft?.exifLat);
  const exifLng = Number(draft?.exifLng);

  if (!draft?.hasExifGps || !Number.isFinite(exifLat) || !Number.isFinite(exifLng)) {
    return null;
  }

  return {
    lat: exifLat,
    lng: exifLng,
    accuracy: null,
    address: 'Photo location detected',
    source: 'exif',
    // TODO: Add reverse geocoding for human-readable EXIF photo address
    subAddress: `Lat: ${exifLat.toFixed(5)}, Lng: ${exifLng.toFixed(5)}`
  };
}

export default function CreateReportLocationPage() {
  const navigate = useNavigate();
  const { draft, updateLocation } = useReportDraft();
  // TODO: Connect browser Geolocation API and reverse geocoding
  // TODO: Compare EXIF GPS with browser GPS for validation scoring
  const [reportLocation, setReportLocation] = useState(() => (
    normalizeSelectedLocation(draft.location) || createExifLocation(draft)
  ));
  const [isManualAddressOpen, setIsManualAddressOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState(() => draft.location?.source === 'manual' ? draft.location.address : '');
  const [locationError, setLocationError] = useState('');
  const mapRef = useRef(null);
  const hasRequestedBrowserLocationRef = useRef(false);
  const hasPhoto = Boolean(draft.photoPreview);
  const hasLocation = hasValidLocation(reportLocation);
  const isGpsLocation = reportLocation?.source === 'gps';
  const isExifLocation = reportLocation?.source === 'exif';
  const hasAccuracy = Number.isFinite(Number(reportLocation?.accuracy));

  useEffect(() => {
    if (!hasPhoto) {
      navigate('/reports/create', {
        replace: true,
        state: {
          validationError: 'Please upload or capture a photo before continuing.'
        }
      });
    }
  }, [hasPhoto, navigate]);

  const requestUserLocation = useCallback(() => {
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

        const normalizedLocation = normalizeSelectedLocation(nextLocation);
        setReportLocation(normalizedLocation);
        updateLocation(normalizedLocation);
        setLocationError('');
        mapRef.current?.flyTo([normalizedLocation.lat, normalizedLocation.lng], 16, {
          animate: true,
          duration: 0.8
        });
      },
      () => {
        const fallbackLocation = normalizeSelectedLocation(createTestLocation());
        setReportLocation(fallbackLocation);
        updateLocation(fallbackLocation);
        setLocationError('GPS unavailable. A temporary test location was selected.');
        mapRef.current?.flyTo([fallbackLocation.lat, fallbackLocation.lng], 15, {
          animate: true,
          duration: 0.8
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [updateLocation]);

  useEffect(() => {
    const hasExifLocation = Boolean(createExifLocation(draft));

    if (hasPhoto && !hasLocation && !hasExifLocation && !hasRequestedBrowserLocationRef.current) {
      hasRequestedBrowserLocationRef.current = true;
      requestUserLocation();
    }
  }, [draft, hasLocation, hasPhoto, requestUserLocation]);

  useEffect(() => {
    if (!hasPhoto) {
      return;
    }

    const exifLocation = createExifLocation(draft);

    if (!hasValidLocation(reportLocation) && exifLocation) {
      const normalizedLocation = normalizeSelectedLocation(exifLocation);
      setReportLocation(normalizedLocation);
      updateLocation(normalizedLocation);
      setLocationError('');
      mapRef.current?.flyTo([normalizedLocation.lat, normalizedLocation.lng], 16, {
        animate: true,
        duration: 0.8
      });
    }

    if (hasValidLocation(reportLocation) && reportLocation.source === 'exif' && !hasValidLocation(draft.location)) {
      updateLocation(normalizeSelectedLocation(reportLocation));
    }
  }, [draft, hasPhoto, reportLocation, updateLocation]);

  useEffect(() => {
    if (hasLocation) {
      mapRef.current?.flyTo([reportLocation.lat, reportLocation.lng], 16, {
        animate: true,
        duration: 0.8
      });
    }
  }, [hasLocation, reportLocation]);

  function handleConfirmLocation() {
    if (!hasLocation) {
      setLocationError('Please allow GPS or enter location manually to continue.');
      return;
    }

    // TODO: Connect real GPS verification and map coordinates after UI is completed
    updateLocation(normalizeSelectedLocation(reportLocation));
    navigate('/reports/create/details');
  }

  function handleEditAddress() {
    setIsManualAddressOpen((isOpen) => !isOpen);
  }

  function handleManualLocationSubmit(event) {
    event.preventDefault();

    const trimmedAddress = manualAddress.trim();
    if (!trimmedAddress) {
      setLocationError('Please enter an address to continue.');
      return;
    }

    const nextLocation = {
      lat: LAHUG_CENTER.lat,
      lng: LAHUG_CENTER.lng,
      accuracy: null,
      address: trimmedAddress,
      source: 'manual',
      // TODO: Add reverse geocoding for manual address coordinates
      subAddress: 'Manual address entry'
    };

    const normalizedLocation = normalizeSelectedLocation(nextLocation);
    setReportLocation(normalizedLocation);
    updateLocation(normalizedLocation);
    setLocationError('');
    setIsManualAddressOpen(false);
    mapRef.current?.flyTo([normalizedLocation.lat, normalizedLocation.lng], 15, {
      animate: true,
      duration: 0.8
    });
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
          <LocationMapBridge location={reportLocation} mapRef={mapRef} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasLocation && (
            <Marker icon={getMarkerBySeverity('Low')} position={[reportLocation.lat, reportLocation.lng]}>
              <Popup>{reportLocation.address}</Popup>
            </Marker>
          )}
        </MapContainer>

        <div className={hasLocation ? 'gps-verified-pill' : 'gps-verified-pill gps-verified-pill--waiting'}>
          {hasLocation && <FaCheckCircle aria-hidden="true" />}
          <span>
            {hasLocation
              ? isExifLocation
                ? 'Photo GPS detected'
                : isGpsLocation
                  ? 'Using current device location'
                  : reportLocation?.source === 'test'
                    ? 'Test location selected'
                    : 'Manual location selected'
              : 'Waiting for GPS'}
          </span>
          {hasLocation && isGpsLocation && hasAccuracy && <strong>&plusmn; {reportLocation.accuracy}m</strong>}
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

        {!hasLocation && (
          <p className="create-step-error">Please allow GPS or enter location manually to continue.</p>
        )}

        <button className="edit-address-button" onClick={handleEditAddress} type="button">
          Edit Address Manually
        </button>

        {isManualAddressOpen && (
          <form className="manual-address-form" onSubmit={handleManualLocationSubmit}>
            <label htmlFor="manual-address">Manual Address</label>
            <input
              id="manual-address"
              onChange={(event) => {
                setManualAddress(event.target.value);
                setLocationError('');
              }}
              placeholder="Enter report location"
              type="text"
              value={manualAddress}
            />
            <button type="submit">Use This Address</button>
          </form>
        )}
      </section>
    </main>
  );
}
