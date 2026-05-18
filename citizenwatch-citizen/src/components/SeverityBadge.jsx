import { normalizeUrgency } from '../utils/severity.js';

export default function SeverityBadge({ severity = 'medium' }) {
  const normalizedSeverity = normalizeUrgency(severity);

  return (
    <span className={`severity-badge severity-badge--${normalizedSeverity.toLowerCase()}`}>
      {normalizedSeverity}
    </span>
  );
}
