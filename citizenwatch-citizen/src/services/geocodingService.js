const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

function normalizeQuery(address) {
  const trimmedAddress = String(address || '').trim();

  if (!trimmedAddress) {
    return '';
  }

  const lowerAddress = trimmedAddress.toLowerCase();
  const hasPhilippinesContext =
    lowerAddress.includes('philippines') ||
    lowerAddress.includes('cebu') ||
    lowerAddress.includes('lahug');

  return hasPhilippinesContext ? trimmedAddress : `${trimmedAddress}, Cebu City, Philippines`;
}

function normalizeGeocodeResult(result) {
  const lat = Number(result?.lat);
  const lng = Number(result?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    accuracy: null,
    address: result.display_name || 'Manual location selected',
    source: 'manual',
    subAddress: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
  };
}

function normalizeReverseGeocodeResult(result, fallbackLocation = {}) {
  const lat = Number(result?.lat ?? fallbackLocation.lat);
  const lng = Number(result?.lon ?? fallbackLocation.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    ...fallbackLocation,
    lat,
    lng,
    address: result?.display_name || fallbackLocation.address || 'Location detected',
    subAddress: fallbackLocation.subAddress || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
  };
}

export async function geocodeAddress(address) {
  const query = normalizeQuery(address);

  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    limit: '1',
    addressdetails: '1',
    countrycodes: 'ph'
  });

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Unable to geocode address.');
  }

  const results = await response.json();
  return normalizeGeocodeResult(results?.[0]);
}

export async function reverseGeocodeLocation(location = {}) {
  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1'
  });

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Unable to reverse geocode location.');
  }

  const result = await response.json();
  return normalizeReverseGeocodeResult(result, location);
}
