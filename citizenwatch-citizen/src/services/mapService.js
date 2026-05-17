import { getMapReports } from './reportService.js';

export const DEFAULT_MAP_CENTER = {
  lng: 123.8854,
  lat: 10.3157
};

export function hasValidCoordinates(report) {
  const lat = Number(report?.location?.lat);
  const lng = Number(report?.location?.lng);

  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function normalizeReport(report) {
  return {
    ...report,
    title: report.title || `${report.category || 'Infrastructure'} Report`,
    category: report.category || 'Other',
    status: report.status || 'SUBMITTED',
    description: report.description || 'Infrastructure issue reported nearby.',
    location: {
      ...report.location,
      lat: Number(report.location.lat),
      lng: Number(report.location.lng),
      address: report.location.address || 'Location pending'
    }
  };
}

export async function loadMapReports() {
  try {
    const reports = await getMapReports();
    const validReports = reports.filter(hasValidCoordinates).map(normalizeReport);

    if (validReports.length > 0) {
      return validReports;
    }
  } catch (error) {
    console.warn('Map reports could not be loaded from Firestore.', error);
  }

  // TODO: Load reports from Firestore
  return [];
}

export function filterReports(reports, activeFilter) {
  if (activeFilter === 'All') {
    return reports;
  }

  if (activeFilter === 'Resolved') {
    return reports.filter((report) => report.status?.toUpperCase() === 'RESOLVED');
  }

  return reports.filter((report) => report.category === activeFilter);
}

export function getStatusTone(status = '') {
  const normalized = status.toUpperCase();

  if (normalized.includes('RESOLVED')) {
    return 'resolved';
  }

  if (normalized.includes('VERIFIED')) {
    return 'verified';
  }

  return 'review';
}

export function getCategoryTone(category = '') {
  const normalized = category.toLowerCase();

  if (normalized.includes('flood')) {
    return 'flood';
  }

  if (normalized.includes('street')) {
    return 'light';
  }

  if (normalized.includes('drain')) {
    return 'drainage';
  }

  if (normalized.includes('waste')) {
    return 'waste';
  }

  return 'road';
}

export function getReportDistanceKm(origin, report) {
  if (!origin || !hasValidCoordinates(report)) {
    return null;
  }

  const earthRadiusKm = 6371;
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(report.location.lat);
  const deltaLat = toRadians(report.location.lat - origin.lat);
  const deltaLng = toRadians(report.location.lng - origin.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function sortReportsByDistance(reports, origin) {
  if (!origin) {
    return reports;
  }

  return [...reports].sort((first, second) => {
    const firstDistance = getReportDistanceKm(origin, first) ?? Number.POSITIVE_INFINITY;
    const secondDistance = getReportDistanceKm(origin, second) ?? Number.POSITIVE_INFINITY;

    return firstDistance - secondDistance;
  });
}

export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return 'Distance unavailable';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

export function formatReportAge(createdAt) {
  const date = toDate(createdAt);

  if (!date) {
    return 'Recently';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
}

function toDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}
