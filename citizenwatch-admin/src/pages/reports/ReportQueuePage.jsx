import { useEffect, useMemo, useState } from 'react';
import {
  REJECTED_REPORT_REASON,
  subscribeReportsForModeration,
  updateReportStatus
} from '../../services/adminReportService.js';

const categoryFilters = ['All Assets', 'Roads', 'Drainage', 'Streetlights', 'Bridges'];
const statusFilters = ['All Statuses', 'Pending', 'In Progress', 'Completed'];
const statusOrder = ['Pending', 'In Progress', 'Completed'];
const statusActions = [
  { label: 'Under Review', value: 'under_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Rejected', value: 'rejected' }
];
const severityOrder = {
  critical: 0,
  moderate: 1,
  minor: 2
};

function getStatusClass(status) {
  return status.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

function getFilterCategory(filter) {
  if (filter === 'All Assets') return null;
  return filter;
}

function ReportProgress({ report }) {
  if (report.normalizedStatus === 'rejected') {
    return <p className="report-rejected-note">{REJECTED_REPORT_REASON}</p>;
  }

  return (
    <div className={`report-progress-cell report-progress-cell--${getStatusClass(report.normalizedStatus)}`}>
      <strong>{report.progress}%</strong>
      <span><i style={{ width: `${report.progress}%` }} /></span>
    </div>
  );
}

export default function ReportQueuePage() {
  const [activeCategory, setActiveCategory] = useState('All Assets');
  const [activeStatus, setActiveStatus] = useState('All Statuses');
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [statusMessage, setStatusMessage] = useState('Loading reports...');

  useEffect(() => {
    return subscribeReportsForModeration(
      { maxItems: 200 },
      (nextReports) => {
        setReports(nextReports);
        setStatusMessage(nextReports.length > 0 ? '' : 'No Firebase reports found yet.');
        setSelectedReportId((currentId) => currentId || nextReports[0]?.id || '');
      }
    );
  }, []);

  const filteredReports = useMemo(() => {
    const category = getFilterCategory(activeCategory);

    return reports
      .filter((report) => !category || report.category === category)
      .filter((report) => activeStatus === 'All Statuses' || report.displayStatus === activeStatus)
      .sort((first, second) => severityOrder[first.normalizedSeverity] - severityOrder[second.normalizedSeverity]);
  }, [activeCategory, activeStatus, reports]);

  const selectedReport = reports.find((report) => report.id === selectedReportId) || filteredReports[0] || null;
  const totalReports = reports.length || 1;
  const summary = statusOrder.map((status) => ({
    status,
    count: reports.filter((report) => report.displayStatus === status).length
  }));

  function handleStatusAction(status) {
    if (!selectedReport) return;

    updateReportStatus({
      reportId: selectedReport.id,
      status,
      adminId: 'local-admin'
    });
  }

  return (
    <main className="infrastructure-page">
      <section className="infra-heading">
        <div>
          <h2>Report Progress Monitoring</h2>
          <p>Track citizen-submitted infrastructure reports from intake to completion.</p>
        </div>
      </section>

      <section className="progress-summary-card" aria-label="Report progress summary">
        <header>
          <div>
            <h3>Progress Overview</h3>
            <p>Pending, in-progress, and completed report counts from local reports</p>
          </div>
          <strong>{reports.length} Reports</strong>
        </header>
        <div className="progress-stacked-bar" aria-hidden="true">
          {summary.map((item) => (
            <span
              className={`progress-stacked-bar__segment progress-stacked-bar__segment--${getStatusClass(item.status)}`}
              key={item.status}
              style={{ width: `${(item.count / totalReports) * 100}%` }}
            />
          ))}
        </div>
        <div className="progress-summary-list">
          {summary.map((item) => (
            <span key={item.status}>
              <i className={`progress-dot progress-dot--${getStatusClass(item.status)}`} />
              {item.status}: <strong>{item.count}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="infra-filter-row" aria-label="Report category filters">
        {categoryFilters.map((filter) => (
          <button
            className={activeCategory === filter ? 'active' : ''}
            key={filter}
            onClick={() => setActiveCategory(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </section>

      <section className="infra-filter-row infra-filter-row--status" aria-label="Report status filters">
        {statusFilters.map((filter) => (
          <button
            className={activeStatus === filter ? 'active' : ''}
            key={filter}
            onClick={() => setActiveStatus(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </section>

      <section className="infra-workspace">
        <section className="asset-table-card">
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Severity</th>
                <th aria-label="Open report" />
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr
                  className={selectedReport?.id === report.id ? 'selected' : ''}
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                >
                  <td>
                    <strong>{report.name}</strong>
                  </td>
                  <td>{report.category}</td>
                  <td>
                    <span className={`asset-status asset-status--${getStatusClass(report.normalizedStatus)}`}>{report.displayStatus}</span>
                  </td>
                  <td>
                    <ReportProgress report={report} />
                  </td>
                  <td>
                    <span className={`severity-pill severity-pill--${report.normalizedSeverity}`}>{report.normalizedSeverity}</span>
                  </td>
                  <td><button type="button" aria-label={`Open ${report.name}`}>›</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="reports-table-state">
              <h2>{statusMessage || 'No reports match the selected filters.'}</h2>
              <p>Citizen-submitted local reports will appear here.</p>
            </div>
          )}
          <footer>
            <span>Showing {filteredReports.length} progress reports</span>
          </footer>
        </section>

        <aside className="selected-asset-card">
          {selectedReport ? (
            <>
              <header>
                <h2>Selected Report</h2>
                <span className={`asset-status asset-status--${getStatusClass(selectedReport.normalizedStatus)}`}>
                  {selectedReport.displayStatus}
                </span>
              </header>
              <section className="asset-detail-copy">
                <h3>{selectedReport.name}</h3>
                <p>{selectedReport.locationText}</p>
              </section>
              <section className="report-detail-grid">
                <div>
                  <span>Category</span>
                  <strong>{selectedReport.category}</strong>
                </div>
                <div>
                  <span>Severity</span>
                  <strong>{selectedReport.normalizedSeverity}</strong>
                </div>
              </section>
              <section className="degradation report-progress-panel">
                <span>Progress</span>
                {selectedReport.normalizedStatus === 'rejected' ? (
                  <p className="report-rejected-note">{REJECTED_REPORT_REASON}</p>
                ) : (
                  <>
                    <div><i style={{ width: `${selectedReport.progress}%` }} /></div>
                    <small>{selectedReport.displayStatus} <strong>{selectedReport.progress}%</strong></small>
                  </>
                )}
              </section>
              <section className="maintenance-history">
                <h3>Short Description</h3>
                <article>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{selectedReport.sourceType || selectedReport.source || 'Citizen App'}</strong>
                    <p>{selectedReport.description}</p>
                  </div>
                </article>
              </section>
              <section className="report-status-actions">
                <h3>Status Actions</h3>
                <div>
                  {statusActions.map((action) => (
                    <button
                      key={action.value}
                      onClick={() => handleStatusAction(action.value)}
                      type="button"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="reports-table-state">
              <h2>No selected report</h2>
              <p>Select a local report to inspect progress details.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
