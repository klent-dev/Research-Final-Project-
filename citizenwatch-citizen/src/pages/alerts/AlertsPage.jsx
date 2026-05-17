import { useMemo, useState } from 'react';
import {
  FaBars,
  FaCheckCircle,
  FaClipboardCheck,
  FaClipboardList,
  FaExclamationTriangle,
  FaGavel,
  FaInfoCircle,
  FaShieldAlt
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer.jsx';
import communityImage from '../../assets/images/Community.png';
import '../../styles/alerts.css';

const filters = ['All', 'Reports', 'Nearby', 'System'];

const alerts = [
  {
    id: 1,
    title: 'Report Verified',
    message: 'Your road damage report on Escario St. has been verified.',
    time: '9:30 AM',
    category: 'Reports',
    status: 'Today',
    icon: FaClipboardCheck,
    tone: 'reports',
    unread: true
  },
  {
    id: 2,
    title: 'Status Update',
    message: 'Your flooding report near JY is now under review.',
    time: '4:15 PM',
    category: 'Reports',
    status: 'Yesterday',
    icon: FaCheckCircle,
    tone: 'reports'
  },
  {
    id: 3,
    title: 'Nearby Warning',
    message: 'Heavy flooding reported near Barangay Lahug. Commuters advised to reroute.',
    category: 'Nearby',
    priority: 'High Priority',
    distance: '2 km away',
    icon: FaExclamationTriangle,
    tone: 'nearby',
    unread: true
  },
  {
    id: 4,
    title: 'System Notice',
    message: 'EXIF and GPS validation are active for safer reporting across the platform.',
    time: 'May 12',
    category: 'System',
    status: 'Info',
    icon: FaShieldAlt,
    tone: 'system'
  }
];

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
            <span className="alerts-new-badge">NEW</span>
          </div>
          <strong>3</strong>
          <p>New Updates</p>
        </article>

        <article className="alerts-summary-card">
          <div className="alerts-summary-card__top">
            <span className="alerts-summary-icon alerts-summary-icon--warning">
              <FaExclamationTriangle aria-hidden="true" />
            </span>
          </div>
          <strong>2</strong>
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
            <p>Updates about your reports and nearby incidents will appear here.</p>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
