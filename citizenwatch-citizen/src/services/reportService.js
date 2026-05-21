import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
  return auth?.currentUser?.uid || payload.createdBy || payload.reporterId || 'demo-user';
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
  const urgency = payload.urgency || payload.severity || 'Medium';
  const createdBy = getCreatedBy(payload);
  const now = new Date().toISOString();
  const location = normalizeLocation(payload.location);
  const exif = payload.exif || {
    hasGps: Boolean(payload.hasExifGps),
    lat: payload.exifLat ?? null,
    lng: payload.exifLng ?? null,
    timestamp: payload.exifTimestamp || ''
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
    await setDoc(doc(reportsRef, reportId), report);
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

export async function getReportsByUser(userId = 'demo-user') {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    return [];
  }

  if (!userId || userId === 'demo-user') {
    return getMapReports();
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

export function subscribeToReportsByUser(userId = 'demo-user', callback, onError) {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    callback([]);
    return () => {};
  }

  if (!userId || userId === 'demo-user') {
    return onSnapshot(
      reportsRef,
      (snapshot) => {
        callback(sortReportsByNewest(snapshot.docs.map((reportDoc) => ({ id: reportDoc.id, ...reportDoc.data() }))));
      },
      onError
    );
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
