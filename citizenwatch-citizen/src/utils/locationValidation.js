const EARTH_RADIUS_METERS = 6371000;
const VERIFIED_DISTANCE_METERS = 50;
const REVIEW_DISTANCE_METERS = 200;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function normalizePoint(point = {}) {
  if (!point || typeof point !== 'object') {
    return null;
  }

  const lat = Number(point.lat ?? point.latitude);
  const lng = Number(point.lng ?? point.longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return { lat, lng };
}

export function calculateDistanceMeters(pointA, pointB) {
  const firstPoint = normalizePoint(pointA);
  const secondPoint = normalizePoint(pointB);

  if (!firstPoint || !secondPoint) {
    return null;
  }

  const latDifference = toRadians(secondPoint.lat - firstPoint.lat);
  const lngDifference = toRadians(secondPoint.lng - firstPoint.lng);
  const firstLat = toRadians(firstPoint.lat);
  const secondLat = toRadians(secondPoint.lat);

  const haversine =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDifference / 2) ** 2;

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(EARTH_RADIUS_METERS * centralAngle);
}

export function validatePhotoLocation({
  exifLocation,
  deviceLocation,
  manualLocation,
  selectedLocation
} = {}) {
  const exifPoint = normalizePoint(exifLocation);
  const devicePoint = normalizePoint(deviceLocation);
  const manualPoint = normalizePoint(manualLocation);
  const selectedSource = selectedLocation?.source || '';

  if (exifPoint && devicePoint) {
    const distanceMeters = calculateDistanceMeters(exifPoint, devicePoint);

    if (distanceMeters <= VERIFIED_DISTANCE_METERS) {
      return {
        status: 'verified',
        tone: 'success',
        label: 'Location Verified',
        message: 'Photo GPS matches current device location.',
        helper: `EXIF and device GPS are ${distanceMeters}m apart.`,
        distanceMeters,
        source: 'exif_device_match',
        checkedAt: new Date().toISOString()
      };
    }

    if (distanceMeters <= REVIEW_DISTANCE_METERS) {
      return {
        status: 'needs_review',
        tone: 'warning',
        label: 'Needs Review',
        message: 'Photo GPS is close to current device location.',
        helper: `EXIF and device GPS are ${distanceMeters}m apart.`,
        distanceMeters,
        source: 'exif_device_nearby',
        checkedAt: new Date().toISOString()
      };
    }

    return {
      status: 'suspicious',
      tone: 'danger',
      label: 'Location Mismatch',
      message: 'Photo GPS is far from current device location.',
      helper: `EXIF and device GPS are ${distanceMeters}m apart.`,
      distanceMeters,
      source: 'exif_device_mismatch',
      checkedAt: new Date().toISOString()
    };
  }

  if (exifPoint) {
    return {
      status: 'photo_gps_detected',
      tone: 'success',
      label: 'Photo GPS Detected',
      message: 'Using location extracted from uploaded photo.',
      helper: 'Device GPS is not available for distance comparison yet.',
      distanceMeters: null,
      source: 'exif_only',
      checkedAt: new Date().toISOString()
    };
  }

  if (devicePoint) {
    return {
      status: 'device_gps',
      tone: 'warning',
      label: 'Device GPS',
      message: 'No photo GPS found. Using current device location.',
      helper: 'Photos taken directly from the camera usually include GPS metadata.',
      distanceMeters: null,
      source: 'device_only',
      checkedAt: new Date().toISOString()
    };
  }

  if (manualPoint || selectedSource === 'manual') {
    return {
      status: 'manual_location',
      tone: 'warning',
      label: 'Manual Location',
      message: 'Location was entered manually.',
      helper: 'Manual locations should be reviewed by LGU staff.',
      distanceMeters: null,
      source: 'manual',
      checkedAt: new Date().toISOString()
    };
  }

  if (selectedSource === 'test') {
    return {
      status: 'test_location',
      tone: 'warning',
      label: 'Testing Location',
      message: 'Temporary testing location selected.',
      helper: 'Use real GPS before production deployment.',
      distanceMeters: null,
      source: 'test',
      checkedAt: new Date().toISOString()
    };
  }

  return {
    status: 'unavailable',
    tone: 'neutral',
    label: 'Location Unavailable',
    message: 'No photo GPS or device GPS is available yet.',
    helper: 'Allow GPS or enter location manually to continue.',
    distanceMeters: null,
    source: 'none',
    checkedAt: new Date().toISOString()
  };
}
