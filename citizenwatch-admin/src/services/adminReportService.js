import { sampleCitizenReports } from '../data/sampleReports.js';
import {
  collection,
  doc as firestoreDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/firestore.js';
import { isFirebaseConfigured } from '../firebase/config.js';

const ADMIN_REPORTS_STORAGE_KEY = 'citizenwatch_admin_reports';
export const REJECTED_REPORT_REASON = 'This report is either fake, not traceable, or no problem was found after review.';
const listeners = new Set();
let cachedReports = null;

function getReportsRef() {
  return isFirebaseConfigured && db ? collection(db, 'reports') : null;
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readStoredReports() {
  if (!canUseStorage()) {
    return [...sampleCitizenReports];
  }

  try {
    const rawReports = window.localStorage.getItem(ADMIN_REPORTS_STORAGE_KEY);
    if (!rawReports) {
      writeStoredReports(sampleCitizenReports);
      return [...sampleCitizenReports];
    }

    const parsedReports = JSON.parse(rawReports);
    if (!Array.isArray(parsedReports)) {
      return [...sampleCitizenReports];
    }

    const storedIds = new Set(parsedReports.map((report) => report.id));
    const missingSamples = sampleCitizenReports.filter((report) => !storedIds.has(report.id));
    const mergedReports = [...parsedReports, ...missingSamples];

    if (missingSamples.length > 0) {
      writeStoredReports(mergedReports);
    }

    return mergedReports;
  } catch (error) {
    console.warn('Unable to read local admin reports.', error);
    return [...sampleCitizenReports];
  }
}

function writeStoredReports(reports) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(ADMIN_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.warn('Unable to save local admin reports.', error);
  }
}

function getRawReports() {
  if (!cachedReports) {
    cachedReports = readStoredReports();
  }

  return cachedReports;
}

function setRawReports(reports) {
  cachedReports = reports;
  writeStoredReports(reports);
  notifyReportListeners();
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

function notifyReportListeners() {
  listeners.forEach(({ filters, onReports }) => {
    onReports(applyFilters(getRawReports(), filters));
  });
}

function toMillis(value) {
  if (value?.toDate) return value.toDate().getTime();
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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
  const normalized = String(report.severity || report.urgency || 'low').toLowerCase();

  if (normalized.includes('critical')) return 'critical';
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium')) return 'medium';
  return 'low';
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
  const reportsRef = getReportsRef();

  if (reportsRef) {
    const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(reportsQuery);
    return applyFilters(
      snapshot.docs.map((reportDoc) => ({
        id: reportDoc.id,
        ...reportDoc.data()
      })),
      filters
    );
  }

  return applyFilters(getRawReports(), filters);
}

export function subscribeReportsForModeration(filters = {}, onReports) {
  const reportsRef = getReportsRef();

  if (reportsRef) {
    const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      reportsQuery,
      (snapshot) => {
        onReports(
          applyFilters(
            snapshot.docs.map((reportDoc) => ({
              id: reportDoc.id,
              ...reportDoc.data()
            })),
            filters
          )
        );
      },
      (error) => {
        console.warn('Unable to listen to Firestore reports. Falling back to local reports.', error);
        onReports(applyFilters(getRawReports(), filters));
      }
    );
  }

  const listener = { filters, onReports };
  listeners.add(listener);
  onReports(applyFilters(getRawReports(), filters));

  return () => {
    listeners.delete(listener);
  };
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
  const adminNotes = remarks || notes;
  const updatedAt = new Date().toISOString();

  const reportsRef = getReportsRef();
  if (reportsRef) {
    return updateDoc(firestoreDoc(db, 'reports', reportId), {
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
    });
  }

  const reports = getRawReports();
  const nextReports = reports.map((report) => {
    if (report.id !== reportId && report.reportId !== reportId && report.trackingId !== reportId) {
      return report;
    }

    return {
      ...report,
      ...(status !== undefined ? { status } : {}),
      ...(assignedTeam !== undefined ? { assignedTeam } : {}),
      ...(progress !== undefined ? { progress } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(subtasks !== undefined ? { subtasks } : {}),
      adminNotes,
      remarks: adminNotes,
      reviewedBy: adminId || report.reviewedBy || null,
      updatedBy: adminId || report.updatedBy || null,
      updatedAt
    };
  });

  setRawReports(nextReports);
  return Promise.resolve();
}

export function updateLocalReport(reportId, updates = {}) {
  const nextReports = getRawReports().map((report) =>
    report.id === reportId || report.reportId === reportId || report.trackingId === reportId
      ? { ...report, ...updates, updatedAt: new Date().toISOString() }
      : report
  );

  setRawReports(nextReports);
  return nextReports.map(normalizeAdminReport).find((report) => report.id === reportId || report.reportId === reportId);
}

export function resetLocalReports() {
  setRawReports([...sampleCitizenReports]);
}
