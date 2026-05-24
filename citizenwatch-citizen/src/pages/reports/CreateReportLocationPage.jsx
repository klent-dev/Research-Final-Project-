import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGavel,
  FaInfoCircle,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaRedo
} from 'react-icons/fa';
import { useReportDraft } from '../../context/ReportDraftContext.jsx';
import { geocodeAddress, reverseGeocodeLocation } from '../../services/geocodingService.js';
import { geolocationErrorMessage, getBestDevicePosition, normalizePositionLocation } from '../../utils/deviceLocation.js';
import { getGpsAccuracyLevel, validatePhotoLocation } from '../../utils/locationValidation.js';
import { getMarkerBySeverity } from '../../utils/mapMarkers.js';

const LAHUG_CENTER = {
  lat: 10.3403,
  lng: 123.9065
};

function LocationMapBridge({ location, mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(resizeTimer);
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

function ManualPinMapEvents({ onManualPin }) {
  useMapEvents({
    click(event) {
      onManualPin?.(event.latlng);
    }
  });

  return null;
}

function SafeCreateLocationMap({ reportLocation, hasLocation, mapRef, onManualPin }) {
  try {
    return (
      <MapContainer
        attributionControl={false}
        center={[LAHUG_CENTER.lat, LAHUG_CENTER.lng]}
        className="create-location-leaflet-map"
        scrollWheelZoom
        zoom={14}
        zoomControl={false}
      >
        <LocationMapBridge location={reportLocation} mapRef={mapRef} />
        <ManualPinMapEvents onManualPin={onManualPin} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasLocation && (
          <Marker icon={getMarkerBySeverity('Minor')} position={[reportLocation.lat, reportLocation.lng]}>
            <Popup>{reportLocation.address}</Popup>
          </Marker>
        )}
      </MapContainer>
    );
  } catch (error) {
    console.warn('Create report location map failed to render.', error);
    return (
      <div className="create-location-map-fallback">
        <FaMapMarkerAlt aria-hidden="true" />
        <p>Map preview is unavailable.</p>
      </div>
    );
  }
}

function hasValidLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
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
  const exifAccuracy = Number(draft?.exif?.gps?.accuracy);

  if (!draft?.hasExifGps || !Number.isFinite(exifLat) || !Number.isFinite(exifLng)) {
    return null;
  }

  return {
    lat: exifLat,
    lng: exifLng,
    accuracy: Number.isFinite(exifAccuracy) ? Math.round(exifAccuracy) : null,
    address: 'Photo location detected',
    source: 'exif',
    // TODO: Add reverse geocoding for human-readable EXIF photo address
    subAddress: `Lat: ${exifLat.toFixed(5)}, Lng: ${exifLng.toFixed(5)}`
  };
}

export default function CreateReportLocationPage() {
  const navigate = useNavigate();
  const { draft, updateDraft, updateLocation } = useReportDraft();
  // TODO: Add reverse geocoding for human-readable address
  const [reportLocation, setReportLocation] = useState(() => (
    normalizeSelectedLocation(draft.location) || createExifLocation(draft)
  ));
  const [deviceLocation, setDeviceLocation] = useState(() => (
    normalizeSelectedLocation(draft.deviceLocation) || null
  ));
  const [locationValidation, setLocationValidation] = useState(() => (
    draft.locationValidation?.status
      ? draft.locationValidation
      : validatePhotoLocation({
        exifLocation: createExifLocation(draft),
        deviceLocation: draft.deviceLocation,
        manualLocation: draft.location?.source === 'manual' ? draft.location : null,
        selectedLocation: draft.location,
        directCameraCapture: Boolean(draft.directCameraCapture),
        exif: draft.exif
      })
  ));
  const [isManualAddressOpen, setIsManualAddressOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState(() => draft.location?.source === 'manual' ? draft.location.address : '');
  const [isGeocodingManualAddress, setIsGeocodingManualAddress] = useState(false);
  const [isResolvingMapPin, setIsResolvingMapPin] = useState(false);
  const [locationError, setLocationError] = useState('');
  const mapRef = useRef(null);
  const hasRequestedBrowserLocationRef = useRef(false);
  const hasPhoto = Boolean(draft.photoPreview);
  const hasLocation = hasValidLocation(reportLocation);
  const isGpsLocation = reportLocation?.source === 'gps';
  const isExifLocation = reportLocation?.source === 'exif';
  const hasAccuracy = Number.isFinite(Number(reportLocation?.accuracy));
  const gpsAccuracyLevel = getGpsAccuracyLevel(deviceLocation?.accuracy ?? reportLocation?.accuracy);
  const LocationValidationIcon = ['danger', 'warning'].includes(locationValidation?.tone)
    ? FaExclamationTriangle
    : FaCheckCircle;

  const updateLocationValidationState = useCallback(({
    nextExifLocation = createExifLocation(draft),
    nextDeviceLocation = deviceLocation,
    nextSelectedLocation = reportLocation
  } = {}) => {
    const nextValidation = validatePhotoLocation({
      exifLocation: nextExifLocation,
      deviceLocation: nextDeviceLocation,
      manualLocation: nextSelectedLocation?.source === 'manual' ? nextSelectedLocation : null,
      selectedLocation: nextSelectedLocation,
      directCameraCapture: Boolean(draft.directCameraCapture),
      exif: draft.exif
    });

    setLocationValidation(nextValidation);
    updateDraft({
      deviceLocation: nextDeviceLocation || null,
      locationValidation: nextValidation
    });

    return nextValidation;
  }, [deviceLocation, draft, reportLocation, updateDraft]);

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

  const enrichLocationAddress = useCallback(async (locationData) => {
    try {
      return await reverseGeocodeLocation(locationData) || locationData;
    } catch (error) {
      console.warn('Reverse geocoding failed.', error);
      return locationData;
    }
  }, []);

  const applySelectedLocation = useCallback(({
    nextLocation,
    nextDeviceLocation = deviceLocation,
    nextExifLocation = createExifLocation(draft)
  }) => {
    const normalizedLocation = normalizeSelectedLocation(nextLocation);

    if (!normalizedLocation) {
      return;
    }

    setReportLocation(normalizedLocation);
    updateLocation(normalizedLocation);
    updateLocationValidationState({
      nextExifLocation,
      nextDeviceLocation,
      nextSelectedLocation: normalizedLocation
    });
    mapRef.current?.flyTo([normalizedLocation.lat, normalizedLocation.lng], normalizedLocation.source === 'manual' ? 17 : 16, {
      animate: true,
      duration: 0.8
    });
  }, [deviceLocation, draft, updateLocation, updateLocationValidationState]);

  const requestUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('GPS is not supported by this browser. Please enter the address manually.');
      return;
    }

    try {
      const position = await getBestDevicePosition({
        sampleMs: 8000,
        timeout: 16000,
        targetAccuracy: 25
      });
      const sampledLocation = normalizePositionLocation(position, 'gps');

      if (sampledLocation) {
        const nextLocation = await enrichLocationAddress({
          ...sampledLocation,
          gpsAccuracyLabel: getGpsAccuracyLevel(sampledLocation.accuracy).label
        });
        const normalizedDeviceLocation = normalizeSelectedLocation(nextLocation);

        setDeviceLocation(normalizedDeviceLocation);
        setLocationError('');

        const exifLocation = createExifLocation(draft);

        applySelectedLocation({
          nextLocation: exifLocation || normalizedDeviceLocation,
          nextDeviceLocation: normalizedDeviceLocation,
          nextExifLocation: exifLocation
        });
      }
    } catch (error) {
        const exifLocation = createExifLocation(draft);

        if (exifLocation) {
          const resolvedExifLocation = await enrichLocationAddress(exifLocation);
          applySelectedLocation({
            nextLocation: resolvedExifLocation,
            nextDeviceLocation: null,
            nextExifLocation: resolvedExifLocation
          });
          setLocationError('Device GPS unavailable. Photo GPS is being used for this report.');
          return;
        }

        setReportLocation(null);
        updateLocation(null);
        updateLocationValidationState({
          nextExifLocation: null,
          nextDeviceLocation: null,
          nextSelectedLocation: null
        });
        setLocationError(geolocationErrorMessage(error));
    }
  }, [applySelectedLocation, draft, enrichLocationAddress, updateLocation, updateLocationValidationState]);

  const handleManualMapPin = useCallback(async (latlng) => {
    if (!latlng) {
      return;
    }

    const manualPinLocation = {
      lat: latlng.lat,
      lng: latlng.lng,
      accuracy: null,
      address: 'Manual map pin selected',
      source: 'manual',
      subAddress: `Lat: ${latlng.lat.toFixed(5)}, Lng: ${latlng.lng.toFixed(5)}`
    };

    setIsResolvingMapPin(true);
    setLocationError('');

    try {
      const resolvedLocation = await enrichLocationAddress(manualPinLocation);

      applySelectedLocation({
        nextLocation: {
          ...resolvedLocation,
          source: 'manual'
        },
        nextDeviceLocation: deviceLocation,
        nextExifLocation: createExifLocation(draft)
      });
      setManualAddress(resolvedLocation.address || '');
      setIsManualAddressOpen(false);
    } finally {
      setIsResolvingMapPin(false);
    }
  }, [applySelectedLocation, deviceLocation, draft, enrichLocationAddress]);

  useEffect(() => {
    if (hasPhoto && !hasRequestedBrowserLocationRef.current) {
      hasRequestedBrowserLocationRef.current = true;
      requestUserLocation();
    }
  }, [hasPhoto, requestUserLocation]);

  useEffect(() => {
    if (!hasPhoto) {
      return;
    }

    const exifLocation = createExifLocation(draft);

    if (!hasValidLocation(reportLocation) && exifLocation) {
      const normalizedLocation = normalizeSelectedLocation(exifLocation);
      setReportLocation(normalizedLocation);
      updateLocation(normalizedLocation);
      updateLocationValidationState({
        nextExifLocation: normalizedLocation,
        nextDeviceLocation: deviceLocation,
        nextSelectedLocation: normalizedLocation
      });
      setLocationError('');
      mapRef.current?.flyTo([normalizedLocation.lat, normalizedLocation.lng], 16, {
        animate: true,
        duration: 0.8
      });
    }

    if (hasValidLocation(reportLocation) && reportLocation.source === 'exif' && !hasValidLocation(draft.location)) {
      updateLocation(normalizeSelectedLocation(reportLocation));
      updateLocationValidationState({
        nextExifLocation: reportLocation,
        nextDeviceLocation: deviceLocation,
        nextSelectedLocation: reportLocation
      });
    }
  }, [deviceLocation, draft, hasPhoto, reportLocation, updateLocation, updateLocationValidationState]);

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
    updateLocationValidationState({
      nextExifLocation: createExifLocation(draft),
      nextDeviceLocation: deviceLocation,
      nextSelectedLocation: reportLocation
    });
    navigate('/reports/create/details');
  }

  function handleEditAddress() {
    setIsManualAddressOpen((isOpen) => !isOpen);
  }

  async function handleManualLocationSubmit(event) {
    event.preventDefault();

    const trimmedAddress = manualAddress.trim();
    if (!trimmedAddress) {
      setLocationError('Please enter an address to continue.');
      return;
    }

    setIsGeocodingManualAddress(true);
    setLocationError('');

    try {
      const nextLocation = await geocodeAddress(trimmedAddress);

      if (!nextLocation) {
        setLocationError('Address not found. Please add a nearby landmark, barangay, or city.');
        return;
      }

      const normalizedLocation = normalizeSelectedLocation(nextLocation);
      setReportLocation(normalizedLocation);
      updateLocation(normalizedLocation);
      updateLocationValidationState({
        nextExifLocation: createExifLocation(draft),
        nextDeviceLocation: deviceLocation,
        nextSelectedLocation: normalizedLocation
      });
      setIsManualAddressOpen(false);
      mapRef.current?.flyTo([normalizedLocation.lat, normalizedLocation.lng], 15, {
        animate: true,
        duration: 0.8
      });
    } catch (error) {
      console.warn('Manual address geocoding failed.', error);
      setLocationError('Unable to find this address right now. Please check your connection and try again.');
    } finally {
      setIsGeocodingManualAddress(false);
    }
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
        <SafeCreateLocationMap
          hasLocation={hasLocation}
          mapRef={mapRef}
          onManualPin={handleManualMapPin}
          reportLocation={reportLocation}
        />

        <div className={hasLocation ? 'gps-verified-pill' : 'gps-verified-pill gps-verified-pill--waiting'}>
          {hasLocation && <FaCheckCircle aria-hidden="true" />}
          <span>
            {hasLocation
              ? isExifLocation
                ? 'Photo GPS detected'
                : isGpsLocation
                  ? 'Using current device location'
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
            <small>Tap anywhere on the map to drop a manual pin.</small>
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
            Tap the map to drop a manual pin, or use GPS for a precise device reading.
          </p>
        </div>

        {isResolvingMapPin && (
          <div className="location-validation-card location-validation-card--neutral">
            <FaInfoCircle aria-hidden="true" />
            <div>
              <span>Map Pin</span>
              <strong>Resolving selected map location...</strong>
              <p>The selected coordinates will be saved with the closest readable address.</p>
            </div>
          </div>
        )}

        <div className={`location-validation-card location-validation-card--${locationValidation?.tone || 'neutral'}`}>
          <LocationValidationIcon aria-hidden="true" />
          <div>
            <span>{locationValidation?.label || 'Location Validation'}</span>
            <strong>{locationValidation?.message || 'Waiting for location validation.'}</strong>
            <p>{locationValidation?.helper || 'Upload a photo and allow GPS to compare location accuracy.'}</p>
          </div>
        </div>

        {!hasLocation && (
          <div className="location-validation-card location-validation-card--warning">
            <FaInfoCircle aria-hidden="true" />
            <div>
              <span>Enable GPS for accurate reporting</span>
              <strong>Location access is needed when photo GPS is unavailable.</strong>
              <p>Turn on Location Services, enable Camera Location Tags, allow browser location permission, then retry GPS.</p>
              <button className="retry-gps-button" onClick={requestUserLocation} type="button">
                <FaRedo aria-hidden="true" />
                Retry GPS
              </button>
            </div>
          </div>
        )}

        {hasLocation && isGpsLocation && (
          <div className={`location-validation-card location-validation-card--${gpsAccuracyLevel.tone}`}>
            <FaLocationArrow aria-hidden="true" />
            <div>
              <span>GPS Accuracy</span>
              <strong>{gpsAccuracyLevel.label}{hasAccuracy ? ` (+/- ${reportLocation.accuracy}m)` : ''}</strong>
              {Number(reportLocation.accuracy) > 100 ? (
                <p>Weak GPS signal. Move outdoors or tap Retry GPS.</p>
              ) : (
                <p>Device GPS is being used as the report location fallback.</p>
              )}
              {Number(reportLocation.accuracy) > 50 && (
                <button className="retry-gps-button" onClick={requestUserLocation} type="button">
                  <FaRedo aria-hidden="true" />
                  Retry GPS
                </button>
              )}
            </div>
          </div>
        )}

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
            <button disabled={isGeocodingManualAddress} type="submit">
              {isGeocodingManualAddress ? 'Finding Address...' : 'Use This Address'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
