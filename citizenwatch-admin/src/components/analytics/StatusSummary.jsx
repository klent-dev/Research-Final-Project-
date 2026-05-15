export function StatusSummary({ analytics }) {
  return (
    <section className="panel">
      <h2>Status Summary</h2>
      <p>Submitted: {analytics?.submittedReports ?? 0}</p>
      <p>Resolved: {analytics?.resolvedReports ?? 0}</p>
    </section>
  );
}

