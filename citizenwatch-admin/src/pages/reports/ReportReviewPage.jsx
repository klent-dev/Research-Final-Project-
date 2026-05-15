import { useParams } from 'react-router-dom';
import { ReportReviewPanel } from '../../components/reports/ReportReviewPanel.jsx';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';
import { updateReportStatus } from '../../services/adminReportService.js';

export default function ReportReviewPage() {
  const { reportId } = useParams();
  const { admin } = useAdminAuth();

  async function handleStatusChange(nextReportId, status) {
    await updateReportStatus({
      reportId: nextReportId,
      status,
      adminId: admin.uid
    });
  }

  return (
    <>
      <h1>Review Report</h1>
      <ReportReviewPanel report={{ id: reportId, title: 'Selected report', status: 'under_review' }} onStatusChange={handleStatusChange} />
    </>
  );
}

