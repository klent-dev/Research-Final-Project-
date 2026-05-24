const EARTH_RADIUS_METERS = 6371000;

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

function normalizeAccuracy(location = {}) {
  const accuracy = Number(location?.accuracy);
  return Number.isFinite(accuracy) ? Math.round(accuracy) : null;
}

function getAccuracyLabel(accuracy) {
  if (!Number.isFinite(Number(accuracy))) {
    return 'Unavailable';
  }

  if (accuracy <= 15) return 'Excellent';
  if (accuracy <= 50) return 'Good';
  if (accuracy <= 100) return 'Weak';
  return 'Poor';
}

function getValidationBand(distanceMeters) {
  if (!Number.isFinite(Number(distanceMeters))) {
    return null;
  }

  if (distanceMeters <= 20) {
    return {
      status: 'verified',
      tone: 'success',
      label: 'Location Verified',
      message: 'Photo GPS matches current device location.',
      helper: `Photo GPS and device GPS are ${distanceMeters}m apart.`
    };
  }

  if (distanceMeters <= 100) {
    return {
      status: 'good',
      tone: 'success',
      label: 'Good Location Match',
      message: 'Photo GPS is close to current device location.',
      helper: `Photo GPS and device GPS are ${distanceMeters}m apart.`
    };
  }

  if (distanceMeters <= 500) {
    return {
      status: 'needs_review',
      tone: 'warning',
      label: 'Needs Review',
      message: 'Photo location differs from device location.',
      helper: `Photo GPS and device GPS are ${distanceMeters}m apart. LGU review is recommended.`
    };
  }

  return {
    status: 'suspicious',
    tone: 'danger',
    label: 'Location Mismatch',
    message: 'Photo location is far from current device location.',
    helper: `Photo GPS and device GPS are ${distanceMeters}m apart. This report should be reviewed.`
  };
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

export function getGpsAccuracyLevel(accuracy) {
  const numericAccuracy = Number(accuracy);

  if (!Number.isFinite(numericAccuracy)) {
    return {
      label: 'Unavailable',
      tone: 'neutral'
    };
  }

  return {
    label: getAccuracyLabel(numericAccuracy),
    tone:
      numericAccuracy <= 50
        ? 'success'
        : numericAccuracy <= 100
          ? 'warning'
          : 'danger'
  };
}

export function calculateVerificationScore({
  exifLocation,
  deviceLocation,
  distanceMeters,
  directCameraCapture = false
} = {}) {
  const exifPoint = normalizePoint(exifLocation);
  const devicePoint = normalizePoint(deviceLocation);
  const gpsAccuracy = normalizeAccuracy(deviceLocation);
  let score = 0;

  if (exifPoint) score += 40;
  if (directCameraCapture) score += 20;
  if (devicePoint) score += 20;
  if (Number.isFinite(Number(distanceMeters)) && distanceMeters < 20) score += 10;
  if (Number.isFinite(gpsAccuracy) && gpsAccuracy < 15) score += 10;

  return Math.max(0, Math.min(100, score));
}

export function validatePhotoLocation({
  exifLocation,
  deviceLocation,
  manualLocation,
  selectedLocation,
  directCameraCapture = false,
  exif = {}
} = {}) {
  const exifPoint = normalizePoint(exifLocation);
  const devicePoint = normalizePoint(deviceLocation);
  const manualPoint = normalizePoint(manualLocation);
  const selectedSource = selectedLocation?.source || '';
  const gpsAccuracy = normalizeAccuracy(deviceLocation);
  const distanceMeters = exifPoint && devicePoint ? calculateDistanceMeters(exifPoint, devicePoint) : null;
  const verificationScore = calculateVerificationScore({
    exifLocation: exifPoint,
    deviceLocation: devicePoint,
    distanceMeters,
    directCameraCapture
  });
  const hasTimestamp = Boolean(exif?.hasTimestamp || exif?.timestamp);
  const source = exifPoint ? 'photo_gps' : devicePoint ? 'device_gps' : manualPoint || selectedSource === 'manual' ? 'manual' : 'none';
  let result;

  if (exifPoint && devicePoint) {
    result = {
      ...getValidationBand(distanceMeters),
      source: 'exif_device_comparison'
    };
  } else if (exifPoint) {
    result = {
      status: 'needs_review',
      tone: 'warning',
      label: 'Needs Review',
      message: 'Photo GPS detected, but device GPS is unavailable.',
      helper: 'The photo location cannot be fully verified until it is compared with current device GPS.',
      source: 'exif_only'
    };
  } else if (devicePoint) {
    result = {
      status: 'device_gps',
      tone: 'warning',
      label: 'Device GPS',
      message: 'Using current device location.',
      helper: 'No photo GPS was found. Device GPS is being used as a fallback.',
      source: 'device_only'
    };
  } else if (manualPoint || selectedSource === 'manual') {
    result = {
      status: 'manual_location',
      tone: 'warning',
      label: 'Manual Location',
      message: 'Manual location selected.',
      helper: 'Manual locations should be reviewed by LGU staff.',
      source: 'manual'
    };
  } else {
    result = {
      status: 'unavailable',
      tone: 'neutral',
      label: 'Location Unavailable',
      message: 'No photo GPS or device GPS is available yet.',
      helper: 'Allow GPS or enter location manually to continue.',
      source: 'none'
    };
  }

  const requiresReview = (
    !exifPoint ||
    source === 'manual' ||
    (Number.isFinite(Number(distanceMeters)) && distanceMeters > 100) ||
    (Number.isFinite(Number(gpsAccuracy)) && gpsAccuracy > 50) ||
    !hasTimestamp ||
    ['needs_review', 'suspicious', 'device_gps', 'manual_location'].includes(result.status)
  );

  return {
    ...result,
    distanceMeters,
    photoGps: exifPoint,
    deviceGps: devicePoint,
    gpsAccuracy,
    gpsAccuracyLabel: getAccuracyLabel(gpsAccuracy),
    verificationScore,
    verificationStatus: result.status,
    requiresReview,
    hasExifGps: Boolean(exifPoint),
    hasDeviceGps: Boolean(devicePoint),
    hasTimestamp,
    checkedAt: new Date().toISOString()
  };
}
