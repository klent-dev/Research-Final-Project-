import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBullhorn,
  FaCheckCircle,
  FaClipboardList,
  FaGavel,
  FaRegFileAlt
} from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import responseImage from '../../assets/images/Response.png';
import {
  clearReports,
  deleteReport,
  formatStatusLabel,
  formatReportDate,
  getReports,
  getStatusColor
} from '../../services/localReportService.js';
import { getCitizenReports } from '../../services/reportService.js';
import { isFirebaseConfigured } from '../../firebase/config.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState(() => (isFirebaseConfigured ? [] : getReports()));
  const [syncMessage, setSyncMessage] = useState('');
  const resolvedReports = reports.filter((report) => report.status === 'resolved');

  useEffect(() => {
    if (isFirebaseConfigured) {
      return undefined;
    }

    function refreshLocalReports() {
      setReports(getReports());
    }

    window.addEventListener('storage', refreshLocalReports);
    window.addEventListener('citizenwatch:reports-updated', refreshLocalReports);

    return () => {
      window.removeEventListener('storage', refreshLocalReports);
      window.removeEventListener('citizenwatch:reports-updated', refreshLocalReports);
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSyncMessage('Firebase is not configured. Add your Firebase env values to submit and load reports.');
      return;
    }

    let ignore = false;

    async function loadFirebaseReports() {
      clearReports();

      try {
        const nextReports = await getCitizenReports(user?.uid || 'anonymous-citizen');
        if (!ignore) {
          setReports(nextReports);
        }
        setSyncMessage('');
      } catch (error) {
        console.warn('Unable to load reports from Firestore.', error);
        if (!ignore) {
          setSyncMessage('Unable to load reports from Firebase. Check Firebase configuration.');
        }
      }
    }

    loadFirebaseReports();

    return () => {
      ignore = true;
    };
  }, [user]);

  function handleDeleteReport(event, reportId) {
    event.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this report?');

    if (!confirmed) {
      return;
    }

    setReports(deleteReport(reportId));
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
      <header className="reports-topbar">
        <div className="reports-brand">
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </div>
        <img src={communityImage} alt="Citizen profile" />
      </header>

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
                <img src={report.photoPreview || responseImage} alt="" />
                <div className="reports-list-card__body">
                  <div>
                    <h3>{report.title}</h3>
                    <div className="reports-card-actions">
                      <span className={`reports-status-pill reports-status-pill--${getStatusColor(report.status)}`}>
                        {formatStatusLabel(report.status)}
                      </span>
                      <button
                        aria-label="Delete report"
                        className="reports-delete-button"
                        onKeyDown={(event) => event.stopPropagation()}
                        onClick={(event) => handleDeleteReport(event, report.id)}
                        type="button"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p>{report.trackingId} &bull; {report.description}</p>
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
