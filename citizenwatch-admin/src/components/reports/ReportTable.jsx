import { formatTimestamp } from '../../utils/dateFormat.js';
import { ReportStatusBadge } from './ReportStatusBadge.jsx';

export function ReportTable({ reports = [] }) {
  return (
    <section className="panel">
      <table width="100%">
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Category</th>
            <th align="left">Status</th>
            <th align="left">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.title}</td>
              <td>{report.category}</td>
              <td><ReportStatusBadge status={report.status} /></td>
              <td>{formatTimestamp(report.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

