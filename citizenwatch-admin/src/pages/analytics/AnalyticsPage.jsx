const reports = [
  {
    id: '#INF-8842',
    category: 'Road Maintenance',
    severity: 'Critical',
    status: 'Pending',
    date: 'Oct 24, 2023 · 09:15 AM',
    tone: 'road'
  },
  {
    id: '#INF-8839',
    category: 'Street Lighting',
    severity: 'Medium',
    status: 'In Progress',
    date: 'Oct 23, 2023 · 11:30 PM',
    tone: 'light'
  },
  {
    id: '#INF-8835',
    category: 'Water & Sewage',
    severity: 'High',
    status: 'Assigned',
    date: 'Oct 23, 2023 · 02:45 PM',
    tone: 'water'
  },
  {
    id: '#INF-8831',
    category: 'Waste Management',
    severity: 'Low',
    status: 'Resolved',
    date: 'Oct 22, 2023 · 10:20 AM',
    tone: 'waste'
  },
  {
    id: '#INF-8828',
    category: 'Traffic Signage',
    severity: 'Medium',
    status: 'Pending',
    date: 'Oct 22, 2023 · 08:00 AM',
    tone: 'traffic'
  }
];

const filters = [
  ['Category', 'All Categories'],
  ['Severity', 'All Severities'],
  ['Status', 'All Statuses'],
  ['Barangay', 'All Districts']
];

function Icon({ name }) {
  const paths = {
    search: 'M10 4a6 6 0 0 1 4.8 9.6l4.3 4.3-1.4 1.4-4.3-4.3A6 6 0 1 1 10 4Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    bell: 'M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22Zm7-5-1.7-2.2V10a5.3 5.3 0 0 0-4-5.1V3a1.3 1.3 0 0 0-2.6 0v1.9a5.3 5.3 0 0 0-4 5.1v4.8L5 17v1.2h14V17Z',
    refresh: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h8V3l-3.3 3.3Z',
    message: 'M4 5h16v11H8.2L4 19.2V5Zm2 2v8.1l1.5-1.1H18V7H6Z',
    download: 'M11 4h2v8l3-3 1.4 1.4-5.4 5.4-5.4-5.4L8 9l3 3V4ZM5 18h14v2H5v-2Z',
    bulk: 'M12 5a7 7 0 1 0 6.3 4h-2.2A5 5 0 1 1 12 7v3l5-4-5-4v3Z'
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function getSeverityClass(severity) {
  return severity.toLowerCase();
}

function getStatusClass(status) {
  return status.toLowerCase().replaceAll(' ', '-');
}

export default function AnalyticsPage() {
  return (
    <main className="reports-management-page">
      <header className="reports-topbar">
        <h1>Infrastructure Monitoring</h1>
        <label className="reports-search">
          <Icon name="search" />
          <input placeholder="Search report ID, citizen, or keywords..." type="search" />
        </label>
        <button type="button" aria-label="Notifications"><Icon name="bell" /></button>
        <button type="button" aria-label="Refresh"><Icon name="refresh" /></button>
        <button type="button" aria-label="Messages"><Icon name="message" /></button>
        <button className="reports-emergency" type="button">Emergency Alert</button>
        <span className="reports-avatar" aria-hidden="true">AU</span>
      </header>

      <section className="reports-management-content">
        <header className="reports-title-row">
          <div>
            <h2>Reports Management</h2>
            <p>Manage and triage citizen-reported infrastructure issues across the municipality.</p>
          </div>
          <div className="reports-title-actions">
            <button type="button"><Icon name="download" />Export Data</button>
            <button className="bulk-update-button" type="button"><Icon name="bulk" />Bulk Update Status</button>
          </div>
        </header>

        <section className="reports-filter-row" aria-label="Report filters">
          {filters.map(([label, value]) => (
            <button key={label} type="button">
              <span>{label}</span>
              {value}
              <i aria-hidden="true">⌄</i>
            </button>
          ))}
          <button className="clear-filters-button" type="button">Clear All Filters</button>
        </section>

        <section className="reports-table-card">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" aria-label="Select all reports" /></th>
                <th>Report ID</th>
                <th>Thumbnail</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td><input type="checkbox" aria-label={`Select ${report.id}`} /></td>
                  <td><strong>{report.id}</strong></td>
                  <td><span className={`report-thumb report-thumb--${report.tone}`} /></td>
                  <td>{report.category}</td>
                  <td>
                    <span className={`severity-chip severity-chip--${getSeverityClass(report.severity)}`}>
                      {report.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`report-status report-status--${getStatusClass(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{report.date}</td>
                  <td><button type="button">View Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer>
            <span>Showing 1-5 of 1,248 reports</span>
            <nav aria-label="Report pages">
              <button disabled type="button">‹</button>
              <button className="active" type="button">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button">42</button>
              <button type="button">›</button>
            </nav>
          </footer>
        </section>
      </section>
    </main>
  );
}
