import { useCallback, useEffect, useState } from 'react';
import { getCitizenReports } from '../services/reportService.js';
import { useAuth } from './useAuth.js';

export function useReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadReports = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const nextReports = await getCitizenReports(user.uid);
    setReports(nextReports);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return { reports, isLoading, refreshReports: loadReports };
}

