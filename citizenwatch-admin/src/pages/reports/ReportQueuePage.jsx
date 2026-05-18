const assetStats = [
  { label: 'Total Assets', value: '1,452', meta: '+2%' },
  { label: 'At Risk', value: '12', meta: 'Critical', tone: 'danger' },
  { label: 'Maintenance Due', value: '45', meta: 'Next 30 Days', tone: 'focus' },
  { label: 'Operational', value: '1,395', meta: '96.1%', tone: 'success' }
];

const filters = ['All Assets', 'Roads', 'Drainage', 'Streetlights', 'Bridges'];

const assets = [
  {
    id: '#RD-402',
    name: 'Main St. Pavement',
    category: 'Road',
    status: 'Operational',
    health: 92,
    inspection: 'Oct 12, 2023'
  },
  {
    id: '#DR-115',
    name: 'Central Canal Z-4',
    category: 'Drainage',
    status: 'At Risk',
    health: 34,
    inspection: 'Jan 05, 2024'
  },
  {
    id: '#SL-882',
    name: 'Highland Blvd Lights',
    category: 'Streetlights',
    status: 'Maint. Due',
    health: 78,
    inspection: 'Nov 22, 2023',
    selected: true
  },
  {
    id: '#BR-009',
    name: 'Riverside Steel Bridge',
    category: 'Bridges',
    status: 'Operational',
    health: 89,
    inspection: 'Dec 15, 2023'
  },
  {
    id: '#PB-551',
    name: 'City Hall Annex',
    category: 'Public Buildings',
    status: 'Operational',
    health: 95,
    inspection: 'Feb 01, 2024'
  }
];

const maintenanceHistory = [
  ['Bulb Replacement', 'Nov 22, 2023 - Task Completed'],
  ['Wiring Inspection', 'Jun 10, 2023 - Routine Check'],
  ['Sensor Upgrade', 'Jan 15, 2023 - Initial Setup']
];

function Icon({ name }) {
  if (name === 'plus') {
    return <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />;
  }

  if (name === 'bell') {
    return <path d="M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z" />;
  }

  if (name === 'help') {
    return <path d="M11 17h2v-2h-2v2Zm1-14a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 12.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11Zm0-9.3c-1.6 0-2.8.9-2.8 2.4h1.7c0-.6.4-1 1.1-1 .7 0 1.1.4 1.1 1 0 .5-.3.8-.9 1.2-.9.6-1.2 1.1-1.2 2.2h1.6c0-.6.2-.9.8-1.3.8-.5 1.5-1.1 1.5-2.2 0-1.4-1.1-2.3-2.9-2.3Z" />;
  }

  if (name === 'refresh') {
    return <path d="M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z" />;
  }

  return <path d="M10 4a6 6 0 0 1 4.8 9.6l4.3 4.3-1.4 1.4-4.3-4.3A6 6 0 1 1 10 4Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />;
}

function SvgIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <Icon name={name} />
    </svg>
  );
}

function getStatusClass(status) {
  return status.toLowerCase().replaceAll(' ', '-').replace('.', '');
}

export default function ReportQueuePage() {
  return (
    <main className="infrastructure-page">
      <header className="infra-topbar">
        <h1>LGU Admin</h1>
        <label className="infra-search">
          <SvgIcon name="search" />
          <input placeholder="Search assets, maintenance ID, or locations..." type="search" />
        </label>
        <div className="infra-topbar-icons">
          <button type="button" aria-label="Notifications"><SvgIcon name="bell" /></button>
          <button type="button" aria-label="Sync"><SvgIcon name="refresh" /></button>
          <button type="button" aria-label="Help"><SvgIcon name="help" /></button>
        </div>
        <section className="infra-user">
          <span aria-hidden="true">AU</span>
          <strong>Admin User</strong>
        </section>
      </header>

      <section className="infra-heading">
        <div>
          <h2>Infrastructure Assets</h2>
          <p>Comprehensive inventory and status monitoring of municipal property.</p>
        </div>
        <button type="button"><SvgIcon name="plus" />New Asset Record</button>
      </section>

      <section className="infra-stat-grid" aria-label="Asset summary">
        {assetStats.map((stat) => (
          <article className={`infra-stat-card ${stat.tone ? `infra-stat-card--${stat.tone}` : ''}`} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.meta}</small>
          </article>
        ))}
      </section>

      <section className="infra-filter-row" aria-label="Asset filters">
        {filters.map((filter, index) => (
          <button className={index === 0 ? 'active' : ''} key={filter} type="button">{filter}</button>
        ))}
      </section>

      <section className="infra-workspace">
        <section className="asset-table-card">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Name & Category</th>
                <th>Status</th>
                <th>Health Score</th>
                <th>Last Inspection</th>
                <th aria-label="Open asset" />
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr className={asset.selected ? 'selected' : ''} key={asset.id}>
                  <td>{asset.id}</td>
                  <td>
                    <strong>{asset.name}</strong>
                    <span>{asset.category}</span>
                  </td>
                  <td>
                    <span className={`asset-status asset-status--${getStatusClass(asset.status)}`}>{asset.status}</span>
                  </td>
                  <td>
                    <div className="asset-health">
                      <strong>{asset.health}%</strong>
                      <span><i style={{ width: `${asset.health}%` }} /></span>
                    </div>
                  </td>
                  <td>{asset.inspection}</td>
                  <td><button type="button" aria-label={`Open ${asset.name}`}>›</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer>
            <span>Showing 1-5 of 1,452 Assets</span>
            <nav aria-label="Asset pages">
              <button type="button">‹</button>
              <button className="active" type="button">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">›</button>
            </nav>
          </footer>
        </section>

        <aside className="selected-asset-card">
          <header>
            <h2>Selected Asset</h2>
            <button type="button">View Full Details</button>
          </header>
          <div className="asset-map-preview">
            <span className="asset-map-pin" />
            <small>Coordinates: 34.0522° N, 118.2437° W</small>
          </div>
          <section className="asset-detail-copy">
            <h3>Highland Blvd Lights</h3>
            <p>Central Business District - Sector 7</p>
          </section>
          <section className="asset-date-grid">
            <div>
              <span>Last Maint.</span>
              <strong>Nov 22, 2023</strong>
            </div>
            <div>
              <span>Installation</span>
              <strong>May 14, 2018</strong>
            </div>
          </section>
          <section className="degradation">
            <span>Health Degradation</span>
            <div><i /></div>
            <small>Fair Condition <strong>78%</strong></small>
          </section>
          <section className="maintenance-history">
            <h3>Maintenance History</h3>
            {maintenanceHistory.map(([title, detail]) => (
              <article key={title}>
                <span aria-hidden="true" />
                <div>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </div>
              </article>
            ))}
          </section>
          <button className="schedule-button" type="button">Schedule New Inspection</button>
        </aside>
      </section>
    </main>
  );
}
