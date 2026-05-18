export function ReportStatusBadge({ status }) {
  const normalized = String(status ?? 'submitted').toLowerCase();
  const label = normalized.replaceAll('_', ' ');

  return <span className={`status-badge status-badge--${normalized}`}>{label}</span>;
}

