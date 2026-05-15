export function KpiCard({ label, value }) {
  return (
    <article className="panel">
      <small>{label}</small>
      <h2>{value ?? 0}</h2>
    </article>
  );
}

