export function formatTimestamp(timestamp) {
  if (!timestamp?.toDate) return 'Pending';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(timestamp.toDate());
}

