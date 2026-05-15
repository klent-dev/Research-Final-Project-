import { useCallback, useEffect, useState } from 'react';
import { getReportAnalytics } from '../services/analyticsService.js';

export function useAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setAnalytics(await getReportAnalytics());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return { analytics, isLoading, refreshAnalytics: loadAnalytics };
}

