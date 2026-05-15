export default function SeverityBadge({ severity = 'medium' }) {
  return <span className={`severity-badge severity-badge--${severity.toLowerCase()}`}>{severity}</span>;
}

