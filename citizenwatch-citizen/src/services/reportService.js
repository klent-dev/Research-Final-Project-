import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase/firestore.js';
import { REPORT_STATUS } from '../utils/constants.js';

function normalizeReportPayload(payload = {}) {
  const category = payload.category || payload.issueType || 'Other';
  const severity = payload.severity || payload.urgency || 'Low';
  const location = {
    ...(payload.location || {}),
    address: payload.location?.address || payload.address || 'Location not selected',
    lat: payload.location?.lat ?? payload.location?.latitude ?? payload.latitude ?? null,
    lng: payload.location?.lng ?? payload.location?.longitude ?? payload.longitude ?? null
  };
  location.latitude = location.lat;
  location.longitude = location.lng;

  return {
    ...payload,
    category,
    issueType: payload.issueType || category,
    title: payload.title || `${category} Report`,
    description: payload.description || 'No description provided.',
    severity,
    urgency: payload.urgency || severity,
    status: REPORT_STATUS.SUBMITTED,
    location,
    address: location.address,
    latitude: location.lat,
    longitude: location.lng,
    imageUrl: payload.imageUrl || payload.photoUrl || '',
    evidenceImage: payload.evidenceImage || payload.photoPreview || '',
    photoPreview: payload.photoPreview || payload.evidenceImage || '',
    reporterId: payload.reporterId || payload.createdBy || 'anonymous-citizen',
    reporterName: payload.reporterName || payload.createdByName || '',
    createdBy: payload.createdBy || payload.reporterId || 'anonymous-citizen',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

function getReportsRef() {
  if (!db) {
    return null;
  }

  return collection(db, 'reports');
}

export async function createInfrastructureReport(payload) {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    throw new Error('Firebase is not configured yet.');
  }

  const docRef = await addDoc(reportsRef, normalizeReportPayload(payload));

  return docRef.id;
}

export async function getCitizenReports(userId) {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    return [];
  }

  const reportsQuery = query(
    reportsRef,
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function attachReportPhoto({ reportId, photoUrl }) {
  if (!db) {
    throw new Error('Firebase is not configured yet.');
  }

  return updateDoc(doc(db, 'reports', reportId), {
    photoUrl,
    imageUrl: photoUrl,
    updatedAt: serverTimestamp()
  });
}

export async function getMapReports() {
  const reportsRef = getReportsRef();

  if (!reportsRef) {
    return [];
  }

  const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(reportsQuery);

  return snapshot.docs.map((reportDoc) => ({
    id: reportDoc.id,
    ...reportDoc.data()
  }));
}
