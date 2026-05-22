import { useCallback, useEffect, useState } from 'react';
import { isFirebaseConfigured } from '../firebase/config.js';
import { getReports, isReportVisibleForCitizen } from '../services/localReportService.js';
import { getCitizenReports, subscribeToReportsByUser } from '../services/reportService.js';
import { useAuth } from './useAuth.js';

function mergeFirebaseAndLocalReports(firebaseReports = []) {
  const visibleFirebaseReports = firebaseReports.filter(isReportVisibleForCitizen);
  const localReports = getReports().filter(
    (report) => !report.syncedToFirestore && isReportVisibleForCitizen(report)
  );
  const firebaseKeys = new Set(
    visibleFirebaseReports.flatMap((report) => [
      report.id,
      report.reportId,
      report.firestoreReportId,
      report.trackingId
    ].filter(Boolean))
  );

  const localOnlyReports = localReports.filter((report) => ![
    report.id,
    report.reportId,
    report.firestoreReportId,
    report.trackingId
  ].some((key) => firebaseKeys.has(key)));

  return [...visibleFirebaseReports, ...localOnlyReports].sort((first, second) => (
    new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  ));
}

export function useReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState(() => getReports());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setReports(getReports());
      setError('');
      return;
    }

    setIsLoading(true);

    try {
      const nextReports = await getCitizenReports(user?.uid || 'demo-user');
      setReports(mergeFirebaseAndLocalReports(nextReports));
      setError('');
    } catch (loadError) {
      console.warn('Unable to load citizen reports.', loadError);
      setReports(getReports());
      setError('Unable to load reports from Firebase.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refreshReports = useCallback(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      loadReports();

      function refreshLocalReports() {
        setReports(getReports());
      }

      window.addEventListener('storage', refreshLocalReports);
      window.addEventListener('citizenwatch:reports-updated', refreshLocalReports);

      return () => {
        window.removeEventListener('storage', refreshLocalReports);
        window.removeEventListener('citizenwatch:reports-updated', refreshLocalReports);
      };
    }

    setIsLoading(true);
    const unsubscribe = subscribeToReportsByUser(
      user?.uid || 'demo-user',
      (nextReports) => {
        setReports(mergeFirebaseAndLocalReports(nextReports));
        setError('');
        setIsLoading(false);
      },
      (subscribeError) => {
        console.warn('Unable to subscribe to citizen reports.', subscribeError);
        setReports(getReports());
        setError('Unable to load reports from Firebase.');
        setIsLoading(false);
      }
    );

    function refreshLocalReports() {
      setReports((currentReports) => mergeFirebaseAndLocalReports(currentReports));
    }

    window.addEventListener('storage', refreshLocalReports);
    window.addEventListener('citizenwatch:reports-updated', refreshLocalReports);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', refreshLocalReports);
      window.removeEventListener('citizenwatch:reports-updated', refreshLocalReports);
    };
  }, [loadReports, user]);

  return { reports, isLoading, error, refreshReports };
}
