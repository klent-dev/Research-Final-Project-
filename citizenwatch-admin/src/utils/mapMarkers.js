import L from 'leaflet';

const REPORT_MARKER_SIZE = [22, 28];
const REPORT_MARKER_ANCHOR = [11, 27];
const REPORT_POPUP_ANCHOR = [0, -24];

function getSeverityTone(severity = 'medium') {
  const normalized = String(severity).toLowerCase();

  if (normalized.includes('critical') || normalized.includes('high')) {
    return 'high';
  }

  if (normalized.includes('low')) {
    return 'low';
  }

  return 'medium';
}

export function ReportMapMarker(severity = 'medium', { selected = false } = {}) {
  const tone = selected ? 'selected' : getSeverityTone(severity);

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
