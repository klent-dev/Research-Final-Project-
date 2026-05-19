import { normalizeUrgency } from '../utils/severity.js';

export const REPORTS_STORAGE_KEY = 'citizenwatch_reports';
export const ALERTS_STORAGE_KEY = 'citizenwatch_alerts';
export const REPORT_DRAFT_STORAGE_KEY = 'citizenwatch_report_draft';
export const LAST_SUBMITTED_REPORT_KEY = 'citizenwatch_last_submitted_report_id';

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
  return status || 'under_review';
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
    createdBy: report.createdBy || DEFAULT_CREATED_BY
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

  return nextReport;
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

  if (canUseStorage(window.sessionStorage)) {
    const lastSubmittedId = window.sessionStorage.getItem(LAST_SUBMITTED_REPORT_KEY);
    if (lastSubmittedId === id) {
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

  if (canUseStorage(window.sessionStorage)) {
    window.sessionStorage.removeItem(LAST_SUBMITTED_REPORT_KEY);
  }
}

export function updateReportStatus(id, status) {
  const reports = getReports();
  const updatedAt = new Date().toISOString();
  const nextReports = reports.map((report) =>
    report.id === id ? normalizeReport({ ...report, status, updatedAt }) : report
  );

  writeJson(window.localStorage, REPORTS_STORAGE_KEY, nextReports);
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

export function getLastSubmittedReport() {
  if (!canUseStorage(window.sessionStorage)) {
    return null;
  }

  const id = window.sessionStorage.getItem(LAST_SUBMITTED_REPORT_KEY);
  return id ? getReportById(id) : null;
}

export function buildReportFromDraft(draft) {
  const now = new Date().toISOString();

  return normalizeReport({
    id: createId(),
    trackingId: generateTrackingId(),
    issueType: draft.issueType,
    urgency: draft.urgency,
    description: draft.description,
    status: 'under_review',
    createdAt: now,
    updatedAt: now,
    location: draft.location,
    photoPreview: draft.photoPreview,
    createdBy: DEFAULT_CREATED_BY
  });
}

function deleteLinkedAlerts(reportId) {
  const alerts = readJson(window.localStorage, ALERTS_STORAGE_KEY, []);

  if (!Array.isArray(alerts)) {
    return;
  }

  const nextAlerts = alerts.filter((alert) => alert.reportId !== reportId);
  writeJson(window.localStorage, ALERTS_STORAGE_KEY, nextAlerts);
}
