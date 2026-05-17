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

  const docRef = await addDoc(reportsRef, {
    ...payload,
    status: REPORT_STATUS.SUBMITTED,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

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
