import { useMemo, useState } from 'react';
import {
  FaBars,
  FaClipboardList,
  FaExclamationTriangle,
  FaGavel,
  FaInfoCircle,
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import '../../styles/alerts.css';

const filters = ['All', 'Reports', 'Nearby', 'System'];

// TODO: Load reports from Firestore
const alerts = [];

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'All') {
      return alerts;
    }

    return alerts.filter((alert) => alert.category === activeFilter);
  }, [activeFilter]);

  return (
    <PageContainer className="alerts-page">
      <header className="alerts-topbar">
        <div className="alerts-brand">
          <FaBars aria-hidden="true" />
          <FaGavel aria-hidden="true" />
          <span>CitizenWatch</span>
        </div>
        <img src={communityImage} alt="Citizen profile" />
      </header>

      <section className="alerts-title">
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
          <strong>0</strong>
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
                {alert.tone === 'nearby' ? (
                  <span className="nearby-alert-indicator" aria-label="High priority nearby alert">
                    !
                  </span>
                ) : (
                  alert.unread && <span className="alert-unread-dot" aria-label="Unread alert" />
                )}

                <span className={`alert-icon alert-icon--${alert.tone}`}>
                  <Icon aria-hidden="true" />
                </span>

                <div className="alert-card__content">
                  <header>
                    <h2>{alert.title}</h2>
                    {alert.time && <time>{alert.time}</time>}
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
