import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClipboardCheck,
  FaExclamationCircle,
  FaEye,
  FaFileAlt,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaRoute
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import {
  formatStatusLabel,
  getReportById,
  getStatusColor
} from '../../services/localReportService.js';
import { ReportMapMarker } from '../../utils/mapMarkers.js';
import '../../styles/reportDetails.css';

function hasValidCoordinates(report) {
  return Boolean(
    Number.isFinite(Number(report?.location?.lat)) &&
    Number.isFinite(Number(report?.location?.lng))
  );
}

function formatSubmittedDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatUrgencyLabel(value) {
  return value || 'Medium';
}

function ReportDetailMapBridge({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 15);
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [map, position]);

  return null;
}

function getTimelineState(status, step) {
  const normalized = String(status || '').toLowerCase();
  const order = ['submitted', 'under_review', 'verified', 'resolved'];
  const currentIndex = normalized.includes('resolved')
    ? 3
    : normalized.includes('verified')
      ? 2
      : normalized.includes('under') || normalized.includes('review')
        ? 1
        : 0;
  const stepIndex = order.indexOf(step);

  if (step === 'submitted') {
    return 'complete';
  }

  if (stepIndex < currentIndex) {
    return 'complete';
  }

  if (stepIndex === currentIndex) {
    return 'active';
  }

  return 'pending';
}

export default function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = getReportById(id);

  if (!report) {
    return (
      <PageContainer className="report-details-page">
        <header className="report-details-topbar">
          <button onClick={() => navigate('/reports')} type="button" aria-label="Back to reports">
            <FaArrowLeft aria-hidden="true" />
          </button>
          <h1>Report Details</h1>
          <span aria-hidden="true" />
        </header>

        <section className="report-details-empty">
          <FaExclamationCircle aria-hidden="true" />
          <h2>Report not found</h2>
          <p>This report may have been deleted or is no longer available.</p>
          <Link to="/reports">Back to Reports</Link>
        </section>
      </PageContainer>
    );
  }

  const hasLocation = hasValidCoordinates(report);
  const locationPosition = hasLocation ? [Number(report.location.lat), Number(report.location.lng)] : null;
  const statusTone = getStatusColor(report.status);
  const timelineSteps = [
    ['submitted', 'Submitted'],
    ['under_review', 'Under Review'],
    ['verified', 'Verified'],
    ['resolved', 'Resolved']
  ];

  return (
    <PageContainer className="report-details-page">
      <header className="report-details-topbar">
        <button onClick={() => navigate('/reports')} type="button" aria-label="Back to reports">
          <FaArrowLeft aria-hidden="true" />
        </button>
        <div>
          <h1>Report Details</h1>
          <span>{report.trackingId}</span>
        </div>
        <span className={`reports-status-pill reports-status-pill--${statusTone}`}>
          {formatStatusLabel(report.status)}
        </span>
      </header>

      <section className="report-details-photo-card">
        {report.photoPreview ? (
          <img src={report.photoPreview} alt={`${report.issueType} report evidence`} />
        ) : (
          <div className="report-details-photo-empty">
            <FaEye aria-hidden="true" />
            <span>No photo available</span>
          </div>
        )}
        {report.location?.address && (
          <span className="report-details-location-pill">
            <FaMapMarkerAlt aria-hidden="true" />
            {report.location.address}
          </span>
        )}
      </section>

      <section className="report-details-card">
        <header>
          <FaClipboardCheck aria-hidden="true" />
          <h2>Report Summary</h2>
        </header>
        <div className="report-details-info-grid">
          <div>
            <span>Tracking ID</span>
            <strong>{report.trackingId || 'Unavailable'}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong className="report-details-summary-status">
              <span className={`reports-status-pill reports-status-pill--${statusTone}`}>
                {formatStatusLabel(report.status)}
              </span>
            </strong>
          </div>
          <div>
            <span>Issue Type</span>
            <strong>{report.issueType || 'Infrastructure Issue'}</strong>
          </div>
          <div>
            <span>Urgency</span>
            <strong>{formatUrgencyLabel(report.urgency)}</strong>
          </div>
          <div className="report-details-info-grid__wide">
            <span>Submitted</span>
            <strong>{formatSubmittedDate(report.createdAt)}</strong>
          </div>
        </div>
      </section>

      <section className="report-details-card">
        <header>
          <FaMapMarkedAlt aria-hidden="true" />
          <h2>Location</h2>
        </header>

        {hasLocation ? (
          <>
            <div className="report-details-location-list">
              <p>{report.location?.address || 'Location detected'}</p>
              <span>Lat: {Number(report.location.lat).toFixed(5)}</span>
              <span>Lng: {Number(report.location.lng).toFixed(5)}</span>
              {Number.isFinite(Number(report.location?.accuracy)) && (
                <span>Accuracy: +/- {report.location.accuracy}m</span>
              )}
            </div>
            <div className="report-details-map-preview">
              <MapContainer
                attributionControl={false}
                center={locationPosition}
                className="report-details-leaflet-map"
                dragging={false}
                scrollWheelZoom={false}
                zoom={15}
                zoomControl={false}
              >
                <ReportDetailMapBridge position={locationPosition} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker icon={ReportMapMarker(report.urgency)} position={locationPosition} />
              </MapContainer>
            </div>
          </>
        ) : (
          <div className="report-details-inline-empty">
            <FaMapMarkerAlt aria-hidden="true" />
            <p>Location not available</p>
          </div>
        )}
      </section>

      <section className="report-details-card">
        <header>
          <FaFileAlt aria-hidden="true" />
          <h2>Description</h2>
        </header>
        <p className="report-details-description">{report.description || 'No description provided.'}</p>
      </section>

      <section className="report-details-card">
        <header>
          <FaRoute aria-hidden="true" />
          <h2>Status Timeline</h2>
        </header>
        <div className="report-details-timeline">
          {timelineSteps.map(([step, label]) => (
            <div className={`report-details-timeline__item ${getTimelineState(report.status, step)}`} key={step}>
              <span aria-hidden="true" />
              <p>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="report-details-actions">
        <Link to="/reports">
          <FaCalendarAlt aria-hidden="true" />
          Back to Reports
        </Link>
        <Link to="/map">
          <FaMapMarkedAlt aria-hidden="true" />
          View on Map
        </Link>
      </section>
    </PageContainer>
  );
}
