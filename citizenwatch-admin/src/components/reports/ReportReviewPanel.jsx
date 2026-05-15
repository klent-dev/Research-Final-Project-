import { REPORT_STATUS } from '../../utils/constants.js';

export function ReportReviewPanel({ report, onStatusChange }) {
  if (!report) return <section className="panel">Select a report for review.</section>;

  return (
    <section className="panel">
      <h2>{report.title}</h2>
      <p>{report.description}</p>
      <select defaultValue={report.status} onChange={(event) => onStatusChange(report.id, event.target.value)}>
        {Object.values(REPORT_STATUS).map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
    </section>
  );
}

