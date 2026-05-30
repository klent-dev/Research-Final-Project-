import { useState } from 'react';
import {
  FaClipboardList,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import { useReports } from '../../hooks/useReports.js';
import { formatRelativeTime } from '../../services/localReportService.js';
import { toDisplayText } from '../../utils/displayText.js';
import '../../styles/alerts.css';

const filters = ['All', 'Reports', 'Nearby', 'System'];

function isRejectedReport(report = {}) {
  const normalizedStatus = String(report.status || '').toLowerCase().replaceAll('_', ' ');
  return report.rejectedByAdmin || report.adminDeleted || normalizedStatus.includes('reject') || normalizedStatus.includes('not verified');
}

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { reports } = useReports();
  const alerts = reports.map((report) => {
    const rejected = isRejectedReport(report);
    const issueType = toDisplayText(report.issueType || report.category, 'infrastructure');

    return {
      id: `report-${report.id}`,
      title: rejected ? 'Report Not Verified' : 'Report Submitted',
      message: rejected
        ? toDisplayText(report.rejectionReason) || `Your ${issueType} report was reviewed by LGU staff but could not be verified. It has been closed.`
        : `Your ${issueType} report has been received and is under review.`,
      time: formatRelativeTime(report.updatedAt || report.createdAt),
      category: 'Reports',
      status: rejected ? 'Closed' : 'Today',
      tone: rejected ? 'nearby' : 'reports',
      icon: rejected ? FaExclamationTriangle : FaClipboardList,
      unread: true
    };
  });

  const filteredAlerts = activeFilter === 'All'
    ? alerts
    : alerts.filter((alert) => alert.category === activeFilter);

  return (
    <PageContainer className="alerts-page">
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
                      {String(alert.category || '').toUpperCase()}
                    </span>
                    {(alert.status || alert.priority) && (
                      <span className={`alert-meta alert-meta--${alert.tone}`}>
                        {toDisplayText(alert.status || alert.priority)}
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
