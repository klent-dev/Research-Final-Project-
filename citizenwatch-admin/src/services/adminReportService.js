import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase/firestore.js';

const reportsRef = collection(db, 'reports');

export async function getReportsForModeration({ status, maxItems = 50 } = {}) {
  const constraints = [orderBy('createdAt', 'desc'), limit(maxItems)];

  if (status) {
    constraints.unshift(where('status', '==', status));
  }

  const snapshot = await getDocs(query(reportsRef, ...constraints));
  return snapshot.docs.map((reportDoc) => ({ id: reportDoc.id, ...reportDoc.data() }));
}

export function updateReportStatus({ reportId, status, adminId, notes = '' }) {
  return updateDoc(doc(db, 'reports', reportId), {
    status,
    adminNotes: notes,
    reviewedBy: adminId,
    updatedAt: serverTimestamp()
  });
}

