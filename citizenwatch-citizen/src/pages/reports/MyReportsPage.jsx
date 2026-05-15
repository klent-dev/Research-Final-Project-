import { ReportCard } from '../../components/reports/ReportCard.jsx';
import { useReports } from '../../hooks/useReports.js';

export default function MyReportsPage() {
  const { reports, isLoading } = useReports();

  return (
    <main className="page">
      <h1>My Reports</h1>
      {isLoading ? <p>Loading reports...</p> : reports.map((report) => <ReportCard key={report.id} report={report} />)}
    </main>
  );
}

