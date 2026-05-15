import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firestore.js';
import { REPORT_STATUS } from '../utils/constants.js';

const reportsRef = collection(db, 'reports');

export async function getReportAnalytics() {
  const [totalSnapshot, submittedSnapshot, resolvedSnapshot] = await Promise.all([
    getCountFromServer(reportsRef),
    getCountFromServer(query(reportsRef, where('status', '==', REPORT_STATUS.SUBMITTED))),
    getCountFromServer(query(reportsRef, where('status', '==', REPORT_STATUS.RESOLVED)))
  ]);

  return {
    totalReports: totalSnapshot.data().count,
    submittedReports: submittedSnapshot.data().count,
    resolvedReports: resolvedSnapshot.data().count
  };
}

export async function getCategoryBreakdown() {
  const snapshot = await getDocs(reportsRef);
  return snapshot.docs.reduce((summary, docSnapshot) => {
    const category = docSnapshot.data().category ?? 'Uncategorized';
    summary[category] = (summary[category] ?? 0) + 1;
    return summary;
  }, {});
}

