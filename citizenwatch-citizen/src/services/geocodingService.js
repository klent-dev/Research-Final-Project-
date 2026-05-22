const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

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
