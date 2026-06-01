import {
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { auth } from '../firebase/auth.js';
import { isFirebaseConfigured } from '../firebase/config.js';
import { db } from '../firebase/firestore.js';

const PUBLIC_VISIBLE_STATUSES = new Set([
  'published',
  'verified',
  'in_progress',
  'resolved'
]);

function getPublicReportsRef() {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  return collection(db, 'publicReports');
}

function getPublicReportRef(reportId = '') {
  if (!isFirebaseConfigured || !db || !reportId) {
    return null;
  }

  return doc(db, 'publicReports', reportId);
}

function toMillis(value) {
  if (value?.toDate) return value.toDate().getTime();
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isPublicReportVisible(report = {}) {
  const status = String(report.status || '').toLowerCase();
  return report.published !== false && report.hidden !== true && PUBLIC_VISIBLE_STATUSES.has(status);
}

function sortNewest(reports = []) {
  return [...reports].sort((first, second) => (
    toMillis(second.createdAt || second.publishedAt || second.updatedAt) -
    toMillis(first.createdAt || first.publishedAt || first.updatedAt)
  ));
}

export function normalizePublicReport(report = {}) {
  return {
    ...report,
    id: report.id || report.reportId,
    reportId: report.reportId || report.id,
    title: report.title || `${report.category || 'Infrastructure'} Report`,
    category: report.category || 'Infrastructure',
    shortDescription: report.shortDescription || '',
    addressPreview: report.addressPreview || report.barangay || report.city || 'Location unavailable',
    supportCount: Number(report.supportCount || 0)
  };
}

export async function getPublicReportById(reportId = '') {
  const publicReportRef = getPublicReportRef(reportId);

  if (!publicReportRef) {
    return null;
  }

  const snapshot = await getDoc(publicReportRef);
  return snapshot.exists() ? normalizePublicReport({ id: snapshot.id, ...snapshot.data() }) : null;
}

export function subscribeToPublicReport(reportId = '', callback, onError) {
  const publicReportRef = getPublicReportRef(reportId);

  if (!publicReportRef) {
    callback(null);
    return () => {};
  }

  return onSnapshot(
    publicReportRef,
    (snapshot) => {
      callback(snapshot.exists() ? normalizePublicReport({ id: snapshot.id, ...snapshot.data() }) : null);
    },
    onError
  );
}

export function subscribeToPublicReports(callback, onError, maxReports = 20) {
  const publicReportsRef = getPublicReportsRef();

  if (!publicReportsRef) {
    callback([]);
    return () => {};
  }

  const publicReportsQuery = query(publicReportsRef, orderBy('createdAt', 'desc'), limit(maxReports));

  return onSnapshot(
    publicReportsQuery,
    (snapshot) => {
      const reports = snapshot.docs
        .map((reportDoc) => normalizePublicReport({ id: reportDoc.id, ...reportDoc.data() }))
        .filter(isPublicReportVisible);

      callback(sortNewest(reports).slice(0, maxReports));
    },
    onError
  );
}

export function formatPublicReportDate(value) {
  const millis = toMillis(value);

  if (!millis) {
    return 'Date unavailable';
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - millis) / 1000));

  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

  return new Date(millis).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatPublicStatusLabel(status = '') {
  const normalized = String(status || '').toLowerCase().replaceAll('_', ' ');

  if (normalized.includes('resolve')) return 'Resolved';
  if (normalized.includes('progress')) return 'In Progress';
  if (normalized.includes('review')) return 'Under Review';
  if (normalized.includes('verified') || normalized.includes('publish')) return 'Verified';
  return 'Verified';
}

export function getPublicStatusColor(status = '') {
  const normalized = String(status || '').toLowerCase();

  if (normalized.includes('resolve') || normalized.includes('verified') || normalized.includes('publish')) {
    return 'verified';
  }

  if (normalized.includes('reject')) return 'rejected';
  return 'review';
}

export async function getPublicReportSupportState(reportId = '') {
  const userId = auth?.currentUser?.uid || '';

  if (!db || !reportId || !userId) {
    return false;
  }

  const supporterRef = doc(db, 'publicReports', reportId, 'supporters', userId);
  const supporterSnapshot = await getDoc(supporterRef);
  return supporterSnapshot.exists();
}

export async function supportPublicReport(reportId = '') {
  const userId = auth?.currentUser?.uid || '';

  if (!db || !reportId) {
    throw new Error('Public report is unavailable.');
  }

  if (!userId) {
    throw new Error('Please sign in to support this report.');
  }

  const publicReportRef = doc(db, 'publicReports', reportId);
  const supporterRef = doc(db, 'publicReports', reportId, 'supporters', userId);

  return runTransaction(db, async (transaction) => {
    const supporterSnapshot = await transaction.get(supporterRef);

    if (supporterSnapshot.exists()) {
      return { alreadySupported: true };
    }

    transaction.set(supporterRef, {
      uid: userId,
      supportedAt: serverTimestamp()
    });
    transaction.update(publicReportRef, {
      supportCount: increment(1),
      updatedAt: serverTimestamp()
    });

    return { alreadySupported: false };
  });
}
