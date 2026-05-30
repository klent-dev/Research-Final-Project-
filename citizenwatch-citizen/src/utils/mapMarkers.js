import L from 'leaflet';
import { getSeverityTone } from './severity.js';

const REPORT_MARKER_SIZE = [22, 28];
const REPORT_MARKER_ANCHOR = [11, 27];
const REPORT_POPUP_ANCHOR = [0, -24];
const USER_MARKER_SIZE = [20, 20];
const USER_MARKER_ANCHOR = [10, 10];

export const HomePreviewMarker = L.divIcon({
  className: 'home-preview-map-marker',
  html: '',
  iconAnchor: USER_MARKER_ANCHOR,
  iconSize: USER_MARKER_SIZE
});

export const UserLocationMarker = L.divIcon({
  className: 'community-user-marker',
  html: '',
  iconAnchor: USER_MARKER_ANCHOR,
  iconSize: USER_MARKER_SIZE
});

export const HomeUserLocationMarker = UserLocationMarker;

export function HomeReportPreviewMarker(category = '') {
  return ReportMapMarker(category);
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
