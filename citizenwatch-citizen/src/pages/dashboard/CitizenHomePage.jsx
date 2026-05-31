import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaChartLine, FaCircle, FaLightbulb, FaPlusCircle, FaRoad, FaTint, FaTrash } from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import { isFirebaseConfigured } from '../../firebase/config.js';
import { useReports } from '../../hooks/useReports.js';
import {
  formatRelativeTime,
  formatStatusLabel,
  getStatusColor,
  getReports,
  isReportVisibleForCitizen
} from '../../services/localReportService.js';
import { subscribeToLatestReports } from '../../services/reportService.js';
import { toDisplayText } from '../../utils/displayText.js';

const LIVE_REPORT_LIMIT = 20;
const ALL_CATEGORY = 'All';

const categories = [
  { label: ALL_CATEGORY, icon: FaCircle },
  { label: 'Drainage', icon: FaTint },
  { label: 'Street Light', icon: FaLightbulb },
  { label: 'Flooding', icon: FaTint },
  { label: 'Waste', icon: FaTrash },
  { label: 'Others', icon: FaRoad }
];

function getCategoryIcon(report) {
  const reportCategory = String(report?.issueType || report?.category || '').toLowerCase();
  const matchedCategory = categories.find((category) => reportCategory.includes(category.label.toLowerCase()));
  return matchedCategory?.icon || FaRoad;
}

function getReportTitle(report) {
  const category = toDisplayText(report?.issueType || report?.category, 'Infrastructure');
  return toDisplayText(report?.title, `${category} Report`);
}

function getReportLocation(report) {
  return toDisplayText(
    report?.address || report?.location?.address || report?.location?.subAddress,
    'Location unavailable'
  );
}

function getReportTimestamp(report) {
  return formatRelativeTime(report?.createdAt || report?.submittedAt || report?.updatedAt);
}

function getReportImage(report) {
  return report?.photoUrl || report?.imageUrl || report?.evidenceImage || report?.photoPreview || '';
}

function getReportPreview(report) {
  const location = getReportLocation(report);
  const description = toDisplayText(report?.description, '');
  return location !== 'Location unavailable' ? location : description || 'Report details pending';
}

export default function CitizenHomePage() {
  const [liveReports, setLiveReports] = useState([]);
  const [isLiveReportsLoading, setIsLiveReportsLoading] = useState(true);
  const [liveReportsError, setLiveReportsError] = useState('');
  const { reports } = useReports();
  const impactStats = [
    { label: 'Submitted', value: reports.length.toString() },
    {
      label: 'Verified',
      value: reports.filter((report) => String(report?.status || '').toUpperCase().includes('VERIFIED')).length.toString()
    },
    {
      label: 'Resolved',
      value: reports.filter((report) => String(report?.status || '').toUpperCase().includes('RESOLVED')).length.toString()
    }
  ];

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const updateLocalReports = () => {
        setLiveReports(getReports().filter(isReportVisibleForCitizen).slice(0, LIVE_REPORT_LIMIT));
        setLiveReportsError('');
        setIsLiveReportsLoading(false);
      };

      updateLocalReports();
      window.addEventListener('storage', updateLocalReports);
      window.addEventListener('citizenwatch:reports-updated', updateLocalReports);

      return () => {
        window.removeEventListener('storage', updateLocalReports);
        window.removeEventListener('citizenwatch:reports-updated', updateLocalReports);
      };
    }

    setIsLiveReportsLoading(true);

    return subscribeToLatestReports(
      (nextReports) => {
        setLiveReports(nextReports.filter(isReportVisibleForCitizen).slice(0, LIVE_REPORT_LIMIT));
        setLiveReportsError('');
        setIsLiveReportsLoading(false);
      },
      (error) => {
        console.warn('Unable to subscribe to live reports.', error);
        setLiveReports([]);
        setLiveReportsError('Unable to load live reports.');
        setIsLiveReportsLoading(false);
      },
      LIVE_REPORT_LIMIT
    );
  }, []);

  return (
    <PageContainer className="citizen-home">
      <section className="citizen-greeting">
        <span className="citizen-greeting__chip">Community Dashboard</span>
        <h1>
          Good morning,<span className="citizen-greeting__name">Citizen</span>
        </h1>
        <p>Your contribution keeps our neighborhood safe and functional.</p>
      </section>

      <section className="citizen-report-card">
        <div>
          <h2>Report Infrastructure Issue</h2>
          <p>Spot a problem? Help us fix it by submitting a detailed report with photos and location data.</p>
          <Link className="citizen-report-button" to="/reports/create">
            <FaPlusCircle aria-hidden="true" />
            Create Report
          </Link>
        </div>
        <FaBullhorn className="citizen-report-card__watermark" aria-hidden="true" />
      </section>

      <section className="citizen-nearby-card">
        <header className="nearby-header">
          <div className="nearby-title-group">
            <h2>
              Live Reports
              <span className="citizen-live-badge">
                <span className="citizen-live-status" aria-hidden="true" />
                Live
              </span>
            </h2>
            <p>Latest reports submitted by citizens</p>
          </div>
          <Link className="expand-map-button" to="/reports">
            <span className="expand-map-text">View All</span>
          </Link>
        </header>

        <div className="citizen-live-reports">
          {isLiveReportsLoading && <p className="citizen-live-message">Loading live reports...</p>}

          {!isLiveReportsLoading && liveReportsError && (
            <p className="citizen-live-message citizen-live-message--error">{liveReportsError}</p>
          )}

          {!isLiveReportsLoading && !liveReportsError && liveReports.length === 0 && (
            <p className="citizen-live-message">No live reports yet.</p>
          )}

          {!isLiveReportsLoading && !liveReportsError && liveReports.map((report) => {
            const ReportIcon = getCategoryIcon(report);
            const reportImage = getReportImage(report);
            const statusTone = getStatusColor(report.status);

            return (
              <Link className="citizen-live-report" key={report.id} to={`/reports/${report.id}`}>
                {reportImage ? (
                  <span className="citizen-live-report__photo">
                    <img src={reportImage} alt="" loading="lazy" />
                  </span>
                ) : (
                  <span className="citizen-live-report__photo citizen-live-report__photo--empty">
                    <ReportIcon aria-hidden="true" />
                  </span>
                )}
                <span className="citizen-live-report__content">
                  <span className="citizen-live-report__heading">
                    <strong>{getReportTitle(report)}</strong>
                    <span className={`citizen-live-report__status citizen-live-report__status--${statusTone}`}>
                      {formatStatusLabel(report.status)}
                    </span>
                  </span>
                  <small>{getReportPreview(report)}</small>
                  <em>{getReportTimestamp(report)}</em>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="citizen-impact-card">
        <header>
          <p>Your Impact</p>
          <FaChartLine aria-hidden="true" />
        </header>
        <div className="citizen-impact-list">
          {impactStats.map((item) => (
            <div className="citizen-impact-row" key={item.label}>
              <span>
                <FaCircle aria-hidden="true" />
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
