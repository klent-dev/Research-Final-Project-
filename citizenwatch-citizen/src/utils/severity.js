export const SEVERITY_LEVELS = ['Low', 'Medium', 'Critical'];

export function normalizeUrgency(urgency = 'Medium') {
  const normalized = String(urgency || '').trim().toLowerCase();

  if (normalized === 'critical' || normalized === 'high') {
    return 'Critical';
  }

  if (normalized === 'low') {
    return 'Low';
  }

  return 'Medium';
}

export function getSeverityTone(urgency = 'Medium') {
  return normalizeUrgency(urgency).toLowerCase();
}
