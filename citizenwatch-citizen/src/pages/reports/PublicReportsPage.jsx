import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegFileAlt } from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import responseImage from '../../assets/images/Response.png';
import {
  formatPublicReportDate,
  formatPublicStatusLabel,
  getPublicStatusColor,
  subscribeToPublicReports
} from '../../services/publicReportService.js';
import { toDisplayText } from '../../utils/displayText.js';

const PUBLIC_REPORT_LIMIT = 100;

function getPublicReportImage(report) {
  return report.photoUrl || report.imageUrl || responseImage;
}

function getPublicReportLocation(report) {
  return toDisplayText(
    report.addressPreview ||
      report.barangay ||
      [report.barangay, report.city].filter(Boolean).join(', '),
    'Location unavailable'
  );
}

function getPublicReportArea(report) {
  return toDisplayText(report.barangay || report.city || '', '');
}

function getPublicReportMeta(report) {
  const submittedAt = formatPublicReportDate(report.createdAt || report.publishedAt || report.updatedAt);
  const area = getPublicReportArea(report);
  const supportText = report.supportCount > 0
    ? `${report.supportCount} support${report.supportCount === 1 ? '' : 's'}`
    : '';

  return [submittedAt, area, supportText].filter(Boolean).join(' - ');
}

export default function PublicReportsPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);

    return subscribeToPublicReports(
      (nextReports) => {
        setReports(nextReports);
        setError('');
        setIsLoading(false);
      },
      (snapshotError) => {
        console.warn('Unable to load public reports.', snapshotError);
        setReports([]);
        setError('Unable to load verified reports.');
        setIsLoading(false);
      },
      PUBLIC_REPORT_LIMIT
    );
  }, []);

  return (
    <PageContainer className="reports-page public-reports-page">
      <section className="reports-title public-reports-title">
        <span className="reports-title__chip">Community Reports</span>
        <h1>Public Reports</h1>
        <p>Verified reports approved by admin</p>
      </section>

      <section className="reports-submissions public-reports-feed">
        <header>
          <h2>Approved Community Reports</h2>
        </header>

        {isLoading && <p className="reports-sync-message">Loading verified reports...</p>}
        {!isLoading && error && <p className="reports-sync-message">{error}</p>}

        <div className="reports-list">
          {!isLoading && !error && reports.length > 0 ? (
            reports.map((report) => (
              <Link className="reports-list-card public-report-card" key={report.id} to={`/public-reports/${report.id}`}>
                <img src={getPublicReportImage(report)} alt="" loading="lazy" />
                <div className="reports-list-card__body">
                  <div>
                    <h3>{toDisplayText(report.title || report.category, 'Infrastructure Report')}</h3>
                    <div className="reports-card-actions">
                      <span className={`reports-status-pill reports-status-pill--${getPublicStatusColor(report.status)}`}>
                        {formatPublicStatusLabel(report.status)}
                      </span>
                    </div>
                  </div>
                  <p className="public-report-location">{getPublicReportLocation(report)}</p>
                  <time>{getPublicReportMeta(report)}</time>
                </div>
              </Link>
            ))
          ) : null}

          {!isLoading && !error && reports.length === 0 && (
            <div className="reports-empty-state">
              <FaRegFileAlt aria-hidden="true" />
              <h3>No verified reports available yet.</h3>
              <p>Approved reports will appear here after admin verification.</p>
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
