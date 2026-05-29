import L from 'leaflet';
import { getSeverityTone } from './severity.js';

const REPORT_MARKER_SIZE = [22, 28];
const REPORT_MARKER_ANCHOR = [11, 27];
const REPORT_POPUP_ANCHOR = [0, -24];
const HOME_MARKER_SIZE = [16, 16];
const HOME_MARKER_ANCHOR = [8, 8];

export const HomePreviewMarker = L.divIcon({
  className: 'home-preview-map-marker',
  html: '',
  iconAnchor: HOME_MARKER_ANCHOR,
  iconSize: HOME_MARKER_SIZE
});

export const HomeUserLocationMarker = L.divIcon({
  className: 'home-user-map-marker',
  html: '',
  iconAnchor: HOME_MARKER_ANCHOR,
  iconSize: HOME_MARKER_SIZE
});

function getHomeCategoryTone(category = '') {
  const normalized = String(category).toLowerCase();

  if (normalized.includes('drain') || normalized.includes('sewage') || normalized.includes('water')) {
    return 'drainage';
  }

  if (normalized.includes('street') || normalized.includes('light')) {
    return 'light';
  }

  if (normalized.includes('flood')) {
    return 'flood';
  }

  if (normalized.includes('waste') || normalized.includes('trash') || normalized.includes('garbage')) {
    return 'waste';
  }

  return 'other';
}

export function HomeReportPreviewMarker(category = '') {
  return L.divIcon({
    className: `home-preview-map-marker home-preview-map-marker--${getHomeCategoryTone(category)}`,
    html: '',
    iconAnchor: HOME_MARKER_ANCHOR,
    iconSize: HOME_MARKER_SIZE
  });
}

export function ReportMapMarker(urgency = 'Moderate') {
  const tone = getSeverityTone(urgency);

  return L.divIcon({
    className: `report-map-pin-marker report-map-pin-marker--${tone}`,
    html: `
      <span class="report-severity-pin" aria-hidden="true">
        <span class="report-severity-pin__stem"></span>
        <span class="report-severity-pin__head">
          <span class="report-severity-pin__dot"></span>
        </span>
      </span>
    `,
    iconAnchor: REPORT_MARKER_ANCHOR,
    iconSize: REPORT_MARKER_SIZE,
    popupAnchor: REPORT_POPUP_ANCHOR
  });
}

export const getMarkerBySeverity = ReportMapMarker;
