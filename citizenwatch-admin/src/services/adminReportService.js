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
import { isFirebaseConfigured } from '../firebase/config.js';

function getReportsRef() {
  return db ? collection(db, 'reports') : null;
}

export async function getReportsForModeration({ status, maxItems = 50 } = {}) {
  const reportsRef = getReportsRef();

  if (!isFirebaseConfigured || !reportsRef) {
    return [];
  }

  const constraints = [orderBy('createdAt', 'desc'), limit(maxItems)];

  if (status) {
    constraints.unshift(where('status', '==', status));
  }

  const snapshot = await getDocs(query(reportsRef, ...constraints));
  return snapshot.docs.map((reportDoc) => ({ id: reportDoc.id, ...reportDoc.data() }));
}

export function updateReportStatus({ reportId, status, adminId, notes = '' }) {
  if (!isFirebaseConfigured || !db) {
    return Promise.resolve();
  }

  return updateDoc(doc(db, 'reports', reportId), {
    status,
    adminNotes: notes,
    reviewedBy: adminId,
    updatedAt: serverTimestamp()
  });
}

