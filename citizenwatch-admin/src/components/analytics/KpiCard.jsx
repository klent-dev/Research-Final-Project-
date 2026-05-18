export function KpiCard({ label, value }) {
  return (
    <article className="panel kpi-card">
      <small>{label}</small>
      <h2>{value ?? 0}</h2>
      <span aria-hidden="true" />
    </article>
  );
}

