import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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

function getPublicReportsCollection() {
  return collection(db, 'publicReports');
}

function getAdminLogsCollection() {
  return collection(db, 'adminLogs');
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

// Converts different citizen/admin status words into the small set used by the dashboard.
export function normalizeReportStatus(status = '') {
  const normalized = String(status).toLowerCase().replaceAll('_', ' ');

  if (normalized.includes('void') || normalized.includes('cancel') || normalized.includes('deleted by citizen')) {
    return 'voided';
  }

  if (normalized.includes('complete') || normalized.includes('resolved')) {
    return 'completed';
  }

  if (normalized.includes('reject')) {
    return 'rejected';
  }

  if (normalized.includes('pending') || normalized.includes('submit') || normalized.includes('review')) {
    return 'pending';
  }

  if (normalized.includes('progress') || normalized.includes('verified')) {
    return 'in_progress';
  }

  return 'pending';
}

export function getDisplayStatus(status = '') {
  const normalized = normalizeReportStatus(status);

  if (normalized === 'in_progress') return 'In Progress';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'voided') return 'Voided by Citizen';
  return 'Pending';
}

export function normalizeReportSeverity(report = {}) {
  const normalized = String(report.severity || report.urgency || 'minor').toLowerCase();

  if (normalized.includes('critical')) return 'critical';
  if (normalized.includes('high')) return 'critical';
  if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate';
  return 'minor';
}

export function normalizeLocationValidationStatus(status = '') {
  const normalized = String(status || '')
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-');

  if (normalized.includes('verified')) return 'verified';
  if (normalized.includes('good')) return 'verified';
  if (normalized.includes('needs-review') || normalized.includes('review')) return 'needs-review';
  if (normalized.includes('suspicious') || normalized.includes('mismatch')) return 'suspicious';
  if (normalized.includes('photo') || normalized.includes('exif')) return 'needs-review';
  if (normalized.includes('device')) return 'device-gps';
  if (normalized.includes('manual')) return 'manual-location';
  if (normalized.includes('test')) return 'test-location';
  return 'unavailable';
}

export function getLocationValidationLabel(status = '') {
  const normalized = normalizeLocationValidationStatus(status);

  if (normalized === 'verified') return 'Verified';
  if (normalized === 'needs-review') return 'Needs Review';
  if (normalized === 'suspicious') return 'Location Mismatch';
  if (normalized === 'photo-gps-detected') return 'Needs Review';
  if (normalized === 'device-gps') return 'Device GPS';
  if (normalized === 'manual-location') return 'Manual Location';
  if (normalized === 'test-location') return 'Test Location';
  return 'No GPS Data';
}

function toCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

// Pulls GPS, EXIF, camera, and trust-score fields into one admin-friendly metadata object.
export function normalizeLocationValidation(report = {}) {
  const validation = report.locationValidation || {};
  const exif = report.exif || {};
  const photoGps = validation.photoGps || exif.gps || {};
  const deviceGps = validation.deviceGps || report.deviceLocation || {};
  const deviceLocation = report.deviceLocation || {};
  const camera = exif.camera || {};
  const image = exif.image || {};
  const status = normalizeLocationValidationStatus(validation.status || validation.label || validation.source);
  const distance = Number(validation.distanceMeters);
  const exifLat = toCoordinate(exif.lat ?? exif.latitude ?? photoGps.lat ?? photoGps.latitude ?? report.exifLat);
  const exifLng = toCoordinate(exif.lng ?? exif.longitude ?? photoGps.lng ?? photoGps.longitude ?? report.exifLng);
  const exifTimestamp = exif.timestamp || exif.timestamps?.primary || report.exifTimestamp || '';
  const deviceLat = toCoordinate(deviceGps.lat ?? deviceGps.latitude ?? deviceLocation.lat ?? deviceLocation.latitude);
  const deviceLng = toCoordinate(deviceGps.lng ?? deviceGps.longitude ?? deviceLocation.lng ?? deviceLocation.longitude);
  const deviceAccuracy = Number(validation.gpsAccuracy ?? deviceGps.accuracy ?? deviceLocation.accuracy);
  const photoGpsAccuracy = Number(photoGps.accuracy ?? exif.gpsAccuracy);
  const score = Number(validation.verificationScore);

  return {
    ...validation,
    status,
    label: status === 'needs-review' ? getLocationValidationLabel(status) : validation.label || getLocationValidationLabel(status),
    message: validation.message || 'Location validation has not been completed.',
    helper: validation.helper || 'EXIF/device GPS details will appear here when available.',
    distanceMeters: Number.isFinite(distance) ? Math.round(distance) : null,
    source: validation.source || 'none',
    exifLat,
    exifLng,
    exifTimestamp,
    hasExifGps: Boolean(report.hasExifGps || exif.hasGps || validation.hasExifGps || (exifLat !== null && exifLng !== null)),
    hasExif: Boolean(exif.hasExif),
    hasTimestamp: Boolean(exif.hasTimestamp || exifTimestamp),
    hasCameraInfo: Boolean(exif.hasCameraInfo || camera.make || camera.model || camera.software || camera.lensMake || camera.lensModel),
    cameraMake: camera.make || '',
    cameraModel: camera.model || '',
    cameraSoftware: camera.software || '',
    lensMake: camera.lensMake || '',
    lensModel: camera.lensModel || '',
    imageWidth: image.width ?? null,
    imageHeight: image.height ?? null,
    imageOrientation: image.orientation ?? null,
    photoGpsAltitude: photoGps.altitude ?? null,
    photoGpsAccuracy: Number.isFinite(photoGpsAccuracy) ? Math.round(photoGpsAccuracy) : null,
    deviceLat,
    deviceLng,
    deviceAccuracy: Number.isFinite(deviceAccuracy) ? Math.round(deviceAccuracy) : null,
    gpsAccuracy: Number.isFinite(deviceAccuracy) ? Math.round(deviceAccuracy) : null,
    verificationScore: Number.isFinite(score) ? Math.round(score) : null,
    verificationStatus: validation.verificationStatus || status,
    requiresReview: Boolean(validation.requiresReview)
  };
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
  if (status === 'voided') return 0;
  return 0;
}

export function getReportCoordinates(report = {}) {
  const lat = Number(report.latitude ?? report.location?.latitude ?? report.location?.lat);
  const lng = Number(report.longitude ?? report.location?.longitude ?? report.location?.lng);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// Normalizes raw Firestore reports so table rows, cards, and maps can read the same fields.
export function normalizeAdminReport(report = {}) {
  const category = normalizeReportCategory(report);
  const coordinates = getReportCoordinates(report);
  const locationValidation = normalizeLocationValidation(report);
  const effectiveStatus = report.deletedByCitizen || report.voidedByCitizen
    ? 'voided_by_citizen'
    : report.status;

  return {
    ...report,
    status: effectiveStatus,
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
    normalizedStatus: normalizeReportStatus(effectiveStatus),
    displayStatus: getDisplayStatus(effectiveStatus),
    normalizedSeverity: normalizeReportSeverity(report),
    locationValidation,
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

// Live admin queue listener; every Firestore change updates the moderation table immediately.
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

// Saves admin review decisions such as assigned team, progress, notes, and status.
export async function publishReportToLiveReports({
  reportId,
  adminId,
  adminEmail
}) {
  if (!shouldUseFirestore()) {
    clearLocalReportStorage();
    notifyReportListeners();
    return;
  }

  const report = await getReportSnapshotData(reportId);

  if (!report) {
    throw new Error('Report not found.');
  }

  const existingPublicData = await publicReportExists(reportId);
  const publicPayload = buildPublicReportPayload(report, existingPublicData || {});

  await setDoc(doc(getPublicReportsCollection(), reportId), publicPayload, { merge: true });
  await logAdminAction('public_report_published', {
    reportId,
    adminId,
    adminEmail,
    details: {
      status: publicPayload.status,
      category: publicPayload.category
    }
  });
}

export async function unpublishReportFromLiveReports({
  reportId,
  adminId,
  adminEmail,
  reason = 'Admin unpublished this report from Live Reports.'
}) {
  if (!shouldUseFirestore()) {
    clearLocalReportStorage();
    notifyReportListeners();
    return;
  }

  const existingPublicData = await publicReportExists(reportId);

  if (existingPublicData) {
    await setDoc(doc(getPublicReportsCollection(), reportId), {
      hidden: true,
      published: false,
      unpublishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  await logAdminAction('public_report_unpublished', {
    reportId,
    adminId,
    adminEmail,
    details: { reason }
  });
}

async function syncPublicReportAfterStatusChange({ reportId, status, adminId, adminEmail }) {
  if (!shouldUseFirestore() || status === undefined) return;

  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus === 'rejected') {
    await unpublishReportFromLiveReports({
      reportId,
      adminId,
      adminEmail,
      reason: 'Report was rejected by admin.'
    });
    return;
  }

  if (['verified', 'resolved', 'in_progress'].includes(normalizedStatus)) {
    await publishReportToLiveReports({ reportId, adminId, adminEmail });
    await logAdminAction('public_report_status_synced', {
      reportId,
      adminId,
      adminEmail,
      details: { status: normalizedStatus }
    });
    return;
  }

  const existingPublicData = await publicReportExists(reportId);

  if (existingPublicData) {
    await setDoc(doc(getPublicReportsCollection(), reportId), {
      status: normalizedStatus,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await logAdminAction('public_report_status_synced', {
      reportId,
      adminId,
      adminEmail,
      details: { status: normalizedStatus }
    });
  }
}

export async function updateReportStatus({
  reportId,
  status,
  adminId,
  adminEmail,
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

  await updateDoc(doc(db, 'reports', reportId), updatePayload);
  await syncPublicReportAfterStatusChange({ reportId, status, adminId, adminEmail });
}

function roundApproximateCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? Number(coordinate.toFixed(3)) : null;
}

function getSafeReportArea(report = {}) {
  return report.barangay ||
    report.location?.barangay ||
    report.district ||
    report.location?.district ||
    report.address ||
    report.location?.address ||
    'Area unavailable';
}

function getSafeDescription(report = {}) {
  const description = String(report.shortDescription || report.description || 'No description provided.').trim();
  return description.length > 220 ? `${description.slice(0, 217)}...` : description;
}

function getSafePhotoUrl(report = {}) {
  return report.photoUrl || report.imageUrl || report.evidenceImage || '';
}

function buildPublicReportPayload(report = {}, existingData = {}) {
  const normalizedReport = normalizeAdminReport(report);
  const coordinates = getReportCoordinates(report);
  const publicStatus = String(report.status || normalizedReport.status || 'verified').toLowerCase();

  return {
    reportId: report.id,
    trackingId: report.trackingId || report.reportId || report.id,
    category: normalizedReport.category,
    title: normalizedReport.title,
    shortDescription: getSafeDescription(report),
    barangay: report.barangay || report.location?.barangay || report.district || report.location?.district || '',
    city: report.city || report.location?.city || '',
    addressPreview: getSafeReportArea(report),
    approximateLatitude: roundApproximateCoordinate(coordinates?.lat),
    approximateLongitude: roundApproximateCoordinate(coordinates?.lng),
    status: publicStatus === 'rejected' ? 'rejected' : publicStatus,
    createdAt: report.createdAt || existingData.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: existingData.publishedAt || serverTimestamp(),
    photoUrl: getSafePhotoUrl(report),
    supportCount: Number(existingData.supportCount || 0),
    hidden: false,
    published: true
  };
}

async function logAdminAction(action, { reportId, adminId, adminEmail, details = {} } = {}) {
  if (!shouldUseFirestore()) return;

  await addDoc(getAdminLogsCollection(), {
    action,
    reportId: reportId || '',
    adminId: adminId || null,
    adminEmail: adminEmail || null,
    details,
    createdAt: serverTimestamp()
  });
}

async function getReportSnapshotData(reportId) {
  const reportSnapshot = await getDoc(doc(db, 'reports', reportId));
  return reportSnapshot.exists() ? { id: reportSnapshot.id, ...reportSnapshot.data() } : null;
}

async function publicReportExists(reportId) {
  const publicSnapshot = await getDoc(doc(db, 'publicReports', reportId));
  return publicSnapshot.exists() ? publicSnapshot.data() : null;
}

export function markReportOpened({
  reportId,
  adminId
}) {
  if (!shouldUseFirestore()) {
    clearLocalReportStorage();
    notifyReportListeners();
    return Promise.resolve();
  }

  return updateDoc(doc(db, 'reports', reportId), {
    adminSeen: true,
    adminSeenAt: serverTimestamp(),
    adminSeenBy: adminId || null
  });
}

export async function markReportNotVerified({
  reportId,
  adminId,
  adminEmail,
  reason = REJECTED_REPORT_REASON
}) {
  if (!shouldUseFirestore()) {
    clearLocalReportStorage();
    notifyReportListeners();
    return;
  }

  await updateDoc(doc(db, 'reports', reportId), {
    status: 'rejected',
    rejectedByAdmin: true,
    adminDeleted: true,
    rejectionReason: reason,
    adminNotes: reason,
    remarks: reason,
    reviewedBy: adminId || null,
    updatedBy: adminId || null,
    updatedAt: serverTimestamp()
  });

  await unpublishReportFromLiveReports({
    reportId,
    adminId,
    adminEmail,
    reason
  });
}

export async function markReportsNotVerified(reportIds = [], options = {}) {
  const uniqueReportIds = Array.from(new Set(reportIds)).filter(Boolean);

  if (uniqueReportIds.length === 0) {
    return;
  }

  await Promise.all(uniqueReportIds.map((reportId) => (
    markReportNotVerified({ reportId, ...options })
  )));
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
