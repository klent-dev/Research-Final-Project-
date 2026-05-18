export function StatusSummary({ analytics }) {
  const submittedReports = analytics?.submittedReports ?? 0;
  const resolvedReports = analytics?.resolvedReports ?? 0;
  const totalReports = Math.max(analytics?.totalReports ?? 0, 1);

  return (
    <section className="panel status-summary">
      <header>
        <h2>Status Summary</h2>
        <span>Live queue health</span>
      </header>
      <div className="status-summary-row">
        <p>Submitted</p>
        <strong>{submittedReports}</strong>
      </div>
      <div className="status-meter" aria-hidden="true">
        <span style={{ width: `${Math.min((submittedReports / totalReports) * 100, 100)}%` }} />
      </div>
      <div className="status-summary-row">
        <p>Resolved</p>
        <strong>{resolvedReports}</strong>
      </div>
      <div className="status-meter status-meter--resolved" aria-hidden="true">
        <span style={{ width: `${Math.min((resolvedReports / totalReports) * 100, 100)}%` }} />
      </div>
    </section>
  );
}

