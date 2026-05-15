import { AdminReportMap } from '../../components/map/AdminReportMap.jsx';
import { useAdminReports } from '../../hooks/useAdminReports.js';

export default function ReportMapPage() {
  const { reports } = useAdminReports();
  return <AdminReportMap reports={reports} />;
}

