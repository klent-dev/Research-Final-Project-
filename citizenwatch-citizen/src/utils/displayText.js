export function toDisplayText(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleDateString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toDisplayText(item)).filter(Boolean).join(', ') || fallback;
  }

  if (typeof value === 'object') {
    return (
      toDisplayText(value.fullName) ||
      toDisplayText(value.name) ||
      toDisplayText(value.title) ||
      toDisplayText(value.issueType) ||
      toDisplayText(value.category) ||
      toDisplayText(value.address) ||
      toDisplayText(value.label) ||
      toDisplayText(value.value) ||
      toDisplayText(value.email) ||
      fallback
    );
  }

  return fallback;
}
