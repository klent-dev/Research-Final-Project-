import { KpiCard } from '../../components/analytics/KpiCard.jsx';
import { useAnalytics } from '../../hooks/useAnalytics.js';

export default function AnalyticsPage() {
  const { analytics } = useAnalytics();

  return (
    <>
      <h1>Analytics</h1>
      <section className="grid analytics">
        <KpiCard label="Total Reports" value={analytics?.totalReports} />
        <KpiCard label="Open Reports" value={analytics?.submittedReports} />
        <KpiCard label="Resolved Reports" value={analytics?.resolvedReports} />
      </section>
    </>
  );
}

