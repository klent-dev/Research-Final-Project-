import L from 'leaflet';

const REPORT_MARKER_SIZE = [22, 28];
const REPORT_MARKER_ANCHOR = [11, 27];
const REPORT_POPUP_ANCHOR = [0, -24];

function getSeverityTone(severity = 'moderate') {
  const normalized = String(severity || '').trim().toLowerCase();

  if (normalized === 'critical' || normalized === 'high') {
    return 'critical';
  }

  if (normalized === 'minor' || normalized === 'low') {
    return 'minor';
  }

  return 'moderate';
}

export function ReportMapMarker(severity = 'moderate', { selected = false } = {}) {
  const tone = getSeverityTone(severity);

  return L.divIcon({
    className: selected
      ? `report-map-pin-marker report-map-pin-marker--${tone} report-map-pin-marker--selected`
      : `report-map-pin-marker report-map-pin-marker--${tone}`,
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
