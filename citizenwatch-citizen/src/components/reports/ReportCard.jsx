import { formatTimestamp } from '../../utils/dateFormat.js';

export function ReportCard({ report }) {
  return (
    <article className="panel">
      <h3>{report.title}</h3>
      <p>{report.category}</p>
      <p>Status: {report.status}</p>
      <small>{formatTimestamp(report.createdAt)}</small>
    </article>
  );
}

