import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { subscribeReportsForModeration, updateReportStatus } from '../../services/adminReportService.js';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { REPORT_STATUS } from '../../utils/constants.js';

const categoryOptions = [
  'All Categories',
  'Road Maintenance',
  'Road Damage',
  'Street Lighting',
  'Street Light',
  'Water & Sewage',
  'Drainage',
  'Waste Management',
  'Garbage Collection',
  'Traffic Signage',
  'Flooding',
  'Illegal Dumping',
  'Public Safety',
  'Sidewalk Obstruction',
  'Bridge Maintenance',
  'Canal Clearing',
  'Others'
];

const severityOptions = ['All Severities', 'Critical', 'Moderate', 'Minor'];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: REPORT_STATUS.SUBMITTED, label: 'Pending' },
  { value: REPORT_STATUS.UNDER_REVIEW, label: 'Under Review' },
  { value: REPORT_STATUS.VERIFIED, label: 'Verified' },
  { value: REPORT_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: REPORT_STATUS.RESOLVED, label: 'Resolved' },
  { value: REPORT_STATUS.REJECTED, label: 'Rejected' }
];

const REPORT_MAP_CENTER = {
  lat: 14.5995,
  lng: 120.9842
};

const reportDetailIcon = L.divIcon({
  className: 'community-leaflet-marker community-leaflet-marker--road report-detail-leaflet-marker',
  html: '<span></span>',
  iconAnchor: [22, 22],
  iconSize: [44, 44]
});

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

function getStatusLabel(status) {
  return statusOptions.find((option) => option.value === status)?.label || status || 'Pending';
}

function getSeverityClass(severity = '') {
  const normalized = String(severity || '').toLowerCase();
  if (normalized.includes('critical') || normalized.includes('high')) return 'critical';
  if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate';
  return 'minor';
}

function getSeverityLabel(severity = '') {
  const severityClass = getSeverityClass(severity);
  if (severityClass === 'critical') return 'Critical';
  if (severityClass === 'moderate') return 'Moderate';
  return 'Minor';
}

function getStatusClass(status = '') {
  return status.toLowerCase().replaceAll('_', '-');
}

function canSelectReport(status = '') {
  return [REPORT_STATUS.RESOLVED, REPORT_STATUS.REJECTED].includes(status);
}

function getCategoryTone(category = '') {
  const normalized = category.toLowerCase();

  if (normalized.includes('street') || normalized.includes('light')) return 'light';
  if (normalized.includes('water') || normalized.includes('drain')) return 'water';
  if (normalized.includes('waste') || normalized.includes('garbage')) return 'waste';
  if (normalized.includes('traffic')) return 'traffic';
  return 'road';
}

function getReportAddress(report) {
  return report.address || report.location?.address || 'Location not provided';
}

function getReportLatitude(report) {
  return Number(report.latitude ?? report.location?.lat);
}

function getReportLongitude(report) {
  return Number(report.longitude ?? report.location?.lng);
}

function getReportImage(report) {
  return report.imageUrl || report.photoUrl || report.evidenceImage || report.photoPreview || '';
}

function formatDate(value) {
  let date = null;

  if (value?.toDate) {
    date = value.toDate();
  } else if (value) {
    date = new Date(value);
  }

  if (!date || Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ReportDetailMapBridge({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);

  return null;
}

function ReportDetailMap({ report }) {
  const mapRef = useRef(null);
  const lat = getReportLatitude(report);
  const lng = getReportLongitude(report);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  const position = hasCoordinates ? [lat, lng] : [REPORT_MAP_CENTER.lat, REPORT_MAP_CENTER.lng];

  function handleZoomIn() {
    mapRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapRef.current?.zoomOut();
  }

  function handleCenterMap() {
    mapRef.current?.setView(position, hasCoordinates ? 15 : 13);
  }

  return (
    <div className="report-detail-map">
      <MapContainer
        attributionControl
        center={position}
        className="report-detail-leaflet-map"
        scrollWheelZoom
        zoom={hasCoordinates ? 15 : 13}
        zoomControl={false}
      >
        <ReportDetailMapBridge mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasCoordinates && (
          <Marker icon={reportDetailIcon} position={position}>
            <Popup>
              <strong>{report.category || 'Infrastructure Report'}</strong>
              <br />
              {getReportAddress(report)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="report-detail-map-controls" aria-label="Map controls">
        <button onClick={handleZoomIn} type="button" aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} type="button" aria-label="Zoom out">-</button>
        <button onClick={handleCenterMap} type="button" aria-label="Center report map">o</button>
      </div>
    </div>
  );
}

function ReportDetailsDrawer({ report, adminId, isSaving, onClose, onSave }) {
  const [nextStatus, setNextStatus] = useState(report?.status || REPORT_STATUS.SUBMITTED);
  const [remarks, setRemarks] = useState(report?.adminNotes || report?.remarks || '');
  const imageUrl = report ? getReportImage(report) : '';
  const lat = report ? getReportLatitude(report) : null;
  const lng = report ? getReportLongitude(report) : null;

  useEffect(() => {
    setNextStatus(report?.status || REPORT_STATUS.SUBMITTED);
    setRemarks(report?.adminNotes || report?.remarks || '');
  }, [report]);

  if (!report) return null;

  function handleSave() {
    onSave({
      reportId: report.id,
      status: nextStatus,
      adminId,
      remarks
    });
  }

  return (
    <div className="report-detail-overlay" role="presentation" onMouseDown={onClose}>
      <aside
        aria-label={`${report.id} report details`}
        className="report-detail-drawer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="report-detail-header">
          <div>
            <strong>{report.trackingId || report.id}</strong>
            <span className={`severity-chip severity-chip--${getSeverityClass(report.severity || report.urgency)}`}>
              {getSeverityLabel(report.severity || report.urgency)}
            </span>
            <p>
              <span className={`report-status report-status--${getStatusClass(report.status)}`}>
                {getStatusLabel(report.status)}
              </span>
              {formatDate(report.createdAt)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close report details">x</button>
        </header>

        <section className="report-detail-card">
          <h3>Evidence</h3>
          {imageUrl ? (
            <img className="report-detail-evidence-image" src={imageUrl} alt="Report evidence" />
          ) : (
            <div className={`report-detail-evidence report-detail-evidence--${getCategoryTone(report.category)}`} />
          )}
          <small>{imageUrl ? 'Evidence image' : 'No uploaded evidence image'}</small>
        </section>

        <section className="report-detail-card">
          <h3>Report Information</h3>
          <div className="report-detail-meta">
            <div>
              <span>Category</span>
              <strong>{report.category || report.issueType || 'Other'}</strong>
            </div>
            <div>
              <span>Reporter</span>
              <strong>{report.reporterName || report.createdByName || report.reporterId || 'Unknown citizen'}</strong>
            </div>
          </div>
          <div className="report-detail-copy">
            <span>Description</span>
            <p>{report.description || 'No description provided.'}</p>
          </div>
          <div className="report-detail-copy">
            <span>Location</span>
            <p>{getReportAddress(report)}</p>
            <small>
              {Number.isFinite(lat) && Number.isFinite(lng)
                ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                : 'Coordinates unavailable'}
            </small>
          </div>
          <div className="report-detail-meta">
            <div>
              <span>Reporter ID</span>
              <strong>{report.reporterId || report.createdBy || 'Unavailable'}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{formatDate(report.createdAt)}</strong>
            </div>
          </div>
        </section>

        <section className="report-detail-card">
          <h3>Map Preview</h3>
          <ReportDetailMap key={report.id} report={report} />
        </section>

        <section className="report-detail-card">
          <h3>Update Status</h3>
          <label>
            Change Status
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
              {statusOptions.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Internal Remarks
            <textarea
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Add notes for internal coordination..."
              value={remarks}
            />
          </label>
          <div className="report-detail-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button disabled={isSaving} onClick={handleSave} type="button">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>

        <section className="report-detail-card">
          <h3>Activity Log</h3>
          <ol className="report-activity-log">
            <li>
              <strong>Last Updated</strong>
              <span>{formatDate(report.updatedAt)}</span>
            </li>
            <li>
              <strong>Report Submitted</strong>
              <span>{formatDate(report.createdAt)}</span>
            </li>
          </ol>
        </section>
      </aside>
    </div>
  );
}

export default function AnalyticsPage() {
  const { admin } = useAdminAuth();
  const [reports, setReports] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage('');

    const unsubscribe = subscribeReportsForModeration(
      { status: statusFilter || undefined, maxItems: 50 },
      (nextReports) => {
        setReports(nextReports);
        setIsLoading(false);
      },
      (error) => {
        console.error('Report subscription failed:', error);
        setErrorMessage('Unable to load reports from Firestore.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [statusFilter]);

  useEffect(() => {
    if (!selectedReport) return;

    const updatedReport = reports.find((report) => report.id === selectedReport.id);
    if (updatedReport) {
      setSelectedReport(updatedReport);
    }
  }, [reports, selectedReport]);

  const displayedReports = useMemo(() => {
    return reports.filter((report) => {
      const reportSeverity = getSeverityLabel(report.severity || report.urgency);

      return (
        (categoryFilter === 'All Categories' || report.category === categoryFilter) &&
        (severityFilter === 'All Severities' || reportSeverity === severityFilter) &&
        (!statusFilter || report.status === statusFilter)
      );
    });
  }, [categoryFilter, reports, severityFilter, statusFilter]);
  const selectedCount = selectedReportIds.length;

  const tableMessage = useMemo(() => {
    if (isLoading) return 'Loading reports...';
    if (errorMessage) return errorMessage;
    if (displayedReports.length === 0) return 'No reports found.';
    return '';
  }, [displayedReports.length, errorMessage, isLoading]);

  async function handleSaveReportStatus(updatePayload) {
    setIsSaving(true);
    setErrorMessage('');

    try {
      setReports((currentReports) => (
        currentReports.map((report) => (
          report.id === updatePayload.reportId
            ? {
                ...report,
                adminNotes: updatePayload.remarks || updatePayload.notes || report.adminNotes,
                remarks: updatePayload.remarks || updatePayload.notes || report.remarks,
                reviewedBy: updatePayload.adminId || report.reviewedBy,
                status: updatePayload.status,
                updatedAt: new Date().toISOString()
              }
            : report
        ))
      ));
      await updateReportStatus(updatePayload);
      setSelectedReport(null);
    } catch (error) {
      console.error('Unable to update report status:', error);
      setErrorMessage('Unable to save report changes.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleToggleReportSelection(reportId) {
    setSelectedReportIds((currentIds) => (
      currentIds.includes(reportId)
        ? currentIds.filter((id) => id !== reportId)
        : [...currentIds, reportId]
    ));
  }

  function handleDeleteSelectedReports() {
    setReports((currentReports) => (
      currentReports.filter((report) => !selectedReportIds.includes(report.id))
    ));

    if (selectedReport && selectedReportIds.includes(selectedReport.id)) {
      setSelectedReport(null);
    }

    setSelectedReportIds([]);
  }

  function handleClearFilters() {
    setCategoryFilter('All Categories');
    setSeverityFilter('All Severities');
    setStatusFilter('');
  }

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
          <label className="reports-filter-select">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="reports-filter-select">
            <span>Severity</span>
            <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
          </label>
          <label className="reports-status-filter">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button className="clear-filters-button" onClick={handleClearFilters} type="button">
            Clear All Filters
          </button>
        </section>

        <section className="reports-table-card">
          {tableMessage ? (
            <div className={errorMessage ? 'reports-table-state reports-table-state--error' : 'reports-table-state'}>
              {tableMessage}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th aria-label="Selectable reports" />
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
                {displayedReports.map((report) => {
                  const imageUrl = getReportImage(report);
                  const severity = getSeverityLabel(report.severity || report.urgency);

                  return (
                    <tr key={report.id}>
                      <td>
                        {canSelectReport(report.status) && (
                          <input
                            aria-label={`Select ${report.trackingId || report.id}`}
                            checked={selectedReportIds.includes(report.id)}
                            onChange={() => handleToggleReportSelection(report.id)}
                            type="checkbox"
                          />
                        )}
                      </td>
                      <td><strong>{report.trackingId || report.id}</strong></td>
                      <td>
                        {imageUrl ? (
                          <img className="report-thumb-image" src={imageUrl} alt="" />
                        ) : (
                          <span className={`report-thumb report-thumb--${getCategoryTone(report.category)}`} />
                        )}
                      </td>
                      <td>{report.category || report.issueType || 'Other'}</td>
                      <td>
                        <span className={`severity-chip severity-chip--${getSeverityClass(severity)}`}>
                          {severity}
                        </span>
                      </td>
                      <td>
                        <span className={`report-status report-status--${getStatusClass(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td><button type="button" onClick={() => setSelectedReport(report)}>View Details</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <footer>
            <span>Showing {displayedReports.length} report{displayedReports.length === 1 ? '' : 's'}</span>
            <nav aria-label="Report pages">
              <button disabled type="button">&lt;</button>
              <button className="active" type="button">1</button>
              <button disabled type="button">&gt;</button>
            </nav>
          </footer>
        </section>
        {selectedCount > 0 && (
          <div className="reports-delete-bar">
            <span>{selectedCount} selected</span>
            <button onClick={handleDeleteSelectedReports} type="button">
              Delete Selected
            </button>
          </div>
        )}
      </section>
      <ReportDetailsDrawer
        adminId={admin?.uid}
        isSaving={isSaving}
        onClose={() => setSelectedReport(null)}
        onSave={handleSaveReportStatus}
        report={selectedReport}
      />
    </main>
  );
}
