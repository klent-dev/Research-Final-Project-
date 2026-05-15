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

const reportsRef = collection(db, 'reports');

export async function createInfrastructureReport(payload) {
  const docRef = await addDoc(reportsRef, {
    ...payload,
    status: REPORT_STATUS.SUBMITTED,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

export async function getCitizenReports(userId) {
  const reportsQuery = query(
    reportsRef,
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function attachReportPhoto({ reportId, photoUrl }) {
  return updateDoc(doc(db, 'reports', reportId), {
    photoUrl,
    updatedAt: serverTimestamp()
  });
}
