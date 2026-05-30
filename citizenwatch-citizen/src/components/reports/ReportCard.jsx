import { formatTimestamp } from '../../utils/dateFormat.js';
import { toDisplayText } from '../../utils/displayText.js';

export function ReportCard({ report }) {
  return (
    <article className="panel">
      <h3>{toDisplayText(report.title, 'Infrastructure Report')}</h3>
      <p>{toDisplayText(report.category, 'Report')}</p>
      <p>Status: {toDisplayText(report.status, 'Under Review')}</p>
      <small>{formatTimestamp(report.createdAt)}</small>
    </article>
  );
}
