import { formatTimestamp } from '../../utils/dateFormat.js';
import { ReportStatusBadge } from './ReportStatusBadge.jsx';

export function ReportTable({ reports = [] }) {
  return (
    <section className="panel report-table-panel">
      {reports.length > 0 ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <strong>{report.title}</strong>
                    <span>{report.description ?? 'No description provided'}</span>
                  </td>
                  <td>{report.category}</td>
                  <td><ReportStatusBadge status={report.status} /></td>
                  <td>{formatTimestamp(report.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">R</span>
          <h2>No reports in the queue</h2>
          <p>Citizen submissions will appear here as soon as they are received.</p>
        </div>
      )}
    </section>
  );
}

