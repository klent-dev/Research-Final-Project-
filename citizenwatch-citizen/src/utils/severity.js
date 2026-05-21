export const SEVERITY_LEVELS = ['Minor', 'Moderate', 'Critical'];

export function normalizeUrgency(urgency = 'Moderate') {
  const normalized = String(urgency || '').trim().toLowerCase();

  if (normalized === 'critical' || normalized === 'high') {
    return 'Critical';
  }

  if (normalized === 'minor' || normalized === 'low') {
    return 'Minor';
  }

  return 'Moderate';
}

export function getSeverityTone(urgency = 'Moderate') {
  return normalizeUrgency(urgency).toLowerCase();
}
