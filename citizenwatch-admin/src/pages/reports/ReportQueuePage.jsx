import { useEffect, useMemo, useState } from 'react';
import {
  getLocationValidationLabel,
  normalizeLocationValidationStatus,
  publishReportToLiveReports,
  REJECTED_REPORT_REASON,
  subscribeReportsForModeration,
  unpublishReportFromLiveReports,
  updateReportStatus
} from '../../services/adminReportService.js';

const categoryFilters = ['All Assets', 'Roads', 'Drainage', 'Streetlights', 'Bridges'];
const statusFilters = ['All Statuses', 'Pending', 'In Progress', 'Completed', 'Voided by Citizen'];
const statusOrder = ['Pending', 'In Progress', 'Completed', 'Voided by Citizen'];
const statusActions = [
  { label: 'Under Review', value: 'under_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Rejected', value: 'rejected' }
];
const REPORTS_PER_PAGE = 10;

function getStatusClass(status) {
  return status.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
}

function getFilterCategory(filter) {
  if (filter === 'All Assets') return null;
  return filter;
}

function getValidationStatus(report) {
  return normalizeLocationValidationStatus(report.locationValidation?.status);
}

function getValidationLabel(report) {
  return report.locationValidation?.label || getLocationValidationLabel(report.locationValidation?.status);
}

function formatValidationDistance(report) {
  const distance = Number(report.locationValidation?.distanceMeters);
  return Number.isFinite(distance) ? `${Math.round(distance)}m difference` : 'No distance comparison';
}

function formatTrustScore(report) {
  const score = Number(report.locationValidation?.verificationScore);
  return Number.isFinite(score) ? `${Math.round(score)}/100` : 'Unavailable';
}

function formatValidationSource(report) {
  const source = String(report.locationValidation?.source || report.locationValidation?.status || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim();

  return source ? source.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Unavailable';
}

function formatValidationTimestamp(report) {
  const timestamp = report.locationValidation?.exifTimestamp;
  const date = timestamp ? new Date(timestamp) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatValidationCamera(report) {
  const validation = report.locationValidation || {};
  const cameraName = [validation.cameraMake, validation.cameraModel].filter(Boolean).join(' ').trim();
  const lensName = [validation.lensMake, validation.lensModel].filter(Boolean).join(' ').trim();

  return cameraName || lensName || 'Unavailable';
}

function ReportProgress({ report }) {
  if (report.normalizedStatus === 'rejected') {
    return <p className="report-rejected-note">{REJECTED_REPORT_REASON}</p>;
  }

  if (report.normalizedStatus === 'voided') {
    return <p className="report-voided-note">This report was deleted by the citizen and is now marked void.</p>;
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
  const [currentPage, setCurrentPage] = useState(1);

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
      .filter((report) => activeStatus === 'All Statuses' || report.displayStatus === activeStatus);
  }, [activeCategory, activeStatus, reports]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE));
  const pageStart = (currentPage - 1) * REPORTS_PER_PAGE;
  const paginatedReports = filteredReports.slice(pageStart, pageStart + REPORTS_PER_PAGE);
  const selectedReport = reports.find((report) => report.id === selectedReportId) || paginatedReports[0] || filteredReports[0] || null;
  const totalReports = reports.length || 1;
  const summary = statusOrder.map((status) => ({
    status,
    count: reports.filter((report) => report.displayStatus === status).length
  }));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeStatus]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pageEnd = Math.min(pageStart + paginatedReports.length, filteredReports.length);

  async function handleStatusAction(status) {
    if (!selectedReport) return;

    try {
      await updateReportStatus({
        reportId: selectedReport.id,
        status,
        adminId: 'local-admin'
      });
      setStatusMessage('Report status updated.');
    } catch (error) {
      console.warn('Unable to update report status.', error);
      setStatusMessage('Unable to update report status.');
    }
  }

  async function handlePublishAction() {
    if (!selectedReport) return;

    try {
      await publishReportToLiveReports({
        reportId: selectedReport.id,
        adminId: 'local-admin'
      });
      setStatusMessage('Report published to Live Reports.');
    } catch (error) {
      console.warn('Unable to publish report.', error);
      setStatusMessage('Unable to publish report to Live Reports.');
    }
  }

  async function handleUnpublishAction() {
    if (!selectedReport) return;

    try {
      await unpublishReportFromLiveReports({
        reportId: selectedReport.id,
        adminId: 'local-admin'
      });
      setStatusMessage('Report removed from Live Reports.');
    } catch (error) {
      console.warn('Unable to unpublish report.', error);
      setStatusMessage('Unable to remove report from Live Reports.');
    }
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
                <th>Validation</th>
                <th>Trust Score</th>
                <th>Review</th>
                <th>GPS Source</th>
                <th aria-label="Open report" />
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report) => (
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
                  <td>
                    <span className={`validation-chip validation-chip--${getValidationStatus(report)}`}>
                      {getValidationLabel(report)}
                    </span>
                  </td>
                  <td>{formatTrustScore(report)}</td>
                  <td>{report.locationValidation?.requiresReview ? 'Required' : 'No'}</td>
                  <td>{formatValidationSource(report)}</td>
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
            <span>
              Showing {filteredReports.length === 0 ? 0 : pageStart + 1}-{pageEnd} of {filteredReports.length} progress reports
            </span>
            {filteredReports.length > REPORTS_PER_PAGE && (
              <div className="report-pagination" aria-label="Report pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  type="button"
                >
                  Previous
                </button>
                <strong>Page {currentPage} of {totalPages}</strong>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
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
                <div>
                  <span>Location Check</span>
                  <strong>{getValidationLabel(selectedReport)}</strong>
                </div>
                <div>
                  <span>GPS Difference</span>
                  <strong>{formatValidationDistance(selectedReport)}</strong>
                </div>
                <div>
                  <span>Trust Score</span>
                  <strong>
                    {Number.isFinite(Number(selectedReport.locationValidation?.verificationScore))
                      ? `${selectedReport.locationValidation.verificationScore}/100`
                      : 'Unavailable'}
                  </strong>
                </div>
                <div>
                  <span>Review Needed</span>
                  <strong>{selectedReport.locationValidation?.requiresReview ? 'Yes' : 'No'}</strong>
                </div>
                <div>
                  <span>EXIF Timestamp</span>
                  <strong>{formatValidationTimestamp(selectedReport)}</strong>
                </div>
                <div>
                  <span>Camera Metadata</span>
                  <strong>{formatValidationCamera(selectedReport)}</strong>
                </div>
              </section>
              <section className={`validation-summary validation-summary--${getValidationStatus(selectedReport)}`}>
                <strong>{selectedReport.locationValidation?.message || 'Location validation has not been completed.'}</strong>
                <p>{selectedReport.locationValidation?.helper || 'EXIF/device GPS details will appear here when available.'}</p>
              </section>
              <section className="degradation report-progress-panel">
                <span>Progress</span>
                {selectedReport.normalizedStatus === 'rejected' ? (
                  <p className="report-rejected-note">{REJECTED_REPORT_REASON}</p>
                ) : selectedReport.normalizedStatus === 'voided' ? (
                  <p className="report-voided-note">This report was deleted by the citizen and is now marked void.</p>
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
              <section className="report-status-actions">
                <h3>Live Reports</h3>
                <div>
                  <button onClick={handlePublishAction} type="button">
                    Publish to Live Reports
                  </button>
                  <button onClick={handleUnpublishAction} type="button">
                    Unpublish from Live Reports
                  </button>
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
