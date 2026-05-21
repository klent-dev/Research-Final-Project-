import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config.js';

const ADMIN_REPORTS_STORAGE_KEY = 'citizenwatch_admin_reports';
const CITIZEN_REPORTS_STORAGE_KEY = 'citizenwatch_reports';
const LOCAL_STORAGE_REPORT_KEYS = [
  ADMIN_REPORTS_STORAGE_KEY,
  CITIZEN_REPORTS_STORAGE_KEY,
  'citizenwatch_alerts',
  'citizenwatch_saved_report_draft'
];

export const REJECTED_REPORT_REASON = 'This report is either fake, not traceable, or no problem was found after review.';

const listeners = new Set();

function shouldUseFirestore() {
  return Boolean(isFirebaseConfigured && db);
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function clearLocalReportStorage() {
  if (!canUseStorage()) return;

  LOCAL_STORAGE_REPORT_KEYS.forEach((key) => window.localStorage.removeItem(key));

  if (typeof window.sessionStorage !== 'undefined') {
    window.sessionStorage.removeItem('citizenwatch_last_submitted_report_id');
    window.sessionStorage.removeItem('citizenwatch_report_draft');
  }
}

function getReportsCollection() {
  return collection(db, 'reports');
}

function notifyReportListeners() {
  listeners.forEach(({ filters, onReports }) => {
    onReports(applyFilters([], filters));
  });
}

function toMillis(value) {
  if (value?.toDate) return value.toDate().getTime();
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function applyFilters(reports, { status, maxItems = 200 } = {}) {
  const activeReports = reports.filter((report) => !report.deleted && !report.isDeleted);
  const filteredReports = status
    ? activeReports.filter((report) => normalizeReportStatus(report.status) === normalizeReportStatus(status))
    : activeReports;

  return filteredReports
    .slice()
    .sort((first, second) => toMillis(second.createdAt) - toMillis(first.createdAt))
    .slice(0, maxItems)
    .map(normalizeAdminReport);
}

function applyFirestoreFilters(snapshot, filters = {}) {
  return applyFilters(
    snapshot.docs.map((reportDoc) => ({
      id: reportDoc.id,
      ...reportDoc.data()
    })),
    filters
  );
}

export function normalizeReportStatus(status = '') {
  const normalized = String(status).toLowerCase().replaceAll('_', ' ');

  if (normalized.includes('complete') || normalized.includes('resolved')) {
    return 'completed';
  }

  if (normalized.includes('reject')) {
    return 'rejected';
  }

  if (normalized.includes('progress') || normalized.includes('review') || normalized.includes('verified')) {
    return 'in_progress';
  }

  return 'pending';
}

export function getDisplayStatus(status = '') {
  const normalized = normalizeReportStatus(status);

  if (normalized === 'in_progress') return 'In Progress';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'rejected') return 'Rejected';
  return 'Pending';
}

export function normalizeReportSeverity(report = {}) {
  const normalized = String(report.severity || report.urgency || 'minor').toLowerCase();

  if (normalized.includes('critical')) return 'critical';
  if (normalized.includes('high')) return 'critical';
  if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate';
  return 'minor';
}

export function normalizeReportCategory(report = {}) {
  const rawCategory = String(report.category || report.issueType || 'Others').toLowerCase();

  if (rawCategory.includes('road') || rawCategory.includes('pothole') || rawCategory.includes('maintenance')) {
    return 'Roads';
  }

  if (rawCategory.includes('drain') || rawCategory.includes('water') || rawCategory.includes('sewage')) {
    return 'Drainage';
  }

  if (rawCategory.includes('street') || rawCategory.includes('light')) {
    return 'Streetlights';
  }

  if (rawCategory.includes('bridge')) {
    return 'Bridges';
  }

  if (rawCategory.includes('waste') || rawCategory.includes('garbage') || rawCategory.includes('trash')) {
    return 'Waste Management';
  }

  return report.category || report.issueType || 'Others';
}

export function calculateReportProgress(report = {}) {
  const status = normalizeReportStatus(report.status);

  if (status === 'completed') return 100;
  if (status === 'in_progress') return 50;
  return 0;
}

export function getReportCoordinates(report = {}) {
  const lat = Number(report.latitude ?? report.location?.latitude ?? report.location?.lat);
  const lng = Number(report.longitude ?? report.location?.longitude ?? report.location?.lng);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function normalizeAdminReport(report = {}) {
  const category = normalizeReportCategory(report);
  const coordinates = getReportCoordinates(report);

  return {
    ...report,
    id: report.id,
    reportId: report.reportId || report.trackingId || report.id,
    name: report.name || report.title || `${category} Report`,
    title: report.title || report.name || `${category} Report`,
    category,
    district: report.district || report.barangay || report.location?.district || report.location?.barangay || 'Unassigned District',
    locationText:
      report.locationText ||
      report.address ||
      report.location?.address ||
      (typeof report.location === 'string' ? report.location : '') ||
      'Location not provided',
    latitude: coordinates?.lat ?? null,
    longitude: coordinates?.lng ?? null,
    normalizedStatus: normalizeReportStatus(report.status),
    displayStatus: getDisplayStatus(report.status),
    normalizedSeverity: normalizeReportSeverity(report),
    progress: calculateReportProgress(report),
    description: report.description || 'No description provided.',
    sourceType: report.sourceType || report.source || 'Citizen App',
    updatedAt: report.updatedAt || report.createdAt || null
  };
}

export async function getReportsForModeration(filters = {}) {
  clearLocalReportStorage();

  if (!shouldUseFirestore()) {
    return applyFilters([], filters);
  }

  const reportsQuery = query(getReportsCollection(), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(reportsQuery);
  return applyFirestoreFilters(snapshot, filters);
}

export function subscribeReportsForModeration(filters = {}, onReports, onError) {
  clearLocalReportStorage();

  if (!shouldUseFirestore()) {
    onReports([]);
    return () => {};
  }

  const reportsQuery = query(getReportsCollection(), orderBy('createdAt', 'desc'));

  return onSnapshot(
    reportsQuery,
    (snapshot) => onReports(applyFirestoreFilters(snapshot, filters)),
    (error) => {
      console.error('Unable to subscribe to Firestore reports.', error);
      onReports([]);
      onError?.(error);
    }
  );
}

export function updateReportStatus({
  reportId,
  status,
  adminId,
  notes = '',
  remarks = '',
  assignedTeam,
  progress,
  description,
  subtasks
}) {
  if (!shouldUseFirestore()) {
    clearLocalReportStorage();
    notifyReportListeners();
    return Promise.resolve();
  }

  const adminNotes = remarks || notes;
  const updatePayload = {
    ...(status !== undefined ? { status } : {}),
    ...(assignedTeam !== undefined ? { assignedTeam } : {}),
    ...(progress !== undefined ? { progress } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(subtasks !== undefined ? { subtasks } : {}),
    adminNotes,
    remarks: adminNotes,
    reviewedBy: adminId || null,
    updatedBy: adminId || null,
    updatedAt: serverTimestamp()
  };

  return updateDoc(doc(db, 'reports', reportId), updatePayload);
}

export async function deleteReport(reportId) {
  if (!shouldUseFirestore()) {
    clearLocalReportStorage();
    notifyReportListeners();
    return;
  }

  await deleteDoc(doc(db, 'reports', reportId));
}

export async function deleteReports(reportIds = []) {
  const uniqueReportIds = Array.from(new Set(reportIds)).filter(Boolean);

  if (uniqueReportIds.length === 0) {
    return;
  }

  await Promise.all(uniqueReportIds.map((reportId) => deleteReport(reportId)));
}

export function updateLocalReport() {
  clearLocalReportStorage();
  return null;
}

export function resetLocalReports() {
  clearLocalReportStorage();
  notifyReportListeners();
}

export function clearLocalReportsForFirebaseTest() {
  resetLocalReports();
}
