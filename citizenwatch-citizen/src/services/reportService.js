import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth } from '../firebase/auth.js';
import { db } from '../firebase/firestore.js';
import { REPORT_STATUS } from '../utils/constants.js';
import { generateTrackingId } from './localReportService.js';
import { deleteReportPhotoByUrl, uploadReportPhoto } from './storageService.js';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getReportsRef() {
  if (!db) {
    return null;
  }

  return collection(db, 'reports');
}

function getCreatedBy(payload = {}) {
  return auth?.currentUser?.uid || payload.createdBy || payload.reporterId || '';
}

function getReportDocumentIdCandidates(report) {
  if (!report || typeof report === 'string') {
    return [report].filter(Boolean);
  }

  return [
    report.firestoreReportId,
    report.firebaseReportId,
    report.id,
    report.reportId
  ].filter(Boolean);
}

function normalizeLocation(location = {}) {
  const lat = location.lat ?? location.latitude ?? null;
  const lng = location.lng ?? location.longitude ?? null;

  return {
    ...location,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    accuracy: location.accuracy ?? null,
    address: location.address || 'Location detected',
    subAddress: location.subAddress || '',
    source: location.source || null
  };
}

function hasValidLocation(location = {}) {
  const lat = Number(location.lat ?? location.latitude);
  const lng = Number(location.lng ?? location.longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function dataUrlToBlob(dataUrl) {
  if (!dataUrl || !String(dataUrl).startsWith('data:')) {
    return null;
  }

  const [metadata, base64Data] = dataUrl.split(',');
  const mimeMatch = metadata.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function sanitizeForFirestore(value) {
  if (value === undefined) {
    return null;
  }

  if (value === null || value instanceof Date || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForFirestore);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, sanitizeForFirestore(nestedValue)])
  );
}

function summarizeRawExif(rawExif = {}) {
  if (!rawExif || typeof rawExif !== 'object') {
    return { keyCount: 0, keys: [], values: {} };
  }

  const keys = Object.keys(rawExif);
  return {
    keyCount: keys.length,
    keys: keys.slice(0, 80),
    values: {}
  };
}

function compactExifForStorage(exif = {}) {
  const rawExifSummary = exif.rawExifSummary || summarizeRawExif(exif.rawExif);

  return {
    ...exif,
    rawExif: null,
    rawExifSummary
  };
}

async function resolvePhotoFile(payload, reportId) {
  if (payload.photoFile) {
    return payload.photoFile;
  }

  if (payload.selectedFile) {
    return payload.selectedFile;
  }

  const previewBlob = dataUrlToBlob(payload.photoPreview);
  if (!previewBlob) {
    return null;
  }

  return new File([previewBlob], `${reportId}.jpg`, {
    type: previewBlob.type || 'image/jpeg',
    lastModified: Date.now()
  });
}

function normalizeReportPayload(payload = {}, photoUrl = '') {
  const id = payload.id || createId();
  const trackingId = payload.trackingId || generateTrackingId();
  const issueType = payload.issueType || payload.category || 'Infrastructure Issue';
  const urgency = payload.urgency || payload.severity || 'Moderate';
  const createdBy = getCreatedBy(payload);
  const now = new Date().toISOString();
  const location = normalizeLocation(payload.location);
  const sourceExif = compactExifForStorage(payload.exif || {
    hasGps: Boolean(payload.hasExifGps),
    gps: payload.hasExifGps ? { lat: payload.exifLat ?? null, lng: payload.exifLng ?? null, altitude: null } : null,
    timestamp: payload.exifTimestamp || ''
  });
  const exifGps = sourceExif.gps || {};
  const exifLat = sourceExif.lat ?? sourceExif.latitude ?? exifGps.lat ?? exifGps.latitude ?? payload.exifLat ?? null;
  const exifLng = sourceExif.lng ?? sourceExif.longitude ?? exifGps.lng ?? exifGps.longitude ?? payload.exifLng ?? null;
  const exifTimestamp = sourceExif.timestamp || sourceExif.timestamps?.primary || payload.exifTimestamp || '';
  const exif = {
    ...sourceExif,
    hasGps: Boolean(sourceExif.hasGps || (exifLat !== null && exifLng !== null)),
    gps: sourceExif.gps || (exifLat !== null && exifLng !== null ? { lat: exifLat, lng: exifLng, altitude: null } : null),
    lat: exifLat,
    lng: exifLng,
    timestamp: exifTimestamp
  };

  return {
    id,
    trackingId,
    issueType,
    category: issueType,
    title: payload.title || `${issueType} Report`,
    urgency,
    severity: urgency,
    description: payload.description || 'No description provided.',
    status: payload.status || REPORT_STATUS.UNDER_REVIEW,
    location,
    address: location.address,
    latitude: location.lat,
    longitude: location.lng,
    exif,
    hasExifGps: Boolean(exif.hasGps),
    exifLat,
    exifLng,
    exifTimestamp,
    deviceLocation: payload.deviceLocation || null,
    locationValidation: payload.locationValidation || null,
    photoUrl,
    imageUrl: photoUrl,
    evidenceImage: photoUrl,
    photoPreview: '',
    createdBy,
    reporterId: createdBy,
    reporterName: payload.reporterName || auth?.currentUser?.displayName || auth?.currentUser?.email || 'Citizen Reporter',
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now
  };
}

function toDateMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortReportsByNewest(reports) {
  return [...reports].sort((first, second) => (
    toDateMillis(second.createdAt) - toDateMillis(first.createdAt)
  ));
}

export async function createInfrastructureReport(reportDraft = {}) {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    throw new Error('Firebase is not configured yet.');
  }

  const reportId = reportDraft.id || createId();
  const createdBy = getCreatedBy(reportDraft);
  const location = normalizeLocation(reportDraft.location);

  if (!createdBy) {
    throw new Error('Please sign in before submitting a report.');
  }

  if (!hasValidLocation(location)) {
    throw new Error('Please confirm a valid report location before submitting.');
  }

  const photoFile = await resolvePhotoFile(reportDraft, reportId);

  if (!photoFile) {
    throw new Error('A report photo is required before submission.');
  }

  let photoUrl = '';

  try {
    photoUrl = await uploadReportPhoto({
      file: photoFile,
      reportId,
      userId: createdBy
    });
  } catch (error) {
    console.error('Firebase Storage photo upload failed:', error);
    throw new Error('Unable to upload report photo. Please check your connection and try again.');
  }

  const report = normalizeReportPayload(
    {
      ...reportDraft,
      id: reportId,
      createdBy,
      location
    },
    photoUrl
  );

  try {
    await setDoc(doc(reportsRef, reportId), sanitizeForFirestore(report));
  } catch (error) {
    console.error('Firestore report creation failed:', error);
    throw new Error('Unable to submit report. Please check your connection and try again.');
  }

  return {
    reportId,
    trackingId: report.trackingId,
    report
  };
}

export async function getReportsByUser(userId = '') {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    return [];
  }

  if (!userId) {
    return [];
  }

  const reportsQuery = query(reportsRef, where('createdBy', '==', userId));

  const snapshot = await getDocs(reportsQuery);
  return sortReportsByNewest(snapshot.docs.map((reportDoc) => ({ id: reportDoc.id, ...reportDoc.data() })));
}

export const getCitizenReports = getReportsByUser;

export async function getReportById(reportId) {
  if (!db || !reportId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'reports', reportId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function subscribeToReports(callback) {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    callback([]);
    return () => {};
  }

  return onSnapshot(reportsRef, (snapshot) => {
    callback(sortReportsByNewest(snapshot.docs.map((reportDoc) => ({ id: reportDoc.id, ...reportDoc.data() }))));
  });
}

export function subscribeToReportsByUser(userId = '', callback, onError) {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    callback([]);
    return () => {};
  }

  if (!userId) {
    callback([]);
    return () => {};
  }

  const reportsQuery = query(reportsRef, where('createdBy', '==', userId));
  return onSnapshot(
    reportsQuery,
    (snapshot) => {
      callback(sortReportsByNewest(snapshot.docs.map((reportDoc) => ({ id: reportDoc.id, ...reportDoc.data() }))));
    },
    onError
  );
}

export function updateReportStatus(reportId, status) {
  if (!db || !reportId) {
    throw new Error('Firebase is not configured yet.');
  }

  return updateDoc(doc(db, 'reports', reportId), {
    status,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteInfrastructureReport(report) {
  const reportId = typeof report === 'string' ? report : report?.id || report?.reportId;

  if (!db || !reportId) {
    throw new Error('Firebase is not configured yet.');
  }

  const photoUrl = typeof report === 'string'
    ? ''
    : report?.photoUrl || report?.imageUrl || report?.evidenceImage || '';

  if (photoUrl) {
    try {
      await deleteReportPhotoByUrl(photoUrl);
    } catch (error) {
      console.warn('Report photo could not be deleted from Firebase Storage.', error);
    }
  }

  await deleteDoc(doc(db, 'reports', reportId));
}

export async function voidInfrastructureReport(report, reason = 'Deleted by citizen') {
  if (!db || !report) {
    throw new Error('Firebase is not configured yet.');
  }

  const reportsRef = getReportsRef();
  const candidateIds = getReportDocumentIdCandidates(report);
  let reportId = '';

  for (const candidateId of candidateIds) {
    const snapshot = await getDoc(doc(db, 'reports', candidateId));

    if (snapshot.exists()) {
      reportId = snapshot.id;
      break;
    }
  }

  if (!reportId && typeof report !== 'string' && report.trackingId && reportsRef) {
    const trackingQuery = query(reportsRef, where('trackingId', '==', report.trackingId), limit(1));
    const trackingSnapshot = await getDocs(trackingQuery);
    reportId = trackingSnapshot.docs[0]?.id || '';
  }

  if (!reportId) {
    throw new Error('Unable to find this report in Firebase.');
  }

  const now = new Date().toISOString();
  const userId = auth?.currentUser?.uid || '';

  await updateDoc(doc(db, 'reports', reportId), {
    status: REPORT_STATUS.VOIDED_BY_CITIZEN,
    deletedByCitizen: true,
    voidedByCitizen: true,
    voidReason: reason,
    voidedAt: now,
    voidedBy: userId,
    updatedAt: now
  });
}

export async function getMapReports() {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    return [];
  }

  const snapshot = await getDocs(reportsRef);

  return sortReportsByNewest(snapshot.docs.map((reportDoc) => ({
    id: reportDoc.id,
    ...reportDoc.data()
  })));
}
