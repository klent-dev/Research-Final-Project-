import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  getReportById as getLocalReportById,
  isReportVisibleForCitizen,
  getStatusColor
} from '../../services/localReportService.js';
import { isFirebaseConfigured } from '../../firebase/config.js';
import { getReportById as getFirebaseReportById } from '../../services/reportService.js';
import { ReportMapMarker } from '../../utils/mapMarkers.js';
import { toDisplayText } from '../../utils/displayText.js';
import '../../styles/reportDetails.css';

function hasValidCoordinates(report) {
  const lat = Number(report?.location?.lat);
  const lng = Number(report?.location?.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
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
  if (String(value || '').toLowerCase() === 'low') return 'Minor';
  if (String(value || '').toLowerCase() === 'medium') return 'Moderate';
  return value || 'Moderate';
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

function isRejectedReport(report = {}) {
  const normalizedStatus = String(report.status || '').toLowerCase().replaceAll('_', ' ');
  return report.rejectedByAdmin || report.adminDeleted || normalizedStatus.includes('reject') || normalizedStatus.includes('not verified');
}

export default function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(() => {
    const localReport = getLocalReportById(id);
    return localReport && isReportVisibleForCitizen(localReport) ? localReport : null;
  });
  const [isLoading, setIsLoading] = useState(() => isFirebaseConfigured && !getLocalReportById(id));

  useEffect(() => {
    let ignore = false;
    const localReport = getLocalReportById(id);

    if (localReport && isReportVisibleForCitizen(localReport)) {
      setReport(localReport);
      setIsLoading(false);
      return undefined;
    }

    if (localReport && !isReportVisibleForCitizen(localReport)) {
      setReport(null);
      setIsLoading(false);
      return undefined;
    }

    if (!isFirebaseConfigured) {
      setReport(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    getFirebaseReportById(id)
      .then((firebaseReport) => {
        if (!ignore) {
          setReport(firebaseReport && isReportVisibleForCitizen(firebaseReport) ? firebaseReport : null);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.warn('Unable to load report details from Firebase.', error);
        if (!ignore) {
          setReport(null);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <PageContainer className="report-details-page">
        <section className="report-details-empty">
          <h2>Loading report...</h2>
          <p>Please wait while we retrieve the report details.</p>
        </section>
      </PageContainer>
    );
  }

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
  const isRejected = isRejectedReport(report);
  const reportPhoto = report.photoPreview || report.photoUrl || report.imageUrl || '';
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
          <span>{toDisplayText(report.trackingId, 'Unavailable')}</span>
        </div>
        <span className={`reports-status-pill reports-status-pill--${statusTone}`}>
          {formatStatusLabel(report.status)}
        </span>
      </header>

      <section className="report-details-photo-card">
        {reportPhoto ? (
          <img src={reportPhoto} alt={`${toDisplayText(report.issueType, 'Infrastructure')} report evidence`} />
        ) : (
          <div className="report-details-photo-empty">
            <FaEye aria-hidden="true" />
            <span>No photo available</span>
          </div>
        )}
        {report.location?.address && (
          <span className="report-details-location-pill">
            <FaMapMarkerAlt aria-hidden="true" />
            {toDisplayText(report.location.address, 'Location detected')}
          </span>
        )}
      </section>

      <section className="report-details-card">
        <header>
          <FaClipboardCheck aria-hidden="true" />
          <h2>Report Summary</h2>
        </header>
        {isRejected && (
          <div className="report-details-rejection-note">
            <FaExclamationCircle aria-hidden="true" />
            <div>
              <strong>Not verified by LGU</strong>
              <p>
                {toDisplayText(report.rejectionReason || report.adminNotes, 'This report was reviewed by LGU staff but could not be verified. It has been closed.')}
              </p>
            </div>
          </div>
        )}
        <div className="report-details-info-grid">
          <div>
            <span>Tracking ID</span>
            <strong>{toDisplayText(report.trackingId, 'Unavailable')}</strong>
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
            <strong>{toDisplayText(report.issueType || report.category, 'Infrastructure Issue')}</strong>
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
              <div className="report-details-location-address">
                <span className="report-details-location-label">Address</span>
                <p className="report-details-location-value">
                  {toDisplayText(report.location?.address, 'Location detected')}
                </p>
              </div>
              <div className="report-details-location-coordinates">
                <span>Latitude: {Number(report.location.lat).toFixed(5)}</span>
                <span>Longitude: {Number(report.location.lng).toFixed(5)}</span>
                {Number.isFinite(Number(report.location?.accuracy)) && (
                  <span>Accuracy: +/- {toDisplayText(report.location.accuracy, '0')}m</span>
                )}
              </div>
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
        <p className="report-details-description">{toDisplayText(report.description, 'No description provided.')}</p>
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
        <Link to={`/map?reportId=${encodeURIComponent(report.id || id)}`}>
          <FaMapMarkedAlt aria-hidden="true" />
          View on Map
        </Link>
      </section>
    </PageContainer>
  );
}
