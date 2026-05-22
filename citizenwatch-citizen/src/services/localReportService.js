import { normalizeUrgency } from '../utils/severity.js';

export const REPORTS_STORAGE_KEY = 'citizenwatch_reports';
export const ALERTS_STORAGE_KEY = 'citizenwatch_alerts';
export const REPORT_DRAFT_STORAGE_KEY = 'citizenwatch_report_draft';
export const LAST_SUBMITTED_REPORT_KEY = 'citizenwatch_last_submitted_report_id';
export const LAST_SUBMITTED_REPORT_REF_KEY = 'citizenwatch_last_submitted_report';
export const HIDDEN_REPORTS_STORAGE_KEY = 'citizenwatch_hidden_report_ids';

const DEFAULT_CREATED_BY = 'local-citizen';

function canUseStorage(storage) {
  return typeof window !== 'undefined' && Boolean(storage);
}

function readJson(storage, key, fallback) {
  if (!canUseStorage(storage)) {
    return fallback;
  }

  try {
    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue);
  } catch (error) {
    console.warn(`Unable to read ${key} from storage.`, error);
    return fallback;
  }
}

function writeJson(storage, key, value) {
  if (!canUseStorage(storage)) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to write ${key} to storage.`, error);
  }
}

function notifyReportsChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event('citizenwatch:reports-updated'));
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeStatus(status) {
  return status || 'submitted';
}

function normalizeReport(report) {
  const now = new Date().toISOString();
  const issueType = report.issueType || report.category || 'Infrastructure Issue';
  const status = normalizeStatus(report.status);

  return {
    id: report.id || createId(),
    trackingId: report.trackingId || generateTrackingId(),
    issueType,
    category: issueType,
    title: report.title || `${issueType} Report`,
    urgency: normalizeUrgency(report.urgency),
    description: report.description || 'No description provided.',
    status,
    createdAt: report.createdAt || now,
    updatedAt: report.updatedAt || now,
    location: {
      lat: report.location?.lat ?? null,
      lng: report.location?.lng ?? null,
      accuracy: report.location?.accuracy ?? null,
      address: report.location?.address || 'Location not selected',
      subAddress: report.location?.subAddress || '',
      source: report.location?.source || null
    },
    photoPreview: report.photoPreview || '',
    photoUrl: report.photoPreview || report.photoUrl || '',
    deviceLocation: report.deviceLocation || null,
    locationValidation: report.locationValidation || null,
    createdBy: report.createdBy || DEFAULT_CREATED_BY,
    reporterId: report.reporterId || report.createdBy || DEFAULT_CREATED_BY,
    reporterName: report.reporterName || '',
    firestoreReportId: report.firestoreReportId || '',
    syncedToFirestore: Boolean(report.syncedToFirestore || report.firestoreReportId)
  };
}

export function getReports() {
  const reports = readJson(window.localStorage, REPORTS_STORAGE_KEY, []);

  if (!Array.isArray(reports)) {
    return [];
  }

  return reports
    .map(normalizeReport)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
}

export function saveReport(report) {
  const nextReport = normalizeReport(report);
  const reports = getReports();
  const nextReports = [nextReport, ...reports.filter((item) => item.id !== nextReport.id)];

  // TODO: Replace localStorage with Firestore backend
  writeJson(window.localStorage, REPORTS_STORAGE_KEY, nextReports);
  setLastSubmittedReportId(nextReport.id);
  notifyReportsChanged();

  return nextReport;
}

export function markReportSynced(localReportId, firestoreReportId) {
  const reports = getReports();
  const updatedAt = new Date().toISOString();
  const nextReports = reports.map((report) =>
    report.id === localReportId
      ? normalizeReport({
        ...report,
        firestoreReportId,
        syncedToFirestore: true,
        updatedAt
      })
      : report
  );

  writeJson(window.localStorage, REPORTS_STORAGE_KEY, nextReports);
  notifyReportsChanged();
  return nextReports;
}

export function getReportById(id) {
  return getReports().find((report) => report.id === id) || null;
}

export function deleteReport(id) {
  const reports = getReports();
  const nextReports = reports.filter((report) => report.id !== id);

  // TODO: Replace localStorage with Firestore backend
  writeJson(window.localStorage, REPORTS_STORAGE_KEY, nextReports);
  deleteLinkedAlerts(id);
  notifyReportsChanged();

  if (canUseStorage(window.sessionStorage)) {
    const lastSubmittedId = window.sessionStorage.getItem(LAST_SUBMITTED_REPORT_KEY);
    if (lastSubmittedId === id) {
      window.sessionStorage.removeItem(LAST_SUBMITTED_REPORT_KEY);
    }
  }

  return nextReports;
}

function getReportIdentityKeys(reportOrId) {
  if (!reportOrId) {
    return [];
  }

  if (typeof reportOrId === 'string') {
    return [reportOrId];
  }

  return [
    reportOrId.id,
    reportOrId.reportId,
    reportOrId.firestoreReportId,
    reportOrId.trackingId
  ].filter(Boolean);
}

export function getHiddenReportIds() {
  return readJson(window.localStorage, HIDDEN_REPORTS_STORAGE_KEY, []);
}

export function isReportHiddenForCitizen(report) {
  const hiddenIds = new Set(getHiddenReportIds());
  return getReportIdentityKeys(report).some((key) => hiddenIds.has(key));
}

export function isReportVoidedByCitizen(report = {}) {
  const normalizedStatus = String(report.status || '').trim().toLowerCase();

  return (
    report.deletedByCitizen === true ||
    report.voidedByCitizen === true ||
    normalizedStatus === 'voided_by_citizen' ||
    normalizedStatus === 'voided by citizen' ||
    normalizedStatus === 'deleted_by_citizen'
  );
}

export function isReportVisibleForCitizen(report) {
  return !isReportHiddenForCitizen(report) && !isReportVoidedByCitizen(report);
}

export function hideReportForCitizen(report) {
  const reportKeys = getReportIdentityKeys(report);

  if (reportKeys.length === 0) {
    return getReports();
  }

  const hiddenIds = new Set(getHiddenReportIds());
  reportKeys.forEach((key) => hiddenIds.add(key));
  writeJson(window.localStorage, HIDDEN_REPORTS_STORAGE_KEY, Array.from(hiddenIds));

  const reports = getReports();
  const nextReports = reports.filter((savedReport) => !getReportIdentityKeys(savedReport).some((key) => hiddenIds.has(key)));
  writeJson(window.localStorage, REPORTS_STORAGE_KEY, nextReports);
  reportKeys.forEach(deleteLinkedAlerts);
  notifyReportsChanged();

  if (canUseStorage(window.sessionStorage)) {
    const lastSubmittedId = window.sessionStorage.getItem(LAST_SUBMITTED_REPORT_KEY);
    if (reportKeys.includes(lastSubmittedId)) {
      window.sessionStorage.removeItem(LAST_SUBMITTED_REPORT_KEY);
    }
  }

  return nextReports;
}

export function clearReports() {
  if (!canUseStorage(window.localStorage)) {
    return;
  }

  window.localStorage.removeItem(REPORTS_STORAGE_KEY);
  window.localStorage.removeItem(ALERTS_STORAGE_KEY);
  window.localStorage.removeItem(HIDDEN_REPORTS_STORAGE_KEY);
  window.localStorage.removeItem(LAST_SUBMITTED_REPORT_REF_KEY);
  notifyReportsChanged();

  if (canUseStorage(window.sessionStorage)) {
    window.sessionStorage.removeItem(LAST_SUBMITTED_REPORT_KEY);
    window.sessionStorage.removeItem(LAST_SUBMITTED_REPORT_REF_KEY);
  }
}

export function updateReportStatus(id, status) {
  const reports = getReports();
  const updatedAt = new Date().toISOString();
  const nextReports = reports.map((report) =>
    report.id === id ? normalizeReport({ ...report, status, updatedAt }) : report
  );

  writeJson(window.localStorage, REPORTS_STORAGE_KEY, nextReports);
  notifyReportsChanged();
  return nextReports.find((report) => report.id === id) || null;
}

export function generateTrackingId() {
  const code = Math.floor(1000 + Math.random() * 9000);
  return `#INF-${code}`;
}

export function formatRelativeTime(value) {
  const date = toDate(value);

  if (!date) {
    return 'Just now';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

export function formatReportDate(value) {
  const date = toDate(value);

  if (!date) {
    return 'Recently';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

export function getStatusColor(status = '') {
  const normalized = status.toUpperCase();

  if (normalized.includes('REJECT') || normalized.includes('NOT VERIFIED')) {
    return 'rejected';
  }

  if (normalized.includes('VOID') || normalized.includes('DELETED') || normalized.includes('CANCEL')) {
    return 'voided';
  }

  if (normalized.includes('RESOLVED')) {
    return 'resolved';
  }

  if (normalized.includes('VERIFIED')) {
    return 'verified';
  }

  return 'review';
}

export function formatStatusLabel(status = '') {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'under_review' || normalized === 'under review' || normalized === 'review') {
    return 'UNDER REVIEW';
  }

  if (normalized === 'in_progress' || normalized === 'in progress') {
    return 'IN PROGRESS';
  }

  if (normalized === 'rejected' || normalized === 'not_verified' || normalized === 'not verified') {
    return 'NOT VERIFIED';
  }

  if (
    normalized === 'voided_by_citizen' ||
    normalized === 'voided by citizen' ||
    normalized === 'deleted_by_citizen' ||
    normalized === 'cancelled'
  ) {
    return 'VOIDED BY CITIZEN';
  }

  return normalized ? normalized.replace(/_/g, ' ').toUpperCase() : 'UNDER REVIEW';
}

export function getReportDraft() {
  return readJson(window.sessionStorage, REPORT_DRAFT_STORAGE_KEY, {});
}

export function saveReportDraft(partialDraft) {
  const currentDraft = getReportDraft();
  const nextDraft = {
    ...currentDraft,
    ...partialDraft,
    updatedAt: new Date().toISOString()
  };

  writeJson(window.sessionStorage, REPORT_DRAFT_STORAGE_KEY, nextDraft);
  return nextDraft;
}

export function clearReportDraft() {
  if (!canUseStorage(window.sessionStorage)) {
    return;
  }

  window.sessionStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
}

export function setLastSubmittedReportId(id) {
  if (!canUseStorage(window.sessionStorage)) {
    return;
  }

  window.sessionStorage.setItem(LAST_SUBMITTED_REPORT_KEY, id);
}

export function setLastSubmittedReportReference(report) {
  if (!canUseStorage(window.sessionStorage) || !report) {
    return;
  }

  const submittedReference = {
    id: report.id || report.reportId || '',
    reportId: report.reportId || report.id || '',
    trackingId: report.trackingId || '',
    issueType: report.issueType || report.category || '',
    status: report.status || 'under_review',
    createdAt: report.createdAt || new Date().toISOString()
  };

  writeJson(window.sessionStorage, LAST_SUBMITTED_REPORT_REF_KEY, submittedReference);

  if (canUseStorage(window.localStorage)) {
    writeJson(window.localStorage, LAST_SUBMITTED_REPORT_REF_KEY, submittedReference);
  }

  if (report.id || report.reportId) {
    window.sessionStorage.setItem(LAST_SUBMITTED_REPORT_KEY, report.id || report.reportId);
  }
}

export function getLastSubmittedReportReference() {
  return (
    readJson(window.sessionStorage, LAST_SUBMITTED_REPORT_REF_KEY, null) ||
    readJson(window.localStorage, LAST_SUBMITTED_REPORT_REF_KEY, null)
  );
}

export function getLastSubmittedReport() {
  if (!canUseStorage(window.sessionStorage) && !canUseStorage(window.localStorage)) {
    return null;
  }

  const submittedReference = getLastSubmittedReportReference();
  if (submittedReference) {
    return submittedReference;
  }

  const id = canUseStorage(window.sessionStorage)
    ? window.sessionStorage.getItem(LAST_SUBMITTED_REPORT_KEY)
    : '';
  return id ? getReportById(id) : null;
}

export function buildReportFromDraft(draft) {
  const now = new Date().toISOString();

  return {
    ...normalizeReport({
    id: createId(),
    trackingId: draft.trackingId || generateTrackingId(),
    issueType: draft.issueType,
    urgency: draft.urgency,
    description: draft.description,
    status: draft.status || 'under_review',
    createdAt: now,
    updatedAt: now,
    location: draft.location,
    photoPreview: draft.photoPreview,
    createdBy: draft.createdBy || DEFAULT_CREATED_BY
    }),
    selectedFile: draft.selectedFile || null,
    photoFile: draft.photoFile || draft.selectedFile || null,
    exif: draft.exif || null,
    deviceLocation: draft.deviceLocation || null,
    locationValidation: draft.locationValidation || null
  };
}

function deleteLinkedAlerts(reportId) {
  const alerts = readJson(window.localStorage, ALERTS_STORAGE_KEY, []);

  if (!Array.isArray(alerts)) {
    return;
  }

  const nextAlerts = alerts.filter((alert) => alert.reportId !== reportId);
  writeJson(window.localStorage, ALERTS_STORAGE_KEY, nextAlerts);
}
