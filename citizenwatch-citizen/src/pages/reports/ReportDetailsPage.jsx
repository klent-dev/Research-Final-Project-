import { useParams } from 'react-router-dom';

export default function ReportDetailsPage() {
  const { reportId } = useParams();

  return (
    <main className="page">
      <h1>Report Details</h1>
      <p>Report ID: {reportId}</p>
    </main>
  );
}

