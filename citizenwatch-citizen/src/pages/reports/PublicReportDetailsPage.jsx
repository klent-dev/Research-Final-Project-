import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaArrowLeft, FaImage, FaMapMarkerAlt, FaRegClock, FaTag, FaUsers } from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import {
  formatPublicReportDate,
  formatPublicStatusLabel,
  getPublicReportSupportState,
  getPublicStatusColor,
  subscribeToPublicReport,
  supportPublicReport
} from '../../services/publicReportService.js';
import { ReportMapMarker } from '../../utils/mapMarkers.js';
import { toDisplayText } from '../../utils/displayText.js';

function getReportImage(report = {}) {
  if (!report) {
    return '';
  }

  return report.photoUrl || report.imageUrl || '';
}

function getReportLocation(report = {}) {
  if (!report) {
    return 'Location not specified';
  }

  return toDisplayText(
    report.addressPreview ||
      report.barangay ||
      [report.barangay, report.city].filter(Boolean).join(', '),
    'Location not specified'
  );
}

function getReportCoordinates(report = {}) {
  if (!report) {
    return null;
  }

  const lat = Number(report.approximateLatitude ?? report.latitude);
  const lng = Number(report.approximateLongitude ?? report.longitude);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export default function PublicReportDetailsPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSupporting, setIsSupporting] = useState(false);
  const [alreadySupported, setAlreadySupported] = useState(false);
  const coordinates = useMemo(() => getReportCoordinates(report), [report]);
  const reportImage = getReportImage(report);
  const statusTone = getPublicStatusColor(report?.status);

  useEffect(() => {
    setIsLoading(true);

    return subscribeToPublicReport(
      reportId,
      (nextReport) => {
        setReport(nextReport);
        setError(nextReport ? '' : 'Public report not found.');
        setIsLoading(false);
      },
      (snapshotError) => {
        console.warn('Unable to load public report details.', snapshotError);
        setReport(null);
        setError('Unable to load this public report.');
        setIsLoading(false);
      }
    );
  }, [reportId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupportState() {
      const supported = await getPublicReportSupportState(reportId);

      if (!cancelled) {
        setAlreadySupported(supported);
      }
    }

    loadSupportState().catch(() => {
      if (!cancelled) {
        setAlreadySupported(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  async function handleSupport() {
    if (alreadySupported || isSupporting) return;

    setIsSupporting(true);
    setSupportMessage('');

    try {
      const result = await supportPublicReport(reportId);

      if (result.alreadySupported) {
        setAlreadySupported(true);
        setSupportMessage('You already supported this report.');
      } else {
        setAlreadySupported(true);
        setSupportMessage('Thank you. Your support has been added.');
      }
    } catch (supportError) {
      console.warn('Unable to support public report.', supportError);
      setSupportMessage('Unable to add your support right now.');
    } finally {
      setIsSupporting(false);
    }
  }

  return (
    <PageContainer className="reports-page public-report-details-page">
      <button className="public-report-back" onClick={() => navigate(-1)} type="button">
        <FaArrowLeft aria-hidden="true" />
        Back
      </button>

      {isLoading && <p className="reports-sync-message">Loading public report...</p>}
      {!isLoading && error && (
        <section className="reports-empty-state">
          <FaImage aria-hidden="true" />
          <h3>{error}</h3>
          <p>Only approved public reports can be viewed here.</p>
          <Link to="/public-reports">View public reports</Link>
        </section>
      )}

      {!isLoading && !error && report && (
        <>
          <section className="public-report-detail-hero">
            {reportImage ? (
              <img src={reportImage} alt="" loading="lazy" />
            ) : (
              <div className="public-report-detail-hero__empty">
                <FaImage aria-hidden="true" />
                <span>No image available</span>
              </div>
            )}
          </section>

          <section className="public-report-detail-card">
            <header>
              <div>
                <p>Public Report</p>
                <h1>{toDisplayText(report.title || report.category, 'Infrastructure Report')}</h1>
              </div>
              <span className={`reports-status-pill reports-status-pill--${statusTone}`}>
                {formatPublicStatusLabel(report.status)}
              </span>
            </header>

            <div className="public-report-detail-meta">
              <span><FaTag aria-hidden="true" />{toDisplayText(report.trackingId, 'No tracking ID')}</span>
              <span><FaRegClock aria-hidden="true" />{formatPublicReportDate(report.createdAt || report.publishedAt || report.updatedAt)}</span>
              <span><FaUsers aria-hidden="true" />{Number(report.supportCount || 0)} support{Number(report.supportCount || 0) === 1 ? '' : 's'}</span>
            </div>

            <section className="public-report-detail-section">
              <h2>Description</h2>
              <p>{toDisplayText(report.shortDescription, 'No description provided')}</p>
            </section>

            <section className="public-report-detail-section">
              <h2>Location</h2>
              <p>{getReportLocation(report)}</p>
              {report.city && <small>{report.city}</small>}
            </section>

            {coordinates ? (
              <section className="public-report-map" aria-label="Approximate public report location">
                <MapContainer
                  attributionControl={false}
                  center={[coordinates.lat, coordinates.lng]}
                  dragging={false}
                  scrollWheelZoom={false}
                  zoom={14}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker icon={ReportMapMarker(report.category)} position={[coordinates.lat, coordinates.lng]} />
                </MapContainer>
              </section>
            ) : null}

            <button
              className="public-report-support-button"
              disabled={alreadySupported || isSupporting}
              onClick={handleSupport}
              type="button"
            >
              {alreadySupported ? 'Already supported' : isSupporting ? 'Adding support...' : 'I also noticed this'}
            </button>
            {supportMessage && <p className="public-report-support-message">{supportMessage}</p>}
          </section>
        </>
      )}
    </PageContainer>
  );
}
