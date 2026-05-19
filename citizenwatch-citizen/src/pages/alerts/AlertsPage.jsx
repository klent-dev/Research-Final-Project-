import { useState } from 'react';
import {
  FaClipboardList,
  FaExclamationTriangle,
  FaGavel,
  FaInfoCircle,
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import { formatRelativeTime, getReports } from '../../services/localReportService.js';
import '../../styles/alerts.css';

const filters = ['All', 'Reports', 'Nearby', 'System'];

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  // TODO: Replace localStorage with Firestore backend
  const reports = getReports();
  const alerts = reports.map((report) => ({
    id: `report-${report.id}`,
    title: 'Report Submitted',
    message: `Your ${report.issueType} report has been received and is under review.`,
    time: formatRelativeTime(report.createdAt),
    category: 'Reports',
    status: 'Today',
    tone: 'reports',
    icon: FaClipboardList,
    unread: true
  }));

  const filteredAlerts = activeFilter === 'All'
    ? alerts
    : alerts.filter((alert) => alert.category === activeFilter);

  return (
    <PageContainer className="alerts-page">
      <header className="alerts-topbar">
        <div className="alerts-brand">
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </div>
        <img src={communityImage} alt="Citizen profile" />
      </header>

      <section className="alerts-title">
        <span className="alerts-title__chip">Alert Center</span>
        <h1>Alerts</h1>
        <p>Stay updated on your reports and nearby issues</p>
      </section>

      <section className="alerts-summary-grid" aria-label="Alerts summary">
        <article className="alerts-summary-card">
          <div className="alerts-summary-card__top">
            <span className="alerts-summary-icon alerts-summary-icon--green">
              <FaClipboardList aria-hidden="true" />
            </span>
            {alerts.length > 0 && <span className="alerts-new-badge">NEW</span>}
          </div>
          <strong>{alerts.length}</strong>
          <p>New Updates</p>
        </article>

        <article className="alerts-summary-card">
          <div className="alerts-summary-card__top">
            <span className="alerts-summary-icon alerts-summary-icon--warning">
              <FaExclamationTriangle aria-hidden="true" />
            </span>
          </div>
          <strong>0</strong>
          <p>Nearby Warnings</p>
        </article>
      </section>

      <section className="alerts-filter-row" aria-label="Alert filters">
        {filters.map((filter) => (
          <button
            className={activeFilter === filter ? 'alerts-filter-chip active' : 'alerts-filter-chip'}
            key={filter}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </section>

      <section className="alerts-list" aria-label="Alert notifications">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const Icon = alert.icon;

            return (
              <article className={`alert-card alert-card--${alert.tone}`} key={alert.id}>
                <span className={`alert-icon alert-icon--${alert.tone}`}>
                  <Icon aria-hidden="true" />
                </span>

                <div className="alert-card__content">
                  <header className="alert-card-header">
                    <h2>{alert.title}</h2>
                    <div className="alert-time-wrap">
                      {alert.time && <time className="alert-time">{alert.time}</time>}
                      {alert.tone === 'nearby' ? (
                        <span className="nearby-alert-indicator" aria-label="Priority nearby alert">
                          !
                        </span>
                      ) : (
                        alert.unread && <span className="alert-unread-dot" aria-label="Unread alert" />
                      )}
                    </div>
                  </header>

                  <p>{alert.message}</p>

                  <footer>
                    <span className={`alert-category-pill alert-category-pill--${alert.tone}`}>
                      {alert.category.toUpperCase()}
                    </span>
                    {(alert.status || alert.priority) && (
                      <span className={`alert-meta alert-meta--${alert.tone}`}>
                        {alert.status || alert.priority}
                      </span>
                    )}
                    {alert.distance && <span className="alert-distance">{alert.distance}</span>}
                  </footer>
                </div>
              </article>
            );
          })
        ) : (
          <div className="alerts-empty-state">
            <FaInfoCircle aria-hidden="true" />
            <h2>No alerts yet</h2>
            <p>Updates and notifications will appear here.</p>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
