import { useCallback, useEffect, useState } from 'react';
import { getReportsForModeration } from '../services/adminReportService.js';

const DEFAULT_REPORT_FILTERS = Object.freeze({});

export function useAdminReports(filters = DEFAULT_REPORT_FILTERS) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    const nextReports = await getReportsForModeration(filters);
    setReports(nextReports);
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return { reports, isLoading, refreshReports: loadReports };
}
