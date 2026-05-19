import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
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

export function subscribeReportsForModeration({ status, maxItems = 50 } = {}, onReports, onError) {
  const reportsRef = getReportsRef();

  if (!isFirebaseConfigured || !reportsRef) {
    onReports([]);
    return () => {};
  }

  const constraints = [orderBy('createdAt', 'desc'), limit(maxItems)];

  if (status) {
    constraints.unshift(where('status', '==', status));
  }

  return onSnapshot(
    query(reportsRef, ...constraints),
    (snapshot) => {
      onReports(snapshot.docs.map((reportDoc) => ({ id: reportDoc.id, ...reportDoc.data() })));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export function updateReportStatus({ reportId, status, adminId, notes = '', remarks = '' }) {
  if (!isFirebaseConfigured || !db) {
    return Promise.resolve();
  }

  const adminNotes = remarks || notes;

  return updateDoc(doc(db, 'reports', reportId), {
    status,
    adminNotes,
    remarks: adminNotes,
    reviewedBy: adminId || null,
    updatedBy: adminId || null,
    updatedAt: serverTimestamp()
  });
}

