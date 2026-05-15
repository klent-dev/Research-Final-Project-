import { ReportTable } from '../../components/reports/ReportTable.jsx';
import { useAdminReports } from '../../hooks/useAdminReports.js';

export default function ReportQueuePage() {
  const { reports, isLoading } = useAdminReports();

  return (
    <>
      <div className="toolbar">
        <h1>Report Management</h1>
      </div>
      {isLoading ? <p>Loading reports...</p> : <ReportTable reports={reports} />}
    </>
  );
}

