import { KpiCard } from '../../components/analytics/KpiCard.jsx';
import { StatusSummary } from '../../components/analytics/StatusSummary.jsx';
import { useAnalytics } from '../../hooks/useAnalytics.js';

export default function DashboardPage() {
  const { analytics, isLoading } = useAnalytics();

  return (
    <>
      <div className="toolbar">
        <h1>Dashboard</h1>
      </div>
      {isLoading ? <p>Loading analytics...</p> : (
        <>
          <section className="grid analytics">
            <KpiCard label="Total Reports" value={analytics?.totalReports} />
            <KpiCard label="Submitted" value={analytics?.submittedReports} />
            <KpiCard label="Resolved" value={analytics?.resolvedReports} />
          </section>
          <StatusSummary analytics={analytics} />
        </>
      )}
    </>
  );
}

