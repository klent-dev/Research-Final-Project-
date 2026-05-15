export function isValidCoordinate(location) {
  return (
    Number.isFinite(location?.latitude) &&
    Number.isFinite(location?.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
}

export function haversineDistanceMeters(origin, destination) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(destination.latitude - origin.latitude);
  const deltaLng = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadius(distanceMeters, radiusMeters) {
  return distanceMeters <= radiusMeters;
}

export function validateBrowserLocation(coords) {
  const location = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy
  };

  if (!isValidCoordinate(location)) {
    return { location: null, error: 'Invalid browser GPS coordinates.' };
  }

  if (coords.accuracy > 100) {
    return { location, error: 'GPS accuracy is too low. Move outdoors or retry.' };
  }

  return { location, error: null };
}

