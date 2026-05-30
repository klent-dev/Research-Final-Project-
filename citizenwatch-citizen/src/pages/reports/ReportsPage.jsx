import { Link, useNavigate } from 'react-router-dom';
import {
  FaBullhorn,
  FaCheckCircle,
  FaClipboardList,
  FaRegFileAlt
} from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import PageContainer from '../../components/PageContainer.jsx';
import responseImage from '../../assets/images/Response.png';
import {
  formatStatusLabel,
  formatReportDate,
  getStatusColor,
  hideReportForCitizen
} from '../../services/localReportService.js';
import { isFirebaseConfigured } from '../../firebase/config.js';
import { useReports } from '../../hooks/useReports.js';
import { voidInfrastructureReport } from '../../services/reportService.js';
import { toDisplayText } from '../../utils/displayText.js';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { reports, error, refreshReports } = useReports();
  const syncMessage = error || (!isFirebaseConfigured ? 'Firebase is not configured. Add your Firebase env values to submit and load reports.' : '');
  const resolvedReports = reports.filter((report) => String(report?.status || '').toLowerCase() === 'resolved');

  async function handleDeleteReport(event, report) {
    event.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this report?');

    if (!confirmed) {
      return;
    }

    try {
      if (isFirebaseConfigured) {
        await voidInfrastructureReport(report);
      }

      hideReportForCitizen(report);
      refreshReports();
    } catch (error) {
      console.warn('Unable to void report.', error);
      window.alert('Unable to void this report. Please check your connection and try again.');
    }
  }

  function handleOpenReport(reportId) {
    navigate(`/reports/${reportId}`);
  }

  function handleReportKeyDown(event, reportId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenReport(reportId);
    }
  }

  return (
    <PageContainer className="reports-page">
      <section className="reports-title">
        <span className="reports-title__chip">Report Center</span>
        <h1>My Reports</h1>
        <p>Track your submitted infrastructure reports</p>
      </section>

      <section className="reports-summary-grid" aria-label="Report summary">
        <article className="reports-summary-card">
          <span>
            <FaClipboardList aria-hidden="true" />
          </span>
          <p>Total Reports</p>
          <strong>{reports.length}</strong>
        </article>

        <article className="reports-summary-card">
          <span>
            <FaCheckCircle aria-hidden="true" />
          </span>
          <p>Resolved</p>
          <strong>{resolvedReports.length}</strong>
        </article>
      </section>

      <section className="reports-cta-card">
        <div>
          <h2>Spotted a new issue?</h2>
          <p>Your reports help us build a better city for everyone.</p>
          <Link to="/reports/create">File New Report</Link>
        </div>
        <FaBullhorn className="reports-cta-card__icon" aria-hidden="true" />
      </section>

      <section className="reports-submissions">
        <header>
          <h2>Recent Submissions</h2>
          <button type="button">View All</button>
        </header>

        {syncMessage && <p className="reports-sync-message">{syncMessage}</p>}

        <div className="reports-list">
          {reports.length > 0 ? (
            reports.map((report) => (
              <article
                className="reports-list-card"
                key={report.id}
                onClick={() => handleOpenReport(report.id)}
                onKeyDown={(event) => handleReportKeyDown(event, report.id)}
                role="button"
                tabIndex={0}
              >
                <img src={report.photoPreview || report.photoUrl || report.imageUrl || responseImage} alt="" />
                <div className="reports-list-card__body">
                  <div>
                    <h3>{toDisplayText(report.title || report.issueType, 'Infrastructure Report')}</h3>
                    <div className="reports-card-actions">
                      <span className={`reports-status-pill reports-status-pill--${getStatusColor(report.status)}`}>
                        {formatStatusLabel(report.status)}
                      </span>
                      <button
                        aria-label="Delete report"
                        className="reports-delete-button"
                        onKeyDown={(event) => event.stopPropagation()}
                        onClick={(event) => handleDeleteReport(event, report)}
                        type="button"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p>{toDisplayText(report.trackingId, 'No tracking ID')} &bull; {toDisplayText(report.description, 'No description provided.')}</p>
                  <time>{formatReportDate(report.createdAt)}</time>
                </div>
              </article>
            ))
          ) : (
            <div className="reports-empty-state">
              <FaRegFileAlt aria-hidden="true" />
              <h3>No reports submitted yet.</h3>
              <p>Your submitted infrastructure reports will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
